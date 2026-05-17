#!/usr/bin/env bash
# Run the job worker as a separate process (for local dev — no Vercel cron needed).
# Polls Postgres every 5s: submits queued jobs, polls processing jobs, uploads results to R2.
#
# Usage:
#   scripts/run-worker.sh          # foreground, Ctrl-C to stop
#   WORKER_INTERVAL_MS=3000 scripts/run-worker.sh   # faster polling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

echo "▶ Starting job worker (polls every ${WORKER_INTERVAL_MS:-5000}ms)…"
echo "  Stop with Ctrl-C"
echo ""

cd "$FRONTEND" && npm run worker
