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
node tests/h2ci.test.mjs; HC_RC=$?
NODE_RC=$(( NODE_RC || FR_RC || DY_RC || FD_RC || R4_RC || QC_RC || MO_RC || KI_RC || KE_RC || QH_RC || ML_RC || WE_RC || ZI_RC || HE_RC || H2_RC || CA_RC || CO_RC || GA_RC || PE_RC || AT_RC || EL_RC || ST_RC || TC_RC || SR_RC || WI_RC || RA_RC || MX_RC || HI_RC || PF_RC ))
NODE_RC=$(( NODE_RC || MA_RC || MD_RC ))
NODE_RC=$(( NODE_RC || HC_RC ))
[ "${1:-}" = "node" ] && exit $NODE_RC
PORT="${LW_PORT:-8701}"
export MB_CERTS="${MB_CERTS:-$HOME/mandelbrot/certs}"
python3 "/home/joshua-hosain/Documents/MANDELBROT APP/project/mbgate/server2.py" "$HERE" "$PORT" > /dev/null 2>&1 &
SRV=$!
sleep 1
LW_PORT="$PORT" GD_PORT="${GD_PORT:-5202}" node tests/boot.browser-test.mjs; BR_RC=$?
kill "$SRV" 2>/dev/null
echo "node: $NODE_RC   browser: $BR_RC"
exit $(( NODE_RC || BR_RC ))
