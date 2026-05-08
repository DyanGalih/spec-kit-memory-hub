#!/usr/bin/env bash
# test-root-resolution.sh — Verify that the CLI finds the project root from subdirectories.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(dirname "$SCRIPT_DIR")"
TMP_PROJECT=$(mktemp -d)

cleanup() {
  rm -rf "$TMP_PROJECT"
}
trap cleanup EXIT

echo "Building CLI..."
(cd "$HUB_ROOT" && npm run build >/dev/null)

echo "Preparing mock project..."
mkdir -p "$TMP_PROJECT/.specify/extensions/memory-md"
echo "memory_root: docs/memory" > "$TMP_PROJECT/.specify/extensions/memory-md/config.yml"
mkdir -p "$TMP_PROJECT/docs/memory"
echo "# Index" > "$TMP_PROJECT/docs/memory/INDEX.md"
mkdir -p "$TMP_PROJECT/specs/my-feature"
echo "# Spec" > "$TMP_PROJECT/specs/my-feature/spec.md"

# Run from a deep subdirectory (simulating extension in node_modules) WITHOUT --project-root
echo "Testing resolution from deep extension subdirectory..."
mkdir -p "$TMP_PROJECT/node_modules/speckit-memory/dist/bin"
cd "$TMP_PROJECT/node_modules/speckit-memory/dist/bin"

OUTPUT=$(node "$HUB_ROOT/dist/bin/speckit-memory.js" index-memory 2>&1)
echo "$OUTPUT"

if [[ "$OUTPUT" == *"Indexing memory files..."* ]]; then
  echo "✅ Successfully started indexing from deep subdirectory."
else
  echo "❌ Failed to resolve project root from deep subdirectory."
  exit 1
fi

# Verify rebuild-memory works and uses the correct DB path
echo "Testing rebuild-memory from subdirectory..."
OUTPUT_REBUILD=$(node "$HUB_ROOT/dist/bin/speckit-memory.js" rebuild-memory 2>&1)
echo "$OUTPUT_REBUILD"

if [[ "$OUTPUT_REBUILD" == *"Rebuilding memory cache..."* ]]; then
  echo "✅ Successfully started rebuild from subdirectory."
else
  echo "❌ Failed to resolve project root for rebuild-memory."
  exit 1
fi

# Verify the SQLite DB was created in the project root, not in the current dir
if [ -f "$TMP_PROJECT/.spec-kit-memory/memory.sqlite" ]; then
  echo "✅ SQLite database created in project root."
else
  echo "❌ SQLite database NOT found in project root."
  exit 1
fi

# Verify token-report works from subdirectory
echo "Testing token-report from subdirectory..."
cd "$TMP_PROJECT/node_modules/speckit-memory"
OUTPUT_REPORT=$(node "$HUB_ROOT/dist/bin/speckit-memory.js" token-report --feature specs/my-feature 2>&1)
echo "$OUTPUT_REPORT"

if [[ "$OUTPUT_REPORT" == *"Token report for specs/my-feature"* ]]; then
  echo "✅ token-report correctly resolved feature path relative to found root."
else
  echo "❌ token-report failed to resolve root or feature."
  exit 1
fi

echo "Root resolution test passed."
