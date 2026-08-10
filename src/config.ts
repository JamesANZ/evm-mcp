import { getBuiltinChains } from "./chains/registry.js";
import { parseCustomNetworks } from "./chains/custom.js";
import {
  parseKnownAddresses,
  parseWalletAddresses,
} from "./addresses/custom.js";
import { getBuiltinProviders } from "./providers/builtin.js";
import { parseCustomProviders } from "./providers/custom.js";
import { AppConfig, NetworkConfig } from "./types.js";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const warnings: string[] = [];

  const infuraApiKey = env.INFURA_API_KEY?.trim();
  const alchemyApiKey = env.ALCHEMY_API_KEY?.trim();
  const defaultNetwork = env.DEFAULT_NETWORK?.trim() || "ethereum";
  const defaultProvider = env.DEFAULT_PROVIDER?.trim();
  const providerOrder = (env.RPC_PROVIDER_ORDER?.trim() || "infura,alchemy")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const customNetworks = parseCustomNetworks(env.CUSTOM_NETWORKS);

  const allNetworksForParsing = getAllNetworksFromParts(customNetworks);

  const knownAddresses = parseKnownAddresses(
    env.KNOWN_ADDRESSES,
    allNetworksForParsing,
  );
  const walletAddresses = parseWalletAddresses(
    env.WALLET_ADDRESSES,
    allNetworksForParsing,
  );

  const knownNetworkSlugs = new Set<string>();
  for (const chain of getBuiltinChains()) {
    knownNetworkSlugs.add(chain.slug);
    chain.aliases?.forEach((a) => knownNetworkSlugs.add(a));
  }
  for (const network of customNetworks) {
    knownNetworkSlugs.add(network.slug);
    network.aliases?.forEach((a) => knownNetworkSlugs.add(a));
  }

  const customProviders = parseCustomProviders(
    env.CUSTOM_PROVIDERS,
    knownNetworkSlugs,
    warnings,
  );

  const builtinProviders = getBuiltinProviders(infuraApiKey, alchemyApiKey);

  const hasDirectRpcNetwork = customNetworks.some((n) => n.rpcUrl);
  const hasConfiguredProvider =
    builtinProviders.length > 0 ||
    customProviders.some(
      (p) => !p.apiKeyEnv || (p.apiKey && p.apiKey.length > 0),
    ) ||
    customProviders.some((p) => !p.apiKeyEnv);

  if (!hasConfiguredProvider && !hasDirectRpcNetwork) {
    console.error(
      "Error: at least one provider API key or custom network with rpcUrl is required",
    );
    console.error("Examples:");
    console.error("  INFURA_API_KEY=your-key");
    console.error("  DEFAULT_PROVIDER=infura");
    console.error(
      '  CUSTOM_NETWORKS=[{"name":"MyChain","chainId":999,"rpcUrl":"https://..."}]',
    );
    process.exit(1);
  }

  for (const warning of warnings) {
    console.error(`Warning: ${warning}`);
  }

  return {
    infuraApiKey,
    alchemyApiKey,
    defaultNetwork,
    defaultProvider,
    providerOrder,
    customProviders,
    customNetworks,
    knownAddresses,
    walletAddresses,
    warnings,
    readOnlyMode: env.EVM_MCP_READ_ONLY?.trim().toLowerCase() === "true",
  };
}

function getAllNetworksFromParts(
  customNetworks: NetworkConfig[],
): NetworkConfig[] {
  const byChainId = new Map<number, NetworkConfig>();
  for (const chain of getBuiltinChains()) {
    byChainId.set(chain.chainId, { ...chain });
  }
  for (const network of customNetworks) {
    byChainId.set(network.chainId, { ...network });
  }
  return Array.from(byChainId.values());
}

export function getAllNetworks(config: AppConfig): NetworkConfig[] {
  const byChainId = new Map<number, NetworkConfig>();

  for (const chain of getBuiltinChains()) {
    byChainId.set(chain.chainId, { ...chain });
  }

  for (const network of config.customNetworks) {
    byChainId.set(network.chainId, { ...network });
  }

  return Array.from(byChainId.values());
}

export function getAllProviders(config: AppConfig) {
  const builtin = getBuiltinProviders(
    config.infuraApiKey,
    config.alchemyApiKey,
  );
  return [...builtin, ...config.customProviders];
}
