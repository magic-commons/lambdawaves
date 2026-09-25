#!/usr/bin/env bash
# gpu-variants.sh — wave 127: gpu-open.expr.js once per variant, each in a fresh Electron.   LW_PORT=8740 bash …/gpu-variants.sh out-dir [variants…]
set -u; cd "$(dirname "$0")/../../../.."
OUT=${1:-/tmp/lw127-gv}; shift; mkdir -p "$OUT"
VARS=${*:-full noui nolayout nopalette nomod uionly theme look}
for v in $VARS; do
  printf 'window.__V127=%s;\n' "'$v'" > "$OUT/expr-$v.js"; cat research/optimization-2026-09-24/probes/P127/gpu-open.expr.js >> "$OUT/expr-$v.js"
  PRINT=0 node research/optimization-2026-09-24/probes/P127/electron-run.mjs "$OUT/expr-$v.js" "$OUT/$v.json" /lab/ "${Q:-}" > /dev/null
  node -e "const o=require('$OUT/$v.json'); if(o.error){console.log('$v ERROR',o.error.slice(0,300));process.exit()} console.log(o.V.padEnd(10), 'sync',o.sync,'sl',o.styleLayout,'idle0',o.idleAfterOpen,'pre',o.preDoneMedian+'/'+o.preDoneMax,'maxDone',o.maxDone,'|',o.frames.slice(0,5).map(x=>x.at+':'+(x.rc?'R':'')+(x.pr?'P':'')+':'+x.done).join(' '))"
done
