# THE SENIOR PASS · R1 — THE AUDIT (Claude Yan, 2026-10-25; read-only, no edits)

Measured on `yan-c` @ 28c7b9a with dependency-cruiser 18.7.0 (`--no-config`, default rules, lab · tests · tools), knip 6.43.0 (entries main.js ·
gpu-boot.js · sw.js · mathworker.js · tools/** · tests/**; vendor, the kit's vendored marked/KaTeX and the volumes link ignored), and grep. The raw
reports sit in `.tmp/audit/` (gitignored; `summarize.py` re-makes `summary.md`). Serena was not connected (R0 is Josh's hand); it was not needed for this row.

## 0. The figures
| what | count |
|---|---|
| lab app modules (lab/*.js + shell + windows) | 153 (131 + 13 + 9) |
| kit modules (lab/mir) | 153 · 49 imported by the app · 19 unreached from the entries |
| tests | 113 node · 41 browser (167 files in the graph) · tools 81 |
| lines under lab (js + css) | 37,265 — field.js 2,468 · chemview.js 1,546 · lab.css 1,144 · skin.css 1,013 · rack.js 976 |
| CLAUDE.md | 16,466 words |
| `!important` by `grep -o` | 38 (lab.css 11 · skin.css 27) — CLAUDE.md says 36 |
| TODO · FIXME · HACK in lab | 0 |

## 1. What is SOUND (leave it)
- **The graph is acyclic**: 0 cycles, 0 default-rule violations across lab, tests and tools.
- **The kit never reaches into the app**: 0 kit → app edges. The kit's laws hold in λWAVES' copy.
- **Every app file is reached** from the four entries on the static graph; knip finds **0 unused files**. The `wiring` gate did its work.
- The two orphans are expected: `lab/sw.js` (the service worker is its own root) and the kit's `render/store-worker.js` (a Worker URL).
- The hubs are the designed ones: `rack.js` fan-out 48 (boot) · `windows/readouts.js` 27 · `mathworker.js` 26; fan-in `hydrogen.js` 52 (the physics core)
  · `hamiltonian.js` 26 · `field.js` 25 · `names.js` 16. Nothing surprising sits high.
- No markers, no unused files, no cycles: this is not a vibe-coded tree. The pass is a trim, not a rescue.

## 2. THE RANKED QUEUE
### Q1 · the instructions (R3) — highest value, zero runtime risk
CLAUDE.md at 16,466 words is loaded whole by every agent, every session: the single most expensive artefact in the repo and the one most likely to
drift (its `!important` count already reads 36 against 38 measured). Split by subject into `docs/laws/`, keep a two-page CLAUDE.md (constraints · gates ·
index), prove by a sentence-level diff that every law landed.

### Q2 · kit day (R2) — the debt that compounds
alpha.25–27 live only here. The 19 kit files λWAVES never reaches (`mir/app.js`, `core/ink.js`, `history/*`, `info/page.js`, `notes/*`, `panels/{grade,index,
lanes,morph,xy}.js`, `pattern/*`, `render/store-worker.js`, `shell/{language,opener,share-link}.js`) are kit features, not dead code: they ship whole and
are never precached (`wiring --unreached-kit`). Copy home with nothing dropped; the three apps adopt.

### Q3 · the doubles (R4) — small, provable
The census of function names declared in two or more lab files, classified:
| name | files | verdict |
|---|---|---|
| `bondsOf` | elements.js · skeleton.js | THE KNOWN DOUBLE (length rule vs orders/rings/ionic/H-bond) → one rule; THE LOCK + the sticks' browser look are the proof |
| `uniqueName` | capture.js · user-presets.js | iteration 016 re-wrote a helper capture.js already had — check the two laws (`name 2` vs a file suffix) and share one |
| `cholesky` | linalg.js · sturmian.js | likely one dense and one specialised; merge only if byte-equal on the Sturmian tests |
| `gauss` | atoms.js · state.js | probably Gaussian vs quadrature — a RENAME for clarity, not a merge |
| `tableFor` | field.js · separable.js | check |
| `statusOf` | volumes.js · status.js | different meanings (install status vs the stage's STATUS word): rename one |
| `digest` | render-exact.js · sw.js | keep: the service worker is its own world |
| `psiAt` ×3 · `configure` ×4 | molecule/hydrogen/separable · central/cornell/separable/mathworker | THE SYSTEMS' INTERFACE: same name on purpose, keep |
| `ionisation` · `vec` · `split` · `spectrum` · `run` · `install` · `closed` · `build` | various | generic names, no action |

### Q4 · the un-export sweep (R4) — 109 unused exports in app code
knip, with tests and tools as entries, finds 109 exports nothing reads (kit: 459 — its public API, informational; shell: 5). Top rows: `rotor4.js` 11
(INV_SQRT2, the bivector planes, E0–E3, qdot, qnorm), `names.js` 7 (chargeCentre, coreElectrons, the four tolerances, parts), `frontier.js` 6, `separable.js`
6 (FORMS, SEP, configure, labelOf, tableFor, psiAt — the systems' interface may be read by name through a registry: CHECK before touching), `density.js` 5,
`shell/stage-words.js` 5 (INFO_KEY, KINDS, BLOB_INFO, liftInfo, capLine), `volumes.js` 5, `canon-gauge.js` 4, `atoms.js` 4, `bloch-model.js` 4,
`radiation.js` 4, `picker-fx.js` 4, then 3 and 2 each (library, look, scf, molecule, h2ci, gas, export3d, md, sturmian, dynamics, molecular-session, chemview,
angular-nodes). The action is to UN-EXPORT (never delete) what nothing reads, one commit, `bash test.sh node` + the facade pin as the proof. A list is an
investigation queue: `angular-nodes.js` is alive (vortex imports `createAngularNodes`); only its two extra exports are unread.

### Q5 · the dead doors (R5) — Josh's word per door
| door | where | state |
|---|---|---|
| Gemma / ASK | `lab/ask.js:10` `ASK_ENABLED = false` | hidden since 011 Q6; the whole road kept behind one flag |
| the home button | `#lwHome` in picker.js and skin.css | hidden since 013 H4 (LIBRARY opens the same Picker) |
| SCRUB on the bar | `lab/shell/transport.js:20` `ui.scrub` built and unmounted | kept so presets, CLEAR, restore and KEEP FRAMES stand (014 A1) — stays |
| THE MIR LOGO BUTTON | `logoButton`, transport.js | kept for a function to come (Josh's name) |
| retired-window shims | RETIRED_WINDOWS, `docs/LEGACY-WINDOWS.md` | STAY: they open older files |

### Q6 · test reach — a fact, not a defect
75 of 153 app files are imported directly by a node test; 72 are reached by none, and they are the UI modules (the views, the shell, the windows, picker,
rack.js) that the 41 browser tests drive through the page. The designed split. A later row could list which WINDOWS have no browser test at all; not
measured here.

### Q7 · the tools' stray dependencies
knip's four `unlisted`: `electron` and `@electron/packager` under `tools/platform/electron` and `tools/perf/electron-main.cjs` (the stores program's M0).
Either a `package.json` in that subtree or a knip ignore; nothing in lab/.

## 3. The order I would run
Q1 (R3) → Q2 (R2) → Q3 + Q4 together as one R4 commit per double → Q5 as Josh answers → R6 and the cut. Each row ends with `bash test.sh node`,
`node tools/rack-deps.mjs --classes` (G-G), THE LOCK 843/0 and 987/0 (`--query gastab=0`), and the browser tests of any touched window.

## 4. Not found, and said so
No cycle, no boundary breach, no unused file, no marker, no kit reach into the app. Sol's "architecture debt" in λWAVES is, measured, three small doubles,
an un-export sweep, and a 16,000-word instruction file. The kit seam is the one structural debt, and it is a process debt (kit day), not a code one.
