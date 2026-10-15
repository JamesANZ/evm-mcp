# EVM RPC

Reads EVM chain state and simulates transactions through any JSON-RPC provider the buyer configures. The buyer sets the provider key. This skill does not ship one.

## Connect

```json
{
  "mcpServers": {
    "evm-mcp": {
      "command": "npx",
      "args": ["-y", "@jamesanz/evm-mcp"],
      "env": {
        "INFURA_API_KEY": "set-by-buyer"
      }
    }
  }
}
```

`INFURA_API_KEY` is one built-in preset. Alchemy and a custom RPC URL are documented in the server README.

## Package this listing

```bash
cd agensi-skills
zip -r evm-rpc.zip evm-rpc -x "*.DS_Store"
```

Upload `evm-rpc.zip` in the Agensi creator dashboard. This repository does not submit the listing.
