#!/usr/bin/env bash
# Seed the dev database with one test generation per modality.
# Safe to re-run — clears previous seed rows first.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

echo "▶ Seeding database…"
cd "$FRONTEND" && npm run db:seed
