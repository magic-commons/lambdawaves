# 025 · CHAIN C — THE WORKFLOW · BUILD (Opus builder, branch `it025-C`, base d93c670f, 2026-10-28/29)

Kit MIR 1.5.6-alpha.16 → **1.5.6-alpha.17** (C3 only; C1, C2 and C4 are λWAVES'). Clone road: kit-1.5.5 @ **c13df7d**.
**Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ae8990eb6a64f1603/.tmp/kit-1.5.6-alpha.17.bundle`**
(kit-1.5.5 @ c13df7d + v1.5.5; `git bundle verify`: okay, 2 refs). THE LOCK: not run, no field path; `render-exact.js` and `field.js` untouched.
Rack `app` literal untouched (rack.js only passes `isOpen` to `createFilmCard`); `lab/mir/**` only through adopt; `lab/fonts/**` untouched.

## Rows
- **C1 FILE › RENDER…** (86acbb26) `lab/actions.js` `render.open` (RENDER…) and `render.frames` (EXPORT FRAMES… = the same with FORMAT PNG), group
  PROJECT, `filmOpen()`: the card revealed, floated (`layout.popOut`) or raised if it already floats, then `filmCard.preset()`. `lab/film-card.js`
  `preset({ format, range })`: a timeline selection → SELECTION; the TIMELINE open with clips → ACTIVE (over every clip when no range is marked);
  a placed ONE PERIOD → PERIOD (ACTIVE over it, MOD OFF, as PLACE ONE PERIOD leaves it); else STILL. `lab/shell/notebook.js` FILE: RENDER… and
  EXPORT FRAMES… after the EXPORT submenu (EXPORT › FILM… left, it was the same door). Checked in Firefox: still · png · period (active 0→3,
  mod off) · active (range set over the clips) · selection (plan 0.5→1.5). **No chord** (call 7): Mod+Alt+R is Firefox's Reader View, Mod+Shift+E
  is Ctrl+Shift+E (the dolly zoom) off a Mac, Mod+Alt+E is AltGr+E (€); every free-looking chord collides with something.
- **C2 THE TIMELINE'S DOOR** (229f719d) the rail takes **no app chip** (`createRail`'s chips are fixed when the window is made; `installTimeline`'s
  port carries none) — so not a kit door: the RENDER chip (film glyph, hint "render this range", `data-key-action="render.timeline"`) rides the
  work bar's own `app:` seat after ⏮ (as the `t` readout does), `lab/shell/keys.js`; it runs the new action `render.timeline` = C1 with SELECTION
  when one is marked, else ACTIVE.
- **C3 THE BOUNCE ROWS** (kit c13df7d · b8081f10, e7236d86) `render/panel.js` + `render/render.css`, **opt-in `even: true`** (a panel without it —
  BASINS', the kit fixture's — is byte-for-byte the old rows): twelve columns, every control the same FIELD under the same stored key.
  RANGE (seg, two by two: STILL · ACTIVE · SELECTION · the app's `ranges`) | FORMAT (MP4 / PNG) · SIZE (1080p · 1440p · 2160p · SCREEN) | FPS | AUDIO
  · LENGTH | START AT (STILL only; the unit in the hint) · MOD · TIMELINE + the app's switches in `controls.switches` (λWAVES: NODES · CHROME) ·
  the estimate (size · frames · seconds · MB · codec; the whole sentence its hint; `state().estimate` keeps the sentence) · RENDER | PREVIEW | CANCEL.
  The two notes became hints (the title's, MOD's, TIMELINE's). `ranges: [{ id, label, title, motion, is(), pick() }]`: λWAVES' PERIOD (ACTIVE over
  ONE PERIOD; placed when there is none; lit while the active range is its clip). Short words where the long ones were cut (A's FOR-MIR note):
  MOD (the bar's word), SCREEN for CURRENT DEVICE WINDOW, PREVIEW (hint: the first 3 seconds); every switch lamp-less, lit when ON.
  i18n re-extracted (1507 strings); version 3/3; CHANGELOG line. A fix found on the way: a non-even panel must not take the switch seat (null === null).
- **C4 THE BOUNCE SAID** (3174c2ff) `film-card.js` `bounceLine`: "RENDERED 120 frames · 4.0 s · 1920 × 1080 · 30 fps · Opus 48 k" (seen, Firefox,
  a TIMELINE · ACTIVE render with a KEEP click clip) — frames, seconds, size, fps and the audio's entry from the FILE (`fileFacts`), the kit's result
  only where the file has no word (PNG's fps, the audio rate); never the options. One `notice()` (the kit's toast) + the card's status, which now
  replaces the kit's "Render complete"/"Preview ready" — so a DISOBEYED sentence (B4) is no longer overwritten by it. PREVIEW says "PREVIEW …".

## The card's height (`tools/render-card.mjs`, 300-px rack, 1600 × 1600, STILL, Firefox)
Card **1594 → 1045 px**; DETERMINISTIC RENDER section **923 → 390 px** (PERIOD/ACTIVE: 329, the LENGTH row hidden). Labels cut: none
(before, the selects' values were ellipsized: "ON · FROM FIRST SP…", "ON · THE TIMELINE’…", "CURRENT DEVICE WI…"). Shots: `C-shots/` —
C1-file-menu, C2-timeline-door, C3-card-before, C3-card-after, C3-card-after-period, C4-bounce-toast.

## Tests
- Kit `MIR_SKIP_BROWSER=1 npm test` 82/82 (no string re-aimed). Kit `render.browser.mjs` (Chromium, CDP 9770) 64/65 — the one red is the
  pre-existing "a press at its centre starts nothing" (red at alpha.11, A's note), untouched.
- λWAVES (gate 9693 / gd 5693, Firefox): `film-handover.browser-test` GREEN · `timeline.browser-test` GREEN 0 of 14 failing (after C3 and after C4) ·
  `keyboard-shortcuts.test` 7 PASS · `./test.sh node` **EXIT 0** (first run red on `hints-census`: the PERIOD hint was 109 chars → one line, e7236d86) ·
  `new-project --check` in step · `mir-manifest` PASS (alpha.17 = d4bc54b78ed6…) · `adopt --check` in step · `rack-deps --classes` HOLDS (persist 24/25) ·
  `pwa.test --write` after each row.

## The law sentence (docs/laws/film.md, at the close)
THE BOUNCE IS ONE PRESS AWAY (025 C): FILE › RENDER… / EXPORT FRAMES… and the TIMELINE's film chip open the RENDER card in front with its RANGE
taken from what you have (a selection, the open timeline, ONE PERIOD, else STILL); the card's rows are even (MIR 1.5.6-alpha.17 `even`, the
switches' seat holding NODES · CHROME), and a landed render says one line read back from the file: frames · seconds · size · fps · codec.

## Open questions for Josh
1. A chord for RENDER…: none was free (above). Say one and it is a one-line `keys:` on `render.open` (the keyboard window can bind it today).
2. The plan's file name `<project>-<range>-<fps>fps.mp4` is NOT built: films keep λWAVES' R10 name (`captureName`: lambdawaves-<kind>-<label>-
   <W>x<H>-<fps>fps-<frames>f…). Say if you want the project's name first — it lives in `render-exact.js nameFor` (THE LOCK's file, so not touched here).
3. RANGE is two by two (STILL ACTIVE / SELECTION PERIOD) and FORMAT one over the other: four words in one line of a 300-px card cut SELECTION.
4. MOD and SCREEN are the short words for MODULATION and CURRENT DEVICE WINDOW (the hints keep the long ones). The RENDER card floats where the
   kit's float puts it (over the right rack); say if FILE › RENDER… should dock it instead.
