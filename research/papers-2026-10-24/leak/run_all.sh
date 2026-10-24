#!/bin/bash
# the three grids of the pilot, in sequence, politely (the solvers own the CPU)
cd "$(dirname "$0")"
for N in 96 160 224; do
  OMP_NUM_THREADS=2 nice -n 19 /home/joshua-hosain/miniforge3/envs/sci/bin/python -I leak_repair.py "$N" > "run_N$N.log" 2>&1
done
echo done
