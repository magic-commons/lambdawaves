/* research/iteration-007/codon/fd_helix.c — AmberTools libnabc fd_helix (Arnott/Langridge fibre models) as a 10-line C driver:
   conda-forge ambertools 26 ships libnabc.a but no nab compiler.  fd_helix prints the fibre model (heavy atoms, 5-prime OH ends)
   as ATOM lines on nabout (stdout) and then fails in its prmtop step (exit 1) - the ATOM lines are the model.
   Build: gcc -o fdh fd_helix.c -I$A/include -L$A/lib -lnabc -lsff -lrism -lpbsa -lnabc -lcifparse -lxblas-amb -larpack -lnetcdf
          -lblas -llapack -lfftw3 -lgfortran -lm -lstdc++ -Wl,-rpath,$A/lib        (A = the env prefix)
   Run:   AMBERHOME=$A ./fdh arna augcgauaa x.pdb > arna.raw.pdb   (types: arna aprna lbdna abdna sbdna adna) */
#include <stdio.h>
#include "nabc.h"
FILE *nabout;
int main(int argc, char **argv) {
    nabout = stdout;
    STRING_T *ht = argv[1], *seq = argv[2], *out = argv[3];
    MOLECULE_T *m = fd_helix(ht, seq);
    if (!m) { fprintf(stderr, "fd_helix returned NULL\n"); return 1; }
    putpdb(out, m, NULL);
    return 0;
}
