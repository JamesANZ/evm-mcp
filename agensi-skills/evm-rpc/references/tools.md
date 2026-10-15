# EVM MCP tools

| Tool | Use it for |
| --- | --- |
| `list_supported_networks` | Networks and providers this process can call |
| `list_known_addresses` | Configured aliases and known token or contract addresses |
| `eth_chainId` | Chain id |
| `eth_blockNumber` | Latest block number |
| `eth_getBalance` | Account balance |
| `eth_getTransactionCount` | Nonce / sent transaction count |
| `eth_getBlockByNumber` | One block |
| `eth_getTransactionByHash` | One transaction |
| `eth_getTransactionReceipt` | One receipt |
| `eth_getCode` | Contract bytecode |
| `eth_getStorageAt` | One storage slot |
| `eth_getLogs` | Logs matching a filter |
| `eth_call` | A read-only contract call |
| `eth_estimateGas` | Gas estimate |
| `eth_gasPrice` | Current gas price |
| `encode_function_data` | Calldata from a signature and arguments, no RPC state |
| `simulate_transaction` | Read-only simulation of a raw transaction |
| `simulate_contract_call` | Read-only simulation from a function signature |
| `simulate_native_transfer` | Read-only simulation of a native-currency transfer |
| `simulate_erc20_transfer` | Read-only simulation of an ERC-20 transfer |
| `web3_clientVersion` | Client version string |
| `web3_sha3` | Keccak-256 of the given data |
| `net_version` | Network id |
| `net_listening` | Whether the client is listening |
| `net_peerCount` | Peer count |
| `eth_sendRawTransaction` | Broadcast a transaction the user already signed and asked to send |
