# P1-BUILD — THE CONTRACT RECORD: identity + conventions as DATA (0.5.4 "Contract Layer", STEP 2 PAIR A, first half)

Builder: P1 (Opus 5.5). Branch `p1-contract-record`, reset to `0591605` (the `sos-s0` integration tip), one commit per step
("P1: …"), no push. Every seat below was re-found by its words at this tip; line numbers are as of the P1 tip.

What Josh will see: nothing. This row puts two contract fields where P4's `statusOf` and P5's export will read them — the
identity of what is on stage and the conventions it is drawn in — and one refusal a library record can meet. No stamp, producer,
worker, session line, project key, link, setting, frame-loop call or digest moves.

## 1 · `identityOf`: the canonical form, and the witness

`lab/molecule-state.js:133` (pure, DOM-free, node-importable; it judges nothing and throws nothing on well-formed input):

    identityOf({ atoms, basisHash, charge, multiplicity, model }) =
      sha256Hex([ 'identity 1',
                  'atoms ' + atomsKey(atoms),          // lab/library.js: sha-256 of JSON [[Z, x, y, z], …] in bohr
                  'basis ' + basisHash,                // sol.hash, the basis hash (md.js basisFrom: Z sequence + decimal strings)
                  'charge ' + charge, 'multiplicity ' + multiplicity, 'model ' + model ].join('\n'))   → 64 lowercase hex

The header of `molecule-state.js` states this form. `atomsKey` is IMPORTED from `lab/library.js` (not copied), so a record's
`input.atomsSha256` and a live solve's atoms hash the same way by construction. MEASURED: on all 38 catalogue rows the record's
`input.atomsSha256` equals `atomsKey(moleculeAtoms(id))` — the atoms a live solve is handed — **38/38** (`molecule-state.test` §7a).

**THE MOVED-H WITNESS** (`molecule-state.test` §7a, H₂O/STO-3G): hydrogen 1 moved +0.01 bohr in z and RE-SOLVED with
`moleculeRHF` — the solve's basis hash is unchanged (`d6aadbf2ff71…`), the identity moves (`de7feb25e072…` → `b5ef314129bb…`).
Charge 1, multiplicity 3, model `UHF` and the 6-31+G\* basis hash each move it too. The identity equals the sha-256 of the six
lines written out in the test by hand (`node:crypto`, not the lab's `sha256Hex`).

THE STUTTER LAW: `identityOf`'s one caller is the solve landing (§2). MEASURED in node: 48 µs (H₂O), 21 µs (C₆H₆), 39 µs (lysine),
79 µs (C₆₀, 60 atoms) a call — once per landing, never in a frame.

## 2 · The `sol.identity` seat, and the proof no stamp moved

`lab/chemview.js:331`, inside `fill()` of the solve landing, the line after `sol = r; sol.key = key; …` (`:330`):

    sol.identity = MS ? MS.identityOf({ atoms, basisHash: r.hash, charge, multiplicity: 1, model: 'RHF' }) : null;

`MS` is loaded by then (the landing waits on `Promise.all([first(), loadMS()])`); `atoms` and `charge` are the solve's own
(`chemAtoms(preset)`, `chemCharge(preset)`), `r.hash` the reply's basis hash for both the live road and the record road
(`chem.open` answers `g.hash`, `library.test`). RHF is closed-shell, so multiplicity is 1. Read by nobody else in this release
(P4, P5 are its readers); nothing enumerates `sol` (`grep -n "\.\.\.sol\b\|keys(sol)"` → nothing; `solution()` returns it whole).

LIVE (a throwaway probe, `.tmp/p1-identity-probe.mjs`, on the booted lab at 9023, rigfree first): `__LW.chem.solution().identity` after
`__LW.chem.solve(id)` equals node's `identityOf({ atoms: moleculeAtoms(id), basisHash: <the reply's hash>, charge, 1, 'RHF' })` on all
three roads — H₂O live `de7feb25e072…` (the same identity `molecule-state.test` §7a computes for its water), C₆H₆ live under the cap
`2cbb9422de3a…`, C₆₀ by the record road (`chem.open`, 145,328 B fetched and checked) `afd7c355ef3f…`; page errors 0.

THE STAMPS DID NOT MOVE: `git diff 0591605 -- lab/molecular-session.js lab/mathworker.js lab/statesview.js` → **empty (0 bytes)**.
`sol.hash`, `E_BASIS_HASH`, the worker key and the session stamp are byte-for-byte; so are `lab/orbitalsview.js`, `lab/worker-pool.js`,
`lab/clock.js` (PAIR B's), `lab/library.json`, `tools/orbital-library.mjs`, `lab/molecules.js`, `tests/library.test.mjs` (P3's).

## 3 · `E_IDENTITY`: the one case, and its test

`CODES` (`lab/molecule-state.js:44`) = `['E_SHAPE', 'E_BASIS_HASH', 'E_MMUT_HISTORY', 'E_TRACE', 'E_IDENTITY']`; the header's
list of named rejections is five. `restoreMolecule(rec, { record, S, lib })` gains `lib` — a LIBRARY record (the worker's own name
for it, `chem.open`'s `lib`; `record` already names the vendored BSE file). The one case (`:222-223`): the restored atoms do not
hash to `lib.input.atomsSha256` → `MoleculeStateError('E_IDENTITY', 'the atoms hash to … and the library record <id> names …; a
moved atom is another molecule under its name')`. A state built from a record's own `input.atoms` (P5's road) meets it exactly
when that record's atoms do not hash to its `input.atomsSha256`; a moved atom restored under an intact record's name meets it too.
No `lib`, no claim, no check. It runs only in `restoreMolecule`; the frame road and chemview's `load()` (which passes no `lib`)
are untouched — no identity refusal on the frame road (§G).

Test (`molecule-state.test` §7b, C₆H₆'s real record decoded through `library.js`): the intact record restores with
`{ record, lib }` and moves no byte; the record with hydrogen 1 moved 0.01 bohr → `E_IDENTITY`; that moved state under the intact
record → `E_IDENTITY`; no `lib` → passes; `CODES` pinned. MUTATION: with the check disabled the suite fails at "a record whose atoms
do not hash to its input.atomsSha256".

THE BRIEF'S "pinned `CODES` list in its test" did not exist at `0591605` (`grep -rn CODES tests/` → nothing; the test header said
"the four named refusals"). The pin is ADDED and the header says five.

Projects keep `{ id, hash, nameKey }` unchanged (`chemview.js` `save()` untouched).

## 4 · `CONVENTIONS`, and the equality tests

`lab/molecule-state.js:135`, one frozen object, read by P4 and P5, written by nobody:

| member | value | source |
|---|---|---|
| `basisKind` | `BASIS_KIND` (`'cartesian'`) | referenced |
| `componentOrder` | `COMPONENT_ORDER_LINE` (`'s; x,y,z; xx,xy,xz,yy,yz,zz'`) | referenced |
| `rd` | `'M_pyscf = R_d M R_d; R_d = 1 on s and p, √(4π/5) on xx,yy,zz, √(4π/15) on xy,xz,yz'` | `md.js` `rdOf`'s rule, as a string |
| `axes` | `CONVENTION` (the object) | `names.js`, imported — one frame sentence per point group |
| `kernel` | `'D = Σ f c c†; P = W D W'` | `density.js`' header (undeclared until now) |
| `current` | `'−Im D, the transpose'` | `molecular-flow.js` + `chemview.js`' FLOW feed (undeclared until now) |
| `energyRef` | `{ hydrogen: 'absolute', states: 'relative to ground', packet: 'absolute ε·t' }` (frozen) | `field.js:13` / `hydrogen.js`; `molecular-register.js` (`energies` GROUND = 0); `orbitalsview.js:285,399` (`phase − ε_k t`) |

No cycle: `md.js` was already imported; `names.js` imports only `canon-gauge.js` (already in the graph through `rhf-molecule.js`);
`library.js` imports only `md.js`. In the page, chemview imports both statically already, so the lazily loaded record module
fetches no new file.

The equality tests (each declared string equals the literal its proof KEEPS; the proofs are unchanged):
- `density.test` §2: the case's own `D0 = c cᵀ` (D = Σ f c c†, one electron) and a hand-written `W D W` against the engine's P at
  t = 0, plus `W W = S` (both ≤ 1e-14), then `CONVENTIONS.kernel === 'D = Σ f c c†; P = W D W'`.
- `molecular-flow.test` §5 (the −Im D case, `imNeg`): its sign check unchanged, then `CONVENTIONS.current === '−Im D, the transpose'`.
  §2 (`:64`) proves the evaluator's own ⟨a†_p a_q⟩ (D_pq = c̄_p c_q); the declared `current` names density.js's D handed as −Im D,
  which is §5's literal, so the equality sits there.
- `molecule-state.test` §7c: `basisKind`/`componentOrder` are the constants AND their literals; `axes` IS `names.js`' object;
  `rd` equals its literal AND `md.js` `rdOf` gives exactly 1 / √(4π/5) / √(4π/15) on all 19 functions of an oxygen 6-31+G\* basis
  (d shell present); `energyRef` deep-equals its literal; the object and `energyRef` are frozen.

## 5 · Nothing entered a record, a project, a link or the settings — and the readings

`serializeMolecule`'s output: unchanged — `molecule-state.test` §1 still pins its nine keys and save → restore → save bytes, and §7b
restores a record through the new `lib` path with no byte moved. No `localStorage`, project, link or WORKSPACE code was touched.

- **THE LOCK** (once, after the `lab/` edits; gate server `python3 tools/gate/server.py <worktree> 9023`, pid 1953429; rigfree
  first; `LW_PORT=9023 GD_PORT=5493 node tools/perf/digest-lock.mjs --check --query gastab=0`): **DIGEST LOCK GREEN: 860 values compared ·
  0 readback differences · 0 record-byte differences · unrepeatable now: none · page errors 0 · 59 s.** The first attempt was held by
  rigfree (another builder's geckodriver + marionette Firefox running `history.browser-test`); the lock ran once, when the rig was free.
- **serialize-bytes**: `tools/serialize-bytes.mjs --out` on the untouched `0591605` tree (before any `lab/` edit) and on the P1 tree,
  compared with `research/release-0.5.2/integrator/sb-compare.mjs`: **full 11/11 · edit 11/11 IDENTICAL**, 0 page errors on either
  tree (no stored key: the identity and the conventions reach no project, link, history row or setting).
- **`node tools/new-project.mjs --check`**: in step (16117 B), exit 0.
- **`node tests/pwa.test.mjs --write`** after the `lab/` edits (sw.js re-stamped), and the pwa suite inside the node gate.
- **`bash test.sh node`**: **exit 0** on the P1 tree before the commit split and again on the final step commit (1004 PASS/GREEN lines).
  The `lab/` bytes of the final commit (`molecule-state.js`, `chemview.js`, `sw.js`) are byte-identical (`cmp`) to the tree the lock,
  serialize-bytes and the probe ran on.
- Commits, one per step: `b97b8a4` identityOf · `70c27fe` sol.identity · `ecb4e0d` E_IDENTITY · `0501c72` CONVENTIONS · this BUILD.
  Each step commit re-stamped `sw.js` and passed `molecule-state.test` (steps 1–3) or the three edited suites (step 4).

## 6 · Lines

`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: **before 28,023; after 28,047; +24** (budget +27; stop line +40).
`molecule-state.js` +23 (header: the E_IDENTITY rejection 2, the contract-record paragraph 6; imports 2; `identityOf` 4 with its
section line; `CONVENTIONS` 5 and a blank line; `restoreMolecule` 3), `chemview.js` +1. Subtracted: nothing could be — the row adds a function, an
object and a refusal; every number in it references an existing constant except the three undeclared strings.

## 7 · What I could not measure

- **The 1004-value lock** (`--fixture research/release-0.4.0/measure/digest-lock-s4a.json`): not run — the brief names the 860 once.
  The lock opens no `record()`, STATES, FLOW or packet, so it could not see this row anyway; the serialize-bytes pair and the probe are
  the browser readings that touch it.
- **A frame-call probe for `identityOf`**: none in the page. The proof is structural — one call site (`chemview.js:331`, the solve
  landing's `fill()`), `grep -rn identityOf lab/` — plus node timings (≤ 79 µs on C₆₀). P4's no-frame-call probe is the page-side one.
- **`E_IDENTITY` in the page**: no page road passes `lib` (chemview's `load()` restores a carried record with no options), so the
  refusal is proven in node only; P5's export is its first caller.
- **The Worker-less road** (`localSolve` on the frame thread) and a 6-31+G\* live solve were not probed in the browser; both land
  through the same `fill()` with the same `r.hash`, so the identity is built the same way — not measured.
- **Intermediate step commits 1–3** carry their own `molecule-state.test` + pwa run, not a full node gate, lock or serialize-bytes;
  the final commit's `lab/` is the gated one.
- **serialize-bytes against 0.5.3's cut** is P-V's comparison; mine is `0591605` against the P1 tree.
- **Whether `model: 'RHF'` and the member names suit P4/P5** is theirs to say; nothing reads either yet.
