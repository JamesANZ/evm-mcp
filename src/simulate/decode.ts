import { ethers } from "ethers";
import { ERC20_INTERFACE, ERC20_TRANSFER_TOPIC } from "../abi/erc20.js";

const ERROR_STRING_SELECTOR = "0x08c379a0"; // Error(string)
const PANIC_SELECTOR = "0x4e487b71"; // Panic(uint256)

const PANIC_REASONS: Record<string, string> = {
  "0x00": "generic compiler panic",
  "0x01": "assertion failed",
  "0x11": "arithmetic overflow or underflow",
  "0x12": "division or modulo by zero",
  "0x21": "invalid enum value",
  "0x22": "invalid storage byte array access",
  "0x31": "pop() on an empty array",
  "0x32": "array index out of bounds",
  "0x41": "out of memory / too much memory allocated",
  "0x51": "call to an uninitialized internal function",
};

/**
 * Decodes revert data into a plain-English reason. Handles the standard
 * Error(string) and Panic(uint256) selectors, plus any custom errors supplied
 * via extraAbi (human-readable signatures).
 */
export function decodeRevert(
  data: string | undefined | null,
  extraAbi: string[] = [],
): string {
  if (!data || data === "0x") {
    return "execution reverted (no reason provided)";
  }

  const selector = data.slice(0, 10).toLowerCase();

  if (selector === ERROR_STRING_SELECTOR) {
    try {
      const [reason] = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string"],
        "0x" + data.slice(10),
      );
      return `execution reverted: ${reason}`;
    } catch {
      // fall through
    }
  }

  if (selector === PANIC_SELECTOR) {
    try {
      const [code] = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        "0x" + data.slice(10),
      );
      const hex = "0x" + Number(code).toString(16).padStart(2, "0");
      const reason = PANIC_REASONS[hex] ?? `unknown panic code ${hex}`;
      return `execution reverted (panic ${hex}): ${reason}`;
    } catch {
      // fall through
    }
  }

  if (extraAbi.length > 0) {
    try {
      const iface = new ethers.Interface(
        extraAbi.map((s) =>
          s.trim().startsWith("error ") ? s.trim() : `error ${s.trim()}`,
        ),
      );
      const parsed = iface.parseError(data);
      if (parsed) {
        const argsText = parsed.args.length
          ? `(${parsed.args.map((a) => String(a)).join(", ")})`
          : "";
        return `execution reverted: ${parsed.name}${argsText}`;
      }
    } catch {
      // fall through
    }
  }

  return `execution reverted (undecodable revert data ${selector})`;
}

export interface DecodedTransfer {
  token: string;
  from: string;
  to: string;
  rawValue: string;
  amount: string;
}

interface RawLog {
  address: string;
  topics: string[];
  data: string;
}

/**
 * Decodes ERC20 Transfer events from a set of logs. decimalsByToken maps a
 * lower-cased token address to its decimals for human-readable formatting.
 */
export function decodeErc20Transfers(
  logs: RawLog[] | undefined,
  decimalsByToken: Record<string, number> = {},
): DecodedTransfer[] {
  if (!logs || logs.length === 0) {
    return [];
  }

  const transfers: DecodedTransfer[] = [];
  for (const log of logs) {
    if (
      !log.topics ||
      log.topics[0]?.toLowerCase() !== ERC20_TRANSFER_TOPIC.toLowerCase()
    ) {
      continue;
    }

    try {
      const parsed = ERC20_INTERFACE.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (!parsed) continue;

      const token = ethers.getAddress(log.address);
      const decimals = decimalsByToken[token.toLowerCase()];
      const rawValue: bigint = parsed.args.value;
      const amount =
        decimals !== undefined
          ? ethers.formatUnits(rawValue, decimals)
          : rawValue.toString();

      transfers.push({
        token,
        from: ethers.getAddress(parsed.args.from),
        to: ethers.getAddress(parsed.args.to),
        rawValue: rawValue.toString(),
        amount,
      });
    } catch {
      // Skip logs that do not match the ERC20 Transfer shape.
    }
  }

  return transfers;
}

/**
 * Computes native ETH balance deltas from a prestateTracer diffMode result.
 * Returns a map of checksummed address -> { before, after, deltaWei }.
 */
export function decodeNativeBalanceChanges(
  pre: Record<string, { balance?: string }> | undefined,
  post: Record<string, { balance?: string }> | undefined,
): Record<string, { beforeWei: string; afterWei: string; deltaWei: string }> {
  const result: Record<
    string,
    { beforeWei: string; afterWei: string; deltaWei: string }
  > = {};
  if (!pre && !post) {
    return result;
  }

  const addresses = new Set<string>([
    ...Object.keys(pre ?? {}),
    ...Object.keys(post ?? {}),
  ]);

  for (const addr of addresses) {
    const before = BigInt(pre?.[addr]?.balance ?? "0x0");
    const after = BigInt(post?.[addr]?.balance ?? pre?.[addr]?.balance ?? "0x0");
    const delta = after - before;
    if (delta === 0n) continue;
    result[ethers.getAddress(addr)] = {
      beforeWei: before.toString(),
      afterWei: after.toString(),
      deltaWei: delta.toString(),
    };
  }

  return result;
}
