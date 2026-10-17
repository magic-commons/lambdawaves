#!/usr/bin/env bash
# tools/volumes/long-run-gpu.sh — THE GPU SOLVER beside THE LONG SOLVE (iteration 005 G, research/iteration-005/G-BUILD.md).
# The same catalogue and the same raw/ as the CPU solver (research/iteration-004/V1-BUILD.md "The long run"); the per-molecule flock
# keeps the two apart. The GPU takes the queue from its costliest end (--largest-first), the CPU from its cheapest; they meet once.
#
#   tools/volumes/long-run-gpu.sh start     start it (nohup, niced, 2 CPU threads, CuPy pool ≤ 6 GB); its pid → raw/solver-gpu.pid
#   tools/volumes/long-run-gpu.sh stop      kill -TERM by that pid (never pkill): the rung in flight is not written, the molecule resumes
#   tools/volumes/long-run-gpu.sh status    is it running; STATUS.json's counts; the last GPU lines of raw/solve.log
#
# Nothing starts it but this script; the builder did not.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
DATA=${LW_VOLUMES:-$HOME/Documents/LAMBDAWAVES-VOLUMES}
PY=$HOME/.local/share/lw-volumes/venv/bin/python
CAT=$DATA/catalogue/vol-1.candidates.json
PIDF=$DATA/raw/solver-gpu.pid
alive() { [[ -f $PIDF ]] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

case "${1:-}" in
  start)
    if alive; then echo "already running: pid $(cat "$PIDF")"; exit 1; fi
    cd "$ROOT"
    nohup nice -n 19 "$PY" tools/volumes/solve.py --candidates "$CAT" --gpu --gpu-memory 6 --largest-first --threads 2 --max-memory 6000 \
      >> "$DATA/raw/solve-gpu.out" 2>&1 &
    echo $! > "$PIDF"; echo "started: pid $! (log: raw/solve.log, stdout: raw/solve-gpu.out)" ;;
  stop)
    if ! alive; then echo 'not running'; exit 0; fi
    kill -TERM "$(cat "$PIDF")"; echo "sent TERM to pid $(cat "$PIDF")" ;;
  status)
    if alive; then echo "running: pid $(cat "$PIDF")"; else echo 'not running'; fi
    "$PY" -c "import json,sys; s=json.load(open(sys.argv[1])); print({k: s.get(k) for k in ('queue','done','failed','refused','remaining','etaSeconds')})" "$DATA/raw/STATUS.json"
    grep ' GPU$' "$DATA/raw/solve.log" | tail -n 5 || true ;;
  *) echo "usage: $0 start | stop | status"; exit 2 ;;
esac
