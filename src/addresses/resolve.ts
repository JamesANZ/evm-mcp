import { ethers } from "ethers";
import {
  AppConfig,
  KnownAddressConfig,
  normalizeSlug,
  ResolvedAddress,
  WalletAddressConfig,
} from "../types.js";
import { resolveNetwork } from "../network/resolve.js";

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

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

export function listAddressRegistry(config: AppConfig) {
  return {
    walletAddresses: config.walletAddresses,
    knownAddresses: config.knownAddresses,
  };
}
