# BRIEF P3 · ORACLE + STATUS IN THE CATALOGUE (0.5.4 "Contract Layer"; Sonnet 5.5 @ high builder; STEP 1, beside P0 — file-disjoint: yours `lab/library.json`, `tools/orbital-library.mjs`, `lab/molecules.js` (one seat), `tests/library.test.mjs`; P0's are sentences elsewhere)

**Read first, whole:** `research/release-0.5.4/PLAN.md` (§D facts 1 and 6, row P3 in §E, §F gates, §G, §J rulings — R3 catalogue rows not sidecars; CERTIFIED is never
written by the app), `PLAN-DRAFT-2.md` §1 (facts with file:line as of the 0.5.2 tree — RE-FIND every seat by its words), `AUDIT-OPUS-1.md` Part A row P3,
`REVIEW-SONNET-2.md` (water would read UNCHECKED without the `oracles` member; 36 not 26 geometries), `tools/orbital-library.mjs` whole (`row.source` at the record's
`geometrySource` and `sources` lines; `--check`), `tools/library/record-oracle.py`'s header (READ ONLY — never run a Python of the library's), `tests/fixtures/oracles/sto-3g-v1.json`
(the live-only oracles), `tests/library.test.mjs`, `tests/molecule-head.browser-test.mjs` (the line that pins 38 rows), `lab/molecules.js` (where the library's rows are
read — the seat for `oracles`), `CLAUDE.md`, `docs/NOTES-FOR-AGENTS.md`.

## The row (+3 `lab/` lines, ESTIMATE; stop and report at +5; `tools/` and `tests/` uncounted)
1. **The generator** (`tools/orbital-library.mjs`): every row of `lab/library.json` gains `oracle: { what, delta }` (from the record's existing `oracle` — PLAN §D-1: 38/38 carry
   it; C₆₀'s delta is 0 by construction and its energy is **IMPORTED**), `geometry` in FOUR classes DERIVED from `row.source` — `experimental` (2: benzene, TiCl₄) ·
   `optimised-here` (26) · `computed-reference` (9: wwPDB / psi4) · `draft` (1: C₆₀) — and a per-quantity `status` object: `energy: MEASURED | IMPORTED`, `geometry` as above,
   `derivatives: 'UNKNOWN'` always. The classifier is ONE function with the source strings it matches written beside it; an unmatched source throws (never a silent UNKNOWN).
   `node tools/orbital-library.mjs --check` byte-exact after one regeneration (say the byte delta of `library.json` and prove the precache ≤ 8 MiB — `node tests/pwa.test.mjs
   --write` prints it, or the manifest test).
2. **The live-only molecules** (water, N₂, CH₄ … — the ones MOLECULES solves live, no catalogue row): an `oracles` member on the library object (NOT rows — `molecule-head`
   pins 38 rows), filled from `tests/fixtures/oracles/sto-3g-v1.json` by id, attached at the one seat in `lab/molecules.js` where the library is read (≈ +3 lines). The
   fixture is NOT copied into `lab/`: say where the bytes come from (the generator inlines them into `library.json`, or the app fetches the fixture — pick the one that adds
   no request on boot and say why).
3. **Tests:** `tests/library.test.mjs` gains one case per rule (every row has `oracle.what` and a finite `delta` ≤ 1e-8 except C₆₀'s 0; every `geometry` is one of the four;
   `derivatives` is `'UNKNOWN'` on every row; no row carries `CERTIFIED`) and a COUNT test 2 / 26 / 9 / 1; a case that water's id is in `oracles`.

## Laws
No `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit (`library.json` is precached — the hash moves). `bash test.sh node` exit 0.
THE LOCK ONCE after the `lab/` edit (the library bytes feed no field — expect 860 · 0/0; `node tools/perf/digest-lock.mjs --check --query gastab=0`, serving your worktree:
`python3 tools/gate/server.py <abs worktree> 9013 &` by pid, `LW_PORT=9013 GD_PORT=5483`, `node research/release-0.5.2/r2b-measure/rigfree.mjs` first, never pipe a gate
into `head`; kill your server by pid, never `pkill -f`). serialize-bytes untouched (no stored key). Never run a Python of the library's or the pilot's. Never write in
`~/Documents/OBSIDIAN`. One commit per step ("P3: …"); NO push. Your tree: a fresh worktree, `git reset --hard <the tip the launch names>`, confirm `git log -1`.

## Deliverables
`research/release-0.5.4/P3-BUILD.md`: §1 the four classes with the source strings each matches and the count (2/26/9/1 proved by the test); §2 the `oracles` seat and
where its bytes come from; §3 `--check` byte-exact, the `library.json` byte delta, the precache size; §4 the lock reading; §5 lines before / after; §6 what you could not
measure. Hand back ≤ 250 words: branch, tip, commits, suites + results, blockers.
