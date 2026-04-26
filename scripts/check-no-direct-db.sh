#!/usr/bin/env bash
# scripts/check-no-direct-db.sh
#
# Fails if any file outside `src/lib/db/` imports a DB driver directly.
# Modules and the rest of the app must consume data through tRPC (`core.*`),
# never by opening their own connections (see docs/MODULAR_SOP.md §7.4).
#
# Allowed only inside `src/lib/db/`: `pg`, `mssql`, `drizzle-orm/postgres-js`,
# `drizzle-orm/node-postgres`, and similar driver packages.
#
# Invoked by lefthook on staged files; can also be run manually with no args.
# Compatible with bash 3.2 (macOS default).

set -eu

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

target_files=""
if [ "$#" -gt 0 ]; then
  for f in "$@"; do
    target_files="${target_files}${f}
"
  done
else
  target_files="$(find src -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null || true)"
fi

# Driver patterns we forbid outside `src/lib/db/`.
PATTERN="from ['\"](pg|mssql|drizzle-orm/(postgres-js|node-postgres|mysql2))['\"]"

violations=""
old_ifs="$IFS"
IFS='
'
for f in $target_files; do
  IFS="$old_ifs"
  case "$f" in
    src/lib/db/*) IFS='
'; continue ;;
    src/*) ;;
    *) IFS='
'; continue ;;
  esac
  hits="$(grep -nE "$PATTERN" "$f" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      violations="${violations}${f}: ${line}
"
    done <<EOF
$hits
EOF
  fi
  IFS='
'
done
IFS="$old_ifs"

if [ -n "$violations" ]; then
  printf '✖ Direct DB driver import outside src/lib/db/ (only the core may open connections):\n' >&2
  printf '%s' "$violations" | sed 's/^/  /' >&2
  printf '\n  Fix: consume the data via a tRPC procedure under core.*.\n' >&2
  exit 1
fi

exit 0
