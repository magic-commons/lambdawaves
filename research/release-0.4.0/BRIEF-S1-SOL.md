# λWAVES 0.4.0 · S1″ THE SOL THREAD — BRIEF (the mathcollab ledger on "cyclotomic scaling")

**Written by Fable, 2026-10-07.** `PLAN.md` §6 row S1″: *a mathcollab ledger on "cyclotomic scaling" in Josh's sense, off
the Opus path; done when: the ledger plus one number — benzene's unique-quartet fraction under D₂h, measured on `md.js`'s
own loop by a `tools/` script.* Ruling R-S1 (taken by default, §9): the reading is the corpus's — **the character-basis
principle** (MASTER GOAL SPEC §39, library entry L-0408), concrete as **symmetry adaptation**: Fock blocks, unique ERI
quartets, asymmetric-unit reconstruction. The thread feeds 0.5.x ("symmetry-adapted SCF if the thread's number earns it")
and S4c's engine upgrades. It never touches `lab/`.

## Josh's words (NACRE.md, verbatim)

> Have some engine upgrades for: much larger atom/electron count, heavier atoms, (frontier mathematics on cyclotomic
> scaling? We can do a math frontier thing with Sol 6.1 on Codex. We can research cyclotomy and our own 'DISK' corpus for
> some engine saving framing features because the lower orbitals are gonna go nuts)

## The protocol

The `mathcollab` skill (`~/.claude/skills/mathcollab/SKILL.md`): ONE append-only ledger
`research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md`; Fable @ max writes ROUND 1 and every odd round; Sol (Codex, `--effort
xhigh`, one at a time, launched from the project root) writes the even rounds; every claim tagged KNOWN (author/theorem) ·
DERIVED-HERE · MEASURED · REFUTED · UNVERIFIED; a refutation is written under the claim it kills with the number that
killed it; each round answers every open question with a number, a derivation or a counter-example, never agreement, and
closes with three to six numbered questions that BROADEN, DEEPEN or LOCATE. Stop after two dry rounds or at Josh's
budget (expect 3). The lead writes `## SYNTHESIS` last: STANDS / DEAD / ALIVE-AS-A-GATE, the contracts a build wave could
take, the benchmarks that must precede one, the decisions only Josh can make. After every round rebuild the DISK:
`node tools/disk.mjs research research/DISK.md` (the `disk-writer` law; check `du -sh research` first — never a recursive
grep over a multi-GB research folder).

## ROUND 1 (Fable) — what it must contain

**The header.** Josh's words above; R-S1; the evidence by exact file and line: `lab/md.js` (the ERI loop: shell-pair
tables, Schwarz screening, "one contraction per unique quartet filled through all eight symmetries", `twoElectron`
~l.398; benzene 37.0 s → 0.54 s), `lab/rhf-molecule.js` (the SCF), `lab/molecules.js` (the cost model `predictMs`,
`CAP_MS`, the cap-is-benzene law ~l.25), `research/molecular-orbitals-2026-10-01/names-probe.mjs` (the D₆h frame of
benzene, the AO representation `M(R)`, the character tables as data — the machinery the number reuses),
`research/molecular-orbitals-2026-10-01/PROBE.md`, `lab/field.js` ~170–190 (the χ tile and the density contraction on
the 96³ grid), the MASTER GOAL SPEC §39 (`~/Documents/OBSIDIAN/LAMBDAWAVES CLAUDE MASTER GOAL SPEC:2026-09-02.md`), L-0408
(grep the vault's `GENERAL MATHEMATICS LIBRARY II.md` under `~/Documents/OBSIDIAN` for `L-0408`), and `research/DISK.md`'s
contents list for what the corpus already says about characters, rings and the ERI.

**The number (MEASURED).** `tools/symmetry/unique-quartets.mjs` (node, no dependencies, imports `lab/` read-only like
the probe does), run on benzene STO-3G (36 AO) and on water for scale:
1. Build the AO representation `D(R)` for the eight operations of **D₂h ⊂ D₆h** in the probe's benzene frame (reuse the
   probe's construction; the subgroup is `{E, C₂(z), C₂(y), C₂(x), i, σ(xy), σ(xz), σ(yz)}` with the probe's axis
   convention stated). Verify `DᵀSD = S` and `DᵀFD = F` on the converged Fock as the probe does.
2. Symmetry-adapted AOs: projectors `P_Γ = (1/8) Σ_R χ_Γ(R) D(R)` per irrep; an S-orthonormal basis inside each block
   (Löwdin within the block). Report the block sizes `n_Γ` (they sum to 36) and the Fock-block saving `Σ n_Γ² / n²`.
3. Transform `md.js`'s full tensor `(ij|kl)` to the SAO basis and COUNT: among the canonical unique quartets (the 8-fold
   index symmetry), how many are non-zero (|value| > 1e-10)? Report the fraction, the exact selection-rule prediction
   (`Γ_i ⊗ Γ_j = Γ_k ⊗ Γ_l` for one-dimensional irreps; the count from the `n_Γ`), and the 1/|G| = 1/8 limit.
4. **The cyclotomic reading, measured beside it:** adapt to the cyclic **C₆** (characters `ζ₆^k`, complex SAOs; the
   Z₆-grading of the tensor by `k_i − k_j + k_k − k_l ≡ 0 mod 6`) and to the full **D₆h** by its 2-D irreps (the probe's
   table) — the surviving fraction in each, so the ledger can say in one line whether the ring character or the real
   Abelian subgroup wins for benzene, and what the non-Abelian limit (`~1/|G|` = 1/24) would buy.
5. The asymmetric-unit fraction of the **96³ grid** under D₂h and D₆h: how many voxels are a fundamental domain, and how
   many sit on a mirror or axis (the boundary the reconstruction must treat twice).
Write the JSON beside the script (`research/release-0.4.0/measure/quartets.json`) and the table into the round.

**The derivation (DERIVED-HERE / KNOWN).** The selection rule and its count for a general finite group (Wigner–Eckart
form; why the Abelian-subgroup fraction tends to 1/|G| only as the blocks equalize); the petite-list literature (Dupuis &
King 1977; Pitzer 1973; Dacre 1970; Almlöf's symmetry-adapted SCF; PySCF's `symm` using the largest Abelian subgroup,
D₂h; Psi4/libint's petite lists) — each KNOWN with its author, UNVERIFIED if not opened; what "cyclotomic" adds in the
corpus's sense — the character basis of `C_n` lives in `Q(ζ_n)`, the ERI is graded by the ring's characters, and the
asymmetric unit of the density is the orbit space — and where that is exactly the same thing as symmetry adaptation
and where it is more (the integrality of the C₆-adapted integrals for an s-only ring; the lower-orbital "going nuts"
Josh names = core levels splitting by 1e-5–1e-3 Eh, the probe's finding 2, which a symmetry-blocked Fock diagonalises
block by block without ever mixing them).

**Where it would save the LIVE instrument (numbers, not hopes):** the ERI (0.54 s benzene; the fraction above is the
bound), the Fock build and diagonalisation (`Σ n_Γ²`), the RPA (A, B) matrices (block by irrep product), the density
reconstruct on the GPU (the asymmetric unit, 1/24 of the voxels, against the 2.80 ms measured dispatch), and what none
of it saves (the Boys function, the screening, the volume render). Say which of the five is worth a stage at 0.5.x and
which is not.

**Questions for Sol (3–6, numbered Q1…).** At least: the RPA block structure's real saving; the GPU asymmetric-unit
reconstruct's boundary law; C₆₀ under I_h (its largest Abelian subgroup is D₂h again — so what does the full group buy
for 300 AO?); the exact-arithmetic reading (integrals in `Q(ζ₆)` for the ring); and which one number decides whether a
symmetry-adapted SCF enters 0.5.x.

Close with NOT CERTIFIED (what needs a GPU run) and the file paths.

## Laws

Never edit `lab/`. The script lives in `tools/symmetry/`. Git only in your worktree; commit the ledger, the script and the
JSON; never push. Plain separate shell commands (no variables, loops, heredocs or backticks in one line); scripts as files.
Numbers or nothing: no claim without its tag.
