# ITERATION 014 · CHAIN A — THE CONTROL SURFACE BAR, planned in detail (Claude Yan, 2026-10-22; PLANNED, NOT BUILT)

Base `yan-c` @ `f2f1ffa` (Sos's PLAN.md, Josh's six answers, the icon rule). Josh 10-22: "plan accordingly without beginning building as weekly
usage resets 9 AM". Pictures read: `refs/timeline-basins.png`, `refs/timeline-lambdawaves.png`. Every file below was opened; the line numbers
are today's.

## THE FINDING THAT CHANGES THE PLAN

**λWAVES does not run the kit's transport.** `lab/mir/shell/transport.js` (`createTransport`, `LAMBDAWAVES_LAYOUT`, `tempoPill`, `tempoPanel`,
`macroRail`, `mountIn`, the dock chip, the seat menu) is harvested FROM λWAVES but never called by it (the only reference is `lab/sw.js`'
precache row). Today's bar is four hand-made pieces:
- `lab/shell/transport.js` — the strip in `#transport`: play · MOD · ⏮ · ‹ › · SCRUB fader · RATE knob · t readout · REPEATS readout + formula ·
  ⟳, and THE PHYSICS behind REPEATS (the recurrence scan, `periodNow`, `barLock`), 276 lines;
- `lab/native-ui.js` l.74–135 — THE TEMPO EXPANDER (`.tbtn.tempo-expand`, `.native-tempo`, `.tempo-rail`, `.tempo-tile`, the macro tiles),
  the one Josh says inspired BASINS';
- `lab/shell/notebook.js` l.26–45 — the dock chip (`.dock-btn`) and the logo door (`.mod-exp.mod-logo`, spins on hover);
- `lab/shell/rack-wiring.js` l.120–133 — `dockTransport()`, a hand-made dock into the rack card `wTr` (id `transport`), with `dockSide` /
  `dockIndex`; `lab/lab.css` l.292–313 the strip's box (`#transport.mini` 560 px, 46 px, bottom 60 px).
The kit's parts carry the SAME class names (the harvest kept them: `.tbtn.tempo-expand`, `.native-tempo`, `.tempo-rail`, `.dock-btn`,
`.mod-exp`), so adopting the kit's bar keeps the look Josh wants kept ("we will keep how the UI looks like but we will overhaul the content").
**A0 (adoption) is the first row; everything else stands on it.** The kit already has `mountIn(host)` (the one node moving between seats),
`docked` (a rack window named TRANSPORT, id `transport` — the same id `captureLayout` saves), the seat menu, `barButton`, `latch`, the tempo
field — so A4's seats and A5's work bar are the kit's roads, not new ones.

## THE ROWS (one Opus builder per bracket; kit edits under the trickle-down rule, version 1.5.0-alpha.25 then .26 …)

**A0 ADOPT THE KIT'S BAR (no visible change).** `lab/shell/transport.js` keeps the physics and builds its app parts as NODES, then calls
`createTransport({ layout: LAMBDAWAVES_LAYOUT, nodes: { back, forward, scrub, jump, time, period, rate }, clock: appPlay-as-clock, mod: the
seam, model: the host's tempo model, rack: rk, keys: kt.table, door: 'mark', key: 'mir.transport', host: dom.stage, root: #transport })`.
`playButton` becomes THE play (`togglePlay`), `modPower` becomes `setModArm`'s button (the lamp stays `ui.modB` for badges), the kit's
`tempoPill` + `tempoPanel` + `macroRail` replace native-ui.js l.74–135 (delete that span; `buildMacroSlot` is already the kit's), the kit's
dock chip and logo door replace notebook.js l.26–45, and `layout.dockTransport()` becomes `transport.setDocked(!transport.docked)` — the kit
registers the rack card `transport` itself (`dockOf`), so `wTr` goes and `popFace` reads the kit's card. `captureLayout.docked` keeps its
meaning. lab.css l.292–313 → the kit's `data-layout="lambdawaves"` drawing (already written for this bar, transport.css l.166, 272–278).
Gate: `tests/menubar`, `history`, `new-project`, `frame-occlusion` (uiSpace's `extra` id `transport` unchanged), `keyboard-shortcuts`
(`dock` row T), `timeline`; a before/after shot pair at 1920 must match to the eye. THE LOCK is not touched (no field code).

**A1 CSB, THE BAR.** Kit: `CONTROL_SURFACE_LAYOUT = named('csb', [{ group: 'csb-row csb-clock', items: [...] }, { group: 'csb-row
csb-app', items: [...] }, 'panel', 'seat', 'dock'])` — a layout may name TWO groups; the bar draws them as two rows (`data-layout="csb"`:
`flex-wrap: wrap`, each `.csb-row` a flex row, height `--xport-h` × 1.5 = 69 px, width `max-content` as narrow as the wider row). The word:
the rack card's title CONTROL SURFACE (`dockOf` takes `title` from the layout: `named(name, list, { title })`), id `transport` unchanged.
- Row 1 (the clock): play · power · rewind · SCRUB (120 px) · t · RATE · TEMPO pill (the expander's button, unchanged) · TIMELINE latch
  (`latch({ id: 'timeline' })`, the kit's) · gear (`barButton({ glyph: 'settings', run: mirGui().open('options') })`) · dock cycle (A4).
  REPEATS + its formula + ⟳ move INTO the expander's panel as its first tile row (they are 240 px wide and read once a minute; Josh: "the
  expander can show much more") — **call 1**.
- Row 2 (the app): LIBRARY · MOLECULAR · HYDROGEN (the three `#lwMode` buttons, the node moved — `molecules.js` l.21–33 keeps `modeSeg`
  and `set(v)`; `#lwMode` leaves the title's side) · ‹ MOLECULE › (chemview.js l.180 `mStep`'s root moved out of the MOLECULES card; the
  SECTION stepper l.136 stays in the card — the CSB chooser walks the whole catalogue, A2's search finds the rest) · the SEARCH field (A2) ·
  + · ◧ · ☆ (`#rackAdd`, `#rackToggle`, `#rackFav` from index.html l.94–96 moved in as nodes; their lists `#rackAddList` / `#rackFavList`
  anchor to the new seat; skin.css l.226–232 re-aimed). The stage keeps the logo and the menus (Josh).
- Width target ≈ 520 px (34 + 2×26 + 120 + 76 + 36 + 88 + 3×26 + gaps) against today's 560: narrower, as Josh hoped.
- GUI leaves the menu bar (notebook.js l.117 removed; the `gui` / `guiAbout` key rows stay). MIR ABOUT = page 2 of ABOUT: kit exports the
  about body builder (`gui.js` l.601 builds `ab` inline → `export function aboutBody(...)`), notebook.js' about face gets a two-tab head
  λWAVES | MIR. Gemma stays hidden (`ASK_ENABLED`).
- Phone: the bar is DOCKED (rack-wiring l.212 keeps that); nothing else moves on a phone this round.

**A2 THE MINIATURE PICKER.** `lab/picker.js` exports `suggest(query, n = 6)`: the catalogue (`CHEM_PRESETS` name · formula · id) and every
installed volume's index (`V.index(id).molecules`, read once and kept; `statusOf` says installed) → `[{ id, name, formula, vol, pic }]`,
prefix matches first. The CSB field (row 2, `input.csb-search`, placeholder "search") paints ≤ 6 tiles with the Picker's own `tile()` (l.119;
`--mol-hue` and the chosen thumbnail style apply by CSS) in a `.lw-menu.csb-suggest` pane above the bar (below it when the bar sits at the
top); ↑ ↓ Enter and a click open the molecule (`chemview.openVolume` / the catalogue pick, MOLECULES on — the same hand road as `lw:molecule=`),
Esc clears. Nothing is read at boot: the first keystroke wakes it.

**A3 THE EXPANDER'S FAVOURITES.** Kit: `timeline/knobs.js` `open()` (the TIMELINE CLIP popup, 500 ms hold or right-click on any
`.k[data-param]`) takes a port `rows(id) → [{ label, run }]` appended under LOCATE CLIPS; λWAVES passes `rows: (id) => [{ label: 'ADD TO
CONTROL SURFACE' | 'REMOVE FROM CONTROL SURFACE', run }]`. The strip: a `.csb-favs` grid in the tempo panel under the macro rail. A favourite
knob is `knob({ ...the owner's spec })` made again by the owner's `build()` and registered under the SAME `data-param` id — the registry already
lets several faces share one target (the modulation window's own clones do), so routing, automation clips and the hold menu work unchanged.
Non-knobs (Josh answer 4): each owner registers `app.sh.csb.offer(id, build, { width })` — SPECTRUM's HYDROGEN | STURMIAN row, WAVE's
POSITION | MOMENTUM and its view segment, STATE's STORE A / B, PALETTE's INVERT (D4) — and their right-click (`data-fav="<id>"` on the row)
opens the same two-row menu. Store: the kit's `jsonStore('lambdawaves.q0.csb')` = `{ v: 1, items: [id…] }`, PREFERENCE (listed in
`settings-store.js` FAMILIES so a project open never touches it). Eligibility: a knob, or a part ≤ half a rack card (`width ≤ 150`).

**A4 THE SEATS.** The dock chip cycles RACK → STAGE → FREE (Josh answer 1: STAGE at boot). Kit: `createTransport({ places: ['rack',
'stage', 'free'] })`; FREE = `createWindow({ id: 'csb', title: 'CONTROL SURFACE', material: 'modulation', chrome: 'close', resizable: false,
persist })` made on first use, and `mountIn(win.body, { face: 'float' })` — a new `face` option, because today `mountIn(host)` always takes the
work-bar face (transport.js l.645, 655). VERTICAL is a chip on that window (`data-orient="vertical"`: the two rows become two columns, the
pill unchanged, the expander opens beside); the search collapses to the `search` glyph and unfolds toward the screen's centre (left half →
right, right half → left; `csb-search[data-dir]`). Seat and orient persist in the kit's seat store (`mir.transport` `{ v: 2, seat, place,
orient }`), the window's rect in its `persist`. Auto-hide on the STAGE seat stays lab.css l.161–163's (`rack-hidden` → the bar peeks).

**A5 THE TIMELINE'S WORK BAR.** `lab/shell/keys.js` l.167 passes `transport: false` — that one word is why λWAVES' timeline has no
top-left bar; the kit mounts one for any other value (`timeline/window.js` l.84–96, BASINS' `TIMELINE_TRANSPORT`: play · power · tempo ·
app:readout · rewind · dock · door). Change: `transport: { layout: [{ group: 'native-play-row', items: ['play', 'power', 'tempo',
'app:readout', 'rewind'] }, 'door'], nodes: { readout: the t readout (a second `readout()` painted by the same `update()`) } }` — λWAVES'
OWN work bar, not the shared one (BASINS moves its one bar into the lane and leaves the stage empty; the CSB must stay on the stage to run
the app — **call 2**). Its play is the controller's = THE play; its tempo the same model. The work lane's open/close motion is the kit's
(`editor.setWorkLane`, `timeline-work-lane`), nothing to copy. THE SLAB: the kit's window is clear (`--tl-win-fill: transparent`,
timeline.css l.18) and skin.css l.892 already drops the blur; what paints the milky slab in λWAVES' picture is the `.tl-pane` lanes' and
`.tl-viewport`'s glass fill under the LIGHT theme with λWAVES' refractive frost — BASINS shows the same kit CSS under its dark tint. Builder:
read `getComputedStyle` of `.timeline-surface`, `.tl-viewport`, `.tl-pane` for background, then one unlayered rule at skin.css' foot (the
lanes' fill to a hairline-only pane: `background: transparent`, the tick bevel kept) and a shot beside `refs/timeline-basins.png`.

**A6 THE RACK SCROLL PILL.** Kit `rack-scrollbar.js`: a `scrolling` class on the track while the rack scrolls and for 900 ms after (one
timeout, cleared on each scroll — no poller), which also lifts the thumb to opacity 1; and, on the first show, one `.dev-pill` per `.dev` of
that rack (text = the card's title, `w.spec.title`), placed by `rack.css` at the title bar's outer edge (left rack: right of the head; right
rack: left), `position: absolute` so no layout moves. Look: solid `var(--acc2)` (or `--acc` by the option), `var(--w-bold) var(--font-ui)`,
no shadow, 12 px radius; the reveal `clip-path: inset(0 100% 0 0 round 12px)` → `inset(0 0 0 0 round 12px)` over 180 ms (the material mask;
a hide reverses it); ink by luminance (`core/look.js` has the accent's L — the pill sets `data-ink="dark|light"` once per accent change).
MIR OPTIONS › LOOK › WINDOWS gains SCROLL PILL · OFF | A | B (LOOK_SCHEMA row `rackPill`, default `b`); BASINS adopts on kit day.

**A7 THE WINDOW PICKER (optional, last).** The WINDOW menu's first row opens a kit panel (`shell/window-picker.js`): a search field and
every rack window as a row with its glyph, greyed when its mode hides it (`moleculeMode`'s lists), Enter opens; the motion from chain E's
Gol note. Only if A0–A6 land.

## ORDER, BUILDERS, GATES
1. Builder A-bar (Opus, worktree `it014-a-bar`): A0 → A1 → A4 → A2 → A3, one commit per row, a shot per row in `research/iteration-014/a-shots/`.
2. Builder A-side (Opus, `it014-a-side`, in parallel; touches only keys.js l.164–172, skin.css' foot, rack-scrollbar.js, rack.css, gui.js' LOOK
   rows): A5 → A6. (A7 after both merge, if at all.)
3. Each kit edit: `lab/mir/version.js` bump, one line at the top of `docs/FOR-MIR.md` under `## FROM λWAVES, FOR THE KIT (1.5.0-alpha.25+)`,
   `label()`/`t()` for every word, parts by class and `data-*`.
4. Gate per row: `./test.sh node`, the browser suites named above, `node tools/rack-deps.mjs --classes --no-write` (transport.js and
   rack-wiring.js are moved modules: the `app` literal is not extended; a new slot is `app.sh.csb`, filled by lab/shell/transport.js — it is
   already a `sh` owner), `pwa --write`. LOCK untouched (nothing under field.js moves).
5. CLAUDE.md: one paragraph "THE CONTROL SURFACE (iteration 014 A)" replacing the transport sentences in THE SHELL and FOLDERS' dock lines.

## ASSUMPTIONS (the builders build these unless Josh says otherwise)
1. The CSB is the kit's bar adopted (A0), not the app strip grown: the kit's seats, dock, mountIn and tempo parts are reused, not rewritten.
2. REPEATS, its formula and ⟳ live in the expander; the bar keeps SCRUB and t.
3. The timeline's work bar is λWAVES' own kit transport (two plays visible while the timeline is open, both THE play); the CSB never leaves the stage.
4. Favourites are a preference (`lambdawaves.q0.csb`); a favourite is a second face of the same registered target; removal by the same menu.
5. The scroll pill shows while scrolling and 900 ms after, never at rest; default accent B.
6. On a phone the bar stays docked; FREE and VERTICAL are desktop and tablet roads.

## CALLS FOR JOSH (one word each)
1. REPEATS + ⟳ into the expander (bar ≈ 520 px) — or keep them on the bar (≈ 760 px, two rows)?
2. Timeline: λWAVES' own work bar (CSB stays on the stage) — or BASINS' way, the one bar moving into the timeline and the stage bare while it is open?
3. A key for the CSB search (none today; Ctrl+K is free)?
4. The scroll pill: while scrolling + 900 ms, or whenever the rack overflows?
5. The FREE window: closable (× returns the bar to the STAGE seat) — yes?
