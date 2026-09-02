#!/usr/bin/env bash
# serve.sh — serve the lab over HTTPS (self-signed) and print the URL.
#   ./serve.sh            → https://127.0.0.1:8700/lab/
#   ./serve.sh 8712       → another port in the λWAVES range 8700–8799
# Uses the MANDELBROT kit's static HTTPS server and its cert pair (MB_CERTS overrides the cert dir).
set -euo pipefail
PORT="${1:-8700}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SERVER="/home/joshua-hosain/Documents/MANDELBROT APP/project/mbgate/server2.py"
export MB_CERTS="${MB_CERTS:-$HOME/mandelbrot/certs}"
echo "λWAVES · QWAVE-0 → https://127.0.0.1:${PORT}/lab/   (ctrl-c stops the server)"
exec python3 "$SERVER" "$HERE" "$PORT"
