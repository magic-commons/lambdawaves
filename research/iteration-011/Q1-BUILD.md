# Q1 · THE QUIET STAGE — build note (iteration 011, branch `it011-quiet`, base `37088a7`)

Josh, 2026-10-19, verbatim (the parts this row builds):

> For the informational, also include a button that hides the extra status thingy. When switching between different hamiltonian systems (which
> usually adds a lot of different orbitals), have the informational automatically hide ultra large lists so it doesn't fight the screen and users
> don't have to keep toggling it on and off just because a certain mode uses an obscene amount of 140 levels. … Also I feel that the skeleton's
> circles are a little too small, maybe make them a little bigger and remove the outline on the circles so that it's a flat colored disk. Or
> actually, move skeleton into it's own row amongst stage formula and atom labels with a size knob to increase the disk size.

Gate server 9401, GD 5401 (the old skeleton from `git archive 37088a7` on 9402). Screenshots: `q1-shots/`, headless Firefox, 1500 × 1000.

## 1 · What each block is (the BEFORE shots)

Every shot has INFORMATIONAL open (it is closed on a first run), so its own rows show as well as the stage.

| shot | the stage draws | INFORMATIONAL's STATUS row |
|---|---|---|
| `before-h2p.png` (hydrogen 2p₀) | the FORMULA block: `$2p_{0}$` | `HYDROGEN · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)` |
| `before-au.png` (ATOM Au, LOAD VALENCE) | the FORMULA block: 13 labels, `6s₀, 4f₋₃ … 5d₂` (two lines) | `Au · NUMERICAL · scalar-relativistic (ZORA · MV) Xα; spin–orbit not included`, and under it `NUMERICAL · ATOM · Au · one Xα(2/3) + Latter-tail central field, scalar ZORA, MacDonald–Vosko exchange · no spin–orbit …` |
| `before-water.png` (MOLECULES, H₂O) | the FORMULA block `H₂O` and the ATOM LABELS `O H H` | `DENSITY · NUMERICAL · energy agrees with PySCF to 3e-13 Eh · picture good to 0.2 % of ρmax` / `NUMERICAL · energy agrees …` |
| `before-fill140.png` (hydrogen, FILL ALL) | the FORMULA block: all 140 labels, 1458 characters of markdown, 16 lines from the top of the stage through the transport | `HYDROGEN · EXACT · …` |

So the stage words draw these blocks: the FORMULA block (the molecule's formula, or SPECTRUM's populated list), the ATOM LABELS, and three
opt-in kinds that are off on a first run (THE FADE, the pop-ups, THE HEAD). The pop-ups and THE FADE carry no status. THE HEAD's fifth line is a
molecule-level status, but THE HEAD is its own switch (ANNOUNCE › MOLECULE HEAD, off).

**The "extra status thingy" is INFORMATIONAL's STATUS readout.** The plan read it as a sentence the stage draws beside the formula. The shots say
otherwise: no status sentence is drawn on the stage at all. Au's long `scalar-relativistic … spin–orbit not included` sentence is the STATUS
readout at the foot of the INFORMATIONAL card. It is a wide two-line readout and the only status-like block the stage words own. It gets one
switch, STATUS. The export caption's STATE word (`1s₀, 2p₀ · EXACT`) is not on the stage and is not that switch's: it is a picture's honesty
line and follows STAGE FORMULA, as before.

## 2 · What changed

| file:line | change |
|---|---|
| `lab/shell/stage-words.js:29-33` | the `listCap` row: number 4 … 140, step 1, LOG knob, default 16, label LIST CAP |
| `lab/shell/stage-words.js:43-48` | `skeleton` moves to the group `skeleton`; the new `skeletonSize` row: 0.5 … 4, default 1.6, label SIZE |
| `lab/shell/stage-words.js:51-53` | the `status` row: bool, default false, label STATUS |
| `lab/shell/stage-words.js:78, 86-88` | THE LIFT for STATUS: a profile that met INFORMATIONAL before this key (a record without `status`, or a blob the old lift read) opens with STATUS **on**, as it saw it |
| `lab/shell/stage-words.js:95-99` | `capLine(ids)` → `140 levels · 7 shells` (the labels, and the distinct n among them; singular at 1) |
| `lab/shell/stage-words.js:109-111` | `stageStates`: a list longer than the cap is its count line, on either side of A ↔ B. The stage and the caption both read it |
| `lab/shell/stage-words.js:279` | a LIST CAP change re-writes the formula at once (as NAME does) |
| `lab/informational.js:21` | a row's `log` reaches the knob |
| `lab/informational.js:31-33` | THE WORDS: NAME · LIST CAP, ATOM LABELS · SIZE, then **SKELETON · SIZE**; MARKS keeps BEAD · UNCERTAINTY (`:44`) |
| `lab/informational.js:45` | `ui.skeletonSize` is the knob's widget; the frame reads it as it reads `ui.skeletonSw` |
| `lab/informational.js:52-56` | the STATUS switch row above the readout; the readout's row is hidden while `status` is off (the line is still kept current) |
| `lab/skeleton.js:20, 26, 35-36` | `draw(…, size = 1)`; size is in the paint key; R = size × 0.28 × r_cov; **no `stroke()`** — a flat disk |
| `lab/rack.js:511` | the frame passes `ui.skeletonSize.get()` (1.6 when absent). The `app` literal is not touched |
| `lab/skin.css:801` | `.info-status`: the STATUS switch on THE WORDS' grid |
| `tests/stage-text.browser-test.mjs:117` | INFORMATIONAL has 6 dials now (LIST CAP and SKELETON's SIZE join the four) |
| `docs/STATE-SCOPES.md:38, 166` | the three new keys in the info record's row; SKELETON's new seat |
| `CLAUDE.md:135-147` | THE QUIET STAGE paragraph (below) |

## 3 · The defaults

| key | first run | an older record | why |
|---|---|---|---|
| `status` | OFF | **ON** (as it was) | Sos's ruling is OFF by default, and Q2 minimises for "default users". A profile that already saw the readout keeps it, so the brief's "an older record opens as today" holds. A hand's choice is kept from then on |
| `listCap` | 16 | 16 | The brief says "about 12". I chose 16 because it is the longest LOAD VALENCE (4f 5d 6s 6p for Tl–Rn, 5f 6d 7s 7p for Nh–Og: 16 labels), so every atom's valence still reads as its subshells. At 12, Au's 13-label valence would collapse. The 140-label flood collapses at either value. One `default` changes it |
| `skeletonSize` | 1.6 | **1.6** | This is the one visible change for an older record (the brief's "except for the new default size"), along with the disks losing their outline |
| `skeleton` | off | unchanged | The key and its meaning are the same; only its seat moved. The first run does not draw it, so THE LOCK's rows never see it |

Every existing key of `lambdawaves.q0.info` keeps its meaning. No saved id moved: the card is still `informational`, and the controls are
`info.<key>`.

## 4 · The proof (AFTER shots)

**STATUS.** `after-status-off.png` shows Au with the first-run record: the STATUS switch is off and no readout row is shown. `after-status-on.png`
shows the same scene with STATUS on, and the readout returns with Au's long sentence. The record reads `status: false` → `true`, and the stored
key follows.

**THE LIST CAP.** `after-fill140.png` is hydrogen after FILL ALL. The stage reads **`140 levels · 7 shells`** (21 characters, against 1458
before), and the caption reads `140 levels · 7 shells · EXACT`. `after-6levels.png` is Fe's LOAD VALENCE: six labels, listed as before
(`4s₀, 3d₋₂ … and 3d₂`). `after-status-on.png` also shows Au's 13 labels still listed under the cap. Setting LIST CAP to 140 lists all 140 again
(1458 characters). Setting it back to 16 collapses the list again, with no other action.

**An older record.** The shots used an info record with `status`, `listCap` and `skeletonSize` deleted, then reloaded. It opened with
`status: true` (the readout shown, and the key written), `listCap: 16` and `skeletonSize: 1.6`.

**SKELETON** (water and benzene, MOLECULES on, DENSITY, the first-run camera). The old tree is `old-water.png` and `old-benzene.png`. The new
tree is `new-*-100`, `new-*-160` (the default), `new-*-50` and `new-*-400`. The radius was measured on the `#skeleton` canvas's own pixels (water's
O, the CPK red, by area):

| | O radius | ink outline |
|---|---|---|
| old (0.28 × r_cov) | 20.2 px of red, plus the 1 px ink ring (lineWidth 1, centred on the edge) | yes |
| new 100 % | 21.0 px (the same disk; the ring no longer covers its inner half pixel) | none |
| new **160 % (default)** | **33.6 px** (1.60 × 21.0) | none |
| new 50 % · 400 % | 10.6 px · 83.0 px | none |

Dark ink pixels on the canvas fell from 424 (old: bonds and rings) to 221 at 100 %, which is the bonds alone. The bonds and the dipole keep their
2 px at every size. They are the skeleton's lines, not its disks, and the brief keeps them as they are. At 400 % the disks cover most of water's
bonds, as a space-filling model would. H stays CPK white. Without its ring it still reads, as a white disk on the density or the frosted ground
(`new-benzene-160.png`).

The INFORMATIONAL card with the new rows is in `after-card-default.png`: STAGE FORMULA · SIZE / NAME · LIST CAP / ATOM LABELS · SIZE / SKELETON ·
SIZE / POSITION · PAD / the fold (ANNOUNCE · CURSOR · MARKS = BEAD · UNCERTAINTY) / STATUS. Page errors: none.

## 5 · The gate

| check | result |
|---|---|
| `node tests/pwa.test.mjs --write` | written; the check after it passes |
| `./test.sh node` | exit 0, every suite GREEN |
| `node tools/rack-deps.mjs --classes --no-write` | THE HINGE HOLDS. stage-words is now 288 lines and still handed 7. The `app` literal still has 30 keys and is not extended |
| `node tools/new-project.mjs --check` | in step (16098 B). No project default moved: every new key is a PREFERENCE |
| `stage-text.browser-test` | GREEN 4/4. §4 now expects 6 dials |
| `chem.browser-test` | 55/56. The one red is **L7 glycine's solve-time budget** (2365 and 2150 ms against 1638). The **base tree `37088a7`, served on 9402 under the same load, is red on the same row** (1699 ms). The load average was 13–16 because other builders were running. The worker's solve is untouched |
| `current.browser-test` | exit 0 (15 PASS) |
| `history.browser-test` | exit 0 (45 PASS) |
| `official-defaults-palette.browser-test` | red with "vivid is undefined", as the brief says it is on the base: not this row's |
| `molecule-head.browser-test` | GREEN 3/3 |

**THE LOCK** was not run, because no change can move it. Its rows run with the default record, where SKELETON is off, so `#skeleton` is never
painted. `tools/perf/digest-lock.mjs` reads only the field's pipelines (readPixels and the record), never a caption or the stage's DOM. No file
of the field (`field.js` and the shaders) was touched.

## 6 · CLAUDE.md (added after the CAPTION sentence, in the STAGE FORMULA paragraph)

> THE QUIET STAGE (iteration 011 Q1; Josh 10-19: "For the informational, also include a button that hides the extra status thingy. When
> switching between different hamiltonian systems (which usually adds a lot of different orbitals), have the informational automatically hide
> ultra large lists so it doesn't fight the screen and users don't have to keep toggling it on and off just because a certain mode uses an
> obscene amount of 140 levels." … "move skeleton into it's own row amongst stage formula and atom labels with a size knob to increase the disk
> size"): three rows of the same record, `lambdawaves.q0.info`. STATUS (`status`) shows or hides INFORMATIONAL's STATUS readout — the only
> status block the stage words draw … OFF on a first run, ON for a record older than the key … THE LIST CAP (`listCap`, NAME's row, 4 … 140,
> LOG, 16 by default = the longest LOAD VALENCE): a SPECTRUM list … longer than the cap is written as its count — `stage-words.js` `capLine`,
> "140 levels · 7 shells" … SKELETON (`skeleton` · `skeletonSize`) is THE WORDS' third ON + SIZE row …: FLAT disks, no outline, radius SIZE ×
> 0.28 × r_cov — 100 % is the old disk …, the default 160 % …; the bonds and the dipole keep their 2 px. … SKELETON stays off by default, so
> THE LOCK cannot move.

## 7 · For the integrator and Josh

- `lab/sw.js` was refreshed by `node tests/pwa.test.mjs --write` and is **not committed**: the integrator rewrites it at the merge, as in every
  row since 007.
- Josh's calls: LIST CAP 16 or 12 (one `default`); whether an older profile should also lose its STATUS readout (one line in `infoPrefs`);
  whether the bonds should follow SIZE (they do not today).
