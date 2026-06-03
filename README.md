# ⛽ EVM MCP Server

> **Complete EVM JSON-RPC access in your AI workflow.** Query any EVM-compatible network (Ethereum, Polygon, Arbitrum, Optimism, BSC, and more) through any node provider. Works with Infura, Alchemy, QuickNode, local nodes, and more.

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that provides comprehensive access to Ethereum Virtual Machine (EVM) JSON-RPC methods for AI coding environments like Cursor and Claude Desktop.

## Why Use EVM MCP?

- 🌐 **Any EVM Network** – Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche, and more
- 🔌 **Any Node Provider** – Infura, Alchemy, QuickNode, local nodes, or custom RPC
- 📊 **20+ RPC Methods** – Complete access to blockchain data, transactions, and contracts
- ⚡ **Easy Setup** – One-click install in Cursor or simple manual setup
- 🔧 **Flexible Configuration** – Works with any JSON-RPC compatible endpoint

## Quick Start

Ready to interact with EVM blockchains? Install in seconds:

**Install in Cursor (Recommended):**

[🔗 Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=evm-mcp&config=eyJldm0tbWNwIjp7ImNvbW1hbmQiOiJucHgiLCJhcmdzIjpbIi15IiwiQGphbWVzYW56L2V2bS1tY3AiXX19)

**Or install manually:**

```bash
npm install -g @jamesanz/evm-mcp
# Or from source:
git clone https://github.com/JamesANZ/evm-mcp.git
cd evm-mcp && npm install && npm run build
```

## Features

### 🔢 Blockchain Data

- **`eth_blockNumber`** – Get latest block number
- **`eth_getBalance`** – Get account balance
- **`eth_getTransactionCount`** – Get transaction count (nonce)
- **`eth_getBlockByNumber`** – Get block information
- **`eth_getTransactionByHash`** – Get transaction details
- **`eth_getTransactionReceipt`** – Get transaction receipt
- **`eth_getCode`** – Get contract bytecode
- **`eth_getStorageAt`** – Get storage value

### 🔄 Transactions

- **`eth_call`** – Execute contract call
- **`eth_estimateGas`** – Estimate gas for transaction
- **`eth_sendRawTransaction`** – Send signed transaction
- **`eth_gasPrice`** – Get current gas price

### 📊 Events & Logs

- **`eth_getLogs`** – Get event logs

### 🌍 Network

- **`list_supported_networks`** – List configured networks and providers
- **`eth_chainId`** – Get chain ID
- **`net_version`** – Get network version
- **`net_listening`** – Check if listening
- **`net_peerCount`** – Get peer count

### 🌐 Web3

- **`web3_clientVersion`** – Get client version
- **`web3_sha3`** – Hash data with Keccak-256

## Installation

### Cursor (One-Click)

Click the install link above or use:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=evm-mcp&config=eyJldm0tbWNwIjp7ImNvbW1hbmQiOiJucHgiLCJhcmdzIjpbIi15IiwiQGphbWVzYW56L2V2bS1tY3AiXX19
```

### Manual Installation

**Requirements:** Node.js 18+ and npm

```bash
# Clone and build
git clone https://github.com/JamesANZ/evm-mcp.git
cd evm-mcp
npm install
npm run build

# Set provider API keys
export INFURA_API_KEY="your-infura-api-key"
export DEFAULT_NETWORK="ethereum"
export DEFAULT_PROVIDER="infura"

# Run server
npm start
```

### Claude Desktop

Add to `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "evm-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/evm-mcp/build/index.js"],
      "env": {
        "INFURA_API_KEY": "your-infura-api-key",
        "DEFAULT_NETWORK": "ethereum",
        "DEFAULT_PROVIDER": "infura",
        "RPC_PROVIDER_ORDER": "infura,alchemy"
      }
    }
  }
}
```

Restart Claude Desktop after configuration.

## Configuration

### Environment Variables

| Variable             | Required | Description                                                         |
| -------------------- | -------- | ------------------------------------------------------------------- |
| `INFURA_API_KEY`     | One of\* | Infura project API key (built-in preset)                            |
| `ALCHEMY_API_KEY`    | One of\* | Alchemy app API key (built-in preset)                               |
| `DEFAULT_NETWORK`    | No       | Default chain slug or chain ID (default: `ethereum`)                |
| `DEFAULT_PROVIDER`   | No       | Provider slug to prefer (`infura`, `alchemy`, or custom)            |
| `RPC_PROVIDER_ORDER` | No       | Comma-separated provider fallback order (default: `infura,alchemy`) |
| `CUSTOM_PROVIDERS`   | One of\* | JSON array of user-defined providers                                |
| `CUSTOM_NETWORKS`    | One of\* | JSON array of user-defined networks                                 |

\*At least one provider API key, custom provider, or custom network with `rpcUrl` is required.

### Built-in Providers (Infura / Alchemy)

Set an API key and the server builds RPC URLs automatically for supported networks:

```json
{
  "INFURA_API_KEY": "your-infura-key",
  "DEFAULT_NETWORK": "ethereum",
  "DEFAULT_PROVIDER": "infura",
  "RPC_PROVIDER_ORDER": "infura,alchemy"
}
```

Each RPC tool accepts an optional `network` parameter (slug, name, or chain ID). When omitted, `DEFAULT_NETWORK` is used.

```json
{
  "tool": "eth_chainId",
  "arguments": { "network": "polygon" }
}
```

Use `list_supported_networks` to discover configured networks and providers.

### Custom Providers (`CUSTOM_PROVIDERS`)

Register any RPC provider by supplying a base URL template and network-specific URLs:

```json
"CUSTOM_PROVIDERS": "[{\"slug\":\"quicknode\",\"apiKeyEnv\":\"QUICKNODE_API_KEY\",\"baseUrl\":\"https://rpc.example.com/v1/{apiKey}\",\"networkUrls\":{\"ethereum\":\"https://eth.quiknode.pro/{apiKey}/\",\"polygon\":\"https://polygon.quiknode.pro/{apiKey}/\"}}]"
```

- **Absolute** `networkUrls` values are used directly (with `{apiKey}` substitution).
- **Relative** paths (starting with `/`) are appended to `baseUrl`.

### Custom Networks (`CUSTOM_NETWORKS`)

Register arbitrary chains by name:

```json
"CUSTOM_NETWORKS": "[{\"name\":\"HyperEVM\",\"slug\":\"hyperevm\",\"chainId\":999,\"rpcUrl\":\"https://rpc.hyperliquid.xyz/evm\"}]"
```

Or route through a provider by setting `provider` and adding the network slug to that provider's `networkUrls`.

### Migration from RPC_URL

```diff
- "RPC_URL": "https://mainnet.infura.io/v3/KEY"
- "CHAIN_ID": "1"
+ "INFURA_API_KEY": "KEY"
+ "DEFAULT_NETWORK": "ethereum"
+ "DEFAULT_PROVIDER": "infura"
```

Configuration changes require restarting the MCP server.

### Supported Built-in Networks

- **Ethereum**: Mainnet, Sepolia
- **Polygon**: Mainnet, Amoy
- **Arbitrum**: One, Sepolia
- **Optimism**: Mainnet, Sepolia
- **BNB Smart Chain**: Mainnet, Testnet
- **Avalanche**: C-Chain
- **Base**: Mainnet, Sepolia
- **Any EVM-compatible chain** via `CUSTOM_NETWORKS`

## Usage Examples

### Get Latest Block Number

Query the current block number:

```json
{
  "tool": "eth_blockNumber",
  "arguments": {}
}
```

### Get Account Balance

Check an address balance:

```json
{
  "tool": "eth_getBalance",
  "arguments": {
    "address": "0x742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C",
    "blockNumber": "latest"
  }
}
```

### Get Transaction Details

View transaction information:

```json
{
  "tool": "eth_getTransactionByHash",
  "arguments": {
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
}
```

### Call Smart Contract

Execute a contract call:

```json
{
  "tool": "eth_call",
  "arguments": {
    "to": "0xA0b86a33E6441c8C06DDD46C310c0eF8D9441C8F",
    "data": "0x70a08231000000000000000000000000742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C"
  }
}
```

### Get Event Logs

Query contract events:

```json
{
  "tool": "eth_getLogs",
  "arguments": {
    "fromBlock": "0x1234567",
    "toBlock": "latest",
    "address": "0xA0b86a33E6441c8C06DDD46C310c0eF8D9441C8F",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    ]
  }
}
```

## Use Cases

- **Blockchain Analytics** – Query transaction data, balances, and contract states
- **DeFi Applications** – Monitor token balances, transaction receipts, and smart contract calls
- **NFT Projects** – Track transfers, metadata, and collection statistics
- **Development Tools** – Debug transactions, estimate gas, and test smart contracts
- **Monitoring** – Watch for specific events and transaction patterns
- **Research** – Analyze blockchain data across multiple EVM networks

## Technical Details

**Built with:** Node.js, TypeScript, MCP SDK, Ethers.js  
**Dependencies:** `@modelcontextprotocol/sdk`, `ethers`, `zod`  
**Platforms:** macOS, Windows, Linux

**Environment Variables:** See [Configuration](#configuration) above.

## Contributing

⭐ **If this project helps you, please star it on GitHub!** ⭐

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT License – see [LICENSE.md](LICENSE.md) for details.

## Support

If you find this project useful, consider supporting it:

**⚡ Lightning Network**

```
lnbc1pjhhsqepp5mjgwnvg0z53shm22hfe9us289lnaqkwv8rn2s0rtekg5vvj56xnqdqqcqzzsxqyz5vqsp5gu6vh9hyp94c7t3tkpqrp2r059t4vrw7ps78a4n0a2u52678c7yq9qyyssq7zcferywka50wcy75skjfrdrk930cuyx24rg55cwfuzxs49rc9c53mpz6zug5y2544pt8y9jflnq0ltlha26ed846jh0y7n4gm8jd3qqaautqa
```

**₿ Bitcoin**: [bc1ptzvr93pn959xq4et6sqzpfnkk2args22ewv5u2th4ps7hshfaqrshe0xtp](https://mempool.space/address/bc1ptzvr93pn959xq4et6sqzpfnkk2args22ewv5u2th4ps7hshfaqrshe0xtp)

**Ξ Ethereum/EVM**: [0x42ea529282DDE0AA87B42d9E83316eb23FE62c3f](https://etherscan.io/address/0x42ea529282DDE0AA87B42d9E83316eb23FE62c3f)
