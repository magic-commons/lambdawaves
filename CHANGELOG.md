# λWAVES — CHANGELOG

What changed between releases, newest first.  A release is a **git tag**; the work inside one is counted in
**waves**, one line each, in the words the wave gave itself.

This file is GENERATED — `node tools/changelog.mjs` — from the git tags and the wave headings in `REPORT.md`.
Do not edit it by hand; edit the heading in `REPORT.md` and run the tool again.

`REPORT.md` is the other document and it is not this one: it is the lab notebook — the laws, the constants, the
measured numbers and the named proofs, for whoever builds next.  It is not release notes; it ships beside the application as the engineering record.

---

## UNRELEASED — not frozen

Work since `pre-alpha-2` — 21 waves, 8 commits.  **Nothing here is frozen**: no tag points at it, the numbers may
still move, and it may be amended or dropped before a release carries it.  How dirty the working tree is on
any given afternoon is deliberately not recorded here — it changes on every save, and this file has to stay
stable enough to gate on.

- **wave 50**: W-CAMERA — NEBULA's motion as ONE law with a friction constant, and the four rack leftovers
- **wave 51**: W-MOBILE — one rack on the left, a 44-px finger on 22-px ink, and the low-power path
- **wave 52**: W-MODWINDOW — the modulation window replaces the playhead, and the playhead becomes its minimised mode
- **wave 53**: W-ASKS-I — the six visible asks from Josh's phone, and a logo that turns its palette instead of itself
- **wave 54**: W-ASKS-II — the machinery behind four more asks, and three places where the obvious build was the wrong one
- **wave 55**: W-FLOAT — the transport's dock, widened until any window can come off the rack
- **wave 56**: W-WIRING — three finished subsystems, two of them inert, and the window Josh asked to be one
- **wave 57**: W-HONEST — four things two audits found that are not matters of taste, and one ruling that says which
- **wave 58**: W-PULSE + W-H2CI-UI + THE TWO DIALS + THE CAMERA BUTTONS — two proved maths contracts get a face, and the planner one of them stands on gets corrected first
- **wave 59**: W-AUDITS — the harvest of four audits, in which almost nothing was this wave's idea and the whole job was doing each one exactly and proving it
- **wave 60**: W-MODSHAPE — the modulation window's missing half is one idea: a picture per source, and the six controls that picture makes meaningful
- **wave 61**: W-MACRO-ROUTER — the macro becomes the router, and the arc reaches out onto the knob it holds
- **wave 62**: W-KEYBOARD — the instrument becomes operable from a keyboard, and the law it needed was already written inside `knob()`
- **wave 63**: W-MODFIX — four defects the third review measured, and in three of the four the fix is that a law finally reaches the case it was written for
- **wave 64**: W-MOUNT — the modulation window arrives as an ARTIFACT, and the only thing this wave designed is the four edges it plugs into
- **wave 65**: W-MODKEY — one key for two clocks, an arm that is not a pause, and three resume laws that were already drawn on the card
- **wave 66**: W-GLASS — the MIR plugin puts on our glass, and the finding is that the glass was already built and switched off
- **wave 67**: W-FROST — the disconnected window, a vividness with its price on the label, and a drag that writes once a frame
- **wave 68**: W-KEYFIX + W-DEPLOY — a stale number is worse than silence, and a rule enforced by a coincidence of the address is not a rule
- **wave 69**: W-POLISH — the math face goes to work, three numbers earn the right to move, and the plugin stops being made of different stuff
- **wave 107**: W-FINISH — the rates turn the state, the keyboard manual gets its model, and saved projects acquire a boundary

<details><summary>commits</summary>

- `3ea35c2` 2026-09-07 — waves 50–106
- `f5897a1` 2026-09-07 — wave 106 · the gate catches up, and two defects it was written to catch
- `771936e` 2026-09-07 — the handoff, the landscape, and the keyboard manual wired
- `1113dca` 2026-09-07 — ASTRA-START.md
- `f11898d` 2026-09-07 — B131 was one selector, and the last six are diagnosed on disk
- `ce70497` 2026-09-07 — wave 107: finish rate macros, project guards, keymap and frame export
- `18e78c6` 2026-09-07 — LANDSCAPE: access.test.mjs does not hold the 44-px law, and B131 is unproven
- `79d7a4d` 2026-09-07 — the closing for wave 107, written from the diff and a full gate run

</details>

---

## `pre-alpha-2` — 2026-09-05

Commit `d3df5b4` · waves 10–49 · 1 commit.

- **wave 10**: the Kepler orbit — the quantum/classical boundary inside the machinery
- **wave 11**: the Hamiltonian selector, and the harmonic oscillator
- **wave 12**: the BOW — pull the wave like drawing a bow, and see the exact boosted state while you pull
- **wave 13**: keys you can rebind, and the first molecule
- **wave 14**: the optimisation round, measured, and the box
- **wave 15**: the hydrogen-like ion — the periodic table's first column, by exact scaling
- **wave 16**: HELIUM — the first many-body atom, the hard way, and electron correlation on screen
- **wave 17**: the box as a one-atom gas
- **wave 18**: H₂ — the bond, the collision, and a density that is not an orbital squared
- **wave 19**: the CALCULUS engine — the stats, derived live, with their laws and residuals
- **wave 20**: THE MATH AUDIT (Round 11) — what it found, and what changed
- **wave 21**: what the interface was costing, and a sweep for bugs
- **wave 22**: the shell — a floating rack over a full-screen stage, and a blur-free skin
- **wave 23**: DARK and LIGHT, the surface controls, the mirror rack, the frost trial, and the logo
- **wave 24**: the iPad round — Safari's black box, the auto render scale, a rack that scrolls, and the bounce
- **wave 25**: the second UX round — overlay shading, the wave as ±1, ⓘ outside the rack, the logo menu
- **wave 26**: defaults, the window taxonomy, SETTINGS, and the interface face
- **wave 27**: the + leaves the rack, VIEW and ABOUT, window names as hints, stage captions, the compaction pass
- **wave 28**: RATE per channel, A/B and the Rabi TRANSITION, the spectrum's own buttons, and the layout fixes
- **wave 29**: the OBSERVER split, the spectrum's order, stacked knobs, VIVID accents, accent scrollbars, Re+Im, full screen
- **wave 30**: the NOTEBOOK glass and the ABOUT face, FROST as a blur, and the playhead that follows the rack
- **wave 31**: QUARKONIUM in the HAMILTONIAN selector — the first item of the long queue
- **wave 32**: NOTEBOOK II — a typeable title, markdown + LaTeX, and PROJECTS
- **wave 33**: KEPLER as the SO(4) control surface — queue item 2
- **wave 34**: THE AXIAL GAS — the box's second register (queue item 3), and a Bessel bug older than the box
- **wave 35**: Josh's rulings after the round — the project file, the official layout, Kepler off
- **wave 36**: W-CLOCK — the transport says when the density repeats (the first contract of the round)
- **wave 37**: W-ATOMS — the periodic table as one central field, and the four things it must not claim
- **wave 38**: W-FIELD — the classical field of the register's own charge, in closed form, on the stage
- **wave 39**: W-STURMIAN — the scale is a switch: hydrogen untouched, and one exponent λ for all 91 radials beside it
- **wave 40**: W-WIGNER + W-RADIATION — the one joint object of x and p, cut through the axis, and what the pair would radiate
- **wave 41**: W-MO — the general basis on two centres, the force it really exerts, and the nuclei it drives
- **wave 42**: THE AUDIT — eleven findings of the read-only review, fixed and gated
- **wave 43**: UNDO / REDO — a ring over the register side alone, in which one whole drag is one step
- **wave 44**: THE WALK — what the proofs did not see
- **wave 45**: THE PERFORMANCE WAVE — the frame measured, the maths taken off it, and the blur named
- **wave 46**: MINIMAL GRAPHS — nothing floats inside a plot, one tip answers for the object under the pointer, and the light theme gets its own vivid shell set
- **wave 47**: CARD STYLE — the refractive glass was an accident; it is now a setting, and the default
- **wave 48**: THE FINAL STRETCH OPENS — the GPU's chrome learns the theme, the mark tiles and turns, and a hidden interface is finally the fastest one
- **wave 49**: THE LEFTOVERS AND THE THIRD LAB'S CONTRACTS

<details><summary>commits</summary>

- `d3df5b4` 2026-09-05 — PRE-ALPHA-2 FREEZE

</details>

---

## `pre-alpha-1` — 2026-09-03

Commit `8276557` · waves 2–9 · 5 commits.

- **wave 2** (Round 7 of the programme): the cusp, the Korselt law, the whole of SO(4)
- **wave 3**: DYNAMICS — the Lagrangian picture, the action–angle chart, the dipole, and a particle view
- **wave 4**: STATIC FIELDS, and a palette for the complex plane
- **wave 5**: draw styles with a ceiling, keyboard control, and the 4D ENGINE rotor port
- **wave 6**: the confining side (QCD), and what the round refuted
- **wave 7**: momentum space — the same state, two exact pictures
- **wave 8**: the SLAP — a sudden impulse, exactly, with the loss reported as physics
- **wave 9**: Round 10 — the hidden symmetry gated, the slice corrected, the rival's theorem bounded

_The numbering starts at wave 2: `REPORT.md` carries no heading for wave 1, the work before the waves were numbered — it is in the commits below._

<details><summary>commits</summary>

- `57aebb6` 2026-09-02 — QWAVE-0 exact core: hydrogen n≤6 closed forms (91 states, CS-phase complex Y_lm), register with…
- `d51867a` 2026-09-02 — FIELD: WebGPU reconstruction of ψ on an N³ rgba16float grid from closed-form mode tables (no…
- `3a03b92` 2026-09-02 — The instrument: rack (STATE/SPECTRUM/OBSERVER/SHADOW/METERS in the house grammar), tier router…
- `e818e10` 2026-09-02 — REPORT.md (exact / numerical / design-choice labels, proofs, measured GPU throughput: 3.06…
- `8276557` 2026-09-03 — PRE-ALPHA FREEZE

</details>
