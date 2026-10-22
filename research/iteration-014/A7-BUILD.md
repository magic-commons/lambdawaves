# A7 THE WINDOW PICKER — built (builder E+A, 2026-10-22; kit 1.5.0-alpha.25, no bump)

Josh: "something similar to FL Studio's plugin picker where you could look for MIR windows and have the ones that can't be opened be
greyed out (because molecules and hydrogen mode), a search bar and a 1:1 animation behavior". The motion is GOL-NOTE.md §4.

## What changed
**The kit: `lab/mir/shell/window-picker.js`**, `createWindowPicker({ rack, open, can, icon, cls, host })` → `{ root, open, close,
toggle, isOpen, destroy }`.
- The rows: every `rack.windows()` entry except cards, sorted by name, read at each open. Each row gets a glyph seat, in this order:
  - `icon(id)` names the app's own icon: the row gets `data-icon` and an empty `.wp-icon` seat for the app to paint.
  - otherwise the window's kit glyph (`spec(id).glyph`);
  - otherwise an empty seat, so the names stay in one column.
- An open window carries an accent dot. A row `can(id)` refuses is greyed with the app's sentence (`aria-disabled`), and a press on it
  does nothing.
- The keys: typing filters by name, and the first openable match is the default (`.on`, FL 2024's rule). Enter opens it, ↑ ↓ walk the
  openable rows, Escape or a press outside closes, and opening a window closes the picker.
- The words go through `label()` / `ariaLabel()` / `t()`: WINDOWS, Windows, search the windows. The two new keys are in
  `locales/en.json` (strings, notes, sources); WINDOWS was already there.
- **`window-picker.css`**, imported by `mir.css`:
  - It sits centred in the top 12 vh and is at most 58 vh tall, clear of the stage bar.
  - The motion: the surface springs from (0.94, 0.6), 320 ms on `cubic-bezier(.2, 1.4, .4, 1)`. The rows enter 30 ms apart (`--i`,
    capped at 12, so a long list is never slow). Each row's `::after` is the faux motion blur: `scaleY(1.9)` at 10 % alpha collapsing
    into the row in 220 ms. The close is 120 ms.
  - Reduced motion (`prefers-reduced-motion` or `<html data-motion>` reduced / off) shows none of it.
  - There is no `!important`; the reduced-motion rules restate the animated selectors.

**λWAVES' side**
- `lab/shell/notebook.js`:
  - WINDOW's first row is **FIND A WINDOW…** (a separator under it, then PICKER as before). It runs the key row.
  - `layout.windowPicker = createWindowPicker({ rack: rk, cls: 'lw-menu', open: layout.raise, … })`.
  - `icon`: ATOMS → atomic, MOLECULES (`chem`) → molecular.
  - `can`: a `.dev[hidden]` is greyed with `MOLECULAR mode` (the chem card), `HYDROGEN mode` (the atomic windows while MOLECULES is
    on), or `not with this system`.
- `lab/shell/keys.js`: the row `windowPicker` (short "find a window", no chord), so the KEYBOARD window lists it and a chord can be bound.
- `lab/lab.css`: two rules paint the `.wp-icon` seat with `img/icons/atomic.svg` / `molecular.svg`, the mask road WINDOW's rows use.
- `.lw-menu` (skin.css) gives it the Picker's surface.
- `docs/FOR-MIR.md` (one line), `MIR-MANIFEST.json` re-hashed and pinned, `lab/sw.js` via `pwa --write`.

## Measured (`.tmp/a7-shots.mjs`, a probe; not committed)
- A press on WINDOW's first row ("FIND A WINDOW…") opens it with 29 rows and the focus in the search.
  - In HYDROGEN mode one row is greyed: chem, "MOLECULAR mode". ATOMS and MOLECULES wear their icons.
  - Typing "pal" leaves 1 row, PALETTE, as the default. Enter opens PALETTE (not closed, not folded) and closes the picker.
- In MOLECULAR mode, opened by the key row, ten rows are greyed "HYDROGEN mode": calculus, equalizer, staticfield, ladder, orbit,
  slice, shadow, spectrum, state, vortex (`moleculeMode`'s list).
  - A press on CALCULUS leaves the picker open and the card hidden.
  - Escape closes it. No page errors.
- Shots in `a-shots/`: `A7-open.jpg` (HYDROGEN), `A7-molecular.jpg` (the ten greyed), `A7-search.jpg` ("pal"), `A7-spring.jpg` (90 ms
  into the spring).

## Tests
- `./test.sh node` rc 0 (keyboard-shortcuts and mir-manifest included). `rack-deps --classes --no-write` green: notebook 23,
  keys 16, the HINGE holds.
- Browser: `menubar` GREEN, `keyboard-window` GREEN, `frame-occlusion` all PASS.

## The CLAUDE.md sentence (THE CONTROL SURFACE paragraph, replacing "A7 THE WINDOW PICKER is not built")
A7 THE WINDOW PICKER is the kit's `createWindowPicker` (`shell/window-picker.js` + `.css`), opened from WINDOW's first row FIND A WINDOW…
and the chordless key row `windowPicker` (`layout.windowPicker`).
- It lists every rack window by name under a search field, the first openable match the default. Enter or a press runs `layout.raise`;
  Escape or a press outside closes it.
- A window the other mode hides (`moleculeMode`'s lists) is greyed with the mode that shows it.
- ATOMS / MOLECULES wear the Picker's icons through lab.css' mask road, on the Picker's `.lw-menu` surface.
- The motion is GOL-NOTE.md §4: a spring open, rows 30 ms apart, the faux motion blur, a 120 ms close. Reduced motion shows none of it.

## Open for Josh
- The picker greys rather than hides the other mode's windows, as asked. There is no "switch mode and open" on a greyed row. Say if a
  press on one should switch the mode and open the window.
- No chord is bound. Mod+P and Shift+W are free if you want one.
