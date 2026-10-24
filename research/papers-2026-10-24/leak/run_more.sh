#!/bin/bash
# the paper's remaining computations, in sequence, politely (the solvers own the CPU):
# water up the basis ladder at the pilot's finest grid, then benzene's HOMO + LUMO packet at two grids.
cd "$(dirname "$0")"
PY=/home/joshua-hosain/miniforge3/envs/sci/bin/python
export OMP_NUM_THREADS=2
nice -n 19 $PY -I leak_any.py --mol water --basis 6-31g  --N 224 > run_water_6-31g.log 2>&1
nice -n 19 $PY -I leak_any.py --mol water --basis '6-31g*' --N 224 > run_water_6-31gd.log 2>&1
nice -n 19 $PY -I leak_any.py --mol benzene --basis sto-3g --N 128 > run_benzene_128.log 2>&1
nice -n 19 $PY -I leak_any.py --mol benzene --basis sto-3g --N 160 > run_benzene_160.log 2>&1
echo done
