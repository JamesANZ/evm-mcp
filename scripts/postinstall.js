#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const CONFIG_FILE_NAME = "claude_desktop_config.json";
const CONFIG_DIR = join(homedir(), "Library", "Application Support", "Claude");
const CONFIG_PATH = join(CONFIG_DIR, CONFIG_FILE_NAME);

// Get the package directory path (this script is in scripts/, so go up one level)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageDir = dirname(__dirname); // Go up from scripts/ to package root

// For local installations, use node with the build path
const MCP_SERVER_CONFIG = {
  mcpServers: {
    "evm-mcp": {
      command: "node",
      args: [join(packageDir, "build", "index.js")],
      env: {
        // Set INFURA_API_KEY, DEFAULT_NETWORK, DEFAULT_PROVIDER, etc.
        // Run 'npm run configure-claude' to configure automatically
      },
    },
  },
};

function createClaudeConfig() {
  try {
    console.log("🔧 Configuring Claude Desktop for evm-mcp...");

    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
      console.log(`📁 Created Claude config directory: ${CONFIG_DIR}`);
    }

    let existingConfig = {};

    // Read existing config if it exists
    if (existsSync(CONFIG_PATH)) {
      try {
        const configContent = readFileSync(CONFIG_PATH, "utf8");
        existingConfig = JSON.parse(configContent);
        console.log("📖 Found existing Claude Desktop configuration");
      } catch (error) {
        console.log("⚠️  Could not parse existing config, creating new one");
        existingConfig = {};
      }
    }

    // Merge with existing MCP servers
    const mergedConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...MCP_SERVER_CONFIG.mcpServers,
      },
    };

    // Write the updated config
    writeFileSync(CONFIG_PATH, JSON.stringify(mergedConfig, null, 2));

    console.log("✅ Successfully configured Claude Desktop!");
    console.log(`📄 Config file: ${CONFIG_PATH}`);
    console.log("🔄 Please restart Claude Desktop to use the evm-mcp server");
    console.log("");
    console.log(
      "⚠️  Note: Set INFURA_API_KEY (or CUSTOM_PROVIDERS / CUSTOM_NETWORKS) in env.",
    );
    console.log(
      "   Run 'npm run configure-claude' to configure these automatically,",
    );
    console.log("   or set them manually in Claude Desktop settings.");
  } catch (error) {
    console.error("❌ Error configuring Claude Desktop:", error.message);
    console.log("");
    console.log("🔧 Manual configuration:");
    console.log("1. Open Claude Desktop");
    console.log("2. Go to Settings > Developer");
    console.log("3. Add MCP server:");
    console.log("   Name: evm-mcp");
    console.log("   Command: node");
    console.log(`   Args: [\"${join(packageDir, "build", "index.js")}\"]`);
    console.log("   Environment Variables:");
    console.log("     INFURA_API_KEY: your-infura-api-key");
    console.log("     DEFAULT_NETWORK: ethereum");
    console.log("     DEFAULT_PROVIDER: infura");
    console.log("4. Restart Claude Desktop");
    process.exit(1);
  }
}

// Only run if this is a postinstall script
if (process.env.npm_lifecycle_event === "postinstall") {
  createClaudeConfig();
}
