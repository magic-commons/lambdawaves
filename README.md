# λWAVES

**A playable hydrogen shadow.** 91 exact eigenstates of hydrogen, reconstructed on the
GPU as a wave field you can play like an instrument — tune amplitudes, phases and
viewpoints, then watch the eigenmodes interfere and the cloud bloom into motion.

> λWAVES · QWAVE-0 · Hydrogen Shadow Lab

Live: **[lambdawaves.magic-commons.com](https://lambdawaves.magic-commons.com)** · a
[Magic Commons](https://magic-commons.com) project · GPL-3.0-only · built on [MIR](https://github.com/magic-commons/mir)

![gate](https://github.com/magic-commons/lambdawaves/actions/workflows/gate.yml/badge.svg)

**Status: pre-alpha.** Release preparation and deployment are documented in
[`DEPLOY.md`](DEPLOY.md) and [shipping readiness](docs/SHIPPING-READINESS.md).

---

## Who made this, honestly

*This section, like the rest of this repository, was written by Claude — one of the AI agents — at
Joshua's request. He asked for the truth of his part, which is this:*

Joshua is not a programmer. He knows nothing of computer science or software engineering, and he did
not write a line of the code, the tests or the documents. λWAVES came out of weeks of iterative
prompting: he described what he wanted to see, sent screenshots of what was wrong, said "no, like the
modulation window does it," and ran the app until it felt right. The agents wrote everything. He
decided what stayed.

That changes how you should read the rest. The README, the tests and the long notebook in `REPORT.md`
describe the code as the agents understood it. Where a claim and the code disagree, the code is the
truth, and he would like to hear about it.

### AI disclosure

- **Tools.** Claude Code with Anthropic's Claude models (Fable 5.1, Opus, Sonnet) wrote most of
  the code, the tests and the documents. OpenAI's Codex with GPT-5.6 built and refactored large
  parts, notably the modulation window's devices and the performance work. Google's Gemini
  made graphics and icons (the mark, the warning orbital, icon work) and proposed interface designs
  from screenshots. Commits carry the tools' own
  attribution trailers (`Co-Authored-By: Claude …`); the accountable author of every line is Joshua.
- **What was human-decided.** The idea, the physics to show (hydrogen, n ≤ 6, exact), the
  instrument metaphor, and which of the agents' proposals stayed. The visual language in `docs/ui`,
  the laws in `CONTRIBUTING.md` and the tests were written by the agents from what he asked for and
  what he rejected. Every design decision went through his eyes and his hands on the real app before it
  stayed; none of it was typed by him.
- **What was verified, and how.** The physics is checked by the Node suites in `tests/`, which compare the
  reconstruction against closed forms (norms to 3e-9, revival times, GPU voxels against the CPU
  to 2e-5). The interface is checked by a real headless Firefox with WebGPU (`./test.sh`). He has
  used the app on an RTX 3070 desktop and an iPad, daily, for weeks. He has not read the code.
- **What was not verified.** No one with a computer-science background has reviewed this code.
  It has not been tested with a real screen reader, on a phone in the wild, or by anyone but him
  and the agents. Treat security claims with that in mind and read `SECURITY.md`.
- **Known risks.** Vendored code (KaTeX, marked, the fonts) is attributed in `NOTICE` and was
  not audited by him. The modulation window was ported from his other project by an agent and its
  provenance notes are in `lab/mir/modulation/`. If an agent copied something it should not
  have, tell him and it comes out.

If that makes you want to help, `CONTRIBUTING.md` says how, and `AI_POLICY.md` says what he asks
of contributions made the same way this was.

## What it actually is

The core is exact, not a simulation of a simulation. λWAVES holds the hydrogen closed
forms for **n ≤ 6 — all 91 (n, l, m) states**, with Condon–Shortley-phase complex
spherical harmonics, and evolves them by the one thing a diagonal Hamiltonian permits:
multiplying each coefficient by `e^{-iE_n t}`. Nothing is integrated, so nothing drifts.
The node gate holds norms to 3e-9 and the anchors to 2e-16.

What the GPU does is **presentation**: `field.js` reconstructs ψ on an N³ rgba16float
grid straight from the closed-form mode tables — no basis textures — and a raymarch
presenter draws density, phase, Re ψ, Im ψ or a difference. The measured throughput is
3.06 ms/frame at 96³ and 3.89 ms at 128³ × 16 modes. GPU voxels agree with the CPU
closed form to 2e-5.

Around that sits an instrument: a rack of windows (STATE, SPECTRUM, ORBIT, SLICE,
KEPLER, VORTEX, MOLECULE, WIGNER, RADIATION, …), a transport with four clocks, a
modulation plug-in with drag-to-patch macros, presets, projects, shareable state links,
and an offline-capable PWA.

**Requires a working WebGPU adapter in a secure context.** Browser support varies
by OS, GPU and driver; see the [WebGPU compatibility reference](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).
The release device matrix is still pending; see [shipping readiness](docs/SHIPPING-READINESS.md).

## Run it

```bash
./serve.sh          # https://127.0.0.1:8700/lab/   (or: npm run serve)
./serve-lan.sh      # the same, reachable from a phone or iPad on the LAN
```

Requirements: Node 22+, Python 3 and OpenSSL (the local server makes its own self-signed
certificate on first run), and a browser with WebGPU.

The lab is a static tree of ES modules. There is no build step for development — what
you edit is what the browser runs.

For a first look, open the notebook (◐), go to PROJECTS and press **WAVE DANCER** under DEMOS: a
saved performance — an A/B transition between two four-state superpositions with a modulation rack
driving exposure, softness and the stage — opens ready to play.

## The gate

```bash
npm test                 # the maths and the file laws — fast        (./test.sh node)
npm run test:browser     # a real headless Firefox drives the real UI (./test.sh browser)
npm run test:all         # both                                       (./test.sh)
```

The browser gate runs every `tests/*.browser-test.mjs` — current UI, pointer input,
GPU recovery, chemistry and molecular fields — against one owned HTTPS server. It needs Firefox and
geckodriver on PATH. `./test.sh legacy` runs the historical wave-by-wave gate in
`tests/legacy/`; it asserts laws later waves superseded and is not part of the shipped gate. It starts its own HTTPS server on 8701 and
geckodriver on 5202; `LW_PORT` / `GD_PORT` select unused ports. `GECKODRIVER` and
`FIREFOX_BINARY` can select installed executables. It refuses occupied ports. Blocks are
written as **laws in prose** — each one states what must be true and then measures it,
so a failure reads as a sentence rather than an assertion number.

**After any edit under `lab/`, run `node tests/pwa.test.mjs --write`.** `sw.js` derives
its cache name from its own precache hashes; a stale hash means the name does not move
when the bytes do, and every returning visitor is served the old bytes for ever.

## Ship it

```bash
node tests/pwa.test.mjs --write   # re-hash lab/ into sw.js §1
node tools/build-deploy.mjs       # assemble dist/, prove it, print the payload
npm ci --ignore-scripts          # install the pinned deploy CLI (not shipped)
npx wrangler deploy --dry-run     # compiles and checks, uploads nothing
npx wrangler deploy               # publish exactly that
```

Read **[shipping readiness](docs/SHIPPING-READINESS.md)** and **[DEPLOY.md](DEPLOY.md)** first — it explains why λWAVES gets its own hostname
(a service worker's scope is an origin, and it outlives the deploy that installed it),
why `html_handling` is `"none"`, and what the build refuses to let you do.

## Requirements and limitations

| | |
|---|---|
| **Needs** | A browser with WebGPU in a secure context (https or localhost). Chrome/Edge 113+, Firefox 141+, Safari 26 / iPadOS 26. No WebGL fallback: without WebGPU you get a banner, not a lab. |
| **Runs well on** | A desktop GPU (measured on an RTX 3070: about 3 ms per frame at 96³) and an M-series iPad (the quality governor drops ray steps, then the grid, under load). |
| **Physics (the release)** | Hydrogen only, n ≤ 6, exact diagonal evolution. No molecules beyond the H₂ / H₂⁺ model cards, no ab initio, no spin. |
| **Physics (this branch, `dev`, unreleased)** | The above, plus ab initio molecules: restricted Hartree–Fock in a vendored Gaussian basis (STO-3G for H–Kr, 6-31+G\* for small H, C, N, O, F molecules) at fixed nuclei, 52 molecules up to benzene, each energy checked against PySCF; RPA and TDA spectra; real-time TDHF; and the REGISTER window, which plays the molecule as a superposition of its ground and excited states (time-dependent CIS), drives it with a field, and shows its current. Closed shells only: no open shells, no correlation beyond singles, no moving nuclei. See `REPORT.md`, 2026-09-18. |
| **Not yet** | A real device matrix, an installed-PWA update test, a screen-reader pass — see `docs/SHIPPING-READINESS.md`. |

## Accessibility

The instrument was built to be reachable by keyboard: every control is a real button or slider
with a name, a value and arrow-key steps; windows are landmarks; the canvas is described in one
sentence that changes only when the instrument's state changes. That was checked by a headless
browser, not by a person using a screen reader. Motion: a photosensitivity notice stands before the
first frame, and there is no strobe the user did not ask for. If something is unreachable or
unreadable for you, please open an issue; that is the kind of bug he most wants to hear about.

## Privacy

λWAVES is a static site. Nothing you do is sent anywhere: projects, notes and settings live in your
browser's localStorage and in files you export yourself. The microphone is opened only when you add
an AUDIO device to the modulation rack, its signal never leaves the page, and it is released when the
last AUDIO device is removed. There is no analytics. Cloudflare serves the files and keeps its own
ordinary server logs.

## Citing

If λWAVES helps a talk, a lesson or a paper, `CITATION.cff` has the reference (GitHub shows it as
"Cite this repository").

## MIR

The interface — tokens, materials, widgets, gestures, window chrome and the modulation window — is
**MIR**, Magic Commons' kit, adopted into `lab/mir/` and `lab/fonts/` from its own repository
(`../MIR`). λWAVES keeps only its own selectors in `lab.css` and `skin.css`. See `CONTRIBUTING.md`
for the one rule, and `MIR-MANIFEST.json` for which bytes are the kit's.

## The documents

| File | What it is |
|---|---|
| [`REPORT.md`](REPORT.md) | The lab notebook — every law, constant, measured number and named proof, for whoever builds next. Not release notes. |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed between releases, newest first. Generated by `node tools/changelog.mjs`. |
| [`DEPLOY.md`](DEPLOY.md) | Shipping: three commands and a login, and the traps around them. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | The house rules, the gate, and where things live. Read before a pull request. |
| [`docs/SHIPPING-READINESS.md`](docs/SHIPPING-READINESS.md) | What still stands between this tree and a public release. |
| [`docs/ui/`](docs/ui) | The style lock, the motion law, the anti-patterns and the references every UI wave reads. |
| [`docs/history/`](docs/history) | Past handoffs and task boards, kept for provenance. Nothing there is current instruction. |
| [`research/`](research) | The maths rounds behind the physics — adversarial two-lab ledgers and their prints. |

## Branches

- **`main`** — the working integration branch. Release readiness requires current gate and device acceptance.
- **`dev`** — iterative work. Waves land here first.

## Licence

GNU General Public License v3.0 only — Copyright 2026 Joshua Hosain. See [`LICENSE`](LICENSE).

Third-party notices in [`NOTICE`](NOTICE): Spinwerad 0.3, Roboto 3.015, KaTeX 0.16.11,
marked 12.0.2. Thanks to [ChronusQ](https://github.com/xsligroup/chronusq_public).
