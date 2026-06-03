import { ethers } from "ethers";
import { AppConfig } from "../types.js";
import { resolveNetwork } from "../network/resolve.js";
import { resolveRpcUrl } from "../providers/registry.js";

const providerCache = new Map<string, ethers.JsonRpcProvider>();

export function getJsonRpcProvider(
  url: string,
  chainId: number,
): ethers.JsonRpcProvider {
  const cacheKey = `${chainId}:${url}`;
  let provider = providerCache.get(cacheKey);
  if (!provider) {
    provider = new ethers.JsonRpcProvider(url, chainId);
    providerCache.set(cacheKey, provider);
  }
  return provider;
}

export async function makeRPCCall(
  config: AppConfig,
  method: string,
  params: unknown[] = [],
  networkInput?: string | number,
): Promise<unknown> {
  const network = resolveNetwork(networkInput, config);
  const { url } = resolveRpcUrl(network, config);
  const provider = getJsonRpcProvider(url, network.chainId);

  try {
    return await provider.send(method, params);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `RPC call failed on ${network.slug} (${network.name}): ${message}`,
    );
  }
}

export function clearProviderCache(): void {
  providerCache.clear();
}
