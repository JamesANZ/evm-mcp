#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$ROOT/build/index.js"

if [[ ! -f "$SERVER" ]]; then
  echo "Build the server first: npm run build" >&2
  exit 1
fi

if [[ -z "${INFURA_API_KEY:-}" ]]; then
  echo "INFURA_API_KEY is required for smoke test" >&2
  exit 1
fi

export DEFAULT_NETWORK="${DEFAULT_NETWORK:-ethereum}"
export DEFAULT_PROVIDER="${DEFAULT_PROVIDER:-infura}"
export RPC_PROVIDER_ORDER="${RPC_PROVIDER_ORDER:-infura}"

send() {
  node -e "process.stdout.write(JSON.stringify($1) + '\n')"
}

FIFO=$(mktemp -u)
mkfifo "$FIFO"
trap 'rm -f "$FIFO"' EXIT

node "$SERVER" < "$FIFO" &
PID=$!
exec 3>"$FIFO"

send '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"1.0.0"}}}' >&3
sleep 1
send '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}' >&3
send '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_supported_networks","arguments":{}}}' >&3
send '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"eth_chainId","arguments":{}}}' >&3
send '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"eth_chainId","arguments":{"network":"polygon"}}}' >&3

sleep 5
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

echo "Smoke test commands sent to MCP server (check stderr output above)."
