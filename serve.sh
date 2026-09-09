#!/usr/bin/env bash
# serve.sh — serve the lab over HTTPS (self-signed) and print the URL.
#   ./serve.sh            → https://127.0.0.1:8700/lab/
#   ./serve.sh 8712       → another port in the λWAVES range 8700–8799
# Uses the VENDORED static HTTPS server, tools/gate/server.py, which makes its own self-signed pair in
# .certs/ on first run (LW_CERTS overrides the cert dir). Wave 106: the repo stands alone.
set -euo pipefail
PORT="${1:-8700}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SERVER="$HERE/tools/gate/server.py"
HOST="${LW_HOST:-127.0.0.1}"
echo "λWAVES · QWAVE-0 → https://${HOST}:${PORT}/lab/   (ctrl-c stops the server)"
exec python3 "$SERVER" "$HERE" "$PORT"
