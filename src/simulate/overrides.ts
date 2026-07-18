import { ethers } from "ethers";

export type StateOverride = Record<string, { balance?: string; nonce?: string }>;

// Balance granted to the sender when `fund` is enabled so a simulation can run
// "from" any address regardless of its real balance. ethers state overrides
// expect hex-quantity strings.
const DEFAULT_FUND_WEI = ethers.parseEther("100000");

/**
 * Builds an eth_call state override that funds the sender address, giving the
 * "forked state" feel where a transaction can originate from any address even
 * if it holds no real ETH. Returns undefined when funding is disabled.
 */
export function buildFundingOverride(
  from: string | undefined,
  fund: boolean,
  minBalanceWei?: bigint,
): StateOverride | undefined {
  if (!fund || !from) {
    return undefined;
  }

  const balance =
    minBalanceWei && minBalanceWei > DEFAULT_FUND_WEI
      ? minBalanceWei
      : DEFAULT_FUND_WEI;

  return {
    [ethers.getAddress(from)]: {
      balance: "0x" + balance.toString(16),
    },
  };
}
