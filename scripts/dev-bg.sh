#!/usr/bin/env bash
# Start the Next.js dev server in the background.
# PID is written to /tmp/mediagen-dev.pid so stop.sh can kill it.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"
PID_FILE="/tmp/mediagen-dev.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "✓ Dev server already running (PID $(cat "$PID_FILE"))"
  exit 0
fi

echo "▶ Starting Next.js dev server in background…"
cd "$FRONTEND"
nohup npm run dev > /tmp/mediagen-dev.log 2>&1 &
echo $! > "$PID_FILE"
echo "✓ Started (PID $!). Logs: /tmp/mediagen-dev.log"
echo "  Stop with: scripts/stop.sh"
