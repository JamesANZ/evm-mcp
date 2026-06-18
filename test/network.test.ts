import { parseCustomNetworks } from "../src/chains/custom.js";
import { parseCustomProviders } from "../src/providers/custom.js";
import { resolveNetwork } from "../src/network/resolve.js";
import { AppConfig } from "../src/types.js";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    defaultNetwork: "ethereum",
    providerOrder: ["infura"],
    customProviders: [],
    customNetworks: [],
    knownAddresses: [],
    walletAddresses: [],
    warnings: [],
    infuraApiKey: "infura-key",
    ...overrides,
  };
}

describe("CUSTOM_NETWORKS parsing", () => {
  it("parses valid custom networks", () => {
    const networks = parseCustomNetworks(
      JSON.stringify([
        {
          name: "HyperEVM",
          chainId: 999,
          rpcUrl: "https://rpc.hyperliquid.xyz/evm",
          aliases: ["hype"],
        },
      ]),
    );

    expect(networks).toHaveLength(1);
    expect(networks[0].slug).toBe("hyperevm");
    expect(networks[0].chainId).toBe(999);
    expect(networks[0].source).toBe("custom");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseCustomNetworks("{bad json")).toThrow(/invalid JSON/i);
  });

  it("throws on duplicate slugs", () => {
    expect(() =>
      parseCustomNetworks(
        JSON.stringify([
          { name: "Chain A", chainId: 1 },
          { name: "Chain A", chainId: 2 },
        ]),
      ),
    ).toThrow(/duplicate slug/i);
  });
});

describe("CUSTOM_PROVIDERS parsing", () => {
  it("parses valid custom providers", () => {
    process.env.TEST_API_KEY = "secret";
    const warnings: string[] = [];
    const providers = parseCustomProviders(
      JSON.stringify([
        {
          slug: "quicknode",
          apiKeyEnv: "TEST_API_KEY",
          baseUrl: "https://rpc.example/{apiKey}",
          networkUrls: {
            ethereum: "https://eth.example/{apiKey}/",
          },
        },
      ]),
      new Set(["ethereum"]),
      warnings,
    );

    expect(providers).toHaveLength(1);
    expect(providers[0].slug).toBe("quicknode");
    expect(providers[0].apiKey).toBe("secret");
    delete process.env.TEST_API_KEY;
  });

  it("rejects built-in slug collision", () => {
    expect(() =>
      parseCustomProviders(
        JSON.stringify([
          {
            slug: "infura",
            baseUrl: "https://x/{apiKey}",
            networkUrls: { ethereum: "/eth" },
          },
        ]),
        new Set(["ethereum"]),
        [],
      ),
    ).toThrow(/conflicts with built-in provider/i);
  });

  it("warns on orphan networkUrls keys", () => {
    const warnings: string[] = [];
    parseCustomProviders(
      JSON.stringify([
        {
          slug: "orphan-provider",
          apiKeyEnv: "TEST_ORPHAN_KEY",
          baseUrl: "https://x/{apiKey}",
          networkUrls: {
            ethereum: "/eth",
            unknownchain: "/x",
          },
        },
      ]),
      new Set(["ethereum"]),
      warnings,
    );

    expect(warnings.some((w) => w.includes("orphan"))).toBe(true);
  });
});

describe("network resolution", () => {
  const config = makeConfig({
    customNetworks: parseCustomNetworks(
      JSON.stringify([
        {
          name: "HyperEVM",
          slug: "hyperevm",
          chainId: 999,
          rpcUrl: "https://rpc.hyperliquid.xyz/evm",
          aliases: ["hype"],
        },
      ]),
    ),
  });

  it("resolves built-in slug", () => {
    expect(resolveNetwork("polygon", config).chainId).toBe(137);
  });

  it("resolves chain ID", () => {
    expect(resolveNetwork(999, config).slug).toBe("hyperevm");
  });

  it("resolves custom name and alias", () => {
    expect(resolveNetwork("HyperEVM", config).chainId).toBe(999);
    expect(resolveNetwork("hype", config).chainId).toBe(999);
  });

  it("throws for unknown network", () => {
    expect(() => resolveNetwork("not-a-network", config)).toThrow(
      /Unknown network/i,
    );
  });
});

import { loadConfig } from "../src/config.js";

describe("startup validation", () => {
  it("loads config when Infura key is present", () => {
    const config = loadConfig({
      INFURA_API_KEY: "test-key",
      DEFAULT_NETWORK: "ethereum",
      DEFAULT_PROVIDER: "infura",
    });

    expect(config.infuraApiKey).toBe("test-key");
    expect(config.defaultNetwork).toBe("ethereum");
  });

  it("loads config with custom network rpcUrl only", () => {
    const config = loadConfig({
      CUSTOM_NETWORKS: JSON.stringify([
        {
          name: "HyperEVM",
          chainId: 999,
          rpcUrl: "https://rpc.hyperliquid.xyz/evm",
        },
      ]),
    });

    expect(config.customNetworks).toHaveLength(1);
    expect(config.customNetworks[0].rpcUrl).toContain("hyperliquid");
  });
});
