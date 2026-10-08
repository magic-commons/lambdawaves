# λWAVES 0.4.0 · S4c THE ENGINE UPGRADES — what the S4c builder built (waves 178–182)

Written by the S4c builder (Opus 5.5), 2026-10-08, against `BRIEF-S4-LIBRARY.md` §S4c. Nothing was pushed, tagged or deployed.
REPORT.md carries the waves under `## 2026-10-08 · 0.4.0 S4c — THE ENGINE UPGRADES` (numbered from 178; S4b numbers from 168
in parallel — the integrator renumbers if needed).

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a734418d1e508c803`
- **Branch:** `worktree-agent-a734418d1e508c803`, reset to `cfdd674` (the `sos-s0` tip, S4a merged); `b5eed68` (the S4a B1
  fix) merged in at the integrator's word — nothing else from `sos-s0`.

## Summary (ten lines)

1. The density wall: `MOL_CAPS [16, 40, 64, 128]`; gpu-boot asks for 32 KiB where the adapter reports it; the 3070 grants it;
   a refused device builds the cap-128 tier on 32 lanes and draws texels identical to the 64-lane build within each browser (the two browsers' hashes differ from each other; each is self-consistent — S4c-VERIFY N1). The ≤ 64 tier sources are byte-identical.
2. The orbital-only path: `ORB_WGSL` (no tile, shells screened at 1e-10) draws any orbital past 64 AOs; C₆₀'s HOMO 13.67 ms
   plain / 3.62 ms screened (Chromium), 15.01 / 4.08 (Firefox) at 96³.
3. 87- and 120-AO records (tryptophan, C₂₀H₂₀ — my own fixtures, S4b's had not landed) reconstruct against the generator's
   f64 density at 256 voxels to 4.56e-4 / 3.69e-4 of max √ρ; their HOMOs 4.81e-4 / 5.56e-4.
4. C₆₀: a schema-1 frontier record (caps orbitals only, DRAFT geometry said) from Sol's PySCF dump, opened from MOLECULES' LIBRARY
   row with 0 solver calls; HOMO and LUMO drawn (screenshots) and 4.0e-4 – 5.6e-4 of max |ψ| from PySCF's own orbital at 256
   voxel centres.
5. VALENCE: `D − 2 Σ_core C_c C_cᵀ` in f64, a kit switch in the ORBITAL dial's seat while DENSITY is the view (no wider row);
   lysine's max ρ 47.8 → 1.60 (the core had drowned the valence 30×).
6. Locks on the final tree: 1004 GREEN, 1148 GREEN (each once, no red); the 96³ 588 GREEN after every frame-path commit.
7. The digest lock now skips (and names) states its fixture does not hold — the S4a verifier's S1, a separate commit.
8. Device report pair (headless Firefox, 30 s long play): 18.2 → 19.1 fps, 0 held both, governor nominal at 64³ both.
9. Finding: on the 3070 the 32 KiB tile buys nothing measurable over 32 lanes (19.41 vs 19.36 ms, Chromium).
10. `lab/*.js` 36 137 → 36 225 (+88): subtract-don't-add NOT met (a kernel, a record kind, a switch); WGSL 471 → 496 lines.

## The commits

| # | sha | title |
|---|---|---|
| C1+C2 | `1fa4eac` | THE DENSITY WALL AND THE ORBITAL-ONLY PATH (cap-128 tier, 32 lanes where refused; ORB_WGSL; the --fixture road; tryptophan; s4c-kernel.mjs) |
| lock | `cbc7b0f` | the digest lock compares only the states its fixture holds, and names the ones it skipped |
| C3 | `88d282c` | C₆₀'S HOMO AND LUMO FROM A PySCF COEFFICIENT RECORD (buildFrontier, the frontier record, chem.open / chemview / register wiring, c60-voxels.py, s4c-c60-app.mjs, C₂₀H₂₀ fixture) |
| merge | `a0119fa` | Merge `b5eed68` (the S4a B1 fix; one conflict in mathworker.js chemOpen's return, both kept; sw.js regenerated) |
| C3 | `b0e708a` | tests/library.test.mjs learns C₆₀ |
| C4 | `5eba9e2` | VALENCE, A SWITCH ON DENSITY |
| C5 | `d31bb05` | the stale Firefox-timestamp comments; the device report pair |
| C5 | `46aee7a` | the browser suites learn the `valence` key and the C₆₀ row |
| C5 | `7742010` | subtract where it can (−7 lines) |
| C5 | `b6f877d` | s4c-kernel.json complete in both browsers |
| C5 | (this commit) | REPORT waves 178–182, MEASURE §5, this hand-off |

## The numbers

| what | number |
|---|---|
| workgroup storage asked / granted (3070, both browsers) | 32768 / 32768 → lanes [64, 64, 64, 64]; refused device: 16384 → lanes [64, 64, 64, 32], identical texels within each browser (`8ce0fdcb` FF, `ff0a77c2` Cr — the two differ from each other, S4c-VERIFY N1) |
| 87-AO reconstruct (tryptophan, cap-128 tile) | density relToMax **4.56e-4** (per-voxel 9.3e-4 above 1 % of max); HOMO (ORB_WGSL) 4.81e-4 |
| 120-AO reconstruct (C₂₀H₂₀, cap-128 tile) | density relToMax **3.69e-4** (8.0e-4); HOMO 5.56e-4 |
| C₆₀ dispatch at 96³, ORB_WGSL plain / screened | **13.67 / 3.62 ms** Chromium 153 (Vulkan); **15.01 / 4.08 ms** Firefox 157; via the field 3.65 / 4.17 |
| C₆₀ sampled-voxel check vs PySCF (256 voxel centres, 8 orbitals) | **4.0e-4 – 5.6e-4** of max \|ψ\| (max \|Δψ\| 6.0e-5); app f64 vs PySCF ≤ 9.7e-17; the record's own field check at Sol's 92 points 1.1e-16 |
| C₆₀ record | `lab/library/a8166591….json`, 145 328 B (142 KB; S4b regenerated it on the merged tree — it was `9520cedc…`, 140.7 KB, at the builder's tip), caps orbitals only; opened in 7–9 ms with 0 solver calls |
| density dispatch at 96³, cap-128 tile | tryptophan 19.6 ms (Cr) / 21.5 (FF); C₂₀H₂₀ 43.0 / 48.2 — once per change, never per frame |
| 32 KiB vs 32 lanes (same 87-AO density) | 19.41 vs 19.36 ms (Cr), 21.58 vs 20.85 (FF) |
| VALENCE (app, 64³) | lysine max ρ 47.79 → 1.601 (29.8×), texel vs f64 5.6e-4; benzene 7.372 → 0.327 (22.5×), 8.1e-4 |
| fixtures | `tests/fixtures/record-tryptophan.json` 87 AO, oracle Δ −8.0e-10 Eh, 190 s, 625 KB; `record-C20H20.json` 120 AO, −1.0e-9 Eh, 1091 s, 1.19 MB |
| lock runs | 588 at 96³ GREEN after C1+C2 (twice: before and after the shared-loop refactor), after C3 (plain, three skipped), and the molecular states after C4 (192 values); final tree: **1004 GREEN** (61 s) and **1148 GREEN** (62 s), each also GREEN once before the last −7-line trim |
| device report pair (headless Firefox, 30 s long play) | before (`b5eed68`): 18.2 fps, 547 presents, 0 held, loop median 1 ms, frame p95 83.3 ms, governor nominal @64³ · after: 19.1 fps, 576 presents, 0 held, loop median 1 ms, p95 83.4 ms, governor nominal @64³ |
| `lab/*.js` | 36 131 (`cfdd674`) · 36 137 (`b5eed68`, +6 the B1 fix) · **36 225** (+88 mine) |
| WGSL source lines (field.js) | 471 → 496; the tile kernel's compiled text unchanged (89 lines); ORB_WGSL 53 compiled lines |

## Tests

- `bash test.sh node`: **exit 0, 85 suites** (after C3 + the merge, and again on the final tree).
- `node tools/orbital-library.mjs --check` in step (3 records, 1 757 075 B, lab/library.json 9 572 B); `node tools/new-project.mjs --check`
  in step; `node tests/pwa.test.mjs` green (188 precached files; the C₆₀ record deployed, not precached, by rule).
- Browser on **8759/5227**, one suite at a time, 4 s apart: `chem` 54/54, `molecular-names`, `render-regressions`, `current`,
  `export3d`, `library`, `field-molecule`, `orbitals` 24/24, `new-project`, `history` (39 PASS) — all GREEN. `chem` was RED 1/54 on
  its pinned presentation-key list (the new `valence` key) and `library` on its pinned record rows (the C₆₀ row) — each test learnt
  the one fact, then GREEN.
- Harnesses: `tools/perf/s4c-kernel.mjs` (both browsers, all sections pass), `tools/perf/s4c-c60-app.mjs` (asserts green).
- **Re-run alone:** no lock was ever red. The timing table was re-taken on an idle GPU (P8) after a run beside another agent's
  browser suite read up to 2× slow (that run is not used).

## Blockers

None. Harness notes: Firefox runs WebDriver scripts in a sandbox — a DOM-prototype patch made there never reaches the page, and a
dynamic import there is its own module instance (its gpu-boot.js makes its own early request); the fallback check installs its
`requestDevice` wrap through a page `<script>` and takes the sandbox's early device first. A fresh headless Chromium on Vulkan
answered the lab's very first `requestAdapter` with null (`s4c-kernel.mjs chromium` → "no WebGPU adapter"); it now warms on
`tools/perf/limits.html` first, as the S0 run did. Loops and `cd`-compound commands were refused by the worktree guard (scripts
under `.tmp/`).

## Open items

- **M5 (pending) — one command for Josh:** on the desktop `./serve-lan.sh`; on the iPad open
  `https://<desktop LAN address>:8710/lab/?report=1&post=1` and keep hands off for three minutes (the device report lands under
  `research/device-reports/`); and `https://<desktop LAN address>:8710/tools/perf/limits.html` for MEASURE §1's ONE LINE —
  `wgStorage` / `device32k` say whether the iPad draws the cap-128 tier on 64 lanes or 32 (both lane counts draw identical texels within a browser here).
- The C₆₀ record's section is `LATTICE` (S4b may move it); its InChIKey and CID are S4b's to enter and verify. Its geometry is
  Sol's DRAFT (equal-edge ideal I_h); B4 (C₆₀ at the experimental geometry) precedes 0.4.1's I_h names.
- The two fixtures under `tests/fixtures/` are test inputs; S4b's tryptophan and C₂₀H₂₀ records (BIO, ORGANIC) are the content.
  `--fixture <id> --check` re-solves (C₂₀H₂₀ ~18 min), so it is not in the default `--check`.
- The density through the cap-128 tile is 19–48 ms a dispatch at 96³: fine once per change; a per-frame use (none exists — no
  TDHF past the cap) would need the tile's occupancy looked at.
- The `field.js` molWgsl reduction comment ("at cap 64 the tile is the whole 16 KiB workgroup budget") lives inside the WGSL
  text the ≤ 64 tiers must keep byte for byte, so it was left; the cap-128 tier on 32 KiB is the same statement one tier up.

## KIT BRIEF notes for S5

Nothing for the kit: the engine is λWAVES' (the χ tiers, ORB_WGSL, the frontier record, VALENCE's f64 subtraction). VALENCE is a
plain kit `sw` in an existing row's seat — no new skin.

## The exact next step

**The S4c verifier (the kernel)** on **8761/5229**, with BRIEF-S4-LIBRARY.md §S4c as its contract: `node .tmp`-free —
`LW_PORT=8761 GD_PORT=5229 node tools/perf/s4c-kernel.mjs firefox chromium` (tiers, the 87/120-AO records, the refused-device
fallback, C₆₀ vs PySCF, VALENCE, timing), `node tools/perf/s4c-c60-app.mjs`, `~/bin/scipython -I tools/perf/c60-voxels.py` (PySCF at
the voxel centres), the locks (`node tools/perf/digest-lock.mjs --check --query gastab=0` → 1004, and `--fixture
research/release-0.4.0/measure/digest-lock-s4a.json` → 1148), `node tools/orbital-library.mjs --check`, and the browser list
(`chem`, `molecular-names`, `render-regressions`, `current`, `export3d`).
