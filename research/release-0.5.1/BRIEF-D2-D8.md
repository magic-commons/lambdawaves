# BRIEF D2 + D8 · the molecule's HEAD on a hand pick, and `lw:` links in the notebook (0.5.1 "Informational Update"; ONE Opus builder, after D1 merges)

**Read first, whole:** `research/release-0.5.1/PLAN.md` (§0, §1 incl. G-F and G-U, the D2 and D8 rows, §5 U6–U7, §8, §9 R6-G/R6-B/R6-T/R6-K),
`research/release-0.5.1/AUDIT-OPUS.md` E3, E4, E5, E6, E9, E16, E18 (the file:lines this brief rests on), **`research/release-0.5.1/D1-BUILD.md`** (the
layer as D1 BUILT it: where the `createInfoLayer` handle lives in `rack.js`, how the fade is shown — you ride on both; its merge notes name the sites),
`CLAUDE.md` (THE STAGE TEXT paragraph as D1 rewrote it; PROJECTS/one part; the fade law; STATUS TAGS), `lab/mir/info/layer.js` (`addBlock`, the
handle's `remove()`), `lab/mir/info/page.js` (`showPage`, `firstPart`, `greet` :143–160 — the DISMISS half you adapt), `lab/mir/shell/notebook-render.js`
(`nbSafeURL` :10 keeps `lw:`; every link gets `target=_blank rel=noopener` :25), `lab/latex-state.js` (`moleculeLatex({ molecule, basis, charge, ground })`
:107), the COPY road `lab/rack.js:1694–1710` (`copyLatex`: `MOLECULE_BY_ID`, `chem.solution()`, the solve key `preset|basis|charge`), the MOLECULES pick
(`lab/chemview.js`: the MOLECULE dropdown → `solve(preset)`; `onSw` MOLECULES ON :91), `lab/molecules.js` (the 54 live molecules + `RECORD_ONLY` 37;
`lab/library.json` rows), two records under `lab/library/*.json` (their `stem`: formula, pointGroup (null for C₆₀), gapEh/gapEv, homo, mass, dipole,
charge, multiplicity, identifiers, blurb, ies, sources — and `page`), `tools/orbital-library.mjs:363–379` (how `stem`/`page` are composed from a solve —
your node test reuses that road), the notebook block `lab/rack.js:3311–3510` (`nb`, `.nb-view`, `opened(label)`, the `view`/`edit` modes), `loadPreset(…,
{ hand: true })` :1017 and the boot's `?preset=`/`?view=` handling (:4680–4682) for the hand verbs, `lab/history*`/`edit-domain.js` (one ring row per hand
press), `tests/stage-text.browser-test.mjs` (as D1 re-aimed it), `tests/history.browser-test.mjs`, `tests/molecule-demos.browser-test.mjs`.

## D2 · THE MOLECULE'S HEAD, shown (R6-G, R6-B, R6-T taken)

1. **The trigger is a HAND pick of a molecule** (the MOLECULE dropdown, the SECTION page turner's pick, MOLECULES ON with a molecule chosen) — a press,
   so ordinary G-F. **Never** on a restore, an undo, a project or link open, a demo open (R6-G: a demo/project open keeps today's law — the notebook opens
   when it has text; NO stage greeting). The pick threads `{ hand: true }` the way `loadPreset` does.
2. **THE HEAD is one short block** on D1's layer via `showPage(layer, headMd, { hold: 2500 })` (or `layer.addBlock` directly if `showPage`'s page model gets
   in the way — say which): the formula and name; RHF / basis; E (Eh); nocc / nAO; the point group (**"—" where `stem.pointGroup` is null, never
   invented**); the HOMO's name; the HOMO–LUMO gap (eV and Eh). **Every number comes from the record's `stem` (record-only molecules) or the LIVE solve
   (`chem.solution()` for the 54 live molecules — WATER has NO record)** through the same composition `tools/orbital-library.mjs` uses for `stem`
   (factor the head composer so node and the lab share it — a small pure function, in `lab/latex-state.js` beside `moleculeLatex` or in `lab/molecules.js`).
   If the solve is not done when picked, the head waits for it (the solve key `preset|basis|charge`) and shows once; if the molecule changes first, nothing.
3. **Dismissed as `greet` does** (`page.js:147–158`, adapted — λWAVES has no pages model): Escape, or a press on the stage after the hold; or the next pick.
   **No `ui:` anchors, no feature callouts** anywhere in what you show (G-U; E16's MutationObserver hazard). No KaTeX beyond what `renderNotebook` does
   for the block; the string is built once per pick.
4. **The blurb is NOT on the head** (R6-B: 38/38 carry authored numerals). **`CURATED_IE`** (`names.js:461–467`) appears only if tagged UNVERIFIED — prefer
   not at all. **No tabs, no pages model, no project-format change** (R6-T; E3–E4): the full page stays EDIT › COPY → the notebook as today.
5. **STATUS TAGS off** must not hide the head (it is not a ψ-badge); **STAGE TEXT off** (the DISPLAY switch) hides it with the rest of the layer's words.
6. Lines ≈ +30 in lab (the composer, the show/dismiss, the pick's thread). Nothing in `lab/mir/**`.

**D2 acceptance:** `tests/molecule-head.test.mjs` (node): for each of the 38 records, compose the head from `stem` and diff EVERY numeral against its source
field; for H₂O and N₂ solve LIVE in node (the generator's road, `tools/orbital-library.mjs`) and compose from the solution — every numeral traceable;
`pointGroup` null → "—" exactly once (C₆₀). Browser: one scene in the stage-text suite (or a new `tests/molecule-head.browser-test.mjs`): a hand pick of WATER
(LIVE) → its head on the stage within the solve + 500 ms, gone on a stage press after 2.5 s; an undo back to WATER → nothing; `?preset=` / a demo open →
nothing (`stats.announced`-style witness: expose a counter on `__LW`, e.g. `__LW.head.shown`, and keep it — G-W); `molecule-demos` 5; `history` 44 (a pick is
one row, as today); `hit-probe-set` 0 reached; `frame-occlusion`.

## D8 · `lw:` LINKS in the notebook (R6-K taken)

1. **Where:** λWAVES' notebook VIEW only (`.nb-view`, the rendered markdown). A capture-phase `click` listener on the view takes `a[href^="lw:"]`, calls
   `preventDefault()` + `stopPropagation()` (the sanitiser keeps the href but sets `target=_blank`; without this the browser opens a tab). Links on the
   STAGE are Group II (the layer is `pointer-events: none`).
2. **The grammar:** `lw:key=value[&key=value…]` over a WHITELIST mapped to EXISTING hand verbs — `preset=<id>` → `loadPreset(id, { hand: true })`;
   `view=<density|phase|real|imag|…>` → the same verb the V key / `?view=` uses; `molecule=<id>` → the MOLECULES pick (which then shows D2's head, since it
   is a hand press); `orbital=<label>` → the ORBITAL pick. Unknown keys are ignored and said in the notebook's status line (one word). **No whole-state link
   (`lw:#s=…`, `lw:s=…`): excluded** — `statelink.js` restores a whole state and a page link must never replace the user's work (E9). **No `lw:` link ever
   clears the undo ring** (a `?preset=` open does; a link press is an ordinary hand press = one ring row).
3. **One announcement per press** through D1's fade (the same `{ hand: true }` road `loadPreset` already uses — do not add a second announcer); never on
   restore/undo/open (G-F).
4. **Rendering:** nothing changes in the markdown road; an `lw:` link looks like any link. If `renderNotebook` strips or rewrites `lw:` in some path, say so —
   the kit is not edited (a brief candidate).
5. Lines ≈ +30. Nothing in `lab/mir/**`.

**D8 acceptance:** a browser scene (in the history suite or a new `tests/lw-links.browser-test.mjs`): type `[density](lw:view=density)` and
`[water](lw:molecule=h2o)` into the notebook, switch to view, click each → the view changes / WATER is picked (and its head shows once), exactly one history
row per click, exactly one fade per click, `window.open` never called (stub it, count 0), no new tab (`g.tabs()` or the driver's window handles unchanged);
`[x](lw:s=abc)` → nothing happens and the status says so; a plain `https:` link still opens in a new tab; `history` 44 + the new rows; the stage-text suite's
fade cases.

## Shared
- **Both rows edit the notebook block (`rack.js:3311–3510`)**: D2's show/dismiss hooks and D8's view handler — list every site in the BUILD's merge notes;
  stay out of D1's stage-text sites, D10-24's new card and D10-F's STATE/BOW group (all merged before you; read `git log --oneline -12` on your base).
- **`node tests/pwa.test.mjs --write`** after any lab edit; **`bash test.sh node`** exit 0; `settings-probe` 0/6 (no new stored key — you add none);
  `serialize-bytes` 11/11 (nothing of yours enters a project); `new-project` 8 + `--check`; `offer` 16/16.
- No lock, no pair (nothing on the frame path — say so). Lines ≈ +60 total; say the real number.

## Commits (each followed by `D2-D8-HANDOFF.md`)
1. `0.5.1 D2 · the molecule's head: the composer (stem / the live solve) + the node test over 38 records + H₂O/N₂ live`.
2. `0.5.1 D2 · the head on a hand pick, dismissed as greet does; never on open/undo/restore`.
3. `0.5.1 D8 · lw: links in the notebook view: a whitelist grammar onto hand verbs, one ring row, one fade; no whole-state link`.
4. `0.5.1 D2+D8 · wave 2xx; D2-D8-BUILD.md` (REPORT.md under the "0.5.1 · THE INFORMATIONAL UPDATE" heading — read the last wave number on your base; the
   CLAUDE.md sentences DRAFTED in the BUILD, not applied; a CHANGES-0.5.1.md line each in plain words, drafted in the BUILD).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 9013/5483. `python3 tools/gate/server.py
<worktree> 9013` (run_in_background); `LW_PORT=9013 GD_PORT=5483`. ONE browser suite at a time on the rig: `node tools/perf/wait-gpu.mjs` and `pgrep -a
geckodriver` / `pgrep -a -f chrome` empty before each; never kill another's process; stop yours by pid; never `pkill -f`. The guard refuses compound shell
lines (plain commands or `bash .tmp/x.sh`). Never edit `lab/mir/**`, `lab/fonts/**`. Subtract, don't add. Never merge, push, tag. `D2-D8-BUILD.md`: the
ledger, the tests' counts, the brief candidates (e.g. links in a stage block; a pages-model-free `greet`), the merge notes (rack.js sites), the drafted
CLAUDE.md sentences and CHANGES lines, "what Josh will see" (pick a molecule → its head on the stage for a moment; a link in your notes drives the lab).
Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
