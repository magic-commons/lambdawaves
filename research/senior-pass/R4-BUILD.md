# THE SENIOR PASS · R4 — THE DOUBLES AND THE UN-EXPORT SWEEP (built 2026-10-29; Opus builder a3330a5b2f57f565d part A, Claude Yan part B)

Measured again at d4c92ba6 (the 10-25 audit was at 28c7b9a; 351 commits between). Nothing deleted; nothing drawn differently; THE LOCK not re-run
(no draw path moved — the merge of D on 10-29 holds 843/0 · 987/0 on the same lab bytes but for names).

## Part A — the doubles (commit 72dd0f58 on the builder's branch, merged as 6902a92c)
| name | files | what was found | action |
|---|---|---|---|
| `bondsOf` | elements.js · skeleton.js | already ONE rule since 021 G4 (b930ecc): skeleton.js' fallback bonds come from `elements.bondsOf` bit for bit | none |
| `uniqueName` | capture.js · user-presets.js | 021 G4 renamed capture.js' to `uniqueFileName`: a `-2` before the extension vs user-presets' `name 2` — two laws, not one | none (settled) |
| `statusOf` | volumes.js · status.js | 021 G4 renamed volumes.js' to `installStatus` | none (settled) |
| `cholesky` | linalg.js · sturmian.js | the two round differently; sturmian.js feeds THE LOCK | left, with G4's reason |
| `tableFor` | field.js · separable.js (·a third) | three different tables behind one seam | left |
| `gauss` | atoms.js · state.js | Gaussian elimination (the DIIS solve) vs the Gaussian | atoms.js' → `eliminate` (not `solveLinear`: scf.js exports another) |
Gates on the builder's tree: `pwa --write && ./test.sh node` exit 0; on yan-c after the merge: exit 0, rack-deps HOLDS (persist 24 of 25).

## Part B — the un-export sweep (one commit on yan-c)
- knip 6.43.0 with `.tmp/audit/knip.json` (entries main.js · gpu-boot.js · sw.js · mathworker.js · tools/** · tests/**): BEFORE 126 unused app exports
  (kit 462 = its public API, untouched) → AFTER 14 · 0 unused files.
- `.tmp/audit/unexport.cjs` dropped the `export ` keyword from 107 whole statements in 44 app files (and volumes.js' `export { storageInfo };` line; the
  import stays, volumes.js uses it). No declaration moved; no line count changed but that one.
- KEPT exported, by name: `lab/separable.js` all six (the systems' interface, read by name through the registry); `lab/verbs.js VERBS`
  (tools/gemma/verb-doc.mjs reads `mod.VERBS` from a dynamic import); six names that share a statement with a used one — lattice-model.js:9 BETA,
  atoms.js:163 RELATIVITY, library.js:15 DATA_CACHE, kick.js:160 slapOff, dynamics.js:183 C_LIGHT_AU + BOHR_NM, volumes-format.js:21 MAGIC.
- Reach the static graph cannot see was checked by the builder before the script ran: HTML imports, the workers, tests that parse source text, the
  facade (`window.__LW`), dynamic imports — none reach a dropped name.
- Gates on yan-c: `node tests/pwa.test.mjs --write && ./test.sh node` EXIT 0 (0 red); `node tools/rack-deps.mjs --classes --no-write` HOLDS (bare writes
  0; persist 24 of 25); dependency-cruiser circular 0; knip after = 14 as above. The browser suites were not run for a change that removes only
  `export` keywords; `tests/lw-facade.browser-test.mjs` is the one to run first if a facade name ever reads undefined.

## What R4 leaves
Nothing of the audit's Q3/Q4 queue is open. The 14 remaining "unused" exports are deliberate (above). R5 (the dead doors) stays Josh's word per door;
R6 (release checks) rides 028's REVIEW.md.
