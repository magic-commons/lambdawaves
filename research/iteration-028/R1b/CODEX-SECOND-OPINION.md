## Codex findings (verbatim)

### R1b-01 — Cross-tab takeover breaks the per-session build boundary

- id: R1b-01
- severity: HIGH
- status: PLAUSIBLE
- file:line: `lab/sw.js:560-563,625-647`; `lab/sw-client.js:185-190`; `lab/main.js:142`
- concrete failure scenario: Tab B is running the old build with unsaved work. Tab A accepts the waiting build. The waiting worker calls `skipWaiting()`, which changes the service-worker controller for the origin; Tab B deliberately does not reload and is only told “RELOAD WHEN READY”. Its old JavaScript can therefore continue while requests are served by the newly active worker and its new cache. A lazy import or an asset request can become a mixed-build request; if the old cache was deleted and the device is offline, a miss falls through to a network fetch and fails. The comments’ “only the tab that asked reloads” rule cannot make service-worker control per-tab.
- fix sketch: Make update acceptance origin-wide: coordinate all controlled clients and reload them together, or keep the previous build cache until no client is controlled by it. Do not promise that a non-asking tab continues on its old build after another tab sends `skipWaiting()`.

### R1b-02 — The optional ASK broker is an unauthenticated LAN GPU/API endpoint

- id: R1b-02
- severity: HIGH
- status: PLAUSIBLE
- file:line: `tools/gemma/broker.py:24-33,183-215,226-233`; `lab/ask.js:10-25`; `docs/GEMMA.md:75-79`
- concrete failure scenario: When the broker is started, it listens on `0.0.0.0:9443`, answers `Access-Control-Allow-Origin: *`, and has no authentication or rate limit. Any Wi-Fi peer, or a web page whose user has accepted the self-signed certificate, can POST arbitrary prompts/history/inventory, read the JSON response, consume the workstation’s Ollama/GPU capacity, and cause raw user text and model output to be appended to `~/.cache/lambdawaves-gemma/log.jsonl`. The normal PWA currently has `ASK_ENABLED = false`, so this is conditional on starting the tool or re-enabling the feature, not a current browser-path exploit.
- fix sketch: Bind to `127.0.0.1` by default; make LAN use an explicit opt-in with a short-lived pairing token, an Origin allowlist, firewall guidance, request concurrency/rate limits, and no wildcard CORS. Make raw prompt logging opt-in and redact or bound it.

### R1b-03 — Volume cache entries can survive a volume revision as stale bytes

- id: R1b-03
- severity: HIGH
- status: PLAUSIBLE
- file:line: `lab/volumes.js:42-65,99-117,157-173,222-236,276-293,311-320`
- concrete failure scenario: A publisher reuses a volume id and molecule path but publishes a new catalogue and a new `sha256`. `install()` treats an existing URL key as complete and skips the file without comparing its bytes to the new catalogue. If `indexSha256` is absent, `indexBytes()` also accepts the cached index without validation. Later `file()` can discover the old `.lwm` hash mismatch, delete it, and then fail offline; the UI can previously have reported the volume as installed. The same cache name `lw-vol-<id>` is retained across builds.
- fix sketch: Require a revision/hash for every network volume; include the revision in the cache name or metadata; validate every existing molecule entry against the current catalogue hash before counting/skipping it; replace stale index and molecule records transactionally, and make “installed” mean hash-verified, not URL-present.

### R1b-04 — Precache installation does not verify the response body against `__rev`

- id: R1b-04
- severity: MEDIUM
- status: PLAUSIBLE
- file:line: `lab/sw.js:518-520,533-547`; `tests/pwa.test.mjs:577-591`; `tools/build-deploy.mjs:381-409`
- concrete failure scenario: A misbehaving edge/proxy/origin returns an older 2xx body for a new `?__rev=<expected-hash>` request. The worker checks only `res.ok`, stores that body under the clean URL, and gives the cache a name derived from the expected hashes. The install succeeds with a cache containing bytes from different builds, while the build-side checks only compare files already assembled on disk.
- fix sketch: Buffer each install response, hash it, and compare the digest (at least the recorded 12-hex prefix) before `cache.put`; reject redirected or otherwise unexpected responses as well. Keep the query/cache-reload busting as an optimization, not as the integrity check.

### R1b-05 — Imported notebook Markdown can make automatic cross-origin image requests

- id: R1b-05
- severity: MEDIUM
- status: PLAUSIBLE
- file:line: `lab/mir/shell/notebook-render.js:5-25,34-69`; `lab/shell/notebook.js:211-214`; `lab/mir/shell/vendor/marked.min.js:2`; `lab/mir/shell/vendor/katex/katex.min.css:1`; `lab/mir/shell/notebook-math.js:8-10`
- concrete failure scenario: A hostile `.lambdawaves.json` carries notebook Markdown such as `![](https://attacker.example/pixel)`. marked 12.0.2 emits an image, and the sanitizer allows `IMG src` unless it uses `javascript:`, `data:`, `vbscript:`, `file:`, or `blob:`. Previewing the notebook therefore performs the attacker’s request automatically, leaking a visitor’s IP/timing and enabling browser-origin CSRF attempts against reachable HTTP services. This is not a demonstrated script-XSS path: event/style attributes are removed and KaTeX 0.16.11 is rendered with `trust: false`.
- fix sketch: Strip images from imported notebook content, or permit only same-origin HTTPS image URLs (and set a restrictive image referrer policy). Keep the existing element/attribute allowlist and KaTeX `trust: false`.

### R1b-06 — Page-owned DATA caches have no global eviction, and basis-cache failure can be reported as success

- id: R1b-06
- severity: MEDIUM
- status: PLAUSIBLE
- file:line: `lab/sw.js:455-480,560-564,598-600`; `lab/library.js:151-173`; `lab/picker.js:281`; `lab/emissionview.js:229`; `lab/volumes.js:194,241,297-299`
- concrete failure scenario: Repeatedly viewing menu images, NIST lines, and installing volume/library content grows `lw-data-v1` and `lw-vol-*` caches across application builds. There is no global byte budget or eviction policy. Once storage is tight, `keepData()` can fail; `installMolecule()` ignores the result when keeping basis records and still returns `{ ok: true }`. The user can then be told that a molecule installed while its offline basis data is absent, and a later offline open fails.
- fix sketch: Separate explicit downloads from opportunistic media, enforce a quota-aware budget with LRU/revision cleanup, and propagate every `keepData()` failure into the install result. Track DATA revisions so obsolete generic assets can be removed without deleting content-addressed records.

### R1b-07 — Project import is only shallowly validated before hostile nested state is persisted

- id: R1b-07
- severity: LOW
- status: PLAUSIBLE
- file:line: `lab/project-store.js:38-54,136-149`; `lab/projects.js:312-320`; `lab/shell/persist.js:191-199,279-299,343-348`
- concrete failure scenario: An attacker supplies an otherwise valid, size-bounded project whose `data` object contains malformed deep `presentation`/`instruments` shapes or reserved keys such as `__proto__`. The importer stores that object before opening it; restore then applies broad `Object.assign()` operations and invokes downstream loaders. A malformed record can cause a partial restore, repeated restore failures, or poisoned persistent project data even though the catch reports only “restore failed”. I did not verify a code-execution or prototype-pollution chain to a browser XSS sink.
- fix sketch: Validate the complete project schema before `files.save()`: bounded depth/arrays, finite numeric fields, allowlisted object keys, and rejection of `__proto__`, `constructor`, and `prototype`. Restore only a clean copy and do not persist a file that fails the same schema.

## What was checked and found sound

- The precache list is content-hash checked, sorted, duplicate-checked, and capped below 8 MiB; the test also rejects a missing or stale entry and refuses to precache `sw.js` itself (`tests/pwa.test.mjs:282-320`).
- The worker fetch handler does not runtime-cache arbitrary URLs, refuses non-GET, Range, cross-origin, out-of-scope, and unlisted requests, and the matrix is designed for both `/lab/` and `/` (`lab/sw.js:568-603`; `tests/pwa.test.mjs:614-671`).
- A 404 is not cached during precache: installation rejects any non-OK response (`lab/sw.js:542-547`). Library records also require an exact SHA-256 match before they are stored or opened (`lab/library.js:111-133`; `lab/mathworker.js:295-305`).
- The current deployment routing avoids the redirected-navigation trap: `html_handling` is `none`, `/` is a 200 rewrite, and there is no SPA catch-all (`wrangler.jsonc:68-96`; `dist/_redirects:4-11`; `dist/_headers:25-33`). Build V1/V2/V6 checks tie the upload, references, and Wrangler configuration together (`tools/build-deploy.mjs:381-412,414-511,633-684`).
- `activate` deliberately deletes only `lw-lab-*` caches, preserving `lw-data-v1`; the service-worker test explicitly checks that behavior (`lab/sw.js:560-564`; `tests/pwa.test.mjs:724-741`). The volume revision caveat is R1b-03, not a claim that the prefix sweep itself deletes DATA.
- Project files are bounded to 8 MiB, require the λWAVES project marker, restrict the version and notebook field types, and refuse writes when the stored collection is invalid (`lab/project-store.js:38-54,99-121,136-149`).
- The `lw:`/fragment codec uses base64url, CRC32, length checks, duplicate-section checks, bounded literal names, and refuses unsupported/corrupt input (`lab/statelink.js:118-129,170-187,436-465,656-668`). Link status text is escaped before the one dynamic note sink (`lab/shell/links.js:24-31,41-54,61-86`).
- Notebook rendering removes unapproved tags and attributes, blocks the dangerous URL schemes, forces external anchors to `noopener noreferrer`, and expands math only in text nodes after sanitization (`lab/mir/shell/notebook-render.js:5-31,46-69`; `lab/mir/shell/notebook-math.js:3-11`).
- The non-vendor HTML sink sweep found no `document.write` or `srcdoc` use. Generated labels and volume metadata go through text nodes (`lab/mir/kit.js:57-85`; `lab/picker.js:618-626`), and the dynamic history label is escaped for both text and title contexts (`lab/shell/history.js:146-150`).
- Volume paths and archive members reject absolute paths and `..`; record bytes are checked before volume molecule files are opened (`lab/volumes.js:44-65,99-117`; `lab/volumes-format.js:119-131`; `lab/volumes.js:311-320`). The remaining weakness is optional-field/schema validation, covered by R1b-03 and the `tags` crash path noted in the review.
- ASK is currently disabled in the shipped client, so the broker finding is conditional rather than an active normal-PWA request path (`lab/ask.js:4-11`; `docs/GEMMA.md:3-9`).

Verification note: `node tests/pwa.test.mjs` passed its manifest and icon checks here, then its internal `execFileSync()` call to the sibling wiring test was rejected by the execution sandbox with `EPERM`. I therefore treated the remaining worker assertions as source-reviewed, not as a green end-to-end run.

## Top five

1. R1b-01 — cross-tab update takeover and mixed-build execution.
2. R1b-02 — unauthenticated wildcard-CORS LAN broker.
3. R1b-03 — volume cache revision/stale-byte handling.
4. R1b-04 — precache body is not checked against its content hash.
5. R1b-05 — imported notebook images make cross-origin requests.
