# BRIEF P1 · THE CONTRACT RECORD — identity + conventions as DATA (0.5.4 "Contract Layer"; Opus builder; STEP 2 PAIR A, first half — P4 follows on your tip + P3's)

**Read first, whole:** `research/release-0.5.4/PLAN.md` (§D facts 1, 2, 6; row P1 in §E; §F gates; §G; §J — R13: identity is DATA, never a stamp), `PLAN-DRAFT-2.md` §1 (F1, F6: why the
stamp is NOT touched — four readers rely on `sol.hash`), `AUDIT-OPUS-1.md` Part A rows P1 and P2 (the struck identity-key design and why; THE ROW as the auditor wrote it),
`REVIEW-SONNET-2.md` (one pure function; the moved-H witness), `lab/molecule-state.js` whole (`SCHEMA`, `BASIS_KIND`, `COMPONENT_ORDER_LINE`, `CODES`, `MoleculeStateError`,
`serializeMolecule`, `restoreMolecule`), `lab/chemview.js` around the solve landing (`sol.key`, `fieldHash`, the `restoreMolecule` call), `lab/density.js` header (the kernel
line), `lab/molecular-flow.js` header (the current's sign), `lab/md.js` (`rdOf`), `lab/names.js` (`CONVENTION`), `tests/molecule-state.test.mjs`, `tests/molecular-flow.test.mjs`
(the sign literals), `tests/density.test.mjs`, `tests/rhf-molecules.test.mjs`, `tests/library.test.mjs`, `CLAUDE.md`, `docs/NOTES-FOR-AGENTS.md`, `docs/STATE-SCOPES.md`.
Seats named with line numbers were measured on an older tree: RE-FIND by words.

## The row (+27 `lab/` lines ESTIMATE; stop and report at +40)
1. **`identityOf({ atoms, basisHash, charge, multiplicity, model })` → one sha-256 hex string**, a PURE function exported from `lab/molecule-state.js` (no DOM, node-importable;
   the hash of a canonical string — the atoms as the library's own `atomsKey` form so a record's `input.atomsSha256` and a live solve's atoms hash the same way; say the
   canonical form in a header comment). A moved hydrogen (0.01 bohr) changes the identity and NOT the basis hash — the witness test.
2. **`sol.identity`** set beside `sol.key` where chemview lands a solve (the module is loaded by then). Read by nobody else in this release (P4's `statusOf` and P5's export
   are its readers). **No stamp, producer, worker or session line changes** — `sol.hash`, `E_BASIS_HASH`, the worker key, the session stamp all stay byte-for-byte.
3. **`E_IDENTITY`** joins `CODES` for ONE case: `restoreMolecule` handed a library `record` whose atoms do not hash to its `input.atomsSha256` — a `MoleculeStateError` in the
   file's idiom (a code and a sentence). The pinned `CODES` list in its test is updated. Projects keep `{ id, hash, nameKey }` unchanged.
4. **THE CONVENTIONS, one exported object** in the same file (name it `CONVENTIONS`), REFERENCING what exists — `BASIS_KIND`, `COMPONENT_ORDER_LINE`, `md.rdOf`'s rule as a
   string, `names.CONVENTION` — plus the three undeclared ones: `kernel` ('D = Σ f c c†; P = W D W', `density.js`' header), `current` ('−Im D, the transpose',
   `molecular-flow.js`' header), `energyRef` per producer (hydrogen absolute · STATES relative to ground · packet absolute ε·t). If `molecule-state.js` cannot import
   `md`/`names` without a cycle, hold their strings as literals and let a test assert equality with the source constants. The sign tests KEEP their literals and gain an
   equality assertion against the object (a test that reads the object the code defines proves nothing on its own).
5. Nothing enters `serializeMolecule`'s output (its save→restore test pins the bytes); nothing enters a project, a link or `lambdawaves.q0.settings`.

## Laws
No `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit. `bash test.sh node` exit 0. **THE LOCK once** after the `lab/` edits (your gate
server `python3 tools/gate/server.py <abs worktree> 9023 &` by pid; `LW_PORT=9023 GD_PORT=5493`; `node research/release-0.5.2/r2b-measure/rigfree.mjs` first; `node
tools/perf/digest-lock.mjs --check --query gastab=0` → 860 · 0/0; never pipe a gate into `head`; kill by pid, never `pkill -f`). `tools/serialize-bytes.mjs` 11/11 IDENTICAL
(no stored key) and `node tools/new-project.mjs --check` in step. THE STUTTER LAW: `identityOf` runs once per solve landing, never in a frame. Never write in `~/Documents/OBSIDIAN`.
One commit per step ("P1: …"); NO push. Your tree: a fresh worktree, `git reset --hard <the tip the launch names>`, confirm `git log -1`. Another builder (P3) edits
`lab/library.json`, `tools/orbital-library.mjs`, `lab/molecules.js`' library seat, `tests/library.test.mjs` — do not touch those; a PAIR B builder edits `lab/worker-pool.js`,
`lab/orbitalsview.js`' packet loop, `lab/clock.js` — not yours either.

## Deliverables
`research/release-0.5.4/P1-BUILD.md`: §1 `identityOf`'s canonical form and the witness; §2 the `sol.identity` seat (file:line at your tip) and the proof no stamp moved
(`git diff` of `molecular-session.js`, `mathworker.js`, `statesview.js` = empty); §3 `E_IDENTITY`'s one case and its test; §4 `CONVENTIONS` and the equality tests; §5 the lock,
serialize-bytes, new-project readings; §6 lines before / after; §7 what you could not measure. Hand back ≤ 250 words: branch, tip, commits, readings, blockers.
