# EVM MCP Server

A comprehensive Model Context Protocol (MCP) server that provides complete access to Ethereum Virtual Machine (EVM) JSON-RPC methods. Works with any EVM-compatible node provider including Infura, Alchemy, QuickNode, local nodes, and more.

## 🚀 Quick Start

1. **Install and build**:

   ```bash
   npm install
   npm run build
   ```

2. **Configure Claude Desktop**:
   - Open Claude Desktop Settings (`Cmd/Ctrl + ,`)
   - Add MCP server with command: `node /path/to/evm-mcp/build/index.js`
   - Set environment variables:
     ```json
     {
       "RPC_URL": "https://mainnet.infura.io/v3/YOUR_API_KEY",
       "CHAIN_ID": "1"
     }
     ```

3. **Test it**: Ask Claude "What's the latest Ethereum block number?"

## Features

This MCP server provides access to all major EVM JSON-RPC methods through 20+ specialized tools:

### 🌐 Web3 Methods

#### `web3_clientVersion`

Returns the current client version of the connected node.

#### `web3_sha3`

Computes the Keccak-256 hash of the given data.

### 🔢 Blockchain Data Methods

#### `eth_blockNumber`

Returns the number of the most recent block.

#### `eth_getBalance`

Returns the balance of an account at a specified block.

#### `eth_getTransactionCount`

Returns the number of transactions sent from an address (nonce).

#### `eth_getBlockByNumber`

Returns information about a block by block number.

#### `eth_getTransactionByHash`

Returns transaction information by transaction hash.

#### `eth_getTransactionReceipt`

Returns the receipt of a transaction by transaction hash.

#### `eth_getCode`

Returns the bytecode at a given contract address.

#### `eth_getStorageAt`

Returns the value from a storage position at a given address.

### 🔄 Transaction Methods

#### `eth_call`

Executes a message call immediately without creating a transaction.

#### `eth_estimateGas`

Estimates the gas required for a transaction.

#### `eth_sendRawTransaction`

Submits a pre-signed transaction for broadcast to the network.

#### `eth_gasPrice`

Returns the current price per gas in wei.

### 📊 Event and Log Methods

#### `eth_getLogs`

Returns an array of all logs matching a given filter object.

### 🌍 Network Methods

#### `eth_chainId`

Returns the chain ID of the current network.

#### `net_version`

Returns the current network ID.

#### `net_listening`

Returns true if client is actively listening for network connections.

#### `net_peerCount`

Returns the number of peers currently connected to the client.

## Supported Networks

This server works with any EVM-compatible network:

- **Ethereum**: Mainnet, Sepolia, Goerli
- **Polygon**: Mainnet, Mumbai
- **Arbitrum**: One, Sepolia
- **Optimism**: Mainnet, Sepolia
- **BNB Smart Chain**: Mainnet, Testnet
- **Avalanche**: C-Chain
- **Fantom**: Opera
- **And many more EVM-compatible chains**

## Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd evm-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the project root:

```bash
# Required: Any EVM-compatible RPC endpoint
RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY

# Optional: Chain ID (defaults to 1 for Ethereum mainnet)
CHAIN_ID=1
```

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

4. Build the project:

```bash
npm run build
```

## Usage

### Adding to Claude Desktop

To use this EVM MCP server with Claude Desktop, you need to configure it in your Claude Desktop settings.

#### 1. Build the Server

First, build the server:

```bash
npm run build
```

#### 2. Configure Claude Desktop

1. **Open Claude Desktop Settings**:
   - On macOS: `Cmd + ,` or go to Claude Desktop → Settings
   - On Windows: `Ctrl + ,` or go to File → Settings

2. **Add the MCP Server**:
   - Click "Add server" or the "+" button
   - Fill in the configuration:

   **Server Name**: `EVM MCP Server`

   **Command**:

   ```bash
   node /path/to/your/evm-mcp/build/index.js
   ```

   **Environment Variables**:

   ```json
   {
     "RPC_URL": "https://mainnet.infura.io/v3/YOUR_API_KEY",
     "CHAIN_ID": "1"
   }
   ```

3. **Example Configuration**:

   For **Infura**:

   ```json
   {
     "RPC_URL": "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
     "CHAIN_ID": "1"
   }
   ```

   For **Alchemy**:

   ```json
   {
     "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY",
     "CHAIN_ID": "1"
   }
   ```

   For **Polygon**:

   ```json
   {
     "RPC_URL": "https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
     "CHAIN_ID": "137"
   }
   ```

   For **Arbitrum**:

   ```json
   {
     "RPC_URL": "https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
     "CHAIN_ID": "42161"
   }
   ```

4. **Save and Restart**: Save the configuration and restart Claude Desktop.

#### 3. Verify Connection

Once configured, you should see the EVM MCP Server available in Claude. You can test it by asking Claude to:

- "Get the latest Ethereum block number"
- "Check the balance of address 0x742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C"
- "Get the current gas price"

### Running the Server Standalone

You can also run the server directly:

```bash
# Set environment variables
export RPC_URL="https://mainnet.infura.io/v3/YOUR_API_KEY"
export CHAIN_ID="1"

# Start the server
npm start
```

The server runs on stdio and can be connected to any MCP-compatible client.

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Example Queries

Here are some example queries you can make with this MCP server:

#### Get Latest Block Number

```json
{
  "tool": "eth_blockNumber",
  "arguments": {}
}
```

#### Get Account Balance

```json
{
  "tool": "eth_getBalance",
  "arguments": {
    "address": "0x742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C",
    "blockNumber": "latest"
  }
}
```

#### Get Transaction Information

```json
{
  "tool": "eth_getTransactionByHash",
  "arguments": {
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
}
```

#### Call a Smart Contract

```json
{
  "tool": "eth_call",
  "arguments": {
    "to": "0xA0b86a33E6441c8C06DDD46C310c0eF8D9441C8F",
    "data": "0x70a08231000000000000000000000000742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C"
  }
}
```

#### Estimate Gas for a Transaction

```json
{
  "tool": "eth_estimateGas",
  "arguments": {
    "to": "0x742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C",
    "from": "0x1234567890123456789012345678901234567890",
    "value": "0xde0b6b3a7640000"
  }
}
```

#### Get Event Logs

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

#### Get Current Gas Price

```json
{
  "tool": "eth_gasPrice",
  "arguments": {}
}
```

#### Get Network Information

```json
{
  "tool": "eth_chainId",
  "arguments": {}
}
```

## API Reference

### Core EVM Methods

| Method                      | Description                   | Parameters                                                      |
| --------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `eth_blockNumber`           | Get latest block number       | None                                                            |
| `eth_getBalance`            | Get account balance           | `address`, `blockNumber`                                        |
| `eth_getTransactionCount`   | Get transaction count (nonce) | `address`, `blockNumber`                                        |
| `eth_getBlockByNumber`      | Get block information         | `blockNumber`, `includeTransactions`                            |
| `eth_getTransactionByHash`  | Get transaction details       | `txHash`                                                        |
| `eth_getTransactionReceipt` | Get transaction receipt       | `txHash`                                                        |
| `eth_call`                  | Execute contract call         | `to`, `data`, `blockNumber`, `from`, `value`, `gas`, `gasPrice` |
| `eth_estimateGas`           | Estimate gas for transaction  | `to`, `data`, `from`, `value`, `gas`, `gasPrice`                |
| `eth_sendRawTransaction`    | Send signed transaction       | `signedTransactionData`                                         |
| `eth_gasPrice`              | Get current gas price         | None                                                            |
| `eth_getCode`               | Get contract bytecode         | `address`, `blockNumber`                                        |
| `eth_getStorageAt`          | Get storage value             | `address`, `position`, `blockNumber`                            |
| `eth_getLogs`               | Get event logs                | `fromBlock`, `toBlock`, `address`, `topics`                     |

### Network Methods

| Method          | Description         | Parameters |
| --------------- | ------------------- | ---------- |
| `eth_chainId`   | Get chain ID        | None       |
| `net_version`   | Get network version | None       |
| `net_listening` | Check if listening  | None       |
| `net_peerCount` | Get peer count      | None       |

### Web3 Methods

| Method               | Description               | Parameters |
| -------------------- | ------------------------- | ---------- |
| `web3_clientVersion` | Get client version        | None       |
| `web3_sha3`          | Hash data with Keccak-256 | `data`     |

## Data Format

- All hex values are returned in their original format
- Decimal conversions are provided for human readability
- Block numbers can be specified as hex strings or keywords: `latest`, `earliest`, `pending`
- Gas prices are displayed in both wei and gwei
- Timestamps are converted to ISO format when applicable

## Error Handling

The server includes comprehensive error handling:

- Network errors are caught and reported with descriptive messages
- Invalid addresses or transaction hashes return appropriate error messages
- Rate limiting and API errors are handled gracefully
- Missing environment variables cause startup failures with clear messages

## Configuration

### Environment Variables

- `RPC_URL` (required): Any EVM-compatible RPC endpoint
- `CHAIN_ID` (optional): Chain ID for the network (defaults to 1)

### Claude Desktop Configuration

When adding this MCP server to Claude Desktop, you'll need to configure it in the MCP settings. Here's a complete guide:

#### Step-by-Step Setup

1. **Build the Server**:

   ```bash
   npm run build
   ```

2. **Open Claude Desktop Settings**:
   - **macOS**: Press `Cmd + ,` or go to Claude Desktop → Settings
   - **Windows**: Press `Ctrl + ,` or go to File → Settings

3. **Navigate to MCP Settings**:
   - Look for "MCP" or "Model Context Protocol" in the settings menu
   - Click "Add server" or the "+" button

4. **Configure the Server**:

   **Server Name**: `EVM MCP Server`

   **Command**:

   ```
   node /full/path/to/your/evm-mcp/build/index.js
   ```

   **Environment Variables** (JSON format):

   ```json
   {
     "RPC_URL": "https://mainnet.infura.io/v3/YOUR_API_KEY",
     "CHAIN_ID": "1"
   }
   ```

#### Network-Specific Configurations

**Ethereum Mainnet (Infura)**:

```json
{
  "RPC_URL": "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  "CHAIN_ID": "1"
}
```

**Ethereum Mainnet (Alchemy)**:

```json
{
  "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY",
  "CHAIN_ID": "1"
}
```

**Polygon Mainnet**:

```json
{
  "RPC_URL": "https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  "CHAIN_ID": "137"
}
```

**Arbitrum One**:

```json
{
  "RPC_URL": "https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  "CHAIN_ID": "42161"
}
```

**Optimism Mainnet**:

```json
{
  "RPC_URL": "https://optimism-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  "CHAIN_ID": "10"
}
```

**BNB Smart Chain**:

```json
{
  "RPC_URL": "https://bsc-dataseed.binance.org",
  "CHAIN_ID": "56"
}
```

#### Testing Your Configuration

After saving and restarting Claude Desktop, test the connection by asking Claude:

- "What's the latest Ethereum block number?"
- "Check the balance of address 0x742d35Cc6634C0532925a3b8D6Ac6e2F0C4C9B7C"
- "What's the current gas price?"
- "Get the chain ID of the current network"

If the server is working correctly, Claude should be able to execute these EVM RPC calls and return real blockchain data.

#### Troubleshooting Claude Desktop Setup

**Common Issues and Solutions**:

1. **"Server not found" error**:
   - Make sure you've built the server: `npm run build`
   - Verify the full path to `build/index.js` is correct
   - Check that Node.js is installed and accessible

2. **"Environment variable not set" error**:
   - Ensure the JSON format is correct (no trailing commas)
   - Make sure `RPC_URL` is set in the environment variables section
   - Verify your API key is valid and has sufficient quota

3. **"Connection failed" error**:
   - Test your RPC URL directly: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' YOUR_RPC_URL`
   - Check if your provider requires authentication
   - Verify the network is accessible from your location

4. **Server appears but tools don't work**:
   - Restart Claude Desktop after configuration changes
   - Check the server logs in Claude Desktop settings
   - Verify the server is running without errors

### Supported Node Providers

- **Infura**: `https://mainnet.infura.io/v3/YOUR_API_KEY`
- **Alchemy**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **QuickNode**: `https://YOUR_ENDPOINT.quiknode.pro/YOUR_TOKEN/`
- **Public RPCs**: Various public endpoints (rate limited)
- **Local Nodes**: `http://localhost:8545`
- **Custom Providers**: Any JSON-RPC compatible endpoint

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK for server implementation
- `ethers` - Ethereum library for blockchain interaction
- `zod` - Schema validation for tool parameters

## Development

### Project Structure

```
evm-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── test/
│   └── index.test.js     # Test suite
├── build/                # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.cjs       # Jest test configuration
└── README.md            # This file
```

### Testing

The project uses Jest for unit testing. Tests are located in the `test/` directory and can be run with:

```bash
npm test
```

### Building

The project uses TypeScript and compiles to JavaScript in the `build/` directory:

```bash
npm run build
```

## Use Cases

This MCP server is perfect for:

- **Blockchain Analytics**: Query transaction data, balances, and contract states
- **DeFi Applications**: Monitor token balances, transaction receipts, and smart contract calls
- **NFT Projects**: Track transfers, metadata, and collection statistics
- **Development Tools**: Debug transactions, estimate gas, and test smart contracts
- **Monitoring**: Watch for specific events and transaction patterns
- **Research**: Analyze blockchain data across multiple EVM networks

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## Support

For issues and questions:

1. Check the [Issues](https://github.com/your-repo/evm-mcp/issues) page
2. Create a new issue with detailed information
3. Include your RPC URL configuration and error messages
