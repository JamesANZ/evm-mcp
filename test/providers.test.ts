import {
  buildRpcUrl,
  selectProvider,
  substituteApiKey,
} from "../src/providers/registry.js";
import { getInfuraPreset, getAlchemyPreset } from "../src/providers/builtin.js";
import { AppConfig } from "../src/types.js";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    defaultNetwork: "ethereum",
    providerOrder: ["infura", "alchemy"],
    customProviders: [],
    customNetworks: [],
    knownAddresses: [],
    walletAddresses: [],
    warnings: [],
    infuraApiKey: "infura-key",
    ...overrides,
  };
}

describe("provider URL building", () => {
  it("builds Infura URLs for standard chains", () => {
    const infura = getInfuraPreset("test-key");
    expect(buildRpcUrl(infura, "ethereum")).toBe(
      "https://mainnet.infura.io/v3/test-key",
    );
    expect(buildRpcUrl(infura, "polygon")).toBe(
      "https://polygon-mainnet.infura.io/v3/test-key",
    );
  });

  it("builds Alchemy URLs for standard chains", () => {
    const alchemy = getAlchemyPreset("alchemy-key");
    expect(buildRpcUrl(alchemy, "ethereum")).toBe(
      "https://eth-mainnet.g.alchemy.com/v2/alchemy-key",
    );
  });

  it("substitutes api keys in custom absolute network URLs", () => {
    const provider = {
      slug: "quicknode",
      name: "QuickNode",
      source: "custom" as const,
      apiKey: "qn-key",
      baseUrl: "https://fallback.example/{apiKey}",
      networkUrls: {
        ethereum: "https://eth.example/{apiKey}/",
      },
    };

    expect(buildRpcUrl(provider, "ethereum")).toBe(
      "https://eth.example/qn-key/",
    );
  });

  it("appends relative network paths to baseUrl", () => {
    const provider = {
      slug: "acme",
      name: "Acme",
      source: "custom" as const,
      apiKey: "acme-key",
      baseUrl: "https://rpc.acme.io/v1/{apiKey}",
      networkUrls: {
        polygon: "/polygon",
      },
    };

    expect(buildRpcUrl(provider, "polygon")).toBe(
      "https://rpc.acme.io/v1/acme-key/polygon",
    );
  });

  it("substitutes apiKey placeholder", () => {
    expect(substituteApiKey("https://x/{apiKey}/y", "abc")).toBe(
      "https://x/abc/y",
    );
  });
});

describe("provider selection", () => {
  it("uses DEFAULT_PROVIDER when configured and capable", () => {
    const config = makeConfig({
      defaultProvider: "alchemy",
      alchemyApiKey: "alchemy-key",
    });

    const selected = selectProvider("ethereum", config);
    expect(selected?.slug).toBe("alchemy");
  });

  it("falls back through RPC_PROVIDER_ORDER", () => {
    const config = makeConfig({
      providerOrder: ["alchemy", "infura"],
      alchemyApiKey: "alchemy-key",
    });

    const selected = selectProvider("ethereum", config);
    expect(selected?.slug).toBe("alchemy");
  });

  it("skips providers missing networkUrls entry", () => {
    const config = makeConfig({
      alchemyApiKey: undefined,
      customProviders: [
        {
          slug: "custom",
          name: "Custom",
          source: "custom",
          apiKey: "custom-key",
          baseUrl: "https://custom.example/{apiKey}",
          networkUrls: { polygon: "https://polygon.custom/{apiKey}/" },
        },
      ],
      providerOrder: ["custom", "infura"],
    });

    const selected = selectProvider("ethereum", config);
    expect(selected?.slug).toBe("infura");
  });
});
