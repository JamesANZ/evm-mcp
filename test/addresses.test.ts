import {
  parseKnownAddresses,
  parseWalletAddresses,
} from "../src/addresses/custom.js";
import { resolveAddress } from "../src/addresses/resolve.js";
import { AppConfig } from "../src/types.js";

const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_POLYGON = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const PERSONAL_WALLET = "0x42ea529282DDE0AA87B42d9E83316eb23FE62c3f";

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

const knownAddressesJson = JSON.stringify([
  {
    name: "USDC",
    address: USDC_ETH,
    network: "ethereum",
    type: "token",
    decimals: 6,
    aliases: ["usd-coin"],
  },
  {
    name: "USDC",
    address: USDC_POLYGON,
    network: "polygon",
    type: "token",
    decimals: 6,
  },
]);

const walletAddressesJson = JSON.stringify([
  {
    name: "my-wallet",
    address: PERSONAL_WALLET,
    aliases: ["personal", "my wallet"],
    description: "James personal EOA",
  },
  {
    name: "treasury",
    address: "0x0000000000000000000000000000000000000001",
    network: "ethereum",
    description: "Scoped to mainnet",
  },
]);

describe("KNOWN_ADDRESSES parsing", () => {
  it("parses valid known addresses", () => {
    const addresses = parseKnownAddresses(knownAddressesJson, []);
    expect(addresses).toHaveLength(2);
    expect(addresses[0].networkSlug).toBe("ethereum");
    expect(addresses[0].type).toBe("token");
    expect(addresses[0].decimals).toBe(6);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseKnownAddresses("{bad json", [])).toThrow(/invalid JSON/i);
  });

  it("throws on duplicate alias within network", () => {
    expect(() =>
      parseKnownAddresses(
        JSON.stringify([
          {
            name: "USDC",
            address: USDC_ETH,
            network: "ethereum",
            aliases: ["stablecoin"],
          },
          {
            name: "USDT",
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            network: "ethereum",
            aliases: ["stablecoin"],
          },
        ]),
        [],
      ),
    ).toThrow(/duplicate alias/i);
  });

  it("throws on invalid address", () => {
    expect(() =>
      parseKnownAddresses(
        JSON.stringify([
          { name: "Bad", address: "not-an-address", network: "ethereum" },
        ]),
        [],
      ),
    ).toThrow(/invalid address/i);
  });
});

describe("WALLET_ADDRESSES parsing", () => {
  it("parses valid wallet addresses", () => {
    const wallets = parseWalletAddresses(walletAddressesJson, []);
    expect(wallets).toHaveLength(2);
    expect(wallets[0].address).toBe(PERSONAL_WALLET);
    expect(wallets[1].networkSlug).toBe("ethereum");
  });

  it("throws on duplicate global alias", () => {
    expect(() =>
      parseWalletAddresses(
        JSON.stringify([
          { name: "wallet-a", address: PERSONAL_WALLET },
          { name: "wallet-b", address: USDC_ETH, aliases: ["wallet-a"] },
        ]),
        [],
      ),
    ).toThrow(/duplicate alias/i);
  });
});

describe("address resolution", () => {
  const config = makeConfig({
    knownAddresses: parseKnownAddresses(knownAddressesJson, []),
    walletAddresses: parseWalletAddresses(walletAddressesJson, []),
  });

  it("checksum-normalizes hex addresses", () => {
    const resolved = resolveAddress(
      "0x42ea529282dde0aa87b42d9e83316eb23fe62c3f",
      "ethereum",
      config,
    );
    expect(resolved.address).toBe(PERSONAL_WALLET);
    expect(resolved.kind).toBeUndefined();
  });

  it("resolves wallet alias", () => {
    const resolved = resolveAddress("personal", "ethereum", config);
    expect(resolved.address).toBe(PERSONAL_WALLET);
    expect(resolved.kind).toBe("wallet");
    expect(resolved.matchedAlias).toBe("personal");
  });

  it("resolves known token on ethereum", () => {
    const resolved = resolveAddress("USDC", "ethereum", config);
    expect(resolved.address).toBe(USDC_ETH);
    expect(resolved.kind).toBe("known");
    expect(resolved.type).toBe("token");
    expect(resolved.decimals).toBe(6);
  });

  it("resolves known token alias", () => {
    const resolved = resolveAddress("usd-coin", "ethereum", config);
    expect(resolved.address).toBe(USDC_ETH);
  });

  it("isolates known addresses by network", () => {
    const eth = resolveAddress("USDC", "ethereum", config);
    const polygon = resolveAddress("USDC", "polygon", config);
    expect(eth.address).toBe(USDC_ETH);
    expect(polygon.address).toBe(USDC_POLYGON);
  });

  it("prefers network-scoped wallet over global when both match", () => {
    const scopedConfig = makeConfig({
      walletAddresses: parseWalletAddresses(
        JSON.stringify([
          {
            name: "treasury",
            address: PERSONAL_WALLET,
            aliases: ["treasury"],
          },
          {
            name: "treasury",
            address: "0x0000000000000000000000000000000000000001",
            network: "ethereum",
          },
        ]),
        [],
      ),
    });

    const resolved = resolveAddress("treasury", "ethereum", scopedConfig);
    expect(resolved.address).toBe("0x0000000000000000000000000000000000000001");
  });

  it("throws for unknown alias with helpful message", () => {
    expect(() => resolveAddress("FAKECOIN", "ethereum", config)).toThrow(
      /Unknown address alias/i,
    );
    expect(() => resolveAddress("FAKECOIN", "ethereum", config)).toThrow(
      /USDC/i,
    );
  });

  it("throws when known token missing on network", () => {
    expect(() => resolveAddress("USDC", "polygon-amoy", config)).toThrow(
      /Unknown address alias/i,
    );
  });
});
