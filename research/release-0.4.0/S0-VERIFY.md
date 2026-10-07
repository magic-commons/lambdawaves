# λWAVES 0.4.0 · S0 VERIFY — the release verifier's report on the merged S0 tree

Written by the S0 release verifier (fresh eyes, no part in the build), 2026-10-07, against `BRIEF-S0-VERIFY.md`, the
contract `BRIEF-S0.md` (C1–C6) and `PLAN.md` §3 B0 / §6 S0. **Tree verified: `bc103b3`** (= S0 tip `767ab6e` + the
research-only Sol commit; `git diff 767ab6e bc103b3 -- lab/` is empty). Worktree fast-forwarded from `28fe445` with
`git merge --ff-only bc103b3`; `git log --oneline -1` → `bc103b3`. Ports 8745 (gate server, my pid only) / 5213
(geckodriver). Browser suites ran ONE AT A TIME (`.tmp/run-browser.sh`, a plain loop), 16:59–17:05 CDT. Nothing under
`lab/` was touched; `git status` was clean after every run (no gate repaired a source file). Scratch scripts and logs
are in this worktree's `.tmp/` (gitignored): `run-browser.sh`, `precache-sum.mjs`, `deleted-sum.mjs`, `who-touched.mjs`,
`probe-desktop.mjs`, `probe-2.mjs`, `probe-3.mjs`, `odp-scratch.mjs`, `browser/*.log`.

## 1 · The gate table

| suite | count | verdict |
|---|---|---|
| `bash test.sh node` (82 `tests/*.test.mjs`, pwa last) | 82 suites, 0 red, exit 0 | GREEN |
| `node tests/pwa.test.mjs` (no `--write`) | 185 files, 4.45 MiB, hashes re-verified | GREEN |
| `node tools/new-project.mjs --check` | in step, 16 829 B | GREEN |
| `node tests/mir-manifest.test.mjs` | MIR 1.4.3, 66 files, pinned `a4c3b90102d0…` | GREEN |
| `node ~/Documents/MIR/tools/adopt.mjs <root> --check` | DRIFT `lab/mir/modulation/host.js`, `mod.js` only | GREEN (the two named exemptions; nothing else under `lab/mir`, `lab/fonts`) |
| `chem.browser-test` | 54 / 54 | GREEN |
| `current.browser-test` | 15 PASS | GREEN |
| `export3d.browser-test` | 10 PASS | GREEN |
| `field-molecule.browser-test` | 9 PASS | GREEN |
| `frame-occlusion.browser-test` | 7 PASS | GREEN |
| `gpu-recovery.browser-test` | 8 PASS | GREEN |
| `history.browser-test` | 39 PASS (122 s) | GREEN |
| `input.browser-test` | 13 PASS | GREEN |
| `keyboard-window.browser-test` | 1 PASS | GREEN |
| `latex-copy.browser-test` | 9 PASS | GREEN |
| `lfo-tension.browser-test` | 3 PASS | GREEN |
| `menubar.browser-test` | 8 PASS | GREEN |
| `mir-controls.browser-test` | 2 PASS | GREEN |
| `molecular-diff.browser-test` | 15 / 15 | GREEN |
| `molecular-names.browser-test` | 5 PASS | GREEN |
| `molecule-demos.browser-test` | 3 PASS (water 1.0 s, benzene 2.2 s, N₂ 0.6 s) | GREEN |
| `new-project.browser-test` | 8 PASS | GREEN |
| `offer.browser-test` | 16 / 16 scenes | GREEN |
| **`official-defaults-palette.browser-test`** | **aborts at assertion 1 (0 of 3 scenes); re-run alone: identical red** | **RED → BLOCKER 1** |
| `orbitals.browser-test` | 24 / 24 | GREEN |
| `register.browser-test` | 17 / 17 | GREEN |
| `render-regressions.browser-test` | 2 PASS | GREEN |
| `routed-knob.browser-test` | 4 / 4 | GREEN |
| `take-in-bugs.browser-test` | 4 PASS (LINKED 48 ms / 34 ms) | GREEN (see SHOULD 1) |

Browser: **23 of 24 suites green on the first run**; no timing flake and no identical-hash gate went red, so nothing
needed the re-run-alone rule except the one red, which reproduced identically alone. `tests/legacy/boot.browser-test.mjs`
was not run (test.sh: not part of the shipped gate).

## 2 · The laws, scene by scene (what was tested, what came back)

| law (BRIEF-S0-VERIFY) | evidence | verdict |
|---|---|---|
| §2 manifest true and pinned | `MIR-MANIFEST.json` 1.4.3, sha-256 `a4c3b901…2d23`; `git diff 7a8fd89` / `61f7c2c -- lab/mir lab/fonts MIR-MANIFEST.json` empty | holds |
| §2 the pin bites | scratch tree `.tmp/forge/` (the test copied, `lab` symlinked, `git show 28fe445:MIR-MANIFEST.json` as its manifest, sha `42b76e5a…aaf0`): `AssertionError … names MIR 1.4.4, which is not an accepted adoption (accepted: 1.4.3). A real adoption is a two-file edit: the manifest MIR's tools/adopt.mjs writes, and its sha-256 pinned in ACCEPTED in tests/mir-manifest.test.mjs.`; relabelled "1.4.3": `… has sha-256 bd3f7527…, not the pinned a4c3b901… a real adoption is a two-file edit …`; the real manifest in the same scaffold: PASS. The tree's own file was never touched. | holds |
| §2 Jet Black listed and `flat` | the PALETTE window's select lists 34 rows, `jetblack` "Jet Black" in "3 points"; chosen through the select's `change`: stops `[0,0,0]×3`, no errors. Pixel probe on the composited stage (light theme, 1s+2p₀, 21 932 uncovered stage points; 1 776 "cloud" points with chroma > 60 under prism): median chroma 93 → **5** (99.2 % of cloud points < 12), median luminance 204 → 112, the ground stays 255 — a black body, not a phase map (`.tmp/verify-palette-before.png`, `.tmp/verify-palette-jetblack.png`) | holds |
| §2 Jet Black's road | `lab/mir/palette.js` byte-identical to 1.4.3 (`git diff 7a8fd89 -- lab/mir/palette.js` empty); `lab/palette-app.js` appends the row; `rack.js:20` imports it ahead of `paletteview` (:59) and the palette (:67); `tests/palette.test.mjs:28` imports the app module | holds |
| §2 a link / project naming `jetblack` | `__LW.link.mint()` on Jet Black → palette moved to twilight → `__LW.link.open(href)` → `jetblack`; a saved project exports `paletteId: "jetblack"` and reopening it restores `jetblack` | holds |
| §2 EDIT › COPY under a molecule | `latex-copy` §8 (green): SPECTRUM `hidden=false`, `folded=true`; the EDIT row not disabled; clipboard `$\mathrm{H_{2}O}$, water — RHF/STO-3G … 5 occupied of 7 AO`, `\varepsilon_{5}`, `(\mathrm{HOMO})`, `(\mathrm{LUMO})`; MOLECULES off → unfolds and copies `$1s_{0}$ and $2p_{0}$` | holds |
| §2 `.mol-more` desktop first run | fresh profile, 1500 × 1000, no click: MOLECULES on the rack, unfolded, `.mol-more` visible, chevron `aria-expanded=true`, KICK / RUN / TDA / CORE / FLOW / SPEED / STEP / INTEGRATOR visible; HELP off and MOLECULES' `Aa` shown (no other card's) | holds |
| §2 `.mol-more` phone | 500 × 930 headless (hover:none, `layout.phone.on`): MOLECULES folded, `.mol-more` hidden, `aria-expanded=false`; rack shown, card unfolded by a real tap on its chevron → the MORE control is visible and the `Aa` shown with HELP off; a real tap on MORE opens it (KICK, RUN, TDA visible) (`.tmp/verify-phone-more.png`) | holds |
| §2 tests un-bent | `grep -n "mol-more" tests/*.mjs` → only `chem:134` and `routed-knob:18`, both through `.mol-more-toggle`; no `.mol-more.hidden = false` left | holds |
| §2 SPECTRUM's operators | OPERATOR seg = HYDROGEN · OSCILLATOR · BOX · ATOM · QUARKONIUM(hidden); a real driver tap on ATOM → hamiltonian `atom`, ATOMS un-hidden, open, on the right rack (126 451 px²); `git show 7a8fd89:lab/new-project.lambdawaves.json` edited to `hamiltonian.id = "cornell"`, through `projects.importText` → `projects.open`: restores `cornell`, the (hidden) QUARKONIUM seat selected, no errors | holds |
| §2 CLAUDE.md | no "1.4.4" anywhere; the first-run rack law once (line 28); the Cloud process line (line 71); "never part of the occlusion mask" sits in the STAGE FORMULA paragraph | holds |
| §3 CALCULUS ⧉ | a real tap on `.dev[data-id="calculus"] .dev-copy`: 56 lines with its rows (was the header alone) | holds |
| §3 tags off METERS' tick | `take-in-bugs` §3 (Stark shown in ≤ 300 ms with METERS closed); STATUS TAGS OFF (the first-run default), playing, Stark switched on and off over 2 s: **0** mutations on `#badges`; the same observer with tags ON: 17 (the sanity) | holds |
| §3 WIGNER / RADIATION under MOLECULES | water on: WIGNER `hydrogenic register only`, RADIATION `hydrogenic register only`, no errors | holds |
| §3 LINKED | the suite exists and is green; REPORT's verdict vs its assertions → SHOULD 1 | holds, wording |
| §4 vendor wired | `lab/vendor/` = `bse/` only (`git diff 7a8fd89 -- lab/vendor/bse` empty); `index.html:57,71,72` load `./mir/shell/vendor/…`; the six ABOUT licence hrefs all 200 on 8745 (curl; the old `vendor/katex/katex.min.js` 404); 26 of the 27 deleted files have a byte-identical kit copy (the 27th, `package.json`, by design) | holds |
| §4 NOTEBOOK KaTeX | `verify $x^2$` in view mode: 1 `.katex`, 0 `.katex-error`, a `msupsub`; scripts from `mir/shell/vendor/` | holds |
| §4 wiring ALLOWLIST | no vendor rows; five shell rows dated 2026-10-07, each naming "the 0.5.0 adoption (PLAN.md §6)" | holds |
| §4 precache delta | reproduced from git objects (`node .tmp/precache-sum.mjs 7a8fd89 1424d9f eaecf5e bff9057 HEAD`): 7a8fd89 205 / 4 858 652 B · C4 tip 207 / 4 899 018 B · C5 182 / 4 607 101 B · C6 = HEAD 185 / 4 664 889 B. Deploy: 27 files, 602 870 B deleted (`node .tmp/deleted-sum.mjs 1424d9f eaecf5e lab/vendor`) — matches S0-BUILD except 60 B at the C4 tip (NOTE 1) | holds |
| §5 the demos | `molecule-demos` (green): each button opens `DEMOS/…`, MOLECULES the field owner on H2O / C6H6 / N2, ORBITAL on the HOMO (5/7, 21/36, 7/10), notebook open, no microphone, settings byte-identical outside the WORKSPACE keys; benzene lands in 2.2 s; WAVE DANCER opens (`current`, `latex-copy`, `take-in-bugs`); camera poses ride in `presentation.obs` | holds |
| §6 the merges | `0242bff` = 61f7c2c + **2a03c06**, `5c7109e` = 0242bff + **28fe445**; `git show --cc` on each touches only `lab/sw.js` (no evil merge); `git log --merges -3` shows later worktree merges (NOTE 2) | holds |
| §6 the lab diff | `git diff 28fe445 HEAD --stat -- lab/` (43 files): C3 `ebd45d5`, C4 `1424d9f`, C5 `eaecf5e`, C6 `bff9057`, plus the release-0.4.0 parent's 0.3.3 exports (NOTE 3); nothing else | holds |
| §6 `sw.js` regenerated; `frame-occlusion` | `node tests/pwa.test.mjs` passes without `--write`; `frame-occlusion` 7 PASS | holds |

## 3 · Findings

### BLOCKER (1)

**BLOCKER 1 — `tests/official-defaults-palette.browser-test.mjs` is RED on the release tree.**
Reproduce: `python3 tools/gate/server.py <root> 8745 &` (wait for `λWAVES gate server on …`), then
`LW_PORT=8745 GD_PORT=5213 node tests/official-defaults-palette.browser-test.mjs` →
`AssertionError … + aaHidden: false  - aaHidden: true` at `tests/official-defaults-palette.browser-test.mjs:20`.
Deterministic: identical red when re-run alone. Cause: C3(d) (`ebd45d5`) made the contract's law real —
`lab/lab.css:425` `body.window-info-off .dev:not([data-id="chem"]) .dev-lean { display: none; }`, MOLECULES' `Aa`
visible with HELP off — but this suite (last edited `bd2b335`) still asserts that EVERY `.dev-lean` is hidden on a
fresh desktop, while `tests/chem.browser-test.mjs:137` now asserts the opposite for MOLECULES. The suite was not in the
builder's C3 gate list and the §4 light check was never run, so the red was never seen. Because it aborts at its first
assertion, its other two scenes (the WAVE shader's palette θ seats; prior browser choices surviving the first-run
defaults) did not run in the gate at all. With that one assertion scoped to the non-MOLECULES windows plus a
`chemAaShown: true` row (scratch copy `.tmp/odp-scratch.mjs`, not committed), the suite runs **3 / 3 PASS** on this tree.
Law broken: PLAN §6 S0 "every gate green on the merged tree"; CLAUDE.md "Keep
`tests/official-defaults-palette.browser-test.mjs` green when editing either [the first-run preferences]". The fix is
test-only (one line in `tests/`, no `lab/` edit); then re-run this suite alone.

### SHOULD (1)

**SHOULD 1 — the LINKED verdict says "FIXED"; the test accepts the symptom Josh reported at a fresh start.**
Reproduce: `LW_PORT=8745 GD_PORT=5213 node tests/take-in-bugs.browser-test.mjs` → its PASS line reads "a real Space
plays both clocks …" and in the same line logs `project start, editor closed, nothing routed: … mod refused (nothing
to run)` and `after NEW, editor closed, nothing routed: … mod refused`. `tests/take-in-bugs.browser-test.mjs:57-62`
accepts `refused > before.refused` in place of the modulation clock advancing whenever the editor is closed and nothing
is routed. BRIEF-S0 C4 asked the test to "assert the field clock AND the modulation clock both advance". What wave 137
fixed is the ≤ 1 s stall when the editor opens under a playing field (48 ms / 34 ms here, ≤ 150 asserted). Josh's
literal symptom (Space at a fresh start or after NEW plays the field and not the modulation clock) persists, by MIR's
`nothing-to-run` refusal (`lab/mir/modulation/host.js`, not ours to edit). REPORT wave 137's body says exactly this.
Its heading ("the LINKED bug reproduced") and S0-BUILD's "REPRODUCED … Fixed" read as closed. Law: BRIEF-S0 §1 "say what was measured,
not what was hoped". Cheap: one REPORT/CHANGELOG line ("reproduced; the open-editor stall fixed; the unrouted refusal is
MIR's law, a KIT issue") and the PASS message's wording, so the 0.3.3 notes do not tell Josh his bug is closed.

### NOTE

1. **Precache vs the plan's "~650 KB".** PLAN §6 S0's done-when says "precache down ~650 KB". Measured: the deploy loses
   602 870 B (27 files), the precache loses 291 917 B at C5 (207 → 182 files) and 193 763 B net from `7a8fd89` to HEAD
   (205 → 185 files, the three demos +57 788 B). The builder's account (the kit's `katex.min.js` / `marked.min.js` were
   staged and now join the precache) reproduces. My C4-tip sum is 4 899 018 B against S0-BUILD's 4 899 078 B (60 B; the
   C5 and C6 numbers match to the byte). `node .tmp/precache-sum.mjs 7a8fd89 1424d9f eaecf5e HEAD`.
2. **`git log --oneline --merges -3`** (the brief's command) shows `9090665`, `efaaed8`, `4ca4f54` (later worktree merges),
   not the two Cloud merges; those are `0242bff` and `5c7109e` further back, both `--cc`-clean outside `lab/sw.js`, and
   `git merge-base --is-ancestor` holds for `2a03c06` and `28fe445`.
3. **`git diff 28fe445 HEAD -- lab/` beyond C3–C6:** `lab/export3d.js`, `lab/field.js` (19 lines), `lab/mathworker.js`, and
   parts of `rack.js` / `latex-state.js` / `sw.js` come from `c3dba65` (0.3.3 wave 134, THE SHAPE) and `5cbff0c` (wave
   135, THE COPY). These are the release-0.4.0 parent of the merges, the 0.3.3 exports BRIEF-S0 §0 says S0 carries. Nothing else
   (`node .tmp/who-touched.mjs`).
4. **`lab/sw.js:227`** NEVER_PRECACHE prose still names the deleted `vendor/katex/LICENSE` (S0-BUILD discloses it; no check
   reads it). `grep -n "vendor/katex" lab/sw.js`.
5. **The MORE chevron wraps to its own row** under VIEW + ORBITAL, on the phone too (`.tmp/verify-phone-more.png`), as
   S0-BUILD discloses; reachable and functional, a layout call for S3 / Josh.
6. **`molecular-names` proves `cornell` by `__LW.setHamiltonian`, not by a restore.** The import-road probe above shows the
   restore works. If the suite should guard the road a user takes, use the import road.

fit to cut: **NO**, because one gate is red: `official-defaults-palette` (BLOCKER 1). Its stale assertion contradicts
C3(d)'s MOLECULES-`Aa` law, so it aborts before its palette-seat and saved-choice scenes. The fix is test-only and one
line. With that line scoped as described, the suite ran 3 / 3 here. Every other gate is green and every law in
BRIEF-S0-VERIFY §2–§6 holds. After that fix and a lone re-run of the suite, the tree is fit to cut. SHOULD 1 is a
wording fix for the release notes.
