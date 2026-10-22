# A9 THE WORK BAR'S WORDS AND DOOR — built (builder A-side, round 2, 2026-10-22; kit 1.5.0-alpha.25, same round)

Josh's answers 6 and 7: the work-bar t "keep it light, yes" (the lap in brackets, as the stage strip shows it); the door "remove anything
with the MIR logo and have proper icons for it. Leave the mechanism for the animation and CSS, as it will be useful somewhere else. I shall
call it the MIR Logo Button".

## What changed
- `lab/shell/keys.js` (the timeline port):
  - `ui.tlTime` writes the stage strip's `clockText` form: `compact(t, 1e5, 2)` plus `'  (' + compact(lap, 1e4, 1) + ')'` when the lap
    (`floor(t / clock.window)`) is not 0, on the same 5 Hz / every-paused-present cadence. Probed: both readouts read `41.89  (2.0)` at
    t = 2.5 windows.
  - `transport.door: 'icon'`, `doorIcon: new URL('../img/icons/modulation.svg', import.meta.url).href`: the sine wave committed on
    yan-c (the icon builder A-bar puts on the CSB's door).
- Kit:
  - `shell/transport.js` `modDoor({ mark: 'icon', icon })`: a `.mod-door-icon` span whose `--door-icon` is the url, or a data: url
    when `icon` is an svg string. The button's class is `mod-exp mod-door` (not `mod-logo`, so the accent's mark painter and the logo
    rules leave it alone). `createTransport({ door, doorIcon })` passes it on. The diamond (`'palette'`) and the nine squares (`'mark'`)
    are untouched: the MIR Logo Button's mechanism stays.
  - `shell/transport.css`: `.mir-transport .mod-exp > .mod-door-icon`, 18 px (`--xport-door-icon`), `background: currentColor` under the
    mask, so it inks like every glyph in the bar.
  - `timeline/window.js`: the work bar's `createTransport` takes `tp.door` / `tp.doorIcon` (defaults: the palette diamond, as before).
- `docs/FOR-MIR.md`: a new line at the top. `MIR-MANIFEST.json` re-hashed and pinned with `manifest.py`. `lab/sw.js` via `pwa --write`.

## The shot
`research/iteration-014/a-shots/A9-workbar-door.jpg`: play · power · 30.0 BPM · `t 41.89 (2.0)` · ⏮ · the sine-wave door.

## MIR-logo marks λWAVES' chrome still shows (NOT changed; Josh decides)
- The title wordmark's nine squares (`#title .mark`, `lab/index.html`; the accent paints them, `accent.js` MARK_SELECTOR).
- The notebook's logo (`.nb-logo`, `lab/index.html` / notebook.js).
- The busy mark (`#busyMark`, `lab/busy-mark.js` over the kit's `shell/busy.js` nine squares) and a loading card's `.dev-loading .mark`.
- The modulation window's workspace switch, its foot seat (`window/workspaces.js` `workspaceSwitch`: the palette diamond; λWAVES' seam
  hands it `switchWorkspace`, `lab/shell/modulation.js`).
- MIR OPTIONS › ABOUT's MIR logo (`gui.js` `.gui-logo`, its credit line) and MIR OPTIONS' SHOW LOGO switch (that one is the app logo).
- The CSB's door on the stage (`lab/shell/transport.js` `door: 'mark'`): builder A-bar's, being moved to the same icon in their round 2.

## Tests
`./test.sh node` rc 0; `timeline` 14/14 GREEN; `menubar` GREEN; `frame-occlusion` 7/7; `rack-deps --classes --no-write` green; `mir-manifest` PASS.

## The CLAUDE.md sentence
THE WORK BAR's t reads as the strip's does, the lap in brackets (`41.89  (2.0)`), and its door is the modulation window's own icon
(`img/icons/modulation.svg` through the kit's `door: 'icon'`, `doorIcon`; iteration 014 A9): no MIR logo there; the diamond and the mark stay
in the kit as the MIR Logo Button.
