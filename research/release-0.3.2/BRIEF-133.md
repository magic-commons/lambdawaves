# BRIEF 133 · THE OFFER — a new build is seen, taken quietly when nothing is at stake, and explained when something is

For the builder (Opus 5.5, isolated worktree from `origin/main` = c8facca = v0.3.1-alpha). Written by Fable, 2026-09-26,
from Josh's ask: *"a forcing feature to update to the latest λWAVES … users are getting back on having never noticed an
update … a notification or some kind of 'reader' … Can the offer supersede the settings? It should be separate from it
anyways. Let it sort of be a mini-tutorial pointing where the user must press."*

## 0 · Read first, in this order

1. `CLAUDE.md` — every standing law. Three bear on this wave: **never edit `lab/mir/**`** (`node ~/Documents/MIR/tools/adopt.mjs <your-root> --check` must still say "in step with MIR 1.4.3"); **after any `lab/` edit run `node tests/pwa.test.mjs --write`** (sw.js §1 is a hash list of lab/) and then the suite; **subtract, don't add** — no machinery beyond what this brief names.
2. `lab/sw.js` whole (390 lines), `lab/main.js` whole, `lab/sw-client.js` whole, `lab/badges.js` lines 1–30, `lab/lab.css` line 40 and lines 263–275 (the badge row and `#sheet`).
3. `tests/pwa.test.mjs` §E (≈ lines 450–640: the worker is loaded for real into a stub global and driven) and its closing comment (≈ 845–870). `tests/menubar.browser-test.mjs` lines 1–40 (the gate harness) and line 184 (its UPDATE APP scene, which must keep passing). `tools/gate/gatekit.mjs` `open()` (lines 61–130).
4. `docs/STATE-SCOPES.md` — what a reload keeps: PREFERENCE and WORKSPACE are on the device; PROJECT is only what was saved.

## 1 · The measured facts (why users stay on old builds)

The install layer from wave 56 already finds a new deploy at every launch, precaches it, waits, and tells the page (`LW_SW_WAITING` → `swClient.buildReady`). The offer is then lost in three places:

- **The offer is invisible by default.** The only on-screen offer is the fifth badge (`A NEW BUILD IS READY · RELOAD`) in `#badges`. First-run STATUS TAGS is off (`rack.js:1265`, `value: false`) and `lab.css:40` `body.no-badges #badges { display: none !important; }` hides the row and the offer with it. The second channel is SETTINGS' status line, visible only with SETTINGS open.
- **The check runs only at a navigation.** Nothing calls `registration.update()` except ABOUT › UPDATE APP. A tab left open, or a home-screen app that is switched to but never relaunched, never asks again.
- **One launch behind by design.** The worker never takes itself (THE ONE LAW). The launch during which an update installs runs the old build to its end; the new one is served at the launch after that, and only if every window of the old build was closed in between.

The network is fine: live headers are `public, max-age=0, must-revalidate` with ETags; `sw.js` is 32 759 bytes and answers 304 on a re-check. There is no server code (assets only), so everything here is client side.

## 2 · The law of this wave

**THE ONE LAW STANDS: a build is never swapped under a session that holds work.** Three things change:

1. **The offer is never hidden by a preference.** STATUS TAGS hides the four ψ-badges, not the build offer. The offer is a different kind of thing and gets its own surface (§4).
2. **The reader.** When the page returns to the foreground, it asks the registration to check for a new worker, at most once per 30 minutes. That is the same byte-compare the browser runs at launch. No version file, no polling timer — the precache digest already *is* the version (sw.js anti-pattern 6).
3. **The quiet take.** A session that holds no work takes the build itself, at once, and reloads. "Holds no work" is defined **once**, in `rack.js`, as `untouched(ignorePlaying)` (§3F) and handed to the client as a port. An untouched session that is merely *playing* is offered the build visibly and takes it the next time the page hides. Every other session is offered the build visibly and keeps its work until a press. In the worker, a quiet take refuses when more than one window is in scope, so an untouched tab can never swap the build under a second tab that holds work.

A latent defect to fix on the way: today's `accept()` (a badge press) sends SKIP_WAITING without asking about unsaved work; the `beforeunload` guard then asks *after* the swap, and a "cancel" leaves the page on a controller whose old cache is already collected. `accept()` must ask first, the way `refresh()` does.

## 3 · The build, file by file

**A. `lab/badges.js`** — the fifth badge gets a class of its own: `mk('warn build', '', () => accept())`. Nothing else.

**B. `lab/lab.css`**
- Line 40 becomes `body.no-badges #badges > .badge:not(.build) { display: none !important; }`. (`body.ui-hidden` at line 463 keeps hiding the whole row — that is the user's explicit HIDE THE INTERFACE and it stays.)
- New rules for `#offer`, **modelled on `#sheet`** (lines 269–273): `class="glass"`, `position: absolute`, centred under the badge row (`left: 50%; transform: translateX(-50%); top: 40px`, on `body.phone` `top: 76px`), `width: min(420px, calc(100% - 32px))`, `z-index: var(--z-veil)`, the same padding, radius, font, size, line-height and ink tokens as `#sheet`; `h3` as `#sheet h3`; `b` as `#sheet b`; a caret at the top centre pointing up at the badge row (a rotated 10 px square in the pane's own background, `::before`); a `.offer-row` flex row for the two buttons with `gap: var(--sp-2)`. **No new colours, no new material, no animation, no transition** — the pane is the existing glass with the sheet's typography. Read `refreshOcclusion()` in `rack.js` and treat `#offer` exactly as `#sheet` is treated there (if the sheet is masked, mask the pane; if not, not).

**C. `lab/sw-client.js`** — `createSwClient({ buildBadge, setStatus, getProjects, untouched, host })`, where `host` is the element the pane is appended to (the badge row's parent, `#stage`). Keep every existing field and method; change and add exactly this:
- `state`: `idle → ready (a build is waiting) → taking | replaced | refreshing | failed`, as now. Add `checks: 0` (the reader's count) and `offered: null` (the build digest the pane was shown for).
- `buildReady(take)`: stores `take`, sets `state = 'ready'`, then decides:
  - `untouched(false)` → `accept({ quiet: true })` and return `true` (badge says `TAKING THE NEW BUILD…`; no pane).
  - `untouched(true)` (untouched but playing) → `offer()` **and** arm a one-shot `visibilitychange` listener that, when `document.visibilityState === 'hidden'` and `untouched(true)` still holds and `state === 'ready'`, calls `accept({ quiet: true })`.
  - otherwise → `offer()`.
- `offer()`: badge `A NEW BUILD IS READY · RELOAD` + status (as `say()` does today) **and** the pane, built once (`el` from `./mir/kit.js`, `trig` for the buttons) and reused; shown at most once per waiting build (`offered = pending && pending.build`); `LATER` hides the pane and leaves the badge; `TAKE IT` calls `accept()`.
- `accept(opt)`: if `state !== 'ready' || !take` return false. **If `getProjects().dirty`**: for a quiet take return false (this cannot happen — `untouched` includes `!dirty` — but the guard stays); for a press, `window.confirm('UPDATE APP WITHOUT SAVING?\nYour unsaved project changes will be lost.')` and on yes `markClean()`, on no return false. Then `asked = true; state = 'taking'; say('TAKING THE NEW BUILD…', …)`, hide the pane, `take(opt && opt.quiet ? { alone: true } : {})`.
- `message(d)`: add `LW_SW_BUSY` → the quiet take was refused because another window is open: `asked = false; state = 'ready'; offer(); return 'busy'`.
- `refresh()` unchanged except it hides the pane when it takes.
- Texts, exact (uppercase words are the lab's own voice; `b` for the emphasised words):

  ```
  h3  A NEW BUILD IS READY
  p   A newer λWAVES is installed and waiting. Press <b>TAKE IT</b> — or the badge above — to reload into it. It takes a few seconds.
  p   <b>KEPT:</b> saved projects, settings, keys, the notebook. <b>LOST:</b> unsaved changes and the undo list — save first.
  p   <b>LATER</b> keeps the badge; ABOUT › UPDATE APP works any time.
  buttons  TAKE IT · LATER
  ```

  The pane is `role="region" aria-label="a new build is ready"` — **not** a live region (wave 62 allows at most three and they are spoken for). `id="offer"`, `hidden` when not shown.

**D. `lab/main.js`**
- `arm(w)`: `sw.buildReady((opt) => w.postMessage(opt && opt.alone ? { type: 'LW_SW_SKIP_WAITING', alone: true } : { type: 'LW_SW_SKIP_WAITING' }))`.
- The `message` listener: `const kind = sw.message(ev.data); if (kind !== 'waiting') return;` — `busy` is handled inside `sw.message`.
- **The reader**, after `register()` resolves: `let checked = performance.now(); document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible' || performance.now() - checked < 30 * 60e3) return; checked = performance.now(); sw.checks++; reg.update().catch(() => {}); });`. Say in the comment why 30 minutes (a returning user gets the check once; a user flipping tabs does not fetch 33 KB each time) and why there is no timer (a hidden page must not touch the network; the visible moment is the one that matters).
- Reword the ONE LAW paragraph in this file's header: the worker never takes itself; the page may take it **for an untouched session** (rack.js `untouched`), and otherwise only on a press.

**E. `lab/sw.js`**
- The `message` handler: `if (d.type === 'LW_SW_SKIP_WAITING') { const p = takeover(event, d); if (event.waitUntil) p.then && event.waitUntil(p); return; }` (the pwa harness calls the handler with no `waitUntil` — keep it optional).
- Below the listener (so the suite's "skipWaiting is not reachable outside the message handler" check keeps passing — it inspects the source *before* `addEventListener('message'`), and with **exactly one** `self.skipWaiting()` in the file:

  ```js
  /* A QUIET TAKE (page: an untouched session) asks with `alone: true` and is refused when another window is in scope —
     skipWaiting() re-points every client, and the second window may hold work.  A PRESS never asks; the user said yes. */
  async function takeover(event, d) {
    if (d.alone) {
      const windows = (await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })).length;
      if (windows > 1) { if (event.source && event.source.postMessage) event.source.postMessage({ type: 'LW_SW_BUSY', windows }); return; }
    }
    self.skipWaiting();
  }
  ```

  The press path must stay synchronous up to `self.skipWaiting()` (no `await` is reached when `d.alone` is false), because E5 asserts `SW.skip === 1` right after the call.
- Header: the ONE LAW paragraph's last sentence becomes "…The UI is told a build is ready (§5); an untouched session takes it (main.js, rack.js `untouched`), and any other session's USER decides." §6's table gains `LW_SW_BUSY` and the `alone` flag. Keep anti-pattern 6 intact: no version anywhere.
- Then `node tests/pwa.test.mjs --write`.

**F. `lab/rack.js`** (≈ line 2965) — hand two more ports to `createSwClient`:

```js
untouched: (ignorePlaying) => {
  /* THE QUIET TAKE'S ONE DEFINITION (wave 133): the session shows exactly what a fresh boot — or the same link — would show,
     so a reload loses nothing.  The ring holds only its origin row and that origin is `boot` or `link` (an `open · …` or
     `new project` origin is a scene a reload would not bring back: there is no reopen-last-project at boot); nothing is pending
     or held; no unsaved work; no gesture in flight; the photosensitivity notice is not up; nothing is being typed; and, unless
     the caller says playing is fine, the transport is paused. */
  const rows = history ? history.entries() : [];
  return rows.length === 1 && !history.canUndo && !history.pendingLabel && !history.holding
    && (rows[0].label === 'boot' || rows[0].label === 'link')
    && !(layout.projects && layout.projects.dirty) && !pointerHeld
    && !(warning && warning.needed && warning.needed())
    && !(document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))
    && (ignorePlaying || !clock.playing);
},
host: dom.badges.parentElement,
```

`history`, `layout`, `warning` and `pointerHeld` are all in `boot()`'s scope and assigned before any `buildReady` can fire (register is deferred ≥ 1.5 s after load) — read the surrounding code to confirm the names and the bottom-row labels (`history.clear(name)` writes `boot` / `link` / `open · <name>` / `new project`), and adjust if a name differs. Use the labels the ring actually writes.

**G. Tests**
- `tests/pwa.test.mjs`: after E5 add **E5b**: (i) `{ type: 'LW_SW_SKIP_WAITING', alone: true }` with the stub's one window → `skip` rises by one; (ii) replace `self_.clients.matchAll` with one returning two windows, a `source` with a `postMessage` sink → `skip` unchanged and `LW_SW_BUSY { windows: 2 }` posted to the source (await the returned promise; the handler returns it through `waitUntil` when present — pass a `waitUntil` that captures it). Keep the "exactly one skipWaiting()" and "not reachable before the message handler" asserts green. Update the closing comment's prose to name the quiet take and the one-window rule. Update the PASS line.
- **New `tests/offer.browser-test.mjs`** on the gate harness (`open(\`https://127.0.0.1:${LW_PORT}/lab/?preset=1s%2B2pz\`)`, wait for `__LW.ready`). The page runs in automation mode (no real worker), so drive `__LW.sw` directly and replace `__LW.sw.reload` with a counter, as the menubar suite does. Judge each scene by the act it names:
  1. **Untouched boot takes quietly.** `__LW.sw.buildReady((opt) => { window.__taken = opt; })` → returns `true`, `__taken.alone === true`, `state === 'taking'`, `#offer` absent or hidden, badge text `TAKING THE NEW BUILD…`.
  2. **Busy → offered.** `__LW.sw.message({ type: 'LW_SW_BUSY', windows: 2 })` → `state === 'ready'`, `#offer` visible; `document.body.classList.contains('no-badges')` is `true` (first-run default) **and** `getComputedStyle(buildBadge).display !== 'none'` while each of the other four badges reads `display: none`; **hit-test** (the glass law): `document.elementFromPoint` at the centre of TAKE IT is that button (or inside it), at the centre of LATER that button, at the centre of the build badge the badge.
  3. **LATER keeps the badge.** Press LATER → `#offer` hidden, badge still visible and reads `A NEW BUILD IS READY · RELOAD`. Press the badge → take called with no `alone`, `state === 'taking'`.
  4. **A touched session is offered, never taken.** Reset `__LW.sw.state = 'idle'`; make an edit (`__LW.loadPreset('2pz')` or a rate set — anything that makes a history row; confirm `__LW.history.depth > 0` or `entries().length > 1`); `buildReady(take)` → `true`, take **not** called, `#offer` visible.
  5. **A dirty project asks first.** With the session dirty (`__LW.projects.dirty === true`), `window.confirm = () => false` → TAKE IT does nothing (`take` not called, state still `ready`); `window.confirm = () => true` → take called, `__LW.projects.dirty === false`. Restore `window.confirm`.
  6. **Untouched but playing: offered now, taken on hide.** Fresh page (a second `open()`, or reload the same and re-await ready): `__LW.play()`; `buildReady(take)` → `true`, not taken, `#offer` visible; then make the page hidden (`Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })`, dispatch `visibilitychange`) → take called with `alone: true`; restore the property (delete it) and dispatch again.
  7. **STATUS TAGS on and off.** `document.body.classList.remove('no-badges')` → all five badges display (the four ψ-badges as before); add it back → only the build badge.
  Print one `PASS …` line per scene naming the measured thing, and a final count.
- `tests/menubar.browser-test.mjs` line 184 (UPDATE APP) must still pass unchanged.

**H. Documents**
- `DEPLOY.md` ≈ line 170: "It works from the **second** launch, never the first … not a bug to chase" → say what is now true: a build that finishes installing while the session is untouched is taken at once (one reload); otherwise the offer is shown and the next full launch serves the new build.
- `docs/NOTES-FOR-AGENTS.md` ≈ line 134: "changes build only through ABOUT → UPDATE APP" → "changes build through the offer (the build badge and its pane, never hidden by STATUS TAGS), a quiet take for an untouched session (`rack.js` `untouched`), or ABOUT › UPDATE APP; `?sw=0` declines…".
- `CLAUDE.md`, first-run paragraph: one sentence — "STATUS TAGS off hides the four ψ-badges, never the build offer; an untouched session takes a waiting build itself (`lab/sw-client.js`, `rack.js` `untouched`), any other session only on a press."
- `REPORT.md`: a `### wave 133:` entry under a new `## 2026-09-26 · 0.3.2` heading, in the report's voice, with the three measured facts, what was built, the numbers you measured (§5), and the edges you found.
- No CHANGELOG edit (generated at release).

## 4 · The pane, said once more so it cannot drift

It is a **mini-tutorial**, in Josh's word: it points at the thing to press (the caret and "the badge above"), says what the press does ("reload into it … a few seconds"), what is kept and what is lost, and where the same act lives later (LATER keeps the badge; ABOUT › UPDATE APP). It is glass, the sheet's typography, two kit triggers. It is shown once per waiting build and never for a quiet take. It never blocks anything: the field, the racks and the menus keep working under it.

## 5 · Proof, in this order

1. `node tests/pwa.test.mjs --write` after the last `lab/` edit, then `bash test.sh node` — every suite green (≈ 843 GREEN lines before this wave; report the count after).
2. `node ~/Documents/MIR/tools/adopt.mjs <your-worktree> --check` → "in step with MIR 1.4.3".
3. Browser, on **your own** gate server — other sessions hold 8711, 8721, 8723, 8766, 8792, 8796: `LW_CERTS=/home/joshua-hosain/Documents/LAMBDAWAVES/.certs python3 tools/gate/server.py <your-worktree> 8731 &`, then one suite at a time with `LW_PORT=8731 GD_PORT=5231 node tests/<suite>`: `offer`, `menubar`, `history`, `current`, `frame-occlusion`, `render-regressions`, `new-project`. The RTX is shared (load ≈ 5 while you read this); a timing flake in `current` (valuesReveal / followsPalette / a ResizeObserver message) is rerun solo before it is called red.
4. Measure and write down: the quiet take's latency from `buildReady` to the reload seam (ms); the pane's build+paint cost (`performance.now()` around `offer()`); the reader's request (`curl -sI https://lambdawaves.magic-commons.com/sw.js` → Content-Length / ETag; and that a conditional GET answers 304); the badge row's rule change is the **only** stylesheet move besides the new `#offer` rules.
5. Commit on your worktree branch with a message in the repo's voice (see `git log --oneline -20`), ending with the attribution lines the session reminder gives you. Copy this brief into your tree as `research/release-0.3.2/BRIEF-133.md` and commit it with the work. Do not push, merge, tag or touch any branch but your own.

## 6 · Don'ts

No `version.json`; no network timer; no second `skipWaiting()` path; no `clients.claim()`; no new colours, materials or animation; no edits under `lab/mir/**` or `lab/fonts/**`; no diagnostics in `lab/` (they live in `tools/`); no `pkill -f`; no git aimed outside your worktree; no unrelated test edits; and **never** reload a session that is not untouched except by a press.

## 7 · Report back

Branch and commit; every file touched; the numbers from §5; each suite's PASS/FAIL lines; and anything in this brief that turned out wrong when you read the code — say so plainly rather than building around it.
