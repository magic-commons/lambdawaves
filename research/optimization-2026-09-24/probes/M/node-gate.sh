#!/usr/bin/env bash
# node-gate.sh — lane M: run `bash test.sh node`, keep the log, print the verdict in one line.
#   bash research/optimization-2026-09-24/probes/M/node-gate.sh [log]
LOG="${1:-/tmp/lwM-node.log}"
bash test.sh node > "$LOG" 2>&1
RC=$?
SUITES=$(ls tests/*.test.mjs | wc -l)
GREEN=$(grep -cE '^GREEN ' "$LOG")
RED=$(grep -cE '^(RED|FAIL|not ok)' "$LOG")
echo "test.sh node rc=$RC suites=$SUITES green-lines=$GREEN red/fail-lines=$RED log=$LOG"
grep -nE '^(RED|FAIL|not ok)|Error:|AssertionError' "$LOG" | head -20
exit $RC
