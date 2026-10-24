# λWAVES — Claude Yan FOR-JOSH, 24 October 2026 (the papers)

You were away from the app and asked for a session on the documents and papers instead: read the two drafts, add what I would, read Terry Tao's criticisms of OpenAI's recent mathematics for how to make the papers sound human without saying so, look at OpenAI's math repository for physics worth synthesising, go deeper on the Lamb of Waves corpus, propose more papers and more powerful solvers. Everything below is written; nothing was posted, no solve was run, the solvers were not touched, and the app's code is unchanged.

## What landed

1. **Draft 08 of both papers**, an exposition pass: `DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/DRAFTS/CLAUDE YAN HUMAN PASS — 2026-10-24/`. Markdown and compiled PDFs (Paper 1 and Paper 2 built with the review's exporter and Tectonic). A checker proves every number, display equation and reference of Draft 07 survives (145/15/13 and 200/12/16). Three background references added to each, marked to confirm. The README there lists what the pass does.
2. **The plan for what comes next**: `PUBLICATIONS & DRAFTING/CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`. Eight house rules for how the papers should sound, distilled from the October argument (Tao's posts, Huiberts' guest essay, the AHM statement, the Sienicki audit) and applied, not cited. What the corpus has actually established, with the negative results first-class. Ten candidate papers ranked pairwise, each with thesis, picture, what exists, what must be computed, the figure that carries it and how it dies. Five solver ideas composed from pieces the app already has, plus one real research pilot. The OpenAI families worth reading and how to use them. A reading list.
3. **Two reader digests** (the whole Sol dialogue; the fifty Codex rounds and the monograph) are in this session's working records; the plan quotes what matters from them.

## The one idea I would push first

Paper 2 found that the frozen water packet's net current runs *against* the motion of its own centre ($q=-1.32$). That number is awkward in Draft 07 and a hook in Draft 08. The proposed Paper 3, "The leak and the repair", draws the continuity source $S=\partial_t\rho+\nabla\cdot\mathbf j$ as a field (it is the exchange of the other nine electrons plus the finite basis, and every term is the ESP pass's own integral applied to orbital pairs), then repairs it with the smallest conserving current, $\mathbf c^*=\nabla\varphi$, $\nabla^2\varphi=-S$ (one GPU Poisson solve, which the app has). Two three-line lemmas in the plan show the repair is unique and that any conserving current's net flow equals the dipole rate, so the repaired water current must change sign, from $-1.32$ to exactly $+1$ times the dipole rate. That is a prediction the exported water solution can test on the CPU this week, without the solvers, without the GPU, and without a new solve.

Second: Berry's knotted zeros of hydrogen need $n\ge7$ for the trefoil, and the register has had $n=7$ since iteration 008. Nobody has drawn Berry's knot in an instrument you can turn.

## Done since this note was written: the pilot ran (evening)

Your "continue with whatever you think is next" was read as the authorisation in call 5. The computation ran on the CPU at nice 19 (two threads, 177 s at 224³), the solvers untouched; everything is post-processing of the exported water record. Record and figure: `PUBLICATIONS & DRAFTING/CLAUDE YAN — THE LEAK AND THE REPAIR PILOT — 2026-10-24/` (repo: `research/papers-2026-10-24/leak/`).

1. **The prediction holds, with a correction that improves the paper.** The repaired net current is $q'=+1.000004$ times the dipole rate (from $-1.32$) when the repair is confined to the box (no flux through the walls, the app's own boundary). With open walls it stays at $q'=-1.317$: the missing dipole rate leaves as wall flux. In free space the minimal repair keeps one third. The plan's Lemma B had assumed a decay the minimal repair does not have; its own kill clause caught it, and both lemmas are rewritten in §3.1.
2. **A new number.** The leak's first moment is 0.76 finite basis and 0.24 frozen exchange: STO-3G, not the frozen exchange, is the main reason water's net current runs against its centre. The basis part sits on the nuclei, the exchange part is diffuse.
3. **The repair is small, the reversal large.** The repair's norm is 0.13 of the current's.
4. **Checks.** The first moment by quadrature matches its analytic value to $2\times10^{-7}$; the grid exchange operator matches PySCF's two-electron integrals to $4\times10^{-6}$; the discrete identities hold to $10^{-14}$.

**New call 9.** The next pilots are the same computation on water's 6-31G and 6-31G* rungs (does the basis part shrink while the exchange part holds?) and on benzene's ring packet; both CPU, both post-processing of records the volumes already hold. Say the word and they run. And for the app: the GPU Poisson pass's wall condition decides whether a repaired FLOW carries the dipole rate; it has to be the closed-wall one.

## Later: Papers 3 and 4 written (your "Let's do those next papers!")

Both are Draft 01, built with the review's exporter (10 pages each), on the desk under `DRAFTS/`; the Markdown, figures, scripts and every number are in the repo under `research/papers-2026-10-24/` (`03-LEAK-AND-REPAIR/`, `04-KNOTTED-ZEROS/`, `leak/`, `knots/`).

**Paper 3, THE LEAK AND THE REPAIR (by Fable 5.1).** The pilot, plus water up the basis ladder and benzene: for water the leak's effect on the net current falls from 2.32 to 0.28 to 0.08 dipole rates (STO-3G, 6-31G, 6-31G*), the exchange part holding near half a dipole rate while the basis part collapses and changes sign; benzene's π packet is the reverse case (73 % exchange, smooth, away from the nuclei, the repair as large as the current); the closed-wall repair gives q′ = 1 in every case. `DRAFTS/CLAUDE YAN PAPER 3 — THE LEAK AND THE REPAIR — 2026-10-24/`.

**Paper 4, KNOTTED ZEROS IN SEVEN LEVELS (by Fable 5.1 and Opus 5.5).** An Opus mathematician refuted the lemma I had planned on (a level holds one radial function per (l, m), so the polynomial knots of optics are not hydrogen states), rebuilt Berry's 2001 construction in the register's own conventions to every printed digit, found a misprint in his equation 4, and lowered the knots by letting the perturbing state carry the twist: a Hopf link and a trefoil at n = 4, the cinquefoil at n = 5, 7₁ at n = 6, 9₁ and T(3,7) at n = 7; every T(2,q) up to q = 9 is in the register. Each state is a list of coefficients over the register's labels, checked against `lab/hydrogen.js psiAt` to 5e-15 and verified as a knot by the Alexander polynomial of its traced curve; a beat with 6s₀ rocks or turns the trefoil without untying it. `DRAFTS/CLAUDE YAN PAPER 4 — KNOTTED ZEROS IN SEVEN LEVELS — 2026-10-24/`; the record `CLAUDE YAN — KNOTTED ZEROS RECORD (the proving lab) — 2026-10-24/`.

**The writing rules** are in your Obsidian root: `LAMBDAWAVES CLAUDE YAN WRITING RULES (the October argument) 2026-10-24.md`, with a ninth rule the evening taught ("let the kill clause fire").

**Calls 10–14.**

10. **Paper 4's byline.** I wrote "Fable 5.1 and Opus 5.5": the mathematics is the proving lab's and should carry its name. Confirm the model name you want printed (the agent runs as "Opus"; I have not verified its exact version string).
11. **The novelty check before Paper 4 goes anywhere.** A forward-citation search on Berry 2001 (and Enciso–Hartley–Peralta-Salas 2018) for the n = 4 trefoil and the twist transfer. The paper says plainly it has not been done. I can run it with the arXiv tools and Semantic Scholar on your word.
12. **Loading the knots in the app.** `knots.json → states.<key>.preset_modes` is a `modes` list for `lab/state.js load`; a row for a later iteration is a KNOTS group of presets in SPECTRUM's list (seven states), with DOMAIN 5 bohr and PHASE for the n = 4 ones. Not built; nothing in `lab/` was touched.
13. **Two app findings from the knots work:** VORTEX samples spheres and so draws the n = 7 knot as a few dozen points, not a curve (a radial-sampling row); only the CPU evaluator was checked, not the WGSL kernel (one native PHASE frame of the recommended trefoil would close that).
14. **A second reader for both papers.** Draft 01 of each has had no independent re-computation; the house rule is one paper, read by you and one outside human, then the next. Paper 3 first.

## Your calls

1. **Byline of Draft 08.** Recommendation: keep "by SOL-6.1 and Sonnet 5.5" and name the pass in the series line and Credits, as done; or add Fable 5.1. Your rule was that the model receives paper credit; three models have now written on these papers.
2. **Adopt Draft 08 whole, or merge it into Draft 07.** Recommendation: adopt whole; the checker proves nothing quantitative moved, and the review edition stays untouched beside it.
3. **Confirm the six added references** before any posting (titles, authors, venues and years were verified by search today; DOIs were not pulled).
4. **Which paper next.** Recommendation: 3.1 (the leak and the repair), then 3.2 (Berry's knots). 3.3 (the 118 atoms) and 3.4 (the volumes) are data papers that can follow when you want them; 3.4 waits for the queue and your live-tree runs.
5. **~~Authorise the CPU computation for 3.1's first figures.~~ Done this evening on your word; see above.** It needed only the exported H₂O/STO-3G solution already in the review's `figures/source-captures/`, PySCF on the CPU for `int1e_grids` over orbital pairs, and a Poisson solve. No solver, no GPU, no new solve. I would run it in a scratch tree and report the number before touching the app.
6. **Public record.** Recommendation: the posted edition carries `verification/` and the work ledger; it is the only answer to "how do you know" that costs us nothing.
7. **The critics.** Recommendation: do not cite the October argument anywhere in the papers. The craft should show.
8. **Two shortfalls found by the Codex reader, for when you are back at the app:** `chemview.js` calls `flow.setFloor(0, …)`, so FLOW's assessed floor collapses to the fixed $10^{-7}$; and the shipped BALANCED face-flux repair can leave pointwise velocity about 50 % off (Codex Round 37). Both are rows for a later iteration, not for today.

## Still open from the 015 close

The sixteen calls in `LAMBDAWAVES CLAUDE YAN FOR-JOSH 2026-10-24.md`, and the live-tree runs after the queue empties (esp-pass, isomers and tags, the incremental pack with VOL. II WIP, the six-look night render). At 17:30 yesterday 2,661 of 8,984 molecules remained.

## Where things are

- Papers: `~/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/DRAFTS/CLAUDE YAN HUMAN PASS — 2026-10-24/`
- Plan: `~/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`
- Repo copy of the Markdown, the plan and the tools: `research/papers-2026-10-24/` on `yan-c` (committed, not pushed).
