#!/usr/bin/env bash
# DROP and re-create all tables, re-apply all migrations from scratch.
# WARNING: destroys all data. Dev only.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

echo "⚠️  This will DELETE all data in the dev database."
read -r -p "Type 'yes' to continue: " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

cd "$FRONTEND"
echo "▶ Resetting database…"
npx prisma migrate reset --force
echo "✓ Database reset and all migrations re-applied."
