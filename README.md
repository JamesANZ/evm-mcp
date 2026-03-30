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

## Hosted deployment

A hosted deployment is available on [Fronteir AI](https://fronteir.ai/mcp/jamesanz-evm-mcp).

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

# Set RPC URL
export RPC_URL="https://mainnet.infura.io/v3/YOUR_API_KEY"
export CHAIN_ID="1"

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
        "RPC_URL": "https://mainnet.infura.io/v3/YOUR_API_KEY",
        "CHAIN_ID": "1"
      }
    }
  }
}
```

Restart Claude Desktop after configuration.

## Configuration

### RPC URL Examples

```bash
# Infura
RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY

# Alchemy
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# QuickNode
RPC_URL=https://YOUR_ENDPOINT.quiknode.pro/YOUR_TOKEN/

# Public endpoints (rate limited)
RPC_URL=https://bsc-dataseed.binance.org
RPC_URL=https://polygon-rpc.com
RPC_URL=https://arb1.arbitrum.io/rpc

# Local node
RPC_URL=http://localhost:8545
```

### Supported Networks

- **Ethereum**: Mainnet, Sepolia, Goerli
- **Polygon**: Mainnet, Mumbai
- **Arbitrum**: One, Sepolia
- **Optimism**: Mainnet, Sepolia
- **BNB Smart Chain**: Mainnet, Testnet
- **Avalanche**: C-Chain
- **Fantom**: Opera
- **Any EVM-compatible chain**

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
    "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
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

**Environment Variables:**
- `RPC_URL` (required): Any EVM-compatible RPC endpoint
- `CHAIN_ID` (optional): Chain ID for the network (defaults to 1)

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
