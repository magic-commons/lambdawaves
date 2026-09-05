#!/usr/bin/env bash
# serve-lan.sh — the lab for other devices on the same network (iPad): prints the LAN URL.
#   ./serve-lan.sh          → https://<this machine's LAN IP>:8710/lab/
#   ./serve-lan.sh 8711     → another port in the λWAVES range 8700–8799
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
export MB_CERTS="${MB_CERTS:-$HOME/mandelbrot/certs}"
exec python3 "$HERE/serve-lan.py" "${1:-8710}"
