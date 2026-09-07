#!/usr/bin/env bash
# test.sh — the two proofs.  The node proof needs nothing; the browser proof starts its own
# HTTPS server (port 8701) and headless Firefox (geckodriver port 5202) and stops them after.
#   ./test.sh          both
#   ./test.sh node     node only
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
node tests/hydrogen.test.mjs; NODE_RC=$?
node tests/frontier.test.mjs; FR_RC=$?
node tests/dynamics.test.mjs; DY_RC=$?
node tests/fields.test.mjs; FD_RC=$?
node tests/rotor4.test.mjs; R4_RC=$?
node tests/qcd.test.mjs; QC_RC=$?
node tests/momentum.test.mjs; MO_RC=$?
node tests/kick.test.mjs; KI_RC=$?
node tests/kepler.test.mjs; KE_RC=$?
node tests/qho.test.mjs; QH_RC=$?
node tests/molecule.test.mjs; ML_RC=$?
node tests/well.test.mjs; WE_RC=$?
node tests/zion.test.mjs; ZI_RC=$?
node tests/helium.test.mjs; HE_RC=$?
node tests/h2.test.mjs; H2_RC=$?
node tests/calculus.test.mjs; CA_RC=$?
node tests/cornell.test.mjs; CO_RC=$?
node tests/gas.test.mjs; GA_RC=$?
node tests/period.test.mjs; PE_RC=$?
node tests/atoms.test.mjs; AT_RC=$?
node tests/electrostatics.test.mjs; EL_RC=$?
node tests/sturmian.test.mjs; ST_RC=$?
node tests/twocentre.test.mjs; TC_RC=$?
node tests/sturmianreg.test.mjs; SR_RC=$?
node tests/wigner.test.mjs; WI_RC=$?
node tests/radiation.test.mjs; RA_RC=$?
node tests/mo.test.mjs; MX_RC=$?
node tests/history.test.mjs; HI_RC=$?
node tests/perf.test.mjs; PF_RC=$?
node tests/math-audit.test.mjs; MA_RC=$?
node tests/modrive.test.mjs; MD_RC=$?
node tests/pulse.test.mjs; PU_RC=$?
node tests/h2ci.test.mjs; HC_RC=$?
node tests/mir.test.mjs; MI_RC=$?
node tests/audio.test.mjs; AU_RC=$?          # wave 102: the capture half and the seam it meets the model at
node tests/palette.test.mjs; PL_RC=$?
node tests/statelink.test.mjs; SL_RC=$?
node tests/capture.test.mjs; CP_RC=$?
node tests/ink.test.mjs; IK_RC=$?
# WAVE 62 · THREE SUITES THAT EXISTED, PASSED, AND WERE NOT IN THIS FILE.  wiring.test.mjs (every .js under
# lab/ is reached from the real roots, or named in a dated allowlist) and render-exact.test.mjs were both
# green and both unrun by the gate, which is ANTI-PATTERN 17 pointed at the gate itself: a proof nothing
# invokes is worth exactly what an unregistered service worker is worth.  access.test.mjs is new and cheap —
# three keyboard laws read off the SOURCE in 40 ms, so the regressions that would otherwise cost a
# seven-minute browser run fail in the fast half.  (render-exact.js itself is still not wired into the app;
# that is a later wave, and wiring.test.mjs's allowlist entry for it is deliberate and dated.)
node tests/wiring.test.mjs; WR_RC=$?
node tests/render-exact.test.mjs; RX_RC=$?
node tests/access.test.mjs; AC_RC=$?
# WAVE 56 · pwa.test.mjs LAST, and it is the gate on ANTI-PATTERN 14: sw.js's cache NAME is a digest of
# its own §1 precache table, so a stale entry means the name does not move when a file does and every
# returning visitor is served the old bytes forever, silently.  It was RED when this wave started
# (rack.js and skin.css had moved and §1 had not).  `node tests/pwa.test.mjs --write` regenerates §1 and
# then proves the result; without --write it only prints the corrected block, so CI still fails.
node tests/pwa.test.mjs; PW_RC=$?
NODE_RC=$(( NODE_RC || FR_RC || DY_RC || FD_RC || R4_RC || QC_RC || MO_RC || KI_RC || KE_RC || QH_RC || ML_RC || WE_RC || ZI_RC || HE_RC || H2_RC || CA_RC || CO_RC || GA_RC || PE_RC || AT_RC || EL_RC || ST_RC || TC_RC || SR_RC || WI_RC || RA_RC || MX_RC || HI_RC || PF_RC ))
NODE_RC=$(( NODE_RC || MA_RC || MD_RC || PU_RC ))
NODE_RC=$(( NODE_RC || HC_RC || MI_RC || AU_RC || PL_RC ))
NODE_RC=$(( NODE_RC || SL_RC || CP_RC || IK_RC || WR_RC || RX_RC || AC_RC || PW_RC ))
[ "${1:-}" = "node" ] && exit $NODE_RC
PORT="${LW_PORT:-8701}"
export MB_CERTS="${MB_CERTS:-$HOME/mandelbrot/certs}"
python3 "$HERE/tools/gate/server.py" "$HERE" "$PORT" > /dev/null 2>&1 &
SRV=$!
sleep 1
LW_PORT="$PORT" GD_PORT="${GD_PORT:-5202}" node tests/boot.browser-test.mjs; BR_RC=$?
kill "$SRV" 2>/dev/null
echo "node: $NODE_RC   browser: $BR_RC"
exit $(( NODE_RC || BR_RC ))
