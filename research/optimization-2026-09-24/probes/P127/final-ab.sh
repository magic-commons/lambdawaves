#!/usr/bin/env bash
# final-ab.sh — wave 127: the device report's PROJECT OPEN scene on the base tree (port 8741, 416ac2c) and this tree (8740),
# interleaved: headless Firefox (probes/PROJECT/project-open.mjs) and Electron/RTX (probes/PROJECT/electron-project.expr.js).
#   bash …/final-ab.sh <n> [ff|el|both]
set -u; cd "$(dirname "$0")/../../../.."
N=${1:-3}; WHAT=${2:-both}; P=research/optimization-2026-09-24/probes
for i in $(seq 1 "$N"); do
  for side in base:8741 new:8740; do
    tag=${side%%:*}; port=${side##*:}
    if [ "$WHAT" != el ]; then LW_PORT=$port GD_PORT=5253 timeout 300 node $P/PROJECT/project-open.mjs "/tmp/lw127-F-ff-$tag-$i.json" > /dev/null 2>&1; fi
    if [ "$WHAT" != ff ]; then LW_PORT=$port PRINT=0 timeout 300 node $P/P127/electron-run.mjs $P/PROJECT/electron-project.expr.js "/tmp/lw127-F-el-$tag-$i.json" > /dev/null 2>&1; fi
  done
done
echo done
