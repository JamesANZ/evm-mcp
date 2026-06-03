#!/usr/bin/env node

/**
 * Generate a Cursor MCP install deeplink for evm-mcp
 *
 * Usage: node scripts/generate-cursor-install-link.js
 */

const config = {
  "evm-mcp": {
    command: "npx",
    args: ["-y", "@jamesanz/evm-mcp"],
  },
};

// Convert to JSON string and Base64 encode
const configString = JSON.stringify(config);
const base64Config = Buffer.from(configString).toString("base64");

// Create the deeplink
const deeplink = `cursor://anysphere.cursor-deeplink/mcp/install?name=evm-mcp&config=${base64Config}`;

console.log("\n🔗 Cursor MCP Install Link:\n");
console.log(deeplink);
console.log("\n📋 Configuration:\n");
console.log(JSON.stringify(config, null, 2));
console.log(
  "\n💡 Note: You will need to configure your RPC endpoint in Cursor settings after installation.\n",
);
