#!/usr/bin/env bash
# Copy the static site to your nginx server.
#   website/deploy.sh user@your-server            # dry run: shows what would be copied
#   website/deploy.sh user@your-server --go       # really copy to /var/www/html
#   WEBROOT=/var/www/chaosgone website/deploy.sh user@your-server --go
# Never deletes anything on the server (no rsync --delete), so other sites in the folder are safe.
set -euo pipefail
cd "$(dirname "$0")"

TARGET="${1:-}"; MODE="${2:-}"
WEBROOT="${WEBROOT:-/var/www/html}"
[ -n "$TARGET" ] || { echo "usage: $0 user@server [--go]" >&2; exit 2; }

if grep -rq "chaosgone\.example" public --include='*.html' --include='*.xml' --include='*.txt' && [ -z "${ALLOW_PLACEHOLDER_DOMAIN:-}" ]; then
  echo "Refusing to deploy: the pages still contain the placeholder domain chaosgone.example." >&2
  echo "Run:  python3 website/tools/generate.py https://your-domain.tld" >&2
  exit 1
fi

ARGS=(-avz --chmod=D755,F644 --itemize-changes)
if [ "$MODE" != "--go" ]; then ARGS+=(--dry-run); echo "(dry run, add --go to copy for real)"; fi
rsync "${ARGS[@]}" public/ "$TARGET:$WEBROOT/"
