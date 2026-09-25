#!/usr/bin/env bash
# run-baseline.sh — the two baselines in sequence (they share the GPU): Firefox (GPU + main thread), then Electron (compositor).
set -u; cd "$(dirname "$0")/../.."
LW_PORT=${LW_PORT:-8721} GD_PORT=${GD_PORT:-5221} node tools/perf/bench-firefox.mjs research/optimization-2026-09-24/baseline-firefox.json > research/optimization-2026-09-24/baseline-firefox.log 2>&1; echo "firefox exit $?"
LW_PORT=${LW_PORT:-8721} node tools/perf/bench-chromium.mjs research/optimization-2026-09-24/baseline-chromium.json > research/optimization-2026-09-24/baseline-chromium.log 2>&1; echo "chromium exit $?"
