#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, "..");
const serverPath = join(packagePath, "build", "index.js");

function getClaudeConfigPath() {
  const platform = process.platform;

  if (platform === "darwin") {
    return join(
      homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );
  } else if (platform === "win32") {
    const appData =
      process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(appData, "Claude", "claude_desktop_config.json");
  } else {
    return join(homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

function readConfig() {
  const configPath = getClaudeConfigPath();

  if (!existsSync(configPath)) {
    console.log("Claude config file not found. Creating new config...");

    const configDir = dirname(configPath);
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    return {
      mcpServers: {},
    };
  }

  try {
    const configData = readFileSync(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("Error reading Claude config:", error.message);
    return { mcpServers: {} };
  }
}

function writeConfig(config) {
  const configPath = getClaudeConfigPath();

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log("✓ Claude Desktop configuration updated successfully!");
    console.log(`  Config location: ${configPath}`);
  } catch (error) {
    console.error("Error writing Claude config:", error.message);
  }
}

function buildEnv() {
  const env = {};

  if (process.env.INFURA_API_KEY) {
    env.INFURA_API_KEY = process.env.INFURA_API_KEY;
  }
  if (process.env.ALCHEMY_API_KEY) {
    env.ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  }
  if (process.env.DEFAULT_NETWORK) {
    env.DEFAULT_NETWORK = process.env.DEFAULT_NETWORK;
  } else {
    env.DEFAULT_NETWORK = "ethereum";
  }
  if (process.env.DEFAULT_PROVIDER) {
    env.DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER;
  }
  if (process.env.RPC_PROVIDER_ORDER) {
    env.RPC_PROVIDER_ORDER = process.env.RPC_PROVIDER_ORDER;
  } else {
    env.RPC_PROVIDER_ORDER = "infura,alchemy";
  }
  if (process.env.CUSTOM_PROVIDERS) {
    env.CUSTOM_PROVIDERS = process.env.CUSTOM_PROVIDERS;
  }
  if (process.env.CUSTOM_NETWORKS) {
    env.CUSTOM_NETWORKS = process.env.CUSTOM_NETWORKS;
  }
  if (process.env.KNOWN_ADDRESSES) {
    env.KNOWN_ADDRESSES = process.env.KNOWN_ADDRESSES;
  }
  if (process.env.WALLET_ADDRESSES) {
    env.WALLET_ADDRESSES = process.env.WALLET_ADDRESSES;
  }

  return env;
}

function configureEVM() {
  console.log("🔧 Configuring EVM MCP Server for Claude Desktop...");

  const config = readConfig();
  const env = buildEnv();

  const hasProviderKey =
    env.INFURA_API_KEY || env.ALCHEMY_API_KEY || env.CUSTOM_PROVIDERS;
  const hasCustomNetwork = env.CUSTOM_NETWORKS;

  if (!hasProviderKey && !hasCustomNetwork) {
    console.log("\n⚠️  No provider configuration found.");
    console.log(
      "Please set environment variables before running configure-claude:",
    );
    console.log("  export INFURA_API_KEY=your-infura-key");
    console.log("  export DEFAULT_PROVIDER=infura");
    console.log("  export DEFAULT_NETWORK=ethereum");
    console.log("\nOr configure manually in Claude Desktop settings.");
    console.log(`\nServer path: ${serverPath}`);
    return;
  }

  console.log(`Server path: ${serverPath}`);
  console.log(`Default network: ${env.DEFAULT_NETWORK}`);
  if (env.DEFAULT_PROVIDER) {
    console.log(`Default provider: ${env.DEFAULT_PROVIDER}`);
  }

  if (!existsSync(serverPath)) {
    console.error(
      '\n❌ Server file not found. Please run "npm run build" first.',
    );
    return;
  }

  config.mcpServers = config.mcpServers || {};
  config.mcpServers["evm-mcp"] = {
    command: "node",
    args: [serverPath],
    env,
  };

  writeConfig(config);

  console.log("\n✨ Configuration complete!");
  console.log("Please restart Claude Desktop for changes to take effect.");
}

configureEVM();
