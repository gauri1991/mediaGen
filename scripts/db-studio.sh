#!/usr/bin/env bash
# Open Prisma Studio — a visual database browser.
# Runs at http://localhost:5555

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

echo "▶ Opening Prisma Studio at http://localhost:5555"
cd "$FRONTEND" && npx prisma studio
