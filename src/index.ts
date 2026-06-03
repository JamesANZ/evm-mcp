import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ethers } from "ethers";
import { loadConfig } from "./config.js";
import { makeRPCCall } from "./rpc/client.js";
import { resolveNetwork } from "./network/resolve.js";
import { networkSchema } from "./schemas.js";
import { buildSupportedNetworksReport } from "./list-networks.js";

const config = loadConfig();

const server = new McpServer({
  name: "evm-mcp",
  version: "2.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

function formatResponse(data: unknown, title: string): string {
  let result = `**${title}**\n\n`;

  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      result += `**Count:** ${data.length}\n\n`;
      data.forEach((item, index) => {
        result += `**${index + 1}.**\n`;
        if (typeof item === "object" && item !== null) {
          result += formatObject(item as Record<string, unknown>, "  ");
        } else {
          result += `  ${item}\n`;
        }
        result += "\n";
      });
    } else {
      result += formatObject(data as Record<string, unknown>, "");
    }
  } else {
    result += `${data}\n`;
  }

  return result;
}

function formatObject(obj: Record<string, unknown>, indent: string): string {
  let result = "";

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        result += `${indent}**${key}:** [${value.length} items]\n`;
        if (value.length > 0 && value.length <= 10) {
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              result += `${indent}  ${index}: ${JSON.stringify(item, null, 2).replace(/\n/g, "\n" + indent + "    ")}\n`;
            } else {
              result += `${indent}  ${index}: ${item}\n`;
            }
          });
        }
      } else {
        result += `${indent}**${key}:**\n`;
        result += formatObject(value as Record<string, unknown>, indent + "  ");
      }
    } else {
      result += `${indent}**${key}:** ${value}\n`;
    }
  }

  return result;
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
  };
}

server.tool(
  "list_supported_networks",
  "Lists all configured networks and providers available to this server",
  {},
  async () => {
    try {
      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              buildSupportedNetworksReport(config),
              "Supported Networks and Providers",
            ),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "web3_clientVersion",
  "Returns the current client version",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "web3_clientVersion",
        [],
        network,
      );
      return {
        content: [
          {
            type: "text",
            text: formatResponse(result, "Web3 Client Version"),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "web3_sha3",
  "Returns Keccak-256 hash of the given data",
  {
    data: z.string().describe("Data to hash (hex string starting with 0x)"),
    ...networkSchema,
  },
  async ({ data, network }) => {
    try {
      const result = await makeRPCCall(config, "web3_sha3", [data], network);
      return {
        content: [
          {
            type: "text",
            text: formatResponse(result, "Keccak-256 Hash"),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "eth_blockNumber",
  "Returns the number of the most recent block",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const result = await makeRPCCall(config, "eth_blockNumber", [], network);
      const blockNumber = parseInt(String(result), 16);
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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ address, blockNumber, network }) => {
    try {
      const chain = resolveNetwork(network, config);
      const result = await makeRPCCall(
        config,
        "eth_getBalance",
        [address, blockNumber],
        network,
      );
      const balance = ethers.formatUnits(
        String(result),
        chain.nativeCurrency.decimals,
      );
      const symbolKey = `balance_${chain.nativeCurrency.symbol.toLowerCase()}`;

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                address,
                network: chain.slug,
                balance_wei: result,
                [symbolKey]: balance,
                native_symbol: chain.nativeCurrency.symbol,
                block: blockNumber,
              },
              "Account Balance",
            ),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ address, blockNumber, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_getTransactionCount",
        [address, blockNumber],
        network,
      );
      const nonce = parseInt(String(result), 16);
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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ blockNumber, includeTransactions, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_getBlockByNumber",
        [blockNumber, includeTransactions],
        network,
      );
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

      const block = result as {
        number: string;
        hash: string;
        parentHash: string;
        timestamp: string;
        gasLimit: string;
        gasUsed: string;
        transactions: unknown[];
        baseFeePerGas?: string;
      };

      const blockInfo = {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit,
        gasUsed: block.gasUsed,
        transactionCount: block.transactions.length,
        baseFeePerGas: block.baseFeePerGas,
      };

      return {
        content: [
          {
            type: "text",
            text: formatResponse(blockInfo, "Block Information"),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "eth_getTransactionByHash",
  "Returns the information about a transaction requested by transaction hash",
  {
    txHash: z.string().describe("Transaction hash"),
    ...networkSchema,
  },
  async ({ txHash, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_getTransactionByHash",
        [txHash],
        network,
      );
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
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "eth_getTransactionReceipt",
  "Returns the receipt of a transaction by transaction hash",
  {
    txHash: z.string().describe("Transaction hash"),
    ...networkSchema,
  },
  async ({ txHash, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_getTransactionReceipt",
        [txHash],
        network,
      );
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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ to, data, blockNumber, from, value, gas, gasPrice, network }) => {
    try {
      const txObject: Record<string, string> = { to, data };

      if (from) txObject.from = from;
      if (value) txObject.value = value;
      if (gas) txObject.gas = gas;
      if (gasPrice) txObject.gasPrice = gasPrice;

      const result = await makeRPCCall(
        config,
        "eth_call",
        [txObject, blockNumber],
        network,
      );

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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ to, data, from, value, gas, gasPrice, network }) => {
    try {
      const txObject: Record<string, string> = {};

      if (to) txObject.to = to;
      if (data) txObject.data = data;
      if (from) txObject.from = from;
      if (value) txObject.value = value;
      if (gas) txObject.gas = gas;
      if (gasPrice) txObject.gasPrice = gasPrice;

      const result = await makeRPCCall(
        config,
        "eth_estimateGas",
        [txObject],
        network,
      );
      const gasEstimate = parseInt(String(result), 16);

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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ signedTransactionData, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_sendRawTransaction",
        [signedTransactionData],
        network,
      );

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
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "eth_gasPrice",
  "Returns the current price per gas in wei",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const result = await makeRPCCall(config, "eth_gasPrice", [], network);
      const gasPrice = parseInt(String(result), 16);
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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ address, blockNumber, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_getCode",
        [address, blockNumber],
        network,
      );

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                address,
                code: result,
                code_length: String(result).length,
                block: blockNumber,
              },
              "Contract Code",
            ),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ address, position, blockNumber, network }) => {
    try {
      const result = await makeRPCCall(
        config,
        "eth_getStorageAt",
        [address, position, blockNumber],
        network,
      );

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
    } catch (error) {
      return toolError(error);
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
    ...networkSchema,
  },
  async ({ fromBlock, toBlock, address, topics, network }) => {
    try {
      const filter: Record<string, unknown> = {};

      if (fromBlock) filter.fromBlock = fromBlock;
      if (toBlock) filter.toBlock = toBlock;
      if (address) filter.address = address;
      if (topics) filter.topics = topics;

      const result = (await makeRPCCall(
        config,
        "eth_getLogs",
        [filter],
        network,
      )) as Array<Record<string, unknown>>;

      let logText = `**Event Logs**\n\n`;
      logText += `**Total Logs:** ${result.length}\n`;
      logText += `**Filter:** ${JSON.stringify(filter, null, 2)}\n\n`;

      if (result.length > 0) {
        logText += `**Logs:**\n\n`;
        result.forEach((log, index) => {
          logText += `**Log ${index + 1}:**\n`;
          logText += `  **Address:** ${log.address}\n`;
          logText += `  **Block:** ${log.blockNumber} (${parseInt(String(log.blockNumber), 16)})\n`;
          logText += `  **Transaction:** ${log.transactionHash}\n`;
          logText += `  **Log Index:** ${log.logIndex}\n`;
          const logTopics = log.topics as string[] | undefined;
          logText += `  **Topics:** [${logTopics?.length ?? 0} topics]\n`;
          if (logTopics && logTopics.length > 0) {
            logTopics.forEach((topic, topicIndex) => {
              logText += `    ${topicIndex}: ${topic}\n`;
            });
          }
          if (log.data && log.data !== "0x") {
            logText += `  **Data:** ${log.data}\n`;
          }
          logText += `  **Removed:** ${log.removed}\n\n`;
        });
      } else {
        logText += `No logs found matching the filter criteria.\n`;
      }

      return {
        content: [{ type: "text", text: logText }],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "eth_chainId",
  "Returns the chain ID of the current network",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const chain = resolveNetwork(network, config);
      const result = await makeRPCCall(config, "eth_chainId", [], network);
      const chainId = parseInt(String(result), 16);

      return {
        content: [
          {
            type: "text",
            text: formatResponse(
              {
                chain_id_hex: result,
                chain_id_decimal: chainId,
                chain_name: chain.name,
                network_slug: chain.slug,
              },
              "Network Chain ID",
            ),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "net_version",
  "Returns the current network id",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const result = await makeRPCCall(config, "net_version", [], network);

      return {
        content: [
          {
            type: "text",
            text: formatResponse({ network_id: result }, "Network Version"),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "net_listening",
  "Returns true if client is actively listening for network connections",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const result = await makeRPCCall(config, "net_listening", [], network);

      return {
        content: [
          {
            type: "text",
            text: formatResponse({ is_listening: result }, "Network Status"),
          },
        ],
      };
    } catch (error) {
      return toolError(error);
    }
  },
);

server.tool(
  "net_peerCount",
  "Returns number of peers currently connected to the client",
  { ...networkSchema },
  async ({ network }) => {
    try {
      const result = await makeRPCCall(config, "net_peerCount", [], network);
      const peerCount = parseInt(String(result), 16);

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
    } catch (error) {
      return toolError(error);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EVM MCP Server running on stdio");
  console.error(`Default network: ${config.defaultNetwork}`);
  console.error(
    `Configured providers: ${config.providerOrder.join(", ") || "none"}`,
  );
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
