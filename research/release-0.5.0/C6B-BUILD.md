# C6b · THE SESSION, THE OPENER, THE KIT'S NOTICE, THE BANNER, THE VEIL AND THE WAKE LOCK — build hand-off (2026-10-09, the C6b builder, Opus 5.5)

**In ten lines.** BRIEF-C6 §4 commit 3 is built. A cold start opens on the kit's photosensitivity notice, behind λWAVES' own law:
a human reads it once per browser, no query string silences it, and only a test driver skips it. Then MIR's title screen opens:
the six demos as covers (stills the app made of itself), NEW, and RESUME. RESUME is `lambdawaves.q0.session`, MIR's
`createSession` over the one part, fed by the part's new `subscribe`. The boot runs behind the screen and waits for the choice
before `LW.ready`; the notice never holds `LW.ready`. The banner is MIR's (`installBanner({ errors: false })`), the veil is MIR's
`bootVeil`, and the wake lock follows THE play. `#warnPane`, `#banner`, `showBanner`, the 50-line `warning` object and their CSS
are gone. `serialize()` is byte-identical (11/11). The NEW `opener` suite is 7/7, `offer` 16/16, THE LOCK 860 · 0/0 and 1004 · 0/0.
`lab/*.js` went **27,515 → 27,553 (+38)**, against the brief's ≈ +20. No blocker of mine; one for the integrator: `__LW.thumbnail()`
throws on `011e6a5` (C7 removed `capture.probe`). Nothing is pushed or merged.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a47a6c9aeef569dc6` |
| branch | `worktree-agent-a47a6c9aeef569dc6`, reset to `011e6a5` (`yan-c` + BRIEF-C6B.md) |
| `e7256ae` | commit 1 · the session over the one part |
| `ba6f279` | commit 2 · the opener, the covers and the notice facade |
| `1989f3d` | commit 3 · the banner, the veil and the wake lock (and the legacy re-aim): **the final code tip, THE LOCK ran here** |
| commit 4 | lines, wave 209, this file |
| hand-offs | `C6B-HANDOFF.md` after every commit |
| gate servers | 8923 (this tree) and 8927 (`.tmp/base` = `git archive 011e6a5 lab tools tests`), GD 5393 / 5397. Both were started by me and stopped by pid |

## What Josh will see or feel

- **A first visit:** the photosensitivity notice comes first. It is the kit's glass pane with the λWAVES orbital caution sign, the
  same words and CONTINUE, over a black veil until the field has drawn. Then a black title screen opens: λWAVES, six tall 9 : 16
  covers in two rows of three (WAVE DANCER, WATER, BENZENE, N₂, H₂ σu, HELIUM), and a NEW pill. The covers grow and tilt toward the
  pointer and take its light, and the arrow keys walk them. A pick grows the chosen cover and fades into the lab.
- **Coming back:** no notice. The title screen now has **RESUME**, which puts back exactly the work that was on screen: the
  notebook, the modulation, the camera, the palette. It is kept a third of a second after each change and at once when the tab
  closes.
- **A reload** of a tab where nothing was made since NEW goes straight into the lab. A reload after an edit shows the title
  screen with RESUME, so nothing is thrown away.
- **A link, a `?preset=`, a `?view=`** go straight in, after the notice for a first-time visitor.
- **A GPU or boot failure** shows on the kit's maroon banner, with ⛔ (a failure) or ⚠︎ (WebGPU unavailable) before λWAVES' words.
- **On an iPad,** the screen stays awake while the transport plays.

## The decisions (the brief's rulings built; the calls where it was silent)

- **THE PHOTOSENSITIVITY LAW** (finding 3) is λWAVES'. `main.js`' `warning` facade decides with λWAVES' `needed()`: a driver skips
  unless `?warn=1`, and a human is asked unless `warned`. It then calls the kit's `photosensitivityNotice({ force: true, storage,
  key: 'warned', art })`. Its seen-flag is the blob's `warned`, through a Storage-shaped adapter over `createSettingsStore()`
  (finding 4). FORGET clears it, `reset()` writes `warned: false` as before, and `saveSettings` still carries it. The kit's
  `?warn=0` is never honoured: the opener is started with `warn: false, search: '', webdriver: false`, so its switches never run.
- **`__LW.warning` keeps all eight members** (finding 5). `show()` joins the kit's showing promise. `dismiss()` puts the facade
  down synchronously (`open` false, `warned` written, the `onAccept` queue run), then presses the kit's CONTINUE, retrying for up to
  2 s while the dialog module loads. The kit's notice cannot be closed from code.
- **`LW.ready` never waits for the notice** (finding 6). A given choice (`?starter=`, a driver, a link, `?preset=` / `?view=`)
  resolves at once. Only the human title-screen road waits, and there the notice comes first. `&starter=home` went into the CDP
  tools: `hit-probe-set`, `perf/main-thread`, `perf/bench-chromium`, `perf/orbital-dispatch` and `perf/s4c-kernel`. The
  gatekit tools (`digest-lock`, `film-probe`, `s4c-c60-app`, `serialize-bytes`, `settings-probe`) are driven, so they get neither.
- **`?opener=1`** (finding 7) makes a driven start a human one: the notice when not `warned`, then the screen. It can only add a
  notice, never remove one.
- **The remembered `home`** (finding 9). *Call:* rack.js writes it to `sessionStorage` on `pagehide` only while `untouched(true)`.
  The brief's literal "remember `home`" would let a reload after an edit re-pick NEW and forget the session. This way a reload of an
  untouched NEW (the quiet take's own reload) skips the screen, and a reload after work shows RESUME. `untouched` keeps its body: it
  was hoisted from the `createSwClient` call into a named `const`, and its comment now names `resume` beside `open · …`.
- **The part's `subscribe`** (finding 8) is `projects.changed`, posted once a frame (`frame-coalescer.js`). The boot tail feeds it
  from `history.subscribe` and `#notebook`'s `input`. *Call:* a frame, not a 300 ms quiet window. With the window, the session's
  save (part window + the kit's own 300 ms) landed inside `history`'s "0 edit-scope reads in 5 s of play" law and turned it red.
- **The keys** (finding 10). The notice's keys are the kit dialog's own trap: a document-capture stop for outside targets, and a
  root stop for inside ones. *Call:* for the title screen, a stop on `document` in the BUBBLE phase, from the start of the human road
  to the pick. A capture stop would also have taken the covers' own arrow keys. The kit's key table listens on the window, after it.
- **RESUME** is `projects.resume(session)`: the kit's `session.resume()` runs the part's own restore (`restore(data, { project: true
  })` and the notebook), then `port.opened('resume')` (the notebook law, the ring's origin). Nothing is current, and the resumed
  work stays unsaved until a SAVE.
- **The covers** (finding 12) are `tools/make-covers.mjs`, committed as a one-command regeneration. Each demo is opened by
  `?starter=<file>` on the dark theme, solved, paused, then `capture.picture({ width: 540, height: 960, caption: '' })` re-encoded as
  JPEG 0.82: six files, 107 KB. *Calls:* no per-cover `accent` (the kit's default glow), and the logo is the string `'λWAVES'`
  (the kit's text logo). Both are design calls left to Josh.
- **The sign** (finding 13) is the old SVG composite (clip + luminance mask over `warning-orbital.png`), rendered once to
  `lab/img/warning-sign.png` (480 × 424, 68 KB) by a `.tmp` script. It replaces the 160 KB source, which was used only by `#warnPane`.
- **The banner** (finding 11): `installBanner({ errors: false })` in main.js is handed to boot as `dom.banner`. `GPU error` and `the
  GPU device was lost` call `fail` (⛔), `WebGPU unavailable` calls `warn` (⚠︎), and `boot failed` (main.js) calls `fail`. The kit wires
  its own ×.
- **The veil**: `bootVeil({ ready: () => __LW.stats.presents > 0 })` from main.js, in `#stage`. It is not a window, so it is never in
  the mask (`frame-occlusion` 7/7). *Call:* the kit's black fill on λWAVES' light theme, left as the kit's.
- **The wake lock**: `installWakeLock({ clock: appPlay })` at the boot tail. It moves on THE play's edges, a hold or visibility. No timer.
- **The notebook stays page 0.** The session carries it inside the one part.

## What left and what came

| | lines |
|---|---|
| `lab/rack.js`: the `warning` IIFE (50), `showBanner` + its comment (10), `armAutoplay()`'s early call; came: the choice, the pagehide `home`, the session's feed, the wake lock, `untouched` hoisted, `LW.session` | **4,951 → 4,906 (−45)** |
| `lab/main.js`: the facade, the start, the opener, the banner, the veil; left: the old banner's × wiring | **122 → 178 (+56)** |
| `lab/projects.js`: the part's `subscribe` (`changed`), `resume(session)` | **271 → 283 (+12)** |
| `lab/settings-store.js`: one FAMILIES row (`lambdawaves.q0.session`, PROJECT) | **+1** |
| `lab/sw.js` (the kit modules now reached: opener, flash-guard, dialog, banner, boot, busy, clipboard, wakelock …; the covers; the sign) | **+14** |
| `lab/index.html` `#warnPane` (24) + `#banner` (4); `lab/lab.css` `#warnPane` (30) + `#banner` (18) | not in the ledger; 4 of the 37 unlayered `!important`s left with `#warnPane` (33 now) |
| `lab/img/warning-orbital.png` (160,100 B) → `lab/img/warning-sign.png` (68,053 B); `lab/demos/covers/*.jpg` (6, 107 KB) | precache 303 → 316 files, 6.24 → 6.32 MiB |
| `tests/opener.browser-test.mjs` (NEW), `tools/make-covers.mjs` (NEW) | — |

**What stayed, named:** `__LW.warning` (all eight members), `armAutoplay`, `MOTION.autoplay`'s words, `untouched` (its body),
`SHOW THE WARNING AGAIN`, the blob's `warned`, the banner's words, `gpuRecovery`, `LW.ready`'s place.

## Tests (8923 / 5393, one browser at a time, `wait-gpu` before each)

| suite | result | on |
|---|---|---|
| NEW `opener` | **7/7** (the notice first; the screen; NEW; a reload after NEW; RESUME; a cover; the law) | c2, c3 |
| `offer` | **16/16** (s9 and the link scenes) | c1, c2, c3 |
| `history` | **44/44** | c1 |
| `new-project` | **8/8** + `tools/new-project.mjs --check` in step (16,117 B) | c1 |
| `tools/settings-probe.mjs` | **0 of 6 RED** (`lambdawaves.q0.session` PROJECT) | c1 |
| `tools/serialize-bytes.mjs` | **11/11 identical**, base (8927) vs tree, 22 shas | c1 |
| `first-run` · `stage-text` · `film-handover` | **12** · **4/4** · **4/4** | c2 |
| `hit-probe-set` (CDP Chromium, the notice up and dismissed) | **49 presses, 0 reached** | c2 |
| `frame-occlusion` · `menubar` · `take-in-bugs` | **7/7** · **8** · **4/4** | c3 |
| `gpu-recovery` | **8/11**: it stops at its thumbnail probe, as on the base (below); the recovery scene alone is green: `⛔ the GPU device was lost`, `role="alert"` | c3 |
| THE LOCK | `--check --query gastab=0` **860 · 0/0**; plus `--fixture …/digest-lock-s4a.json` **1004 · 0/0** | c3 |
| `legacy/boot` | **112 verdicts identical to the base** (B1–B96, the same reds); both stop at wave 56's `?sw=1` reload | c3 |
| `pwa --write` / `pwa` | 316 files, 6.32 MiB (≤ 8 MiB) | c3 |
| `bash test.sh node` | **79 suites, 0 red** (as at launch) | c1, c2, c3 |

- **Re-run alone:** `gpu-recovery`'s first run stopped at boot cycle 2 ("Render did not settle: animation frames stopped", the
  headless frame stall the base legacy run also hit). Green past it alone. THE LOCK's fixture run read `quarkonium@128`
  unrepeatable within the run beside another browser (the P5 one-ulp fault). Green alone.
- **`legacy/boot`, re-aimed where C6b moved what it reads:** B1 (`#mir-banner`), B63 (the notice: words, `alertdialog`, the
  sign's `src`; the old pane's ink and frost are the kit's now and are not judged), B81 (the cutout, now in the sign's own pixels:
  stroke, dot and outside α 0, the triangle α 255), B103 and B110 (the kit's CONTINUE), B109 (the kit banner, through its own module),
  B112 (`show(); dismiss()`), B125 (the kit's trap). Before the re-aim, B63 threw with the kit's notice left open, its press guard
  swallowed B67's drag, and B81 crashed the run. After it, the verdicts match the base case for case. **Reds outside C6b, named:**
  both runs stop at wave 56's `navTo('?sw=1')`, "Reload failed: Render did not settle: animation frames stopped". The worker's
  precache competes with the boot, so B97–B166 are reached on neither.
  - A copy that steps over that page (`.tmp/legacy/boot-tail*.mjs`, not committed) runs to **135 verdicts, identical on base and
    tree**. Both then stop at wave 61's touch grip (`w61set.grip` undefined, a removed element).
  - Among those, B103, B110 and B112 are red on both for laws outside C6b, and their notice clauses read the same on both:
    - B103: the notice holds the play and CONTINUE starts it; the red is the reduced-motion page (`titled`, `handPlays`);
    - B110: `#hint` is gone;
    - B112: the acceptance survives five writers and `?warn=0` asks a human; the red is the `motionGated` source line.
  - B109 meets the same held frames on both (`__LW.settle()`: "Render did not settle"). Run alone on a fresh page
    (`.tmp/b109-alone.mjs`) it is **GREEN** on the kit banner: 13.69 : 1 on both themes, the × 26 × 26 and topmost, `role="alert"`.
  - B125's trap clause run alone (`.tmp/b125-alone.mjs`) is **GREEN**: Tab stays in the kit's notice, Escape leaves it up, CONTINUE
    puts it down.
  - *Found while re-aiming:* `import('./mir/shell/banner.js')` from a geckodriver script can be a second module instance that builds
    its own pane. B109 takes the pane holding its message and removes a second one.
- **`gpu-recovery`, the red outside C6b:** `__LW.thumbnail()` calls `capApi.capture.probe()`, which C7 removed (`33d20cc`: "the old
  capture road leaves — … the probe …"). It throws `c.probe is not a function` on base and tree alike, so FOLDERS' pictures fail
  silently on `011e6a5`, and the suite's thumbnail scenes (9–10) and the recovery scene after them (11) never run in the suite.

## Lines

`cat lab/*.js | wc -l`: **27,515 → 27,530 (c1) → 27,554 (c2) → 27,553 (c3) = +38**. C6-BUILD estimated step 3 at ≈ +65 for the session
and opener against ≈ −45 for the banner and warning. The brief said ≈ +20. Where it went:
- main.js +56: the facade is 16 lines (the old object was 50), the start is 12, and the rest is the law's comment and the imports;
- sw.js +14: the newly reached kit modules and the seven images;
- projects.js +12.

rack.js gave back 45. The 78 lines of HTML and CSS that left are not counted.

## Brief candidates for MIR

1. **The opener's notice under the app's law.** `openerSwitches` lets `?warn=0` skip the notice for any browser. λWAVES needs it
   gated on the driver. An `honour: { warn0: false }` option, or `needed()` handed in, would let the opener run its own notice.
2. **`photosensitivityNotice` returns only a promise.** Return `{ result, close }` (or export `dismissFlashNotice()`), so an app's
   facade need not press the button.
3. **The opener's keys.** Keys pressed on the title screen reach the app's window-level key table (Space plays). Stop them at the
   root, as the dialog does ("keys stay inside").
4. **The opener's text logo** is an unstyled `div`. A wordmark slot (or the app's `#title` cloned without its button) would help.
5. **`bootVeil`'s timeout rides `requestAnimationFrame`.** A page whose frames are held keeps the veil past its 8 s. A timer for the
   timeout would fix it.
6. **The veil's fill** is black whatever the app's ground is (λWAVES ships light).
7. **The session's `hold`** for a film. BASINS holds the session while a film renders; λWAVES has no hold yet (C7b's recorder).
8. **The cover entrance** (.6 s plus a stagger, an opacity animation) can stall while the app's pipelines compile behind the
   screen (headless Firefox, measured). A pick before it ends is fine; a hit test is not.

## Open items (λWAVES)

- **`__LW.thumbnail()` throws on `011e6a5`** (see Tests). This is for the integrator or C7b: `capture.probe` left in C7.
- **A demo opened through the facade reads dirty once its MOLECULES solve lands** (measured on the base too: WATER clean right
  after the open, dirty 2.5 s later). `projectKey()` counts the solve's fill. It is pre-existing (C6), but it makes the beforeunload
  question and FOLDERS' UNSAVED mark appear on an untouched demo.
- The shipped legacy suite never reaches the re-aimed B103–B125 while wave 56's `?sw=1` page stalls. They were exercised by the
  step-over copy and by the two alone-runs (above), none of them committed. The Sonnet re-aim pass the brief names can take over
  from there.
- CLAUDE.md's "The 37 `!important`s stay unlayered" now counts 33.
- **Merge notes (for the merge with C7b):**
  - `rack.js`: line 6 (the `installWakeLock` import, its own line); the FIELD block's three `dom.banner.fail/warn` calls and its
    comment (~483–491; `showBanner` and its comment deleted after them); `untouched` hoisted (~2770–2795, the `createSwClient` call
    now passes `untouched`); `LW.session` at the END of the LW literal; the boot tail: `const warning = dom.start.warning` replaces
    the IIFE, `if (warning.needed()) warning.show()` and the early `armAutoplay()` call are gone, and after `seed()` come the
    session feed, the choice, `armAutoplay()`, `installWakeLock` and the pagehide `home`.
  - `main.js`: the whole head (imports, session, facade, start, banner, veil, the boot call, the notice and the opener). The install
    layer below is untouched but for one comment word.
  - `index.html`: `#banner` (was 141–144) and `#warnPane` (was 149–174) deleted.
  - `settings-store.js`: one FAMILIES row at the end.
  - `projects.js`: the `coalesce` import, the part's `subscribe`, `changed` and `resume` on the api.
  - `lab.css`: the `#banner` and `#warnPane` rules.
  - `lab/sw.js` is the standing conflict: take either side, then `pwa --write`.

## The draft CLAUDE.md paragraph (replaces the first-run paragraph's "STATUS TAGS off hides … any other session only on a press.")

```
THE START (0.5.0 C6b, lab/main.js). THE PHOTOSENSITIVITY LAW is λWAVES', not the kit's: a human visitor reads the
kit's photosensitivity notice once per browser BEFORE anything animates, and NO query string silences it for a human
(the kit's ?warn=0 is not honoured); only a test driver skips it (?warn=1 forces it there). Its seen-flag is the
settings blob's `warned`; __LW.warning keeps show dismiss needed onAccept reset seen remembered open; ?play=1 waits
for it; LW.ready never does. Then MIR's title screen: the six demos as covers (lab/demos/covers, tools/make-covers.mjs),
NEW and RESUME (`lambdawaves.q0.session`, MIR's createSession over the one part, PROJECT). The boot runs behind it and
awaits the choice. A driver, a link, ?preset= or ?view= skip it (?starter= or the boot); ?opener=1 shows it under a
driver (tests/opener.browser-test.mjs); CDP tools add &starter=home. STATUS TAGS off hides the four ψ-badges, never the
build offer; an untouched session (ring origin boot/link) takes a waiting build itself (lab/sw-client.js, rack.js
`untouched`) and its reload skips the title screen; RESUME and a cover are offered it, any other session only on a press.
The banner is MIR's installBanner, the veil MIR's bootVeil, and the wake lock follows THE play.
```

## For `research/release-0.5.0/CHANGES-0.5.0.md` (one line; the file does not exist on `011e6a5`, so it is not created here)

> λWAVES opens on a title screen now: the photosensitivity notice first (once per browser), then the six demos as covers, NEW,
> and RESUME, which brings back exactly what you were working on.

## Exact next step

The integrator merges `worktree-agent-a47a6c9aeef569dc6` (from its tip) beside C7b, then runs `node tests/pwa.test.mjs --write`,
`bash test.sh node`, `opener`, `offer`, `history`, `gpu-recovery`, `frame-occlusion` and THE LOCK. Then the thumbnail
(`capture.probe`) is fixed in its owner's row.
