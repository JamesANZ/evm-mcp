import {
  AppConfig,
  NetworkConfig,
  ProviderConfig,
  getUrlHost,
  redactUrl,
} from "./types.js";
import { getAllProviders } from "./config.js";
import {
  getCapableProviders,
  isProviderConfigured,
  resolveRpcUrl,
} from "./providers/registry.js";
import { listNetworks } from "./network/resolve.js";

function getActiveDefaultProvider(config: AppConfig): string | undefined {
  if (config.defaultProvider) {
    const provider = getAllProviders(config).find(
      (p) => p.slug === config.defaultProvider?.toLowerCase(),
    );
    if (provider && isProviderConfigured(provider)) {
      return provider.slug;
    }
  }

  for (const slug of config.providerOrder) {
    const provider = getAllProviders(config).find((p) => p.slug === slug);
    if (provider && isProviderConfigured(provider)) {
      return provider.slug;
    }
  }

  return getAllProviders(config).find((p) => isProviderConfigured(p))?.slug;
}

function describeNetworkRouting(network: NetworkConfig, config: AppConfig) {
  if (network.rpcUrl) {
    return {
      routing: "direct",
      endpoint_host: getUrlHost(network.rpcUrl),
    };
  }

  const capable = getCapableProviders(network.slug, config);
  const defaultProvider = getActiveDefaultProvider(config);
  const selected =
    capable.find((p) => p.slug === network.provider) ??
    capable.find((p) => p.slug === defaultProvider) ??
    capable[0];

  if (!selected) {
    return {
      routing: "unavailable",
      capable_providers: [],
    };
  }

  try {
    const { url } = resolveRpcUrl(
      { ...network, provider: selected.slug },
      config,
    );
    return {
      routing: "provider",
      provider: selected.slug,
      endpoint_host: getUrlHost(redactUrl(url, selected.apiKey)),
      capable_providers: capable.map((p) => p.slug),
    };
  } catch {
    return {
      routing: "unavailable",
      capable_providers: capable.map((p) => p.slug),
    };
  }
}

export function buildSupportedNetworksReport(config: AppConfig) {
  const networks = listNetworks(config).map((network) => ({
    slug: network.slug,
    name: network.name,
    chain_id: network.chainId,
    source: network.source,
    native_currency: network.nativeCurrency,
    aliases: network.aliases ?? [],
    ...describeNetworkRouting(network, config),
  }));

  const providers = getAllProviders(config).map((provider: ProviderConfig) => ({
    slug: provider.slug,
    name: provider.name,
    source: provider.source,
    api_key_env: provider.apiKeyEnv ?? null,
    api_key_configured: isProviderConfigured(provider),
    network_slugs: Object.keys(provider.networkUrls),
  }));

  return {
    default_network: config.defaultNetwork,
    default_provider: getActiveDefaultProvider(config) ?? null,
    configured_provider_order: config.providerOrder,
    providers,
    networks,
    warnings: config.warnings,
  };
}
