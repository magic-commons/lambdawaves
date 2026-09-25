#!/usr/bin/env bash
# ab-el.sh — wave 127: one expression file in Electron on two page paths, interleaved A B A B …, each in a fresh window.
#   LW_PORT=8740 bash …/ab-el.sh <expr.js> <tag> <n> <pathA> <pathB>     (paths like /lab/ or /research/…/P127/lab-a/)
set -u; cd "$(dirname "$0")/../../../.."
EXPR=$1; TAG=$2; N=$3; A=$4; B=$5; P=research/optimization-2026-09-24/probes/P127
for i in $(seq 1 "$N"); do
  PRINT=0 timeout 200 node $P/electron-run.mjs "$EXPR" "/tmp/lw127-E-$TAG-a-$i.json" "$A" > /dev/null
  PRINT=0 timeout 200 node $P/electron-run.mjs "$EXPR" "/tmp/lw127-E-$TAG-b-$i.json" "$B" > /dev/null
done
echo "wrote /tmp/lw127-E-$TAG-{a,b}-1..$N.json"
