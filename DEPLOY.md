# DEPLOY — λWAVES Alpha

**Current release status (2026-09-10):** read [SHIPPING-READINESS](docs/SHIPPING-READINESS.md) first.
`./test.sh` is green: every node suite and both shipped browser suites pass. What remains open is
outside this tree — real-device acceptance (iPad, phone, installed PWA update) and the Cloudflare
login, deployment and DNS, which are Josh's steps below. Run `npm ci --ignore-scripts` to install
the pinned Wrangler toolchain before using the `npx` commands.

λWAVES is a static application on **Cloudflare Workers + Static Assets**. Shipping it is **three commands
and a login**, in this order, **with no edit to `lab/` in between** — the repo is actively worked on, and a
build from ten minutes ago is not the build you are shipping.

```
node tests/pwa.test.mjs --write   # re-hash lab/ into sw.js §1 — REQUIRED after any lab/ edit
node tools/build-deploy.mjs       # assemble dist/, prove it, print the payload
npx wrangler deploy --dry-run     # compiles and checks, uploads nothing, costs nothing
npx wrangler deploy               # publish exactly that
```

The first command is not optional and it is not a formality: `sw.js` derives its **cache name** from its
own precache hashes, so a stale entry means the name does not move when the bytes do and every returning
visitor is served the old bytes for ever, silently (ANTI-PATTERN 14). The build's §V1 is the gate that
catches it — it has caught itself twice in one afternoon — and it exits non-zero when it does.

If the build exits non-zero, **do not deploy**: it says what is wrong and, for the common case, the one
command that fixes it. Everything below assumes it printed `dist/ is complete and verified`.

**The address.** λWAVES gets its **own hostname** — `lambdawaves.magic-commons.com`, staged first on
`lambdawaves.<account>.workers.dev`. The app is at the **origin root**, so someone given the URL lands
directly inside λWAVES (dossier §1, §3, §23). There is deliberately no Magic Commons homepage and no
Josh's Library UI in this phase; the parent site will one day *link* to this application rather than
contain its infrastructure, which is what lets λWAVES keep an independent release cycle (§2, §22).

---

## Why a subdomain, and why the root scope is safe here

A service worker's scope is **the directory it is served from**, and service workers **persist on the
visitor's machine** — they outlive the deploy that installed them and cannot be purged from the server.
`sw.js` §5 answers every in-scope navigation with λWAVES's `index.html`. So on a **shared** origin a
root-served worker would go on serving λWAVES, from other people's laptops, for URLs that later belong to
a sibling app, and the only remedy would be a tombstone worker whose whole job is to unregister its
predecessor — plus the hope that everyone comes back to collect it.

**A per-app subdomain makes the root scope correct.** The isolation is the **origin**, not a directory:
`lambdawaves.magic-commons.com` is λWAVES and nothing else, so "the whole origin" is exactly the right
territory for this worker. The trap is not gone, it is out of reach — and it returns the moment λWAVES is
moved under a shared origin's path. That is what `OWN_ORIGIN` in `tools/build-deploy.mjs` records: if
λWAVES ever shares a hostname, set `OWN_ORIGIN = false` **and** give it a non-empty `BASE_PATH`, and the
build will hold you to it. Do not move it under a shared root without doing both.

Keep the hostname ASCII. `λ` percent-encodes to `%CE%BB`, which is what a browser copies, what chat
clients mangle, and what nobody can type. λWAVES is already the display name — the `<title>`, the manifest
`name`, the mark — and none of that has to be in the URL (§3).

---

## What ships

Everything under `lab/` except `smoke.html`, plus `LICENSE`, `NOTICE`, `REPORT.md`, `CHANGELOG.md`, and
generated `robots.txt`, `_headers` and `_redirects`. **The build prints the true figures on every run —
file count, bytes, certain requests and the ceiling — and they are the numbers to quote.** (They were
typed into this paragraph once and were stale within two waves: it said 129 files / ~3.1 MiB / 80 requests
against a measured 135 / 3.51 MiB / 83 after the `mir/` port landed. This is the one place in this
document that will silently rot, so it now defers.) From the second launch the service worker answers
everything and the app makes **zero** network requests — measured in Firefox with the server killed:
83 resources, 83 from the worker, 0 from the network, navigation included.

`smoke.html` is dropped: it is a diagnostic bench that boots the strobing WebGPU field with **no
photosensitivity gate**. `tests/smoke.mjs` opens it from the dev server, never from `dist/`.
Not shipped: `research/`, `tests/`, `tools/`, `docs/`, `serve*.sh`, `.tmp/`, `.git/`.

Nothing in `lab/` is rewritten. Every path in it is relative, so the build is a pure move and `./serve.sh`
and `./test.sh` keep working unchanged — the build re-proves that by walking every `src` / `href` /
`import` / `url(` / `new URL(` / `Worker(` reference in the assembled tree (§29 step 2, §8).

---

## Local parity first — never `file://`

```
npm ci --ignore-scripts            # install the committed, pinned deployment toolchain
npx wrangler dev                   # http://localhost:8787/
```

> **This does not break the no-deps charter.** That charter is about the **shipped application**, and
> `dist/` still contains nothing but the lab and its documents — no bundler, no runtime dependency, not
> one byte of `node_modules` reaches a visitor. `wrangler` is a *devDependency of the deploy*, and
> `tools/build-deploy.mjs` remains node-stdlib-only and does not import it. `node_modules/` and `dist/`
> are both already in `.gitignore`.

`wrangler dev` is the point of parity: it reproduces ES module loading, MIME types, the `_headers` rules,
`_redirects`, secure-context behaviour and real 404s. `file://` reproduces none of them (§11).

---

## The first pass — dossier §29, step by step

Steps 1–3, 5 and 7 are **done, and re-done on every build**; the rest are yours.

| # | step | where it happens |
|---|---|---|
| 1 | inventory the whole application | build §1 + §V1: the precache list is checked against `dist/` file by file and hash by hash, so nothing is assumed from `index.html` alone |
| 2 | audit asset paths | build §V2: every `src` `href` `url(` `import` `new URL(` reference walked and resolved; relative / root-relative / remote classified |
| 3 | build the deployment directory | `node tools/build-deploy.mjs` → `dist/` |
| 4 | add Cloudflare configuration | `wrangler.jsonc` (assets-only, no Worker script); build §V6 checks it against the build |
| 5 | add robots.txt | generated; `ALPHA_UNLISTED` in the tool is the switch |
| 6 | run locally through Wrangler | `npx wrangler dev` — see above |
| 7 | fix deployment-specific failures only | done: MIME types, the `/index.html` 307 (below), module resolution, case |
| 8 | **commit known-good local state** | yours: `git add -A && git commit`, then `git tag v0.1.0-alpha`. `.gitignore` covers `node_modules/`, `dist/` **and `.wrangler/`** — that last one is created by step 6's `wrangler dev`, two lines above the `git add -A`, and was not ignored until wave 68 |
| 9 | **deploy** | yours: `npx wrangler login`, `npx wrangler deploy --dry-run`, then `npx wrangler deploy`. **`wrangler.jsonc` now sets `"workers_dev": false`** (wave 68), so there is no staging hostname unless you deliberately flip it — a workers.dev origin is a second permanent root-scoped service worker and a second PWA identity on an address you stop using, and `localStorage` is per origin so anything a tester saves there is stranded. Prefer: attach the custom domain (step 10) and smoke-test at the address that ships |
| 10 | **connect the custom subdomain** | yours, in the dashboard: Workers & Pages → `lambdawaves` → Settings → Domains & Routes → Add → Custom Domain → `lambdawaves.magic-commons.com`. If `magic-commons.com` is already on Cloudflare, the DNS record is created for you and TLS is issued automatically; if not, add the site to Cloudflare and repoint the nameservers at your registrar first |
| 11 | **test again** | the checklist below |
| 12 | document the release procedure | this file |

**One deployment-specific failure is worth knowing about, because it was invisible until measured.**
The dossier's illustrative `html_handling: "auto-trailing-slash"` makes `GET /index.html` return a **307
to `/`**. `sw.js` precaches `./index.html` — it fetches that exact URL with a `?__rev=` buster and stores
the result under the clean key. Under a trailing-slash mode the stored response carries `redirected =
true`, and `sw.js` hands precisely that response to `respondWith()` for every navigation; a navigation
request's redirect mode is `manual`, so the browser refuses it. The app would install, work on the first
visit, and **fail to open from the second launch onward**. Measured against wrangler 4.129.0 on this exact
`dist/`:

| `html_handling` | `GET /` | `GET /index.html?__rev=x` |
|---|---|---|
| `auto-trailing-slash` | 200 | **307 → `/`** |
| `drop-trailing-slash` | 200 | **307 → `/`** |
| `none` | **404** | 200 |
| **`none` + the `_redirects` rewrite** | **200** | **200** |

So `wrangler.jsonc` sets `html_handling: "none"` and the build writes `_redirects` with
`/ → /index.html 200` — status 200 in `_redirects` is a **rewrite**, not a redirect: no `Location`, no
hop, nothing for the worker to choke on. The build fails if anyone changes `html_handling` back while
`index.html` is precached. (The dossier says to treat its config as "a starting configuration rather than
immutable doctrine" and use the supported equivalent that preserves the architecture — §10.)

---

## After deploying — the fourteen acceptance criteria (§30)

Work down this list on the custom domain (step 11) — or on workers.dev first if you deliberately staged
there. **LOAD THE PAGE TWICE BEFORE BELIEVING ANY OF IT.** A first visit is uncontrolled by design (no
`skipWaiting()`), so it is the one visit in which the service worker cannot be wrong: criterion 8 was
green on every first visit and false from the second launch onward for two waves. Open `/LICENSE` in a new
tab after a reload, not before.

| # | criterion | how to check |
|---|---|---|
| 1 | the URL launches λWAVES directly | open it — no index page, no shell |
| 2 | no Magic Commons homepage needed | nothing in `dist/` refers to one |
| 3 | loads over HTTPS | Cloudflare provides it; the padlock is the check. WebGPU needs a secure context and this is it |
| 4 | all CSS, JS, fonts, images, vendor assets load | DevTools → Network: no 404s. The build already proved every reference resolves; this confirms the upload |
| 5 | major systems operate as they do locally | FIELD · SHADOW · VORTEX · ORBIT · LADDER · particles · Kepler; orbit, drag, keys, play/pause, rack, notebook, project save/load/export/import (§18) |
| 6 | browser persistence works | settings, notebook and projects survive a reload |
| 7 | WebGPU-unavailable fails informatively | the **WebGPU unavailable** banner appears rather than a blank stage (§19) |
| 8 | LICENSE / NOTICE / REPORT links work | `/LICENSE`, `/NOTICE`, `/REPORT.md`, `/CHANGELOG.md` — all four open **as text in a tab**, not as downloads. Verified locally through `wrangler dev` |
| 9 | search engines asked not to index | `/robots.txt` is `User-agent: * / Disallow: /`, and every response carries `X-Robots-Tag: noindex`. **UNLISTED IS NOT PRIVATE**: anyone with the URL can open it, and that is intended for the Alpha. This is an indexing request, not access control — if real restriction is ever wanted, that is Cloudflare Access, evaluated separately (§4, §26) |
| 10 | Git contains the complete deployable source | `lab/` + `tools/` + `wrangler.jsonc`; `dist/` is generated and gitignored |
| 11 | a known commit corresponds to production | tag the commit you deploy (`git tag v0.1.0-alpha`); `npx wrangler deployments list` names the live version |
| 12 | a rollback procedure exists and has been tested | below — **do it once, deliberately, before you need it** |
| 13 | updating no longer needs manual file editing | build, `wrangler deploy`. No FTP, no replacing individual files |
| 14 | linkable from Magic Commons later without migration | the parent site adds `<a href="https://lambdawaves.magic-commons.com">Launch λWAVES</a>` and nothing here changes (§22, §32) |

Two more worth checking while you are in DevTools, because they are what makes it an *app*:

- **Application → Manifest** shows the name, both icon sizes and both maskable ones, no warnings.
- **Application → Service Workers** shows one worker, scope `/`. Reload once, tick **Network → Offline**,
  reload again → λWAVES boots with no network. It works from the **second** launch, never the first:
  `sw.js` refuses to `skipWaiting()` so a new build is never swapped in under a running session. That is
  deliberate and is not a bug to chase.

### Rollback (criterion 12) — test it on purpose

```
npx wrangler deployments list      # what is live, and what came before
npx wrangler versions list         # the 10 most recent versions, with ids
npx wrangler rollback <version-id> # put a previous version back
```

Or in the dashboard: Workers & Pages → `lambdawaves` → Deployments → the older version → Rollback.
Deploy twice, roll back to the first, confirm the site changed, then roll forward. A pipeline whose
rollback has never been run is not a pipeline (§17).

**How to tell it worked, without looking.** Every other section of this document gives a measured
expectation and this one used to give an instruction, which is no use at midnight. Before rolling back,
record what is live:

```
curl -sI https://lambdawaves.magic-commons.com/ | grep -i etag     # note it
curl -s  https://lambdawaves.magic-commons.com/sw.js | head -40 | grep -c "'./rack.js'"
npx wrangler deployments list | head -20                            # note the version id at the top
```

After the rollback: the **ETag changes back** to the one the older version served, `deployments list`
shows the older version id at the top, and — the check that actually names the build — `sw.js`'s precache
hashes are the old ones. Nothing about the page's appearance is a reliable signal.

**AND THE HALF THAT IS ACTUALLY HARD: ROLLING BACK DOES NOT REACH INSTALLED CLIENTS.** A rollback changes
what the **edge** serves. A visitor who already took the bad build has it in their Cache API, and their
registered `sw.js` is the bad one; because of `sw.js`'s One Law (no `skipWaiting()` on install, no
`clients.claim()`), they keep running it until they close every tab **and** accept the "new" build — which
is the old one — on the badge. So the honest story is: **the edge is instant, installed clients are not.**
For an alpha with a handful of testers that is fine, and it is the deliberate trade that stops a build
swapping itself in under unsaved work. Write it down anyway, because the person reading this at midnight
will otherwise conclude the rollback failed when it has merely not reached them yet — and the fastest
proof it did work is a **private window**, which has no worker.

One more mechanism worth knowing rather than discovering: `wrangler deploy` deletes superseded assets
immediately by default (`--old-asset-ttl` changes that). It is safe here — a client mid-precache gets a
404, its install rejects, and the old worker keeps serving — but it is why a scary log line during a
deploy is an expected one.

---

## Deliberate differences from the dossier

Recorded so they read as decisions rather than drift.

- **§6 names a development entry file `index(20260905-181927).html`.** This repo has no such file; the
  entry point is `lab/index.html`, under version control, with no timestamped copies to reconcile. Git is
  the archive the dossier expects to make snapshots unnecessary, and it already is.
- **§7 sketches a `public/` directory.** We keep `lab/` and let the build produce the deployable
  directory instead. §7 itself says the layout is "illustrative rather than mandatory", asks to preserve
  a rational existing structure, and warns against unnecessary migration churn — and `lab/` is wired into
  `./serve.sh`, `./test.sh` and 40+ test files. `wrangler.jsonc` therefore points `assets.directory` at
  `./dist`, not `./public`.
- **§8 expects `/LICENSE`, `/NOTICE`, `/REPORT.md` to be linked from the app.** Wave 55 made those links
  **relative, not absent** — this paragraph used to say "deliberately removed", and it was wrong about two
  of the three: `lab/index.html` still carries `<a href="./LICENSE">` and `<a href="./NOTICE">`, and only
  the `/REPORT.md` link is genuinely gone. The distinction mattered: relative links worked on the dev
  server and then, at the origin root, were answered by our own service worker with the lab's own
  `index.html` — nine `target="_blank"` licence links each opening a second copy of λWAVES. That is
  wave 68's blocker A, fixed in `sw.js` §5, and criterion 8 is met because the URLs answer **from the
  second launch too**, which is the only launch that ever tested it.
- **§10's `html_handling`** — see the measured table above.

---

## When the build fails

| it says | do |
|---|---|
| `V1: precached "x" … different bytes` / `V5: tests/pwa.test.mjs FAILED` | `node tests/pwa.test.mjs --write` — a wave edited `lab/` and `sw.js` §1 is stale. This is the normal case, and it matters: `sw.js` derives its cache *name* from those hashes, so a stale one means returning visitors keep serving old bytes forever |
| `V1: dist/x.js is neither precached nor covered by a rule` | a wave added a file. Same command |
| `V2: … (looked for dist/…)` | a real broken link |
| `V2: manifest "id" …` | `id` is the one manifest member resolved against the **origin**, not against the manifest, so a relative value does not travel with the app. Delete the `id` member in `lab/manifest.webmanifest` — it then falls back to `start_url`, which is `"./"` and is correct at every address |
| `V3: … no register(…)` | nothing registers the service worker, so the precache and the whole offline layer are inert. One line at the end of boot: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');` — **relative**, which is what keeps the same bytes working on `./serve.sh`, under `wrangler dev`, and at the origin root |
| `V4: SharedArrayBuffer` | a wave introduced cross-origin isolation. `_headers` must then grow COOP/COEP and every subresource must be CORP-clean. None of it is needed today and none is sent |
| `V6: html_handling is "…"` | the 307 trap. Set `html_handling: "none"` |
| `V6: assets.directory … but this build writes …` | `wrangler.jsonc` points somewhere else; Wrangler would deploy the wrong bytes |

`./test.sh` does **not** run the build. Run `node tools/build-deploy.mjs` yourself before you ship.
