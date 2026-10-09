# 0.5.0 fix round 1 · the five regressions the re-aimed legacy boot suite found

Opus 5.5 sub-agent, 2026-10-09. Worktree `.claude/worktrees/agent-ae79503b74f780d1a`, branch
`worktree-agent-ae79503b74f780d1a`, from `7edae5c` (sos-s0, with the re-aim merged). The rows are the ones in
`LEGACY-BOOT-REAIM.md` §4. Each was checked on this tree before it was fixed. Nothing under `lab/mir/**` or `lab/fonts/**`
was edited.

| Row | Outcome | Commit |
|---|---|---|
| B78 · wave 53, the `slap` word | **fixed** | `31f4849` |
| B111 · wave 59, phoneRack not stored | **fixed** | `acd5761` |
| B144 · wave 68 (c), accent 360 folded | **fixed** | `7c3da43` |
| B139 · FROST STILL changes the fill | **fixed** on λWAVES' panes. The kit's own surfaces stay the kit's: **MIR brief candidate** | `7bd1bf6` |
| B149 · wave 69 (b), a Tab animates the rack | **MIR brief candidate** (no kit lever exists) | — |

## The rows

**B78 · fixed.** The kit's KEYBOARD window prints an action's `short` on its key cap and in the cap's aria-label
(`lab/mir/keyboard/keyboard.js:190,217,263`). The K row said `short: 'slap'`, so the cap read `K: slap`. The fix is one word
in `lab/rack.js`'s ACTIONS (`short: 'slap'` → `short: 'impulse'`). The id stays `slap` so a saved binding keeps loading.
The label was already `impulse along the axis (k = 0.2)`. Gates: `tests/keyboard-window` GREEN,
`bash test.sh node` exit 0.

**B111 · fixed.** The kit's ◧ is the adopted `#rackToggle`. `createRack` binds it to `setHidden(!isHidden())`
(`lab/mir/shell/rack.js:957`). That stores the kit's `phoneShown` but never reaches λWAVES' `saveSettings`, so
`settings.phoneRack` was never written. The kit offers no hide callback: `onChange` fires on every persisted rack change,
and that is too wide for a blob write. It does expose the button as `rk.el.toggle`. So `lab/rack.js` adds one line after
the `createRack` call: `rk.el.toggle.addEventListener('click', () => saveSettings())`. It is registered after the kit's own
listener, so the class has already flipped when the blob is written, and it is the same write `layout.toggleRack()` (the
B key, the WINDOW row) makes. Probe on this tree (`.tmp/nav14.mjs`, 500 × 844): a click now stores `phoneRack: true`, and
`toggleRack()` stores `false`, then `true`. Gates: settings-probe 0 of 6 red; the boot suite (below).

**B144 · fixed.** The kit's LOOK_SCHEMA accent rows say `wrap: true` (`lab/mir/shell/gui.js:106-107`). The prefs `coerce`
(`lab/mir/core/prefs.js:74`) therefore folded `accentA: 360` to 0. END announced 360, but the knob was re-seated to 0° from
the store. HOME then computed `nv = lo = 0`, saw no change, and left `aria-valuenow` at 360. There were two ways to fix it.
Reading the folded value back would make END announce 0°, which breaks clause (c). Keeping 360 is the other way.
`lab/look.js` already re-ranges one kit row (blur's `max: 30`), and the same expression now gives the accent rows
`wrap: false`, so 360 is clamped into [0, 360] and kept. It renders as 0°: the palette engine wraps the hue
(`accent.js:83`, `wheelColor`). Zero lines added. The look is CSS and the accent engine, so no digest moves (the frame path
is untouched). Probe on this tree (`.tmp/nav10.mjs`, real keys): END reads `now=360 text=360° eye=360°`, HOME reads
`now=0 eye=0°`, RIGHT reads 4°, then HOME reads 0°. That is what 0.4.0 showed. Gates: settings-probe 0 of 6,
`tests/first-run.test.mjs` 12 of 12, `tests/offer` 16 of 16.

**B139 · fixed on λWAVES' panes; the rest is a MIR brief candidate.**

*The cause.* MIR 1.5 changed what FROST · STILL means. `lab/mir/css/skin.css:536-541` makes a REFRACTIVE pane under the
hold "wear the tinted fill for as long as the hold lasts … so STILL differs from ALWAYS". That rule covers `.dev`, `.glass`
and `[data-mir-surface]`, and `:581` does the same for the disconnected body. 1.4.3 (v0.4.0) had no held-fill rule for
refractive. Its hold removed the filter only.

*What was measured.* `.tmp/p139.js` opened every window and the KEYBOARD window, toggled `body.frost-hold`, and compared
every visible element's background in each of the four combinations:

- Light, disconnected: all 18 card bodies went from `rgba(255,255,255,.1)` to `rgba(233,237,241,.86)`. This is B139's
  number.
- Dark, disconnected: the bodies and the three rack buttons went from `rgba(0,0,0,.1)` to `rgba(28,32,38,.84)`.
- Dark, joined: every card went from `rgba(0,0,0,.1)` to `rgba(28,32,38,.84)`. B139 does not measure this case, but it is
  the same regression.
- Light, joined: nothing changed. The C0 twin (`lab/skin.css`, the unlayered light veil) already outranks the held rule.

*The fix.* Two unlayered rules in `lab/skin.css`, beside the C0 twins and on the same pattern (the modulation window is
excluded with `:not(:where(…))`):

- the held disconnected body keeps `var(--surface-veil, var(--frost-veil-light))`;
- in the dark theme, the held `:where(.dev, .glass)` and the held disconnected body keep
  `var(--surface-veil, var(--frost-veil-dark))`.

The dark `.dev, .glass` selector is wrapped in `:where` so that it cannot outrank λWAVES' own surfaces, such as the
KEYBOARD window's `.km-win.glass` .94 tint. It adds no `!important` (the count stays 32), and PLAN §9's default applies:
FROST · STILL is λWAVES' (wave 67).

*The result.* After the fix, `.tmp/p139.js` finds no fill that moves under the hold in any of the four combinations,
KEYBOARD window included. `.tmp/p38.js`, which plays for real, reads `.1` stopped, `.1` playing and `.1` stopped.

*What stays the kit's (MIR brief candidate).* The kit's own surfaces still change paint under the hold. These are the
modulation window's pickers and work bar (`modulation/modhost.css:1032,1496`, `--pane-fill` at `skin.css:549`), its chip
rail (`window/window.css:61`), the help popovers (`skin.css:743`) and islands (`skin.css:581`). λWAVES does not own those,
and C0 left the modulation window's material to the kit. The brief: give an app one lever, a token or a look option, for
a hold that changes the filter only. MIR's own comment at `skin.css:518` already says "STILL changes the blur, not the
paint", which contradicts `:536`.

**B149 (b) · MIR brief candidate.** Two real Tabs start 320 ms FLIP moves on the `.dev` cards. λWAVES' `cycleWindow`
(`lab/rack.js:3854`) prepends the raised card. The kit's `createRackMotion` (`lab/mir/shell/rack.js:210`) watches the DOM
rather than the verbs: a MutationObserver on the racks' membership (`:293`) and on the layout classes (`:288`) runs
`refresh()` (`:241`). That function animates every height change (`:266`) and every move (`:273`) whenever
`live()` (`:213`) is true, which means `motionPolicy() === 'full'` and a positive `--rack-motion`. The kit offers no way to
say "this came from a key":

- `createRack` (`:348`) has no animate or instant option.
- `raise(id)` (`:568`) takes no options and is FLIPped the same way.
- The motion object (`:378`) is not on the API.
- `html[data-motion]` is only a mirror of the global policy: the rack reads `motionPolicy()`.

λWAVES has only two ways in, and neither is an option for this. One is to flip the reader's global motion policy around a
key. The other is an inline `--rack-motion: 0s` on `hosts[0]`, timed to beat the observer's microtask and race the
ResizeObserver. Both depend on kit internals, so neither was taken. The brief: an instant reorder, for example
`rk.raise(id, { instant: true })` or a `rack.quiet(fn)` that adopts the new layout as `previous` without animating. With
that, `cycleWindow` (and the kit's own keyboard `move()`, `:582`, which also animates) can keep MOTION-LAW's "a
keyboard-initiated action is never animated". The verdict stays red, and the law is untouched.

## Pre-existing (not this round's)

B70 and B71 (the 45 × 34 transport buttons on a phone) and B78's BOW labels on the STATE card. All three are red on
v0.4.0-alpha too (`LEGACY-BOOT-REAIM.md` §5).

## The line count

`cat lab/*.js | wc -l` was **27,593** before and is **27,594** after. The one added line is B111's listener. B78 and B144
change lines in place. The bar is 30,000. `lab/skin.css` gains 4 lines (B139: 2 rules and a 2-line comment). No `__LW`
member was renamed or removed.

## Gates

**The boot suite is NOT CONCLUDED: a usage pause interrupted it.** The run (`.tmp/boot-fix1.txt`) was stopped after B63,
with 32 GREEN and 46 RED. The first red was **B16**, with `errs: ["ERR ResizeObserver loop completed with undelivered
notifications." ×2]`. Every row after it that judges `errs === 0` then went red, because the page's error list keeps
growing. This is a cascade from one error, not 46 defects.

B16 was green in the re-aim's `boot-6`, and the cause here is not determined. Another agent's boot suite (ports 8953/5423)
was running on the rig at the same time. None of this round's four changes touches folding or resizing:

- B78 changes one word.
- B111 adds a click listener.
- B144 changes the accent row's wrap.
- B139's CSS applies only under `frost-hold`, and the first-run frost is ALWAYS.

**The exact next step:** re-run the suite ALONE (nothing else on the rig, one browser):
`LW_PORT=8943 GD_PORT=5413 node tests/legacy/boot.browser-test.mjs > .tmp/boot-fix2.txt 2>&1`.
The expected result is B78 (slap half), B111, B139 and B144 green, and B149 plus the pre-existing B70, B71 and B78 (BOW) red.

If B16's ResizeObserver error comes back, run B16's block alone on `7edae5c` and on the tip (the re-aim's `.tmp/chunk.mjs`
in `agent-afd5abd59436c24a7`). That shows whether it is this round or the rig.

| Gate | Result |
|---|---|
| `node tests/pwa.test.mjs --write` | run before each `lab/` commit (sw.js §1 re-hashed) |
| `bash test.sh node` | exit 0, 940 GREEN/PASS, 0 RED/FAIL |
| `node tools/settings-probe.mjs --out .tmp/sp.json` | 0 of 6 scenes red |
| `node tests/first-run.test.mjs` | 0 failing of 12 |
| `node tests/offer.browser-test.mjs` | 16 of 16 |
| `node tests/keyboard-window.browser-test.mjs` | GREEN (8 PASS) |
| THE LOCK | not run: no `lab/field.js`, shader or frame-path change |

## Commands

```
python3 tools/gate/server.py <worktree> 8943            # stopped by pid at the end
LW_PORT=8943 GD_PORT=5413 node .tmp/nav10.mjs            # B144: ACCENT A, real END then HOME
LW_PORT=8943 GD_PORT=5413 node .tmp/nav14.mjs            # B111: who stores phoneRack at 500 × 844
LW_PORT=8943 GD_PORT=5413 node .tmp/probe.mjs .tmp/p139.js   # B139: every fill, held vs not, light/dark × joined/disconnected
LW_PORT=8943 GD_PORT=5413 node .tmp/probe.mjs .tmp/p38.js    # B139: the body fill stopped / playing / stopped
node tests/pwa.test.mjs --write
bash test.sh node
LW_PORT=8943 GD_PORT=5413 node tools/settings-probe.mjs --out .tmp/sp.json
node tests/first-run.test.mjs
LW_PORT=8943 GD_PORT=5413 node tests/offer.browser-test.mjs
LW_PORT=8943 GD_PORT=5413 node tests/keyboard-window.browser-test.mjs
LW_PORT=8943 GD_PORT=5413 node tests/legacy/boot.browser-test.mjs > .tmp/boot-fix1.txt 2>&1
```

The probes in `.tmp/` are the re-aim's (`probe.mjs`, `nav10`, `nav14`, `p38`), copied, plus `p139.js`. `.tmp/` is
git-ignored.
