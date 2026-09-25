#!/usr/bin/env bash
# gate-browser.sh — wave 127: the browser suites the project open touches, on LW_PORT/GD_PORT.   bash …/gate-browser.sh <tag> [suite…]
set -u; cd "$(dirname "$0")/../../../.."
TAG=${1:-run}; shift
SUITES=${*:-current molecular-names render-regressions official-defaults-palette}
RC=0
for s in $SUITES; do
  LW_PORT=${LW_PORT:-8740} GD_PORT=${GD_PORT:-5253} timeout 900 node "tests/$s.browser-test.mjs" > "/tmp/lw127-br-$s-$TAG.log" 2>&1; r=$?
  [ $r -ne 0 ] && RC=1
  echo "$s exit $r · PASS lines $(grep -c '^PASS' "/tmp/lw127-br-$s-$TAG.log")"; [ $r -ne 0 ] && tail -5 "/tmp/lw127-br-$s-$TAG.log" | cut -c1-300
done
exit $RC
