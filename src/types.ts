export interface NativeCurrency {
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  chainId: number;
  slug: string;
  name: string;
  nativeCurrency: NativeCurrency;
  source: "built-in" | "custom";
  rpcUrl?: string;
  provider?: string;
  aliases?: string[];
}

export interface ProviderConfig {
  slug: string;
  name: string;
  source: "built-in" | "custom";
  apiKeyEnv?: string;
  apiKey?: string;
  baseUrl: string;
  networkUrls: Record<string, string>;
}

export interface AppConfig {
  infuraApiKey?: string;
  alchemyApiKey?: string;
  defaultNetwork: string;
  defaultProvider?: string;
  providerOrder: string[];
  customProviders: ProviderConfig[];
  customNetworks: NetworkConfig[];
  warnings: string[];
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function redactUrl(url: string, apiKey?: string): string {
  if (!apiKey) {
    return url.replace(/\/v[23]\/[a-zA-Z0-9_-]+/g, "/v3/***");
  }
  return url.replace(apiKey, "***");
}

export function getUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
