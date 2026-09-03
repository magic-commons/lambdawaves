#!/usr/bin/env bash
# test.sh — the two proofs.  The node proof needs nothing; the browser proof starts its own
# HTTPS server (port 8701) and headless Firefox (geckodriver port 5202) and stops them after.
#   ./test.sh          both
#   ./test.sh node     node only
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
node tests/hydrogen.test.mjs; NODE_RC=$?
node tests/frontier.test.mjs; FR_RC=$?
node tests/dynamics.test.mjs; DY_RC=$?
node tests/fields.test.mjs; FD_RC=$?
node tests/rotor4.test.mjs; R4_RC=$?
node tests/qcd.test.mjs; QC_RC=$?
node tests/momentum.test.mjs; MO_RC=$?
node tests/kick.test.mjs; KI_RC=$?
NODE_RC=$(( NODE_RC || FR_RC || DY_RC || FD_RC || R4_RC || QC_RC || MO_RC || KI_RC ))
[ "${1:-}" = "node" ] && exit $NODE_RC
PORT="${LW_PORT:-8701}"
export MB_CERTS="${MB_CERTS:-$HOME/mandelbrot/certs}"
python3 "/home/joshua-hosain/Documents/MANDELBROT APP/project/mbgate/server2.py" "$HERE" "$PORT" > /dev/null 2>&1 &
SRV=$!
sleep 1
LW_PORT="$PORT" GD_PORT="${GD_PORT:-5202}" node tests/boot.browser-test.mjs; BR_RC=$?
kill "$SRV" 2>/dev/null
echo "node: $NODE_RC   browser: $BR_RC"
exit $(( NODE_RC || BR_RC ))
