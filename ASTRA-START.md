You are taking over **λWAVES**, a WebGPU "hydrogen shadow lab" at
`/home/joshua-hosain/Documents/LAMBDAWAVES` (its own git repo). It is close to
shipping. I am Josh; it is my project, and my last session was Claude Opus 5.

**Read these two files before anything else, in this order:**

1. `HANDOFF.md` — the current state: both branches, the gate block by block, what is
   fixed, what is left, the two real defects that were found and why the laws that
   caught them are worth trusting, and the walls.
2. `LANDSCAPE.md` — what the code *is*: the three layers, the files that matter, the
   gate, and the half-dozen facts that otherwise cost an hour each to rediscover.

Then `docs/ui/ANTI-PATTERNS.md` and `docs/ui/STYLE-LOCK.md`. Consult `REPORT.md` (the
lab notebook, 403 KB) for the *why* behind any number you are about to change — read
the section for that wave, do not read it end to end.

## The state in one paragraph

`main` sits at the pre-alpha-2 freeze — green, untouched, the fallback. `dev` carries
waves 50–106 and is where you work. The node gate is green, the deploy build is
verified, and the browser gate has about seven blocks still red out of 165, every one
of them named in HANDOFF.md §4 with what is already known about it.

## Your first task

Get the browser gate green, then merge `dev` into `main`.

Start with **B131**, which *throws* rather than failing — its dump is
`{"error":"@https://127.0.0.1:8701/lab/?preset=1s%2B2pz&warn=0:33:15"}`. Diagnose the
throw precisely before touching anything else. Then B129 / B135 / B139 (the glass and
material laws; B129 looks like it hard-codes per-stylesheet CSS **rule counts**, and two
waves have since added and removed rules — check that before assuming it is a real
defect). Then B132 / B134 / B141. B123 and B124 are already diagnosed in HANDOFF.md §4
and only their mechanics need care.

For each block, decide between two verdicts and say which:
- **STALE LAW** — the app changed deliberately and the law describes a superseded
  design. Rewrite the law text *and* the assertion to the new truth.
- **REAL DEFECT** — the app is wrong. Fix the source, and leave the law alone.

A law that is merely inconvenient is not stale. When in doubt, call it a real defect
and show your working.

## How this repo works, and it is not like most

**Verify, do not assert.** The gate is the arbiter, not anyone's opinion — mine
included. Every claim you make about behaviour should be something you measured. If a
suite fails, say so with the output. Every delivery here gets adversarially reviewed;
that is the standing protocol and it is not personal.

**The prose is load-bearing.** Gate blocks are laws written as sentences and then
measured; source comments carry the reasoning, not a restatement of the code. 26,000
lines are written that way. Match it — when you change a decision, write down why the
other reading was rejected, because that is what tells the next reader (or the next
model) which of two plausible designs was deliberate.

**Never type a number twice** (ANTI-PATTERN 6). If the app owns a constant, read it
from the app. One block failed exactly because a probe wrote `2.5` by hand and then
demanded the shipped `1.0`.

## Hard constraints

- **After ANY edit under `lab/`, run `node tests/pwa.test.mjs --write`.** `sw.js`
  derives its cache name from its own precache hashes; a stale one serves old bytes to
  every returning visitor, for ever, silently.
- **`lab/mir/modwindow/*` is byte-frozen** and `tests/mir.test.mjs` §16 proves it. All
  skinning goes in `lab/modhost.css`, all behaviour in `lab/modwindow.js`.
- **The wiring gate is real**: a module nothing imports fails the build. Wire it,
  delete it, or allowlist it with a reason and a date.
- Commit freely on `dev`. **Do not push to `main`, do not force-push, do not merge to
  `main` until the browser gate is green.**
- **Do not touch Cloudflare.** Deploying needs my account; that is the wall. Prepare,
  never log in.
- Ports 8700–8799 and 5200–5299 are λWAVES's. Never touch 8443 or 8875.
- Never write under `~/Documents/OBSIDIAN` or `~/Documents/LUX JSY LIBRARY`.

## Commands

```bash
./serve.sh                        # https://127.0.0.1:8700/lab/
./test.sh node                    # maths + file laws — fast
./test.sh browser                 # real headless Firefox, ~20 minutes
node tests/pwa.test.mjs --write   # after any lab/ edit
node tools/build-deploy.mjs       # assemble and prove dist/
```

## Four traps that will cost you an hour each

1. **Backticks.** `tests/boot.browser-test.mjs` is one long chain of `g.ev(\`…\`)`
   template literals. A backtick inside a comment you insert terminates the string.
   Reword. Same for nesting `/* */` inside a block comment.
2. **`ev()` takes a body string, not a function.** And `settle()` in the harness waits
   on a global belonging to a different project — use `waitFor` on the DOM.
3. **Judge dumps are cut at 300 characters**, so a failing arm past the cut is
   invisible. Add a narrow temporary probe rather than guessing.
4. **The camera boots FREE.** The pose *is* a unit quaternion and `obs.yaw`/`obs.pitch`
   are only a readout of it. Turntable arithmetic is invalid there, and this was the
   single most common cause of confusing failures in the last session.

Start by reading the two documents and telling me your plan for B131 — what you think
is throwing, and how you intend to confirm it. Do not begin editing until you have
measured something.
