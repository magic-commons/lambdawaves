# ITERATION 028 — STABILITY FINALITY · THE REVIEW

Synthesis of R1 (eight finders, two skeptics per finding) and R1b (Codex's second opinion, seven findings). Tree: `yan-c` at 5cc07920
(v0.9.9-alpha + 374 commits), kit MIR 1.5.6-alpha.17. Written 2026-10-29 from the finders' and skeptics' texts alone; nothing here was
measured anew by the writer. A finding is CONFIRMED when neither skeptic refuted it; REFUTED when the code-reader did; DISPUTED when the
reproducer refuted after the code-reader did not. Where a skeptic let a finding stand but argued its severity down, the row says so.

Counts: 43 findings reached the skeptics (one, the notebook IMG leak, three times; one, the ASK broker, twice). 31 unique CONFIRMED rows
below (0 critical · 3 high · 17 medium · 11 low). 0 DISPUTED by the strict definition. 11 REFUTED (10 unique). Codex: all seven R1b
findings were touched by a finder — five adopted (R1b-01, 03, 04, 05, 07), one narrowed (R1b-06: half adopted, half found sound), one
contested (R1b-02: adopted by dimension 3, refuted as documented design by dimension 8's code-reader). No Codex finding is unverified.

---

## 0 · THE VERDICT

1. Yes — this tree can be cut as 1.0 after the queue below is worked, in the order of its chains. No finding is critical; nothing found
   loses a saved project, corrupts a `.lambdawaves` file, or lets script run from an imported file.
2. The three HIGH rows are bounded and each has a cheap fix with a test of its failure: a SHADER node leaves the stage black after a film
   (R-01); a `null` settings blob locks the boot (R-02); a press in one tab swaps the build under every other tab (R-03).
3. The medium band is one quarter engine (R-04 … R-14) and one quarter paper (R-15 … R-20): the documents that ship beside the lab —
   NOTICE, README, CITATION, CHANGELOG, SECURITY, RELEASING, SHIPPING-READINESS, LEGAL-PROVENANCE — are a month to five cuts stale.
4. Proven sound by gate, re-measured 10-29: THE LOCK 843 · 0 and 987 · 0 (green alone; the one moving leaf is R-22's flake), `rack-deps
   --classes` HOLDS (the `app` literal 30 keys, every namespace < 128, THE HINGE 0 bare writes, persist 24 of 25), 0 app-side circular
   edges, 0 kit→app edges, `state-scopes --check`, `new-project --check`, `mir-manifest` and `adopt --check` in step, `pwa` (no
   skipWaiting on install, no clients.claim, the cache name from the hashes alone), `wiring` reaching every lab file.
5. Proven sound by reading: ONE STORE (34 of 34 storage literals are RECORDS rows), ONE ACTION REGISTRY (91 rows, no act reached by label),
   ONE TIME (`t` written in clock.js alone), the three scopes, the notebook sanitizer against script (KaTeX `trust:false`, inert
   template, allowlists), the `lw:` codec, the project-file road's bounds and rollback, the volumes' sha-256 checks, every localStorage
   write guarded, WebGPU loss and worker faults each with a word, the film's cancel road, the kit's session, prefs, midi, window and
   folders restores repairing rather than throwing.
6. Codex's top five stand in substance; the fleet sharpened each (the press path, the deploy-straddle trigger, the two volume skips, the
   zero-click render on open) and rejected the two halves that did not hold (DATA caches "unbounded"; the broker as a shipped exposure).
7. What the fleet refused: a CSP header (triaged in the 0.5.0 review; a Report-Only meta tag remains the right road), the kit's 37 internal
   cycles, the HINGE pre-split, the diagnostics row, the `__e` cap, a per-window browser loop, the shader-canvas count, the knob repaints,
   the render store's checkpoint — none is a defect in this tree; two are FOR-MIR observations.
8. The one law of 028 stands for the fixes: A FINDING IS VERIFIED BEFORE IT IS FIXED; A FIX HAS ITS FAILURE'S TEST; NO CORNER IS A CORNER
   CASE. Every row below names its test; no row adds a gate.
9. The 1.0 cut needs one decision before the chains run: which of the three written definitions of 1.0 is the law (CALL 1). The rest of
   the calls can default.
10. One operational item is not a code fix and should happen today: a broker from this worktree has listened on 0.0.0.0:9443 since 10-15
    (CALL 2).

---

## 1 · THE RANKED QUEUE

Each row: id · severity · dimension · seat — the claim, the failure, the fix, the test. Codex's hand is named where it was adopted or
dismissed.

### HIGH

**R-01 · HIGH · PERFORMANCE AND STRESS · lab/render-exact.js:712, lab/capture.js:595-602, lab/field.js:2003**
After a film with a SHADER node live, every present fails validation and the stage draws nothing until the tap flips.
`after()` calls `configureCopy(f, canvas, false)`, which re-states the canvas as RENDER_ATTACHMENT only while field.js still holds `tapFn`;
the next `copyTextureToTexture` invalidates the whole command buffer, the field's own pass included. The skeptic found the same hole on
the PICTURE road (capture.js:730/735) — CAPTURE IMAGE with a SHADER node live breaks the stage too. Measured: 58 uncapturederror over 29
presents after a 1-s clip, 0 before, 0 once the node is bypassed. User-visible symptom is black, not frozen; recovery is bypassing every
shader node, changing the gamut, or reloading.
Fix: let the field own its usage — a `reconfigure()`/`tapOn` on createField that configures with `canvasUsage()`, called by configureCopy(false)
or by after(); or `usage: RENDER_ATTACHMENT | (f.tapOn ? COPY_SRC : 0)` in configureCopy. Cover the PICTURE road the same way.
Test: a browser row (film-handover or a short new one) that adds a SHADER node, takes a 1-s clip and a picture, plays N presents and asserts
0 uncapturederror and presents > 0. Codex: not reported.

**R-02 · HIGH (code-reader: medium) · CRASHES AND RECOVERY · lab/settings-store.js:78, lab/rack.js:80, lab/main.js:25**
A settings blob that is the JSON text `null` crashes the boot with no way back from the UI.
`read()` returns whatever JSON.parse gives; `readSettings().nativeLayout` (the first line of boot()) throws, the banner's only action
reloads into the same crash, `warning.needed()` throws a second uncaught TypeError, and FORGET lives in mir-gui.js built at rack.js:868 —
never reached. `[]`, `5`, `"s"`, `true` pass through as non-objects without throwing. The app never writes `null` there; the trigger is a
foreign writer (extension, sync tool, DevTools, tampered restore).
Fix: in read(), `v !== null && typeof v === 'object' && !Array.isArray(v) ? v : {}` — the contract the file's header already states.
Test: one node row — `'null'`, `'[]'`, `'5'` read as `{}`. Codex: not reported.

**R-03 · HIGH (code-reader: medium) · THE UPDATE AND THE CACHE · lab/sw.js:636-642, lab/sw-client.js:134/175/185-190**
A press in one tab swaps the build under every other tab; the §4 "slower, never broken" claim is false.
takeover() counts windows only for the quiet take (`d.alone`); a PRESS or ABOUT › UPDATE APP skips with any number of windows open,
activate deletes the old `lw-lab-*`, and a non-asking tab's later lazy import (chemview.js:551/890/1015/1347, controller.js:232's worker) is
a HIT on the NEW build's cache by pathname (BY_PATH, sw.js:530) — a mixed build — or a 404 where the deploy dropped the path (DEPLOY.md:216-219).
Reproduced in the pwa harness with two workers and two windows: PRESS → skipWaiting 1, BUSY 0; QUIET → BUSY {windows:2}; Tab B's
`import('./mathworker.js')` → NEW bytes; a removed module → 404. The code-reader notes sw-client.js:14-24 already admits the per-origin
swap and that the save road has no lazy import, so the work is not lost unless the badge is ignored — hence medium there.
Fix: count windows on every SKIP_WAITING; when > 1 and not `{ force: true }` reply LW_SW_BUSY; the pane re-offers "n other windows are
open — UPDATE ALL reloads them too, or close them first", UPDATE ALL sends `force: true`; the non-asking tab reloads at once when untouched,
else says RELOAD NOW. Rewrite the §4 and sw-client header comments to what the code does.
Test: pwa E5 extended — two windows on a plain press expect BUSY; `force: true` expects skip. Codex R1b-01 ADOPTED with this evidence.

### MEDIUM

**R-04 · MEDIUM · CRASHES AND RECOVERY · lab/shell/persist.js:199, lab/rack.js:328/332/338**
A non-finite or null `presentation.domain.half` reaches live state unchecked and the session persists it, so every launch is broken.
restore() spreads obs, mat, quality and domain with Object.assign and never checks the numbers; `half: null` reaches `field.setDomain`
and `ui.domainKnob.set` (the kit knob's fmt throws "toFixed, v is null"); restore() returned true, so the project part captures
`{auto:false, half:null}` into `lambdawaves.q0.session` and RESUME replays it. Corrected by the reproducer: the throw costs one frame per
REBUILD ask, not every frame (presents 72 vs 70 per 2 s), and the stage is degenerate (half f32 → 0, picture unchanging), not frozen; a
DOMAIN turn or AUTO heals it, with nothing said. `mat.exposure = 'boom'` is accepted live but written back as 1. Severity lowered from the
finder's high by both skeptics.
Fix: coerce at the three Object.assign sites — a file value is taken only when `Number.isFinite`, else the current/default (domain.half;
mat exposure/softness/steps/hueShift/iso/grain/knee/slice.*; obs yaw/pitch/dist/fov/shift/quat; quality res/scale). Belt at rack.js:328.
Test: a node row over restore (or project-formats) with `{ domain: { half: null } }` leaving half finite; THE LOCK untouched. Codex R1b-07
ADOPTED, made concrete (the persisted frozen stage, not an XSS sink).

**R-05 · MEDIUM · THE DREAM ARCHITECTURE · tests/wiring.test.mjs:238-293, lab/mir/kit.js**
The app's kit imports are judged by nothing on the node side: a removed export is an ES-module link error before boot().
81 app files import 58 kit paths (kit.js alone from 60 files, 64 exports). `mir-manifest` pins bytes, `mir.test.mjs` §16 judges only its
own USES, `wiring` records edges without names; 67 of the 81 importers (rack.js, main.js, actions.js, every shell/ and windows/ file) are
never loaded by node. Reproduced end to end in a scratch tree: drop `arcRing` from kit.js, re-pin the manifest and sw.js as kit day
would, `./test.sh node` green, `import('./lab/chemview.js')` → "does not provide an export named 'arcRing'". Kit day (R2) is exactly when
exports move and its named proof set stays green in that scenario.
Fix: one more pass in wiring.test.mjs over its tokenized edges — for `import { names } from <kit path>` read the target's exports (following
`export * from`) and fail on a missing name; ~30-40 lines, no new file. The scratch `kit-imports-scan.mjs` already does it (MISSING: 0 today).
Test: the pass itself, red on the mutation above. Pre-1.0, before R2 kit day. Codex: not reported.

**R-06 · MEDIUM · THE UPDATE AND THE CACHE · lab/sw.js:545-547**
Install stores whatever 2xx body arrives under `?__rev` — no check against the recorded hash.
The §3 prose calls the buster an integrity guarantee; the body is never digested, `res.redirected` never read. Workers Static Assets ignore
the query when matching (wrangler.jsonc:71-75: `/index.html?__rev=x → 200`), and a deploy swaps the manifest at once, so an install
straddling a deploy stores a mix of two builds under one name — THE ONE LAW's named worst case — until the next build is taken. Reproduced in
the pwa harness: two tampered 200 bodies (a build-Y rack.js, an HTML sign-in page as main.js) stored under their clean URLs in a cache named
from the EXPECTED hashes, 419 of 419, install resolved. The planned Cloudflare Access front on the dev origin is the second trigger.
Fix: buffer, `crypto.subtle.digest('SHA-256')`, compare the 12-hex prefix to `rev`, throw on mismatch or `res.redirected`, put a fresh
Response — ~8 lines; a rejected install is retried by the browser with the new sw.js. Rewrite §3 to "busted by content and VERIFIED by content".
Test: one pwa row whose fake fetch returns wrong bytes for one entry must reject the install. Codex R1b-04 ADOPTED, the deploy-straddle
trigger in place of a misbehaving proxy.

**R-07 · MEDIUM · THE UPDATE AND THE CACHE · lab/volumes.js:157-159, :132, :222, :261, :313**
A volume's "installed" means URL-present, not hash-verified; a re-edition keeps stale `.lwm` records.
install() skips a file whose URL is a key in `lw-vol-<id>`; installStatus() and kept() count the same way; the `.lwv` road skips on
content-length alone; only file() compares the sha, deletes and refetches — which 404s in production (the shelf drops `index`, no volume
folder is shipped) and fails offline after the lamp said INSTALLED. Same-id re-editions are the practice (vol-1: 31 → 568 → 6927
molecules under one id). Reproduced on both roads with a node harness; the code-reader found the worse sibling: a re-packed `index.json` of
equal length is skipped too, installStatus drops to 'absent', the card says OPEN FILE…, re-opening skips again, and REMOVE is unreachable
(picker.js:537 offers it only in the 'installed' state) — a wedge until site data is cleared.
Fix: store the catalogue's sha in the put headers (`x-lw-sha256`) and treat a kept entry whose sha differs from the current catalogue as not
kept in install(), installStatus(), kept() and the `.lwv` todo; when the kept index.json does not hash to `v.indexSha256`, clear the cache
or disable the skip before resuming. Label-free.
Test: one volumes assertion per road — an entry kept under a stale hash is re-fetched/re-sliced; a stale index.json is replaced. Codex R1b-03
ADOPTED, narrowed to the two skips.

**R-08 · MEDIUM · THE UPDATE AND THE CACHE · lab/sw.js:597-599, lab/library.js:154-163**
Opportunistic DATA (menu pictures, NIST lines, demo covers) is stale forever once kept.
Unversioned names, kept by keepData() on first OK answer, answered cache-first from `lw-data-v1` with no revalidation; activate and the
user's own CACHE CLEARED road delete only `lw-lab-*`. A node transcription of both arms shows 3 of 3 kept files serving pre-deploy bytes
after a deploy. History corrected by the reproducer: the real in-place re-renders are Q3 (156 M), Q3b (67 M) and the Fr–Og ZORA pass
(32 M), not 863; lines.json has never been modified (the NIST leg is latent). Both skeptics: medium, not high — nothing is deployed yet.
Fix (smallest): in activate, sweep `img/menu/`, `demos/covers/`, `vendor/nist/` out of `lw-data-v1`, leaving `library/<sha>.json`, the
`-v1` basis records and `lw-vol-*`; a visitor re-keeps a picture on the next view. Alternative: content hashes in the generated names.
Rewrite the §1b sentence; regenerate §1 with `node tests/pwa.test.mjs --write`.
Test: pwa E6 extended — one picture key gone after activate, one record key kept. Codex R1b-06's "unbounded growth" half DISMISSED (the set
is finite and deployed; records and volumes are explicit presses); its revision half lands here.

**R-09 · MEDIUM · UNTRUSTED INPUT · THE MIR SEAM · RELEASE READINESS · lab/mir/shell/notebook-render.js:6/8/10/22, lab/shell/notebook.js:190/290**
An imported notebook's `![](https://…)` is fetched cross-origin on every project open — zero-click.
The sanitizer keeps IMG with src and nbSafeURL refuses only javascript/data/vbscript/file/blob (so `data:` images, the harmless kind, are
the ones refused); opened() switches a non-empty notebook to view and calls render() unconditionally after every open road (IMPORT, drop,
FOLDERS, RESUME). Reproduced in Firefox on an own gate server with a second origin: one GET per open, three opens three GETs, none at
importText alone. No CSP exists. Leak is IP, time and the fixed URL (Referrer-Policy cuts the referer to the origin); the LAN-router GET
fails on the deployed HTTPS origin (mixed content), so that half is dev-only. Reported by three finders; one row.
Fix (kit, FOR-MIR line): IMG kept only when src is same-origin or `data:image/`, with `referrerpolicy="no-referrer"` and `loading="lazy"`; or
drop IMG from NB_TAG. App side: nothing that holds — opened() forcing view is by design; SECURITY.md gains the sentence (R-15).
Test: a browser assertion that an imported `![](https://…)` note issues no request. Codex R1b-05 ADOPTED by all three finders.

**R-10 · MEDIUM · DEPENDENCIES AND STATIC ANALYSIS · tools/gate/server.py:78-82**
The gate server's dot-segment filter is bypassed by percent-encoding; `.claude`, `.tmp`, `.certs`, `.git` are served.
`allowed()` tests the RAW `self.path`; translate_path unquotes then normalizes, so `/%2Eclaude/…` and, for a LAN client held under `/lab/`,
`/lab/%2E%2E/%2Eclaude/…` pass both the dot test and LAN_PREFIXES. Measured by both skeptics on own servers: handoff notes 200 (2077 B), an
in-repo `.certs/key.pem` from Sep 26 200 (1704 B), `/%2Egit` the worktree pointer, `/%2Egitignore` 200; outside-root traversal stays 404.
The 0.5.0 security review's own fix is a no-op for anyone who encodes a dot; loopback (the default) is unchanged in reach.
Fix: `path = posixpath.normpath(urllib.parse.unquote(path))` before the segment and prefix tests.
Test: one row in tests/gate-tools.test.mjs starting the server on a free port and asserting 404 for `/%2Eclaude/` and `/lab/%2E%2E/%2Etmp/`.
Codex: not reported.

**R-11 · MEDIUM (code-reader: low) · CRASHES AND RECOVERY · lab/rack.js:618-645**
A frame fault that repeats every frame is reported to the console and `__e` only; the stage stands still behind a live UI with no word.
loopFault() writes `__e` and console.error once per distinct message; the word "banner" does not occur in rack.js, while controller.js:222-227
uses the banner for GPU error, device loss and WebGPU unavailable. main.js:58 installs the banner with `errors: false` — "the GPU and boot
failures, nothing else" — so widening is a product call, not a missed handler; the code-reader rates it low for that.
Fix: in the finally, on the second identical fault (`fault === lastFault`), `dom.banner.warn('a frame could not be drawn', fault)` once (the
banner dedupes by title to an (xN) count).
Test: one browser assertion in render-regressions or the probe's shape — two faults → the banner visible. Codex: not reported.

**R-12 · MEDIUM (code-reader: low today) · CRASHES AND RECOVERY · lab/mir/core/session.js:43-53/112-135, lab/projects.js:302-304**
A session record the kit cannot read (a future `v`, or unparsable) is resumed as "nothing", autosave arms, the next edit overwrites it,
and λWAVES' status line says the opposite.
readSession() collapses absent and unreadable into one null; the 1.5.6 "failed resume never arms" branch needs `rec && rec.parts`, so
`{"v":2,…}`, `{"garbage` and `{}` all arm with `last = null` and the first booked save writes `{v:1, parts}` over the record; no `.failed`
copy. projects.js:303 then says "kept as lambdawaves.q0.session.failed; autosave is off" — both false. Reproduced in node. SESSION_V has
only ever been 1 and λWAVES passes no `lift`, so today's trigger is a corrupt or foreign record (nothing recoverable in it); the loss needs
the version skew of a rollback — low now, medium at the first SESSION_V bump.
Fix (kit, FOR-MIR): in resume(), when storage holds text under `key` but readSession() returned null, copy to `<key>.failed`, leave autosave
unarmed, return `{ ok:false, failed:['record'] }`. App side until then: in projects.resume's `take`, when `session.read()` is null while
`hasResume()` is true, copy the raw text to `.failed` and keep the sentence at :303 true.
Test: the node row above asserting `.failed` exists and armed() is false. Codex: not reported.

**R-13 · MEDIUM (code-reader: low) · DEPENDENCIES AND STATIC ANALYSIS · package.json:19/22**
wrangler 4.147.0 carries 4 high advisories and the `overrides.sharp: 0.35.4` line pins the vulnerable sharp in place.
`npm audit` on the repo lock: wrangler ≤4.148.0 via miniflare via undici <7.30.1 (eight advisories, GHSA-2m5v-pch6-74hx and
GHSA-4w7w-5xrc-9h26 among them) and sharp <0.35.5 (GHSA-wq5f-xc86-pv6w). Measured in scratch by both skeptics: bump wrangler to 4.156.0 with
the override kept → sharp 0.35.4, still {high:3}; override removed → sharp 0.35.5, {high:0}. Dev-only (no `dependencies`, assets-only deploy);
the guard exists but is inert — verify.yml's `npm audit --audit-level=high` runs only on a push, and nothing is pushed.
Fix: wrangler → 4.156.0, delete the sharp override (miniflare now pins 0.35.5 itself); `npm audit` reads 0; one line "npm audit reads 0" on
RELEASING.md's release-day list, a checklist line not a gate.
Test: `npm audit` 0; `npm run build` and `node tests/pwa.test.mjs` unchanged. Codex: not reported.

**R-14 · MEDIUM (contested: low) · UNTRUSTED INPUT · tools/gemma/broker.py:26/192-196/208-215/176-180**
The optional ASK broker listens on 0.0.0.0:9443 over HTTPS with `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Private-Network:
true`, no token, no Origin check, no concurrency cap, and logs raw prompts to `~/.cache/lambdawaves-gemma/log.jsonl`.
Dimension 3's two skeptics let it stand (the reproducer reached ask() from `Origin: https://evil.example` with no token on an own instance;
the code-reader notes the Private-Network header lets a PUBLIC page reach the LAN host, which docs/GEMMA.md does not say). Dimension 8's
code-reader REFUTED the duplicate: docs/GEMMA.md:75-79 documents the bind, the wildcard and "no authentication … stop her when you do not
need her" as the accepted LAN trade; `ASK_ENABLED = false` (lab/ask.js:10) and tools/ never ship. Both sides agree on the live fact: pid
1055617, this worktree's broker.py, has listened on 0.0.0.0:9443 since 2026-10-15 17:28 with no asks since. Carried here, not dropped;
CALL 2 decides between hardening and the documented trade.
Fix (tools only): GEMMA_HOST default 127.0.0.1 with 0.0.0.0 an explicit opt-in printed at start; an `X-Gemma-Token` the start script prints;
echo Origin from an allowlist instead of `*`; `threading.Semaphore(2)` around ask(); raw-prompt logging behind GEMMA_LOG=1; docs/GEMMA.md
updated. Nothing under lab/.
Test: a curl pair against an own instance — no token 401, token 200. Codex R1b-02 ADOPTED at medium (dimension 3) and REFUTED as a defect
(dimension 8).

**R-15 · MEDIUM · RELEASE READINESS · SECURITY.md:3-5, README.md:303-304**
"No network calls after the page loads" is false, and neither privacy text mentions Web MIDI, Cache Storage or IndexedDB.
After load the app checks for a build every 30 min (main.js:157-161), fetches library records, volumes (≈5 GB), NIST lines, demos, NEW and
basis records on demand (18 same-origin fetch sites; sw.js:478 DATA roots), and an imported notebook's image is fetched cross-origin (R-09).
027 D4 made Web MIDI a boot-time use where already granted (mapping.js:17-26); storage also lives in `lw-data-v1`, `lw-vol-*` and IndexedDB
`mir-assets` (dropped audio). docs/SHIPPING-READINESS.md:136 already forbids "do not promise zero network traffic".
Fix: the paragraph in the finder's sketch — own origin only; the 30-min check; the records, volumes, lines and demos you ask for, cached; images
in an imported note go where the note points; microphone and MIDI roads as the code has them; localStorage + Cache Storage + IndexedDB + files.
Mirror in README § Privacy.
Test: none (copy); the code-side half is R-09's. Codex R1b-05 is the concrete reason the sentence is false.

**R-16 · MEDIUM · RELEASE READINESS · NOTICE:16-21/100-104, lab/index.html:122**
NOTICE omits the three info/ typefaces (Spectral, Playfair Display, Alegreya SC — 17 precached woff2, Google Fonts' unmodified files), the
Basis Set Exchange records (CC BY 4.0 — attribution is a licence condition; no licence field anywhere in lab/vendor/bse) and the NIST
citation; §7 names lab/mir/mod.js, curve.js and PORT-NOTES.md, which do not exist (only glyph.js does). ABOUT's "Type:" line names three
faces. Softened by the skeptics: each OFL face ships its own OFL.txt (OFL §2 met), and NIST is credited on the ABOUT face (index.html:123) —
the BSE leg is the one unmet licence condition; LEGAL-PROVENANCE row 9 has carried the action since 09-24.
Fix: §8 the notebook faces (files, OFL, copyright lines from each OFL.txt, SOURCE.txt), §9 BSE (CC BY 4.0, Pritchard et al. 2019, the API URLs
from index.json; re-verify on the BSE site), §10 NIST ASD (public domain; Kramida, Ralchenko, Reader and NIST ASD Team), §7 → glyph.js only.
ABOUT: pass the info faces as `extra` in lab/mir-gui.js:43 (app side) or a FOR-MIR line for kitType. Then `node tests/pwa.test.mjs --write`.
Test: none beyond pwa's rehash. Codex: not reported.

**R-17 · MEDIUM · RELEASE READINESS · README.md:3/44/67/71/81/159, CITATION.cff:9/10/15**
README and CITATION.cff still say 91 eigenstates / n ≤ 6 and 0.9.0-alpha · 2026-10-16; the code has held 140 / n ≤ 7 since iteration 008
(hydrogen.js:25 `NMAX = 7`; index.html:30/132 and the manifest say 140) and BUILD_LINE reads 0.9.9-alpha · 2026-10-25. README:33 is the
project's own law: where a claim and the code disagree, the code is the truth. CITATION.cff is what GitHub's cite box and a paper's
bibliography read.
Fix: the six README lines → 140 / n ≤ 7 (line 81's 1.43 ms / 3.40 ms were measured for 91 labels — re-measure or say so); CITATION.cff
version 0.9.9-alpha, date 2026-10-25, abstract "the 140 hydrogen eigenstates with n ≤ 7"; the cut recipe writes CITATION's two lines beside
BUILD_LINE (R-27 is the check).
Test: R-27's regex. Codex: not reported.

**R-18 · MEDIUM · RELEASE READINESS · CHANGELOG.md:14, REPORT.md, tools/changelog.mjs:19-27**
CHANGELOG.md stops at v0.9.4-alpha (no v0.9.9 section, nothing for 017–027) and `node tools/changelog.mjs --check` is RED now; REPORT.md's
wave mechanism has been dead since 10-10 (805af888, wave 224), so every section since v0.5.3-alpha reads "no new waves" and is a commit
list. `--check` is wired into nothing (test.sh, tests/, build-deploy.mjs); RELEASING.md:31-32's manual step was skipped at the 10-25 cut.
RELEASING.md:65, README.md:326, NOTES-FOR-AGENTS.md:104/122 and build-deploy.mjs:126 still call REPORT.md the living notebook.
Fix now: `node tools/changelog.mjs` and commit. Before 1.0: (a) one `### wave NN: <iteration title>` line per closed iteration appended to
REPORT.md at each cut, or (b) changelog.mjs takes the CLOSED rows of research/iteration-0NN/PLAN.md as the wave lines and the four prose
claims are retired ("the notebook up to 0.5.2; the iterations since live in research/iteration-0NN/"); wire `changelog --check` into test.sh
or build-deploy; cut a tag for 017–027 so BUILD_LINE, the tag and the CHANGELOG describe one tree (CALL 4).
Test: `node tools/changelog.mjs --check` green in the node gate. Codex: not reported.

**R-19 · MEDIUM · RELEASE READINESS · RELEASING.md:40-42, research/release-1.0.0/BUILD-PLAN.md:1-31, research/iteration-028/PLAN.md:42, docs/SHIPPING-READINESS.md:9/88/96**
Three documents define 1.0 three ways and none reconciles the others: RELEASING ("when the device matrix, the installed-PWA update test and
a screen-reader pass are closed"), BUILD-PLAN (THE PAPER + THE STANDALONE, zero lab/ lines, iPad/iPhone rows UNVERIFIED and said so), PLAN
028 ("the last confirmed critical/high fix"). SHIPPING-READINESS's facts are stale: "Wrangler 4.129.0 locked" (package.json: 4.147.0 since
1810ea67), "no remote, so hosted CI has not run" (origin = github.com/magic-commons/lambdawaves, origin/main exists, the gate badge sits at
README:12), "109 suites / 37" (115 / 41 today); DEPLOY.md:3 is dated 2026-09-10 and :122 still says 4.129.0. Line corrections from the
skeptics applied above.
Fix: one 2026-10-29 status block atop SHIPPING-READINESS (115/41, Wrangler 4.147.0, the remote and gate.yml, THE LOCK 843/0 · 987/0) with ONE
sentence naming the 1.0 definition Josh chooses (CALL 1); RELEASING.md:40-42 and DEPLOY.md:3 point at it; :88/:96 corrected or moved under
HISTORICAL as :15 does for the older blocks.
Test: none (documents). Codex: not reported.

**R-20 · MEDIUM · RELEASE READINESS · LEGAL-PROVENANCE.md:3/13-17/41/47-51/55**
The sole-author premise is false as written, the MIR/vendor rows are stale, and the five open items have no answers. Row 1: "Joshua Hosain
only (117 commits)" — the branch has 2,071 and five (00a15e44, d917dc7a, 3fed5f29, 1810ea67, 09d2492d; Oct 4–5) are authored AND committed
`Claude <noreply@anthropic.com>`, so `git shortlog -s` shows a second author under the sentence §4's dual-licence route and §3's Steam survey
rest on; store/apple/CHECKLIST.md:37 repeats "sole copyright holder". Row 2 says kit 1.4.3 (MIR-MANIFEST.json: 1.5.6-alpha.17). Rows 3 and 5
name lab/vendor/katex and lab/vendor/marked.min.js, gone (one copy each under lab/mir/shell/vendor). §5 items 1–5 unanswered 35 days on;
§6's NOTICE action undone (R-16). Still "Status: DRAFT for Josh to confirm". README:36-43's AI disclosure speaks of trailers, not of a
distinct author identity.
Fix: row 1 → "Joshua Hosain (two e-mail identities) and five commits of 2026-10-04/05 under the agent identity `Claude <noreply@anthropic.com>`
by Josh's own Claude Code session — the same work, the same direction, no other human; 2,071 commits at 2026-10-29"; row 2 → 1.5.6-alpha.17;
rows 3–5 → the one copy each; add rows for lab/fonts/info/ and lab/vendor/nist/; §5 answered with dates as Josh gives them (CALL 5);
header "Updated 2026-10-29 from the tree at <HEAD>".
Test: none (document). Codex: not reported.

### LOW

**R-21 · LOW · THE UPDATE AND THE CACHE · lab/volumes.js:296-298**
installMolecule() awaits keepData() for each ladder basis and ignores the result, returning `{ ok: true }`; install() (:193) and the file
road (:240) fold the same failure into `ok: !failed.length`. Reproduced in node: a QuotaExceededError on the 6-31G* put → ok:true, lamp
lit, `lw-data-v1` without the record; the LADDER's four bases are DATA roots, not precached, and keepData is their only writer, so the
offline rung fails at fetch. Lines corrected (296-298, not 299-301).
Fix: mirror install() — collect `failed`, `ok: !failed.length`, a why that says "press again online".
Test: one volumes assertion with keepData stubbed false. Codex R1b-06 NARROWED to this one defect.

**R-22 · LOW · PERFORMANCE AND STRESS · tools/perf/digest-lock.mjs:181-186**
THE LOCK's momentum@128 `repeat` leaf flips intermittently: RED in 3 of the finder's 4 runs with the state's digest, rp, rpL and pack
matching the fixture; the reproducer's 3 fresh runs alone were GREEN (843·0, 843·0, 987·0) — 3 RED of 7 today. field.js has no
order-dependent accumulation (atomicMax/Store/Load only; fieldDigest a pure FNV over the texels), so no tree defect is indicated; the
code-reader notes two headless Firefoxes and a gpu-recorder held the GPU through the RED runs (the P5 hazard's "second light GPU client"
condition), and that on the 0.7.1 tree the same hazard once moved the digest leaf itself (6a57a91 → b5b349a8, Δ∫ 7.8e-12). The lock does
not print dg2's hash, so nobody has seen how far it moves.
Fix: either the finder's (re-take dg2 once when `repeat` is false and `digest` matches, record `repeatRetried: true`) or the code-reader's
(no tool change; one flake clause in docs/laws/field-and-lock.md: momentum@128 may flip under a second GPU client — re-run once alone before
reporting; print dg2's hash in the diff line). CALL 3.
Test: the lock run alone, GREEN; the diff line names the retry or the second hash. Codex: not reported.

**R-23 · LOW · PERFORMANCE AND STRESS · lab/node-shader.js:339-353, lab/film-bake.js:88-92**
The film's SHADER bake allocates a fresh MAP_READ buffer and a Uint8ClampedArray(w·h·4) per gpu layer per frame, then un-premultiplies all
w·h pixels in JS, makes a new canvas, putImageData and drawImage through the chain's filter. Three nodes at 1080p: ~25 MB of JS arrays
(+25 MB MAP_READ +25 MB canvases) and 6.2 M pixel visits per frame; the 60-frame clip ran 12.0 s with 61 long tasks of 50–124 ms (heap back
to 16.0 MB after — churn, not a leak). Microbenched: 2.4–9.0 ms per layer for the loop plus 2–4 ms alloc+copy, so ~15–40 ms of each task; 900
frames ≈ 15–35 s of pure JS, not "minutes". The stress film also carried R-01's 20 validation errors, so the long tasks are not cleanly the
bake's alone.
Fix: reuse one MAP_READ buffer, one rgba array and one tmp canvas per film record (sized once per w·h); move un-premultiply into the TONE
pass's target write (straight alpha into the rgba8unorm film target) so the JS loop goes.
Test: `tools/perf/film-bake.mjs shaders` (determinism) and the film audit's frame-time line. Codex: not reported.

**R-24 · LOW · THE MIR SEAM · lab/project-store.js:68, lab/mir/folders/files.js:120-125, lab/mir/folders/gallery.js:563/641/670**
A stored thumbnail is any string: toFiles() forwards it when `typeof === 'string'`, entryOk accepts the same, the gallery paints it into
`url(JSON.stringify(thumb))`; the only `data:image/` test (folders.js:101 toThumb) is on the capture road. Reproduced in node: an
`https://attacker.example/t.png` thumb and a 4 MiB string both pass and price at 4,194,456 bytes against capChars. No file road writes a thumb
(parseProjectFile has none, importEnvelope writes ''), so the writer is already same-origin — hygiene grade.
Fix (app, one line): `thumb: typeof it.thumb === 'string' && /^data:image\//.test(it.thumb) ? it.thumb : ''` at project-store.js:68 (a non-data
thumb reads as '' and the kit re-captures it). Kit side (FOR-MIR): entryOk applies the same test.
Test: tests/project-formats — a non-data thumb reads as ''. Codex: not reported.

**R-25 · LOW · THE DREAM ARCHITECTURE · tools/state-scopes.mjs:22-25, lab/settings-store.js:67-74**
ONE STORE is proven doc-against-registry, not registry-against-code: `--check` compares docs/STATE-SCOPES.md to RECORDS and reads no lab
source. Today all 34 storage-shaped literals are registered (`lw.period` and `mir.prefs` are non-storage); a future unregistered
`lambdawaves.q0.*` key would leave `state-scopes --check` green and FORGET would leave it behind (reproduced: forgetRecords on a fake Storage
removed 2, left 1). settings-probe.mjs would red an UNKNOWN key that moves during an open — by hand, not in the node gate.
Fix: the sweep as `--check`'s second judge in state-scopes.mjs — scan app files for storage-shaped literals, allow RECORDS keys, prefixes and
NOTEBOOK_KEYS, fail on any other (~15 lines).
Test: the judge itself; red on a planted literal. Codex: not reported.

**R-26 · LOW · THE DREAM ARCHITECTURE · test.sh:17-23, tools/pyscf-table.mjs:35-37**
README's PySCF table has a `--check` nobody runs: sw.js, STATE-SCOPES, catalogue.js, PROVENANCE and new-project each have a gate; pyscf-table
is referenced by no test, not by test.sh, not by package.json (only prose and two ad-hoc job scripts). tests/molecules.test.mjs passes under
max(1e-9, 3e-12·|E|), while the table prints the fixture's double unrounded, so a re-run fixture drifts README silently. In step today
(11,136 bytes, 38 records + 61 molecules).
Fix: one execFileSync line in tests/provenance.test.mjs (its :11 pattern) running `tools/pyscf-table.mjs --check`.
Test: that line. Codex: not reported.

**R-27 · LOW · THE DREAM ARCHITECTURE · CITATION.cff:9, lab/build-line.js:4, tools/changelog.mjs**
CITATION.cff carries a second, stale version number and no test reads BUILD_LINE (only tests/legacy/boot.browser-test.mjs:1533, not run by
test.sh); package.json has no version field; tools/snapshot-release.mjs:25 lists CITATION.cff in PARTS, though the release-0.9.* folders hold
no copy — the propagation path is the tag itself (GitHub's cite box, Zenodo). Content fix is R-17; this row is the check.
Fix: in `tools/changelog.mjs --check` one regex judge — CITATION.cff `version:` equals BUILD_LINE's leading token and the newest CHANGELOG
heading equals the tag; run in verify.yml beside `build-deploy --quiet`.
Test: the judge, red on today's tree until R-17 lands. Codex: not reported.

**R-28 · LOW · RELEASE READINESS · lab/manifest.webmanifest:2, lab/index.html:32, tools/platform/electron/package.json:3**
The version and name seats disagree: manifest `name` and og:title say "λWAVES — QWAVE-0 Hydrogen Shadow Lab" while `<title>` is "λWAVES ·
Magic Commons" (the manifest name is what an installed PWA shows under its icon); the Electron package says 0.2.3-alpha.3 (hand-written;
package.mjs never reads BUILD_LINE — no About dialog exists on Linux, so the surface is packaged metadata); LEGAL-PROVENANCE says kit 1.4.3.
The kit "written four ways" is mostly law, not drift: kit.md:17/23 define 1.5.5 as the adopted base and 1.5.6-alpha.N as the doors; only
LEGAL's 1.4.3 is a genuine kit drift (R-20).
Fix: label renames only — manifest name → "λWAVES", og:title → "λWAVES · Magic Commons"; the Electron version read from lab/build-line.js in
package.mjs at build; the kit sentence "MIR 1.5.5 plus the doors 1.5.6-alpha.1…17 (MIR-MANIFEST.json is the number)" where it is cited.
Test: pwa rehashes the manifest and index.html (`--write`). Codex: not reported.

**R-29 · LOW · RELEASE READINESS · docs/ACCEPTANCE-MATRIX.md:19, tools/platform/electron/package.mjs:15**
The stores program's M0 state points at a lost worktree and a missing keystore: the TWA row says the upload keystore "exists only in the
worktree-hosts-m0 worktree"; that worktree is gone (the branch survives but `local/` and `*.keystore` are git-ignored, so it holds no key)
and no upload.keystore exists under ~ to depth 9. Nothing is on Play, so the cost is a stale row and a regenerated key (assetlinks.json
re-fingerprinted). LEGAL §3/§6 require a SOURCE.md naming tag and commit in the Steam package; package.mjs writes only build-identity.json.
No binary is released, so the second half is a recorded M3 to-do.
Fix: the TWA row → "upload keystore: NONE on this machine; generate at the first Play upload per tools/platform/android/README.md and back
it up before any upload"; package.mjs writes out/SOURCE.md from build-identity.json and copies LICENSE and NOTICE to the package root.
Test: none (tools/ and a document). Codex: not reported.

**R-30 · LOW · DEPENDENCIES AND STATIC ANALYSIS · tools/platform/electron/package.json:16**
The desktop host pins electron 44.4.5: GHSA-x562-297c-g43g (pointer lock attributed to the wrong frame, <44.5.0), GHSA-jr5w-w6x2-84p9 (eMudhra
intermediate mitigation, <44.9.1), plus the undici set through @electron/get (install-time only, nothing of it ships). Fix available in-major:
44.10.0 (current line 45.1.0). The code-reader shows both named advisories unreachable in this host (no requestPointerLock, no iframes,
allowPermission() denies all but fullscreen/clipboard/audio for lambdawaves://app; every renderer fetch is served from disk), so the honest
case is Chromium's unlisted backlog between 44.4.5 and 44.10.0 — low, not "medium the day it is published".
Fix: electron → 44.10.0, `npm install` there, `npm audit` 0, `node smoke-run.mjs` (17/17); the matrix notes the runtime (main.cjs:10's comment
names 44.4.5).
Test: the smoke run. Codex: not reported.

**R-31 · LOW · DEPENDENCIES AND STATIC ANALYSIS · lab/mir/shell/vendor/katex/katex.min.js:1**
Vendored KaTeX 0.16.11 sits in range for GHSA-cg87-wmx4-v546 (`\htmlData` attribute names unvalidated, fixed 0.16.21) and GHSA-238p-pmpm-9mq7
(inherited `trust`, fixed 0.18.2). Both live in this build under `trust:true` or a polluted prototype (reproduced); neither reachable: the
one renderToString call passes an own `trust:false` (notebook-math.js:8-10), the Settings constructor reads own-first, and
tests/notebook-math.test.mjs pins the exact options literal and asserts `\href{javascript:…}` yields no javascript href. A hygiene upgrade
line, kit side.
Fix (FOR-MIR): vendor KaTeX 0.16.47 (last 0.16, drop-in) or 0.18.2 with its fonts; keep `trust:false`; record version + sha256 in a VENDOR
manifest; pwa rehashes on adoption.
Test: notebook-math.test.mjs as it stands, against the new bytes. Codex: not reported.

### DISPUTED (Josh decides)

By the strict definition (the reproducer refuted after the code-reader did not) there is none. One cross-dimension conflict is carried in the
queue rather than here so nothing is dropped:

| id | finding | for | against |
|---|---|---|---|
| R-14 | the ASK broker on 0.0.0.0:9443, wildcard CORS, no token | dimension 3's code-reader and reproducer: no guard in the file, a public page can reach the LAN host through the Private-Network header (undocumented), the broker has run unattended 14 days; reproducer entered ask() from a foreign Origin with no token | dimension 8's code-reader: docs/GEMMA.md:75-79 documents the bind, the wildcard and "no authentication … stop her when you do not need her" as the accepted LAN trade; ASK_ENABLED = false, tools/ never ships; Ollama serialises the GPU; a token is new machinery on a hidden pre-1.0 tool |

Codex findings no finder touched: none — all seven were adopted, narrowed or contested above.

### REFUTED (for the record; not in the queue)

- UNTRUSTED INPUT — no CSP / frame-ancestors on dist/_headers: triaged in research/release-0.5.0/SECURITY-REVIEW.md:282-288 (Report-Only
  first; the worker replays install-time headers, so a future CSP belongs in an index.html meta tag); cross-site frames get partitioned
  storage, so the clickjack half is unreachable; no injection path found. Low defence-in-depth, already on the record.
- THE MIR SEAM — render store checkpoint "quadratic manifest I/O": saveManifest opens a fresh writer (job.json is O(n) on disk, ~14 MB at the
  216,000-frame ceiling, inside create()'s +32 MB slack); the stall is 12.8 ms per 2 s at 36,000 frames; one file per checkpoint is BASINS'
  manifest unchanged and recoveries() reads one job.json. Residue: an incremental index as a FOR-MIR observation.
- THE MIR SEAM — nine app files reach kit DOM by class: classes are MIR's documented addressing (kit.md:19 "parts by class and data-*"), an
  adoption is never silent (manifest pin + `adopt --check`), most sites throw loudly at boot, and the cited FOR-MIR `data-sv-field` line does
  not exist.
- PERFORMANCE — routed dials cost ~155 µs per lane per tick: the knob's paint() is setVar/setText/classList through perf.js's equality guards,
  no canvas; the residue is set-then-show defeating the guard — a few µs of string work, not a raster.
- PERFORMANCE — each SHADER node its own canvas, ~6× : the design nodes.md:29 states; the finder's own gpuP50 excludes the compositor and
  still doubles for three chained (the passes, not the layers); Chromium's boot adapter was the RTX, ratio 1.4–1.6×, not 6×.
- THE DREAM ARCHITECTURE — every window under one browser loop: a throw at a seat aborts boot before `LW.ready`, which THE LOCK and 31 of 41
  suites wait on — not undetected. A non-throwing regression in EQUALIZER, SETTINGS or RADIATION remains a reach gap by the designed split
  (AUDIT.md Q6).
- THE DREAM ARCHITECTURE — `__e` unbounded: no timer-driven thrower exists in lab/ (one self-clearing setInterval); worker errors are consumed
  rejections; an uncapped record of a repeating fault is the diagnostic. Not reachable.
- THE DREAM ARCHITECTURE — name persist's split now: HINGE 25 is a standing constraint (CLAUDE.md:18), a law (architecture.md:22) and a test
  (rack-deps.test.mjs:149), never raised since R0; the "modulation half" shares all but one crossing (app.ctl.modGets) with serialize/restore,
  so the split buys 24 → 23; the R2 trigger is invented.
- THE DREAM ARCHITECTURE — no user road for diagnostics: ABOUT's COPY DUMP (index.html:124, notebook.js:347-352) already copies BUILD_LINE,
  settings, the adapter info and the UA; the banner text is selectable; LW.report in tools/ is the standing dial. Residue: COPY DUMP omits
  `__e` and `banner.problems()` — a one-line append below low.
- DEPENDENCIES — the ASK broker (duplicate of R-14; see DISPUTED).
- DEPENDENCIES — 37 kit-internal cycles: architecture.md:7 already records them as the kit's own; kit.js:1196-1197 documents the cycle as
  harmless by construction; three node tests import kit.js under test.sh, so a TDZ break would red the gate; `knob` and `el` are hoisted
  declarations. Residue: research/senior-pass/AUDIT.md:19 says "0 cycles" where the law says "0 app-side".

---

## 2 · SOUND — by dimension

**THE UPDATE AND THE CACHE.** Install fetches every entry with `cache:'reload'` + `?__rev` and rejects the whole install on a non-OK answer
(no 404 is ever cached; `already` lets a quota retry resume). build-deploy V1 re-hashes every PRECACHE entry against dist/; pwa §C proves the
list. Discovery: `max-age=0, must-revalidate` on everything, registration on every launch, a re-check on return to the foreground every
30 min, LW_SW_WAITING to the badge. Routing: `html_handling: none`, the `/ → /index.html 200` rewrite, no SPA catch-all, V6 names the 307
trap; a navigation is answered only for the ENTRY set. activate deletes only `lw-lab-*`; the DATA arm is read-only. `workers_dev: false`
everywhere; the dev origin undeployed since 09-12; VOLUME_BASE same-origin. Rollback is honestly "another build". The quiet take is refused
at two windows and offers instead; LATER disarms. Demos are DATA with `cache:'no-cache'`. UPDATE APP asks before discarding dirty work and
deletes only `lw-lab-*`. The cache name is derived from the hashes alone (pwa :561-575). Codex R1b-06's "unbounded" half does not hold.

**CRASHES AND RECOVERY.** Device loss has a handler and a word (gpu-boot.js:46-48, field.js:1351-1356/1423, controller.js:221-227) and no
re-create road by design; every rack site tests `field.ok`. requestGpu never rejects; a boot rejection reaches the maroon banner. The maths
workers: FIFO, 8 s per job (chem 300 s), `onerror` falls back to the frame thread until the first answer. The kit session never throws; a
part that threw is kept as `<key>.failed` and autosave stays unarmed; the λWAVES part throws when restore returns false, so RESUME takes the
open road with rollback. A stored collection that fails validation is read-only, never emptied; `__proto__` is defined, not assigned;
parseProjectFile bounds 8 MiB and the field types. Every localStorage write outside the kit is guarded. A film cancelled midway restores
clock, quality, governor, camera, canvas and the hold. Page lifecycle funnels into one setPageHidden. A thrown frame costs one frame. The
volumes' fetch road answers a sentence for offline, non-OK, sha mismatch and quota; the banner dedupes; THE SHADER NODE compiles fixed WGSL
only.

**UNTRUSTED INPUT.** ~60 HTML sinks, all literal or through esc/toFixed/same-origin SVG/the kit renderer; zero eval / new Function / string
timers / document.write / srcdoc / setAttribute('style'); no window `message` listener (only the worker channel); two same-origin workers; no
WebAssembly; no third-party network road in app code (the external hosts in the grep are provenance strings). parseProjectFile's bounds and
validateProjectCollection's refusal; restore() through typed setters; no file key reaches an HTML sink. The `lw:` codec: base64url, 5-byte
header, CRC32, version, each tag at most once, lengths bounded, unknown tags skipped; a link opens only at boot or after the discard
confirm, never persisted; `?preset=` and `?view=` whitelisted; `?report=1` 404s in dist. The notebook sanitizer against script: inert
template, allowlists with no svg/math/style/form/iframe/object, scheme block on the decoded value, noopener noreferrer, disabled task boxes,
math expanded in text nodes after sanitizing; KaTeX `trust:false`; marked's output never unfiltered; notebook `lw:` links run the hand-verb
whitelist only. Volumes same-origin, SAFE ids, RELATIVE paths, sha-256 on `.lwm` and the catalogue; library records named by their sha;
FOLDERS zip hashes every asset. Microphone audio-only, tracks stopped on teardown. nosniff and Referrer-Policy present; no COOP/COEP by
reason. Semgrep p/javascript: one false positive (links.js:84, a number).

**THE MIR SEAM.** prefs restores through repair()/valid(), every storage access guarded, load() checks the envelope. midi.js re-validates
the saved map on read; the app's door refuses unknown ids; requestMIDIAccess only from a hand or where already granted. window/rack
restores clamp NaN, huge and negative geometry — no window off-screen forever. session.js keeps a failed resume as `.failed` and never
arms (the unreadable-record case is R-12). files.js filters each entry and sets an unreadable library aside as `.refused-<time>`; gallery
writes names through textContent and thumbs into `url(JSON.stringify(…))` (the scheme is R-24). zip is stored-only, CRC-checked, bounded,
names never used as paths. The render store keeps `{ size }` per sample, bounds the write queue at 8 MB, streams finalize in 1 MB blocks,
caps the no-OPFS fallback at 128 MB and the run at 216,000 frames / 20 min. store-worker answers every op by id and terminates on failure.
notebook-render against script as above (images are R-09). info/layer renders app-owned md only. window-picker rebuilds from
rack.windows() with no stored state. share-link.js is not a λWAVES door. Kit failures that could take the app down with no recovery: none
found.

**PERFORMANCE AND STRESS.** THE LOCK green alone (843·0 run 3; 987·0 both runs); the one moving leaf is R-22. No unbounded growth: heap
13.0 → 16.5 MB across 30 s PLAY with CURVES + FEEDBACK → REFRACT → FLOW and 73 lanes, a 1080p film, the bypass windows; DOM +537 nodes,
listeners back to 7,278 after mod.reset; Firefox 60 s more: DOM +3, 0 GPU errors, 0 page errors. No input made the page unresponsive for 1 s
(longest task 124 ms inside the film; worst rAF gap 283 ms with 73 lanes). The governor stepped autoScale to its floor on the 64³ grid with
no rebuild storm; PLAYBACK LOCK untouched; 73 of 73 non-action targets accepted without tripping the flash guard. Benzene re-solved
off-thread in 2.15 s. The film exact and complete under stress (60 frames 1920×1080, 'frame k is t0 + off(k)'), the three stateful nodes
baked from black at frame 0. The volumes' fetch streams and sha-checks. node-shader's per-present churn produced no growth. HEAVY marks
neither refuted nor confirmed (headless compositors dominate; headed Chromium got SwiftShader today); absolute frame times are the
instrument's and reported as ratios only.

**THE DREAM ARCHITECTURE.** THE GRAPH: 174 app + 157 kit modules, 0 app-side cycles, 0 kit→app edges; hubs the designed ones (rack.js
fan-out 54; hydrogen.js fan-in 54). THE APP LITERAL: 30 keys; hooks 14 · state 59 · loop 13 · host 21 · w 71 · ctl 68 · sh 48; THE HINGE 0
bare writes, persist 24 of 25; only main.js imports rack.js. ONE STORE: 34 of 34 registered. ONE ACTION REGISTRY: 91 rows; the 23 `.click()`
sites are a switch's own onChange, kit faces with no verb, a file input, a download anchor, the notice. ONE TIME: `this.t` in clock.js alone.
THE INSTRUCTIONS: CLAUDE.md 1,207 words; docs/laws 24,196 by subject; five generated artefacts gated; verify.yml and gate.yml. THE KIT SEAM
pinned per door; wiring resolves the graph the browser walks; mir.test.mjs §16 judges its own imports; gpu-boot.js and sw.js the two
deliberate roots. THE START: the session over one part, the photosensitivity notice not silenced by a query, boot failure to the banner and
`__e`, no self-take on install. THE SENIOR-PASS QUEUE: R3 and R4 closed; R2 kit day and R5 dead doors open; nothing here duplicates R4 or
proposes a refactor.

**RELEASE READINESS.** Font licences ship beside their faces (pwa :238-244, :330, :662-665; OFL §2 met for all nine typefaces). LICENSE is
GPLv3 verbatim; package.json, CITATION, NOTICE, README and ABOUT all say GPL-3.0-only; LICENSE and NOTICE ship (SHIP_EXTRA, BESIDE_LAB).
The microphone claim is TRUE after 025 (bind.js:194, mod-port.js:96, audio-capture.js:84/179). KaTeX 0.16.11 and marked 12.0.2 match
NOTICE; one copy each. The ChronusQ credit is consistent in four seats. DEPLOY.md's Cloudflare claims match wrangler.jsonc. Every app fetch
is same-origin. NIST data is lawful to redistribute (public domain, header records the query and the date). CITATION's repository-code
matches the remote; README's AI disclosure agrees with LEGAL §1 in substance. R1b-02 is not a release item (tools/ never ships). The
version law holds inside lab/ (build-line.js:4 is the only hand-written version; ABOUT reads it through LW.build).

**DEPENDENCIES AND STATIC ANALYSIS.** No runtime dependency; lockfileVersion 3, 91 packages with `resolved` + `integrity`. marked 12.0.2: no
advisory. KaTeX 0.16.11 not exploitable along the notebook road (R-31 is the upgrade line). mp4.js bounds every integer it writes and
mp4Parse checks every box. tools/gate/server.py cannot read outside its root (the in-root dot filter is R-10). broker.py has no shell or
traversal road. Semgrep on tools/: 19 findings, all benign (rejectUnauthorized toward 127.0.0.1 only; RegExps from the repo's own list with
metacharacters escaped; constant urllib hosts). Semgrep on lab/: 21 findings — 12 INFO, 6 Object.assign (central.js own values; persist.js
= R-04), 1 false positive, 2 in share-link.js which no app module imports. knip: 18 unused files all under lab/mir (adopted whole); 14
deliberate unused exports under lab/ (R4-BUILD.md); 462 kit API exports; the `N|RENDER_CAP` alias documented; the Electron "unlisted"
deps are declared in its own package.json. dependency-cruiser over lab · tests · tools: 612 modules, 0 unresolved, 0 app-side cycles, 31
orphans all entries by nature. No top-level name defined twice across lab. lab/vendor/bse and nist under the hashed precache with an `r.ok`
check. ASK_ENABLED = false confirmed.

---

## 3 · THE DREAM ARCHITECTURE

*The essay as the finder wrote it, lightly edited; where a skeptic refuted one of its proposals the bracket says so and the queue row is
named.*

If I were handed the dream job, the first thing I would say is that most of the dream is already built, and it was built the hard way: by
measurement, under laws a tool enforces, with a refusal list. I re-measured the tree on 2026-10-29 before writing a sentence.
dependency-cruiser over lab/ sees 174 application modules and 157 kit modules, 0 application-side circular edges, 0 kit-to-application
edges. `node tools/rack-deps.mjs --classes` says G-A holds (the `app` literal at lab/rack.js:119 has 30 top-level keys; its namespaces hooks
14 · state 59 · loop 13 · host 21 · w 71 · ctl 68 · sh 48, every one under V8's 128-key dictionary cliff, guarded at tests/rack-deps.test.mjs:151)
and THE HINGE holds (0 bare cross-scope writes; the largest moving module, persist, at 24 of 25). Only main.js imports rack.js. Every
storage-shaped string literal in the application is a RECORDS row (34 of 34; the two false positives are a modulation target id and the
kit's frame key). CLAUDE.md is 1,207 words and the laws are 24,196 words in docs/laws/ by subject. This is not a tree that needs rescuing;
it is a tree that needs its load-bearing seams named so nobody leans on the wrong one.

**What is right and must be protected, by name.** The five contracts of 021 — ONE STORE, ONE ACTION REGISTRY, ONE TIME, ONE MODE, ONE KIT —
are the architecture. Each has a gate, and the gate is the law's real text: THE LOCK (843/0 · 987/0) for the field's pixels, `rack-deps
--classes` for the literal and the hinge, `state-scopes --check` for the records table, `new-project --check` for NEW, `mir-manifest` and
`adopt --check` for the kit's bytes, `lw-facade` for the diagnostics surface, `pwa` for the precache, `wiring` for reachability. A senior
engineer reading this tree in 2036 will not need the prose; they will run `./test.sh node` and read what fails. That is the property to
protect above every other: a law that is enforced is cited by its gate, not restated.

Three further things are right and rarely seen together. First, the boot is a *seated* composition: `boot()` creates 25 modules at named
seats in rack.js, hands each the one `app` object, and the rack-deps tool measures each module from its own file against the cut table
(tools/rack-deps.mjs PLANNED_CUT), so a module can only cross into another's scope through `app.<ns>.x` and the count is public. Second, the
three scopes (PREFERENCE, WORKSPACE, PROJECT) are a data law rather than a folder law: the registry is RECORDS in lab/settings-store.js, the
document is generated from it, and a project open must leave `lambdawaves.q0.settings` byte-identical outside WORKSPACE (settings-probe).
Third, the kit seam is byte-pinned: lab/mir is written by adopt.mjs alone, each door's sha-256 sits in tests/mir-manifest.test.mjs ACCEPTED,
and the app only adds doors. Those three — the seated boot, the registry-as-law, the pinned kit — are the shape I would copy into any
instrument of this kind.

**The load-bearing seams (where the next ten years will push).**

1. The HINGE at 24 of 25. lab/shell/persist.js is one crossing from the limit. The next row that needs persist to read one more boot name
   will face a choice: raise HINGE or split persist. Raising HINGE is the wrong answer every time — the number is what makes the module
   boundary real. The right answer already sits in persist's own return: `restoreModulation` and `modSeats` (persist.js:350-351) are the
   modulation half of serialize/restore and could become the seat of a sibling module without touching the project bytes (serialize-bytes.mjs
   is the proof). [REFUTED as a row by the skeptic: HINGE 25 is a standing constraint, a law and a test and has never moved; the modulation
   half shares all but one crossing with serialize/restore, so the split buys 24 → 23; a 26th name has cheaper legal routes architecture.md
   already prescribes (a backward read of a const seated earlier, or a field on app.state.restoreNotice which persist owns). The sentence
   "HINGE never rises" stands as what the law already says.]

2. The kit seam is wide where it is thin. 81 application modules import 58 distinct kit paths; `mir/kit.js` (64 exports) alone is imported by
   60 files. The manifest pin proves the *bytes* did not change behind our backs, and tests/mir.test.mjs §16 proves the names *that suite*
   takes still exist — but nothing on the node side proves that the 58 import sites in lab/ still name exports the adopted kit has. A removed
   export is an ES-module link error at boot, which is the critical class ("crash at boot"), caught today only by the 20-minute browser
   gate. Kit day (R2) is exactly when exports move. The wiring test already parses import syntax in code position with a real scanner
   (tests/wiring.test.mjs:1-25); judging each `import { a, b } from './mir/x.js'` against x.js's export names is one more pass over the same
   tokens, not a new gate. [CONFIRMED and reproduced end to end → R-05; pre-1.0, before R2.]

3. The test pyramid's base has slid. On 10-25 the audit measured 72 of 153 application files reached by no node test (47 %); today it is 96 of
   172 (56 %). The 19 new modules of 019–027 (the NODES family, the chord and equalizer audio, the emission view) are UI modules that only the
   browser suites reach, which is the designed split — but by file name and by window id, three windows are named by no browser test at all:
   equalizer, settings-card, and the RADIATION readout in readouts.js. tests/window-switching.browser-test.mjs loops over two ids
   (`['spectrum', 'wave']`, line 42). The dream pyramid here is not more suites; it is one loop over `rk.windows()` in the suite that already
   exists — open, fold, unfold, assert `__e` empty and a body height — so every window a future row adds is exercised by construction, as
   `wiring` made every file reached by construction. [REFUTED as a defect: a throw at any seat aborts boot before `LW.ready`, which THE LOCK
   and 31 of 41 suites wait on, so "crash at boot undetected by the gate" cannot happen; the reach gap for a non-throwing regression in
   those three windows is real, is AUDIT.md Q6's "fact, not a defect", and under Josh's dial does not buy a per-window suite before 1.0.]

4. The version seat is not one seat. lab/build-line.js:4 says "THE ONLY PLACE THE NUMBER LIVES" and names 0.9.9-alpha; CITATION.cff:9 says
   0.9.0-alpha and is copied whole into every release snapshot (tools/snapshot-release.mjs:25). No test reads BUILD_LINE. The citation file
   is how a paper cites the instrument, so the drift is a provenance defect, small and certain. The fix is a regex in `tools/changelog.mjs
   --check`, which is already the release-time check. [CONFIRMED → R-27 (the check), R-17 (the content), R-28 (the other seats); corrected:
   the snapshots hold no CITATION copy, the propagation path is the tag itself.]

5. Observability — what the app says when unwell. The banner says, in the user's words, what failed and what still works
   (controller.js:222-227; main.js:62), and the frame loop reports each fault once with a 32-message cap (rack.js:641). Two gaps. `window.__e`
   in main.js:11-13 is unbounded for `error` and `unhandledrejection`, so one repeating rejection grows an array for the life of a long
   session; 36 browser suites read `__e`, so the ring is load-bearing and should get the loop's once-per-message rule. [REFUTED: no
   timer-driven thrower exists in lab/, worker errors are consumed rejections, and an uncapped record of a repeating fault is the diagnostic
   the 36 suites and digest-lock read.] And the ring has no user road: `LW.report()` is a dynamic import of tools/perf/device-report.js
   (rack.js:1007), deliberately outside the precache, so an installed app offline cannot run its one self-measurement, and a user who sees a
   banner has nothing to copy for a bug report. ONE ACTION REGISTRY makes the fix a row: `about.copyDiagnostics` through the one clipboard
   road, carrying BUILD_LINE, the UA, `__e`, `sw.mode` and `field.error`. [REFUTED: ABOUT's COPY DUMP already carries BUILD_LINE, the
   settings, the adapter and the UA, and the banner text is selectable; the residue — appending `__e` and `banner.problems()` to the dump —
   is one line, below the review's low. The frame-fault word the user never gets is R-11.]

6. Generated artefacts. Five generated files have a gate (sw.js, STATE-SCOPES, catalogue.js, PROVENANCE, new-project). Two tools with
   `--check` are run by nothing: `tools/pyscf-table.mjs` (README's oracle table) and `tools/changelog.mjs`. The first is a provenance claim in
   the README that can drift silently from the oracles it quotes. One `spawnSync` line beside new-project.test.mjs:18's pattern closes it.
   [CONFIRMED → R-26; changelog's unrun check is R-18's cause.] And `state-scopes --check` proves the *document* equals the *registry*; my
   fifteen-line sweep is the other half — the registry equals the *code* — and belongs in the same tool so ONE STORE is a gate rather than a
   reading. [CONFIRMED → R-25.]

**What I would organise differently for a 1.0 that lasts.**

Module ownership: nothing moves. The 25 seated modules, the physics core (hydrogen.js fan-in 54, hamiltonian.js 29, field.js 26) and the
window files are the right grain. I would add only the ownership *statement* the tool already knows: `rack-deps --classes` prints the cut
table; that table, committed as the one page a new engineer reads (which module owns which seat, what it is handed), is the module map —
generated, never hand-written, like STATE-SCOPES.

The three scopes: keep exactly as they are. The one thing I would add is the code-side half of the check (R-25). I would refuse a fourth
scope and refuse moving any key.

The kit seam: pre-1.0, the named-export check (R-05); kit day as planned. Post-1.0, I would ask MIR for verbs where the app presses the
kit's faces (`.dev-fold`, `.dev-power`, the `more` toggle) so window-chrome.js:31, rack-wiring.js:100-103 and persist.js:314 stop clicking
DOM — FOR-MIR lines, not app code. [The class-selector hygiene row was refuted — classes are MIR's documented addressing — so these verbs
are a wish, not a defect.]

Generated artefacts: everything that is a table of facts about the code is generated and `--check`ed in the node gate; the two strays join
(R-26, R-18/R-27). The rule to write down: a `--check` nobody runs is a document, not a gate.

The test pyramid: node suites for every pure module (76 reached today, the oracle tests the base); the area suites by what you touched; THE
LOCK for pixels. No new tier. [The per-window loop was refuted; the kit-import pass (R-05) is the one addition.]

Observability: the frame-fault word (R-11). Nothing that runs in a frame.

The release line: one number, one check (R-27, R-17, R-28). RELEASING.md's recipe stands; I would move `changelog --check` and the CITATION
check into verify.yml beside `build-deploy --quiet`, so a cut cannot leave with two numbers — and the 1.0 definition must be one sentence
in one place (R-19, CALL 1).

**What I refuse, with the cost.** A TypeScript or bundler migration would buy the named-import check and nothing else the gates do not already
give, at the cost of every proof that reads source (`rack-deps` parses the files as they are, THE LOCK's capture paths, the facade pin, the
pwa hashes of the shipped bytes). A "kit facade" module that re-exports the 58 kit paths through one file would add a layer, change 81 import
lines and move no behaviour; the pin already does the work. A rewrite of rack.js's 1,009 lines into a declarative boot would break the cut
table that is the HINGE's ground truth. Each would need a byte-identical proof I cannot supply across 351 commits of change. The senior-pass
ruling stands: no massive refactor before 1.0, and, measured, none is owed.

The essay's one sentence: λWAVES is already the architecture I would draw; what it needs for ten years is the half-checks finished — the
registry against the code, the kit's names against the app's imports, one version number — each a line in a tool that exists, each with
its behaviour proof already in the repo.

---

## 4 · FOR-MIR

Lines for docs/FOR-MIR.md § FOR 1.5.6 (the kit is adopt.mjs' alone; a λWAVES door is 1.5.6-alpha.N with its FOR-MIR line; a removal waits
for a line). Each names its queue row.

1. **notebook-render.js IMG** (R-09): keep IMG only when src is same-origin or `data:image/` (flip the data: rule for IMG, keep it for A
   href); `referrerpolicy="no-referrer"` and `loading="lazy"` on every surviving IMG — or drop IMG from NB_TAG. The leak is zero-click on a
   project open in λWAVES.
2. **core/session.js resume()** (R-12): when storage holds text under `key` but readSession() returned null, treat it as a failed resume —
   copy to `<key>.failed`, leave autosave unarmed, return `{ ok:false, failed:['record'] }` — the law 1.5.6 wrote for a part that threw,
   extended to the record the kit cannot read.
3. **folders/files.js entryOk** (R-24): `thumb` accepted only when `/^data:image\//` — the test toThumb already applies on the capture road.
4. **vendor KaTeX** (R-31): 0.16.47 (last 0.16, drop-in) or 0.18.2 with its fonts; keep `trust:false`; version + sha256 in a VENDOR manifest.
5. **shell/about.js kitType** (R-16, alternative to the app-side `extra`): list the info/ faces when fonts/info/ is adopted.

Observations from refuted rows (not asks; for the kit's own notes): the render store's checkpoint rewrites the whole sample index every 2 s
(O(n²) cumulative write volume, O(n) on disk — an incremental index or a delta sidecar would be the improvement; BASINS' manifest must stay
readable); paintWidgets' set-then-show pair defeats the knob's equality guard (two needless DOM writes per lane per tick); the 37
kit-internal cycles through kit.js are documented harmless and should stay guarded by the kit's own tests; verbs for `.dev-fold`,
`.dev-power` and the `more` toggle would let the app stop clicking DOM.

---

## 5 · CALLS FOR JOSH

Only what cannot default.

**CALL 1 — what 1.0 means (R-19).** Three documents say three things. (A) RELEASING.md: the device matrix, the installed-PWA update test and
a screen-reader pass closed. (B) research/release-1.0.0/BUILD-PLAN.md: THE PAPER + THE STANDALONE with zero lab/ lines, the iPad and iPhone
rows UNVERIFIED and said so. (C) PLAN 028: the last confirmed critical/high fix. Choose one; the other two documents are rewritten to cite it.
The fleet's reading: (C) is the gate this review makes available; (B) is what the 1.0.0 folder already plans; (A) needs devices this machine
does not have.

**CALL 2 — the ASK broker (R-14).** pid 1055617 (this worktree's tools/gemma/broker.py) has listened on 0.0.0.0:9443 since 2026-10-15 17:28,
no asks since. Stop it today (`tools/gemma/stop.sh`, by pid). Then: harden per R-14's sketch (tools only, ~40 lines), or keep docs/GEMMA.md's
documented trade and add the one sentence it lacks (the Private-Network header lets a public page reach the LAN host). The fleet is split
medium/low; the fix is cheap either way.

**CALL 3 — THE LOCK's momentum@128 flake (R-22).** The finder's one-retry in digest-lock.mjs (tool-side, records `repeatRetried`) or the
code-reader's law line in field-and-lock.md with no tool change ("may flip under a second GPU client; re-run once alone before reporting")
plus printing dg2's hash in the diff. Your dial on gate machinery decides; both keep 843/0 · 987/0 as the law.

**CALL 4 — the record of 017–027 (R-18).** (a) one `### wave NN:` line per closed iteration appended to REPORT.md at each cut (the mechanism
changelog.mjs already reads), or (b) changelog.mjs reads the CLOSED rows of research/iteration-0NN/PLAN.md and REPORT.md is retired to "the
notebook up to 0.5.2" in the four places that call it living. And whether to cut a tag for 017–027 now (0.9.10-alpha) or let the 1.0 tag be
the first that names them.

**CALL 5 — LEGAL-PROVENANCE §5 items 1–5 (R-20).** Other contributors (the five `Claude <noreply@anthropic.com>` commits are the fleet's
answer to item 1 — confirm the wording), the video's audio, the icon's provenance, the publishing identity (D-U-N-S), the ChronusQ wording.
Only you can answer; the FOR-JOSH note of the cut is the place.

**CALL 6 — the DATA sweep (R-08).** Default is the activate-time sweep of the three opportunistic roots (worker change, pwa E6 row). The
alternative — content hashes in the generated picture names and lines.json's name — touches the generators and the Picker's label road and
is yours to prefer; either closes the row.

Everything else in the queue defaults to its fix sketch.

---

## 6 · THE CHAINS

Six file-disjoint chains for Opus builders, each on its own branch, merged by the integrator with the recipe. Every fix carries the test of
its failure; gates are CLAUDE.md's: after ANY edit under lab/, `node tests/pwa.test.mjs --write && ./test.sh node`, then by what you touched.
Kit-side rows (R-09 kit, R-12 kit, R-24 kit, R-31, R-16 kitType) ride FOR-MIR from the MIR session, not a chain.

**CHAIN A — THE WORKER.** Files: lab/sw.js (via `node tests/pwa.test.mjs --write` for §1; hand edits to §3/§4/§6 and the comments),
lab/sw-client.js, tests/pwa.test.mjs. Rows: R-03 (press counts windows; `force`; the pane's words; the non-asking tab's road), R-06 (install
digests the body, rejects redirected), R-08 (activate sweeps the three DATA roots; §1b sentence). Tests: pwa E5 two-window press / force;
one wrong-bytes install row; E6 picture-gone / record-kept. Gates: pwa --write, test.sh node; browser: `lw-facade` only if `LW.sw` changes
(re-capture with --write and say the diff). No draw, no literal, no store.

**CHAIN B — THE BOOT, THE RESTORE, THE WORD.** Files: lab/settings-store.js, lab/shell/persist.js, lab/rack.js (two lines: the belt at :328,
the banner in the finally at :626), lab/projects.js (R-12 app side), lab/main.js (none expected). Rows: R-02 (read() returns `{}` for a
non-object), R-04 (Number.isFinite coercion at the three Object.assign sites + the belt), R-11 (the second identical fault → banner.warn),
R-12 app side (copy the unreadable record to `.failed` in resume's take; keep :303 true). Tests: a node row for `'null' '[]' '5'`; a node row
over restore with `{ domain: { half: null } }`; a browser assertion two faults → banner visible; the session-future node row asserting
`.failed` and armed() false. Gates: pwa --write, test.sh node; rack.js touched → `node tools/rack-deps.mjs --classes --no-write` HOLDS and the
dependency-cruiser cycle count (0 app-side); persist.js touched → `node tools/settings-probe.mjs`, `tools/serialize-bytes.mjs`,
`node tools/new-project.mjs --check`; applyRebuild touched → THE LOCK on an own server, both fixtures (843 · 0 and 987 · 0); browser suites
`history`, `project-formats`, `start`, `render-regressions`.

**CHAIN C — THE VOLUMES AND THE STORED COLLECTION.** Files: lab/volumes.js, lab/project-store.js, tests/volumes*.test.mjs,
tests/project-formats.test.mjs. Rows: R-07 (sha in the put headers; stale = not kept on all four reads; a stale index.json replaced), R-21
(installMolecule collects `failed`), R-24 app side (data:image thumb only). Tests: one per road for the stale entry; keepData stubbed false;
a non-data thumb reads ''. Gates: pwa --write, test.sh node; browser `chem`, `library`, `picker-looks`, `register`. No label changes.

**CHAIN D — THE FIELD AND THE FILM.** Files: lab/field.js (a `reconfigure()`/`tapOn` on createField), lab/capture.js (configureCopy and the
PICTURE road), lab/render-exact.js (after()), lab/node-shader.js (bake()'s reusable buffers), lab/film-bake.js (the un-premultiply moved to
the TONE pass's target write), tests/film-handover.browser-test.mjs or a short new browser row. Rows: R-01, R-23. Tests: SHADER node + 1-s
clip + a picture → 0 uncapturederror, presents > 0; `tools/perf/film-bake.mjs shaders` byte-identical. Gates: pwa --write, test.sh node
(`render-exact`); THE LOCK on an own server, both fixtures; browser `film-handover`, `timeline`, `curves` and `node tools/x-probe.mjs x4`
(the byte-identical CURVES proof); `tools/perf/film-probe.mjs`; `lw-facade` if `__LW` grows a name. rack-deps and the cycle count if a shared
name moves. One browser at a time, own ports, stopped by pid.

**CHAIN E — THE TOOLS AND THE GATES (nothing under lab/).** Files: tools/gate/server.py, tests/gate-tools.test.mjs, tests/wiring.test.mjs,
tools/state-scopes.mjs, tests/provenance.test.mjs, tools/changelog.mjs, tools/perf/digest-lock.mjs (or docs/laws/field-and-lock.md per CALL 3),
package.json + package-lock.json, tools/platform/electron/package.json + lock + package.mjs, tools/gemma/broker.py + docs/GEMMA.md (per CALL 2),
.github/workflows/verify.yml. Rows: R-05 (the named-import pass), R-10 (unquote + normpath), R-13 (wrangler 4.156.0, drop the sharp
override), R-14 (per CALL 2), R-22 (per CALL 3), R-25 (the literal sweep), R-26 (pyscf-table --check wired), R-27 (CITATION/CHANGELOG regex
in changelog --check, in verify.yml), R-29's package.mjs half (SOURCE.md, LICENSE, NOTICE in the package), R-30 (electron 44.10.0). Tests:
each row's own; the mutation scratch for R-05 (MISSING: 1 on a dropped export); 404 rows for `/%2Eclaude/` and `/lab/%2E%2E/%2Etmp/`;
`npm audit` 0 in both packages; `node smoke-run.mjs` 17/17. Gates: `./test.sh node` (the new judges run inside it); no lab/ edit, so no pwa
--write, no LOCK. Order with CHAIN F: E lands changelog.mjs's judge before F regenerates CHANGELOG.md.

**CHAIN F — THE WORDS THAT SHIP.** Files: NOTICE, README.md, CITATION.cff, CHANGELOG.md (regenerated by `node tools/changelog.mjs`, not hand
edited), SECURITY.md, RELEASING.md, DEPLOY.md, docs/SHIPPING-READINESS.md, docs/ACCEPTANCE-MATRIX.md, LEGAL-PROVENANCE.md, lab/manifest.webmanifest,
lab/index.html (og:title), lab/mir-gui.js (ABOUT `extra` for the info faces), docs/NOTES-FOR-AGENTS.md and CLAUDE.md:6 (the kit sentence),
store/apple/CHECKLIST.md:37. Rows: R-15, R-16, R-17, R-18 (per CALL 4), R-19 (per CALL 1), R-20 (per CALL 5), R-28, R-29's matrix half. Tests:
R-27's judge green after R-17; `node tools/changelog.mjs --check` green. Gates: lab/ touched (manifest, index.html, mir-gui.js) → pwa --write,
test.sh node; `node tools/hints-census.mjs --check` runs inside test.sh; mir-gui.js is app-side (not lab/mir), so no adopt --check; label
renames only — no saved key, window id, target id or CSS hook moves. Browser: `official-defaults-palette` and `start` for the ABOUT face.

Merge order: E (the judges), then A · B · C · D in parallel, then F last so its documents name the fixed tree and the regenerated
CHANGELOG. The 1.0 cut follows the last HIGH (R-01, R-02, R-03) merged green and CALL 1 answered.
