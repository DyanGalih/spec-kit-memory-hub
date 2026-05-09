#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: ./scripts/install-into-project.sh <hub_repo_path> <target_project_path>"
  exit 1
fi

HUB_ROOT="$1"
TARGET_ROOT="$2"

mkdir -p "$TARGET_ROOT/docs/memory"
mkdir -p "$TARGET_ROOT/specs"
mkdir -p "$TARGET_ROOT/.github"
mkdir -p "$TARGET_ROOT/.specify/memory"

copy_if_missing() {
  SRC="$1"
  DST="$2"
  if [ ! -e "$DST" ]; then
    # Create parent dir if missing
    mkdir -p "$(dirname "$DST")"
    cp "$SRC" "$DST"
    echo "[added] $DST"
  else
    echo "[kept]  $DST"
  fi
}

copy_if_missing "$HUB_ROOT/templates/.github/copilot-instructions.md" "$TARGET_ROOT/.github/copilot-instructions.md"
copy_if_missing "$HUB_ROOT/templates/.specify/memory/workflow.md" "$TARGET_ROOT/.specify/memory/workflow.md"

# Optional agent context files
for f in AGENTS.md CLAUDE.md GEMINI.md WINDSURF.md; do
  if [ -f "$HUB_ROOT/templates/$f" ]; then
    copy_if_missing "$HUB_ROOT/templates/$f" "$TARGET_ROOT/$f"
  fi
done
copy_if_missing "$HUB_ROOT/config-template.yml" "$TARGET_ROOT/config-template.yml"

for f in INDEX.md PROJECT_CONTEXT.md ARCHITECTURE.md DECISIONS.md BUGS.md WORKLOG.md; do
  copy_if_missing "$HUB_ROOT/templates/docs/memory/$f" "$TARGET_ROOT/docs/memory/$f"
done

mkdir -p "$TARGET_ROOT/specs/001-example-feature"
for f in spec.md plan.md tasks.md memory.md memory-synthesis.md; do
  copy_if_missing "$HUB_ROOT/templates/specs/001-example-feature/$f" "$TARGET_ROOT/specs/001-example-feature/$f"
done

copy_if_missing "$HUB_ROOT/templates/specs/README.md" "$TARGET_ROOT/specs/README.md"

echo
echo "Project starter installed."
echo "Next steps:"
echo "1. Customize docs/memory/PROJECT_CONTEXT.md"
echo "2. Add compact routing rows to docs/memory/INDEX.md"
echo "3. Customize docs/memory/ARCHITECTURE.md"
echo "4. Create your first spec folder in specs/"
