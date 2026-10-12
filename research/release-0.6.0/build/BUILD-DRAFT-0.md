# 0.6.0 "Beat Equalizer" — THE BUILD PLAN, pre-draft (Fable 5.1 / Claude Sos, 2026-10-11 21:05 CDT; the nacre method's DRAFT 0)

The first cut of THE ENGINE PLAN (`../PLAN.md` D.1; the method `../NACRE.md`; the build-plan precedent `../../release-0.5.4/PLAN.md`). Every seat below was
re-found by words on `sos-s0` at v0.5.4-alpha (`49b167d`; 28,101 `lab/` lines; the seat census of 20:50, read-only). Nothing here is built. Josh's words that
bind: "Let's excecute the master plan" (13:05); the starred §F-1 of the master plan — Beat Equalizer first; "Yes to all. I think this would be fun." (19:35, on
Sol's synthesis — nothing of it lands in 0.6.0). Defaults stand if he says nothing.

## A · In one paragraph, for Josh
0.6.0 gives the hydrogen stage an EQUALIZER: six gain knobs on the six shells of the register (and presets — a Gaussian jitter, a comb, a phase pulse), drawn
in ONE pass by a derived copy of the field kernel that keeps six accumulators instead of one; a BEAT mode on SPECTRUM's grid that shows which pair of shells
each colour of the picture comes from; the picture split four ways (plain · within-shell · beats · interference only); a PURITY meter; the period readout saying
"repeats exactly every 1.094 ps" and never printing a false period under custom rates; VORTEX and PARTICLES standing down with a sentence when the equalized
picture has no nodes; six shell RATEs as modulation targets with a flash declaration; METERS showing the picture's own f16 floor with its metric. Underneath,
the first engine row the whole ladder rests on: ONE `owner()` that says what the field is showing, read by every site that decides who may draw — a table test
pins today's answers before anything new arrives. Also the 6-31+G\* oracles 0.5.4 owed (water in 6-31+G\* stops reading UNCHECKED). ≈ +215 − 18 `lab/` lines
against a cap of 28,382 (281 of headroom); the builders stop at 1.5×. Local cut; nothing pushed.

## B · What you will see
- **MOLECULES off, hydrogen on, SPECTRUM › BEAT.** The state grid gains a third mode beside STATES and TRANSITION: BEAT — a 6 × 6 shell grid (ω × Δm folded to
  shells), each cell the strength of that pair's beat in the picture, coloured by the chord's log thirds (magenta · orange · yellow — creative, named so). Six
  EQ sliders along its foot (the six shells, 0–100 %; 100 % everywhere = today's picture, bit for bit). Presets under a PRESET select: FLAT · GAUSSIAN JITTER ·
  CAUCHY JITTER · BOX JITTER · COMB (517.016 a.u.) · PHASE PULSE · BEATS ONLY · INTERFERENCE ONLY.
- **The picture** under a physical table is a density (√ρ′, 0): PHASE, Re and Im stand down ("the equalized picture is a mixture; it has no phase") except under
  a pulse. Under an indefinite table (BEATS, INTERFERENCE ONLY) a SIGNED volume on the shipped Δρ presenter, labelled "signed · relative floor 2·10⁻⁴ of ρ".
- **PURITY** in the BEAT grid's corner: Tr(D∘G)² to three figures; 1.000 for FLAT and any pulse.
- **The labels gate.** If two labels in one shell carry different RATEs, the EQ greys with "one rate per shell for the equalizer" — the picture is today's.
- **REPEATS** says "repeats exactly every 1.094 ps · T = 14400π a.u." for the field-free register; under custom per-label rates it says "no exact period" instead of
  a false one (the period guard).
- **VORTEX · PARTICLES** grey out under a positive-definite table whose smallest eigenvalue is above the floor: "the equalized picture has no nodes (λ_min = …)".
- **The dephasing caption** (one sentence, INFORMATIONAL): "the beats fade, the shells stay".
- **MODULATION** gains six targets SHELL 1…6 RATE (one per shell), with the flash declaration; RATE knobs whose beats alias above 3 Hz on screen carry a label.
- **METERS** gains one tile: FLOOR · "one f16 ulp (≤ 9.8·10⁻⁴ of the value, toward zero on this rig) · hydrogen 3·10⁻⁶ RMS, 2·10⁻⁴ worst" — read from the
  constants P4 ships, never typed.
- **MOLECULES on, water in 6-31+G\*:** THE HEAD and STATUS read NUMERICAL · energy agrees with PySCF to 1·10⁻¹³ Eh (today: UNCHECKED).
- **A CHORD demo** in `lab/demos/`: three shells at a RATE the flash law passes, sound off (audio is 0.6.4).
Nothing above the MOLECULES fold moves; no new window (the `lab/windows/` law); no new PREFERENCE; the Γ table persists as PROJECT, default-absent.

## C · Your decisions (defaults stand if you say nothing; flip any)
1. **`sim-ladder`'s rate.** Its `visual.rate` is 60 (`state.js:621–632`); at 60 its beats alias above 3 Hz on screen. ★ The preset keeps 60 and CARRIES THE LABEL
   the flash law gives it — or it drops to 40, where the law passes silently (the master plan's "sim-ladder at 40"). Your preset, your call.
2. **The BEAT grid's colours** — magenta · orange · yellow by the chord's log thirds (cuts 0.0263 and 0.1130 Eh; 4/6/5 beats) ★ — or the palette's own three.
3. **The equalizer's seat** — a BEAT mode of SPECTRUM's grid (no window; `lab/windows/spectrum.js`) ★ — or a window of its own in `lab/` (+UI ×2).
4. **The preset names** above (★) — yours to rename, one or two words.
5. **The chord demo** ships silent ★ (sound is 0.6.4's consent switch) — or waits for 0.6.4.
6. **The 6-31+G\* oracles** land in 0.6.0 as the owed row (0.5.4 §J-4 N4) ★ — or wait for P13's three 6-31+G\* records (your Q3, still open).

## D · The facts the rows stand on (file:line as of `49b167d`; MEASURED where a script exists under `../measure/`)
1. **The owner is ten predicates, not one.** `rack.js:478` `overlayDomain = space === 'x' && hydrogenTheorems && !sturm.P && !chem.on` gates VORTEX/PARTICLES/
   KEPLER (:479–503); `rack.js:738–746` `hydroReader` gates WIGNER/RADIATION (no space test); `rack.js:537` the CALCULUS tick; `windows/spectrum.js:142, :195–196`
   hide four/five windows on `hydrogenTheorems` and STURMIAN; `windows/molecules.js:15–26` `moleculeMode` hides seven and forces `space = 'x'` (:24); `:31–35`
   `molFieldView`; `molecular-session.js:75–77` the rank pick; `rack.js:305/:321/:432`; `shell/transport.js:79–81` the period key; `informational.js:25` and
   `windows/film.js:7` (0.5.4's status/caption owners); `shell/persist.js:220, :289`. Over the 19 reachable states these give FIVE answer vectors and one
   disagreement — hydrogen Z = 1 in momentum space: overlays off, WIGNER/RADIATION still read (`sonnet2-b`). `VIEW_SAY` (`badges.js:46`) is a six-string array
   indexed by `mat.view`, no owner input. `tests/field-owner.test.mjs` is a source scan (two function names confined to two files), not a state table.
2. **COMPUTE_WGSL** is `field.js:28–141`; its three anchors are UNIQUE: the space-0 head `:86` `if (P.space == 0u || P.space == 5u) {`, the accumulate `:132`
   `… else { psi += f * ce; }`, the store `:135` `textureStore(outTex, …, vec4<f32>(psi.x, psi.y, 0.0, 0.0));`; `P.space` is read on 8 lines (9 uses); the shell
   index is `:83` `let n = M.nlm.x;` — no new record slot. A derived text (three `once()` substitutions + a global `P.space → 0u`) stays brace-balanced
   (`sonnet2-a`: 4 substitutions, 9 refs pinned, braces 0/parens 0; the dead branches left to the compiler). `once` (`:553`) and `cut` (`:556`) are LOCAL to
   `specRenderWGSL` — the derived module needs `once` hoisted (+0: a move). Boot compiles exactly 8 modules (`:870–876`: compute, render, line, 4 MOL tiers, ORB);
   pipelines are eager (`:887–888`); the render copies use `createRenderPipelineAsync` (`:923`); `createComputePipelineAsync` has NO in-tree precedent.
3. **The equalizer's mathematics** (Round 1 T2, KNOWN/DERIVED-HERE/MEASURED): G ⪰ 0 with unit diagonal ⇔ D∘G is a density for every D (Schur); the PSD test with
   tolerance λ_min ≥ −10⁻¹²·max|λ| and a projection to the cone; the comb and the pulses sit on the boundary (−9.5·10⁻¹⁵, −6·10⁻¹⁶); ρ′ = Σ_{nn′} Γ_{nn′} Ψ_n Ψ̄_{n′},
   Ψ_n = Σ_{a∈n} c_a e^{−iE_a t} ψ_a — six complex accumulators, one pass, exact for any 6 × 6 shell table, gated on one rate per shell; f32 vs f64 on 64 voxels
   1.4–2.7·10⁻⁷ of max (today's path 3.9·10⁻⁷); ≈ 174 flops over 3,500–4,500 = **+4–5 % a frame** (an (n, m) table would be 36 accumulators, +140–180 %, spills —
   NOT this cut); Γ ⪰ 0 ⇒ (√ρ′, 0), indefinite ⇒ sign·√|ρ′| on the SHIPPED signed presenter (kind 3, Δρ) — no new RENDER_WGSL branch, so the presenter the lock
   reads does not move; PURITY = Σ|Γ_{nn′}|² w_n w_{n′} in O(36); the three-way split telescopes, the within-shell term static to 1.2·10⁻¹⁵, the beats zero-mean to
   3·10⁻¹⁶ (`sonnet2-split`, Round 2); both signed terms large (up to 234 % of ρ) ⇒ the relative floor 2·10⁻⁴ of local ρ is mandatory on the signed view.
4. **The period.** `period.js:44–54` `exactFromDifferences` (rational fit, lcm/gcd, the v/g verification loop at `:52`, no 2⁵³ check anywhere); `:83–84` the closed
   form `2π·7200/g/Z²`; T = 14400π a.u. = 45,238.934 a.u. = 1.0942775 ps (`opus1-g`: lcm 7200, 1.0943 ps); the REPEATS readout `shell/transport.js:35`, formula
   `:43`, `periodNow` `:92–122` keyed on `keyNow` `:79–81` (rescans under custom rates already), `periodText` `:123–136`, `fmtPeriod` `period.js:87–99`. C2 MEASURED
   (Round 2 AO1): the guard turns 795 → 0 and 214 → 0 false periods; 17,306 two-decimal rates kept with the right T; baseline 57/57. "repeats exactly" and 14400
   appear nowhere in `lab/`.
5. **Stand-downs today are hide or suspend** (`rack.js:480–498`; `vortex.js:81–86`; `particles.js:130–132`); no grey state exists; no Γ, dephasing or λ_min symbol in `lab/`.
6. **Routes** are declared in `lab/shell/modulation.js:29` `const defs = [` (RATE `:66–68`, the rotation RATEs `:99–108` as the template; wired `controller.js:147`);
   `mod-port.js` (161 lines) holds no route table — it wraps four luminance routes in `guardRoutes` with `FLASH_STEP` (`:37–53`) over MIR's limiter
   (`lab/mir/shell/flash-guard.js`, 3 Hz, WCAG). The field judge is unwired. Per-label rates: `rack.js:62` `energyOf = (a) => H.energy(a) * rates[a]`;
   `spectrum.js:139` `reg.setEnergies(energyOf)`; `:94` RATE disabled under Sturmian. No alias arithmetic exists. `sim-ladder` `state.js:621–632`, `visual.rate: 60`.
   At RATE 3000 the fifteen Bohr beats span 2.92–232 Hz, 14 of 15 above 3 Hz (`sonnet2-f`).
7. **METERS** `windows/readouts.js:108–112` → `meters.js:5–17` (ten `readout` tiles, 41 lines), fed by `rack.js:557` and `meterSnapshot` `:595–602`; no f16/floor
   symbol in `lab/`; `fieldDigest` `field.js:1430–1450` (exported `:1620`, facade `:227`). The field law's constants: `tests/helpers/field-law.mjs` (P7c) and their
   `lab/` twin in `lab/status.js` (P4; asserted equal by `tests/status.test.mjs`).
8. **The catalogue.** `tests/catalogue.json` does not exist; `sonnet2-c` parsed 30 rows and found every named test (ALL-FOUND 30/30, 124 test files). `lab/demos/`
   holds six projects + covers; `tests/molecule-demos.browser-test.mjs` opens them. PRESETS = 31 (`state.js:443`). The A/B Rabi oracle: `sonnet0-g` (μ to 1.4·10⁻¹⁵;
   the RWA peak time to 1.8·10⁻⁴ at E₀ = 10⁻⁴).
9. **Lines.** 28,101 at the cut (field.js 1,714 · state.js 703 · rack.js 943 · readouts.js 158 · modulation.js 230 · meters.js 41 · period.js 100). The cap:
   28,101 × 1.01 = **28,382** (281 of headroom). The tree's own multipliers: additions 0.58–2.02× (median 1.55), named subtractions 0.48–0.78× (`opus1-g`).
10. **The 6-31+G\* oracle** (0.5.4 P-V N4): `tests/fixtures/oracles/6-31+g-star-v1.json` holds 19 molecules `{ id, nAO, energy, converged, homo, lumo }`; the
    generator inlines only STO-3G (`tools/orbital-library.mjs:523–529`); `chemview.js:603` passes `oracle: … basis !== 'sto-3g' ? null : P.oracle`; `status.js:22`
    reads UNCHECKED for no oracle. Water's 6-31+G\* solve agrees with the fixture to 1.3·10⁻¹³ (P-V).

## E · The rows (each: `BRIEF-<row>.md`, `<row>-BUILD.md`; the suites; the lines and the subtraction in the BRIEF; THE LOCK ×2 + the situations fixture as a
PRECONDITION after any `lab/` edit; `pwa --write`; THE STUTTER LAW — nothing new in the frame loop but the equalizer pass itself, priced)

| # | row | what · the engine (seats) | the gate | Δ · model |
|---|---|---|---|---|
| **E0 THE FIELD OWNER** (first) | `lab/owner.js` (new, pure, DOM-free, ≤ 40 lines): `owner()` → `{ id, kind, views, theorems, space, Z, propagator, mol }` composed from `getHamiltonian()`, `app.state.space`, `sturm.P`, `app.state.chem`, `app.state.molSession`, `state.P`; `mayDraw(site)` for the sites of §D-1 — `rack.js:478` overlayDomain, `:738–746` hydroReader, `:537` CALCULUS, `spectrum.js:142/:195–196` and `molecules.js:15–26` the window-hide sets, `transport.js:79–81` the period key, `persist.js:220` — each becomes one read (−8 of today's predicates); `VIEW_SAY` (`badges.js:46`) gains the owner's kind: a VIEW the kind has no meaning for refuses with a sentence (Round 2's C7, folded here); `tests/field-owner.test.mjs` keeps its scan. | [T] `tests/owner-table.test.mjs`: (owner × site) → may-draw over the 19 reachable states of `sonnet2-b`, BYTE-FOR-BYTE today's five vectors, the Z = 1/momentum disagreement reproduced and FLAGGED (the brief rules whether to keep it); [T] a node table over every (kind, VIEW) pair today: all agree; [T] the field-owner scan unchanged; THE LOCK ×2 + situations 0/0 (a refactor moves no texel); serialize 11/11; `lw-facade` 1/1 | +35 − 8 · Opus · a fresh verifier |
| **E1 C2 THE PERIOD GUARD** | `period.js:52`: refuse (`return null`) when max v/g ≥ 2⁵³ before the verification loop — one line; `tests/period-guard.test.mjs` = the L-6 harness | [T] 0 false of 20,000 random rate sets; 17,306 two-decimal rates kept with the right T; baseline 57/57 | +1 · Haiku |
| **E2 M3 THE PERIOD** | `transport.js:123–136` `periodText`: the exact branch prints "repeats exactly every " + `fmtPeriod(T)` + " · T = 14400π a.u." when `H.id === 'hydrogen'` and the rates are all 1 (the closed form `period.js:83–84` as the oracle), else today's line; under custom rates with no exact period: "no exact period under these rates" (the guard's null) | [T] T = 14400π to 10⁻⁹ relative from `hydrogenShellPeriod`; [T] the sentence for the four cases (field-free · Zeeman B ∈ ℤ/3600 · custom rates · Stark); THE LOCK precondition | +8 · Sonnet |
| **E3 M2 + M2′ THE EQUALIZER + THE SPLIT** | **(a) the derived lazy module** in `field.js`: hoist `once` (a move); `EQ_WGSL = derive(COMPUTE_WGSL)` = `once(head → "{")` · `once(accumulate → "acc[n − 1u] += f * ce;")` (six `vec2<f32>` accumulators declared beside `psi` `:71`) · `once(store → the 6 × 6 form: ρ′ = Σ Γ_{nn′}⟨acc_n, acc_{n′}⟩ with Γ from a 36-float uniform; Γ ⪰ 0 ⇒ store (√ρ′, 0); indefinite ⇒ (sign·√|ρ′|, 0) on kind 3)` · the global `P.space → 0u`; built on first dispatch (`createComputePipelineAsync` — smoke-tested on Firefox and Safari in the BUILD; falls back to the sync call if absent); the dispatch arm in `frame()` (`:1317–1329`, a third arm beside the molecule's) chooses it when the Γ table is present and the labels gate passes. **(b) the table state** `lab/equalizer.js` (new, pure): the six gains, the preset tables (Gaussian/Cauchy/box jitter on the shell energies, the comb ½δ₀ + ½δ_{517.016}, phase pulses e^{i(α_n − α_{n′})}, BEATS = Γ − diag, INTERFERENCE ONLY = Γ − I), the PSD test (Jacobi on 6 × 6, tolerance λ_min ≥ −10⁻¹²·max|λ|, projection to the cone, "repaired by …" when it projects), PURITY, the labels gate (one rate per shell: `rates` of `rack.js:62`), the kind decision; PROJECT key `eq` default-absent (one history case). **(c) the BEAT mode** on SPECTRUM's grid (`windows/spectrum.js`; the paint gesture untouched): the 6 × 6 cells, six sliders, the PRESET select, PURITY; colours per §C-2. **(d) the CPU twin** `tests/lib/equalizer-twin.mjs`: ρ′ on 64 voxels in f64 from the register's closed forms. | [T] every jitter/pulse/comb accepted, every non-PSD table rejected or repaired with its size; [T] ρ′ = the twin to 10⁻¹² on 64 voxels (f64 twin) and to the texel (≤ 5·10⁻⁴ of max, the field law's metric) on the device at 64³ for FLAT, GAUSSIAN, COMB, a PULSE and BEATS; [T] FLAT = today's texels BYTE-FOR-BYTE (`fieldDigest` equal — the lock's own hash) so the lock is unmoved by construction; [T] the within-shell term static (10⁻¹⁴) and the beats zero-mean over one T (10⁻¹⁴) in the twin; [R] the pass's ms at 64³/96³ printed (expected +4–5 %); [T] boot = 8 modules (the ninth compiles lazily); [T] the derived WGSL compiles (Firefox + Safari smoke); the LOCK ×2 + situations 0/0 as PRECONDITION; serialize 11/11 + one history case; `new-project --check` (default-absent). | +125 (WGSL derivation ≈ 20 · equalizer.js ≈ 45 · the BEAT mode ≈ 40 · the arm + uniforms ≈ 20) · Opus · stop at +187 and split (b) from (c) |
| **E4 C1 NODES STAND DOWN** | through E0: `mayDraw('vortex' \| 'particles')` is false when `eq.kind === 'density' ∧ λ_min ≥ floor` (floor = the field law's relative floor); the VORTEX and PARTICLES switches take the kit's DISABLED state with the sentence "the equalized picture has no nodes (λ_min = …)"; flat/comb/pulse tables and common zeros exempt (λ_min below the floor ⇒ "nodes approximate") | [T] ρ′ ≥ λ_min Σ|Ψ_n|² on 2p₀ + 3d₀ + 4f₀ at s = 1…16 in the twin; [T] the VORTEX count of ρ′ = 0 above the floor is 0; the origin stays a zero | +6 · Sonnet |
| **E5 M11a SONG BANDS → ROUTES** | six defs `shell.rate.<n>` in `lab/shell/modulation.js:29` (the rotation RATE at `:99–108` as the template; `map: 'log'`, group 'state'), writing the per-label `rates` of the shell through one setter; each carries the flash declaration (E6's alias) | [T] the six routes exist in `defs` and round-trip through `mod-port`'s save; [T] `flash-routes` test extended | +12 · Sonnet |
| **E6 THE FLASH LAW** | `lab/flash-law.js` (new, pure, ≤ 12 lines): f_a(pair) = \|ΔE·RATE/2π − fps·round(·/fps)\| from the measured frame interval (`clock`'s or `meters`' Hz); `aliasOf(energies, rates, fps)` → the worst populated pair; a label on the RATE knob (`transport.rate`) and on any shell RATE above 3 Hz ("beats alias at 7.3 Hz on screen"); presets, links and projects HELD as today (the hand wins — `motion-pref.js:36`); `sim-ladder` per §C-1 | [T] the alias table for the 31 presets × {60, 120, 144} fps against `sonnet2-f`'s fifteen beats (14 of 15 above 3 Hz at RATE 3000 / 60 fps); [T] no label at RATE ≤ 300 for `1s+2pz`; no readback, no frame-loop call (computed on a RATE change) | +10 · Sonnet |
| **E7 N6 (part) + THE TEXEL-FLOOR tile** | `meters.js`: one `readout` FLOOR reading `lab/status.js`' field-law twin (P4) — "one f16 ulp · ≤ 9.8·10⁻⁴ of the value, toward zero · hydrogen 3·10⁻⁶ RMS · 2·10⁻⁴ worst" (static; written once); the sentence "the register carries 79.7 % of hydrogen's polarizability" in INFORMATIONAL's notes (its script in `../measure/`); the A/B Rabi oracle as `tests/rabi-oracle.test.mjs` (Ω = E₀⟨1s\|z\|2p₀⟩ to 10⁻³, from `sonnet0-g`) | [T] each number equals its source constant (the status test's idiom); [T] Ω to 10⁻³; `stylehash` on METERS: one tile | +15 · Haiku (sentences, the test) / Sonnet (the tile) |
| **E8 the dephasing caption** | one sentence in INFORMATIONAL's notes: "the beats fade, the shells stay" (a Gaussian jitter table is a random-clock Lindblad fixed point — Round 1 T2 (ii); no more is claimed) | — | +1 · with E7 |
| **E9 THE CATALOGUE ROWS · the CHORD demo** | `tests/catalogue.json` (the 30 rows of `sonnet2-c`: id, name, lock, tests) + `tests/catalogue.test.mjs` (every row's tests exist); `lab/demos/chord.lambdawaves.json` + cover (three shells, a RATE E6 passes, sound off) — `molecule-demos` extended | [T] 30/30 tests found; [T] the demo opens byte-exact; the precache ≤ 8 MiB | 0 `lab/` (a demo file is data) · Haiku |
| **E10 THE 6-31+G\* ORACLES** (0.5.4 §J-4 N4, owed) | `tools/orbital-library.mjs:523–529`: `oracles[id]` gains `'6-31+g*': { what, energy }` for the 19 ids of the fixture (shape unchanged for STO-3G readers); `chemview.js:603` passes `P.oracle?.[basis]` when `basis !== 'sto-3g'`; `library.test` §8 + `status.test` extended | [T] the 19 energies equal the fixture's; [T] water in 6-31+G\* reads NUMERICAL; `--check` in step; `molecule-head` 38 rows unchanged; precache +≈ 2 KB | +1 · Sonnet |
| **E-V** | one fresh Opus verifier: THE LOCK ×2 + the situations fixture 0/0; serialize 11/11 vs v0.5.4-alpha (+ the one `eq` history case); `settings-probe` 0/6; `lw-facade` 1/1 (no facade member unless the brief names it); the owner table byte-for-byte; FLAT = today's digest; the twin and device gates; the alias table; boot = 8 modules; the ms/s pair vs v0.5.4-alpha's PERF BASE — boot and MOLECULES ≤ 3.536 ms/s, and the equalizer scene's own cost printed as its [R]; every browser suite; the line law; CLAUDE.md against the tree; FIT / NOT FIT → a fix round → the local cut | Opus |

## F · Gates, order, ledger
**Gates.** Node gate 0 after every row. THE LOCK ×2 (860, 1004) AND the situations fixture (D.0's third lock) 0/0 after every `lab/` edit — PRECONDITIONS, never
gates. Serialize 11/11 (one history case for `eq`). `settings-probe` 0/6. `lw-facade` 1/1 unless a brief names a member. `new-project --check` in step (`eq`
default-absent). The field law and the invariance case (0.5.4) stay green. **G-Frame:** the only new frame-loop work is the equalizer pass when a table is
present, priced by its [R]; E0, E1, E2, E4–E10 add no frame-loop call (a probe as 0.5.4's). Precache ≤ 8 MiB. **Lines:** cap **28,382**; the ledger ≈ +215 − 18
(E0 35−8 · E1 1 · E2 8 · E3 125 · E4 6 · E5 12 · E6 10 · E7 15 · E8 1 · E10 1; the −18 = the owner's eight predicates + ten stale comments the briefs name) —
at the tree's 1.4× the risk is ≈ 290, over the cap by ≈ 9: **E5 and E8 are the first to slip to 0.6.1; E3's builder stops at +187 and splits.**
**Order.** **STEP 1** E0 (Opus) ∥ {E1 → E2 → E10} (Sonnet; disjoint files) ∥ E9 (Haiku). **STEP 2** on E0's merge: E3 (Opus) ∥ {E5 → E6} (Sonnet; `modulation.js`,
a new file). **STEP 3** on E3's merge: E4 (Sonnet) ∥ {E7 + E8} (Haiku/Sonnet). Then E-V, a fix round, the local cut. Every builder: a fresh worktree, `git reset --hard
<tip>`, one commit per step, a written BUILD, `pwa --write`, its own gate server by pid, `rigfree` before every browser run, no push. The PERF BASE of v0.5.4-alpha
(D.0) is the pair's base; the situations fixture must exist before STEP 2.

## G · What is not claimed
No (n, m) table (36 accumulators — 0.8.0's lead at best). No new RENDER_WGSL branch (the signed view rides kind 3). No audio (0.6.4). No song routes beyond the six
RATEs (the LOW/MID/HIGH levels are 0.6.4's). No re-bake. No speedup claim; the pass's cost is measured, not promised. No change to the paint gesture, the three scopes,
the glass. Nothing of Sol's synthesis (its rows are 0.6.1/0.6.2/0.7.x). The chord's colours are creative, named so. The dephasing caption claims one sentence.
UNVERIFIED until a BUILD measures it: the derived WGSL's compile on a device; `createComputePipelineAsync` on Firefox/Safari; the pass's ms; the grid mode's lines (UI ×2).

## H · Josh's words (verbatim)
"Let's excecute the master plan" (13:05). "whatever implimentation is easier to layer in the architecture. I defer to your judgement." (12:40). "maybe a bucky-ball as
our next milestone." (§F-1 — the equalizer keeps the star). "Yes to all. I think this would be fun." (19:35). "Usage is back! And it may be the last session before the
weekly reset." (17:15).

## I · The round's record
DRAFT 0 (this) → `BUILD-REVIEW-SONNET-0.md` → `BUILD-DRAFT-1.md` → `BUILD-AUDIT-OPUS-1.md` → `BUILD-DRAFT-2.md` → `BUILD-REVIEW-SONNET-2.md` → `BUILD-DRAFT-3.md`
(Josh) → `BUILD-PLAN.md` on his word, then the briefs. Measurements this round go to `../measure/` with the `build0-` prefix.
