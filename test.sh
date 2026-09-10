#!/usr/bin/env bash
# Run all Node suites, the real Firefox gate, or both. No npm dependencies.
#   all      node suites, then every tests/*.browser-test.mjs against one owned HTTPS server (the default)
#   node     the maths and the file laws only
#   browser  the browser suites only
#   legacy   tests/legacy/boot.browser-test.mjs — the historical wave-by-wave gate (waves 1–143). It asserts
#            UI laws that later waves superseded and is NOT part of the shipped gate; run it when reviving a law.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
MODE="${1:-all}"
case "$MODE" in all|node|browser|legacy) ;; *) echo "Usage: $0 [all|node|browser|legacy]" >&2; exit 2 ;; esac
NODE_RC=0
if [ "$MODE" = all ] || [ "$MODE" = node ]; then
  # Discover suites so adding a regression cannot silently leave it out of the gate.
  # Keep PWA integrity last; no gate may repair source files as a side effect.
  for suite in tests/*.test.mjs; do
    [ "$suite" = tests/pwa.test.mjs ] && continue
    node "$suite" || NODE_RC=1
  done
  node tests/pwa.test.mjs || NODE_RC=1
fi
[ "$MODE" = node ] && exit "$NODE_RC"

mkdir -p .tmp
PORT="${LW_PORT:-8701}"
SERVER_LOG="$(mktemp "$HERE/.tmp/gate-server.XXXXXX")"
SRV=''
cleanup() {
  if [ -n "$SRV" ]; then
    kill "$SRV" 2>/dev/null || true
    wait "$SRV" 2>/dev/null || true
  fi
  rm -f "$SERVER_LOG"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
python3 "$HERE/tools/gate/server.py" "$HERE" "$PORT" > "$SERVER_LOG" 2>&1 &
SRV=$!
READY=0
for ((attempt=0; attempt<100; attempt++)); do
  if ! kill -0 "$SRV" 2>/dev/null; then break; fi
  # The server prints this only after binding and configuring TLS. An occupied
  # port must fail here, never run the browser against someone else's checkout.
  if grep -q '^λWAVES gate server on ' "$SERVER_LOG"; then READY=1; break; fi
  sleep 0.1
done
if [ "$READY" != 1 ]; then
  cat "$SERVER_LOG" >&2
  echo "Browser gate server failed to start on port $PORT" >&2
  exit 1
fi
BR_RC=0
if [ "$MODE" = legacy ]; then
  LW_PORT="$PORT" GD_PORT="${GD_PORT:-5202}" node tests/legacy/boot.browser-test.mjs || BR_RC=1
else
  # Discover the browser suites the same way the node suites are discovered: a new file cannot be left out.
  for suite in tests/*.browser-test.mjs; do
    LW_PORT="$PORT" GD_PORT="${GD_PORT:-5202}" node "$suite" || BR_RC=1
  done
fi
echo "node: $([ "$MODE" = all ] && echo "$NODE_RC" || echo skipped)   browser: $BR_RC"
exit $(( NODE_RC || BR_RC ))
