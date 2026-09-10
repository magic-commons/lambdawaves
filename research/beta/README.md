# λWAVES Beta — research and major-update plan

2026-09-08 · Planning baseline: `9eb463d07fd212d729a09f82946acc6816d5461f` · **Proposed, not implemented**

**Recommendation:** make Beta the release of causal atoms and flexible benzene. Reuse the existing hydrogen, Sturmian, electrostatics, H₂⁺ dynamics and H₂ CI engines. Build a shared physical-model contract, then a reference-backed near-equilibrium benzene instrument. Native reactive chemistry is a separate, gated extension.

Read in this order:

1. [Master dossier](MASTER-DOSSIER.md) — mathematical decisions, architecture, all 34 requested subjects.
2. [Build contracts](BUILD-CONTRACTS.md) — ordered work packages, ownership, failure states and acceptance criteria.
3. [Research commissions](RESEARCH-COMMISSIONS.md) — bounded questions, required evidence and falsifiers for subsequent researchers.
4. [Sources and evidence](SOURCES.md) — primary sources, current-code findings, limitations and reproducible analytical checks.

The source briefs are Josh's `SOL TO ASTRA PROMPT.md` and `POST RELEASE PRE-ASTRA DOSSIER.md` under `~/Documents/OBSIDIAN`. Those files are unchanged. This plan supersedes their implementation assumptions where current source code supplies newer evidence; it preserves their scientific ambition.

**Beta release scope:** B0–B8 in the build contracts. B9–B12 are explicit extensions, not hidden release blockers. No dates or browser performance measurements are invented. The resting hint stays hidden. This work changes documentation and a small research probe only; it does not change the running application or deploy anything.
