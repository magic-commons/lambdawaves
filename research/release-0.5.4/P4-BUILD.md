# P4-BUILD — ONE PURE `statusOf()`, THREE SEATS (0.5.4 "Contract Layer", STEP 2 PAIR A, second half)

Builder: P4 (Opus 5.5). Worktree `.claude/worktrees/agent-ad18d734cf34268f6`, branch `worktree-agent-ad18d734cf34268f6`, reset to `7fa47e0` (the `sos-s0`
tip carrying P0, P1, P3). One commit per step, no push:

| commit | step |
|---|---|
| `a2ddd7a` | `statusOf` (`lab/status.js`), the vocabulary, `chem.capability()`, chemview's kept status (`tell`), the `r.refused` token, the 456-string table test |
| `88aa47a` | THE HEAD's fifth line (`moleculeHead` + its seat), a fifth named group in `molecule-head`'s regexp (node and browser) |
| `e3ae891` | the STATUS row in INFORMATIONAL, the MODEL sheet's words, the hooks; PAIR B2's field-law constants swapped in (byte for byte from `sos-s0`) |
| `23356f0` | `tools/status-probe.mjs` (the no-frame-call probe + the hit-probe), the PNG pair, `chem.browser-test`'s capability judge |
| this file | the BUILD |

Every seat was re-found by its words at `7fa47e0`; line numbers below are at the P4 tip.

What Josh sees: open INFORMATIONAL and its third row, STATUS, says what the stage may claim — `DENSITY · NUMERICAL · energy agrees with PySCF to 3e-13 Eh ·
picture good to 0.2 % of ρmax` for water, `HYDROGEN · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)` when no molecule holds the field; a tap opens the
MODEL sheet, which now defines EXACT, NUMERICAL and UNCHECKED. A hand pick's HEAD gains a fifth line, the molecule-level status
(`NUMERICAL · energy agrees with PySCF to 7e-9 Eh · geometry computed, not measured` on Cr(CO)₆).

## §1 · `statusOf` and the vocabulary map

**Where.** `lab/status.js` (27 lines), a sibling contract module, not a member of `molecule-state.js`: that module and its chemistry imports (~88 KB) load on
the FIRST SOLVE (optimisation M8, `chemview.js` `loadMS`), and hydrogen's line is written at boot, before any solve. `status.js` imports nothing; it is pure,
DOM-free and node-importable (`tests/status.test.mjs` imports it). `molecule-state.js` would have stayed under 300 lines — the reason is the boot weight.

    statusOf({ owner = 'molecule', record, sol, oracle, view = 'density', label }) → { word, line, head, geometry } | null
      record: the catalogue row (P3: oracle {what, delta}, geometry, status) · sol: a live solve ({ energy }) checked against oracle ({ what, energy })
      line: the per-VIEW string (the row)        head: the molecule-level string (THE HEAD; no VIEW word — the head is held)

**THE VOCABULARY, written once** (`lab/status.js:10` `STATE_WORD`): MEASURED → NUMERICAL · IMPORTED → NUMERICAL · UNKNOWN → UNCHECKED; absent → UNCHECKED; a
word the map does not know (CERTIFIED) → UNCHECKED, never promoted; a closed form (`owner: 'hydrogen'`) → EXACT. A live-only molecule with P3's PySCF oracle
attached (`m.oracle`) is MEASURED by its landing, so NUMERICAL — water never reads UNCHECKED. `owner` other than `'hydrogen'`/`'molecule'` → `null` (the row
prints `—`; see §5).

**Every number from its source, never typed twice.**
- *the energy:* a catalogue row's `oracle.delta` (P3), or a live solve's |E − E_PySCF| against P3's `m.oracle.energy`, floored at the double's own |E|·ε (H₂CO's
  live solve is bit-identical to PySCF: it reads `2e-14`, not `0e0`), printed to ONE figure ROUNDED UP (a number on the glass is never better than measured).
  C₆₀ (energy IMPORTED, δ = 0 by construction) reads `energy is PySCF's own`, no number.
- *the picture:* `FIELD_LAW` (`lab/status.js:8`) is the lab's copy of the members it quotes from `tests/helpers/field-law.mjs` — PAIR B2's file, copied BYTE FOR
  BYTE from `sos-s0` (sha-256 `521548233e7d…`; the lab cannot import `tests/`, which the PWA does not serve). `tests/status.test.mjs` §1 asserts
  `{ hydrogen: { rms, worst }, density: { worst } }` equals the helper's `hydrogen.rms` (3e-6), `hydrogen.worst` (2e-4) and `density.worst` (2e-3), member for
  member, and every parsed picture numeral equals its member.
- *the density's choice (the coordinator's "your call"):* the line quotes the BOUND, `picture good to 0.2 % of ρmax` (`density.worst` = 2e-3, the worst voxel's
  |Δρ|/ρ — the one-ulp law's bound for ANY molecule, so ≤ 0.2 % of ρmax), not water's own reading (`relToRhoMax` 3e-4, "0.03 %"), which benzene's line must not
  quote. Hydrogen quotes its RMS (3e-6), not the 99.8 %-of-voxels 2e-5 (PAIR B2: §J-2's "2e-5 RMS" text was the p998 figure).

**The strings as produced** (PLAN §B's targets, §J-2 applied):

| case | string |
|---|---|
| water, DENSITY (row, browser) | `DENSITY · NUMERICAL · energy agrees with PySCF to 3e-13 Eh · picture good to 0.2 % of ρmax` (node's solve: `4e-13`) |
| water, ORBITAL / FLOW / Δρ | `ORBITAL · NUMERICAL · sign and phase are arbitrary` · `FLOW · NUMERICAL · direction exact, size qualitative` · `Δρ · NUMERICAL · formed in double precision against its reference` |
| water, THE HEAD's 5th line | `NUMERICAL · energy agrees with PySCF to 4e\-13 Eh` (through `mdText`) |
| hydrogen (the row) | `HYDROGEN · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)`; with the state named (`label`), §B's `1s+2pz · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)` |
| computed geometry (heads) | Cr(CO)₆ `NUMERICAL · energy agrees with PySCF to 7e-9 Eh · geometry computed, not measured` · alanine `… to 7e-13 Eh · geometry computed, not measured` · C₆₀ `NUMERICAL · energy is PySCF's own · geometry computed, not measured` |
| experimental geometry | TiCl₄ `NUMERICAL · energy agrees with PySCF to 5e-12 Eh` (no clause on C₆H₆ and TiCl₄) |
| a 6-31+G\* solve | `DENSITY · UNCHECKED · picture good to 0.2 % of ρmax` (no 6-31+G\* oracle in the catalogue; the row's value turns `warn`) |

Departures from §B, each forced: `0.1 %` → `0.2 % of ρmax` (§J-2 + PAIR B2's bound); `2e-5` → `3e-6 RMS (worst voxel 2e-4)` (PAIR B2); the live hydrogen row's
first slot is `HYDROGEN`, not the populated states — those change on every paint stroke and preset, so a row carrying them would be written per register edit
(THE STUTTER LAW); the STAGE FORMULA already names them. `statusOf`'s `label` reproduces §B's `1s+2pz · …` exactly (the table test asserts it).

**THE TABLE TEST** (`tests/status.test.mjs`, in the node gate): **456 strings** — 91 molecules (the 54 of the menu + the 37 record-only) × 4 views + 91 heads +
hydrogen — composed exactly as chemview composes them (the row when there is one, else a LIVE `chemGround` here — **51 live solves**, worst |ΔE| 9.69e-10 on
Cl₂ — against `m.oracle`). Every string ≤ 110 characters (longest 90); every numeral parsed back out of its phrase and held to its source (a digit anywhere
else fails); no molecule with an oracle reads UNCHECKED (91/91 NUMERICAL); geometry classes **2 / 26 / 9 / 1**, **36** heads say "geometry computed, not
measured", C₆₀ alone IMPORTED; the vocabulary map pinned. 8 s.

**`chem.capability()`** (`chemview.js:875`, no facade change): `{ caps (the row's; null = a live solve), observables { density, orbital, flow, states },
derivatives: 'UNKNOWN', identity (P1's sol.identity), status (the kept one — no statusOf call), limits { lmax: COMPONENT_ORDER.length − 1 = 2, Z: MAX_Z = 36,
densityAO: MAX_MOL_AO = 128, orbitalAO: MOL_LIMITS.ao = 768 } (each the engine's own export), precision { path: 'f64 → f32 → f16 texel', law: FIELD_LAW },
online, cached, invalidates }`; null before a solve. The status itself is built by `tell()` (`chemview.js:603`) on a landing (`:336`, and `:327` on a failed one),
a VIEW change (`:167` the segment, `:890` `setView`), a FLOW toggle (`:523`) and a load (`:826`), kept in `said` (getter `:844`).

**`r.refused` at the solve landing** (`chemview.js:327`): `((r && (r.refused || r.error)) || 'no answer')` — one token, so P6's sentences are printed.

## §2 · The three seats (file:line) and the PNG pair

**(a) THE HEAD's last line.** `lab/latex-state.js:133–139` `moleculeHead({ …, status })` appends `'\n' + mdText(status.head)` (the head's comment says five
lines); the seat `lab/windows/molecules.js:77` passes `app.state.chem.said` (`tell()` runs before `notify()`, so it is this landing's). `tests/molecule-head.test.mjs`:
the anchored regexp gains `\n(?<word>…)(?: · energy agrees with PySCF to (?<dm>\d)e\\-(?<dx>\d+) Eh|(?<own> · energy is PySCF's own))?(?<geo> · geometry computed,
not measured)?$` — every numeral in a named group, traced (38 rows' `oracle.delta`; H₂O and N₂ live against P3's energies; the geometry clause against the class).
`tests/molecule-head.browser-test.mjs:41` requires water's fifth line.

**(b) ONE kit `readout` row in INFORMATIONAL.** `lab/informational.js:21–26`: `readout({ label: 'STATUS', cls: 'wide lw-status' })` in its own `row tight`
under ATOM LABELS; `app.hooks.status` writes it — MOLECULES' kept `said` while a molecule is on (value: the per-VIEW `line`; sub: the molecule-level `head`), else
`statusOf({ owner: getHamiltonian().id })` — and is called by chemview's `api.said` and MOLECULES' `setOn` (`windows/molecules.js:58`) and by `switchHamiltonian`
(`windows/spectrum.js:137`); a key compare (`was`) means an unchanged owner costs no call. A tap: `app.hooks.sheet` = the badges' own `sheetToggle`
(`badges.js:82` returns it; `rack.js:753` hands it over; hooks literal `rack.js:115`). No window, no settings key, no badge, nothing above Josh's MOLECULES
fold. Two findings fixed in place:
- **LEAN would have hidden the row on every first run.** `window-chrome.js` gives an Aa (LEAN) to any window holding a `.ro` and switches LEAN ON for a fresh
  browser — and the Aa is hidden with HELP off — so INFORMATIONAL would have grown an Aa and shown no STATUS. `window-chrome.js:20` now skips `.ro.lw-status`:
  INFORMATIONAL keeps its 0.5.3 chrome (no Aa).
- **native-clean cut the line mid-number.** `skin.css`' unlayered `.native-clean .ro-val { white-space: nowrap … ellipsis }` beats the kit's layered
  `.ro.wide .ro-val` (two wrapped lines, base.css "Final II"). ONE CSS seat, `skin.css:299` `.native-clean .ro.lw-status .ro-val { white-space: normal; }`, lets
  the kit's wide readout be what the kit draws. No other CSS.
The MODEL sheet (`index.html:129–130`): the hydrogen-only STATE sentence reworded ("Hydrogen's register holds its 91 basis states … While a molecule owns the
field, the state is its solve in MOLECULES, not this register") and a STATUS line defines the three words and the picture's metric.

**(c) THE EXPORT CAPTION — NOT DONE (blocked as written).** `tests/stage-text.browser-test.mjs:108` and `:112` pin `C.picture().caption` — which IS `captionOf`'s
output (`capture.js:673`, fed by `film.js:10`'s `caption: () => app.w.stageCaption()`) — to `'1s₀, 2p₀'` and `'H₂O · 1b1 HOMO · STO-3G'`. Appending the short
form in `captionOf` or in `film.js:8,10` moves both pinned strings, and the brief requires `stage-text` UNCHANGED. Everything else was done; the seat is one
edit for whoever rules: in `windows/film.js` `:8` and `:10` replace `app.w.stageCaption()` by
`((c) => c && (app.state.chem && app.state.chem.on ? app.state.chem.said : null) ? c + ' · ' + app.state.chem.said.word : c)(app.w.stageCaption())` (molecule
pictures gain `· NUMERICAL`; hydrogen would need `statusOf({ owner })`'s word too), and stage-text's two assertions become `'1s₀, 2p₀ · EXACT'` /
`'H₂O · 1b1 HOMO · STO-3G · NUMERICAL'` (a sketch, not run). With STAGE FORMULA off the caption stays '' (Q15's default).

**THE PNG PAIR** (`research/release-0.5.4/eye/`): `status-row-phone.png` (500 × 930, the lab's phone mode — Firefox's headless floor) and `status-row-tablet.png`
(an iPad UA at 1366 × 1024, the lab's tablet mode), water on, INFORMATIONAL raised, the row's two lines whole.

## §3 · Suites and probes (gate server 9033 by pid, `LW_PORT=9033 GD_PORT=5503`; base export `git archive 7fa47e0` on 9035; `rigfree.mjs` before every browser run)

- **THE NO-FRAME-CALL PROBE** (`tools/status-probe.mjs`, the STUTTER LAW as a gate; `.tmp/status-probe.json`): the witness is `status.js`' own `statusCalls()` read
  through the PAGE's module map (an injected module script — a driver script's `import()` lands in its sandbox's map, another instance; the first attempt read
  0 everywhere for exactly that reason, and the boot's first write now proves the witness counts: 1) plus a counting wrapper on `__LW.chem.capability`.
  **3 s of playback** (transport playing AND MOLECULES' RUN pumping the worker; 62 frames, 620 real-time steps): **statusOf 0 · capability 0.** **One VIEW change**
  (DENSITY → ORBITAL): **statusOf 1 · capability 0**, the row reads the ORBITAL line. Beside them: a FLOW toggle 1, a landing (benzene, its row) 1, MOLECULES off
  (hydrogen's line) 1, hydrogen's own VIEW change 0, 3 s of hydrogen playback 0 (61 frames); capability() returns the kept status, the solve's identity,
  derivatives UNKNOWN, limits 2 / 36 / 128 / 768; 0 page errors. GREEN.
- **THE HIT-PROBE** (same tool): phone — the lab says phone; the row (box 23,411 · 248 × 68) is the topmost thing at its centre and a real driver tap opens the
  MODEL sheet, whose text defines the three words; water's 90-character line on 2 lines, no ellipsis, no overflow. Tablet — the lab says tablet; box
  1096,242 · 246 × 68; the same. 0 page errors. GREEN.
- **MIR's stylehash** (`~/Documents/MIR/tools/stylehash.mjs`, read-only use; playwright Chromium wrapped with `--no-sandbox --ignore-certificate-errors
  --enable-features=Vulkan --use-angle=vulkan`, `--gpu 1`, M-V-REPORT §6c's launch; INFORMATIONAL opened and unfolded by `--setup`; `--skip 'canvas, #rack > .dev:not
  ([data-id="informational"]), #rackL, #floats'`; states `light-refractive-on`, `dark-tinted-off`; base vs tip with a second base capture as noise): **161 → 166
  elements in each state: 5 new — the STATUS row (`div.row.tight`, `div.lw-status.ro.wide`, `.ro-lbl`, `.ro-val`, `.ro-sub`); 2 changed — INFORMATIONAL's card and
  body, height 188.2 → 272.6 px (+84.4) and nothing else of theirs; 0 gone; 0 changed anywhere else that was measured** (menubar, transport pill, stage words, the left column; the other rack cards were skipped). The two
  `mir-dialog` "new" entries are the photosensitivity dialog's random id (`mir-dlg-<random>`), which differs between the two BASE runs too (2 gone / 2 new,
  0 pixels). Pixels differ only in the right rack column (x 1150–1429, y ≥ 231: the row, and the cards below it moved down).
- **THE LOCK ×2** (after the last `lab/` edit): `--check --query gastab=0` **860 · 0 readback · 0 record-byte · page errors 0 · GREEN**; the same plus `--fixture
  research/release-0.4.0/measure/digest-lock-s4a.json` **1004 · 0 / 0 · GREEN**. (My first 1004 run omitted `--query gastab=0`; it read 12 readback / 3 record-byte
  differences, all `states.gas.*` — and the base export reads the IDENTICAL 15 keys without it: the W125 gas table, not this row. Kept in `.tmp/`.)
- **serialize-bytes** vs `git archive 7fa47e0` on 9035: **full 11/11 · edit 11/11 IDENTICAL** (`sb-compare.mjs`), 0 page errors. **`new-project --check`**: in step
  (16117 B), no key.
- **`settings-probe`** GREEN, **0 of 6 scenes red**. **`lw-facade`** GREEN **1 of 1**, WITHOUT `--write` (capability() lives on `__LW.chem`, not the facade).
  **`stage-text`** GREEN, file UNCHANGED. **`molecule-head.browser`** GREEN (with the fifth line). **`chem.browser`** **0 failing of 56** (incl. the new L1
  capability judge: water NUMERICAL, its identity, UNKNOWN derivatives, the limits, the row = `status.line`). **`frame-occlusion`** rc 0, every PASS.
- **`bash test.sh node`**: **exit 0**, 1006 PASS/GREEN lines (status.test and molecule-head among them); `pwa --write` after every `lab/` edit; `rack-deps`
  test GREEN and `node tools/rack-deps.mjs --classes --no-write` clean; `wiring` GREEN (`status.js` reached from chemview and informational).

## §4 · Lines

`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: **before 28,047 · after 28,092 · +45** (the estimate; stop line +67): `status.js` +27, `chemview.js` +9
(imports 1, tell 2, capability 6), `informational.js` +7, `latex-state.js` +1 (the head's comment), `sw.js` +1 (the precache row for `status.js`);
`badges.js`, `rack.js`, `windows/molecules.js`, `windows/spectrum.js`, `window-chrome.js` +0 (in-line). Outside the count: `index.html` +1 line, `skin.css` +1.
Subtracted: nothing could be — the row adds one function, one row and one capability; `statusOf` keeps the vocabulary in one object instead of three seats.

## §5 · What I could not measure, or did not do

1. **The export caption (seat c)** — blocked by `stage-text`'s pinned caption strings; the one-edit patch is in §2 (c).
2. **Which numbers are provisional: none now.** My provisional `tests/helpers/field-law.mjs` (`a2ddd7a`, the ruling's text: 2e-5 RMS, 3e-4 of ρmax) was replaced
   in `e3ae891` by PAIR B2's file, byte for byte; `lab/status.js` quotes its `hydrogen.rms`, `hydrogen.worst` and `density.worst`. The density's 0.2 % is the
   law's bound read on WATER (1.94e-3) and extended to every molecule by the one-ulp law — not measured on benzene, lysine or C₆₀.
3. **Owners `statusOf` does not speak for** print `—`: the oscillator, the well, quarkonium, ATOM (no picture law was measured for them). Hydrogen's line is
   the same in momentum space and for a hydrogen-like ion (Z ≠ 1), though the law was measured in position space at Z = 1; a legacy HELIUM / H₂ owner (hidden
   windows) would leave hydrogen's line up. Not probed.
4. **6-31+G\* reads UNCHECKED**: `library.json` carries only the STO-3G oracles (P3); the 19-molecule `6-31+g-star-v1.json` fixture is in `tests/`, not the
   catalogue — a P3-kind generator row would make them NUMERICAL.
5. **The row is a click target, not a keyboard one** (a kit `readout` is a div; no role/tabindex added — the badges remain the keyboard road to the sheet). Its
   `sub` (the molecule-level line) is faint until hover (the kit's `--ro-sub-fade`), so on a phone it stays faint. INFORMATIONAL itself starts closed and, as an
   OTHER window, folded (window-chrome; 0.5.3's behaviour) — the probe raises it.
6. **VALENCE** draws a valence density under the same `0.2 % of ρmax` (the law measured the full density). **The Worker-less road** (`localSolve`) lands
   through the same `fill()`/`tell()` — not probed. **The ms/s pair** is P-V's. stylehash ran in two of the eight theme × card × frost states.
7. My servers 9033 (pid 2122515) and 9035 (pid 2122517) were killed by pid after the last run; no geckodriver, marionette Firefox or headless Chromium of mine
   was left. Nothing under `lab/mir/**` or `lab/fonts/**` was touched; no settings or stored key; nothing pushed.

## §2 (c′) · THE EXPORT CAPTION — DONE in the fix round (P4c, PLAN §J-3)

Builder: P4c (Opus 5.5). Worktree `.claude/worktrees/agent-aca59892097e97027`, branch `worktree-agent-aca59892097e97027`, reset to `1df7681` (the `sos-s0` tip
carrying P0, P1, P3, PAIR B and P4). Commits: `f0673c5` (the `lab/` edit + `pwa --write`), `3de9bd8` (stage-text's re-aim), this section. No push.

**The seat.** `lab/windows/film.js:7`: ONE `caption()` = `stageCaption()` + ` · ` + the STATE word — MOLECULES' kept `chem.said.word` while a molecule is on,
else `statusOf({ owner: getHamiltonian().id }).word` — and it feeds BOTH export seats: the film's `road.pending` (`:9`) and the picture's `createCapture` caption
option (`:11`, read by `capture.js` `captionOf`). The §2 (c) sketch was checked and not taken as written: it had no hydrogen word and was two inline copies; one
helper serves both seats. `stageCaption` (`shell/stage-words.js`) and the stage's own words are untouched. STAGE FORMULA off: `stageCaption()` is `''`, so the
caption stays `''` and `statusOf` is not called (Q15; stage-text's `swCaption === ''` and the clean-picture hash hold). An owner `statusOf` does not speak for
(oscillator, well, quarkonium, ATOM: `null`) and a molecule switched on before its first landing (`said` null) export the stage's words unsuffixed — no word is
claimed that was not built.
**THE STUTTER LAW.** `caption()` runs once per take (`render-exact.js` `road.pending`, once per job) and once per picture (`captionOf`); a molecule's word costs
no `statusOf` call (the kept `said`), hydrogen's costs one per export. No frame-loop call was added; `tools/status-probe.mjs` was not re-run (no frame-path edit).

**The two strings as produced in the browser** (stage-text §4, Firefox headless): `1s₀, 2p₀ · EXACT` (preset 1s+2pz, hydrogen) and
`H₂O · 1b1 HOMO · STO-3G · NUMERICAL` (water, ORBITAL; also the labels-off picture's caption, `split.labOff.caption`). `tests/stage-text.browser-test.mjs`: the
two assertions re-aimed to exactly these, under one comment `0.5.4 P4c re-aim (§J-3)`; every other assertion byte-identical. No other suite pins the export
caption (`grep caption` over `tests/` and `tools/`: menubar/official-defaults/new-project name the STAGE CAPTIONS preference; render-exact.test pins
`captionOver`'s export, not a string; make-covers and film-probe pass `caption: ''`/`false`).

**Suites** (gate server 9083 by pid, `LW_PORT=9083 GD_PORT=5553`; `rigfree.mjs` before every browser run, one at a time):
- `node tests/pwa.test.mjs --write` after the `lab/` edit (`lab/sw.js` re-stamped). `bash test.sh node` **exit 0**, 1031 PASS/GREEN lines (rack-deps measures
  `lab/windows/film.js → film`; `node tools/rack-deps.mjs --classes --no-write` exit 0). `node tools/new-project.mjs --check` **in step (16117 B)**.
- `stage-text` **GREEN** (4 PASS; the formula KaTeX, the banners and the labels lines unchanged). `molecule-head.browser` **GREEN**. `chem.browser` **GREEN, 0
  failing of 56**.
- `tools/serialize-bytes.mjs` vs a `git archive 1df7681` export on 9085: **full 11/11 · edit 11/11 IDENTICAL**, 0 page errors.
- **THE LOCK ×2**: `--check --query gastab=0` **860 values · 0 readback · 0 record-byte · page errors 0 · GREEN**; plus `--fixture
  research/release-0.4.0/measure/digest-lock-s4a.json` **1004 values · 0 / 0 · page errors 0 · GREEN**. Not re-baked.

**Lines.** `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: **before 28,100 · after 28,101 · +1** (the helper; its two imports ride `film.js:3`, the
two seats lose their own `stageCaption` calls). Estimate was +2 to +4, stop at +8. Outside the count: `tests/stage-text.browser-test.mjs` +1 (the comment).

Servers 9083 (pid 2216781) and 9085 (pid 2217764) killed by pid; no geckodriver or marionette Firefox of mine left. Nothing under `lab/mir/**` or `lab/fonts/**`;
no CSS, no UI, no settings or stored key; nothing pushed.
