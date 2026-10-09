# BRIEF · C6b — THE SESSION, THE OPENER, THE KIT'S NOTICE, THE BANNER, THE VEIL AND THE WAKE LOCK ARE THE KIT'S

Written by the integrator (Claude Yan) on `5518182` (`yan-c` = `sos-s0`: C0 C1 C2 C3 C4 C5 C6 C7 C9 + D9 + D9b merged; `lab/*.js` 27,515),
2026-10-09 07:30 CDT. This is BRIEF-C6 §4 **commit 3**, which C6 (`e0621f8`) did not build; C6-BUILD.md "Open items" names it and "Exact next
step" 2 spells it out. Sos launched a C6b builder at 06:05 that paused after READING only — its 13 findings are in
`~/.claude/handoffs/agents/a98be3262dbdf60ad.md` (read it first; every finding below carries its number). You start fresh from `5518182`; no
predecessor `.tmp/` exists. The row runs in PARALLEL with C7b (the film's UI → the kit's RENDER card + TIMELINE window), which edits
`rack.js` in the film regions (the CAPTURE group, the three verbs, `loop()`'s PRESENT, the ACTIONS table, `serialize`/`restore`,
`mod-port.js`, `render-exact.js`); stay out of those and name your rack.js sites in the BUILD so the integrator merges clean.

## 1 · The contract (BRIEF-C6 §4 commit 3, verbatim; C6-DESIGN §5; C6-BUILD "Exact next step" 2)

> **The session, the opener, the banner, the veil, the wake lock:** RESUME/NEW on a cold start; `untouched` kept (`offer` 16 green, the s9
> case included); the banner's words and role kept; `tests/legacy/boot.browser-test.mjs` green.

> give the part `subscribe` (the history's onChange and the notebook's input); `createSession({ key: 'lambdawaves.q0.session' })` over the
> one part, plus a FAMILIES row (PROJECT); `createOpener` (the six demos as covers, NEW, RESUME) with the kit's photosensitivity notice —
> the `warning` facade keeps its members, and its seen-flag is the blob's `warned`; `installBanner` (λWAVES' words, `role="alert"`;
> `gpu-recovery` reads the banner), `bootVeil` and `installWakeLock({ clock: appPlay })`. Closers: `offer` 16 (`untouched` kept),
> `tests/legacy/boot.browser-test.mjs`, `gpu-recovery`.

C6-DESIGN §5 is the design you build: `main.js` decides the start (driven = `navigator.webdriver`, a fragment link, `?preset=` / `?view=` →
no opener, choice = `?starter=` or `boot`; otherwise `createOpener({ covers, session, notice, warn, logo: 'λWAVES' }).start()`); the boot runs
BEHIND the opener and awaits the choice before `LW.ready`; covers = the six demos (`lab/demos/*.lambdawaves.json`: benzene, h2-sigma-u,
helium, n2, water, wave-dancer), `home` (NEW) = the shipped boot scene + `session.discard()`, `resume` = `session.resume()` origin `resume`,
a cover = `projects.demo(id)` + `session.discard()`; `sw-client.js` keeps the offer, the quiet take, `getProjects()`, `untouched`.

## 2 · The rulings that bind

- **THE PHOTOSENSITIVITY LAW (rack.js waves 57/59, `armAutoplay`, main.js) is λWAVES', not the kit's** (finding 3): a human visitor
  sees the notice once per browser before anything animates, and NO query string silences it for a human (`?warn=0` is the kit's switch —
  λWAVES does not honour it; only a DRIVEN browser skips). Plan: the facade shows the kit's `photosensitivityNotice` under λWAVES'
  `needed()`, then `opener.start()` with the kit's own warn OFF. The notice comes BEFORE the title screen. `?play=1` still waits for it.
  The acceptance stays in the settings blob's `warned` through a Storage-shaped adapter (finding 4) — no lift, FORGET clears it, a browser
  that accepted is not asked again; `SHOW THE WARNING AGAIN` (rack.js ~1155) keeps working.
- **`__LW.warning` keeps `show dismiss needed onAccept reset seen remembered open`** over the kit's promise (the `__LW` law). The kit's
  notice cannot be closed from code — `dismiss()` presses the dialog's primary button; `show()` joins the module's showing promise
  (finding 5). `LW.ready` must NOT wait for the notice: the CDP Chromium tools (`tools/hit-probe-set.mjs`, `tools/perf/main-thread.mjs`,
  the device report, `digest-lock.mjs`, `film-probe.mjs`) have `webdriver` false and call `__LW.warning.dismiss()` after `__LW.ready`
  (finding 6) — they get `&starter=home` in their URLs so the title screen never shows for them; check every tool and suite that boots
  the page by URL (grep `warning` / `starter` / `webdriver` in `tests/` and `tools/`).
- **Driven browsers get no opener** and the boot starts with `session.arm()`; **`?opener=1` forces the title screen under a driver** for a
  NEW `tests/opener.browser-test.mjs` (finding 7). The CLAUDE.md paragraph you draft must STATE the photosensitivity law — CLAUDE.md has
  no paragraph for it today (finding 1).
- **`untouched` keeps its definition** (one ring row named `boot` or `link`, clean, nothing pending; `offer` s9): a RESUME (`resume`) and a
  cover (`open · NAME`) are OFFERED, never taken; remember `home` in `sessionStorage` so a reload does not show the opener again (finding 9).
  The session never adds a ring row; its autosave is not an edit; it is flushed on `pagehide`. NEW and the boot keep the `boot` origin.
- **The part's `subscribe`** (C6-BUILD open item) = the history's `onChange` + the notebook's `input`, coalesced (finding 8); it feeds the
  session AND FOLDERS' head (shared registry).
- **Keys must not reach the hidden lab while the opener or the notice is up** — a capture-phase stop like the old `offKey` (finding 10).
- **`installBanner({ errors: false })`** so only GPU / boot failures show (finding 11); λWAVES' words and `role="alert"` kept; what leaves:
  `#banner` (index.html 144), `showBanner` (rack.js ~497–500) and its main.js lines, `#warnPane` (index.html 151–174) + the ~50-line
  `warning` object (rack.js ~4870–4921), their CSS. `tests/gpu-recovery` reads the banner — re-aim its selector to the kit's
  (`#mir-banner .mir-banner-title` or what the kit renders; check the `⛔ ` / `⚠︎ ` prefixes).
- **Covers:** 9 : 16 stills the app makes itself through `__LW.captureUI.picture` / `capture.picture({ width, height })` → JPEG (dark theme,
  caption off) → `lab/demos/covers/<file>.jpg`, then `node tests/pwa.test.mjs --write` (finding 12). The maker script lives in `.tmp/`
  (not committed) or `tools/` (committed) — `tools/` if it is a one-command regeneration. The notice's sign is an SVG composite over
  `img/warning-orbital.png`; the kit's art is an `<img>` URL — a composited PNG or a data-URI SVG (finding 13).
- **ONE clock (R-B1):** the wake lock follows THE play — `installWakeLock({ clock: appPlay })` or the kit's actual signature
  (`lab/mir/core/wakelock.js`); no second tick, no `setInterval`.
- **The notebook stays λWAVES' single page = page 0 of the one part** (Sos's ruling on C6's design call 1); the kit's tabbed notebook is a
  0.5.x brief candidate — not here.
- **Scopes:** `lambdawaves.q0.session` is PROJECT (a FAMILIES row + `docs/STATE-SCOPES.md`); the opener's remembered choice is session-only
  (`sessionStorage`), never the blob; `tools/settings-probe.mjs` zero RED; `node tools/new-project.mjs --check` byte-exact (the session must
  not write into the empty project).
- Standing: never edit `lab/mir/**` or `lab/fonts/**`; subtract, don't add (C6-BUILD estimated step 3 ≈ +65 session/opener against ≈ −45
  banner/warning — report the measured number); diagnostics in `tools/`; the glass is Josh's (the opener and the notice wear the kit's
  skin — do not restyle them, and do not repaint λWAVES' glass); one light check per step; verifiers are the integrator's call.

## 3 · Read first

`~/.claude/handoffs/agents/a98be3262dbdf60ad.md` (the 13 findings) · `research/release-0.5.0/C6-DESIGN.md` §5 + §8 · `C6-BUILD.md` ("Open
items", "Exact next step", the merge notes) · `BRIEF-C6.md` §2 + §4 · `PLAN.md` §2 row C6 + §9 (2026-10-09 rulings: defaults) · `CLAUDE.md`
(the scopes paragraph, the PROJECTS paragraph, the first-run paragraph) · `docs/STATE-SCOPES.md` · `lab/main.js` · `lab/sw-client.js` ·
`lab/projects.js` + `lab/project-store.js` · `lab/rack.js` (boot tail: `warning` ~4870–4921, `armAutoplay` ~4932, `LW.ready`; `showBanner`
~485–500; `untouched` ~2779; `SHOW THE WARNING AGAIN` ~1155; the `LW.warning` getter ~4724) · `index.html` (#banner 144, #warnPane 151–174)
· `lab/first-run.js` · the kit: `lab/mir/shell/opener.js`, `shell/flash-guard.js` (the photosensitivity notice), `shell/banner.js`,
`shell/boot.js` (`bootVeil`), `core/session.js`, `core/wakelock.js`, `shell/notice.js` head, `folders/project.js` (the part's
`subscribe`) · the MIR docs at `~/Documents/MIR/.claude/worktrees/mir-1.5/docs/`: `OPENER.md`, `SESSION.md` (§ Preferences against project ·
§ The opener's switches), `FOLDERS.md` (the session lines), `ADOPTING-1.5.md` §§ 7, 9, 13 · the tests you must keep green:
`tests/offer.browser-test.mjs` (s9), `tests/gpu-recovery.browser-test.mjs`, `tests/legacy/boot.browser-test.mjs`,
`tests/first-run.test.mjs`, `tests/stage-text.browser-test.mjs` and `tests/film-handover.browser-test.mjs` (both touch `warning`).

## 4 · Commits, in order (each with `C6B-HANDOFF.md` committed after it)

1. **`0.5.0 C6b · the session over the one part`:** the part's `subscribe`; `createSession({ key: 'lambdawaves.q0.session' })`; the FAMILIES
   row (PROJECT) + STATE-SCOPES; `session.arm()` on a driven or direct boot; flushed on `pagehide`; the autosave is not an edit; `untouched`
   unchanged. Gates: `offer` 16 (s9), `history` 44, `new-project` 8 + `--check`, `settings-probe` 0 RED, `tools/serialize-bytes.mjs` 11/11
   identical against the base copy, node gate.
2. **`0.5.0 C6b · the opener, the covers and the notice facade`:** `main.js` decides the start; `createOpener` with the six covers, NEW,
   RESUME; the kit's `photosensitivityNotice` under λWAVES' `needed()` with the `warned` adapter; the `warning` facade's members kept;
   `#warnPane` + its CSS + the old warning object leave; `armAutoplay` and `?play=1` keep their law; `?opener=1` under a driver; the
   capture-phase key stop; `&starter=home` in every CDP tool URL; the covers in `lab/demos/covers/`. Gates: the NEW
   `tests/opener.browser-test.mjs` (the title screen under `?opener=1`: NEW boots the shipped scene; a cover opens its demo; RESUME offers;
   the notice shows once and `warned` holds; keys do not reach the lab while it is up; a reload after `home` shows no opener), `offer` 16,
   `legacy/boot`, `first-run` 12, `stage-text`, `film-handover` 4/4, `hit-probe-set` 0 reached, `pwa --write` then `pwa` ≤ 8 MiB, node gate.
3. **`0.5.0 C6b · the banner, the veil and the wake lock`:** `installBanner({ errors: false })` with λWAVES' words; `#banner` + `showBanner` +
   their CSS leave; `gpu-recovery` re-aimed; `bootVeil`; `installWakeLock` on THE play. Gates: `gpu-recovery` 11, `offer` 16,
   `frame-occlusion` 7 (the veil and the opener are not windows: never in the mask), `menubar`, `take-in-bugs` 4/4 (the play's edge still
   plays), THE LOCK once on this tip (`LW_PORT=8923 GD_PORT=5393 node tools/perf/digest-lock.mjs --check --query gastab=0` → 860 · 0/0; and
   with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` → 1004 · 0/0), node gate.
4. **`0.5.0 C6b · lines, wave, C6B-BUILD.md`:** `cat lab/*.js | wc -l` before/after; `node tests/pwa.test.mjs --write`; `bash test.sh node`;
   REPORT.md `### wave 209: C6b THE SESSION, THE OPENER, THE NOTICE, THE BANNER, THE VEIL AND THE WAKE LOCK — …` under `## 2026-10-08 ·
   0.5.0 C — THE ADOPTION`; `C6B-BUILD.md` (A7-BUILD.md's shape: the decisions, what left and what stayed named, tests with counts, lines,
   brief candidates, the merge sites in rack.js/main.js/index.html/settings-store.js, what Josh will see or feel — the title screen with six
   covers, the kit's notice, a RESUME offer); the drafted CLAUDE.md paragraph (≤ 12 lines, STATING the photosensitivity law, replacing the
   first-run paragraph's "STATUS TAGS off hides … any other session only on a press" sentences where they move); one line for
   `CHANGES-0.5.0.md` (the opener and the session, in plain words). Final `C6B-HANDOFF.md`.

## 5 · Acceptance

`offer` 16 (s9 — `untouched` kept) · `gpu-recovery` 11 · `legacy/boot` green (if a case is red for a reason outside C6b, name the case and
the reason — a Sonnet re-aim pass follows) · the NEW `opener` suite green · `first-run` 12 · `history` 44 · `new-project` 8 + `--check` ·
`settings-probe` 0 RED · `serialize-bytes` 11/11 identical vs the base · `hit-probe-set` 0 reached · `frame-occlusion` 7 · THE LOCK 860 · 0/0
and 1004 · 0/0 once on the final code tip · `pwa` ≤ 8 MiB · node gate as at launch (name any red that predates you) · the `__LW` law kept
(`__LW.warning` members; `__LW.session` added at the END of the LW literal) · a human first visit: the notice, then the title screen, then the
boot; a driven visit: neither · no edit under `lab/mir/**` · nothing pushed, merged, tagged or deployed.

## 6 · Hand-off and harness

Your worktree: a fresh one; `git reset --hard 5518182` first (your branch is yours alone). Commit `research/release-0.5.0/C6B-HANDOFF.md`
after EVERY commit (worktree · branch · commits · tests with counts · blockers · exact next step). Commit messages start with `0.5.0 C6b · `.
Ports: **8923 / 5393** for your tree, **8927 / 5397** for the base copy (`.tmp/base` = `git archive 5518182 lab tools tests | tar -x -C
.tmp/base`): gate server `python3 tools/gate/server.py <your worktree> 8923` in the background, `LW_PORT=8923 GD_PORT=5393 node
tests/<suite>.browser-test.mjs`, stop by pid, never `pkill -f`. The GPU is shared — one browser suite at a time, 4 s apart, `node
tools/perf/wait-gpu.mjs` before each; a timing red is re-run alone (the RTX 3070's P5 one-ulp fault). The guard refuses compound shell with
variables/loops/heredocs/backticks and any git outside your worktree — plain commands, scripts under `.tmp/`. Do not run suites against
8721 or 8741 (Sos's servers) or 8913/8917 (C7b's). FINAL report (also to the integrator by your return value): worktree · branch · tip ·
commits · tests with counts · lines before/after · blockers · brief candidates for MIR · what Josh will see or feel · the draft CLAUDE.md
paragraph · the rack.js/main.js/index.html sites you edited (for the merge with C7b).
