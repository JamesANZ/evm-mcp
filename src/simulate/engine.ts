import { ethers } from "ethers";
import { AppConfig } from "../types.js";
import { getProviderForNetwork } from "../rpc/client.js";
import { buildFundingOverride, StateOverride } from "./overrides.js";
import {
  decodeRevert,
  decodeErc20Transfers,
  decodeNativeBalanceChanges,
  DecodedTransfer,
} from "./decode.js";

export interface SimulateParams {
  from?: string;
  to?: string;
  value?: string; // wei (decimal or hex string)
  data?: string;
  gas?: string;
  network?: string | number;
  fund?: boolean;
  abi?: string[]; // extra signatures for custom error decoding
  decimalsByToken?: Record<string, number>;
}

export interface SimulationResult {
  success: boolean;
  network: { slug: string; name: string; chainId: number };
  from?: string;
  to?: string;
  valueWei: string;
  data?: string;
  funded: boolean;
  returnData?: string;
  revertReason?: string;
  gasEstimate?: { hex: string; decimal: number };
  gasError?: string;
  traceAvailable: boolean;
  traceError?: string;
  erc20Transfers: DecodedTransfer[];
  nativeChanges: Record<
    string,
    { beforeWei: string; afterWei: string; deltaWei: string }
  >;
}

function toHexQuantity(value: string | undefined): string {
  if (!value) return "0x0";
  const trimmed = value.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    return "0x" + BigInt(trimmed).toString(16);
  }
  return "0x" + BigInt(trimmed).toString(16);
}

function extractRevertData(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const err = error as Record<string, any>;
  const candidates = [
    err.data,
    err.value,
    err.error?.data,
    err.info?.error?.data,
    err.info?.error?.data?.data,
    err.info?.error?.originalError?.data,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("0x")) {
      return c;
    }
    if (c && typeof c === "object" && typeof c.data === "string") {
      return c.data;
    }
  }
  return undefined;
}

export async function simulateTransaction(
  config: AppConfig,
  params: SimulateParams,
): Promise<SimulationResult> {
  const { provider, network } = getProviderForNetwork(config, params.network);

  const valueWei = params.value ? BigInt(toHexQuantity(params.value)) : 0n;

  const tx: Record<string, string> = {};
  if (params.from) tx.from = ethers.getAddress(params.from);
  if (params.to) tx.to = ethers.getAddress(params.to);
  if (params.data) tx.data = params.data;
  if (valueWei > 0n) tx.value = "0x" + valueWei.toString(16);
  if (params.gas) tx.gas = toHexQuantity(params.gas);

  const fund = params.fund !== false;
  const overrides: StateOverride | undefined = buildFundingOverride(
    tx.from,
    fund,
    valueWei,
  );

  const result: SimulationResult = {
    success: false,
    network: { slug: network.slug, name: network.name, chainId: network.chainId },
    from: tx.from,
    to: tx.to,
    valueWei: valueWei.toString(),
    data: params.data,
    funded: fund && !!tx.from,
    traceAvailable: false,
    erc20Transfers: [],
    nativeChanges: {},
  };

  // 1. eth_call to determine success / revert reason.
  try {
    const callParams: unknown[] = overrides
      ? [tx, "latest", overrides]
      : [tx, "latest"];
    const returnData = await provider.send("eth_call", callParams);
    result.success = true;
    result.returnData =
      typeof returnData === "string" ? returnData : String(returnData);
  } catch (error) {
    result.success = false;
    const revertData = extractRevertData(error);
    if (revertData) {
      result.revertReason = decodeRevert(revertData, params.abi);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      result.revertReason = `execution reverted: ${message}`;
    }
  }

  // 2. Gas estimate (best-effort; overrides not supported everywhere).
  // Skip when the call already reverted - the revert reason is the useful signal.
  if (result.success) {
    try {
      let gasHex: unknown;
      try {
        gasHex = await provider.send(
          "eth_estimateGas",
          overrides ? [tx, "latest", overrides] : [tx],
        );
      } catch {
        gasHex = await provider.send("eth_estimateGas", [tx]);
      }
      result.gasEstimate = {
        hex: String(gasHex),
        decimal: parseInt(String(gasHex), 16),
      };
    } catch (error) {
      result.gasError = error instanceof Error ? error.message : String(error);
    }

    // 3. debug_traceCall for real logs + native balance diffs (best-effort).
    await tryTrace(provider, tx, overrides, params, result);
  }

  return result;
}

async function tryTrace(
  provider: ethers.JsonRpcProvider,
  tx: Record<string, string>,
  overrides: StateOverride | undefined,
  params: SimulateParams,
  result: SimulationResult,
): Promise<void> {
  const decimalsByToken = params.decimalsByToken ?? {};

  // callTracer with logs -> emitted events (ERC20 transfers).
  try {
    const callConfig: Record<string, unknown> = {
      tracer: "callTracer",
      tracerConfig: { withLog: true },
    };
    if (overrides) callConfig.stateOverrides = overrides;
    const trace = await provider.send("debug_traceCall", [
      tx,
      "latest",
      callConfig,
    ]);
    result.traceAvailable = true;
    const logs = collectLogs(trace);
    result.erc20Transfers = decodeErc20Transfers(logs, decimalsByToken);
  } catch (error) {
    result.traceError = error instanceof Error ? error.message : String(error);
  }

  // prestateTracer diffMode -> native ETH balance changes.
  try {
    const preConfig: Record<string, unknown> = {
      tracer: "prestateTracer",
      tracerConfig: { diffMode: true },
    };
    if (overrides) preConfig.stateOverrides = overrides;
    const diff = await provider.send("debug_traceCall", [
      tx,
      "latest",
      preConfig,
    ]);
    result.traceAvailable = true;
    result.nativeChanges = decodeNativeBalanceChanges(diff?.pre, diff?.post);
  } catch (error) {
    if (!result.traceError) {
      result.traceError =
        error instanceof Error ? error.message : String(error);
    }
  }
}

interface TraceLog {
  address: string;
  topics: string[];
  data: string;
}

function collectLogs(trace: any): TraceLog[] {
  const logs: TraceLog[] = [];
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.logs)) {
      for (const log of node.logs) {
        if (log && log.address && Array.isArray(log.topics)) {
          logs.push({
            address: log.address,
            topics: log.topics,
            data: log.data ?? "0x",
          });
        }
      }
    }
    if (Array.isArray(node.calls)) {
      for (const child of node.calls) walk(child);
    }
  };
  walk(trace);
  return logs;
}
