#!/usr/bin/env bash
# tools/serve.sh — serve the lab over HTTPS (self-signed) and print the URL.
#   tools/serve.sh            → https://127.0.0.1:8700/lab/
#   tools/serve.sh 8712       → another port in the λWAVES range 8700–8799
# Uses the vendored static HTTPS server, tools/gate/server.py, which makes its own self-signed pair on first run
# (LW_CERTS overrides the certificate directory). The repository stands alone.
set -euo pipefail
PORT="${1:-8700}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$ROOT/tools/gate/server.py"
HOST="${LW_HOST:-127.0.0.1}"
echo "λWAVES → https://${HOST}:${PORT}/lab/   (ctrl-c stops the server)"
exec python3 "$SERVER" "$ROOT" "$PORT"
