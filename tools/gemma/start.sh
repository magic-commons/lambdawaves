#!/usr/bin/env bash
# tools/gemma/start.sh — bring Gemma up: the userspace Ollama, the model, the broker (0.6.6 G3). Safe to re-run; skips what is up.
#   tools/gemma/start.sh                          → gemma4:e4b, broker on https://127.0.0.1:9443 (GEMMA_HOST=0.0.0.0 for the LAN; docs/GEMMA.md)
#   GEMMA_MODEL=gemma4:12b tools/gemma/start.sh   (when the stage is light: the RTX 3070's 8 GB is shared with it)
# Stop with tools/gemma/stop.sh (the broker only — Ollama is Josh's and Odysseus may be using it).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
CACHE="$HOME/.cache/lambdawaves-gemma"; mkdir -p "$CACHE"
OLLAMA="$HOME/ollama/bin/ollama"
export GEMMA_MODEL="${GEMMA_MODEL:-gemma4:e4b}" GEMMA_PORT="${GEMMA_PORT:-9443}"

# 1 · the userspace Ollama (the first half of ~/start-odysseus.sh, Josh's own lines)
if curl -fs http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
  echo "[ok] Ollama already running"
else
  echo "[..] starting Ollama (GPU)"
  LD_LIBRARY_PATH="$HOME/ollama/lib/ollama:${LD_LIBRARY_PATH:-}" OLLAMA_HOST=127.0.0.1:11434 \
    nohup "$OLLAMA" serve > "$HOME/ollama/serve.log" 2>&1 &
  echo $! > "$CACHE/ollama.pid"
  for _ in $(seq 1 30); do curl -fs http://127.0.0.1:11434/api/version >/dev/null 2>&1 && break; sleep 0.5; done
  curl -fs http://127.0.0.1:11434/api/version >/dev/null 2>&1 || { echo "[!!] Ollama did not answer on 11434 — see ~/ollama/serve.log"; exit 1; }
  echo "[ok] Ollama started  (log: ~/ollama/serve.log, pid $(cat "$CACHE/ollama.pid"))"
fi

# 2 · the model — the one download, Josh's machine and Josh's word
has() { OLLAMA_HOST=127.0.0.1:11434 "$OLLAMA" list 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "$1"; }
if has "$GEMMA_MODEL"; then
  echo "[ok] $GEMMA_MODEL is pulled"
else
  echo "[..] pulling $GEMMA_MODEL (≈ 5 GB for e4b) — Josh's word 2026-10-15"
  if ! OLLAMA_HOST=127.0.0.1:11434 "$OLLAMA" pull "$GEMMA_MODEL"; then
    if [ "$GEMMA_MODEL" = "gemma4:e4b" ]; then
      echo "[!!] the pull of gemma4:e4b failed — trying gemma4:e2b instead"
      GEMMA_MODEL=gemma4:e2b
      OLLAMA_HOST=127.0.0.1:11434 "$OLLAMA" pull "$GEMMA_MODEL" || { echo "[!!] gemma4:e2b failed too"; exit 1; }
      echo "[ok] running on gemma4:e2b (e4b did not pull)"
    else
      echo "[!!] the pull of $GEMMA_MODEL failed"; exit 1
    fi
  fi
fi

# 2b · warm the model in the background (the first load from disk took 98 s on 2026-10-15; an ask during it would wait). The same
#      num_ctx as the broker's, or Ollama reloads it at the first ask. Ollama frees the card after 5 idle minutes (its keep_alive).
echo "[..] warming $GEMMA_MODEL in the background (a cold first load ≈ 100 s)"
nohup curl -s http://127.0.0.1:11434/api/generate \
  -d "{\"model\":\"$GEMMA_MODEL\",\"options\":{\"num_ctx\":${GEMMA_CTX:-8192}}}" > /dev/null 2>&1 &

# 3 · the broker (stopped by its pid, tools/gemma/stop.sh)
if [ -f "$CACHE/broker.pid" ] && kill -0 "$(cat "$CACHE/broker.pid")" 2>/dev/null; then
  echo "[ok] broker already running (pid $(cat "$CACHE/broker.pid"))"
else
  GEMMA_MODEL="$GEMMA_MODEL" nohup python3 "$HERE/broker.py" > "$CACHE/broker.log" 2>&1 &
  echo $! > "$CACHE/broker.pid"
  for _ in $(seq 1 40); do curl -kfs "https://127.0.0.1:$GEMMA_PORT/health" >/dev/null 2>&1 && break; sleep 0.25; done
  if curl -kfs "https://127.0.0.1:$GEMMA_PORT/health" >/dev/null 2>&1; then
    echo "[ok] broker on https://${GEMMA_HOST:-127.0.0.1}:$GEMMA_PORT/ask  (model $GEMMA_MODEL, pid $(cat "$CACHE/broker.pid"), log $CACHE/broker.log)"
  else
    echo "[!!] the broker did not answer — see $CACHE/broker.log"; tail -5 "$CACHE/broker.log"; rm -f "$CACHE/broker.pid"; exit 1
  fi
fi
