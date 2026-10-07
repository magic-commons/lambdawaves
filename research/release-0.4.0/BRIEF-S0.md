# λWAVES 0.4.0 · S0 TAKE-IN — BRIEF for the tree builder (waves 136–139)

**Written by Fable, 2026-10-07, on Josh's word "build S0 and onward".** The contract is `research/release-0.4.0/PLAN.md`
§3 **B0** (read it first, then §9 RULINGS TAKEN); the map is `research/release-0.4.0/survey/LWAVES-AUDIT.md` **Part A**
(A.3 the merge study, A.4 KEEP / REWRITE / DROP) and Part B's bug rows (7a–7c, F4, F6, F7). Two sibling agents run beside
you and never touch the tree: the MEASURE probe (`BRIEF-S0-MEASURE.md`) and the CANARY (`BRIEF-S0-CANARY.md`). You own
the tree. **You do not cut 0.3.3** — Fable cuts it from your result after a verifier.

## 0 · The setting

The live site serves Cloud's unreviewed `main` (`28fe445`): the stage formula, atom labels, the paint gesture, SPECTRUM
folds under a molecule, Jet Black landed by a **direct edit of `lab/mir/palette.js` with a forged `MIR-MANIFEST.json`
"1.4.4"**, the legacy windows hidden, a wrangler bump — and the version line still says 0.3.2-alpha. `release-0.4.0`
(your start) holds 0.3.3 THE EXPORTS (shape + grid exports, SPECTRUM ⧉ and EDIT › COPY the state as LaTeX) and the
plan's research. S0 merges the two, subtracts what breaks the law, fixes the cheap bugs, wires the vendor duplicate away,
closes the process hole, and adds three demos. Then Fable cuts 0.3.3 from your tree.

## 1 · The laws (Josh's; each one has cost us before)

- **Never edit `lab/mir/**` or `lab/fonts/**`.** They are adopted MIR 1.4.3. `node tests/mir-manifest.test.mjs` must pass
  with `version` 1.4.3. (`node ~/Documents/MIR/tools/adopt.mjs <root> --check` reports DRIFT on
  `lab/mir/modulation/host.js` + `mod.js` — that is Josh's own uncommitted MIR 1.5 work upstream, not ours; ignore it.)
- **After any `lab/` edit: `node tests/pwa.test.mjs --write`, then the suites.** The generated `lab/sw.js` is never
  hand-edited.
- **Subtract, don't add.** No new machinery to go faster; remove, merge, simplify. Diagnostics live in `tools/`, never
  `lab/`.
- **The glass is Josh's.** No repainting of his material; a text or layout fix never licenses a skin change.
- **Three scopes** (`docs/STATE-SCOPES.md`): PREFERENCE / WORKSPACE / PROJECT. A new stored key names its scope in the
  doc. `node tools/new-project.mjs --check` must stay byte-exact (regenerate with `node tools/new-project.mjs` ONLY when a
  boot default legitimately changed, and say so).
- **Never `pkill -f`** (it killed other sessions' browsers). Kill by pid.
- **Git only inside your own worktree.** Never push. Never touch `main`, `dev`, `release-*`.
- **One light check per stage** (Josh 10-01: "don't over verify, just see if the basic thing works"). Run the suites the
  change touches, once; the whole browser gate is Fable's verifier's job. A timing flake (`current`, `wigner`,
  `electrostatics`) is re-run alone before it is believed.
- **The RTX 3070 is shared.** Browser suites one at a time, on YOUR ports: `LW_PORT=8731`, `GD_PORT=5203`. Start the gate
  server the way `test.sh` does: `python3 tools/gate/server.py <your-root> 8731 &` (it prints `λWAVES gate server on …`
  when ready); then `LW_PORT=8731 GD_PORT=5203 node tests/<suite>.browser-test.mjs`. Kill your server by pid at the end.
- **REPORT.md** gets a wave entry per commit under a new heading `## 2026-10-07 · 0.4.0 S0 — THE TAKE-IN`; waves number
  from **136**. Say what was measured, not what was hoped.

## 2 · Your worktree

It starts at the `release-0.4.0` tip (the commit that added this brief; `git log -1` shows it). Everything below is
committed on your worktree's branch; Fable merges it. Small commits, in this order, each green on its own gates.

## 3 · The commits, in order

### C1 + C2 · The two merges (waves 136a/b)

```
git merge 2a03c06      # PR #1 (Cloud): formula overlay, MO-REGISTRY paint, first-run molecules, legacy hidden, wrangler
git merge 28fe445      # PR #2 (Cloud): stage formula + SIZE, SPECTRUM folds, paint everywhere, atom labels, Jet Black
```
Each conflicts in `lab/sw.js` only (generated): take ours, `node tests/pwa.test.mjs --write`, `git add lab/sw.js`, commit
the merge. After C2: `bash test.sh node` and `npm ci` is NOT needed (wrangler is a devDependency; `package-lock.json`
merges clean). Expect one **semantic** red in the browser: `tests/latex-copy.browser-test.mjs:137-144` asserts SPECTRUM is
`.hidden` under a molecule; Cloud folds it. That red is C3's to fix — do not bend the test to pass here.

### C3 · The subtraction commit (wave 136) — ONE commit, before any other work

(a) **The manifest becomes true.** `git checkout <your start sha> -- lab/mir/palette.js MIR-MANIFEST.json tests/palette.test.mjs`
    (the 1.4.3 bytes). `node tests/mir-manifest.test.mjs` → `PASS MIR 1.4.3`.
(b) **Jet Black stays live by a lawful route.** MIR's `mir-1.4.x` branch is at 1.4.3 with no `jetblack` (checked 10-07),
    so the row is the app's until the kit carries it (KIT BRIEF J, S5): a new small module `lab/palette-app.js` that
    appends ONE catalogue row to the kit's `PRESETS` and `PRESET_BY_ID` (`lab/mir/palette.js:143, 426`; `PRESET_BY_ID` is
    a `Map`; `ring` is not exported — build the three `{at, rgb}` stops with the exported `hexToRgb`). Cloud's row text
    is the spec: `{ id: 'jetblack', label: 'Jet Black', points: 3, constL: true, harsh: false, cvd: false, flat: true,
    note: 'three bands of pure black — a solid body, not a phase map', stops: #000000 ×3 }`. It must be imported BEFORE
    anything reads `PRESETS` (`lab/paletteview.js:9` imports `PRESETS`; `rack.js:56` imports paletteview, `:64` the
    palette — put `import './palette-app.js'` ahead of both). `tests/palette.test.mjs` imports the app module too, so the
    row is gated; keep Cloud's `flat` exemption as the one-line rule "a `flat` palette is exempt from the phase-map gates"
    and say in a comment that the row is the app's until MIR carries it. A saved project or link naming `jetblack` keeps
    working (statelink.js reads `PRESET_BY_ID`).
(c) **Under a molecular owner, EDIT › COPY copies the molecule's page.** Today `copyLatex()` (rack.js ~2004) and the EDIT
    row predicate are gated on `wSpec.root.hidden`, which Cloud's fold made false → it would copy the atomic register
    under a molecule. New law: when a molecular owner holds the field (`molecule.on || helium.on || h2.on || chem.on`),
    the copy is the MOLECULE's page, never greyed. Add a pure `moleculeLatex({ molecule, basis, charge, ground })` beside
    `stateLatex` in `lab/latex-state.js`, the same two-line shape (a prose line, then one `$…$` line): the formula and
    name, RHF/basis, charge, the total energy in E_h, the occupied count of n AO, then the ladder as
    `\varepsilon_i` in E_h with HOMO and LUMO marked **by index** (`HOMO`, `LUMO`, `HOMO−1`…; the symmetry NAMES arrive in
    S1 and slot into this same function — leave a one-line comment where). Read the ground's shape in
    `lab/mathworker.js` ~233 (`chemSol.ground`) and how `chemview.js` holds it. Node test in `tests/latex-state.test.mjs`
    (water: 5 occupied of 7 AO, `\varepsilon` present, HOMO marked). Rewrite `tests/latex-copy.browser-test.mjs:137-144`
    for the new law (SPECTRUM folded; the clipboard text carries the formula and `\varepsilon`).
(d) **`.mol-more` is a fold, open on desktop.** `chemview.js:166-173` parks KICK / RUN / TDA / the RPA spectra in a
    permanently hidden div, so the README's own selling points are unreachable on a first run. Make it a MORE ▾ / LESS ▴
    fold (use the card idiom that exists in window-chrome.js / lab.css if there is one; do not invent a second fold
    language), **open by default on desktop, folded on phone and tablet** (`isPhone()`/`isTablet()` via
    `lab/first-run.js`), its open state in the window's WORKSPACE record. The card's `Aa` (LEAN) button stays visible
    with HELP off (find the coupling — `lab/window-chrome.js:22` builds it; `lab/lab.css:421` LEAN; grep `no-help`). Un-bend
    `tests/chem.browser-test.mjs` and `tests/routed-knob.browser-test.mjs` (they set `.mol-more.hidden = false`): they
    reach the controls through the UI a user has.
(e) **SPECTRUM's orphaned buttons** (`rack.js` ~1946 after the merge): ATOM opens ATOMS again (the legacy window's
    un-hide road, as `legacyWindow` un-hides HELIUM/H₂ on `setOn`); QUARKONIUM's button is hidden while QCD stays hidden —
    the seg must still ACCEPT `cornell` so an old project restores (hide the button, not the value).
(f) **CLAUDE.md.** Delete the false paragraph "Palettes are MIR's … `jetblack` (MIR 1.4.4) …" and replace it with one
    honest line (the app-side row, KIT BRIEF J). Its stray last sentence "It is transparent text under every window and
    never part of the occlusion mask" belongs to the STAGE FORMULA paragraph — move it. State the first-run law ONCE
    (Cloud's "MOLECULES and MO-REGISTRY start OPEN on the first-run LEFT rack" supersedes the older "start off the rack"
    — one paragraph, not two). Add the process line: **"Cloud: PRs only, never `lab/mir`; a kit need is a MIR issue or a
    line in the PR."**
(g) **REPORT wave 136**: what was KEPT and why (the paint gesture's behaviour, MO-REGISTRY "standing by", the first-run
    left rack, `docs/LEGACY-WINDOWS.md`, the wrangler bump), what was SUBTRACTED (the manifest, the kit edit, the test
    exemption's wording) and the Jet Black route, (c)–(e) as laws.
(h) `node tests/pwa.test.mjs --write`; `node tools/new-project.mjs --check`; `bash test.sh node`; browser: `latex-copy`,
    `palette` is node, `menubar`, `first-run`, `molecular-names`, `register`, `chem`, `routed-knob`, `new-project`.

### C4 · The cheap bugs (wave 137) — one commit, each with a test

- **CALCULUS's ⧉ copies one header line.** `rack.js:5438` `DIGESTS.calculus` reads `calculus.stats`; `createCalculus`
  returns `{ update, get last() }` (`calculusview.js:50`). Read `calculus.last`. Test: the digest carries at least one
  row (node if `digest` is reachable, else a browser assertion in `tests/latex-copy` or a small new suite).
- **The badges tick only inside METERS.** `rack.js` ~1104: `tick('meters', …)` runs `badges.update()` and
  `paintGovernor()` gated on `canPresent(wMet)`, so the STATUS TAGS, the Stark/Zeeman and masked/truncated warnings and
  the canvas aria sentence go stale while METERS is closed. Give `badges.update()` (and the sentence) their own ≤ 10 Hz
  tick, gated on `!document.body.classList.contains('no-badges')` OR the sentence being read, independent of METERS;
  `paintGovernor()` stays with METERS. Test (browser): METERS closed, STATUS TAGS on, switch a state that changes a badge
  (Stark on), the badge text changes within 300 ms.
- **`hydroReader()` omits `chem`** (`rack.js:2728-2736`): WIGNER and RADIATION compute hydrogenic physics under
  MOLECULES. Add `(chem && chem.on)` to the "another model holds the field" branch. Test (browser): chem on → WIGNER's
  status reads "hydrogenic register only".
- **The LINKED bug** (Josh's NEXT UPDATE note, `survey/VAULT.md:234`): "at project start or open, Space does not play
  both clocks in LINKED mode". `clockLink` lives at `rack.js:287` (LINKED is the default; 896 the per-frame law; 4922 the
  load road). Reproduce it in a browser test: open a project (the WAVE DANCER demo is one road), press Space, assert the
  field clock AND the modulation clock both advance. If it reproduces, fix it in place and keep the test; if it does not,
  keep the test as the guard and REPORT says "not reproduced on this tree, guarded".

### C5 · Wire, don't re-date + the process hole (wave 138) — one commit

- `lab/index.html:57, 71, 72` load KaTeX and marked from `./vendor/…`; the kit ships byte-identical copies under
  `lab/mir/shell/vendor/` (prove it: `diff -r lab/vendor/katex lab/mir/shell/vendor/katex`, `cmp lab/vendor/marked.min.js
  lab/mir/shell/vendor/marked.min.js`). Point the three tags and the ABOUT face's licence links (`index.html:124`) at
  `./mir/shell/vendor/…`, then **delete** `lab/vendor/katex/`, `lab/vendor/marked.min.js`, `lab/vendor/marked-LICENSE.md`,
  `lab/vendor/package.json`. **Keep `lab/vendor/bse/`** (the basis sets — not a duplicate).
- `tests/wiring.test.mjs:58-66` ALLOWLIST: the two vendor rows (katex.min.js, marked.min.js) now CLOSE by wiring (delete
  them); the five shell rows (`about.js`, `accent.js`, `menubar.js`, `notebook.js`, `wordmark.js`) are renewed ONCE with
  a new date and a reason that names the consumer: "the 0.5.0 adoption (PLAN.md §6)".
- The two node tests that `createRequire` the vendor KaTeX (`tests/notebook-math.test.mjs:19`, `tests/latex-state.test.mjs:8`)
  get a small shared `vm` loader (e.g. `tests/helpers/katex-node.mjs`: read `lab/mir/shell/vendor/katex/katex.min.js`,
  run it in a `vm` context with a `module`/`window` shim, return `katex`) — the kit's copy has no CommonJS
  `package.json` and may never get one.
- **The pinned manifest.** `tests/mir-manifest.test.mjs` gains `const ACCEPTED = { '1.4.3': '<sha-256 of MIR-MANIFEST.json>' }`
  and asserts the manifest's own sha-256 is the pinned one for its version — so a forged version fails everywhere, the
  cloud's CI included, and a real adoption is a visible two-file edit (the manifest + the pin row; the assertion message
  says so). Prove it on the forgery: `git show 28fe445:MIR-MANIFEST.json` has version 1.4.4 and no pin — record the sha
  and the failing message in REPORT (a one-off node line in your job tmp, not a committed fixture).
- Measure the precache delta: sum the bytes of the files `lab/sw.js` precaches before and after (a one-off script in
  your job tmp). REPORT the two numbers (the plan expects about 650 KB).
- `node tests/pwa.test.mjs --write`; `bash test.sh node`; browser: `menubar` (ABOUT), `latex-copy`, `current`.

### C6 · Three demos as content (wave 139) — one commit

`lab/demos/` holds one demo (`wave-dancer.lambdawaves.json`), opened by the `.pj-demo` buttons in
`lab/index.html:108` through `rack.js` ~4079 (fetch → `projects.importText` → `projects.open`). Add **water**, **benzene**,
**N₂**: three project files + three buttons (`WATER`, `BENZENE`, `N₂`, titles in the same voice). Each demo: MOLECULES on
as field owner, the molecule and STO-3G, VIEW ORBITAL on the HOMO, a camera pose that shows the shape, MO-REGISTRY on
the rack, and a notebook of 3–6 lines for a first-minute visitor (what is on the stage, which ladder to press, what KICK
and RUN do; the HOMO by index — S1 adds the symmetry names and will revise these lines). **W129's law**: a demo carries
no look or quality (no theme, glass, accent, frost, quality keys — compare a fresh export against
`wave-dancer.lambdawaves.json` to see what was stripped) and never writes the visitor's preferences on open. Produce them
through the app itself (a headless session on your gate server: set the scene, `LW.projects.exportText()`), then strip.
Test (browser, one small suite or rows in `tests/new-project`/`first-run`): each demo opens with `chem` as the field
owner and the right molecule id, and `lambdawaves.q0.settings` is byte-identical outside the WORKSPACE keys after the
open (the STATE-SCOPES law). Benzene is the cap: its open solves for seconds — the status line says so; that is correct.
`node tests/pwa.test.mjs --write` (the files precache like WAVE DANCER).

## 4 · The gates at the end (your one light check; the verifier does the rest)

`bash test.sh node` green. Browser, one at a time on 8731/5203: `latex-copy`, `menubar`, `first-run`, `molecular-names`,
`register`, `chem`, `routed-knob`, `new-project`, `history`, `frame-occlusion` (Cloud's first run moved four windows onto
the left rack), `render-regressions`, `current`, `offer`, `export3d`, and every suite you added. `node tools/new-project.mjs
--check`. `node tests/mir-manifest.test.mjs`. The digest lock (`node tools/perf/digest-lock.mjs --check`) only if you
touched `lab/field.js`, a shader, or the frame loop's order (you should not have).

## 5 · What you do not do

No version bump, no tag, no CHANGELOG, no deploy, no push. No `lab/mir` edit. No new window, tab or setting beyond what
§3 names. No rewrite of the STAGE FORMULA or ATOM LABELS (S3/`cameraEye` do that). No names (S1). No lens shift (S2).

## 6 · Hand-off

Write `research/release-0.4.0/S0-BUILD.md`: the commits (sha + title), per commit the gates run with counts, the precache
delta, the forgery proof, the LINKED verdict, anything left open with its reason. Your final message = that file's
summary in ten lines. Then kill your gate server by pid.

## 7 · Harness notes

Compound shell with variables, loops, heredocs or backticks is refused: plain separate commands; scripts as files in
your job tmp dir (`$CLAUDE_JOB_DIR/tmp` if set, else `.tmp/` in your worktree). `sed` without backticks. If a command is
refused, do not retry it verbatim — reshape it. The Opus weekly limit may end you mid-wave: commit often, so Fable can
pick up from your branch.
