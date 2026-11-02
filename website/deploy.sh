#!/usr/bin/env bash
# Publish the static site into the nginx web root. No build, no rsync: the finished HTML is in website/public.
#
#   On the server, with the repo checked out there:   website/deploy.sh --go
#   From your laptop over scp:                        website/deploy.sh user@your-server --go
#
# Without --go it only lists what would be copied. Files are overwritten; nothing is ever deleted.
# WEBROOT (default /var/www/html) can be changed: WEBROOT=/var/www/chaosgone website/deploy.sh --go
# On the server `sudo` is used when you cannot write to the web root; over scp the user needs write access
# (once: `sudo chown -R user /var/www/html`).
set -euo pipefail
cd "$(dirname "$0")"

TARGET=""; GO=""
for a in "$@"; do
  case "$a" in
    --go) GO=1 ;;
    -*) echo "unknown option: $a (usage: $0 [user@server] [--go])" >&2; exit 2 ;;
    *) TARGET="$a" ;;
  esac
done
WEBROOT="${WEBROOT:-/var/www/html}"

if grep -rq "chaosgone\.example" public --include='*.html' --include='*.xml' --include='*.txt' && [ -z "${ALLOW_PLACEHOLDER_DOMAIN:-}" ]; then
  echo "Refusing to deploy: the pages still contain the placeholder domain chaosgone.example." >&2
  echo "Run:  python3 website/tools/generate.py https://your-domain.tld" >&2
  exit 1
fi

# If the footer links to the legal pages, they must exist and be filled in.
if grep -q 'href="/impressum.html"' public/index.html; then
  for f in impressum datenschutz; do
    [ -f "public/$f.html" ] || { echo "Refusing to deploy: the footer links to /$f.html but public/$f.html is missing (see legal-templates/)." >&2; exit 1; }
    if grep -qE '\[(Vorname Nachname|Straße Hausnummer|PLZ Ort|Land|name@beispiel\.de|Anzahl|Name und Sitz|zuständige Aufsichtsbehörde)' "public/$f.html"; then
      echo "Refusing to deploy: public/$f.html still contains [placeholders]." >&2; exit 1
    fi
  done
fi

ENTRIES=(public/*)
NAMES=("${ENTRIES[@]#public/}")
printf -v NAMELIST '%q ' "${NAMES[@]}"

if [ -z "$GO" ]; then
  echo "(dry run, add --go to copy for real) These files would go to ${TARGET:+$TARGET:}$WEBROOT/"
  (cd public && find . -type f | sort | sed 's#^\./#  #')
  exit 0
fi

if [ -z "$TARGET" ]; then
  # Local mode: we are on the web server.
  SUDO=""; [ -w "$WEBROOT" ] || SUDO="sudo"
  $SUDO mkdir -p "$WEBROOT"
  $SUDO cp -r "${ENTRIES[@]}" "$WEBROOT/"
  # make sure nginx (another user) can read everything we copied, whatever the umask was
  (cd "$WEBROOT" && $SUDO chmod -R u+rwX,go+rX -- "${NAMES[@]}")
  echo "Done: copied ${#NAMES[@]} entries to $WEBROOT"
else
  scp -rC "${ENTRIES[@]}" "$TARGET:$WEBROOT/"
  # scp keeps whatever permissions your local umask gave; make sure nginx can read what we copied
  ssh "$TARGET" "cd '$WEBROOT' && chmod -R u+rwX,go+rX -- $NAMELIST"
  echo "Done: copied to $TARGET:$WEBROOT"
fi
