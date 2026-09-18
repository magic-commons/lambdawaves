#!/usr/bin/env bash
# Every number in LEDGER.md, in order, from this folder.  ~15 s for the node parts, ~60 s for PySCF.
set -euo pipefail
cd "$(dirname "$0")"
PY=~/miniforge3/envs/sci/bin/python
echo "=== prep (snapshot of lab/ at git HEAD $(cat snapshot/HEAD.txt)) ==="
node prep.mjs H2O NH3 CH4 C6H6
echo "=== TASK A route A: PySCF FCI trans_rdm1 ==="
$PY check-gamma-fci.py H2O NH3 CH4
echo "=== TASK A route B: bitstring second quantisation, no PySCF ==="
$PY check-gamma-bitstring.py H2O NH3
echo "=== TASK A: the pair-basis assembly the window will type ==="
node check-pair-basis.mjs
echo "=== TASK A: Proposition 2, the delta-kick ==="
$PY check-kick.py H2O
echo "=== TASK A: the sign of the current map Im D -> j ==="
$PY check-current.py C6H6
echo "=== TASK A: physics gate against PySCF RHF + TDA on the vendored primitives ==="
$PY check-tda-pyscf.py H2O NH3 CH4 C6H6
echo "=== TASK B: the canonical gauge ==="
node --test canon-gauge.test.mjs
