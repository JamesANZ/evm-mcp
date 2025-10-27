#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '..');
const serverPath = join(packagePath, 'build', 'index.js');

function getClaudeConfigPath() {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS
    return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'win32') {
    // Windows
    const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux
    return join(homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  }
}

function readConfig() {
  const configPath = getClaudeConfigPath();
  
  if (!existsSync(configPath)) {
    console.log('Claude config file not found. Creating new config...');
    
    // Create directory if it doesn't exist
    const configDir = dirname(configPath);
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    return {
      mcpServers: {}
    };
  }
  
  try {
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading Claude config:', error.message);
    return { mcpServers: {} };
  }
}

function writeConfig(config) {
  const configPath = getClaudeConfigPath();
  
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✓ Claude Desktop configuration updated successfully!');
    console.log(`  Config location: ${configPath}`);
  } catch (error) {
    console.error('Error writing Claude config:', error.message);
  }
}

function configureEVM() {
  console.log('🔧 Configuring EVM MCP Server for Claude Desktop...');
  
  const config = readConfig();
  
  // Get RPC URL from environment or prompt
  const rpcUrl = process.env.RPC_URL || process.env.ETHEREUM_RPC_URL;
  const chainId = process.env.CHAIN_ID || '1';
  
  if (!rpcUrl) {
    console.log('\n⚠️  No RPC_URL environment variable found.');
    console.log('Please set your RPC URL as an environment variable:');
    console.log('  export RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY');
    console.log('  export CHAIN_ID=1');
    console.log('\nOr configure it manually in Claude Desktop settings.');
    console.log(`\nServer path: ${serverPath}`);
    return;
  }
  
  console.log(`Server path: ${serverPath}`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Chain ID: ${chainId}`);
  
  // Check if server file exists
  if (!existsSync(serverPath)) {
    console.error('\n❌ Server file not found. Please run "npm run build" first.');
    return;
  }
  
  // Configure the server
  config.mcpServers = config.mcpServers || {};
  config.mcpServers['evm-mcp'] = {
    command: 'node',
    args: [serverPath],
    env: {
      RPC_URL: rpcUrl,
      CHAIN_ID: chainId
    }
  };
  
  writeConfig(config);
  
  console.log('\n✨ Configuration complete!');
  console.log('Please restart Claude Desktop for changes to take effect.');
  console.log('\nTo configure manually, use these settings:');
  console.log(`Command: node ${serverPath}`);
  console.log(`Environment Variables:`);
  console.log(`  RPC_URL: ${rpcUrl}`);
  console.log(`  CHAIN_ID: ${chainId}`);
}

// Run configuration
configureEVM();
