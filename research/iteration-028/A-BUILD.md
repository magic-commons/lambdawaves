# ITERATION 028 · CHAIN A — THE WORKER · BUILD

Builder: Opus 5.5 (Claude Yan's fleet), 2026-10-30, on its own branch fast-forwarded to `yan-c` @ a9d3b0e9. One commit per row; the
integrator merges. No draw change, no app-literal change, no store change.

## ROWS CLOSED

| row | commit | what changed | its failure's test |
|---|---|---|---|
| R-06 | 85df1263 | `lab/sw.js` §3: each install body is buffered and digested (`crypto.subtle.digest('SHA-256')`); a body whose first 12 hex is not its recorded `rev`, or a `res.redirected` answer, rejects the install; the cache holds a fresh `Response` of exactly the verified bytes (status and headers kept) | pwa E3b: a fake fetch returning wrong bytes for `rack.js`, and a redirected `main.js`, each make the install reject (mutation: with the check removed the row reports "Missing expected rejection") |
| R-08 | b6eb3e3a | CALL 6 default. `lab/sw.js` §4: activate deletes `img/menu/`, `demos/covers/`, `vendor/nist/` keys from `lw-data-v1` (`SWEEP`); `library/<sha>.json`, the `-v1` basis records and `lw-vol-*` stay | pwa E6: a kept `img/menu/` picture is gone after activate, the record is kept (mutation: sweep disabled → the row fails) |
| R-03 | bd8b6004 | `lab/sw.js` §6 `takeover()`: EVERY take counts the windows; with > 1 and no `force: true` the asking page gets `LW_SW_BUSY {windows}`; `force` reaches `skipWaiting()` in the same turn. `lab/sw-client.js`: a refused PRESS re-offers the pane with "n OTHER WINDOW(S) … UPDATE ALL … or close them first" and the button reads UPDATE ALL (sends `force: true`); a refused quiet take is offered as before; a non-asking tab reloads at once when `untouched(false)`, else its badge says "THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD NOW"; ABOUT › UPDATE APP's waiting branch now goes through `accept()` so its refusal is offered the same way. `lab/main.js:127`: the take forwards its options (`{ type, ...opt }`) | pwa E5b: press and quiet take each taken at one window and refused (BUSY, count 2) at two; `force: true` at two taken in the same turn. offer.browser-test scene 11: a clean replaced tab reloads, a touched one is told RELOAD NOW and its badge reloads; a refused press shows the count and UPDATE ALL, and a real press on it takes with `{ force: true }` |

Two files outside the chain's list were touched, each by one road the row needs: `lab/main.js` (one line — the take closure dropped
`force`; and its comment) and `tests/offer.browser-test.mjs` (scene 11's badge words changed and its untouched tab now reloads, so the scene
was rewritten to both arms plus the UPDATE ALL press). Chain B lists main.js as "none expected"; the two hunks do not overlap anything it names.

## THE §0 / COMMENT SENTENCES REWRITTEN

- sw.js header, THE ONE LAW: "…and any other session's USER decides." gains "skipWaiting() re-points EVERY window in scope, not only the
  one that asked, so every take counts the windows and, with a second one open, is refused until the user presses UPDATE ALL — consent
  given for all of them (§6)."
- sw.js §3: "…so neither the HTTP cache nor any proxy in between can hand us yesterday's bytes" → "BUSTED BY CONTENT AND VERIFIED BY
  CONTENT" (the buster alone guarantees nothing on a query-ignoring static host; the body is digested; a wrong prefix or a redirect rejects).
- sw.js §4: "The one exception is the user-driven path in §6, … degrades to 'slower' and never to 'broken'." (false: a mixed build or a 404)
  → the exception is UPDATE ALL pressed with other windows open; what happens to them; why §6 refuses any take without it; the page's road
  for the other windows. Plus THE SWEEP paragraph (R-08) and the section title.
- sw.js §6 protocol table and the `takeover` comment: "A PRESS never asks; the user said yes" → every take counts; `force` is UPDATE ALL.
- sw.js §1b: "(§4 collects only PREFIX caches)" → "…and from DATA_CACHE only SWEEP: the three roots whose names carry no hash"; THE
  PICTURES gain the one-build keep sentence; THE MEASURED LINES "…and swept with the pictures"; NEVER_PRECACHE's DATA row: the pictures,
  covers and lines are kept "until the next build sweeps them".
- sw-client.js header: "A page cannot prevent it; it can refuse to throw the work away…" → the worker refuses any take while a second
  window is open; the non-asking tab reloads when it holds no work and is told RELOAD NOW otherwise. WAVE 133: the quiet take is refused
  "as it refuses a press". main.js's ONE LAW paragraph: likewise.

## LEFT, AND WHY

- **lw-facade is RED on the base, not by this chain**: the page now has `conduct` and `skeletonArgs` the fixture lacks (026's CONDUCTOR
  facade and B2's film-bake work). `__LW.sw` is one member and its kind did not change, so this chain did not re-capture someone else's diff.
  For the integrator: re-capture with `--write` on the row that added those names.
- The badge's own press is still a plain accept (a refused press re-shows the pane with the count); only the pane's UPDATE ALL forces —
  the pane is where the consequence is written.
- `alone: true` is still sent by a quiet take (the page's word; offer and start suites read it); the worker counts it like a press.

## GATES

- `node tests/pwa.test.mjs --write` green (419 files precached; E3b, E5b, E6 rows as above).
- `./test.sh node` exit 0.
- `node tools/rack-deps.mjs --classes --no-write`: HOLDS (persist 24 ≤ 25). No import moved.
- Browser, own server on 9833 (GD 5833), stopped by pid: `offer.browser-test` GREEN 16 of 16; `lw-facade` RED for the pre-existing
  `conduct` / `skeletonArgs` drift above.
