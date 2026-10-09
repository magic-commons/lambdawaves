<!-- 0.5.0 · read-only security and abuse review, 2026-10-08, by a 120-agent workflow (seven finders, two refuters per finding, one synthesis; Opus) run by Claude Sos on sos-s0 at 7044f37; answers Josh's question of 2026-10-08. Nothing in lab/ changed. -->

# λWAVES security review: production site, local servers, cache and stored data

**Scope.** This was a read-only review of the `sos-s0` worktree on 2026-10-08. Nothing was edited, no server was started and no browser was opened. Some reviewers sent HEAD requests to the gate server that was already running on 10.0.0.18:8711, and one sent a `curl -I` to the live site. Those results are marked MEASURED below.

**Tags.**
- **MEASURED** means read in the tree or seen on a running process.
- **DERIVED** means reasoned from the code or taken from published documentation; it was not observed.
- **PRODUCTION** means the Cloudflare deployment at lambdawaves.magic-commons.com.
- **LOCAL** means the Python servers on your LAN and on localhost.

**One correction to the brief.** `lab/md.js` is not the markdown sanitiser. It holds the McMurchie-Davidson integrals (md.js:1, MEASURED). The sanitiser is `lab/mir/shell/notebook-render.js`, and every notebook and stage-text render goes through it (rack.js:6, stage-text.js:18, MEASURED).

---

## 1. The answer in six lines

1. **Is the setup safe from attack?** Production is in good shape. No code runs on the server, there are no accounts, and no reviewer found a way to inject script. The weak spot is local and live: the gate server on 0.0.0.0:8711 is serving your whole worktree to the Wi-Fi, including its TLS private key (MEASURED).
2. **Could anyone DDoS you?** Not in production in any way that costs money or takes the site down. Requests for static assets are free, unlimited and absorbed at Cloudflare's edge (DERIVED, from Cloudflare's published pricing). The LAN server can be frozen by one idle TCP connection from any device on the Wi-Fi (DERIVED, from the code; not run).
3. **Could anyone abuse you?** Nobody can write to production or run up your bill. On the LAN, anyone on the same network can read the worktree. While `serve-lan.py` is running, they can also fill your disk 2 MB at a time (MEASURED code path).
4. **Is the cache safe?** Yes. It holds only your public app files and public molecule records. They are same-origin, stored under content-hash names, and checked again on every read. No user data is in it, and no outside site can write to it (MEASURED).
5. **Project saving and stored info.** Projects, notebook and settings stay in the visitor's own browser (localStorage) and never leave the device. Imports are validated before anything is stored. Two real limits remain: a crafted project file can freeze the visitor's tab, or make it load a tracking image (MEASURED path; the freeze is partly DERIVED).
6. **Dumping info and request limits.** Data leaves only when the user presses EXPORT or COPY. The app needs no request limits in production because there is nothing to limit. Limits belong in Cloudflare if you ever add a Worker script, and on the LAN servers now.

---

## 2. What is already safe, and why

### Production hosting

- **No server-side code.** wrangler.jsonc:6 says `// ASSETS-ONLY, DELIBERATELY. There is no "main", so there is no Worker script`. The build prints a NOTE if a `main` ever appears (build-deploy.mjs:640). (MEASURED)
- **No write endpoint.** Nothing accepts a POST. The device-report module is not shipped: `ls dist/tools` finds nothing, and build-deploy.mjs:445-446 lists it as DEV_ONLY. `?report=1` in production therefore fails with a 404 on the import. (MEASURED)
- **One origin.** `"workers_dev": false` (wrangler.jsonc:40). The dev environment has not been deployed since 2026-09-12 (wrangler.jsonc:47). (MEASURED)
- **No home IP behind the site.** dist/ is uploaded to Cloudflare, and a grep of dist/ for 10.x and 192.168.x addresses returned nothing. (MEASURED)
- **Honest 404s.** `"not_found_handling": "404-page"` (wrangler.jsonc:96), and the only `_redirects` rule is `/ → /index.html 200`. (MEASURED)
- **Headers already shipped:** `Cache-Control: public, max-age=0, must-revalidate`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` (dist/_headers:30-33, generated at build-deploy.mjs:288-291). (MEASURED)
- **Leaving out COEP is correct.** The build fails on any `SharedArrayBuffer`, `crossOriginIsolated` or `Atomics` (build-deploy.mjs:585-586). (MEASURED)
- **The build refuses to ship secrets.** It rejects symlinks and `.pem`, `.key`, `.p12`, `.pfx` and backup files (release-inputs.mjs:9, :14), and calls `assertPublicTree` (build-deploy.mjs:173). (MEASURED)
- **HTTPS redirect is on.** `curl -I http://lambdawaves.magic-commons.com/` returned `301 → https://` (MEASURED, live).
- **A strict CSP would need no code change.** index.html has no inline scripts and no `on*=` or `style=` attributes. Its only scripts are src= tags at lines 5, 71, 72 and 189. marked and katex contain no `eval` or `Function`. (MEASURED)

### The service worker and the cache

- **It never answers cross-origin, write or partial requests.**
  - sw.js:350 `if (req.method !== 'GET') return;`
  - sw.js:351 refuses Range requests.
  - sw.js:354 `if (url.origin !== self.location.origin) return;`
  - Install rejects any non-ok response, including opaque status 0 (sw.js:305). (MEASURED)
- **There is no runtime cache.** sw.js:360 `if (!BY_PATH.has(url.pathname)) return; // not ours: network, and store nothing`. tests/pwa.test.mjs:636 asserts that the cache does not grow. (MEASURED)
- **Query strings cannot fork the cache.** Lookup is by pathname only (sw.js:289) and entries are stored under the clean URL (sw.js:306). (MEASURED)
- **Navigations are served from cache only for `/` and `/index.html`** (sw.js:356, :286). The test matrix runs at the `/` mount, which is what ships (pwa.test.mjs:645). (MEASURED)
- **The cache name comes from content hashes.** Activate deletes only stale `lw-lab-*` caches (sw.js:278-279, :322, test at pwa.test.mjs:566). (MEASURED)
- **Molecule records are checked on every read.** A tampered copy is deleted (library.js:98-99), and a download whose bytes don't match its name is refused (library.js:112). (MEASURED)
- **Updates cannot be forced from outside.** There is exactly one `skipWaiting()`, it runs only from a same-origin message (sw.js:405), and the code has no `clients.claim`. (MEASURED, asserted at pwa.test.mjs:685-687)
- **No user data in Cache Storage.** Only library.js:87 and sw-client.js:171-172 touch it, and UPDATE APP deletes only `lw-lab-*`. (MEASURED)
- **The service worker reduces load.** Update checks happen at most every 30 minutes and only when the tab is visible (main.js:106). A retry refetches only the missing files (sw.js:303). (MEASURED)

### Stored data: projects, settings, library

- **Nothing leaves the device.** Every fetch in lab/ is a same-origin GET with no body. A grep for sendBeacon, XMLHttpRequest, WebSocket, EventSource, cookies, indexedDB and sessionStorage in lab/ found no use of any of them. (MEASURED)
- **Where data lives:**
  - localStorage keys are listed at settings-store.js:11-20.
  - Cache Storage holds public files only.
  - The undo ring is in memory only (history.js:18, depth 60 at rack.js:4990).
  - Exports and clipboard copies happen only when the user presses a button (rack.js:4027, 4072, 4078, 4737, 4939).
  - (MEASURED)
- **What an export contains.** An exported project carries its path, its timestamps and the full notebook text. COPY DUMP adds the GPU adapter and user agent (rack.js:3993, 4076). (MEASURED)
- **Share links carry physics only.** They have no notebook and no project name. They live in the `#` fragment, which is never sent to a server, and the decoder bounds-checks every field (statelink.js:92, :179, :436-541). (MEASURED)
- **Corrupt storage is never overwritten with an empty collection** (rack.js:3873, project-storage.js:3). The tests are green: tests/project-import.test.mjs and tests/project-storage.test.mjs. (MEASURED)
- **No global prototype pollution through save or import.** Saving uses computed keys and `Object.defineProperty`, and lookups use `Object.hasOwn` (project-import.js:61-62, rack.js:3939). The tests cover `__proto__` and `toString`. (MEASURED)
- **Imports are validated before storage.** The 8 MiB cap is checked before the file is read (rack.js:4028), the envelope fields are type-checked, and unknown keys are dropped (project-import.js:38-52). (MEASURED)
- **Opening a project rolls back on failure** (rack.js:3950-3965), and a link cannot write into settings (rack.js:4967). (MEASURED)

### Rendering untrusted text

- **The notebook sanitiser is an allowlist over an inert template.**
  - It parses into a `<template>` (notebook-render.js:12-13).
  - It removes any tag not on the allowlist, so no svg, math, script or style survives (:16).
  - It removes any attribute not on the allowlist, so no `on*` handlers and no `style` survive (:21).
  - It blocks `javascript:`, `data:`, `vbscript:`, `file:` and `blob:` URLs after stripping control characters (:10, :22).
  - It forces `rel=noopener noreferrer` on links (:25).
  - (MEASURED)
- **KaTeX runs with `trust: false, output: 'html'`** (notebook-math.js:9). The vendored version is 0.16.11, which is past the 2024 CVE fixes. Math is expanded only into text nodes (notebook-render.js:47-49). (MEASURED)
- **Every other innerHTML site is safe.** I classified about 63 sites. Each one is a constant, a number, an escaped string (`esc()` at rack.js:4961, 4973, 5112) or sanitised output. Names reach the page only as `textContent` (kit.js:59, rack.js:3924). (MEASURED)
- **URL parameters are allowlisted or gated.**
  - `?preset` must be in `PRESET_BY_ID` (rack.js:5396).
  - `?warn` and `?motion` work only under `navigator.webdriver` (rack.js:5499, motion-pref.js:28).
  - `?sw=0` only skips registration (main.js:50).
  - (MEASURED)

### Workers and messages

- **There is no window `message` listener, no BroadcastChannel and no SharedWorker.** The only message channels are the service worker's (main.js:84, sw.js:386) and the dedicated maths worker's (rack.js:548, mathworker.js:98). Another site can neither frame-script nor message the app. (MEASURED)
- **The app loads no remote code.** It has no eval, no `new Function`, and only fixed relative `import()` calls. Fonts and libraries are vendored. (MEASURED)

### Limits that already hold against hostile content

- **SCF iterations** are capped at 200 (rhf-molecule.js:206, scf.js:74).
- **Real-time steps** are capped at 200,000 per request (mathworker.js:531).
- **Live molecules** come only from the built-in table (chemview.js:797), and 6-31+G* is limited to 46 AOs (molecules.js:514).
- **GPU kernel loops are bounded:**
  - `MAX_MODES = 320` (field.js:24)
  - the ray-march loop stops at 512 steps (field.js:396)
  - molecule AO, shell and primitive limits (field.js:742-743)
  - DPR cap of 0.5 to 4 (field.js:1690)
- **Grid ceilings** are 64 on phones and 96 on tablets (first-run.js:55).
- **Import and display caps:**
  - import 8 MiB (project-import.js:5)
  - notebook preview 200,000 characters (rack.js:3866)
  - nothing reopens the last project at boot (rack.js:2954)

All of these are MEASURED.

### LOCAL: what already holds

- **The gate server binds loopback by default.** server.py:32 `HOST = os.environ.get("LW_HOST", "127.0.0.1")`, and test.sh:39 never sets LW_HOST. (MEASURED)
- **No path traversal.** Every encoded `..` probe against 10.0.0.18:8711 returned 404, and the tree has no symlinks. (MEASURED, live)
- **The gate server accepts no writes.** It has no `do_POST`, `do_PUT` or `do_DELETE`, so those requests get 501 (server.py:51-56). (MEASURED)
- **The `/report` write in `serve-lan.py` cannot escape its folder or overwrite files.** The label is sanitised (:46), the file is opened with `"xb"` (:52) and the extension is fixed to `.json`. (MEASURED)
- **Other websites cannot read either server.** Neither sends CORS headers, and DNS rebinding fails because the certificate names only 127.0.0.1 and localhost. (MEASURED)
- **Browser-automation ports are loopback only** (drv.mjs:19, cdp.mjs). (MEASURED)

---

## 3. What to fix, in order

Only findings that survived verification are listed here. Per your rule, these land in a local release cut and are not pushed before the plan finishes.

### 1. The LAN server publishes the whole worktree, including its TLS private key

- **Scope and severity:** LOCAL, medium.
- **Attack:** while 8711 runs with `LW_HOST=0.0.0.0`, anyone on the Wi-Fi can browse and download the following, with no login and no log:
  - `/.certs/key.pem` (MEASURED 200, 1704 B)
  - `/.claude/handoffs/latest.md` (agent notes, including server PIDs)
  - `/.tmp/` logs
  - `/research/`
  - unpushed work
- **What the key gives an attacker:** someone who can also intercept traffic on the LAN (for example by ARP spoofing) can impersonate the dev server to an iPad that already clicked through its certificate warning. That reaches only the dev origin's projects and service worker. The certificate is `CN=127.0.0.1` with `CA:TRUE` and is trusted by nothing on this machine (MEASURED). I did not check the iPad.
- **Code:** server.py:29 puts `CERTS` inside the repo root, and :30 and :52 serve that same root. `serve-lan.py:24` also serves its repo root, although its own key lives outside it.
- **Fix:**
  - In handler `H` of both servers, return 404 for any path segment that starts with `.`, and override `list_directory` to return 404.
  - For non-loopback clients, allow only `/lab/` and `/tools/perf/`. The lab's only import from outside `lab/` is `../tools/perf/device-report.js` (MEASURED).
  - Default `CERTS` to `~/.config/lambdawaves/certs`.
  - Add `-addext basicConstraints=critical,CA:FALSE` to the openssl arguments at server.py:39-41.
  - Treat the current key as burned: delete `.certs/` so it regenerates, and clear the iPad's exception for 10.0.0.18:8711.
- **Size:** about 8 lines per server, plus a restart.

### 2. The LAN server listens on every interface and the host firewall is off

- **Scope and severity:** LOCAL, low.
- **Attack:** whatever network the laptop joins (home, café, school) can reach 8711. Evidence:
  - `ss` shows `0.0.0.0:8711` held by pid 2266541, which has run since 2026-10-08 03:05 (MEASURED).
  - `/etc/ufw/ufw.conf` has `ENABLED=no`, and firewalld and nftables are inactive (MEASURED).
  - `serve-lan.py:70` binds 0.0.0.0 unconditionally.
- **Fix:** start the LAN copy only while the iPad is in use, and keep 8721 (loopback) for everything else. Allow only the iPad through the firewall:
  ```
  sudo ufw default deny incoming && sudo ufw allow from <iPad IP> to any port 8700:8799 proto tcp && sudo ufw enable
  ```
  Add rules first for anything else that needs inbound access, or it stops answering. A per-run token is optional (about 10 lines).
- **Size:** one command.

### 3. One idle TCP connection freezes either LAN server for everyone

- **Scope and severity:** LOCAL, low.
- **Attack:** `nc 10.0.0.18 8711` with nothing typed parks the single accept loop in the TLS handshake, which has no timeout.
  - server.py:62 and serve-lan.py:73 wrap the listening socket.
  - Python 3.14's `ssl.py:1417-1421` runs the handshake inside `accept()`.
  - This is DERIVED from the code and was not run.
  - A returning iPad still opens the lab from its service-worker cache. What blocks is new builds and records that are not yet cached (DERIVED).
  - Production is unaffected.
- **Fix:**
  - `ctx.wrap_socket(..., server_side=True, do_handshake_on_connect=False)`
  - In `H`: set `timeout = 15` and do the handshake in `setup()`.
  - Optionally cap threads with a `BoundedSemaphore(32)`.
- **Size:** about 12 lines per server.

### 4. `serve-lan.py` `/report` takes unlimited, unauthenticated writes into a git-tracked folder

- **Scope and severity:** LOCAL, low.
- **Attack:** while `serve-lan.sh` runs, any LAN device can loop 2 MB POSTs into `research/device-reports/`.
  - There is no token, no Content-Type check and no count or rate cap (serve-lan.py:30, :36, :52).
  - 1.4 TB is free, so filling the disk takes hours (DERIVED), and every write prints the sender's IP (:59).
  - The folder is tracked (11 files, MEASURED). A careless `git add` would therefore publish planted JSON, and `device-report-summary.mjs` would feed it to an agent.
  - Separately, `device-report.js:1123` POSTs by default from any private-LAN host. That data goes only to your own origin.
  - The server is not running now (MEASURED: nothing listens on 8710).
- **Fix:**
  - Require `Content-Type: application/json`. That forces a CORS preflight, which kills drive-by posts from web pages.
  - Lower `MAX_REPORT` to 512 KB, still more than twice the largest real report (204,689 B, MEASURED).
  - Require `kind == 'lambdawaves-device-report'`.
  - Cap at about 50 files per run and allow one per IP per 10 s.
  - Write to a gitignored inbox and move files into the tracked folder by hand.
  - Make the POST opt-in only: `post = qs.get('post') === '1'`.
- **Size:** about 10 lines.

### 5. Neither LAN server keeps an access log

- **Scope and severity:** LOCAL, low.
- **Attack:** this enables nothing by itself, but it is why nobody can tell whether the key or the handoff has already been fetched. server.py:56 and serve-lan.py:27 both define `log_message(...): pass`. After about 18 hours, the 8711 log holds only its startup banner (MEASURED).
- **Fix:** log non-loopback clients to stderr (two lines in `log_message`).
- **Size:** 2 lines.

### 6. A crafted link can set any grid size or render scale and exhaust the visitor's GPU

- **Scope and severity:** BOTH, low.
- **Attack on grid size:** a `#s=` link with `quality.res = 1024` on a desktop asks for two 1024³ rgba16float textures, about 8 GiB each (DERIVED). The path:
  - statelink.js:550 decodes `res` as an unchecked u16.
  - first-run.js:63-64 caps it only on phones and tablets.
  - field.js:1040 allocates.
- **Attack on render scale:** scale, autoScale and minScale are unclamped f32 values. A scale of 4 gives about a 16× canvas (rack.js:859, field.js:1695). This affects phones too.
- **Effects:**
  - The fragment re-opens at every boot (rack.js:5438), so RELOAD repeats the failure until the fragment is deleted.
  - The result is out-of-memory, a black stage or device loss in the visitor's own tab. Device loss was not run, so it is DERIVED.
  - No data is lost, and nothing reaches your server.
  - A numeric string `res` also slips past the phone cap (DERIVED).
- **Fix:** in `deviceQuality` (and again in the statelink decoder), on every device:
  - snap `res` to {64, 96, 128}
  - clamp `scale` to [0.25, 1], `autoScale` to (0, 1] and `minScale` to [0.1, 0.9]
  - clamp `steps` to [16, 512]
  - add tests/gpu-recovery cases for res 0, 1024 and "512", and for scale 8 with minScale 1
- **Size:** about 5 lines.

### 7. `domain.half` from a link or project can hang the tab

- **Scope and severity:** BOTH, low.
- **Attack:** statelink.js:549 decodes `half` as an unchecked f32, and rack.js:4773 copies it in. With `auto = 0` and `half = 1e30`, the radial loop in `stretchedCensus` (frontier.js:506, `r += 2e-3` up to `rMax`) effectively never ends on the main thread.
  - This needs VORTEX open and three stretched modes.
  - A project file can open VORTEX itself through its layout. A link cannot carry a layout.
  - DERIVED; not run.
- **Fix:** accept `half` only if it is finite and within [3, 140] (the knob's range), in both statelink.js:549 and rack.js:4773. As a second guard, cap `rMax` in `stretchedCensus`.
- **Size:** 1 to 2 lines.

### 8. A crafted project file can freeze the tab on open

- **Scope and severity:** BOTH, low. Each case needs the victim to IMPORT a file and then open it; links cannot carry these values.
- **Particles:** a count of `1e8` passes `Number.isFinite` (rack.js:4848) and reaches the synchronous rejection loop at particles.js:48. The knob range is 20 to 600 (rack.js:2168). MEASURED path.
- **LADDER:** `ladder.js:167` does `Object.assign(P, p)` with no clamp. A large `sigma` makes a huge packet (frontier.js:130). A node run measured about 83 s per solve at sigma = 1e5 (MEASURED). After the 8 s worker timeout, worker-pool.js:53 re-runs the job on the main thread.
- **KaTeX macros:** notebook-math.js:8-9 passes no `maxExpand` or `maxSize`. Measured with the vendored KaTeX 0.16.11:
  - 1,108 characters took 2.5 s
  - 1,208 characters took 5.9 s
  - 908 characters took 7.5 s (a 400-character body used 250 times)
  - 50,000 plain `x` with no macros took about 2.1 s
- **Recovery:** a reload recovers in every case, because nothing reopens the last project at boot.
- **Fix:**
  - Clamp the particle count to [20, 600] and the LADDER fields to their knob ranges in `load()` and `set()`.
  - Do not fall back to the main thread on `r.error === 'timeout'`.
  - For KaTeX, fix in MIR first and then adopt (adopted lab/mir files must not be edited directly): pass `maxExpand: 50` and `maxSize: 20`, and cap formulas per preview (about 300) and total TeX length (about 20k characters).
- **Size:** small, about 10 lines plus one MIR adopt.

### 9. Notebook images load from any https host (a tracking pixel)

- **Scope and severity:** BOTH, low.
- **Attack:** an imported project whose notebook contains `![](https://tracker.example/p.gif)` makes the browser fetch that image on open.
  - notebook-render.js:8 keeps `IMG src`, and :10 lets https through.
  - rack.js:3978 opens projects in view mode.
  - The sender learns the visitor's IP address, user agent and the time they opened it. The Referer is origin-only.
  - No script runs. Links cannot carry notebook text.
- **Fix:** add `img-src 'self' data: blob:` in a CSP; a full CSP line costs little, as the refuted CSP findings below note. Alternatively, keep `IMG src` only when it is same-origin. That change goes in MIR first, then adopt.
- **Size:** one line.

### 10. No HSTS header

- **Scope and severity:** PRODUCTION, info.
- **Attack:** someone on hostile Wi-Fi answers the visitor's very first `http://` request with a fake page. The live site sends no `strict-transport-security`, and the parent domain doesn't either (MEASURED, `curl -I`).
  - The fake page is a different origin. It cannot read saved projects or use WebGPU, service workers or the microphone.
  - The impact is impersonation, not data theft.
  - "Always Use HTTPS" is on (MEASURED 301).
- **Fix:** add `Strict-Transport-Security: max-age=31536000` to the `/*` block in build-deploy.mjs. `includeSubDomains` and `preload` commit every subdomain of the zone, so decide those deliberately. Note in DEPLOY.md that Always Use HTTPS is on.
- **Size:** trivial.

### 11. No in-session recovery after GPU device loss

- **Scope and severity:** BOTH, info.
- **What happens:** field.js:813 marks the field dead and never re-acquires a device. The banner says RELOAD (rack.js:529). For a link-borne loss (items 6 and 7) that advice repeats the crash. tests/gpu-recovery.browser-test.mjs:21 tests only valid grids. SHIPPING-READINESS.md:97 already tracks device loss as an open P0.
- **Fix:** in `onLost`, record a "device lost" flag in sessionStorage. On the next boot, open at first-run quality and skip the link's quality block, and say so to the user. Make the banner say "open without the link's #s= part".
- **Size:** about 20 lines plus a test.

### Refuted

These were raised and checked, and they do not hold as attacks. Several are still cheap hardening or real usability bugs, as marked.

- **No Content-Security-Policy** (raised in four dimensions). No injection path was found. It is cheap defence in depth, and the same line would close item 9. Ship it as Report-Only first. KaTeX needs `style-src 'unsafe-inline'`.
- **Site can be framed (no `frame-ancestors` or `X-Frame-Options`).** A cross-site frame gets empty, partitioned storage, so the visitor's real projects cannot be reached. One header line hardens it.
- **No Permissions-Policy.** It only matters after an XSS, and the microphone has to stay allowed anyway.
- **No COOP or CORP.** No message listener, no iframes, no secrets; hotlinking costs nothing.
- **"Adding a Worker script would create quota risk".** True, but only your own config change can cause it. See section 4.
- **`_headers` approaching the 100-rule limit.** 21 rules today (MEASURED), and the security rule is written first.
- **The service worker replays install-time headers.** A rollout caveat with no attacker. It is worth knowing: put a future CSP in an index.html meta tag, or change some lab/ bytes with any header-only deploy.
- **Install does not hash-check bytes.** A deploy-window reliability gap; no outside party can trigger it.
- **Cache Storage writable by page script.** Only matters after an XSS, and none was found.
- **No break-glass service worker; a redirect on `/sw.js` freezes clients.** Only your own Cloudflare config can cause it. Keep `/sw.js` free of Access rules, redirects and challenges.
- **Security fixes wait for the user's UPDATE press.** A standard PWA trade-off; an emergency build can still call skipWaiting.
- **Shared-origin guard prints a note instead of failing.** The code path is dead today (OWN_ORIGIN true, dedicated custom domain).
- **Import or demo click silently replaces a same-path project.** Not an attack, but a real data-loss bug in project saving. Fix it with a confirm, or by importing under a new name.
- **A share link opened in a live tab keeps the old project current, so Ctrl+S overwrites it.** Not an attack, but a real data-loss bug. Detach the project the way NEW does.
- **Notebook writes fail silently near the storage quota while the UI says "kept in this browser".** A reliability bug; consider lowering `MAX_PROJECT_BYTES` to about 4 MiB.
- **Layout card ids go unescaped into `querySelector`.** Session-only cosmetic garble.
- **`__proto__` key through `Object.assign` on mat, obs and domain.** Local to those objects, and dropped on the next save.
- **Link-scheme blocklist lets custom protocols through.** Gives nothing a plain https link doesn't.
- **Allowed `class` attribute borrows app CSS.** Stays inside the notebook pane, and the overlay's link cannot be clicked.
- **`?view=constructor` and a basis of `constructor`.** Coerced to density, or a single same-origin 404.
- **Sanitised HTML is re-parsed (mutation-XSS precondition).** Nothing in the current allowlist can mutate.
- **`?report=1` and the `&force=1` flag.** Your own diagnostic on your own origin.
- **Chem speed and kappa unclamped; modulation deserialize uncapped; no atom cap in the chem worker.** All stay inside the visitor's tab or are unreachable from content.
- **Other 0.0.0.0 servers (8768, 8931) and the MANDELBROT CA.** Outside λWAVES, and no key is served today. See section 5.

---

## 4. Request limits and DDoS

**Production today needs no limits.**
- Every request is a static-asset request. wrangler.jsonc has no `main`, no `run_worker_first` and an `assets` block pointing at `./dist` (MEASURED).
- Cloudflare's pricing page says static-asset requests are "free and unlimited" and that "only requests that hit a Worker will count against your limits and your bill" (DERIVED, from Cloudflare's docs; not checkable from the repo).
- A flood is therefore absorbed at the edge, costs $0, uses no quota and does not take the site down. No origin or home IP sits behind it.
- Installed visitors make almost no requests: an update check at most every 30 minutes while the tab is visible (main.js:106, MEASURED).

**The app itself cannot rate-limit, and should not try.**
- A static site has no code to count requests in. The only throttles in lab/ are client-side compute throttles, such as fieldview.js:17 and chemview.js:414 (MEASURED).
- Any limit belongs in Cloudflare.

**If you ever add a Worker script (a `main`):**
- The Free plan allows 100,000 Worker requests per day, resetting at midnight UTC (DERIVED, from Cloudflare docs).
- With default routing, only requests that miss an asset reach the script. Over the limit, only the script's path gets a 429 or Error 1027; the app itself stays up.
- Because the route is `custom_domain: true` (wrangler.jsonc:45), there is no origin to "fail open" to.
- On the Paid plan, extra requests cost $0.30 per million, so 100 million junk requests would be about $27 (DERIVED).
- What to do then:
  - Scope the script to its own path.
  - Put a Cloudflare WAF rate-limiting rule on that path only. Zone rules run before the Worker, so a blocked request is never counted.
  - Set a usage notification.
  - Extend the NOTE at build-deploy.mjs:640 to mention quota and billing, not only headers.

**Optional site-wide rule now.**
- If you add one, set it well above a real cold visit. The precache list has 191 entries (MEASURED) plus about 100 ES modules, so roughly 300 requests within seconds (DERIVED).
- Many visitors can share one NAT IP, so block only above about 1,000 requests per 10 s per IP.

**LOCAL is where limits are actually missing:** the single-connection freeze (fix 3), unbounded threads, and unlimited `/report` writes (fix 4). The firewall rule (fix 2) does more than any per-IP limiter on a home LAN.

---

## 5. The LAN server

### What is running now (MEASURED)

- pid 2266541: `python3 tools/gate/server.py <sos-s0 worktree> 8711`, with `LW_HOST=0.0.0.0` and no `LW_CERTS`, listening on `0.0.0.0:8711`. The laptop's LAN address is `wlp5s0 10.0.0.18/24`. The host firewall is off.
- pid 2266539 on `127.0.0.1:8721` is loopback only and not reachable from other machines.
- `serve-lan.py` is not running.

### What anyone on the same network can do while 8711 runs

- **Read the whole `sos-s0` worktree, with directory listings.** Probed:
  - `/.certs/key.pem` returned 200 (1704 B, mode 600, but the server runs as you)
  - `/.certs/` returned a listing
  - `/.claude/handoffs/latest.md` returned 200 (account names, agent IDs, server PIDs; no credentials found by a secret-pattern scan)
  - `/.tmp/sos-node.log` returned 200 (302,752 B)
  - `/research/` returned a listing
  - `/REPORT.md` returned 200
  - `/.git` returned the 72-byte pointer file, which reveals your home path
- **What is already public anyway:** research/ is tracked (1,419 files) and the repo is public. What is private is the unpushed commits (189 ahead), .tmp/, the handoffs and the key.
- **Freeze the server** with one idle connection (DERIVED).
- **Not possible:** writing files (501), escaping the served folder, reading the server from a website (no CORS), or reaching it from the internet unless your router forwards the port. The router and UPnP were not inspected.

### Worse cases

- **Running `serve.sh` or `serve-lan.sh` from the main checkout** would also expose the real `.git/` with full history, every `.claude/worktrees/*` including their keys, `.wrangler/state` and `.claude/settings.local.json` (MEASURED, files present).
- **`serve-lan.py`** binds 0.0.0.0 unconditionally (:70), serves its repo root (:24) and adds the `/report` write. Its own key lives in `~/mandelbrot/certs`, outside the tree (:18).

### The MANDELBROT certificate

- It is `CA:TRUE`, has no name constraints, and its SAN includes 10.0.0.18 (MEASURED).
- The same certificate is served as `mandelbrot-root.crt` on 8931, which suggests it may be installed as a trusted root on the iPad. Not verified.
- If it is, its key is effectively a CA key for that iPad. It is not served today, so it must stay out of every served directory. Better still, regenerate it as a leaf certificate.

### Other servers seen

- 8768 (`serve-preview.py --directory ..`) and 8931 (MIR `probe.mjs`) also listen on 0.0.0.0.
- 8931 accepts unauthenticated POSTs of 4 MB and 64 MB from the LAN.
- Both are outside λWAVES and were not reviewed.

### Smallest change, in order

1. **Now:** stop pid 2266541, or restart it without `LW_HOST` when you are not testing the iPad. Then delete `.certs/` (it regenerates) and clear the iPad's site data or exception for 10.0.0.18:8711.
2. **One command:** turn on the firewall and allow only the iPad (fix 2).
3. **About 8 lines per server:** deny dot-paths, turn off listings, allow only `/lab/` and `/tools/perf/` for non-loopback clients, and move `CERTS` out of the tree (fix 1). Then add the handshake timeout (fix 3) and the access log (fix 5).

---

## 6. Not reviewed

- **No dynamic testing.** The idle-connection freeze, GPU out-of-memory and device loss, the LADDER freeze and the vortex hang are DERIVED from code. Only the KaTeX timings and the LADDER packet sizes were measured, in node. The live probes were HEAD requests, plus `curl -I` on the production site.
- **No dependency audit.** Only the vendored versions were noted: KaTeX 0.16.11 and marked 12.0.2. No npm or advisory scan was run.
- **No Cloudflare dashboard access.** WAF rules, the zone's security level, Access policies, billing alerts and DDoS settings were not seen. "Always Use HTTPS" was inferred from a live 301. Pricing and quota numbers come from Cloudflare's published docs.
- **Router and devices not inspected:** port forwarding and UPnP, the iPad's trust store and installed profiles.
- **Outside λWAVES:** the 8768 and 8931 servers, MIR source beyond the adopted `lab/mir` files, and the parent magic-commons.com site.
- **Browser behaviour assumed, not tested:** storage partitioning for framed copies, Local Network Access prompts, and Safari certificate-exception scope.
- **Process disclosure:** a few reviewer greps ran recursively over the repo and touched `research/`, against the instructions. They were read-only, and their output was filtered.
