import { AppConfig, NetworkConfig, ProviderConfig } from "../types.js";
import { getAllProviders } from "../config.js";

export function substituteApiKey(template: string, apiKey: string): string {
  return template.replace(/\{apiKey\}/g, apiKey);
}

export function buildRpcUrl(
  provider: ProviderConfig,
  networkSlug: string,
): string {
  const networkUrl = provider.networkUrls[networkSlug];
  if (!networkUrl) {
    throw new Error(
      `Provider "${provider.slug}" has no networkUrls entry for "${networkSlug}"`,
    );
  }

  const apiKey = provider.apiKey ?? "";

  if (networkUrl.includes("{apiKey}") && !apiKey) {
    throw new Error(
      `Provider "${provider.slug}" requires API key${provider.apiKeyEnv ? ` (${provider.apiKeyEnv})` : ""} for network "${networkSlug}"`,
    );
  }

  if (networkUrl.startsWith("http://") || networkUrl.startsWith("https://")) {
    return substituteApiKey(networkUrl, apiKey);
  }

  if (networkUrl.startsWith("/")) {
    const base = substituteApiKey(provider.baseUrl, apiKey).replace(/\/$/, "");
    return `${base}${networkUrl}`;
  }

  throw new Error(
    `Provider "${provider.slug}" networkUrls["${networkSlug}"] must be absolute URL or relative path`,
  );
}

export function isProviderConfigured(provider: ProviderConfig): boolean {
  const needsKey =
    provider.baseUrl.includes("{apiKey}") ||
    Object.values(provider.networkUrls).some((url) => url.includes("{apiKey}"));

  if (!needsKey) {
    return true;
  }

  return Boolean(provider.apiKey);
}

export function selectProvider(
  networkSlug: string,
  config: AppConfig,
  preferredProvider?: string,
): ProviderConfig | undefined {
  const providers = getAllProviders(config);
  const providerMap = new Map(providers.map((p) => [p.slug, p]));

  const tryProvider = (slug: string): ProviderConfig | undefined => {
    const provider = providerMap.get(slug);
    if (!provider) {
      return undefined;
    }
    if (!provider.networkUrls[networkSlug]) {
      return undefined;
    }
    if (!isProviderConfigured(provider)) {
      return undefined;
    }
    return provider;
  };

  if (preferredProvider) {
    const preferred = tryProvider(preferredProvider.toLowerCase());
    if (preferred) {
      return preferred;
    }
  }

  if (config.defaultProvider) {
    const selected = tryProvider(config.defaultProvider.toLowerCase());
    if (selected) {
      return selected;
    }
  }

  for (const slug of config.providerOrder) {
    const selected = tryProvider(slug);
    if (selected) {
      return selected;
    }
  }

  for (const provider of providers) {
    const selected = tryProvider(provider.slug);
    if (selected) {
      return selected;
    }
  }

  return undefined;
}

export function resolveRpcUrl(
  network: NetworkConfig,
  config: AppConfig,
): { url: string; providerSlug?: string } {
  if (network.rpcUrl) {
    return { url: network.rpcUrl };
  }

  const preferredProvider = network.provider?.toLowerCase();
  const provider = selectProvider(network.slug, config, preferredProvider);

  if (!provider) {
    const providers = getAllProviders(config);
    const capable = providers
      .filter((p) => p.networkUrls[network.slug] && isProviderConfigured(p))
      .map((p) => p.slug);

    if (capable.length > 0) {
      throw new Error(
        `No provider could serve "${network.slug}". Available providers for this network: ${capable.join(", ")}`,
      );
    }

    throw new Error(
      `No RPC route configured for network "${network.slug}" (${network.name}). Add a provider networkUrls entry or set rpcUrl in CUSTOM_NETWORKS.`,
    );
  }

  return {
    url: buildRpcUrl(provider, network.slug),
    providerSlug: provider.slug,
  };
}

export function getCapableProviders(
  networkSlug: string,
  config: AppConfig,
): ProviderConfig[] {
  return getAllProviders(config).filter(
    (p) => p.networkUrls[networkSlug] && isProviderConfigured(p),
  );
}
