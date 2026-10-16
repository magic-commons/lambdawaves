# G3 INTER-SHELL STARK — build note (Opus builder, 2026-10-16)

Branch `g3-stark` from `a2072ff`. `lab/` lines 29,525 → 29,580 (**+55**, the row's budget exactly; cap 29,820).

## Seats
- `lab/stark.js` (new, 35 lines): `hydrogenZ()` (THE SONG's z, moved here verbatim, its `eigSym` now `eigSymQL` — what `eigSym` runs at n = 91),
  `saddle(n) = 1/(16 n⁴)`, `polarizability(E)` (2 Σ_k |⟨1s|z|k⟩|²/(E_k − E_1s), the n ≤ 6 sum over states), `starkPropagator(F, E)` → the object
  `setPropagator` takes: `{ stark, F, ms, rank, H, S = I, E, C, CtS = Cᵀ, mK, evolve, norm }`.
- `lab/mathworker.js:461–462`: `hzOp` and the function body gone; `import { hydrogenZ } from './stark.js'; export { hydrogenZ };` (ONE build for the
  worker's song and the frame thread). `radial` in the hydrogen import on l.58 is now unused; it was left alone so G1's import edits merge clean.
- `lab/state.js` (the register, at the propagator's seat and the record): l.20 the import; l.90 `setEnergies` rebuilds an engaged propagator with
  the new E; l.95–97 `setField` keeps F under its own propagator and takes `inter` (default-absent; refused under another propagator); l.108
  `setPropagator` drops `inter` when STURMIAN engages and re-reads the record on `null`; l.109–110 `_stark(force)`: the record engages
  `starkPropagator(F, this.E)` while `inter` is on AND F ≠ 0 (F = 0 or an operator switch, which zeroes F, stands it down); l.425 the serialized
  `status` says `INTER-SHELL STARK`; l.436 `restore` reads `inter` and re-engages.
- `lab/windows/state.js` (STATIC FIELD row only, plus the import on l.9–10): l.165 STARK F re-anchors c(t) when INTER-SHELL is on (continuous
  across an F move) and syncs; l.167–171 the INTER-SHELL switch (refused with one sentence off hydrogen, under STURMIAN, or at Z ≠ 1; clears a
  running A/B; c(t) continuous); l.176 the INTER-SHELL readout; l.178–186 `interSync()` — the stand-downs (STARK K_z, DEFECT L², SPIN K_z, SPIN L²
  disabled and zeroed, TRANSITION and Ω RABI disabled) and the readout; l.187 `ui.fz.set` wrapped so any write of STARK F (a restore, an operator
  switch, NO FIELD, STURMIAN) syncs one microtask later, after the restore's own `applySturmian(true)` has run; l.188 the note.
- RATE · K_z · DEFECT guards now read ANY propagator: `lab/shell/controller.js` l.163, l.181, l.324 (`sturm.P` → `reg.P`; `sturm` dropped from
  its destructure, now unused); `lab/spectrum.js` l.123 (the RATE lane's title under INTER-SHELL) and l.212 (`rateOff = !!reg.P || …`).
- The word: `lab/status.js` owner `'stark'` (1 line: `HYDROGEN + F·z · NUMERICAL · eigensolve in the n ≤ 6 basis · no continuum: ionisation said,
  not simulated`, 103 of 110 characters); the three callers pick it (`informational.js` l.25, `windows/film.js` l.7 the export caption, `verbs.js`
  l.102); `badges.js` the STARK badge, H IN FORCE's sub and the canvas sentence say "across shells"; `index.html` the MODEL sheet's STATE sentence.
- `docs/STATE-SCOPES.md`: one row, `experiment.field.inter`.
- `tests/stark.test.mjs` (36 lines, 11 laws, all GREEN).

## The numbers (computed; `node tests/stark.test.mjs`)
| quantity | value | gate |
|---|---|---|
| ⟨1s\|z\|2p₀⟩ | 0.7449355390278893 (128√2/243 = 0.7449355390278032) | 1e-12 ✓ (8.6e-14) |
| z symmetric | max asymmetry 0 | exact ✓ |
| n = 2, m = 0 half-splitting at F = 1e-4 | raw 3F + 2.38e-9; Richardson (F, 2F) 3F − 6.1e-13 | 1e-10 ✓ |
| α(n ≤ 6), the basis's sum over states | **3.5855** = 79.7 % of 9/2 | printed, never 4.5 claimed |
| 1s shift at F = 1e-3 | −1.79287e-6 Eh vs −½α₆F² = −1.79276e-6 | 1e-9 ✓ (1.1e-10) |
| 1s shift at F = 0.002 | **−7.2e-6 Eh** (−½·4.5·F² would be −9.0e-6) | — |
| evolve at t = 100 | norm − 1 = 3.1e-15, round trip 4.3e-15 | 1e-12 ✓ |
| saddles 1/(16n⁴), n = 1…6 | 6.25e-2 · 3.91e-3 · 7.72e-4 · **2.44e-4** · 1.00e-4 · 4.82e-5 | exact ✓ |
| eigensolve (91 × 91, eigSymQL) | 3.0–4.5 ms (node and Firefox) | — |
| z build (once, 20 000-point trapezoid × 21 radials) | 286 ms on first INTER-SHELL press (node) | — |
The register laws in the same file: off = no propagator and no `inter` key; on = the propagator in force, c(t) continuous to 3e-15, ‖c‖² conserved;
a restore re-engages it (to 0); F = 0 stands it down; under STURMIAN the flag and F are both refused.

## Gates
`./test.sh node` rc 0 (after `node tests/pwa.test.mjs --write`); `node tools/rack-deps.mjs --classes` rc 0 (state 8, film 7, controller 12, the
largest still spectrum at 25); `node tools/new-project.mjs --check` in step (16117 B); `node tools/serialize-bytes.mjs` on this tree (9441) and on
the base `a2072ff` (9442): **11 of 11 readings byte-identical** (full and edit); hydrogen 37/37, dynamics 19/19, sturmian 16/16, kick 16/16,
qho 11/11, status 491 strings, stark 11/11. THE LOCK was not run here (the integrator's, ×2 at the merge with `--query gastab=0`): with INTER-SHELL
off every touched register path is the base's (`_stark()` is a no-op without `inter`), and the guards' `reg.P` is `sturm.P` whenever STURMIAN is on.

ONE browser check (`.tmp/g3-shot.mjs`, not committed; Firefox headless on 9441): 1s + 2p_z preset, INTER-SHELL pressed (the UI road), then
F = 0.002 through `__LW.restore` (the restore road): the propagator in force, STATUS reads the NUMERICAL line, K_z / DEFECT / SPIN K_z / SPIN L² /
TRANSITION / Ω RABI greyed, INTER-SHELL lit, the readout `1s -7.2e-6 Eh · α(n ≤ 6) 3.59 of 4.5` over `saddle n = 3 at 7.7e-4: nothing populated past
it`, no page errors. Screenshot: `.tmp/g3-intershell.png` (crop `.tmp/g3-crop.png`), in this worktree.

## Corrections to the brief and the plan
- α(n ≤ 6) is **3.59 (79.7 %)**, not 3.66 / 82 %: 3.66 is the bound-state sum to n = ∞; the register's n ≤ 6 carries 3.586. The readout prints
  the measured number.
- At F = 0.002 the 1s shift is **−7.2e-6 Eh**; the brief's −9.0e-6 is −½·4.5·F², the exact α's, which this basis does not have.
- The plan's example `saddle n = 4 at F = 2.4e-4` names a saddle the field 0.002 is far past; the readout names the LOWEST shell past its saddle at the
  F in force (n = 3 at 7.7e-4 for F = 0.002) and says "would ionise — this basis holds it" when a populated n reaches it.
- The plan's 2s/2p₀ gate "3F to 1e-10 at F = 1e-4" does not hold raw (the cubic term leaves 2.4e-9); it holds as the F → 0 limit by Richardson on
  F, 2F (6e-13) — the within-shell law as the limit, as the brief words it.
- "≤ 4 lines in `lab/state.js`": 4 new lines (the import, `inter` in `setField`, `_stark`'s doc and body) and 5 in-line edits (setEnergies,
  setField's F, setPropagator, the serialized status, restore), all at the propagator's seat (l.90–110) or the record (l.425, l.436) — none near the
  kick's seat.
- The stand-downs could not ride `applySturmian` (G1's `windows/spectrum.js`): they are applied by `interSync` in the STATIC FIELD row, and the
  guards that make them hold (RATE refusal, the K_z / DEFECT rate clamps and steps) were generalised from `sturm.P` to `reg.P`.

## Dropped, and why
- Ions (Z ≠ 1): refused at the switch — z would need its 1/Z scaling and the register does not know Z. If Z changes while engaged the propagator
  is rebuilt with the new diagonal but z unscaled (rare; a later row can pass Z).
- `rack.js` `statusLine()` (G1's file) still reads `STARK SHELL MODEL · FIELD GRID` under INTER-SHELL, because F ≠ 0. One-line fix at the merge:
  `if (reg.P && reg.P.stark) s = 'INTER-SHELL STARK · NUMERICAL · FIELD GRID';` after the STURMIAN line.
- The transport's period estimate (`transport.js`) reads label energies under any non-Sturmian propagator; under INTER-SHELL it is the field-free
  period (a recurrence readout, not the state).
- H IN FORCE is written by the badges' tick, which does not run while STATUS TAGS is off (the default) — as before for the within-shell STARK.
- The A/B switch's own guards (`windows/state.js` l.59, l.75, l.86, outside the STATIC FIELD row) still read `sturm.P`; the switch is disabled while
  INTER-SHELL is engaged and a running mix is stood down on the press.
