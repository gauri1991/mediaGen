#!/usr/bin/env bash
# Start the Next.js dev server (foreground).
# Run from anywhere in the project.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

echo "▶ Starting Next.js dev server at http://localhost:3000"
cd "$FRONTEND" && npm run dev
