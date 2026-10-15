#!/usr/bin/env bash
# tools/gemma/stop.sh — stop the broker by its pid. Never Ollama (Josh's Odysseus may be using it); never pkill -f.
set -u
PID_FILE="$HOME/.cache/lambdawaves-gemma/broker.pid"
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  kill "$(cat "$PID_FILE")" && echo "[ok] broker stopped (pid $(cat "$PID_FILE"))"
else
  echo "[ok] no broker running"
fi
rm -f "$PID_FILE"
