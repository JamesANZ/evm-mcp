import { ProviderConfig } from "../types.js";

export const BUILTIN_PROVIDER_SLUGS = ["infura", "alchemy"] as const;

export function getInfuraPreset(apiKey: string): ProviderConfig {
  return {
    slug: "infura",
    name: "Infura",
    source: "built-in",
    apiKeyEnv: "INFURA_API_KEY",
    apiKey,
    baseUrl: "https://mainnet.infura.io/v3/{apiKey}",
    networkUrls: {
      ethereum: "https://mainnet.infura.io/v3/{apiKey}",
      sepolia: "https://sepolia.infura.io/v3/{apiKey}",
      polygon: "https://polygon-mainnet.infura.io/v3/{apiKey}",
      amoy: "https://polygon-amoy.infura.io/v3/{apiKey}",
      arbitrum: "https://arbitrum-mainnet.infura.io/v3/{apiKey}",
      "arbitrum-sepolia": "https://arbitrum-sepolia.infura.io/v3/{apiKey}",
      optimism: "https://optimism-mainnet.infura.io/v3/{apiKey}",
      "optimism-sepolia": "https://optimism-sepolia.infura.io/v3/{apiKey}",
      bsc: "https://bsc-mainnet.infura.io/v3/{apiKey}",
      "bsc-testnet": "https://bsc-testnet.infura.io/v3/{apiKey}",
      avalanche: "https://avalanche-mainnet.infura.io/v3/{apiKey}",
      base: "https://base-mainnet.infura.io/v3/{apiKey}",
      "base-sepolia": "https://base-sepolia.infura.io/v3/{apiKey}",
    },
  };
}

export function getAlchemyPreset(apiKey: string): ProviderConfig {
  return {
    slug: "alchemy",
    name: "Alchemy",
    source: "built-in",
    apiKeyEnv: "ALCHEMY_API_KEY",
    apiKey,
    baseUrl: "https://eth-mainnet.g.alchemy.com/v2/{apiKey}",
    networkUrls: {
      ethereum: "https://eth-mainnet.g.alchemy.com/v2/{apiKey}",
      sepolia: "https://eth-sepolia.g.alchemy.com/v2/{apiKey}",
      polygon: "https://polygon-mainnet.g.alchemy.com/v2/{apiKey}",
      amoy: "https://polygon-amoy.g.alchemy.com/v2/{apiKey}",
      arbitrum: "https://arb-mainnet.g.alchemy.com/v2/{apiKey}",
      "arbitrum-sepolia": "https://arb-sepolia.g.alchemy.com/v2/{apiKey}",
      optimism: "https://opt-mainnet.g.alchemy.com/v2/{apiKey}",
      "optimism-sepolia": "https://opt-sepolia.g.alchemy.com/v2/{apiKey}",
      bsc: "https://bnb-mainnet.g.alchemy.com/v2/{apiKey}",
      "bsc-testnet": "https://bnb-testnet.g.alchemy.com/v2/{apiKey}",
      avalanche: "https://avax-mainnet.g.alchemy.com/v2/{apiKey}",
      base: "https://base-mainnet.g.alchemy.com/v2/{apiKey}",
      "base-sepolia": "https://base-sepolia.g.alchemy.com/v2/{apiKey}",
    },
  };
}

export function getBuiltinProviders(
  infuraApiKey?: string,
  alchemyApiKey?: string,
): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  if (infuraApiKey) {
    providers.push(getInfuraPreset(infuraApiKey));
  }
  if (alchemyApiKey) {
    providers.push(getAlchemyPreset(alchemyApiKey));
  }
  return providers;
}
