# X-BUILD — THE STAND-DOWN LAW (iteration 017, chain X; Claude Sos's Opus builder, 2026-10-26)

Branch `it017-x` from `yan-c` @ `8b31b39`. THE ONE NEW LAW: an effect shows its window. No new file in `lab/`, no `app` key,
`rack-deps --classes` HOLDS (spectrum still 25, readouts 14, persist 24, staticfield 1). THE LOCK untouched (no `field.js`, shader or render file moved).

## X1 THE LAW'S SEAT — rows inside each window's own file (the builder's call)
- `lab/windows/readouts.js` (root of `createReadouts`, seen by both later seats): `standDown(w, end)` wires the kit's `devclose` and a POWER OFF
  (the `.dev-power` click that leaves `.off`; the rack's own `apply()` powers through `setOff`, no click, so a project/layout never fires it).
  `toHydrogen(ops, id)`: if the operator in force is the window's AND the stepper still names it (or MOLECULES / LATTICE) → `switchHamiltonian('hydrogen')`;
  then `ui.hamSeg.readBack(id)`. The stepper closing the window it opened on its way to another operator is left to the stepper (no double solve).
  SEPARABLE · CENTRAL (central, cornell) · ATOMS (call 1, uniform) → HYDROGEN; LATTICE · BLOCH → read back; EMISSION → `ab.set(false)` when the
  running transition is EMISSION's (`reg.preset` starts `emission:`), the prepared pair kept.
- `lab/windows/static-field.js`: × / POWER OFF → `reg.setField({ Fz: 0, Bz: 0, inter: false })` (c(t) re-anchored under INTER-SHELL), knobs 0, one history row.
- `lab/windows/spectrum.js`: EQUALIZER closed or off is a `why` in `syncEq` (the table stands down, `setEqualizer(null)` + RECONSTRUCT; the faders keep their
  values, a reopen re-arms); `devclose`/`devopen`/power call `syncEq` at once. `ui.hamSeg.readBack(id)` clears `opened` and reads back the operator.
- `hidden` by moleculeMode is not a close: nothing listens to `hidden`.

## X2 THE RESTORE SIDE — `lab/shell/persist.js restore()`
After the equalizer lands: unless MOLECULES owns the field, operator separable → SEPARABLE, central/cornell → CENTRAL, atom → ATOMS, Fz·Bz·inter ≠ 0 →
FIELD, `!eq.birth()` → EQUALIZER, an EMISSION transition → EMISSION are `layout.reopen(id)`ed and powered on. It replaces 0.4.0 S0's raw ATOMS unhide
(which ran under MOLECULES too). Project, link, RESUME and UNDO alike (probe: pick CENTRAL → × → UNDO = central + its window back).
`node tools/new-project.mjs --check` in step (16098 B), unchanged.

## X3 THE WALK (Firefox via gatekit on 9671; `/tmp` probe, not committed) — after X1–X3
| system | field changed | STATUS names | stepper reads | windows | × → |
|---|---|---|---|---|---|
| HYDROGEN | — (already) | (blank at boot) | HYDROGEN | — | — |
| OSCILLATOR | rebuild +1 | OSCILLATOR −½∇² + ½r² | OSCILLATOR | — | — |
| BOX | rebuild, digest moves (enterBox packet) | SPHERICAL WELL | BOX | — | — |
| ATOM | rebuild | ATOM … · Ne | ATOM | +ATOMS | HYDROGEN, rebuild, stepper HYDROGEN |
| CENTRAL | rebuild | CENTRAL CONFINED | CENTRAL | +CENTRAL | HYDROGEN |
| QUARKONIUM | rebuild | QUARKONIUM (Cornell) | CENTRAL › QUARKONIUM | +CENTRAL | HYDROGEN |
| SEPARABLE | rebuild | SEPARABLE ISOTROPIC | SEPARABLE | +SEPARABLE | HYDROGEN (POWER OFF too) |
| MOLECULES | molecule takes the field (H₂O drawn) | (SPECTRUM folded) | MOLECULES | +MOLECULES | card closes, molecule keeps field (main window: outside the law) |
| LATTICE | its own register (card) | operator unchanged | LATTICE | +LATTICE | stepper reads back HYDROGEN |
Effects: FIELD Bz 0.02 → × → [0, 0]; EQUALIZER preset → table on → × off → reopen on; EMISSION Hα DECAY → transition on → × off (pair kept);
BLOCH × read back; ATOM POWER OFF → HYDROGEN. Arrows › from HYDROGEN now walk all nine and wrap. No console error.
Pictures: `X-shots/x3-molecules.jpg`, `X-shots/x3-lattice.jpg`.

What failed at BASE (verified in the browser before the fix) and the fix:
1. Every × left its effect (separable/central/cornell/atom operator, Bz, equalizer table, EMISSION's Rabi) → X1.
2. ‹ SYSTEM › MOLECULES only opened the card and read back the operator; › then stepped onto MOLECULES again — the arrows could never reach
   LATTICE. Now MOLECULES turns the molecule ON, any other system lets it go (`chem.setOn`), LATTICE reads LATTICE while its window is open.
3. A system whose window stood powered OFF ran its operator with the window dark → the stepper powers that window on (and X2 does on restore).

## Tests (all `nice -n 10`, one browser at a time, gate 9671 / GD 5671)
node: hydrogen 37/37 · card-solvers 7/7 · statelink 23/23 · new-project GREEN · rack-deps GREEN · `rack-deps --classes --no-write` HOLDS ·
`new-project --check` in step · `pwa.test --write` (sw.js re-hashed per commit). browser: window-switching GREEN · history GREEN (45 PASS) ·
new-project GREEN (8 PASS) · take-in-bugs RED at §3 — PRE-EXISTING: it looks for STATUS TAGS in the SETTINGS card, which moved to the kit's
TEXT › SHOW long before BASE (`settings-card.js:12`); nothing in this chain touches it. Re-aim belongs to whoever owns that suite (S or R).

## Open (for Josh / the next chain)
- MOLECULES' own × with the molecule ON keeps the field without its card (MOLECULES is a main window, outside the law) — should × mean OFF?
- FIELD's DRIVES (SPIN z · K_z · L² rates) and DRAG γ also live in that window and survive its × — the law's table names only Fz · Bz · INTER-SHELL.
- EMISSION's ownership is read off `reg.preset` (`emission:…`): a STATE A/B run over an EMISSION preset stops with EMISSION's × too.
- LATTICE reads LATTICE with the HAMILTONIAN rows empty (the operator in force is unchanged under it).

## The CLAUDE.md sentence to add
THE STAND-DOWN (iteration 017 X): an effect shows its window — SEPARABLE, CENTRAL (cornell), ATOMS, FIELD, EQUALIZER, EMISSION, LATTICE and BLOCH end
their effect on × (`devclose`) or POWER OFF (rows in `readouts.js` `standDown`, `static-field.js` `fieldDown`, `syncEq`'s `why`; the operator goes back
to HYDROGEN and ‹ SYSTEM › `readBack`s), `hidden` under MOLECULES is not a close, and `persist.js restore()` reopens (powered) the window of any
effect a record brings back; ‹ SYSTEM › MOLECULES turns the molecule on and any other system lets it go.
