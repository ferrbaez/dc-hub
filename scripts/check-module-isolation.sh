#!/usr/bin/env bash
# scripts/check-module-isolation.sh
#
# Fails if a file under `src/modules/<area>/<modulo>/` imports from another
# module's folder. Modules are siloed by design (see docs/MODULAR_SOP.md §4).
#
# Allowed in modules: imports from `@/lib/...`, `@/components/...`,
#   `@/server/...`, `@/schema/...`, third-party packages, and from the
#   module's OWN sibling files (./, ../).
#
# Disallowed: any import path that names another module folder.
#
# Invoked by lefthook on staged files; can also be run manually with no args
# to scan everything. Compatible with bash 3.2 (macOS default).

set -eu

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Build target list. If args were passed by lefthook, use them; else scan.
target_files=""
if [ "$#" -gt 0 ]; then
  for f in "$@"; do
    target_files="${target_files}${f}
"
  done
else
  target_files="$(find src/modules -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null || true)"
fi

violations=""
old_ifs="$IFS"
IFS='
'
for f in $target_files; do
  IFS="$old_ifs"
  case "$f" in
    src/modules/*) ;;
    *) IFS='
'; continue ;;
  esac
  # Extract this file's module path: src/modules/<area>/<modulo>/...
  rel="${f#src/modules/}"
  area="${rel%%/*}"
  rest="${rel#*/}"
  modulo="${rest%%/*}"
  own="@/modules/${area}/${modulo}"

  # Find any `from "@/modules/..."` that isn't the file's own module.
  hits="$(grep -nE "from ['\"]@/modules/" "$f" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      case "$line" in
        *"$own"*) ;;
        *) violations="${violations}${f}: ${line}
" ;;
      esac
    done <<EOF
$hits
EOF
  fi
  IFS='
'
done
IFS="$old_ifs"

if [ -n "$violations" ]; then
  printf '✖ Cross-module imports detected (modules must be self-contained):\n' >&2
  printf '%s' "$violations" | sed 's/^/  /' >&2
  printf '\n  Fix: import shared code from @/lib, @/components, @/server, or\n       request the dependency via docs/core-requests/.\n' >&2
  exit 1
fi

exit 0
