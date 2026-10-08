# λWAVES 0.4.0 · S4c — HAND-OFF at the usage pause (2026-10-08)

Written at the agent-control usage pause. **S4c's build is complete** (C1–C5 committed); what remains is the fresh verifier.
The full account is `research/release-0.4.0/S4c-BUILD.md`; REPORT.md waves 178–182; MEASURE.md §5.

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a734418d1e508c803`
- **Branch:** `worktree-agent-a734418d1e508c803` (from `cfdd674`; `b5eed68`, the S4a B1 fix, merged at the integrator's word).
- **Commits:** `1fa4eac` C1+C2 (cap-128 tier, ORB_WGSL, --fixture road, tryptophan) · `cbc7b0f` digest lock skips states its
  fixture lacks · `88d282c` C3 (C₆₀ frontier record + wiring, C₂₀H₂₀ fixture) · `a0119fa` merge b5eed68 · `b0e708a` C3 library test ·
  `5eba9e2` C4 VALENCE · `d31bb05` C5 comments + device report pair · `46aee7a` C5 browser suites learn valence / C₆₀ ·
  `7742010` C5 −7 lines · `b6f877d` C5 s4c-kernel.json complete · (this commit) REPORT 178–182, MEASURE §5, S4c-BUILD, this file.
- **Where it stopped:** nothing half-built. No shader or kernel change is uncommitted; the last field.js edit (a JS comment, in
  `7742010`) was followed by the 1148 and 1004 locks, both GREEN.
- **Locks:** 588 at 96³ (`--check --grids 96 --query gastab=0`, the thirteen / then plain with the three S4a states skipped)
  GREEN after C1+C2 (twice) and after C3; S4a fixture molecular states GREEN after C1+C2 (144) and C4 (192); final tree
  `--check --query gastab=0` **1004 GREEN** (61 s) and `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` **1148
  GREEN** (62 s). Never red; nothing re-run alone.
- **Numbers:** 32 KiB asked / 32768 granted (3070, both browsers); refused → 16384, 32 lanes, same texels. 87-AO density 4.56e-4,
  120-AO 3.69e-4 of max √ρ vs the generator's f64; C₆₀ HOMO 13.67 / 3.62 ms plain / screened (Chromium), 15.01 / 4.08 (Firefox);
  C₆₀ vs PySCF at 256 voxel centres 4.0e-4 – 5.6e-4 of max |ψ|; VALENCE lysine max ρ 47.8 → 1.60.
- **Tests:** node 85 suites GREEN (twice); `orbital-library --check`, `new-project --check`, pwa green; browser on 8759/5227:
  chem 54/54, molecular-names, render-regressions, current, export3d, library, field-molecule, orbitals 24/24, new-project,
  history — GREEN.
- **Lines:** `lab/*.js` 36 131 (cfdd674) · 36 137 (b5eed68) → 36 225 (+88 mine; not met); WGSL source in field.js 471 → 496.
- **Blockers:** none.
- **Open:** the M5 (one command in S4c-BUILD.md and MEASURE §5); C₆₀'s section (LATTICE) and identifiers are S4b's.
- **Exact next step:** the S4c verifier (the kernel) on **8761/5229** with BRIEF-S4-LIBRARY.md §S4c as its contract — the commands
  are listed at the end of S4c-BUILD.md.
