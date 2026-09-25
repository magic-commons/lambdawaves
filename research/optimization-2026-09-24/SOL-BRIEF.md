# To Sol (GPT, via the codex plugin) — the adversarial read of the λWAVES optimization plan · 2026-09-24

You are the second lab. Fable (Claude) leads; six Opus auditors have each read one lane of the code whole and written
`research/optimization-2026-09-24/AUDIT-A.md` … `AUDIT-F.md`; the cross-refutation notes are `REFUTE-*.md`; the
measurements are `baseline-firefox.json` and `baseline-chromium.json` (read `BRIEF.md` §7 for the headline numbers).
The draft plan is `PLAN-DRAFT.md`. Everything is under `research/optimization-2026-09-24/` in the repository you were
launched in (the worktree; branch `worktree-optimization-2026-09-24`, base `91c90bc` = the live v0.2.3-alpha.3).

Your deliverable: `research/optimization-2026-09-24/SOL-REVIEW.md`, written with a bash heredoc. These are leads, not
verdicts; refuting them with evidence is the deliverable. Do not edit anything under `lab/` or `tests/`.

1. THE LAW: every change must be behaviour-neutral (same pixels for the same state, same physics, same saved-project
   bytes, same controls) or a bug fix with a written proof. For every plan item, say whether that holds, and name the
   observable that would catch a violation.
2. RANK the plan items by measured gain per risk, using the baselines; move, merge or strike items; add what six lanes
   missed. Be specific: file:line, the mechanism, the check.
3. THE THREE HARD ONES, in depth:
   a. The axial-gas kernel (`lab/field.js` COMPUTE_WGSL space 3: `sphj` Miller recurrence per voxel per mode; 256
      modes; 117 ms at 128³). Judge the tabulated-radial road (one 1-D table per (l, k) row, linear or cubic
      interpolation, ~256–1024 samples) against the fp16 rgba16float texel (11-bit mantissa ≈ 5e-4 relative): what
      sample count keeps the interpolation error under the texel's own quantisation for j_l up to l = 15 with up to 16
      radial nodes in [0, a]? Is there a cheaper exact road (a recurrence in l shared across the 16 k per l; upward
      recurrence stability for x > l)? Write the error bound, not an opinion.
   b. The present pass (`RENDER_WGSL`): `steps` texture taps per pixel, 1.5/3.5/5.5 ms at 64/96/128 for DPR 1 at
      1920×994 — DPR 2 quadruples it. Is an empty-space skip (a coarse occupancy over the volume, computed in the
      reconstruct pass by the same workgroup max the kernel already reduces) worth it for these fields (a hydrogen
      cloud fills the box; a Rydberg torus does not)? Give the design you would ship and the pixel-neutrality argument
      (skipping voxels whose ρ/ρmax < 2^-11 changes no 8-bit output level — prove or bound it).
   c. The interface over the canvas: headless Firefox delivers 14.7 fps with the default UI shown vs 52.7 hidden while
      the app's own loop costs 0.16–1.4 ms. Read AUDIT-C and the Electron numbers. Which compositor mechanism dominates
      (backdrop-filter re-sampling per canvas frame × number of layers × area; per-frame DOM invalidations from the
      live knobs/readouts; software vs GPU compositing), and which of the proposed CSS changes keep every pixel of
      Josh's glass identical? Anything that changes the look is "for Josh", not a task — mark it.
4. THE REFACTOR LANE (AUDIT-E): for each CUT verdict, try to find a reader (a test, a project file, a link format, a
   saved settings key) that would break. A wrong cut is worse than a missed cut.
5. What would you measure BEFORE building, that nobody has measured yet? Name the probe.

Keep it under 400 lines. End with `Final output` and the path of your file.
