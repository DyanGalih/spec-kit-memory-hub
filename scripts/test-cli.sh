#!/usr/bin/env bash
# test-cli.sh — Smoke test for the local SQLite optimizer CLI.
#
# Usage:
#   ./scripts/test-cli.sh
#
# Builds the CLI, creates a temporary project with memory templates, then
# exercises the Phase 1 commands against that project root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(dirname "$SCRIPT_DIR")"
TMP_PROJECT=$(mktemp -d)

cleanup() {
  rm -rf "$TMP_PROJECT"
}
trap cleanup EXIT

echo ""
echo "Building CLI..."
(cd "$HUB_ROOT" && npm run build >/dev/null)

echo ""
echo "Preparing temp project..."
"$HUB_ROOT/scripts/install-into-project.sh" "$HUB_ROOT" "$TMP_PROJECT" >/dev/null

echo ""
echo "Smoke testing CLI..."
node "$HUB_ROOT/dist/bin/speckit-memory.js" --project-root "$TMP_PROJECT" index-memory >/dev/null
node "$HUB_ROOT/dist/bin/speckit-memory.js" --project-root "$TMP_PROJECT" search-memory decisions >/dev/null
node "$HUB_ROOT/dist/bin/speckit-memory.js" --project-root "$TMP_PROJECT" synthesize --feature "$TMP_PROJECT/specs/001-example-feature" >/dev/null
node "$HUB_ROOT/dist/bin/speckit-memory.js" --project-root "$TMP_PROJECT" refresh-memory >/dev/null
node "$HUB_ROOT/dist/bin/speckit-memory.js" --project-root "$TMP_PROJECT" audit-memory >/dev/null
node "$HUB_ROOT/dist/bin/speckit-memory.js" --project-root "$TMP_PROJECT" token-report --feature "$TMP_PROJECT/specs/001-example-feature" >/dev/null

echo "CLI smoke test passed."
