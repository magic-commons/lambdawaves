# 022 chain P — THE MENUS AND THE POPUPS (Opus builder, worktree agent-a95f793bdfdeee7ab, branch it022-P, BASE 61b42e0)

## P1 THE DOORS (be848a7) — kit MIR 1.5.6-alpha.4 (clone road, kit 4654cb8 + 0d98cc8; kit code +233 −185)
- `shell/menubar.js`: the bar's renderer lifted to `rowsOn({ layer, phone, done, surface })` (one renderer); ↑ ↓ walk any list; `opts.id` → `data-id`;
  a cursor's click keeps the submenu its hover opened. **`contextMenu({ x, y, entries, anchor, onClose, label })`** — one pane of those rows on the
  top layer (`.mir-ctx` popover), `.glass[data-mir-surface="menu"]` (submenus too), flipped inside the viewport, a phone's accordion, closed by an
  outside press, a scroll, resize, blur, the focus leaving, Escape; **`setMenuEscape(push)`** hands Escape to λWAVES' `A.escape`.
- `kit.js`: **`TAP.hold` 500 · `TAP.slop` 8**, **`holdTap(el, fn, { ms, slop, accept })`** (the release's click swallowed, a 12 ms buzz on touch),
  **`onContext(el, fn, { mouse, right })`** (right-click · ContextMenu · Shift+F10 · a still hold, once per gesture, never the browser's menu,
  `data-menu` → `-webkit-touch-callout: none`); the knob's value door on its api and `root.mirKnob`: `home()` · `input(x)` · `fine(on?)` (FINE ×½ drag).
- **ONE KNOB MENU** `knobMenu(knob, { x, y, appRows, open, onClose })` · `knobMenuPart(name, fn)` · `knobAct(knob, verb)`: RESET · COPY · PASTE ·
  FINE ✓ · ROUTES › · CLIP › · the app's rows. `timeline/knobs.js`' `tl-pop` is its CLIP › part (−5 lines net), the modulation window's `mod-pop` its
  ROUTES › part (RANGE • · REMOVE · REMOVE ALL · the macros holding it; its RESET keeps the routes; −21 net; `view.popState()` reads the pane); the
  routed dial's hold opens it with ROUTES › out. `.mod-pop`'s sheet deleted.
- **`--surface-menu-floor`** (tokens.json + skin.css; TINTED .94 · REFRACTIVE .72 · SOLID 1): `body[data-card] .glass[data-mir-surface="menu"]` paints
  its colour, so no app hard-codes .92/.94/.97.
- The kit's poppers: PATTERN's cap menu → `contextMenu` (`.pt-menu` sheet gone); FOLDERS' context box → a menu pane, not a well (the ask keeps its
  own), its long-press → `onContext` (560 → 500 ms, 10 → 8 px), `createFolders({ itemRows })`; `.m2pick` / `.m2ppick` / `.m2deadpick` (their #modwin
  fill gone) and the transport's seat menu carry the surface. P3's kit side: `listPane`/`select()` rows take `pic` (lazy) and `title`; `select({ repick })`.
- Version sites 3/3, CHANGELOG 6 lines, i18n re-extracted, TOKENS.md regenerated. Kit tests: `npm test` 143/144 then the one stale (i18n catalogue)
  re-extracted → node 81/81; timeline, keys-table, pattern re-aimed (`.mir-ctx`, `[data-id]`) and GREEN; controls, folders, folders-basins,
  modwindow, transport GREEN after the last edit. Adopted; pinned `'1.5.6-alpha.4': 2e2ddd2a…` (P1 pinned 24566a2e…, re-pinned in P3); `--check` in step.
- **Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a95f793bdfdeee7ab/.tmp/kit-1.5.6-alpha.4.bundle`** (kit-1.5.5 + v1.5.5).

## P2 THE MENUS (ca40184) — `lab/context-menus.js` (93 lines), seated by rack.js after FOLDERS (`createContextMenus(app)`; the literal untouched)
- One delegated door: `contextmenu` (when no surface took it first: `defaultPrevented`), ContextMenu/Shift+F10 on the focus, and a document `holdTap`
  (touch/pen; a mouse only on SPECTRUM's grid; never on a `[data-menu=""]` surface, a registered knob or a ring). A text field keeps the browser's.
- Menus as shipped (rows are action ids; ✓/• from `get()`, keys from the table, icons from the row):
  stage: VIEW • › · STYLE • › · PALETTE ✓ · CAMERA HOME · FLIP ✓ · LOCK ✓ · COPY PICTURE · HIDE ✓ — title bar: FOLD ✓ · FLOAT ✓ · TO THE OTHER RACK ·
  RESET PLACE · SOLO · WINDOW HELP ✓ · CLOSE — knob: the kit's 4 + ROUTES › / CLIP › + ADD/REMOVE CONTROL SURFACE (setTimelineKnobRows) · ROUTE THE
  MACRO · COPY ID — switch/seg/trig: RESET · LEARN… · the favourites' ADD/REMOVE (offered rows) · COPY ID — the bar: DOCK ✓ · EXPAND ✓ · THEME • › ·
  FOLDS · MOD ✓ · MIR OPTIONS · HIDE — Picker tile: OPEN · ISOMERS · KEEP ON THIS DEVICE · COPY NAME · COPY FORMULA — Picker page: LOOK • › · SEARCH ·
  FOLDERS · OPEN… — FOLDERS item: the kit's rows + OPEN (+ EXPORT .mir / .png for the open project) — SPECTRUM's grid (keys/hold; right = REMOVE):
  CLEAR · NORMALIZE · NEXT/PREVIOUS PRESET · COPY LaTeX · SOLO SPECTRUM — notebook: NOTEBOOK ✓ · COPY TEXT · COPY LINK · COPY LaTeX · EXPORT .json —
  FINDER row: OPEN/CLOSE · FOLD · FLOAT · WINDOW HELP — ESP bar / stage words: FORMULA ✓ · ATOM LABELS ✓ · CAPTIONS ✓ · STATUS TAGS ✓ · ESP BAR SIDE • › ·
  COPY FORMULA · COPY LaTeX. NODES card/ground: its own rows on `contextMenu` + `onContext` (hold on iPad now).
- `lab/actions.js` +36: 18 named rows (`copy.picture` gesture · `copy.name` · `copy.formula` · `knob.reset|copy|paste|fine|copyId|route` ·
  `control.reset|learn` · `picker.open|isomers|keep|look` · `esp.side` · `notebook.copy` · `spectrum.solo`) + 4 per window (`window.<id>.float|side|
  reset|solo`, generated with open/close/fold); all `surface`, so MAPPING and `action.<id>` see them. `csb-favs.js` −23 (its tl-pop copy and its
  any-move hold gone: the jitter bug). skin.css: λWAVES' FROST twins skip `[data-mir-surface="menu"]`. `tools/x-probe.mjs`, `d-shots.mjs` re-aimed.
- Pictures (P-shots/): P2-stage/knob/title/words/picker-tile-1280; P2-stage/knob/picker-tile-hold-500 (a still touch hold).

## P3 THE POPUP LAW (537e379)
- No native `<select>` left: MOLECULES' chooser → `select()` with each molecule's picture (catalogue `img/menu/<id>.webp`, volume `t/<id>.webp` via
  `volumes.js pictureUrl`, lazy, read only when the list opens), its groups as never-chosen rows, `repick` (a press on the chosen row opens it, as the
  old change event did); STATES' and ORBITAL's PRESET… and the drive's polarisation → `select()`.
- Hard tints deleted: the hint tip/ⓘ gradients (eight `!important`; count now 31, kit.md updated), `#menubar .mb-list` .65, `.lw-menu` .985/.62
  blur(28) saturate (kept for `#lwMenu`, the Picker PAGE), `.mm-isos` .97, the look drop .92, `.m2pick` .94, lab.css's `.mb-list` .97 + `.mod-pop` copy,
  nodes.css .97 + `--neu-raise` and `.nodes-pop`. `.glass[data-mir-surface="menu"]` on NODES' + menu, the look drop, the isomer pane, CSB suggest.
- Sheets: P3-frost-light / morph-dark / swift-light × before / after (knob menu · MOLECULES list · palette list · NODES + · menubar · look drop).
- Re-aimed to press the list's rows: chem (L6/L9), register, molecule-head, library, stage-text; `tools/csb-probe.mjs`.

## Tests
`./test.sh node` GREEN after each row; rack-deps HOLDS (persist 24/25); 0 app cycles; new-project in step; mir-manifest + adopt `--check` in step.
Browser (LW 9673 / GD 5673): menubar, keyboard-window, hide-reveal, curves, picker-looks, routed-knob, timeline, history, chem, register, stage-text,
molecule-head, library GREEN; `x-probe x2` (NODES' card rows) and `x4` (identical) GREEN. **molecule-demos RED at BASE 61b42e0 too** ("animation frames
stopped", headless; not this chain). THE LOCK `--check --query gastab=0`: 843 · 0 · 0 page errors — no leaf moved.

## The sentences (for the close)
- docs/laws/shell.md — ONE MENU DOOR (022 P): every context menu is the kit's `contextMenu` (1.5.6-alpha.4) over action ids, mounted by
  `lab/context-menus.js`; a right-click, the ContextMenu key, Shift+F10 and a still hold (`TAP.hold` 500 ms, `TAP.slop` 8 px) are one gesture; a surface
  with a menu never shows the browser's; a knob's menu is the kit's knob menu (RESET · COPY · PASTE · FINE · ROUTES › · CLIP ›, λWAVES' rows at its foot);
  SPECTRUM's grid keeps right = REMOVE and opens on the keys and the hold; the menus are layers of the Escape stack.
- docs/laws/kit.md — A POPUP WEARS THE SKIN (022 P): every popup list is `.glass[data-mir-surface="menu"]` and takes its material from the skin's
  tokens and `--surface-menu-floor`; no native `<select>` (the kit's `select()`/`listPane`, a row's `pic`); λWAVES writes no menu alpha (`#lwMenu`, the
  Picker page, is a page).

## FOR 1.5.6 leftovers
The FINDER (`window-picker.js`) carries `.glass` but not `data-mir-surface="menu"`; the modwindow's other hard tints (`--m2-face-tint-97`, modhost.css
:957, :1001); the kit's `.native-info`/`.control-help` popover is not yet a `.glass[data-mir-surface]` (the floor does not reach it); the i18n extractor
does not read menu-entry labels (the knob menu's words left en.json); a group header row for `listPane` (λWAVES uses never-chosen rows).

## Open questions for Josh
1. FROST's light tone writes white ink: over λWAVES' white stage every popup (and now the hint tip, which wore its own dark-on-white) is faint
   (P3-frost-light-before/after: the same before). A skin matter for chain S?
2. On a touch screen the title bar's hold stays the rack's LIFT (400 ms, the kit's reorder); its menu is a right-click/keys only there. Keep?
3. `picker.fav` is not built: the Picker has no favourites shelf to hold it. `spectrum.solo` solos the SPECTRUM window, not a state.
4. The bar menu has no seat rows: λWAVES runs the kit bar with `seatMenu: false` (the dock decides). REFRACTIVE's floor .72 — enough?
