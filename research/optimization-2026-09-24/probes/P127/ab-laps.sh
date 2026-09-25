#!/usr/bin/env bash
# ab-laps.sh — wave 127: laps.expr.js on two instrumented copies, interleaved A B A B …, then the median of every lap.
#   LW_PORT=8740 GD_PORT=5253 bash …/ab-laps.sh <tag> <n> [dirA=lab-a] [dirB=lab-b]
set -u; cd "$(dirname "$0")/../../../.."
TAG=${1:-ab}; N=${2:-5}; A=${3:-lab-a}; B=${4:-lab-b}; P=research/optimization-2026-09-24/probes/P127
for i in $(seq 1 "$N"); do
  for d in "$A" "$B"; do
    PRINT=0 timeout 200 node $P/ff-run.mjs $P/laps.expr.js "/tmp/lw127-L-$TAG-$d-$i.json" "/$P/$d/" > /dev/null
  done
done
for d in "$A" "$B"; do echo "== $d"; MIN=${MIN:-0.8} node $P/laps-agg.mjs $(ls /tmp/lw127-L-$TAG-$d-*.json); done
