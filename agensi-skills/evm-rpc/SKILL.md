---
name: evm-rpc
description: Reads Ethereum and other EVM chain state, encodes calls, and simulates transactions through the connected EVM MCP server. Use when the user asks for a balance, nonce, gas, logs, contract code, storage, a transaction receipt, or a simulation before signing.
---

# EVM chain lookups

The EVM MCP server must already be connected. If `list_supported_networks` is missing, stop and give the user the install block in README.md. Do not invent chain data.

## Workflow

1. Call `list_supported_networks` when the user names a chain other than Ethereum mainnet, or when the provider is unclear. Pass the network they named on later calls when the tool accepts it.
2. For a balance, call `eth_getBalance`. For a nonce, call `eth_getTransactionCount`.
3. For "what would this transaction do", call `simulate_native_transfer`, `simulate_erc20_transfer`, or `simulate_contract_call`. Use `encode_function_data` when they only want calldata. Use `eth_estimateGas` and `eth_gasPrice` when they ask about cost.
4. Call `eth_sendRawTransaction` only when the user supplies an already-signed raw transaction and explicitly says to broadcast it.
5. Read [references/tools.md](references/tools.md) for logs, code, storage, receipts, and the remaining RPC methods.

## Output

- Network and chain id
- Block number used, when the tool returns one
- The value, with units
- The tool that produced it

## Boundaries

Simulation is read-only. Do not ask for a private key. Do not sign a transaction in the skill.
