# A6 THE RACK SCROLL PILL — built (builder A-side, 2026-10-22; a KIT row, MIR 1.5.0-alpha.25)

Josh: "When scrolling on the rack window, let a little colored pill appear directly adjacent to the window title bar (Accent Color B) …
the name of the window in a strong, bold, sans serif font … No shadow just solid pill … When the scroll bar disappears, the pills
disappear too … material animated … incredibly cheap … autodetect whether it should use white text or black text … disabled/enabled
toggled in the MIR options window and whether it should be Accent color A or B (honestly prefer B)."

## The finding that shaped it
λWAVES never runs the kit's seated scrollbar (`createRack({ scrollbar: true })` is off: λWAVES keeps its native 2-px bar, lab.css §2,
and rack-wiring.js is builder A-bar's). So the pill is not inside `createRackScrollbars`: it is its own part, `createRackPills`, in the
same file, made by `createRack` for every rack whichever scrollbar runs. Where the seated track exists it gets the same `scrolling` class.

## What changed (kit, under the trickle-down rule)
- `lab/mir/shell/rack-scrollbar.js`: `createRackPills({ host, racks, view })`, `PILL` ({ linger 900, gap 6 }), `inkOn(rgb)`.
  - a rack's `scroll` adds `scrolling` to it (and to its seated track) and arms ONE timeout, re-armed by each scroll; 900 ms after the
    last scroll the class and the pills go. No poller, no frame job.
  - the burst's first scroll seats the pills: one `.rack-pill` per docked window, its text the head's own `.dev-eyebrow` (already
    labelled), centred on the title bar, at the card's outer edge (left rack: right of the card; right rack: left) — measured ONCE.
    Each further scroll writes one `transform` on the pill layer (never a layout). The layer spans the host's width, clipped to the
    rack's height, `pointer-events: none`.
  - the ink is read once a burst from the first pill's computed fill (WCAG luminance, threshold 0.179): `data-ink="dark|light"`.
- `lab/mir/shell/rack.js`: made with the rack (one line after the scrollbars).
- `lab/mir/shell/rack.css`: the pill (solid `var(--acc2)`, `var(--w-bold) 11px var(--font-ui)`, 12 px radius, no shadow); the reveal
  `clip-path: inset(0 100% 0 0 round 12px)` → `inset(0 round 12px)` over 180 ms (the right rack's from the other side), reversed on hide;
  `body[data-rack-pill="a"]` → `--acc`, `="off"` / `ui-hidden` / `phone` → none; reduced motion → no transition;
  `.rack-scrollbar.scrolling` lifts the thumb.
- `lab/mir/shell/gui.js`: LOOK_SCHEMA row `rackPill` (enum off · a · b, default b; B writes nothing, so λWAVES' first-run look moves
  nothing — `body[data-rack-pill]` only for OFF and A) and MIR OPTIONS › WINDOWS › SCROLL PILL (OFF | A | B), words through `phrase()`.
  λWAVES reads it through the look store as every look key (`lab/look.js` LOOK_ROWS takes every LOOK_SCHEMA row).
- `lab/mir/locales/en.json`: the four new strings, their sources and SCROLL PILL's note.
- `lab/mir/version.js` 1.5.0-alpha.25; `MIR-MANIFEST.json` version + the six re-hashed rows; `tests/mir-manifest.test.mjs` pins
  alpha.25's manifest sha (a two-file edit, as the pin asks); `docs/FOR-MIR.md` top section; `lab/sw.js` via `pwa --write`.

## The shot
`research/iteration-014/a-shots/A6-scroll-pill.jpg`: the right rack mid-scroll, STATE and PALETTE pills in accent B (λWAVES' orange)
with dark ink; probed: the pills go 900 ms after the last scroll (`scrolling` false, layer not `on`), `rackPill: 'a'` paints accent A.

## Tests
`./test.sh node` green (wigner W42-8 red once under the browser suites' load, 16/16 alone — the known flake); `menubar` GREEN;
`timeline` 14/14 GREEN; `frame-occlusion` 7/7 (its detached-gap row red once beside the node suite, green alone); `mir-manifest` PASS alpha.25. `rack-deps --classes --no-write` green (no λWAVES file).

## The CLAUDE.md sentence
THE SCROLL PILL (iteration 014 A6, kit 1.5.0-alpha.25): while a rack scrolls and 900 ms after, each window's name in a solid accent-B pill
beside its title bar (`shell/rack-scrollbar.js` `createRackPills`, made by `createRack` for every rack; MIR OPTIONS › WINDOWS › SCROLL PILL
OFF | A | B, look key `rackPill`).

## Open for Josh
- The pill is at the card's OUTER edge, over the stage (left rack: right of the card; right rack: left), not over the title bar's own
  buttons. Say if it should sit inside the head instead.
- Merge note for the integrator: builder A-bar also edits the kit; both branches bump to alpha.25 and re-pin the manifest — re-hash once
  after the merge and pin the one sha.
