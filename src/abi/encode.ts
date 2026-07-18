import { ethers } from "ethers";

export interface EncodedCall {
  signature: string;
  functionName: string;
  selector: string;
  data: string;
  args: unknown[];
}

function normalizeFragment(signature: string): string {
  const trimmed = signature.trim();
  return trimmed.startsWith("function ") ? trimmed : `function ${trimmed}`;
}

/**
 * Encodes a function call from a human-readable signature and its arguments.
 * Example: encodeFunctionData("transfer(address,uint256)", ["0x...", "1000"]).
 * Accepts numeric strings for integer arguments so callers never lose precision
 * to JavaScript floats.
 */
export function encodeFunctionData(
  signature: string,
  args: unknown[] = [],
): EncodedCall {
  let iface: ethers.Interface;
  try {
    iface = new ethers.Interface([normalizeFragment(signature)]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid function signature "${signature}": ${message}`);
  }

  const fragment = iface.fragments.find((f) => f.type === "function") as
    | ethers.FunctionFragment
    | undefined;

  if (!fragment) {
    throw new Error(`No function found in signature "${signature}"`);
  }

  if (fragment.inputs.length !== args.length) {
    throw new Error(
      `Function ${fragment.name} expects ${fragment.inputs.length} argument(s) but received ${args.length}`,
    );
  }

  let data: string;
  try {
    data = iface.encodeFunctionData(fragment, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to encode ${fragment.name}: ${message}`);
  }

  return {
    signature: fragment.format("full"),
    functionName: fragment.name,
    selector: data.slice(0, 10),
    data,
    args,
  };
}
