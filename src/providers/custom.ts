import { ProviderConfig, normalizeSlug } from "../types.js";
import { BUILTIN_PROVIDER_SLUGS } from "./builtin.js";

interface CustomProviderInput {
  slug: string;
  name?: string;
  apiKeyEnv?: string;
  baseUrl: string;
  networkUrls: Record<string, string>;
}

export function parseCustomProviders(
  raw: string | undefined,
  knownNetworkSlugs: Set<string>,
  warnings: string[],
): ProviderConfig[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `CUSTOM_PROVIDERS: invalid JSON — ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("CUSTOM_PROVIDERS must be a JSON array");
  }

  const providers: ProviderConfig[] = [];
  const slugs = new Set<string>();

  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`CUSTOM_PROVIDERS[${index}]: must be an object`);
    }

    const input = entry as CustomProviderInput;

    if (!input.slug || typeof input.slug !== "string") {
      throw new Error(`CUSTOM_PROVIDERS[${index}]: missing slug`);
    }

    const slug = normalizeSlug(input.slug);
    if (!slug) {
      throw new Error(`CUSTOM_PROVIDERS[${index}]: invalid slug`);
    }

    if (
      BUILTIN_PROVIDER_SLUGS.includes(
        slug as (typeof BUILTIN_PROVIDER_SLUGS)[number],
      )
    ) {
      throw new Error(
        `CUSTOM_PROVIDERS[${index}]: slug "${slug}" conflicts with built-in provider`,
      );
    }

    if (slugs.has(slug)) {
      throw new Error(`CUSTOM_PROVIDERS[${index}]: duplicate slug "${slug}"`);
    }
    slugs.add(slug);

    if (!input.baseUrl || typeof input.baseUrl !== "string") {
      throw new Error(`CUSTOM_PROVIDERS[${index}]: missing baseUrl`);
    }

    if (!input.networkUrls || typeof input.networkUrls !== "object") {
      throw new Error(`CUSTOM_PROVIDERS[${index}]: missing networkUrls`);
    }

    const networkUrls: Record<string, string> = {};
    for (const [networkSlug, url] of Object.entries(input.networkUrls)) {
      const normalized = normalizeSlug(networkSlug);
      if (!normalized) {
        throw new Error(
          `CUSTOM_PROVIDERS[${index}]: invalid network slug "${networkSlug}"`,
        );
      }
      if (typeof url !== "string" || !url) {
        throw new Error(
          `CUSTOM_PROVIDERS[${index}]: invalid URL for network "${networkSlug}"`,
        );
      }
      if (!knownNetworkSlugs.has(normalized)) {
        warnings.push(
          `CUSTOM_PROVIDERS[${index}]: ignoring orphan networkUrls key "${normalized}" (unknown network slug)`,
        );
        continue;
      }
      networkUrls[normalized] = url;
    }

    if (Object.keys(networkUrls).length === 0) {
      throw new Error(
        `CUSTOM_PROVIDERS[${index}]: no valid networkUrls entries after validation`,
      );
    }

    const apiKeyEnv = input.apiKeyEnv?.trim();
    const apiKey = apiKeyEnv ? process.env[apiKeyEnv]?.trim() : undefined;

    providers.push({
      slug,
      name: input.name?.trim() || slug,
      source: "custom",
      apiKeyEnv,
      apiKey,
      baseUrl: input.baseUrl,
      networkUrls,
    });
  });

  return providers;
}
