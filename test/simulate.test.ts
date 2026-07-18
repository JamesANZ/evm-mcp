import { ethers } from "ethers";
import { encodeFunctionData } from "../src/abi/encode.js";
import {
  ERC20_INTERFACE,
  ERC20_TRANSFER_TOPIC,
} from "../src/abi/erc20.js";
import {
  decodeRevert,
  decodeErc20Transfers,
  decodeNativeBalanceChanges,
} from "../src/simulate/decode.js";
import { buildFundingOverride } from "../src/simulate/overrides.js";
import { buildSimulationReport } from "../src/simulate/report.js";
import { SimulationResult } from "../src/simulate/engine.js";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ALICE = "0x1111111111111111111111111111111111111111";
const BOB = "0x2222222222222222222222222222222222222222";

describe("encodeFunctionData", () => {
  it("encodes an ERC20 transfer matching ethers", () => {
    const encoded = encodeFunctionData("transfer(address,uint256)", [
      BOB,
      "1000000",
    ]);
    const expected = ERC20_INTERFACE.encodeFunctionData("transfer", [
      BOB,
      1000000n,
    ]);
    expect(encoded.data).toBe(expected);
    expect(encoded.selector).toBe("0xa9059cbb");
    expect(encoded.functionName).toBe("transfer");
  });

  it("accepts the 'function' prefix", () => {
    const encoded = encodeFunctionData(
      "function approve(address spender, uint256 amount)",
      [BOB, "1"],
    );
    expect(encoded.functionName).toBe("approve");
    expect(encoded.selector).toBe("0x095ea7b3");
  });

  it("throws on argument count mismatch", () => {
    expect(() =>
      encodeFunctionData("transfer(address,uint256)", [BOB]),
    ).toThrow(/expects 2 argument/);
  });

  it("throws on an invalid signature", () => {
    expect(() => encodeFunctionData("not a signature", [])).toThrow(
      /Invalid function signature|No function found/,
    );
  });
});

describe("decodeRevert", () => {
  it("decodes Error(string)", () => {
    const data = ethers.concat([
      "0x08c379a0",
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        ["ERC20: transfer amount exceeds balance"],
      ),
    ]);
    expect(decodeRevert(data)).toBe(
      "execution reverted: ERC20: transfer amount exceeds balance",
    );
  });

  it("decodes Panic(uint256) overflow", () => {
    const data = ethers.concat([
      "0x4e487b71",
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [0x11]),
    ]);
    expect(decodeRevert(data)).toContain("arithmetic overflow or underflow");
  });

  it("decodes a custom error via extra ABI", () => {
    const iface = new ethers.Interface([
      "error InsufficientBalance(uint256 available)",
    ]);
    const data = iface.encodeErrorResult("InsufficientBalance", [5n]);
    expect(decodeRevert(data, ["InsufficientBalance(uint256 available)"])).toBe(
      "execution reverted: InsufficientBalance(5)",
    );
  });

  it("handles empty revert data", () => {
    expect(decodeRevert("0x")).toBe("execution reverted (no reason provided)");
  });
});

describe("decodeErc20Transfers", () => {
  it("decodes a Transfer log and formats with decimals", () => {
    const encoded = ERC20_INTERFACE.encodeEventLog("Transfer", [
      ALICE,
      BOB,
      10_000000n,
    ]);
    const transfers = decodeErc20Transfers(
      [{ address: USDC, topics: encoded.topics, data: encoded.data }],
      { [USDC.toLowerCase()]: 6 },
    );
    expect(transfers).toHaveLength(1);
    expect(transfers[0].from).toBe(ethers.getAddress(ALICE));
    expect(transfers[0].to).toBe(ethers.getAddress(BOB));
    expect(transfers[0].amount).toBe("10.0");
    expect(transfers[0].token).toBe(ethers.getAddress(USDC));
  });

  it("ignores non-Transfer logs", () => {
    const transfers = decodeErc20Transfers([
      { address: USDC, topics: ["0xdeadbeef"], data: "0x" },
    ]);
    expect(transfers).toHaveLength(0);
  });

  it("uses the correct Transfer topic", () => {
    expect(ERC20_TRANSFER_TOPIC).toBe(
      ethers.id("Transfer(address,address,uint256)"),
    );
  });
});

describe("decodeNativeBalanceChanges", () => {
  it("computes deltas between pre and post state", () => {
    const pre = {
      [ALICE]: { balance: "0x" + ethers.parseEther("100").toString(16) },
      [BOB]: { balance: "0x0" },
    };
    const post = {
      [ALICE]: { balance: "0x" + ethers.parseEther("90").toString(16) },
      [BOB]: { balance: "0x" + ethers.parseEther("10").toString(16) },
    };
    const changes = decodeNativeBalanceChanges(pre, post);
    expect(changes[ethers.getAddress(ALICE)].deltaWei).toBe(
      (-ethers.parseEther("10")).toString(),
    );
    expect(changes[ethers.getAddress(BOB)].deltaWei).toBe(
      ethers.parseEther("10").toString(),
    );
  });
});

describe("buildFundingOverride", () => {
  it("funds the sender when enabled", () => {
    const override = buildFundingOverride(ALICE, true);
    expect(override).toBeDefined();
    const entry = override![ethers.getAddress(ALICE)];
    expect(BigInt(entry.balance!)).toBeGreaterThan(0n);
  });

  it("returns undefined when funding disabled", () => {
    expect(buildFundingOverride(ALICE, false)).toBeUndefined();
  });

  it("returns undefined without a from address", () => {
    expect(buildFundingOverride(undefined, true)).toBeUndefined();
  });
});

describe("buildSimulationReport", () => {
  const baseResult: SimulationResult = {
    success: true,
    network: { slug: "ethereum", name: "Ethereum Mainnet", chainId: 1 },
    from: ethers.getAddress(ALICE),
    to: ethers.getAddress(USDC),
    valueWei: "0",
    funded: true,
    traceAvailable: true,
    erc20Transfers: [
      {
        token: ethers.getAddress(USDC),
        from: ethers.getAddress(ALICE),
        to: ethers.getAddress(BOB),
        rawValue: "10000000",
        amount: "10.0",
      },
    ],
    nativeChanges: {},
    gasEstimate: { hex: "0xc350", decimal: 50000 },
  };

  it("renders a success report with token movement and disclaimer", () => {
    const report = buildSimulationReport(baseResult, {
      tokenSymbols: { [USDC.toLowerCase()]: "USDC" },
      labels: { [ALICE.toLowerCase()]: "fun.eth", [BOB.toLowerCase()]: "alice.eth" },
    });
    expect(report).toContain("WILL SUCCEED");
    expect(report).toContain("10.0 USDC");
    expect(report).toContain("fun.eth");
    expect(report).toContain("alice.eth");
    expect(report).toContain("no transaction was broadcast");
  });

  it("renders a failure report with the revert reason", () => {
    const report = buildSimulationReport({
      ...baseResult,
      success: false,
      revertReason: "execution reverted: ERC20: transfer amount exceeds balance",
      erc20Transfers: [],
    });
    expect(report).toContain("WILL FAIL");
    expect(report).toContain("transfer amount exceeds balance");
  });

  it("shows expected changes when trace is unavailable", () => {
    const report = buildSimulationReport(
      {
        ...baseResult,
        traceAvailable: false,
        erc20Transfers: [],
      },
      { expectedChanges: ["10 USDC: fun.eth -> alice.eth"] },
    );
    expect(report).toContain("expected changes");
    expect(report).toContain("10 USDC: fun.eth -> alice.eth");
    expect(report).toContain("does not support debug_traceCall");
  });
});
