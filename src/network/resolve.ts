import { AppConfig, NetworkConfig, normalizeSlug } from "../types.js";
import { getAllNetworks } from "../config.js";

export function resolveNetwork(
  input: string | number | undefined,
  config: AppConfig,
): NetworkConfig {
  const networks = getAllNetworks(config);
  const defaultInput = input ?? config.defaultNetwork;

  if (defaultInput === undefined || defaultInput === "") {
    throw new Error("No network specified and DEFAULT_NETWORK is not set");
  }

  const resolved = lookupNetwork(defaultInput, networks);
  if (resolved) {
    return resolved;
  }

  const available = networks
    .map((n) => `${n.slug} (${n.name}, chainId ${n.chainId})`)
    .join(", ");

  throw new Error(
    `Unknown network "${defaultInput}". Available networks: ${available}`,
  );
}

function lookupNetwork(
  input: string | number,
  networks: NetworkConfig[],
): NetworkConfig | undefined {
  if (typeof input === "number" || /^\d+$/.test(String(input))) {
    const chainId =
      typeof input === "number" ? input : parseInt(String(input), 10);
    const matches = networks.filter((n) => n.chainId === chainId);
    return matches.find((n) => n.source === "custom") ?? matches[0];
  }

  const normalized = normalizeSlug(String(input));
  const lowerName = String(input).trim().toLowerCase();

  for (const network of networks) {
    if (network.slug === normalized) {
      return network;
    }
  }

  for (const network of networks) {
    if (network.name.toLowerCase() === lowerName) {
      return network;
    }
  }

  for (const network of networks) {
    if (network.aliases?.includes(normalized)) {
      return network;
    }
  }

  return undefined;
}

export function listNetworks(config: AppConfig): NetworkConfig[] {
  return getAllNetworks(config);
}
