# scratch — 2026-09-18 preparation rewrite

`old/` is `git archive HEAD lab` at commit 8fcdcf8 (the SHIPPED tree before this work); `old-ql/` is the same tree
with two lines changed in `old-ql/lab/h2ci.js` — an import of `lab/linalg.js` and `if (n >= 8) return eigSymQL(A, n);`
at the head of `eigSym` — and nothing else.  Recreate either with:

    git archive 8fcdcf8 lab | tar -x -C research/molecular-waves-2026-09-18/scratch/old

The probes import both trees so that "before" and "after" are measured in one process, on one machine, warm:

    bench-both.mjs        benzene/C₂H₄/H₂O preparation, before and after, alternating, best of N
    bench-eig.mjs         Jacobi vs Householder–QL by size (the QL_MIN = 8 measurement), bench-eig-small.mjs for n ≤ 23
    probe-idempotency.mjs benzene, 400 MMUT steps, four solver/restart combinations
    probe-blowup.mjs      when the benzene RT run loses idempotency, step by step
    probe-magnus.mjs      inside the first Magnus-2 step: which matrix loses unitarity
    probe-hermitian.mjs   hermitianEigen's V†V − I on the matrices benzene's RT hands it
    probe-old-two.mjs     CuH/ZnH₂: the SCF landing point, Jacobi against QL, everything else held fixed
    sweep-all.mjs         all 54 library entries against the PySCF oracle with the new code
    profile-rpa.mjs       where benzene's RPA second goes
