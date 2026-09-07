# λWAVES — LIVE STATE (2026-09-07, wave 106)

Written mid-session as a durable handoff. Supersedes nothing in docs/; this is the
"where are we right now" sheet. Delete it when the tree is frozen.

## THE STANDING ORDER (Josh, 2026-09-07)

> "Complete all the remaining tasks all the way to the end until you hit the git and
> cloudflare wall; I want their to be our main and developer versions. One where we
> have a working build and one where we can do our iterative work. Copy and create an
> 'ark' so to say, for a repo version for git. I don't know how to set any of the
> github stuff up so you have to guide me through it and you have permissions to do
> anything from here on out to handle shipping/publishing/etc."

So: git is now AUTHORISED (it was not before). Cloudflare login/deploy still needs
Josh's own credentials — that is the wall.

## GATE

- `./test.sh node` — **0 failing** (green).
- `./test.sh browser` — **28 failing of 165**, saved at
  `~/.claude/jobs/9967323c/tmp/bg.txt`.
  The 28: B20 B40 B52 B54 B55 B57 B60 B62 B65 B66 B67 B74 B75 B76 B80 B91 B93 B98
  B110 B123 B124 B129 B131 B132 B134 B135 B139 B141.
  Most are STALE LAWS — Josh changed the app's mind prompt-by-prompt over ~40 waves
  and the law text still describes the superseded design. Four Opus investigators
  are partitioned over them (A: B20–B60, B: B62–B76, C: B80–B124, D: B129–B141) and
  return patch specs; patches are applied SERIALLY because they all land in one file.
- The gate wants an HTTPS server. `./test.sh browser` starts it (8701/5202).
  A plain `python3 -m http.server` will NOT work — the gate URL is https.

## WHAT LANDED THIS SESSION (all uncommitted)

wave 105 — MIR modulation plugin: BASINS residue cleaned, 34 dead CSS rules deleted
under a 5425-element x 34-property fingerprint across 5 house states, HIT wired into
the TRIG IN cycle, `outsOf` fixed (it was structurally broken — audioOutputOf returns
null), async AUDIO handlers re-resolve through stillMine(), aria-live on one line.

wave 106 — Josh's ~30-item list:
- MACROS: three new targets (material.slice.pos, material.slice.thick, state.rabi)
  plus `__LW_hooks.ab.setOmega`.
- PLAYHEAD: readout resets on CLEAR / rewind / Home; the emoji glyph became a drawn
  SVG_REWIND; **the round expand button is now the λ mark itself** (a live clone of
  `#title .mark`, repainted by paintMarks() so it turns with the palette wheel) and
  the ↗ it used to wear moved to the new `.dock-btn` (transport transfer).
- KEYS: `M` opens the modulation window; `Ctrl+Space` took over MOD arm. 43 actions.
- MENUS: MODULATION is first in WINDOW; "INVERT the cloud" is first in VIEW.
- REARRANGE: INVERT -> PALETTE; FRAME + AXIS -> SETTINGS with a new RGB/CMY axis-ink
  toggle (`mat.axisInk`, and a 2-bit AXIS_INK field packed into statelink's flags
  byte at `ink << 5`, index 0 = 'theme' so old links decode unchanged).
- PHONE: tapping a window no longer throws it off the rack (`reorderTo` moved the
  card into `#rackL`, which is display:none on phone); the menu bar always shows.
- PROJECTS: the list scrolls, folder ROOT chips, name-sorted grouping, Ctrl+S /
  Ctrl+Shift+S with a narrow text-field allowlist. The real "I don't see my projects"
  bug was that `show('projects')` never called `renderProjects()`.
- HISTORY: `lab/history.js` rewritten to ring[] + cursor with labels, `entries()`,
  `goto()`; a HISTORY rack window; `hTouchName()` names each row from the gesture;
  undo widened over the look block (hLook/hLookKey/hLookWrite).
- DEFAULTS: spectrum channels ship FOLDED, camera boots 'free', CAM.MU_DEF 2.5 -> 1.0,
  favourite layouts capture v:3 with `look` and `cam` (colour/draw/camera, NOT wave
  state).
- CONTENT: 20 new presets (11 -> 31) and 10 new palettes (23 -> 33), from the Gemini
  collab; validated — 0 mode violations and all 20 windows land exactly on the
  recurrence their modes imply (rational-arithmetic check).
- SPECTRUM: phase knobs un-staggered; RATE distinguished from PHASE by a 15px dial +
  a `.k.live` accent box-shadow (NOT border-color — skin.css:165 sets every .k-dial's
  border-color transparent) and a `.k.rate` +/-16px hit band to keep the 44px law.

## OPEN

1. The 28 gate reds (in flight).
2. **5 live defects** the gate agent reported, still unruled:
   - `restingHint()` in modwindow.js is dead code after wave 105 restored COPY.hint
     verbatim; the `.m2hint` seat is now display:none at rest. Needs Josh's ruling.
   - ANCHOR/TRIG chips light but do not reach the model.
   - statelink.js lost byte-idempotence on first re-mint (FREE camera quat/angle ulp).
   - The menubar reserves room for a `* LOGO_SCALE` term wave 79 deleted.
   - `.m2add` measures 0x0.
3. **#79 MACROS II** — the Kepler orbit knobs (servo spec P7–P10 in hand) and
   rotation/deflection as a RATE (P1–P15, approved). Includes the `driven()` port
   callback on `dirty()`.
4. Gemini's keybinding editor (`lab/keymap.js`) — briefed via `agy`, still running;
   needs wiring + CSS when it lands.
5. The ark: `main` (working build) + a dev branch, then GitHub, then Cloudflare.

## LAWS THAT BIND EVERY EDIT

- `lab/mir/modwindow/*` is BYTE-FROZEN. `tests/mir.test.mjs` section 16 proves
  byte-identity. All skinning goes in `lab/modhost.css`, all behaviour in
  `lab/modwindow.js`.
- Load order is lab.css -> skin.css -> modhost.css -> mir/modwindow.css, so the
  artifact wins; that is why modhost.css carries 644 `:root:root:root` prefixes
  (they are DESCENDANT selectors: `html #modwin ...`).
- **Any edit under `lab/` requires `node tests/pwa.test.mjs --write`** or the service
  worker serves stale bytes forever.
- Ports: λWAVES owns 8700–8799 and 5200–5299. Never touch 8443 or 8875.
- Never write under `~/Documents/OBSIDIAN` or `~/Documents/LUX JSY LIBRARY`.
- Never run a peek screenshot concurrently with `./test.sh`.
