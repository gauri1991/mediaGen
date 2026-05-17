#!/usr/bin/env bash
# Run TypeScript type check and ESLint on the frontend.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

cd "$FRONTEND"

echo "▶ TypeScript…"
npx tsc --noEmit

echo "▶ ESLint…"
npm run lint

echo "✓ All checks passed."
