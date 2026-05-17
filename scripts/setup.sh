#!/usr/bin/env bash
# First-time project setup: install deps, generate Prisma client.
# Does NOT run migrations (use migrate.sh for that).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

echo "▶ Installing frontend dependencies…"
cd "$FRONTEND"
npm install

echo "▶ Generating Prisma client…"
npx prisma generate

echo ""
echo "✓ Setup complete."
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in DATABASE_URL, BETTER_AUTH_SECRET, etc."
echo "  2. Run: scripts/migrate.sh   (apply DB migrations)"
echo "  3. Run: scripts/dev.sh       (start dev server)"
