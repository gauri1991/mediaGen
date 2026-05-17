#!/usr/bin/env bash
# Stop any background dev servers started by dev-bg.sh.

PID_FILE="/tmp/mediagen-dev.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "⏹  Stopping dev server (PID $PID)…"
    kill "$PID"
    rm -f "$PID_FILE"
    echo "✓ Stopped."
  else
    echo "ℹ  PID $PID not running. Cleaning up stale PID file."
    rm -f "$PID_FILE"
  fi
else
  echo "ℹ  No PID file found — dev server may not be running."
fi

# Also kill any stray next-server processes on port 3000
STRAY=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$STRAY" ]; then
  echo "⏹  Killing process on port 3000 (PID $STRAY)…"
  kill "$STRAY" 2>/dev/null || true
  echo "✓ Done."
fi
