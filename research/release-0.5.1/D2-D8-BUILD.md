# D2-D8-BUILD · the molecule's HEAD on a hand pick, and `lw:` links in the notebook (0.5.1 "Informational Update"; ONE Opus builder)

Worktree `.claude/worktrees/agent-ac75ffa2c710c409f`, branch `worktree-agent-ac75ffa2c710c409f`. Base `76b1d5e` (yan-c: the 0.5.0-alpha
cut + D10-19 + D10-F + D1). Brief `research/release-0.5.1/BRIEF-D2-D8.md`. Ports 9013 / GD 5483.

**THE VERDICT — both rows built, every acceptance met; offered for merge.** D2: a HAND pick of a molecule shows its head on the stage once
its solve lands (WATER: 0 ms after a ≈ 160 ms solve), held until Escape, a press on the picture after 2.5 s or the next pick; never on a
`?preset=` boot, an undo, a link, project or demo open, or under STAGE TEXT off. Every number on it is the record's stem or the live solve's
— the node test parses all 38 records' heads and H₂O/N₂ solved live and diffs every numeral against its source. D8: `lw:` links in the
notebook's view run preset / molecule / view / orbital, one ring row and one fade a press, `window.open` 0, no tab; `lw:s=` is refused and
said. Nothing on the frame path (no lock, no pair). Lines **27,558 → 27,638 (+80)**.

## §the ledger (commits)

| # | commit | what |
|---|---|---|
| 1 | `0.5.1 D2 · the molecule's head: the composer …` | `lab/latex-state.js` `moleculeHead` / `stemOf` / `EV` / `mdText`; `tools/orbital-library.mjs` takes `stemOf` for the stem; `tests/molecule-head.test.mjs` |
| 2 | `0.5.1 D2 · the head on a hand pick …` | chemview's hand road (`handPick`, ON → `api.hand`; `sol.stem` from a record); rack.js `headPick`/`headLand`; D1's `announce(md, 0)` + `dismiss(md)`; `__LW.head`; `tests/molecule-head.browser-test.mjs` |
| 3 | `0.5.1 D8 · lw: links in the notebook view …` | rack.js notebook block: `orbitalOf`, `lwLink`, the capture-phase click; `tests/lw-links.browser-test.mjs` |
| 4 | `0.5.1 D2+D8 · wave 213; D2-D8-BUILD.md` | this file; REPORT.md wave 213; two comment blocks trimmed (−3 lines); `sw.js` re-hashed |

## §D2 · THE HEAD — how it is built

- **The composer** (`lab/latex-state.js`, beside `moleculeLatex`, pure): `moleculeHead({ molecule, basis, ground, stem })` → four lines of the
  notebook's markdown —
  ```
  **$\mathrm{H_{2}O}$ · water**
  RHF/STO-3G · $E = -74.963023\,E_h$
  5 occupied of 7 AO · $C_{2v}$
  HOMO $1b_{1}$ · gap $0.9964\,E_h$ = 27.11 eV
  ```
  `stem` given (a record) → its `pointGroup`, `homo`, `gapEh`, `gapEv`; absent (a live solve) → `stemOf(ground)`, **the very function
  `tools/orbital-library.mjs` now calls to write those four stem members** (its local `EV` and the inline gap/HOMO lines left). E, nocc and
  nAO are the ground's (the record's ground = what `chem.open` returns). A null `pointGroup` is "—" (C₆₀ only). The HOMO is
  `HOMO $<forms(label).latex>$` when the stem names it, else the stem's own words escaped (`HOMO` for the C1 amino acids; C₆₀'s
  `HOMO (h_u ×5) · LUMO (t1u ×3)`). **No blurb (R6-B), no CURATED_IE (E6: not at all — the default "prefer not")**, no charge word (the
  formula carries it).
- **The generator still writes the same bytes**: `node tools/orbital-library.mjs --check --only C6H6,uracil,KrF2,KBr,Li4F4,FeCO5,alanine,B12H12--,C60`
  → "in step — 38 records … the gate passes every entry" (re-solving those nine; the other 29 re-hashed from disk), and the node test
  proves `stemOf(the decoded ground) = the stem` on all 37 non-frontier records.
- **The hand road** (`lab/chemview.js`, the MOLECULES pick site): the dropdown's `change` → `handPick(id)` = `solve(id, { press: true })`
  then `api.hand(preset)`; MOLECULES ON's `onChange` → `setOn(v)` then, when on, `api.hand(preset)`. `handPick` is also the API's `pick`
  (D8's molecule verb). `load()` (restore / undo / project / link / demo) and `__LW.chem.solve` never call `hand` — that is the G-F law,
  structurally. A record-opened solution carries `sol.stem = record.stem` (one line in `viaRecord`). **Trap met**: chemview already had a
  `function pick(k, i)` (the spectrum's) — a second declaration of the same name silently replaced it; the hand's is `handPick`.
- **Show / dismiss** (`lab/rack.js`, right after the `createChem` call): `headPick(id)` dismisses a head still up, arms `head.want = id` and
  tries; `headLand(sol)` (also `chem.subscribe`d) shows only when `chem.preset() === id` and `sol.key === id|basis|charge` — chemview's
  own solve key — and drops the want if the molecule changed first. **The head rides THE FADE**: `stageText.announce(md, 0)` — D1's
  announcement, held (ttl 0 sets no timer) — and `stageText.dismiss(md)` takes it only if it still holds the seat. So it is
  `layer.addBlock` through D1's own `show()` (the `data-fade` block, 22 px), **not `showPage`**: `showPage` would add a SECOND block
  beside the formula (D1: two blocks at one seat stack into a column, the formula sliding under every announcement) and its `clear()`
  would not bring the formula back; the formula is the head's first line anyway. Dismissal is `greet`'s half adapted (≈ 3 lines):
  Escape on `window` (not in a field, the kit's `isField(…, true)`), or a `pointerdown` on the picture (`dom.canvas`, not the whole
  `#stage`, which holds the notebook and the floats) after 2.5 s, or the next pick; one `AbortController` per head.
- **Witness** `__LW.head` = `{ shown, md, want, bye }` (G-W: new, kept). STATUS TAGS off (the first run's) hides nothing; STAGE TEXT off
  makes `announce` refuse, so nothing is shown (and `shown` does not count).

## §D8 · `lw:` LINKS — how it is built

- **Where**: λWAVES' notebook VIEW only. A capture-phase `click` on `.nb-view` takes `a[href^="lw:"]`, `preventDefault()` +
  `stopPropagation()`. The renderer keeps `href="lw:…"` as written (marked 12.0.2's `encodeURI` leaves `= & #` alone; the sanitiser's
  `nbSafeURL` refuses only javascript/data/vbscript/file/blob) and sets `target=_blank` on every link (`notebook-render.js:25`) — the suite
  asserts both, so a kit change to either is seen. **Nothing in the markdown road changed; an `lw:` link looks like any link.**
- **The grammar** `lw:key=value[&key=value…]`, decoded with `decodeURIComponent` (a malformed `%` is an ignored key), the whitelist:
  `preset=<id>` → `loadPreset(id, { hand: true })` (it announces itself) · `molecule=<id>` (case-insensitive over the 91 ids) →
  `chem.pick(id)` (the dropdown's own `handPick`) **and `chem.setOn(true)`** — a link that names a molecule gives it the field (a
  decision: the dropdown alone does not; Josh may flip it to the pick only) — its head is the press's fade · `view=<density|phase|real|imag|diff|reim>`
  → `LW.setView` (the V key's / `?view=`'s verb), announced `VIEW · density` · `orbital=<label|number>` → the ORBITAL dial (`chem.orbital(k)`,
  VIEW orbital), by number or by any part of `names.js orbitalName` (`homo`, `lumo`, `homo-1`, `1b1`, a degenerate `1e1g`), announced
  `ORBITAL · $1b_{1}$ · HOMO`; after a `molecule=` in the same link it waits for that solve and joins its row (`history.absorb`).
  **Any other key is ignored** and the notebook's foot (`.nb-count`) says `ignored: <keys>` for 2.4 s. **No whole-state link**:
  `lw:s=…` / `lw:#s=…` are just unknown keys — `statelink.js` is never reached (E9).
- **One ring row a press**: keyEdit's pattern — `flush()` a pending row under another name, run, `note('LINK · <link text>')`. **One fade a
  press**: a verb that announces itself (preset, molecule's head) wins; otherwise one `announce` of the first VIEW/ORBITAL words. The ring
  is never cleared (no `history.clear` on this road).

## §acceptance — the tests

**`tests/molecule-head.test.mjs` (node, in `test.sh node`)** — GREEN: *38 records composed from their stems — every numeral in a named
field and diffed against its source (12 HOMOs named, 26 unnamed or a sentence; "—" once, C₆₀); stemOf on the 37 non-frontier records =
their stems; H₂O (E −74.963023, HOMO $1b_{1}$, gap 27.11 eV) and N₂ (E −107.495888, HOMO $3\sigma_{g}$) solved live, every numeral the
solve's and the page's.* How: the head is matched against an ANCHORED template whose only digit-bearing parts are named groups (formula,
name, basis, E, nocc, nAO, point group, HOMO, gap E_h, gap eV), so a numeral outside a field fails the match; each group is diffed against
its source — `formulaLatex(stem.formula)`, `mdText(rec.name)`, `E.toFixed(6)` and |Δ| ≤ 5e-7, nocc / nAO, the group re-read from its LaTeX,
the HOMO from the stem's label through `forms`, `gapEh.toFixed(4)`, `gapEv.toFixed(2)`; and the head's E and "nocc occupied of nAO AO"
are found verbatim in the record's `page` (EDIT › COPY's). For H₂O and N₂ (`chemGround` in node — the generator's road; neither has a
record) the gap is recomputed from ε in the test, not through `stemOf`, and the eV value checked against gap × 27.2114.

**`tests/molecule-head.browser-test.mjs`** (new) — GREEN 3/3 (9013, alone):
1. a `?preset=` boot: `__LW.head.shown` 0, no fade block, STATUS TAGS off; a hand pick of WATER through the dropdown's own `change`:
   solved in ≈ 160 ms, the head on the stage **0 ms** after the solve (≤ 500), KaTeX, no error, the template exact; a real pointer press
   on the picture at ≈ 1.2 s keeps it; one at ≈ 2.65 s takes it and the formula comes back.
2. N₂ (page-turned to DIATOMICS, then the dropdown): **one ring row**, its head (D∞h, HOMO 3σg); Escape (a real key) takes it; WATER's head
   is taken the moment NH₃ is picked (synchronously, before NH₃'s solve), and NH₃'s comes with its solve.
3. 2 undos back to WATER, a link open, the water demo's open (MOLECULES on), a hand pick of HF under STAGE TEXT off: **0 heads, 0 fades, 0
   announcements**. (The undo walk is 2 because the script's WATER and NH₃ picks fell inside one 400 ms quiet window and coalesced into one
   row — the ring's existing law, not D2's; a human pick is one row, scene 2.)

**`tests/lw-links.browser-test.mjs`** (new) — GREEN 5/5, every press a real pointer (`g.tap`), the notes typed into the textarea and ◐ pressed:
the five hrefs render as written with `target=_blank`; **[density](lw:view=density)** phase → density, 1 row (`LINK · density`), 1 fade
(`VIEW · density`), `window.open` 0 (stubbed, counted), 0 new window handles (WebDriver's own list), the URL unchanged; **[water](lw:molecule=h2o)**
WATER picked, MOLECULES on, the head once = the one fade, 1 row; **[lumo](lw:molecule=nh3&orbital=lumo)** NH₃ picked, `4a1 · LUMO` (orbital 6)
on the field once its solve landed, 1 row, 1 fade (the head); **[x](lw:s=abc)** 0 rows, 0 fades, no open, no tab, the foot `ignored: s`;
**an https link** opens its tab (handles 1 → 2, `window.open` 0), closed again; the ring's bottom row still `boot`, grown by exactly 3.

**The owning suites** (one browser at a time on 9013 / GD 5483, after `wait-gpu` and an empty `pgrep -x geckodriver`; on the step-3 tree —
commit 4 changes only comments in `lab/` and `sw.js`'s hashes):

| suite | result |
|---|---|
| `tests/molecule-head.browser-test.mjs` (new) | **GREEN 3/3** (re-run on the final tree: GREEN) |
| `tests/lw-links.browser-test.mjs` (new) | **GREEN 5/5** (re-run on the final tree: GREEN) |
| `tests/stage-text.browser-test.mjs` (D1's fade cases: one banner, not three; the names) | **GREEN 4/4** |
| `tests/history.browser-test.mjs` | **44 PASS** (as before; a pick is one row — also asserted in the D2 suite) |
| `tests/molecule-demos.browser-test.mjs` | **GREEN 5/5** (each demo opens, no head) |
| `tools/hit-probe-set.mjs` | **49 presses through a kit window's gap, 0 reached the stage — OK** |
| `tests/frame-occlusion.browser-test.mjs` | **7/7 PASS** |
| `tests/new-project.browser-test.mjs` | **8 PASS**; `node tools/new-project.mjs --check` in step (16,117 B); `node tests/new-project.test.mjs` in `test.sh node` |
| `tests/offer.browser-test.mjs` | **GREEN 16 of 16** |
| `tools/settings-probe.mjs` | **GREEN — 0 of 6 scenes red** (no new stored key) |
| `tools/serialize-bytes.mjs` | **11/11 identical** to the base `76b1d5e` served on the same port (`diff` of the two outputs empty) |
| `node tests/pwa.test.mjs --write` | written |
| `bash test.sh node` | **exit 0** — 81 suites (the new `molecule-head` among them), 942 GREEN/PASS lines, 0 red |
| G-U `grep -rnG '\[!mir\|ui:' lab/*.js` (outside `lab/mir`) | empty |

## §lines (G-L)

`cat lab/*.js | wc -l`: **27,558 → 27,638 = +80** (brief ≈ +60; `git diff --numstat`): `lab/rack.js` +62 −5 (the head block 19 with its
comment, D8 29 with its comment, two imports, `hand:`, D1's fade +2 and its doc line; `head,` and the shared escape are in place),
`lab/latex-state.js` +21 (the composer, `stemOf`, `EV`, `mdText` and a 4-line comment), `lab/chemview.js` +6 −4, `lab/sw.js` ±0 (three
hashes). Outside `lab/`: `tools/orbital-library.mjs` −2, three test files. Bar 30,000 (2,362 under); soft 29,000 (1,362 under).
No data file, no project-format change, no new stored key (settings-probe), nothing in a project (serialize-bytes).

## §brief candidates (for `BRIEFS-0.5.1.md`; none blocks D2/D8)

1. **A pages-model-free greet**: `greet(layer, md | handle, { hold })` or `dismissOn(handle, { hold, stage })` — λWAVES adapted
   `page.js:147–158` by hand (Escape off a field, a stage press after the hold, an AbortController). `greet` needs `pages.shouldGreet()`.
2. **App links in the renderer**: `renderNotebook(src, { app: (href) => boolean })` (or an `appSchemes` list) so an app scheme keeps no
   `target=_blank` and the app does not have to stop the click in the capture phase (D8 needs `preventDefault` before the browser opens a tab).
3. **Links in a stage block** (D8′) — already listed: the layer is `pointer-events: none`, so an `lw:` link on the stage is dead.
4. **A held block with a lifetime**: `addBlock({ md, until })` / `handle.hold(ms)` — the head is held by λWAVES' banner (ttl 0) and
   dismissed by hand; the kit's `hold` only delays the against-the-cursor flip (E1).
5. **Escape's steps across the kit**: the head's Escape listens on `window` like `greet`; with the KEYBOARD window open one Escape now closes
   that window AND takes the head. A kit Escape stack (one step a press) would order them.

## §merge notes (every site)

- `lab/rack.js`:
  1. imports: `import { orbitalName } from './names.js'` (new, after the `molecules.js` line); `import { isField } from './mir/core/pointer.js'`
     (new, after the `mir/info/layer.js` line); the `latex-state.js` line gains `moleculeHead, mdText`.
  2. `loadPreset` (`≈ :1020`): its announce takes `mdText(p.label)` (the same regex, now shared).
  3. the `createChem({ … })` call (`≈ :1990`): one row `hand: (id) => headPick(id)`; **the D2 head block right after the call** (`const head`,
     `headPick`, `headLand`, `chem.subscribe(headLand)`), before THE STAGE TEXT's comment.
  4. **D1's site, `initStageText` → `stageText`**: `announce(md, ttl)` sets its timer only `if (ttl)`; `dismiss(md)` added (2 lines + the doc
     comment). Nothing else of D1's touched (show, the gate, the letters, the observers).
  5. **the notebook block** (`≈ :3461`, after the textarea's keydown): `orbitalOf`, `lwLink`, the capture-phase `click` on `view`.
  6. the `LW` literal: `head,` after `chem,`.
  Not touched: D10-24's CURVES card (not on this base), D10-F's STATE/IMPULSE group, `lab.css`, the ACTIONS table.
- `lab/chemview.js`: MOLECULES ON's `onChange` (`:91`); the dropdown's `change` + `handPick` (`:124–126`); `viaRecord`'s `r.stem` (`:311`);
  the API's `pick: handPick` (`:874`).
- `lab/latex-state.js`: append-only after `moleculeLatex`.
- `tools/orbital-library.mjs`: the latex-state import line, the `EV` const out, build()'s `S = stemOf(…)` and two stem lines.
- `lab/sw.js`: take ours, then `node tests/pwa.test.mjs --write`.
- REPORT.md: **wave 213** under "0.5.1 · THE INFORMATIONAL UPDATE" (the base's last is 212, D1). If D10-24 lands first with 213, renumber.

## §the drafted CLAUDE.md sentences (for the integrator / D-V; NOT applied)

Appended to THE STAGE TEXT paragraph (D1's draft), after its THE FADE sentence:

> THE HEAD (0.5.1 D2): a HAND pick of a molecule — the MOLECULE dropdown, MOLECULES ON, a notebook `lw:molecule=` link (chemview's
> `hand`) — shows its head in THE FADE's seat once that molecule's solve lands: four lines from `latex-state.js` `moleculeHead`
> (formula and name; RHF/basis and E; nocc of nAO and the point group, "—" where the record has none; the HOMO's name and the
> HOMO–LUMO gap), every number the record's `stem` or the live solve's through `stemOf`, the composition `tools/orbital-library.mjs`
> writes into every stem — never the blurb, never CURATED_IE (`tests/molecule-head.test.mjs`). It is held (`announce(md, 0)`) until
> Escape, a press on the picture after 2.5 s, or the next pick, and a restore, an undo, a project, link or demo open never shows it
> (`__LW.head.shown`; `tests/molecule-head.browser-test.mjs`).

A new paragraph after "An open never closes the notebook; …":

> `lw:` LINKS (0.5.1 D8, R6-K): in the notebook's VIEW a link `lw:key=value[&…]` runs a WHITELIST of hand verbs — `preset` (STATE's
> PRESET), `molecule` (the MOLECULE dropdown's pick, and MOLECULES on; its head is the fade), `view` (the V key's observable), `orbital`
> (the ORBITAL dial by name or number, VIEW orbital) — one history row (`LINK · <text>`) and one fade a press, the ring never cleared; any
> other key is ignored and said on the notebook's foot, and a whole state (`lw:s=`) is never a verb. A capture-phase click on `.nb-view`
> stops the sanitiser's `target=_blank`; nothing on the stage takes a link (D8′, Group II). Run `tests/lw-links.browser-test.mjs`.

## §the drafted CHANGES-0.5.1.md lines (NOT applied)

- Pick a molecule and its head appears on the stage for a moment: its formula and name, the method and basis with the total energy, how many
  orbitals are filled out of how many, its point group, the name of its highest filled orbital and the gap to the lowest empty one — every
  number from the molecule's own library record or from the solve you just ran, never typed in by hand. Escape, or a click on the picture
  after a couple of seconds, puts it away; opening a project, a link or a demo, or undoing, never shows it. (D2)
- Links in your notes can drive the lab: in the notebook's preview a link written `lw:molecule=h2o`, `lw:view=density`, `lw:preset=…` or
  `lw:orbital=homo` picks that molecule, view, preset or orbital as if you had pressed it — one undo step and one announcement each. A link can
  never replace your whole state, an unknown one is named on the notebook's foot, and every other link still opens in a new tab. (D8)

## §what Josh will see

- **Pick a molecule** (the MOLECULE menu, or switch MOLECULES on) → where the formula sits, its HEAD appears once the solve is in: four
  lines in the kit's serif at the heading size — `H₂O · water` / `RHF/STO-3G · E = −74.963023 Eₕ` / `5 occupied of 7 AO · C₂ᵥ` /
  `HOMO 1b₁ · gap 0.9964 Eₕ = 27.11 eV`. It stays while he looks; Escape, or a click on the picture after 2.5 s, puts it away and the
  formula comes back; picking the next molecule replaces it. Undo, a project, a link or a demo never show it. A molecule opened from its
  record (C₆₀, the amino acids) shows the record's numbers; C₆₀'s point group is "—".
- **In the notebook**, write `[water](lw:molecule=h2o)` or `[the LUMO](lw:molecule=nh3&orbital=lumo)` and press ◐: clicking the link picks
  the molecule (and switches MOLECULES on), shows its head, and puts the orbital up — one undo step. `[density](lw:view=density)` switches
  the observable and says `VIEW · density` on the stage. A mistyped key is named on the notebook's foot; no `lw:` link opens a tab.
- Headless PNGs are not taken (the WebGPU canvas captures blank); the head's look is D1's fade block (the spike's legibility PNGs).
