# CHAIN T — THE BAR, THE TIME, THE MODULATION WINDOW (branch it015-t, port 9601, GD 5301)

Rows, in this order: T3 THE ICON → T1 THE TIME → T4 THE FIXED BAR → T5 THE DOORS → T6 FAST SWITCHING → T2 THE MODULATION WINDOW'S BARS (last: the
biggest kit edit; if it cannot finish, the earlier rows still merge).
PLAN.md's CHAIN T section is the spec; "Where each item lives" has the lines (modwindow.js:527-631, modulation.js:202-254, keys.js:171-182,
lab.css:322-374, skin.css:928-931).

Notes beside the plan:
- T1: the face rule is λWAVES' (skin.css:928-931) — change it there; the CSB's t (lab.css:350) gets `font-variant-numeric: tabular-nums` and a
  `width` in ch sized for "123.45 (12)".
- T4: write `tools/csb-probe.mjs` (headless, the gate server) that logs `#transport.mini`'s rect at boot, playing, t = 1234.5, with the expander
  open, in HYDROGEN and in MOLECULES, FREE and docked — the table goes in T4-BUILD.md; the bar may change only between the two modes.
- T5: the kit's `modDoor` takes `onSwitch` — give the timeline's bar one (keys.js:182) that closes the timeline and opens the modulation window;
  the CSB's door keeps `mod.toggle()`; the MAGNET lives in lab/shell/modulation.js (read `modDodge` first): on the mod window's open while the
  TIMELINE is open (and on the timeline's open/dock while the mod window is open), seat the mod window's bottom at the timeline's top (its rect),
  centred on it, clamped to the viewport; a hand drag of the mod window releases it until the next open. Kit side: nothing but `onSwitch`'s
  existing hook, unless the timeline's root has no open/close event to listen to — then add one (FOR-MIR line).
- T6: the driver is a browser test `tests/window-switching.browser-test.mjs` — 30 toggles in 3 s over TIMELINE (T), the mod window (M), SPECTRUM
  and WAVE's fold/raise; at the end assert every `hidden` matches its presence state, `#transport` is not mid-move (`trMoving` false), the
  occlusion mask is current (`refreshOcclusion`'s counter), no console error. Fix the causes you find (the plan names the likely two).
- T2: the kit's seat standard is `lab/mir/shell/transport.css` `.tbtn` / `.seat` (read it and the CSB's `CONTROL_SURFACE_LAYOUT` for the look);
  rebuild `.m2workbar.m2pre` and `.m2prebar` with those classes (the same DOM order, every function kept; the hints through `label()`); delete
  the retired m2*/mod* rules from modhost.css for THOSE bars only (grep each class before deleting — some are shared with the lanes). Shots:
  before / after of both bars.
Tests: `tests/timeline.browser-test.mjs`, `tests/menubar.browser-test.mjs`, `tests/frame-occlusion.browser-test.mjs`, `tests/render-regressions.browser-test.mjs`
(the modulation window), `./test.sh node`, pwa --write, manifest re-hash.
