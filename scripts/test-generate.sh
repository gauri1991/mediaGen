#!/usr/bin/env bash
# Submit a test generation job end-to-end.
# Requires REPLICATE_API_TOKEN set in frontend/.env
#
# Usage:
#   scripts/test-generate.sh
#   scripts/test-generate.sh --model flux-schnell --prompt "a red panda"
#   scripts/test-generate.sh --model musicgen --prompt "ambient lo-fi beats"
#   scripts/test-generate.sh --model flux-dev --provider akashml --prompt "a cat"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$SCRIPT_DIR/../frontend"

cd "$FRONTEND" && npm run test:generate -- "$@"
