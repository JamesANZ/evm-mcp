#!/usr/bin/env node

import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "build", "index.js");

const INFURA_API_KEY = process.env.INFURA_API_KEY;
if (!INFURA_API_KEY) {
  console.error("INFURA_API_KEY required for integration test");
  process.exit(1);
}

const env = {
  ...process.env,
  INFURA_API_KEY,
  DEFAULT_NETWORK: "ethereum",
  DEFAULT_PROVIDER: "infura",
  RPC_PROVIDER_ORDER: "infura",
};

let nextId = 1;
const pending = new Map();

function send(message) {
  proc.stdin.write(JSON.stringify(message) + "\n");
}

function request(method, params = {}) {
  const id = nextId++;
  send({ jsonrpc: "2.0", id, method, params });
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

const proc = spawn("node", [serverPath], {
  env,
  stdio: ["pipe", "pipe", "pipe"],
});
let buffer = "";

proc.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    const message = JSON.parse(line);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  }
});

proc.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

async function callTool(name, args = {}) {
  const result = await request("tools/call", { name, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  if (text.startsWith("Error:")) {
    throw new Error(text);
  }
  return text;
}

async function main() {
  await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "integration-test", version: "1.0.0" },
  });
  send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });

  const networks = await callTool("list_supported_networks");
  if (!networks.includes("infura")) {
    throw new Error("list_supported_networks missing infura provider");
  }
  if (!networks.includes("ethereum")) {
    throw new Error("list_supported_networks missing ethereum network");
  }

  const defaultChain = await callTool("eth_chainId");
  if (!defaultChain.includes("chain_id_decimal:** 1")) {
    throw new Error(
      `expected default chain id 1, got: ${defaultChain.slice(0, 200)}`,
    );
  }

  const block = await callTool("eth_blockNumber");
  if (!block.includes("hex:** 0x")) {
    throw new Error("eth_blockNumber did not return hex block");
  }

  const polygonChain = await callTool("eth_chainId", { network: "polygon" });
  if (!polygonChain.includes("chain_id_decimal:** 137")) {
    throw new Error(
      `expected polygon chain id 137, got: ${polygonChain.slice(0, 200)}`,
    );
  }

  const arbitrumChain = await callTool("eth_chainId", { network: "arbitrum" });
  if (!arbitrumChain.includes("chain_id_decimal:** 42161")) {
    throw new Error(
      `expected arbitrum chain id 42161, got: ${arbitrumChain.slice(0, 200)}`,
    );
  }

  const balance = await callTool("eth_getBalance", {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    network: "ethereum",
  });
  if (!balance.includes("native_symbol:** ETH")) {
    throw new Error("eth_getBalance missing native ETH symbol");
  }
  if (balance.includes(INFURA_API_KEY)) {
    throw new Error("API key leaked in tool output");
  }

  console.log("Integration test passed");
  proc.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error("Integration test failed:", error.message);
  proc.kill();
  process.exit(1);
});
