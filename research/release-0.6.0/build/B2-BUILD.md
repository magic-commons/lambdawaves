# 0.6.0 B2 BEAT MODE — the build (Opus 5.5, 2026-10-15)

Branch `b2-beat-mode` from `053bc3b` (yan-c, B1 merged). Five code commits + this note. Josh's dial held: no new tool, probe, fixture or suite.

## What landed (seats at the tip)
- **SPECTRUM › BEAT EQUALIZER** (`lab/windows/spectrum.js` :104–131), one `group` under the ladder (the grid has no mode switch, so
  not a third mode), above HAMILTONIAN: a 6 × 6 canvas (one texel a cell, `.eq-grid` in lab.css) — cell (n, n′) = |Γ_nn′|·√(w_n w_n′),
  brightness against the brightest cell, colour by |ΔE| < 0.0263 Eh magenta · < 0.1130 orange · else yellow (named creative in the
  comment); the PRESET as the kit's `stepper` in MOLECULES' look (`cls: 'mol-step'`); PURITY (`readout`, three figures; sub = the gate
  sentence · "repaired" · "pure" / "mixture · no phase" / "signed · relative floor 2·10⁻⁴"); six kit `fader`s 1…6, 0–100 %; the note
  "the beats fade, the shells stay". `keepT` (:15) is the `keep` idiom hoisted (applySturmian's `keep` now calls it).
- **syncEq(hand)** (:116): key = stand-down reason + preset + gains + `reg.version` (a rate or Z change bumps the version through
  `setEnergies`); only on a changed key it calls `eq.table(...)`, `field.setEqualizer(t)` + one RECONSTRUCT (skipped while FLAT stays
  FLAT), repaints faders / stepper / PURITY / grid. Called from the loop's cpuTick (`lab/rack.js` :474, so a folded or closed SPECTRUM
  still follows) and from the faders and the stepper. MOLECULES on · STURMIAN · a non-hydrogen operator · momentum space: the group
  greys (`.grp.eq-off`), its title says why, the table is cleared. A HAND entering a signed table (mode 2) sets VIEW to Re ψ through
  the seg and says so in SPECTRUM's status; a restore or undo never moves VIEW.
- **The badge clause** (`lab/badges.js` :62): "; equalized: a mixture, it has no phase" while the field holds a mode 1/2 table, read off
  `field.equalizer` — a LIVE getter (`lab/field.js` :1646, in the `defineProperties` block; the first cut sat in the `Object.assign`
  and froze at null — caught by the smoke, fixed in 43f3dd4).
- **State**: `app.state.eq` (the equalizer, filled at SPECTRUM's seat) and `app.state.eqNoNodes` in the literal (`lab/rack.js` :120).
- **PROJECT key `presentation.eq`** (`lab/shell/persist.js` :73 written only when not FLAT at gains 1; :276 `eq.restore(pr.eq)`, absent
  = FLAT; the loop's syncEq repaints the card). The undo ring carries it (a fader's `onChange` → `hNote`; a press is framed by the
  history's own pointer hold). `docs/STATE-SCOPES.md`: one PROJECT row.
- **THE STAND-DOWN**: `eqNoNodes` = mode 1 ∧ λ_min > 10⁻³·λ_max (set in syncEq :125); `overlayDomain` gains `&& !app.state.eqNoNodes`
  (`lab/rack.js` :479); VORTEX's LOCATE (`ui.vorOn`, registered at `lab/windows/readouts.js` :69) and PARTICLES (`ui.pOn`) take the
  kit's disabled look with "the equalized picture has no nodes (λ_min = …)" (the kit lifts the title into its help), restored after.
- `tests/wiring.test.mjs`: B1's ALLOWLIST row deleted; `lab/sw.js` rewritten by `pwa --write`.

## Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 28,214 → **28,249 (+35)**; budget +55, stop +75. (+2 lines of lab.css.)

## Commands run
- `git reset --hard 053bc3b` → HEAD 053bc3b.
- `node tests/pwa.test.mjs --write` after each lab edit (first try RED: equalizer.js reached but excluded by the ALLOWLIST — fixed by step 5).
- `node tools/rack-deps.mjs --classes` → G-G HOLDS, spectrum at **25** (limit 25), app.state 60 keys, G-A clean (its two research/
  outputs restored, not committed).
- `bash test.sh node` → **exit 0** (after step 4). A second run after the getter fix: exit 1 at `wigner.test` W42-8 alone, a
  150 ms wall-time corner (187 / 219 ms) with the load average at 14–18 from other builders; wigner is untouched; first run green.
- `node tools/new-project.mjs --check` → in step (16117 B). `tools/serialize-bytes.mjs` is a browser tool: not run (FLAT writes nothing,
  so no existing project's bytes can move).
- `LW_PORT=9231 GD_PORT=5331 node tests/history.browser-test.mjs` → exit 0, 45 PASS / 0 FAIL.
- `… node tests/latex-copy.browser-test.mjs` (the SPECTRUM card's ⧉ and fold) → GREEN, 10 PASS.
- CDP smoke (throwaway `.tmp/b2-smoke.mjs` on gatekit, `?preset=1s%2B2pz&warn=1&starter=home&sw=0`, t = 3.7, the stepper's own ›
  button): FLAT `4d36a9a5` (no table) → GAUSSIAN `a8bf297d` (B1's hashes; purity 0.625, "mixture · no phase") → CAUCHY → undo ×2 →
  `4d36a9a5` byte for byte, no table. **SMOKE GREEN 4/4.**

## Not as briefed / not done
- **VORTEX under GAUSSIAN at gains 1 stays ENABLED**: GAUSSIAN's λ_min is 6.3·10⁻¹² of λ_max 4.9 (B1's own number), below the 10⁻³ floor —
  nodes approximate, by the law as written. CAUCHY (λ_min 9.29·10⁻³) is the preset that disables it; the smoke checks that instead.
- The badge clause is code-read only: with STATUS TAGS off (the default) the sentence is written only while the canvas has focus.
- KEPLER stands down with VORTEX under `eqNoNodes` (the gate is shared, as briefed).
- No REPEATS / MODULATION targets / METERS tile / CHORD demo (other rows).
