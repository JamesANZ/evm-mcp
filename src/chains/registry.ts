import { NetworkConfig } from "../types.js";

const DEFAULT_CURRENCY = { symbol: "ETH", decimals: 18 };

export const BUILTIN_CHAINS: NetworkConfig[] = [
  {
    chainId: 1,
    slug: "ethereum",
    name: "Ethereum Mainnet",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
    aliases: ["eth", "mainnet"],
  },
  {
    chainId: 11155111,
    slug: "sepolia",
    name: "Sepolia Testnet",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
  },
  {
    chainId: 137,
    slug: "polygon",
    name: "Polygon Mainnet",
    nativeCurrency: { symbol: "POL", decimals: 18 },
    source: "built-in",
    aliases: ["matic"],
  },
  {
    chainId: 80002,
    slug: "amoy",
    name: "Polygon Amoy Testnet",
    nativeCurrency: { symbol: "POL", decimals: 18 },
    source: "built-in",
    aliases: ["polygon-amoy", "mumbai"],
  },
  {
    chainId: 42161,
    slug: "arbitrum",
    name: "Arbitrum One",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
    aliases: ["arb", "arbitrum-one"],
  },
  {
    chainId: 421614,
    slug: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
  },
  {
    chainId: 10,
    slug: "optimism",
    name: "Optimism",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
    aliases: ["op"],
  },
  {
    chainId: 11155420,
    slug: "optimism-sepolia",
    name: "Optimism Sepolia",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
  },
  {
    chainId: 56,
    slug: "bsc",
    name: "BNB Smart Chain",
    nativeCurrency: { symbol: "BNB", decimals: 18 },
    source: "built-in",
    aliases: ["bnb", "binance"],
  },
  {
    chainId: 97,
    slug: "bsc-testnet",
    name: "BNB Smart Chain Testnet",
    nativeCurrency: { symbol: "BNB", decimals: 18 },
    source: "built-in",
  },
  {
    chainId: 43114,
    slug: "avalanche",
    name: "Avalanche C-Chain",
    nativeCurrency: { symbol: "AVAX", decimals: 18 },
    source: "built-in",
    aliases: ["avax"],
  },
  {
    chainId: 8453,
    slug: "base",
    name: "Base Mainnet",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
  },
  {
    chainId: 84532,
    slug: "base-sepolia",
    name: "Base Sepolia",
    nativeCurrency: DEFAULT_CURRENCY,
    source: "built-in",
  },
];

export function getBuiltinChains(): NetworkConfig[] {
  return BUILTIN_CHAINS.map((chain) => ({ ...chain }));
}
