#!/usr/bin/env bash
# Apply pending Prisma migrations to the dev database.
# Pass --name "description" to create a new named migration.
# With no args, applies any pending migrations.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

cd "$FRONTEND"

if [ $# -eq 0 ]; then
  echo "▶ Applying pending migrations…"
  npx prisma migrate dev
else
  echo "▶ Creating + applying migration: $*"
  npx prisma migrate dev --name "$*"
fi

echo "✓ Migrations applied."
