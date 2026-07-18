import { ethers } from "ethers";
import { SimulationResult } from "./engine.js";

export interface ReportOptions {
  title?: string;
  nativeSymbol?: string;
  labels?: Record<string, string>; // lower-cased address -> display name
  tokenSymbols?: Record<string, string>; // lower-cased token address -> symbol
  // Human-readable movements to show when a full state trace is unavailable.
  expectedChanges?: string[];
}

const DISCLAIMER =
  "_Simulation only - no transaction was broadcast to the network._";

function label(address: string, options: ReportOptions): string {
  const name = options.labels?.[address.toLowerCase()];
  return name ? `${name} (${address})` : address;
}

export function buildSimulationReport(
  result: SimulationResult,
  options: ReportOptions = {},
): string {
  const nativeSymbol = options.nativeSymbol ?? "ETH";
  const lines: string[] = [];
  const title = options.title ?? "Transaction Simulation";

  lines.push(`**${title}**`);
  lines.push("");
  lines.push(
    `**Network:** ${result.network.name} (${result.network.slug}, chainId ${result.network.chainId})`,
  );
  lines.push("");

  if (result.success) {
    lines.push("**Verdict:** WILL SUCCEED");
  } else {
    lines.push("**Verdict:** WILL FAIL");
    lines.push("");
    lines.push(`**Reason:** ${result.revertReason ?? "unknown"}`);
  }
  lines.push("");

  if (result.gasEstimate) {
    lines.push(
      `**Estimated gas:** ${result.gasEstimate.decimal.toLocaleString()} units`,
    );
  } else if (result.gasError) {
    lines.push(`**Estimated gas:** unavailable (${result.gasError})`);
  }
  lines.push("");

  // Asset / state changes.
  lines.push("**State changes:**");
  const changeLines: string[] = [];

  for (const transfer of result.erc20Transfers) {
    const symbol =
      options.tokenSymbols?.[transfer.token.toLowerCase()] ?? "tokens";
    changeLines.push(
      `- ${transfer.amount} ${symbol}: ${label(transfer.from, options)} -> ${label(transfer.to, options)}`,
    );
  }

  for (const [address, change] of Object.entries(result.nativeChanges)) {
    const deltaWei = BigInt(change.deltaWei);
    if (deltaWei === 0n) continue;
    const sign = deltaWei > 0n ? "+" : "-";
    const abs = deltaWei < 0n ? -deltaWei : deltaWei;
    changeLines.push(
      `- ${label(address, options)}: ${sign}${ethers.formatEther(abs)} ${nativeSymbol}`,
    );
  }

  if (changeLines.length > 0) {
    lines.push(...changeLines);
  } else if (result.success && options.expectedChanges?.length) {
    lines.push(
      "_Full state trace unavailable on this provider; expected changes based on the decoded intent:_",
    );
    lines.push(...options.expectedChanges.map((c) => `- ${c}`));
  } else if (result.success) {
    lines.push("- No token or native balance changes detected.");
  } else {
    lines.push("- None (transaction would revert).");
  }
  lines.push("");

  // Transaction details.
  lines.push("**Transaction details:**");
  if (result.from) lines.push(`- From: ${label(result.from, options)}`);
  if (result.to) lines.push(`- To: ${label(result.to, options)}`);
  if (BigInt(result.valueWei) > 0n) {
    lines.push(
      `- Value: ${ethers.formatEther(BigInt(result.valueWei))} ${nativeSymbol}`,
    );
  }
  if (result.data && result.data !== "0x") {
    lines.push(`- Calldata: ${result.data}`);
  }
  if (result.returnData && result.returnData !== "0x") {
    lines.push(`- Return data: ${result.returnData}`);
  }
  lines.push(`- Sender funded for simulation: ${result.funded ? "yes" : "no"}`);
  if (!result.traceAvailable) {
    lines.push(
      "- Note: this RPC provider does not support debug_traceCall; state changes are inferred, not traced.",
    );
  }
  lines.push("");
  lines.push(DISCLAIMER);

  return lines.join("\n");
}
