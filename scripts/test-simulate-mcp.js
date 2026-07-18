#!/usr/bin/env node

import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "build", "index.js");

const env = {
  ...process.env,
  DEFAULT_NETWORK: "ethereum",
  DEFAULT_PROVIDER: "public",
  RPC_PROVIDER_ORDER: "infura,alchemy,public",
};
delete env.INFURA_API_KEY;
delete env.ALCHEMY_API_KEY;

// Well-funded mainnet addresses used purely for read-only simulation.
const BINANCE = "0x28C6c06298d514Db089934071355E5743bf21d60"; // holds ETH + USDC
const DEAD = "0x000000000000000000000000000000000000dEaD";
const EMPTY = "0x00000000000000000000000000000000DeaDBeef"; // holds no USDC
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

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

proc.stderr.on("data", (chunk) => process.stderr.write(chunk));

async function callTool(name, args = {}) {
  const result = await request("tools/call", { name, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  return text;
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function main() {
  await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "simulate-test", version: "1.0.0" },
  });
  send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });

  const tools = await request("tools/list", {});
  const names = tools.tools.map((t) => t.name);
  for (const t of [
    "encode_function_data",
    "simulate_transaction",
    "simulate_contract_call",
    "simulate_native_transfer",
    "simulate_erc20_transfer",
  ]) {
    assert(names.includes(t), `tool ${t} not registered`);
  }
  console.log("[ok] all 5 simulation tools registered\n");

  const encoded = await callTool("encode_function_data", {
    signature: "transfer(address,uint256)",
    args: [DEAD, "1000000"],
  });
  console.log("=== encode_function_data ===\n" + encoded + "\n");
  assert(encoded.includes("0xa9059cbb"), "wrong selector for transfer");

  const nativeOk = await callTool("simulate_native_transfer", {
    from: BINANCE,
    to: DEAD,
    amount: "1",
  });
  console.log("=== simulate_native_transfer (should succeed) ===\n" + nativeOk + "\n");
  assert(nativeOk.includes("WILL SUCCEED"), "native transfer expected to succeed");

  const ens = await callTool("simulate_native_transfer", {
    from: BINANCE,
    to: "vitalik.eth",
    amount: "1",
  });
  console.log("=== simulate_native_transfer to vitalik.eth (ENS) ===\n" + ens + "\n");
  assert(ens.includes("vitalik.eth"), "ENS name label missing");
  assert(ens.includes("WILL SUCCEED"), "ENS native transfer expected to succeed");

  const erc20Ok = await callTool("simulate_erc20_transfer", {
    token: USDC,
    from: BINANCE,
    to: DEAD,
    amount: "10",
  });
  console.log("=== simulate_erc20_transfer 10 USDC (should succeed) ===\n" + erc20Ok + "\n");
  assert(erc20Ok.includes("WILL SUCCEED"), "USDC transfer from Binance expected to succeed");

  const erc20Fail = await callTool("simulate_erc20_transfer", {
    token: USDC,
    from: EMPTY,
    to: DEAD,
    amount: "10",
  });
  console.log("=== simulate_erc20_transfer from empty address (should fail) ===\n" + erc20Fail + "\n");
  assert(erc20Fail.includes("WILL FAIL"), "USDC transfer from empty address expected to fail");

  const callSim = await callTool("simulate_contract_call", {
    to: USDC,
    signature: "transfer(address,uint256)",
    args: [DEAD, "10000000"],
    from: BINANCE,
  });
  console.log("=== simulate_contract_call transfer ===\n" + callSim + "\n");
  assert(callSim.includes("WILL SUCCEED"), "contract call transfer expected to succeed");

  console.log("Simulation MCP integration test passed");
  proc.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error("Simulation MCP integration test failed:", error.message);
  proc.kill();
  process.exit(1);
});
