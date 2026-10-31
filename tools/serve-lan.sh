#!/usr/bin/env bash
# tools/serve-lan.sh — the lab for other devices on the same network (a tablet): prints the LAN URL.
#   tools/serve-lan.sh          → https://<this machine's LAN IP>:8710/lab/
#   tools/serve-lan.sh 8711     → another port in the λWAVES range 8700–8799
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$HERE/serve-lan.py" "${1:-8710}"
