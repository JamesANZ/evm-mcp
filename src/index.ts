import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ethers } from "ethers";

// Configuration
const RPC_URL = process.env.RPC_URL || process.env.ETHEREUM_RPC_URL;
const CHAIN_ID = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1; // Default to Ethereum mainnet

if (!RPC_URL) {
  console.error("Error: RPC_URL environment variable is required");
  console.error("Example: RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY");
  console.error(
    "Or: RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  );
  process.exit(1);
}

// Create provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

const server = new McpServer({
  name: "evm-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function to format responses
function formatResponse(data: any, title: string): string {
  let result = `**${title}**\n\n`;

  if (typeof data === "object" && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "object" && value !== null) {
        result += `**${key}:**\n`;
        for (const [subKey, subValue] of Object.entries(value)) {
          result += `  - ${subKey}: ${subValue}\n`;
        }
        result += "\n";
      } else {
        result += `**${key}:** ${value}\n`;
      }
    }
  } else {
    result += `${data}\n`;
  }

  return result;
}

// Generic RPC call function
async function makeRPCCall(method: string, params: any[] = []): Promise<any> {
  try {
    const result = await provider.send(method, params);
    return result;
  } catch (error: any) {
    throw new Error(`RPC call failed: ${error.message}`);
  }
}

// Core EVM RPC Methods

server.tool(
  "web3_clientVersion",
  "Returns the current client version",
  {},
  async () => {
    try {
      const result = await makeRPCCall("web3_clientVersion");
      return {
        content: [
          {
            type: "text",
            text: formatResponse(result, "Web3 Client Version"),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "web3_sha3",
  "Returns Keccak-256 hash of the given data",
  {
    data: z.string().describe("Data to hash (hex string starting with 0x)"),
  },
  async ({ data }) => {
    try {
      const result = await makeRPCCall("web3_sha3", [data]);
      return {
        content: [
          {
            type: "text",
            text: formatResponse(result, "Keccak-256 Hash"),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_blockNumber",
  "Returns the number of the most recent block",
  {},
  async () => {
    try {
      const result = await makeRPCCall("eth_blockNumber");
      const blockNumber = parseInt(result, 16);
      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                hex: result,
                decimal: blockNumber,
                timestamp: new Date().toISOString(),
              },
              "Latest Block Number",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getBalance",
  "Returns the balance of the account of given address",
  {
    address: z.string().describe("Address to check balance for"),
    blockNumber: z
      .string()
      .optional()
      .default("latest")
      .describe("Block number or 'latest', 'earliest', 'pending'"),
  },
  async ({ address, blockNumber }) => {
    try {
      const result = await makeRPCCall("eth_getBalance", [
        address,
        blockNumber,
      ]);
      const balance = ethers.formatEther(result);
      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                address,
                balance_wei: result,
                balance_eth: balance,
                block: blockNumber,
              },
              "Account Balance",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getTransactionCount",
  "Returns the number of transactions sent from an address",
  {
    address: z.string().describe("Address to check transaction count for"),
    blockNumber: z
      .string()
      .optional()
      .default("latest")
      .describe("Block number or 'latest', 'earliest', 'pending'"),
  },
  async ({ address, blockNumber }) => {
    try {
      const result = await makeRPCCall("eth_getTransactionCount", [
        address,
        blockNumber,
      ]);
      const nonce = parseInt(result, 16);
      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                address,
                nonce_hex: result,
                nonce_decimal: nonce,
                block: blockNumber,
              },
              "Transaction Count (Nonce)",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getBlockByNumber",
  "Returns information about a block by block number",
  {
    blockNumber: z
      .string()
      .describe("Block number (hex) or 'latest', 'earliest', 'pending'"),
    includeTransactions: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include full transaction objects"),
  },
  async ({ blockNumber, includeTransactions }) => {
    try {
      const result = await makeRPCCall("eth_getBlockByNumber", [
        blockNumber,
        includeTransactions,
      ]);
      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: `Block not found: ${blockNumber}`,
            },
          ],
        };
      }

      const blockInfo = {
        number: result.number,
        hash: result.hash,
        parentHash: result.parentHash,
        timestamp: result.timestamp,
        gasLimit: result.gasLimit,
        gasUsed: result.gasUsed,
        transactionCount: result.transactions.length,
        baseFeePerGas: result.baseFeePerGas,
      };

      return {
        content: [
          {
            type: "text",
            text: formatResponse(blockInfo, "Block Information"),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getTransactionByHash",
  "Returns the information about a transaction requested by transaction hash",
  {
    txHash: z.string().describe("Transaction hash"),
  },
  async ({ txHash }) => {
    try {
      const result = await makeRPCCall("eth_getTransactionByHash", [txHash]);
      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: `Transaction not found: ${txHash}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: formatResponse(result, "Transaction Information"),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getTransactionReceipt",
  "Returns the receipt of a transaction by transaction hash",
  {
    txHash: z.string().describe("Transaction hash"),
  },
  async ({ txHash }) => {
    try {
      const result = await makeRPCCall("eth_getTransactionReceipt", [txHash]);
      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: `Transaction receipt not found: ${txHash}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: formatResponse(result, "Transaction Receipt"),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_call",
  "Executes a new message call immediately without creating a transaction",
  {
    to: z.string().describe("Contract address"),
    data: z.string().describe("Data to send (hex string)"),
    blockNumber: z
      .string()
      .optional()
      .default("latest")
      .describe("Block number or 'latest', 'earliest', 'pending'"),
    from: z.string().optional().describe("From address (optional)"),
    value: z.string().optional().describe("Value in wei (optional)"),
    gas: z.string().optional().describe("Gas limit (optional)"),
    gasPrice: z.string().optional().describe("Gas price (optional)"),
  },
  async ({ to, data, blockNumber, from, value, gas, gasPrice }) => {
    try {
      const txObject: any = {
        to,
        data,
      };

      if (from) txObject.from = from;
      if (value) txObject.value = value;
      if (gas) txObject.gas = gas;
      if (gasPrice) txObject.gasPrice = gasPrice;

      const result = await makeRPCCall("eth_call", [txObject, blockNumber]);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                result,
                to,
                data,
                block: blockNumber,
              },
              "Contract Call Result",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_estimateGas",
  "Generates and returns an estimate of how much gas is necessary",
  {
    to: z
      .string()
      .optional()
      .describe("Contract address (optional for contract creation)"),
    data: z.string().optional().describe("Data to send (hex string)"),
    from: z.string().optional().describe("From address"),
    value: z.string().optional().describe("Value in wei"),
    gas: z.string().optional().describe("Gas limit"),
    gasPrice: z.string().optional().describe("Gas price"),
  },
  async ({ to, data, from, value, gas, gasPrice }) => {
    try {
      const txObject: any = {};

      if (to) txObject.to = to;
      if (data) txObject.data = data;
      if (from) txObject.from = from;
      if (value) txObject.value = value;
      if (gas) txObject.gas = gas;
      if (gasPrice) txObject.gasPrice = gasPrice;

      const result = await makeRPCCall("eth_estimateGas", [txObject]);
      const gasEstimate = parseInt(result, 16);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                gas_estimate_hex: result,
                gas_estimate_decimal: gasEstimate,
                transaction_object: txObject,
              },
              "Gas Estimate",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_sendRawTransaction",
  "Creates new message call transaction or a contract creation",
  {
    signedTransactionData: z
      .string()
      .describe("Signed transaction data (hex string)"),
  },
  async ({ signedTransactionData }) => {
    try {
      const result = await makeRPCCall("eth_sendRawTransaction", [
        signedTransactionData,
      ]);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                transaction_hash: result,
                status: "Transaction submitted successfully",
              },
              "Raw Transaction Sent",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_gasPrice",
  "Returns the current price per gas in wei",
  {},
  async () => {
    try {
      const result = await makeRPCCall("eth_gasPrice");
      const gasPrice = parseInt(result, 16);
      const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                gas_price_hex: result,
                gas_price_wei: gasPrice.toString(),
                gas_price_gwei: gasPriceGwei,
              },
              "Current Gas Price",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getCode",
  "Returns code at a given address",
  {
    address: z.string().describe("Contract address"),
    blockNumber: z
      .string()
      .optional()
      .default("latest")
      .describe("Block number or 'latest', 'earliest', 'pending'"),
  },
  async ({ address, blockNumber }) => {
    try {
      const result = await makeRPCCall("eth_getCode", [address, blockNumber]);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                address,
                code: result,
                code_length: result.length,
                block: blockNumber,
              },
              "Contract Code",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getStorageAt",
  "Returns the value from a storage position at a given address",
  {
    address: z.string().describe("Contract address"),
    position: z.string().describe("Storage position (hex string)"),
    blockNumber: z
      .string()
      .optional()
      .default("latest")
      .describe("Block number or 'latest', 'earliest', 'pending'"),
  },
  async ({ address, position, blockNumber }) => {
    try {
      const result = await makeRPCCall("eth_getStorageAt", [
        address,
        position,
        blockNumber,
      ]);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                address,
                position,
                value: result,
                block: blockNumber,
              },
              "Storage Value",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_getLogs",
  "Returns an array of all logs matching a given filter object",
  {
    fromBlock: z
      .string()
      .optional()
      .describe("Starting block (hex or 'latest', 'earliest', 'pending')"),
    toBlock: z
      .string()
      .optional()
      .describe("Ending block (hex or 'latest', 'earliest', 'pending')"),
    address: z.string().optional().describe("Contract address (optional)"),
    topics: z
      .array(z.string())
      .optional()
      .describe("Array of topic filters (optional)"),
  },
  async ({ fromBlock, toBlock, address, topics }) => {
    try {
      const filter: any = {};

      if (fromBlock) filter.fromBlock = fromBlock;
      if (toBlock) filter.toBlock = toBlock;
      if (address) filter.address = address;
      if (topics) filter.topics = topics;

      const result = await makeRPCCall("eth_getLogs", [filter]);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                logs_count: result.length,
                logs: result,
                filter,
              },
              "Event Logs",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "eth_chainId",
  "Returns the chain ID of the current network",
  {},
  async () => {
    try {
      const result = await makeRPCCall("eth_chainId");
      const chainId = parseInt(result, 16);

      const chainNames: { [key: number]: string } = {
        1: "Ethereum Mainnet",
        11155111: "Sepolia Testnet",
        5: "Goerli Testnet",
        137: "Polygon Mainnet",
        80001: "Polygon Mumbai Testnet",
        42161: "Arbitrum One",
        421614: "Arbitrum Sepolia",
        10: "Optimism",
        420: "Optimism Sepolia",
        56: "BNB Smart Chain",
        97: "BNB Smart Chain Testnet",
      };

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                chain_id_hex: result,
                chain_id_decimal: chainId,
                chain_name: chainNames[chainId] || "Unknown Network",
              },
              "Network Chain ID",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool("net_version", "Returns the current network id", {}, async () => {
  try {
    const result = await makeRPCCall("net_version");

    return {
      content: [
        {
          type: "text",
          text: formatResponse(
            {
              network_id: result,
            },
            "Network Version",
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

server.tool(
  "net_listening",
  "Returns true if client is actively listening for network connections",
  {},
  async () => {
    try {
      const result = await makeRPCCall("net_listening");

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                is_listening: result,
              },
              "Network Status",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "net_peerCount",
  "Returns number of peers currently connected to the client",
  {},
  async () => {
    try {
      const result = await makeRPCCall("net_peerCount");
      const peerCount = parseInt(result, 16);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                peer_count_hex: result,
                peer_count_decimal: peerCount,
              },
              "Connected Peers",
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`EVM MCP Server running on stdio`);
  console.error(`Connected to: ${RPC_URL}`);
  console.error(`Chain ID: ${CHAIN_ID}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
