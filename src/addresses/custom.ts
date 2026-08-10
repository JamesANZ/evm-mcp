import { ethers } from "ethers";
import {
  KnownAddressConfig,
  NetworkConfig,
  normalizeSlug,
  WalletAddressConfig,
} from "../types.js";
import { resolveNetwork } from "../network/resolve.js";
import { AppConfig } from "../types.js";

interface KnownAddressInput {
  name: string;
  address: string;
  network: string;
  type?: "token" | "contract";
  decimals?: number;
  aliases?: string[];
}

interface WalletAddressInput {
  name: string;
  address: string;
  network?: string;
  aliases?: string[];
  description?: string;
}

function validateAddress(
  address: string,
  envVar: string,
  index: number,
): string {
  try {
    return ethers.getAddress(address.trim());
  } catch {
    throw new Error(`${envVar}[${index}]: invalid address "${address}"`);
  }
}

function resolveNetworkSlug(
  networkInput: string,
  networks: NetworkConfig[],
  envVar: string,
  index: number,
): string {
  try {
    const config = {
      defaultNetwork: "ethereum",
      providerOrder: [],
      customProviders: [],
      customNetworks: networks.filter((n) => n.source === "custom"),
      knownAddresses: [],
      walletAddresses: [],
      warnings: [],
      readOnlyMode: false,
    } as AppConfig;
    return resolveNetwork(networkInput, config).slug;
  } catch {
    throw new Error(`${envVar}[${index}]: unknown network "${networkInput}"`);
  }
}

function normalizeAliases(aliases: string[] | undefined): string[] | undefined {
  const normalized = aliases?.map((a) => normalizeSlug(a)).filter(Boolean);
  return normalized && normalized.length > 0 ? normalized : undefined;
}

export function parseKnownAddresses(
  raw: string | undefined,
  networks: NetworkConfig[],
): KnownAddressConfig[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `KNOWN_ADDRESSES: invalid JSON — ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("KNOWN_ADDRESSES must be a JSON array");
  }

  const addresses: KnownAddressConfig[] = [];
  const keys = new Set<string>();

  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`KNOWN_ADDRESSES[${index}]: must be an object`);
    }

    const input = entry as KnownAddressInput;

    if (!input.name || typeof input.name !== "string") {
      throw new Error(`KNOWN_ADDRESSES[${index}]: missing name`);
    }

    if (!input.address || typeof input.address !== "string") {
      throw new Error(`KNOWN_ADDRESSES[${index}]: missing address`);
    }

    if (!input.network || typeof input.network !== "string") {
      throw new Error(`KNOWN_ADDRESSES[${index}]: missing network`);
    }

    const nameSlug = normalizeSlug(input.name);
    if (!nameSlug) {
      throw new Error(`KNOWN_ADDRESSES[${index}]: invalid name`);
    }

    const networkSlug = resolveNetworkSlug(
      input.network,
      networks,
      "KNOWN_ADDRESSES",
      index,
    );

    const type = input.type ?? "contract";
    if (type !== "token" && type !== "contract") {
      throw new Error(
        `KNOWN_ADDRESSES[${index}]: type must be "token" or "contract"`,
      );
    }

    if (
      input.decimals !== undefined &&
      (typeof input.decimals !== "number" || input.decimals < 0)
    ) {
      throw new Error(`KNOWN_ADDRESSES[${index}]: invalid decimals`);
    }

    const address = validateAddress(input.address, "KNOWN_ADDRESSES", index);
    const aliases = normalizeAliases(input.aliases);

    const lookupKeys = [...new Set([nameSlug, ...(aliases ?? [])])];
    for (const key of lookupKeys) {
      const compositeKey = `${networkSlug}:${key}`;
      if (keys.has(compositeKey)) {
        throw new Error(
          `KNOWN_ADDRESSES[${index}]: duplicate alias "${key}" on network "${networkSlug}"`,
        );
      }
      keys.add(compositeKey);
    }

    addresses.push({
      name: input.name.trim(),
      address,
      network: input.network.trim(),
      networkSlug,
      type,
      decimals: input.decimals,
      aliases,
      source: "custom",
    });
  });

  return addresses;
}

export function parseWalletAddresses(
  raw: string | undefined,
  networks: NetworkConfig[],
): WalletAddressConfig[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `WALLET_ADDRESSES: invalid JSON — ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("WALLET_ADDRESSES must be a JSON array");
  }

  const wallets: WalletAddressConfig[] = [];
  const scopedKeys = new Set<string>();
  const globalKeys = new Set<string>();

  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`WALLET_ADDRESSES[${index}]: must be an object`);
    }

    const input = entry as WalletAddressInput;

    if (!input.name || typeof input.name !== "string") {
      throw new Error(`WALLET_ADDRESSES[${index}]: missing name`);
    }

    if (!input.address || typeof input.address !== "string") {
      throw new Error(`WALLET_ADDRESSES[${index}]: missing address`);
    }

    const nameSlug = normalizeSlug(input.name);
    if (!nameSlug) {
      throw new Error(`WALLET_ADDRESSES[${index}]: invalid name`);
    }

    let networkSlug: string | undefined;
    if (input.network !== undefined) {
      if (typeof input.network !== "string") {
        throw new Error(`WALLET_ADDRESSES[${index}]: invalid network`);
      }
      networkSlug = resolveNetworkSlug(
        input.network,
        networks,
        "WALLET_ADDRESSES",
        index,
      );
    }

    const address = validateAddress(input.address, "WALLET_ADDRESSES", index);
    const aliases = normalizeAliases(input.aliases);

    const lookupKeys = [...new Set([nameSlug, ...(aliases ?? [])])];
    const keySet = networkSlug ? scopedKeys : globalKeys;
    const scopeLabel = networkSlug ?? "global";

    for (const key of lookupKeys) {
      const compositeKey = `${scopeLabel}:${key}`;
      if (keySet.has(compositeKey)) {
        throw new Error(
          `WALLET_ADDRESSES[${index}]: duplicate alias "${key}" in ${scopeLabel} scope`,
        );
      }
      keySet.add(compositeKey);
    }

    wallets.push({
      name: input.name.trim(),
      address,
      networkSlug,
      aliases,
      description: input.description?.trim(),
      source: "custom",
    });
  });

  return wallets;
}
