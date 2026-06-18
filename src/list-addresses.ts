import { AppConfig } from "./types.js";
import { listAddressRegistry } from "./addresses/resolve.js";

export function buildAddressRegistryReport(config: AppConfig) {
  const { walletAddresses, knownAddresses } = listAddressRegistry(config);

  const wallets = walletAddresses.map((wallet) => ({
    name: wallet.name,
    address: wallet.address,
    network: wallet.networkSlug ?? "all networks",
    aliases: [...new Set(wallet.aliases ?? [])],
    description: wallet.description ?? null,
  }));

  const knownByNetwork = new Map<string, typeof knownAddresses>();
  for (const entry of knownAddresses) {
    const list = knownByNetwork.get(entry.networkSlug) ?? [];
    list.push(entry);
    knownByNetwork.set(entry.networkSlug, list);
  }

  const known = Array.from(knownByNetwork.entries()).map(
    ([networkSlug, entries]) => ({
      network: networkSlug,
      addresses: entries.map((entry) => ({
        name: entry.name,
        address: entry.address,
        type: entry.type,
        decimals: entry.decimals ?? null,
        aliases: entry.aliases ?? [],
      })),
    }),
  );

  return {
    wallet_count: wallets.length,
    known_count: knownAddresses.length,
    wallets,
    known_by_network: known,
  };
}
