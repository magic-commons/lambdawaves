# λWAVES — Claude Yan FOR-JOSH, 24 October 2026 (the papers)

You were away from the app and asked for a session on the documents and papers instead: read the two drafts, add what I would, read Terry Tao's criticisms of OpenAI's recent mathematics for how to make the papers sound human without saying so, look at OpenAI's math repository for physics worth synthesising, go deeper on the Lamb of Waves corpus, propose more papers and more powerful solvers. Everything below is written; nothing was posted, no solve was run, the solvers were not touched, and the app's code is unchanged.

## What landed

1. **Draft 08 of both papers**, an exposition pass: `DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/DRAFTS/CLAUDE YAN HUMAN PASS — 2026-10-24/`. Markdown and compiled PDFs (Paper 1 and Paper 2 built with the review's exporter and Tectonic). A checker proves every number, display equation and reference of Draft 07 survives (145/15/13 and 200/12/16). Three background references added to each, marked to confirm. The README there lists what the pass does.
2. **The plan for what comes next**: `PUBLICATIONS & DRAFTING/CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`. Eight house rules for how the papers should sound, distilled from the October argument (Tao's posts, Huiberts' guest essay, the AHM statement, the Sienicki audit) and applied, not cited. What the corpus has actually established, with the negative results first-class. Ten candidate papers ranked pairwise, each with thesis, picture, what exists, what must be computed, the figure that carries it and how it dies. Five solver ideas composed from pieces the app already has, plus one real research pilot. The OpenAI families worth reading and how to use them. A reading list.
3. **Two reader digests** (the whole Sol dialogue; the fifty Codex rounds and the monograph) are in this session's working records; the plan quotes what matters from them.

## The one idea I would push first

Paper 2 found that the frozen water packet's net current runs *against* the motion of its own centre ($q=-1.32$). That number is awkward in Draft 07 and a hook in Draft 08. The proposed Paper 3, "The leak and the repair", draws the continuity source $S=\partial_t\rho+\nabla\cdot\mathbf j$ as a field (it is the exchange of the other nine electrons plus the finite basis, and every term is the ESP pass's own integral applied to orbital pairs), then repairs it with the smallest conserving current, $\mathbf c^*=\nabla\varphi$, $\nabla^2\varphi=-S$ (one GPU Poisson solve, which the app has). Two three-line lemmas in the plan show the repair is unique and that any conserving current's net flow equals the dipole rate, so the repaired water current must change sign, from $-1.32$ to exactly $+1$ times the dipole rate. That is a prediction the exported water solution can test on the CPU this week, without the solvers, without the GPU, and without a new solve.

Second: Berry's knotted zeros of hydrogen need $n\ge7$ for the trefoil, and the register has had $n=7$ since iteration 008. Nobody has drawn Berry's knot in an instrument you can turn.

## Your calls

1. **Byline of Draft 08.** Recommendation: keep "by SOL-6.1 and Sonnet 5.5" and name the pass in the series line and Credits, as done; or add Fable 5.1. Your rule was that the model receives paper credit; three models have now written on these papers.
2. **Adopt Draft 08 whole, or merge it into Draft 07.** Recommendation: adopt whole; the checker proves nothing quantitative moved, and the review edition stays untouched beside it.
3. **Confirm the six added references** before any posting (titles, authors, venues and years were verified by search today; DOIs were not pulled).
4. **Which paper next.** Recommendation: 3.1 (the leak and the repair), then 3.2 (Berry's knots). 3.3 (the 118 atoms) and 3.4 (the volumes) are data papers that can follow when you want them; 3.4 waits for the queue and your live-tree runs.
5. **Authorise the CPU computation for 3.1's first figures.** It needs the exported H₂O/STO-3G solution already in the review's `figures/source-captures/`, PySCF on the CPU for `int1e_grids` over orbital pairs, and a Poisson solve. No solver, no GPU, no new solve. I would run it in a scratch tree and report the number before touching the app.
6. **Public record.** Recommendation: the posted edition carries `verification/` and the work ledger; it is the only answer to "how do you know" that costs us nothing.
7. **The critics.** Recommendation: do not cite the October argument anywhere in the papers. The craft should show.
8. **Two shortfalls found by the Codex reader, for when you are back at the app:** `chemview.js` calls `flow.setFloor(0, …)`, so FLOW's assessed floor collapses to the fixed $10^{-7}$; and the shipped BALANCED face-flux repair can leave pointwise velocity about 50 % off (Codex Round 37). Both are rows for a later iteration, not for today.

## Still open from the 015 close

The sixteen calls in `LAMBDAWAVES CLAUDE YAN FOR-JOSH 2026-10-24.md`, and the live-tree runs after the queue empties (esp-pass, isomers and tags, the incremental pack with VOL. II WIP, the six-look night render). At 17:30 yesterday 2,661 of 8,984 molecules remained.

## Where things are

- Papers: `~/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/DRAFTS/CLAUDE YAN HUMAN PASS — 2026-10-24/`
- Plan: `~/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING/CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`
- Repo copy of the Markdown, the plan and the tools: `research/papers-2026-10-24/` on `yan-c` (committed, not pushed).
