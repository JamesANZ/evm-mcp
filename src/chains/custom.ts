import { NetworkConfig, normalizeSlug } from "../types.js";

interface CustomNetworkInput {
  name: string;
  chainId: number;
  slug?: string;
  rpcUrl?: string;
  provider?: string;
  nativeCurrency?: { symbol: string; decimals: number };
  aliases?: string[];
}

export function parseCustomNetworks(raw: string | undefined): NetworkConfig[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `CUSTOM_NETWORKS: invalid JSON — ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("CUSTOM_NETWORKS must be a JSON array");
  }

  const networks: NetworkConfig[] = [];
  const slugs = new Set<string>();
  const names = new Set<string>();

  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`CUSTOM_NETWORKS[${index}]: must be an object`);
    }

    const input = entry as CustomNetworkInput;

    if (!input.name || typeof input.name !== "string") {
      throw new Error(`CUSTOM_NETWORKS[${index}]: missing name`);
    }

    if (input.chainId === undefined || typeof input.chainId !== "number") {
      throw new Error(`CUSTOM_NETWORKS[${index}]: missing chainId`);
    }

    const slug = normalizeSlug(input.slug ?? input.name);
    if (!slug) {
      throw new Error(
        `CUSTOM_NETWORKS[${index}]: invalid slug derived from name`,
      );
    }

    const nameKey = input.name.trim().toLowerCase();
    if (slugs.has(slug)) {
      throw new Error(`CUSTOM_NETWORKS[${index}]: duplicate slug "${slug}"`);
    }
    if (names.has(nameKey)) {
      throw new Error(
        `CUSTOM_NETWORKS[${index}]: duplicate name "${input.name}"`,
      );
    }

    slugs.add(slug);
    names.add(nameKey);

    networks.push({
      chainId: input.chainId,
      slug,
      name: input.name.trim(),
      nativeCurrency: input.nativeCurrency ?? {
        symbol: "ETH",
        decimals: 18,
      },
      source: "custom",
      rpcUrl: input.rpcUrl,
      provider: input.provider,
      aliases: input.aliases?.map((a) => normalizeSlug(a)).filter(Boolean),
    });
  });

  return networks;
}
