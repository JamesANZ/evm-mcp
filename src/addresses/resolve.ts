import { ethers } from "ethers";
import {
  AppConfig,
  KnownAddressConfig,
  normalizeSlug,
  ResolvedAddress,
  WalletAddressConfig,
} from "../types.js";
import { resolveNetwork } from "../network/resolve.js";
import { getProviderForNetwork } from "../rpc/client.js";

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ENS_NAME = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

function matchesLookup(
  input: string,
  name: string,
  aliases: string[] | undefined,
): string | undefined {
  const normalized = normalizeSlug(input);
  if (normalizeSlug(name) === normalized) {
    return name;
  }
  if (aliases?.includes(normalized)) {
    return aliases.find((a) => normalizeSlug(a) === normalized) ?? name;
  }
  return undefined;
}

function findWalletMatch(
  input: string,
  wallets: WalletAddressConfig[],
  networkSlug: string,
): { wallet: WalletAddressConfig; matchedAlias: string } | undefined {
  const scoped = wallets.filter((w) => w.networkSlug === networkSlug);
  for (const wallet of scoped) {
    const matched = matchesLookup(input, wallet.name, wallet.aliases);
    if (matched) {
      return { wallet, matchedAlias: matched };
    }
  }

  const global = wallets.filter((w) => !w.networkSlug);
  for (const wallet of global) {
    const matched = matchesLookup(input, wallet.name, wallet.aliases);
    if (matched) {
      return { wallet, matchedAlias: matched };
    }
  }

  return undefined;
}

function findKnownMatch(
  input: string,
  known: KnownAddressConfig[],
  networkSlug: string,
): { entry: KnownAddressConfig; matchedAlias: string } | undefined {
  for (const entry of known) {
    if (entry.networkSlug !== networkSlug) {
      continue;
    }
    const matched = matchesLookup(input, entry.name, entry.aliases);
    if (matched) {
      return { entry, matchedAlias: matched };
    }
  }
  return undefined;
}

function listAvailableAliases(
  config: AppConfig,
  networkSlug: string,
): string[] {
  const aliases = new Set<string>();

  for (const wallet of config.walletAddresses) {
    if (!wallet.networkSlug || wallet.networkSlug === networkSlug) {
      aliases.add(wallet.name);
      wallet.aliases?.forEach((a) => aliases.add(a));
    }
  }

  for (const entry of config.knownAddresses) {
    if (entry.networkSlug === networkSlug) {
      aliases.add(entry.name);
      entry.aliases?.forEach((a) => aliases.add(a));
    }
  }

  return Array.from(aliases).sort();
}

export function resolveAddress(
  input: string,
  networkInput: string | number | undefined,
  config: AppConfig,
): ResolvedAddress {
  const trimmed = input.trim();
  const network = resolveNetwork(networkInput, config);

  if (HEX_ADDRESS.test(trimmed)) {
    return {
      address: ethers.getAddress(trimmed),
      input: trimmed,
    };
  }

  const walletMatch = findWalletMatch(
    trimmed,
    config.walletAddresses,
    network.slug,
  );
  if (walletMatch) {
    return {
      address: walletMatch.wallet.address,
      input: trimmed,
      kind: "wallet",
      matchedAlias: walletMatch.matchedAlias,
      name: walletMatch.wallet.name,
    };
  }

  const knownMatch = findKnownMatch(
    trimmed,
    config.knownAddresses,
    network.slug,
  );
  if (knownMatch) {
    return {
      address: knownMatch.entry.address,
      input: trimmed,
      kind: "known",
      type: knownMatch.entry.type,
      decimals: knownMatch.entry.decimals,
      matchedAlias: knownMatch.matchedAlias,
      name: knownMatch.entry.name,
    };
  }

  const available = listAvailableAliases(config, network.slug);
  const hint =
    available.length > 0
      ? ` Available aliases on ${network.slug}: ${available.join(", ")}.`
      : "";

  throw new Error(
    `Unknown address alias "${trimmed}" on network ${network.slug}.${hint}`,
  );
}

/**
 * Like resolveAddress, but also resolves ENS names (e.g. alice.eth) via the
 * target network's ENS registry when the input is neither a hex address nor a
 * configured alias. Used by the simulation tools.
 */
export async function resolveAddressAsync(
  input: string,
  networkInput: string | number | undefined,
  config: AppConfig,
): Promise<ResolvedAddress> {
  const trimmed = input.trim();

  try {
    return resolveAddress(trimmed, networkInput, config);
  } catch (error) {
    if (!ENS_NAME.test(trimmed)) {
      throw error;
    }

    const { provider, network } = getProviderForNetwork(config, networkInput);
    let resolved: string | null = null;
    try {
      resolved = await provider.resolveName(trimmed);
    } catch (ensError) {
      const message =
        ensError instanceof Error ? ensError.message : String(ensError);
      throw new Error(
        `Failed to resolve ENS name "${trimmed}" on ${network.slug}: ${message}`,
      );
    }

    if (!resolved) {
      throw new Error(
        `ENS name "${trimmed}" did not resolve to an address on ${network.slug}. ` +
          `Ensure the network has an ENS registry and the name is registered.`,
      );
    }

    return {
      address: ethers.getAddress(resolved),
      input: trimmed,
      kind: "known",
      matchedAlias: trimmed,
      name: trimmed,
    };
  }
}

export function listAddressRegistry(config: AppConfig) {
  return {
    walletAddresses: config.walletAddresses,
    knownAddresses: config.knownAddresses,
  };
}
