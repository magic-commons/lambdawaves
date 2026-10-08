# λWAVES 0.4.0 · S4a VERIFY — the worker and the store (fresh eyes)

Verifier: a fresh Opus 5.5 with no part in the build, 2026-10-08. Contract: `BRIEF-S4-LIBRARY.md` §0 and §S4a (every sentence
a scene), `PLAN.md` §3 B2, §4 F5, §6 row S4, §10 N1–N3, `docs/STATE-SCOPES.md`. The builder's `S4a-BUILD.md` and REPORT waves
162–167 were read as claims to test, not as evidence. Nothing under `lab/` was edited; scratch and probes are under `.tmp/`
(untracked). No push, no tag, no deploy.

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-acdc10e4ddf03c1fa`
- **Branch:** `worktree-agent-acdc10e4ddf03c1fa`, reset to `cfdd674` (the `sos-s0` tip, S4a merged); pre-S4a tree `9395ab3`.
- **Ports:** `LW_PORT=8755 GD_PORT=5223`, gate server pid 2281572, killed by pid at the end. One browser session at a time, a
  4 s pause between sessions.

## Verdict

**S4a as merged stands (fit for S4b ∥ S4c on top): NO.** The reason is one BLOCKER, B1 below: a chem.open the page has already
abandoned still reaches the worker and replaces its single solve cache. The next lysine operation then misses the cache and
the worker runs a **live 64-AO solve** (31 s on this desktop). A KICK after that runs **TDHF on lysine**. Two presses in the
MOLECULE menu are enough to trigger it, and it reproduced on 3 of 3 runs. This breaks the benzene-cap law, the "zero solver
calls on open" acceptance and "never a second solve road" when a records-only molecule is opened. S4b adds many record-only
rows to this picker, and S4c adds 87–120-AO records whose dense ERI (458 MB at 87 AO) is "the generator's, never a live
solve's". On that tree the same two presses would run that live solve in the browser.

Everything else in the contract held when I tested it myself. The cause is small: one sequence check before each post, plus
a worker-side refusal (see B1). Once B1 is fixed and its probe is green, my verdict would be YES.

**BLOCKER 1 · SHOULD 1 · NOTE 14.**

## The gate and lock table

| suite / check | count | verdict |
|---|---|---|
| `bash test.sh node` | 85 suites | GREEN (exit 0, first run) |
| `node tests/library.test.mjs` (inside the gate) | 1 suite, every assertion | GREEN — open 7.8 ms, 0 solver calls, bit for bit in node |
| `node tests/pwa.test.mjs` (inside the gate, no `--write`) | 188 files, 4.54 MiB; §L library; §E6 DATA path | GREEN |
| `node tools/orbital-library.mjs --check` run twice | 2 records, 1 612 584 B | in step both times (benzene 2.26 / 2.33 s, lysine 32.45 / 32.47 s) |
| record sha-256 = file name (`sha256sum lab/library/*.json`) | 2 | equal |
| `node tools/new-project.mjs --check` | 16 866 B | in step |
| `node tools/build-deploy.mjs --no-test --quiet` | 211 files, 6.90 MiB | complete; `dist/library/` holds both records and `dist/library.json` is present (dist/ removed afterwards) |
| `node tools/perf/cost-refit.mjs` | 5 rows | reproduces a 4.551569e-5 · b 6.446788e-6 · c 5.564985 exactly |
| browser `library` (new) | 5 PASS | GREEN |
| browser `chem` | 54 / 54 | GREEN (glycine L7 1287 ms against a 1638 ms budget) |
| browser `molecular-names` | 6 PASS | GREEN |
| browser `register` | 17 / 17 | GREEN |
| browser `history` | 39 PASS | GREEN |
| browser `new-project` | 8 PASS | GREEN |
| browser `offer` | 16 / 16 | GREEN |
| browser `molecule-demos` | 3 PASS + GREEN | GREEN |
| browser `latex-copy` | 10 PASS + GREEN | GREEN |
| browser `frame-occlusion` | 7 PASS | GREEN |
| lock `--check --query gastab=0` (the default fixture, `digest-lock-base.json`) | 1004 compared | **RED by construction**: all 144 "differences" are the three new states absent from the old fixture (S1 below) |
| lock `--check --query gastab=0 --states <the thirteen>` | 1004 | GREEN, 0 readback and 0 record-byte differences, 53 s |
| lock `--check --query gastab=0 --fixture research/release-0.4.0/measure/digest-lock-s4a.json` | 1148 | GREEN, 0 / 0, unrepeatable none, 61 s |
| the two fixtures' shared keys (`.tmp/lock-fixtures.mjs`) | 1004 shared | 0 differ; 144 only in s4a (chemC6H6, chemLys, chemLysHomo × 3 grids × 16); the same adapter |

**Re-run alone:** nothing needed it. No timing red appeared and no lock went red because of a flake. The default-fixture RED is
structural (S1), not a flake; the 1004 values themselves are GREEN through `--states`. I ran the B1 reproduction three times,
each alone (`p3 kick`, `p3 idle`, and the console snippet below as `.tmp/p5-snippet.mjs`), and it reproduced every time. The
snippet run gave `{"calls":2,"kicked":true,"kickMs":28649,"status":"64 AOs · 80 electrons · ground 16115 ms (integrals 5397 of
it) · rpa 9617 ms · from its record … no solver call …"}`.

## The scenes, each measured

**Zero solver calls on open** (`.tmp/p1-worker-storage.mjs`, which writes `.tmp/p1-out.json`). Three independent counters:

1. A wrapped `window.Worker`, installed before the chem worker existed, logs every message and its reply. A reply carries
   `timings.scf` or `timings.rpa` only when a real solve ran, and `timings.open` only on chem.open.
2. The frame thread's own `mathworker.js` module (the fallback road) is imported, and its `chemSolverCalls()` is read.
3. The builder's worker `stat` counter.

Results:

- **Live benzene** (record not installed): worker +2, frame thread +0. The messages were chem.ground (scf 1876 ms), chem.states
  (the RPA ran inside it, 583 ms) and chem.spectrum (rpa 463 ms).
- **Lysine by an INSTALL press:** 0 / 0. chem.open took 12 ms (open 8 ms), chem.states was refused with its sentence, and
  chem.spectrum took 10 ms.
- **Benzene from its installed record:** 0 / 0. chem.open took 17 ms (open 13 ms), chem.states 3 ms and chem.spectrum 6 ms;
  the whole `solve()` took 46 ms.
- **A KICK on benzene's record:** worker +1 (chem.rt.init 1661 ms: one SCF, the RPA was not repeated), frame thread +0.
- **A link naming lysine, opened in a fresh profile** (`.tmp/p4-link.mjs`): downloaded, kept, opened with 0 solver calls; the
  view and orbital 38 were restored, and persist() was not asked (there was no press).

**Cached = fresh** (benzene live in Firefox, then from its node-made record, in the same page; my own numbers):

- |ΔE| 1.34e-12, nocc 21 = 21, |Δε| 8.2e-14, |ΔD| 7.4e-14.
- C up to sign: |ΔC| 8.27e-10 with 0 columns flipped; the 12 degenerate-subspace projectors agree to 6.4e-10.
- The names: every label, irrep, count, member and frontier is the same. Only the numerical `residual` fields (~1e-15) and
  two `levels.eps` (4e-14) differ.
- The TDA ladder (canonical, μ included) agrees to 7.1e-11. The STATES ladder: ω 1.3e-13, f 4.2e-13, μ 7.1e-11, the same
  clusters, rMO 4.2e-9.
- The RPA sticks: ω 1.8e-13, ω_TDA 1.3e-13, f 9.3e-13, |μ| 3.7e-11. **The RPA μ vectors and dominant pairs are a different
  rotation** (N1).
- **The volume readback** at 64³, `__LW.field.readGrid()` texel by texel: density **0 of 1 048 576 texels differ**; the HOMO
  (orbital 21) **0 of 1 048 576 differ**; the same `half` (10.6865) and the same ρmax.

**The generator.** `--check` is byte-exact on both runs, and the hashes equal the file names. Broken copies under
`.tmp/broken/` (`node .tmp/refusal.mjs`) are all refused with a sentence and 0 solver calls:

- schema 2;
- C missing;
- a short ε;
- `caps.tdhf: 'yes'`;
- `caps.rpa: false`;
- energy null;
- no atoms;
- a truncated X;
- the wrong basis hash.

An unknown member opens, as the schema says it should. Two internally inconsistent copies pass validation (N2).

**The one precache exemption.**

- `pwa.test` asserts DATA == `['library/']`, that each row's file exists and hashes to its name with its byte count, that
  nothing else is in `library/`, and that the catalogue is precached. All green.
- The two-build probe (`node .tmp/sw-across-builds.mjs`) runs the real `sw.js` as build A and a scratch copy
  (`.tmp/sw-buildB.js`, one PRECACHE hash changed) as build B over one shared Cache Storage:
  - B's activate collects `lw-lab-1o75syln1f8jk` and **keeps `lw-data-v1` with its record**;
  - an installed record is served with 0 fetches, and its bytes hash to its name;
  - an uninstalled one goes to the network;
  - the worker makes **0 puts** into `lw-data-v1` (N3: it does create the cache, empty).
- `build-deploy` carries `library/` to `dist/`.

**The scopes** (p1 S7 and S8).

- A project holds `instruments.chem.library = { id, hash, nameKey }`; benzene's HOMO is `{ D6h, E1g, 1, b }`.
- **One history row per change of molecule:** a press from H₂O to benzene added exactly one row ("MOLECULE · MOLECULES") after
  its landing. The `nameKey` moves with the orbital, in the orbital's own row, as STATE-SCOPES says. The key is in the edit
  scope.
- A project open (benzene from its record, orbital 20 by name) left `lambdawaves.q0.settings` **entirely** byte-identical (0
  changed keys), and no library key is in settings.
- `docs/STATE-SCOPES.md` has LIBRARY and its three rows. `tests/new-project.test.mjs` asserts that no LIBRARY content and no
  `library` reference are in the empty project. `new-project --check` is in step.

**The benzene-cap law** (when presses are not racing).

- Lysine's row reads `C₆H₁₄N₂O₂ · 64 AO · record · DOWNLOAD`, enabled.
- Setting 6-31+G* through the API and clicking the (disabled) 6-31+G* button both answer "lysine: back to STO-3G — lysine is
  past the live cap and opens only from its STO-3G record; another basis would be a live solve, which is not offered", with no
  worker message.
- A KICK is refused ("kick failed: lysine is past the live cap: …TDHF (KICK, RUN) cannot run on it"), with 0 solver calls.
- STATES is refused with its sentence.
- With the whole `lw-data-v1` deleted (the browser evicting the store) and offline: the lamps read DOWNLOAD again, and
  selecting lysine says "lysine's record is not open: the network refused it (offline) — it opens only from its record
  (DOWNLOAD when the network is back)". nAO is 0, the row is enabled, nothing throws, and 0 solver calls.
- There is no charge control for any molecule (the charge is the preset's), so the "charge change" clause has nothing to test
  (N12).

**The iPad law** (p1 S0, S2, S3, S9).

- After a fresh-profile boot: `navigator.storage.persisted()` false, `lambdawaves.q0.library` null, no caches. So persist()
  was not asked at boot.
- `StorageManager.prototype.persist` wrapped and counted: the first INSTALL press (lysine) made 1 call, and the key was written
  `{ asked: 2026-10-08, granted: true }`.
- The second install (benzene, through the `install()` seat) made 0. The total at the end of the session was **1**.
- The answer and the quota are shown: "persisted · 0.1 of 7861 MB used".
- The M5 command is in REPORT wave 165 and in `measure/MEASURE.md` §4, and `safariTab()` withholds persist() in a Safari tab.

**COST refit** (`node .tmp/cost-check.mjs`, `node .tmp/cost-measure.mjs`).

- `CAP_MS` = 1702 (benzene). The old fit had 0 over the cap and the new fit has 0; the two disabled rows are still CuH and
  ZnH₂.
- The menu reads `~1.7 s`, and `chemview.js`'s header and `chem` L6 moved with it.
- My node clock today (median of 3), measured ÷ benzene measured: pyridine **0.99×**, Br₂ **1.13×**, glycine 0.45×, furan
  0.40×. The model reads 0.86, 0.75, 0.39 and 0.35 of the cap. Br₂ is disclosed as a ruling for Josh; pyridine sitting at the
  cap is not (N10).
- `COST.browserFactor` 1.23 is S0's measured Firefox ÷ node ratio on benzene (1.92 / 1.57), not a number chosen to pass. The
  glycine L7 budget went from 6370 ms before the refit to 1638 ms now, 3.9× tighter. So this is **not** a budget widened to
  pass; my judgement is a NOTE (N11).

**The house.**

- `git diff 9395ab3 cfdd674 --stat -- lab/mir lab/fonts` is empty.
- `lab/*.js` went from 35 881 to 36 131 (+250), recounted with `cat lab/*.js | wc -l` on both trees. The builder reports this
  as "subtract, don't add" not met, and says why (N13).
- No version file, tag, CHANGELOG, deploy or push: there is no remote branch containing `4b49642` and no tag containing
  `9395ab3`; CHANGELOG, package.json, the manifests and wrangler are untouched.

## Findings

### BLOCKER

**B1 · A stale `chem.open` replaces the worker's one solve cache, and the worker then live-solves a molecule past the cap.**
Laws broken: BRIEF §S4a, the benzene-cap law ("a record past the live cap opens only from its record"; "a KICK on it is
refused with a sentence, not a solve"); acceptance "zero solver calls on open"; §0 "never a second solve road"; B2 "TDHF …
past the cap is refused with a sentence"; "a record without its CIS ladder refuses STATES".

*Mechanism.*

1. `chemview.js` `viaRecord()` awaits `fetchRecord()` and then posts `chem.open` **without checking `seq === solveSeq`**. A solve
   the user has already left still rewrites the worker.
2. The worker keeps one cache (`chemSol`). `ensureSolve()` answers any cache miss by **solving**, and the `caps.tdhf` refusal
   fires only when the cache already holds that molecule's record (`from && !from.record.caps.tdhf`).

So with both records installed, pressing benzene and then lysine (benzene's 1.26 MB record takes longer to read and hash than
lysine's 355 KB) posts `chem.open(lysine)`, then 4 ms later the abandoned `chem.open(C6H6)`. Lysine lands and becomes the
page's solve, while the worker now holds benzene. Lysine's follow-up `chem.states` and `chem.spectrum` miss the cache and run
a **live lysine SCF + RPA**: ground 17 028 ms (integrals 5 754), RPA 10 126 ms, 31.3 s of the chem worker. The STATES ladder
lysine's record does not store is computed live and served, and the MOLECULES status contradicts itself: "64 AOs · 80
electrons · ground 17028 ms (integrals 5754 of it) · rpa 10126 ms · from its record (347 KB, on this device) in undefined ms,
no solver call". Because the live solve left the integrals in the cache, a **KICK then runs**: chem.rt.init answers `ok`, with
E0 −487.7442649, 80 electrons, 19.9 s, and `kick()` returns an engine instead of the refusal.

*Reproduce* (a fresh session, the server on 8755). The probe is untracked scratch at
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-acdc10e4ddf03c1fa/.tmp/p3-stale-open.mjs`; copy it into the
`.tmp/` of the tree under test:

```
LW_PORT=8755 GD_PORT=5223 node .tmp/p3-stale-open.mjs kick     # → .tmp/p3-kick-out.json
LW_PORT=8755 GD_PORT=5223 node .tmp/p3-stale-open.mjs idle     # → .tmp/p3-idle-out.json (no KICK: the live solve alone)
```

Self-contained, in the lab page's console (or one `g.ev` of a gate session):

```js
await __LW.chem.install('C6H6'); await __LW.chem.install('lysine'); await __LW.chem.solve('H2O');
const c0 = (await __LW.chem.workerStat()).solverCalls, sel = document.querySelector('.dev[data-id="chem"] .mol-pick select');
for (const id of ['C6H6', 'lysine']) { sel.value = id; sel.dispatchEvent(new Event('change')); }    // two presses, no await
await new Promise((r) => setTimeout(r, 2000));
const k = await __LW.chem.kick();                     // law: null, refused with a sentence · seen: an RT engine (~20 s later)
console.log((await __LW.chem.workerStat()).solverCalls - c0, !!k, __LW.chem.state().status);   // law: 0 · seen: 2
```

Exact log (kick run):
`send chem.open record:lysine @1036 · send chem.open record:C6H6 @1040 · reply chem.open lysine 8 ms · send chem.states lysine ·
send chem.spectrum lysine · reply chem.open C6H6 16 ms · … · reply chem.states lysine 31323 ms · reply chem.spectrum lysine
31329 ms scf 17028 rpa 10126 · reply chem.rt.init lysine 19895 ms (ok)`; `solverCallsDuringScene: 2`. The idle run is the same
order, with 31 427 / 31 436 ms and 2 solver calls. The order was benign once (benzene not installed, `p3-stale-open.mjs live`:
benzene's abandoned chem.ground was posted 4 ms before lysine's open and only wasted 1.6 s). p1's rapid-switch scene S6 saw
worker +4 for the same reason. Rapid switching in a picker, or a keyboard walk down a section of record rows (S4b), is the
ordinary trigger.

*Why it blocks S4b ∥ S4c.* S4b's sections are mostly record-only rows of different sizes, side by side in the picker. S4c's
87–120-AO records make the live solve this race triggers the one the plan forbids (a 458 MB dense ERI in the browser, on an
iPad).

*The cure, about 10 lines.*

- (a) In `chemview.js` `solve()`, check `seq === solveSeq` immediately before every worker post on the record road and the live
  road (after `fetchRecord`, and in `first()` before `call(msg)`).
- (b) Defence in depth, in the worker: an op for a molecule that opens only from its record says so (for example
  `{ record: hash }` or `noSolve: true` on chem.spectrum / chem.states / chem.rt.init). `ensureSolve()` then answers a cache miss
  with a `Refused` sentence, or by re-opening the record, and never by solving.
- Then re-run `p3-stale-open.mjs kick`. Expected: `solverCallsDuringScene: 0` and the KICK refused.

### SHOULD

**S1 · `digest-lock.mjs --check` against the default fixture is RED on any tree that has the S4a states.** Law broken:
BRIEF §S4c acceptance, "the 1004-value lock green", which S4c and its verifier will run; and the lock's own purpose as a binary
verdict.

- `LW_PORT=8755 GD_PORT=5223 node tools/perf/digest-lock.mjs --check --query gastab=0` gives `DIGEST LOCK RED: 1004 values
  compared · 126 readback differences · 18 record-byte differences` (exit 1). All 144 are `states.chemC6H6/chemLys/chemLysHomo.*
  base undefined now …`: the new states are not in the old fixture, and `pick()` puts every state the run produced into the
  diff.
- The 1004 values are GREEN with `--states 1s+2pz,rydberg,h91,box,gas,helium,h2,momentum,oscillator,quarkonium,sturmian,h2plus,chem`.
  The tool header documents that flag, but the S4c brief names the lock by count, not by command.
- Cheap fix: compare only the states the fixture holds, and print the rest as NEW, not DIFF. Or name the exact commands for
  both locks in the S4c brief.

### NOTE

1. **The RPA sticks' μ and dominant pairs are not in a canonical gauge.** Benzene's bright E₁u pair (roots 2 and 3) comes back
   rotated inside its subspace: live (−1.816, 0.286, 0), record (−1.834, 0.115, 0). In total 156 roots differ in sign and 171
   in their dominant (i, a) listings; ω, f and |μ| agree to 1e-11. The record freezes node's eigensolver gauge, so the RPA
   hover's "dominant i→a (X, Y)" can read differently on a record than on a live Firefox solve, although the polarisation axis
   is the same. The TDA ladder, which is canonical, matches. The builder's browser test compares only [ω, f]. This is a
   property of the RPA list, not of the record road. (`.tmp/p2-names-roots.mjs` writes `.tmp/p2-out.json`.)
2. **`validateRecord` checks shape only.** A copy with an atom moved 0.01 bohr, or a NaN inside C, passes validation and the
   basis-hash check and opens (`node .tmp/refusal.mjs`: `movedAtom`, `nanInC`). Content addressing (the sha-256 name, checked
   before any open in the page) is what actually guards the bytes. A finiteness check and an atoms ↔ `ground.Enuc` cross-check
   would cost a few lines.
3. **The service worker creates an empty `lw-data-v1`** on any DATA-path miss (`caches.open` creates). It never puts into it.
   "A boot creates no store" holds only because a boot fetches no record.
4. On the ordinary path a live benzene's status reads "benzene's record is not open: not installed on this device: solved live".
   That is a refusal sentence for the normal case, under the cap with no install.
5. After a KICK on benzene's record (one live SCF), the status still says "…from its record… no solver call".
6. A record-only row first renders as `… · record` (`optionLabel(m, installed = true)` by default) until `lamps()` resolves a
   few ms later; it should start at DOWNLOAD.
7. `install()` (S4b's header seat) **awaits** `persistOnce()`, so an unanswered Firefox doorhanger holds the download for 4 s.
   The menu road does not await it.
8. A benzene project saved after S4a names the catalogue's record even when it was solved live (`save()` falls back to
   `rec.hash`). Opening it online downloads and keeps 1.26 MB without an INSTALL press, where a 1.7 s live solve would do. This
   matches STATE-SCOPES as written; S4b should weigh it when it sizes records.
9. The `record.page` and `record.stem` fields are written but not read by the app yet. They are S4b's content.
10. **The COST model reads the clock low for mid-size rows.** Today, node, median of 3: benzene 1946 ms (predicted 1702),
    pyridine 1926 (1467), Br₂ 2199 (1275), glycine 872 (666). Br₂ is disclosed and waits on Josh's ruling. **Pyridine at 0.99×
    benzene on the clock** is not disclosed.
11. **On `COST.browserFactor` 1.23:** it is measured (S0, benzene). Glycine's own Firefox ÷ node is 1.48 (1287 / 872), and in
    `chem` L7 it sat at 79 % of its 1638 ms budget. Without the factor it would have been at 97 %, which is honest but thin.
    It is not a widening to pass: the budget is 3.9× tighter than before the refit.
12. "A basis or charge change": no molecule has a charge control, so the charge clause has nothing to test.
13. `lab/*.js` +250 ("subtract, don't add" not met). This is disclosed and explained: `library.js` +124 and the record road;
    the one subtraction is the hand-built fallback (−27).
14. Cosmetic: `chemview.js` l.70 carries two end-of-line comments run together across a long gap. The generator's "lab/library.json
    3712 B" counts characters; the file is 3726 bytes. Lysine's InChIKey `KDXKERNSBIXSRK-YFKPBYRVSA-N` / CID 5962 match my own
    recollection of L-lysine, but they are still unverified against PubChem, as the builder says.

## S4a as merged stands (fit for S4b ∥ S4c on top): **NO** — because of B1

A stale `chem.open` rewrites the worker's single cache, and the worker answers the miss with a live solve past the cap, then
TDHF on it. The record road's own laws hold for every press that is not racing. The fix is a sequence check before each post,
plus a worker-side refusal. With B1 fixed and `.tmp/p3-stale-open.mjs kick` showing 0 solver calls and the KICK refused, this
would be YES. S1 should land with it, or as a line in the S4c brief.

## Probe files (`.tmp/`, untracked)

`p1-worker-storage.mjs` (p1-out.json) · `p2-names-roots.mjs` (p2-out.json) · `p3-stale-open.mjs` (p3-kick-out.json,
p3-idle-out.json, p3-live-out.json) · `p4-link.mjs` · `p5-snippet.mjs` · `refusal.mjs` with `broken/` · `sw-across-builds.mjs` with
`sw-buildB.js` · `lock-fixtures.mjs` · `cost-check.mjs` · `cost-measure.mjs` · `gencheck.sh` (gencheck.log) · logs `b-*.log`,
`lock-*.log`, `node-gate.log`.
