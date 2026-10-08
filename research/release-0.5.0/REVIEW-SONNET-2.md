# REVIEW-SONNET-2 · the junior's two cents on PLAN-DRAFT-2 for 0.5.0 (Sonnet 5.5, 2026-10-08)

Read whole, in order: `NACRE.md`; `PLAN-DRAFT-2.md`; `PLAN-DRAFT-0.md`; `REVIEW-SONNET-0.md`; `PLAN-DRAFT-1.md`; `AUDIT-OPUS-1.md` (Part A and
Part B, every section); the 0.4.0 `REVIEW-SONNET-2.md` for the shape; `docs/MIR-1.5-CANARY.md`; `docs/STATE-SCOPES.md`; `docs/LEGACY-WINDOWS.md`;
`CLAUDE.md`; the 0.4.0 `HANDOFF.md` §2 update of 10-08; `KIT-BRIEFS.md` (headings and the counted-ports table); `survey/MIR-1.5.md` §2.2; the kit's
`docs/ADOPTING-1.5.md` (read only). The two stage-A hand-offs from their branches: `d93fbc4:…/A5-A6-HANDOFF.md` and `b6dfda6:…/A9-A11-HANDOFF.md`.

Checked on this tree (`2c6cbe2`, whose `lab/` and `tests/` equal `12451d2`), by single-file grep, `wc`, `ls`, `git show`, `git diff --numstat`
and one `git merge-tree` (no worktree change): `lab/rack.js` (anchors on three commits), `lab/mir/modulation/host.js:223–228, :347–352, :474`,
`tests/wiring.test.mjs:60–65, :463`, `tests/pwa.test.mjs:244–251, :302`, `tools/perf/cdp.mjs`, `lab/h2ci.js` and its importers, the legacy
files by `wc -l`, `grep -oh "__LW\.…" tests/*.mjs`, `ls tests tools`, and `ls` of the kit's `mir/info`, `tools`, `docs`. Nothing was run.
Nothing but this file was written. "D2:n" is PLAN-DRAFT-2 line n; "AO:n" is AUDIT-OPUS-1 line n; "HF-56" and "HF-911" are the A5-A6 and A9-A11
hand-offs. Unless a claim says "unverified", it was checked in the tree.

---

## 0 · The verdict in six lines

1. **The structure is right and the Opus audit was taken faithfully.** Every [OPUS] mark I could find is in plain text, and two of the three overrulings are
   the right instinct (A0 stays; the audit's nine browser suites). Nothing in DRAFT 2 re-opens what 0.4.0 settled.
2. **The plan describes a stage A that is no longer the one on disk.** Both wave-1 builders are PAUSED at a usage alarm (HF-56 "paused at a safe boundary",
   HF-911 "nothing of this builder runs"), D2:73 says "in flight", and A6's own hand-off plan contradicts D2:58 on the one thing Opus forbade.
3. **Every `rack.js` line number below :2530 is wrong the moment A5 merges** (−163 lines; verified: `const layout` 3572 → 3409, `ACTIONS` 4683 → 4520,
   `LW` 5330 → 5167). Wave 2 (A1+A8, A7) is written entirely in pre-A5 numbers (D2:57, :60, :62).
4. **D's ledger rests on a premise that is half false.** `lab/h2ci.js` (330 of the 1,469) is imported by six engine modules, and `docs/LEGACY-WINDOWS.md` says
   "keep it". The H₂⁺ files are not in the 1,469 at all.
5. **Three instruments the plan relies on do not exist** where the plan implies: the CDP `TaskDuration` harness, a place to run the spike, and a baseline owner.
6. **Ready for Josh: NO**, because of points 2–5 and because the rulings he must see first (the seven glass classes, the camera bindings) are not where he will look
   (§3 below). Every fix is textual; one pass of DRAFT 3.

---

## 1 · The junior's reading: which row can a stranger execute?

The test: a builder who has never seen the repo takes one row and must know **what to build, what to test, when to stop**. "Yes" = all three.
Findings first, row table after.

### 1.1 Things that make several rows unexecutable at once

- **The kit tools have no path.** `stylehash`, `hit-probe` and `adopt.mjs` appear in D2:54, :97, :106, :107 and are not in this repo (`ls tools` shows none).
  They are `tools/stylehash.mjs`, `tools/hit-probe.mjs`, `tools/adopt.mjs` in the 1.5 worktree
  (`~/Documents/MIR/.claude/worktrees/mir-1.5/tools/`). HF-911 learned the hard way: "Use the PIN's adopt.mjs: `~/Documents/MIR/tools/adopt.mjs` is the 1.4.3 kit
  and refuses `--line 1.5`". The plan must say so once, with the stylehash flags (`--gpu 1 --ready "__LW.ready && !!document.getElementById('controlHelp')"`,
  survey line 93) and what `before`/`before2` mean (D2:54 uses them undefined; CANARY line 97 is where they come from).
- **The CDP `TaskDuration` harness does not exist.** D2:85 (the spike's cost rule) and D2:107 (C-V's gate) both need `Performance.getMetrics`. `tools/perf/cdp.mjs`
  exposes `launch() → { goto, eval, mouse, shot, resize, close, logs }` (its own header, line 3) and contains neither `getMetrics` nor `TaskDuration` (grep count 0);
  the kit's `tools/cdp.mjs` has none either (count 0). DRAFT 1 named `tools/perf/cdp.mjs` as if it did; DRAFT 2 dropped the name and kept the dependency. It is a new
  tool, with no row, no owner and no size. A0's rule 1 cannot be taken without it.
- **The ms/s baseline "BEFORE C" (D2:107, :156) has no owner and no moment.** It must be taken after wave 2 merges (A6 and A7 touch the frame loop) and before C0.
  §5 (D2:162) does not place it. Name the row (A0 cannot, it runs on an unmerged tree) and the machine state.
- **A0 has no copy to work in.** D2:54 says "the adopted half is A9–A11's throwaway run (A0 reads its row)" and that the spike runs "in that copy". HF-911 says the
  copy is deleted at the end of the run ("the copy is deleted"), and the AFTER run "has not been made". Opus's own note (AO:168, Part B §4) said "the spike reads that throwaway
  after A11 lands". DRAFT 2 lost the sequence. A0 must adopt its own copy, or A9–A11 must keep one.
- **Line anchors.** See change 2: after A5 merges, every cited `rack.js` line below :2530 is off by 163 (A9 then adds +5 at `ACTIONS`, +7 at `LW`). D2 mixes eras
  inside one row (D2:62 says ":2700 now in `mod-port.js`" beside pre-A5 numbers for the rest). A builder cannot find `:3464–3512`. Give each site a grep anchor
  (`function refreshOcclusion`, `const layout = {`, `const ACTIONS = [`, `const SETTINGS_KEY`) and say the numbers are of `7d10a63`.
- **No branch is named for the work.** A5 is on `worktree-agent-ac7efdcc9d1fca69a`, A9–A11 on `…a951ee2405b1383e6`; both are based on `12451d2`. D2 never says which
  branch A merges into, which branch C commits on, or what the test server serves. A stranger cannot start C0.
- **Merge note nobody has written down.** `git merge-tree` of the two wave-1 branches conflicts in exactly one file: `lab/sw.js` (both ran `pwa --write`). It is
  trivial (re-run `node tests/pwa.test.mjs --write` after the merge), but wave 2 is "after both merge" (D2:73) and the step is nowhere.
- **No per-seam line allowance.** The cap is "+150 in total" (D2:3, :47–50). The first builder (A1, a new adapter module) can spend all of it. One allowance per seam
  would let a builder know when he is over. The ledger so far is **A5 −43** (`cat lab/*.js | wc -l`: 36,280 → 36,237; the `sw.js` precache line is +1 of the −44 that D2:14
  and :59 print) and **A9 −47** (36,233, HF-911), i.e. −90 already, which D2 never mentions and which should re-base the 28.2–29.6k.

### 1.2 Row by row

| Row | Executable? | What it lacks |
|---|---|---|
| **A0** (D2:54) | NO | the copy (above); the kit tool paths; the CDP harness; `createInfoLayer`'s file (`mir/info/layer.js`) and where in the page to mount it; what "N labels + 1 block" contains; what "pane" is; the M5/WebKit commands (DRAFT 1 named `?report=1&post=1`, `limits.html`, `probe.mjs serve`, `check-app.mjs --webkit`; DRAFT 2 says "the commands" and names none — D2:54, :83, :91). Stops: the five rules give it (good), but rule 2 ends on "Josh judges 12 screenshots", so A0 cannot close without a person, and nothing says where the screenshots go. |
| **A10** (D2:55) | NO | HF-911 found that the plan's wording is wrong on two of the four rewrites. (a) `slider-keys` "reads `setKnobLaw().keyFine`": **false on 1.4.3** — `lab/mir/slider-keys.js` steps a flat .001 and never reads the law, so the rewrite is red today; the builder's plan (measure the Shift step, follow the law only when it does) is the executable one. (b) `access` A8 "reads rendered text" needs a DOM shim `tests/` does not have, or a move to a browser suite; and A2, A3, A9, A10 of `access` are still kit-source regexes. (c) "26 id selectors" without saying which stay: HF-911 keeps `#menubar`, `#offer` (C9's), `history`'s `'ADD LFO'` label and the menu rows by label. (d) "the driver-port race fixed once in `drv.mjs`" with no description of the race (geckodriver `EADDRINUSE 127.0.0.1:5215`, cured today by a 4 s pause; DRAFT 1 said "a 4 s settle", DRAFT 2 dropped it) and a closer, "without a pause hack", that nobody can judge. Half-built: three hooks done, no test rewritten. |
| **A11** (D2:56) | NO as written | a choice left open: "skip `mir/locales/` and `mir/tokens.json`, **or** 'precache what a root reaches'" — two designs, no default. HF-911 built the first (a `SKIP` list beside `DATA` in `sw.js` §1b, read by `pwa.test` and `build-deploy`, with measured numbers: 382 entries / 9,924,481 B → 367 / 7,679,865 B = 7.32 MiB). Its second closer, "`wiring` green there under R5-W1 once ruled", cannot be reached until Josh rules (D2:136), so the builder has no stopping place. "headroom ≈ 0.7 MiB **today**" is not today's: today's tree has 3.4 MiB (4,864,170 B, HF-911); 0.68 MiB is the adopted copy with the skip list. |
| **A1** (D2:57) | PARTLY | where the adapter lives (a new file? its name); how it "says which families stay" (a comment, STATE-SCOPES, a table?); its closer ("blob byte-identical… the whole-`localStorage` diff") names no file in `tests/` and is not marked new. The 8 sites are correct (7 writes + the `removeItem` at :1309, verified), but their numbers are pre-A5 (`:2779` moves). |
| **A6** (D2:58) | NO | the three-way collision in §1.3 below; "power off SUCCEEDS" is ambiguous (MOD arm `modArm`, default `true` at `rack.js:550`, or the window's power?); the "four scenes" are one slash-separated sentence a stranger reads as six; no file is named for the facade (HF-56 puts it in `lab/clock.js` + `lab/mod-port.js`); "device report back to back" has no number (what delta fails?). |
| **A5** (D2:59) | DONE | — (it is done on a branch, not merged; D2 should say "not merged"). |
| **A8** (D2:60) | PARTLY | the port's shape is "the kit's" with no pointer (KIT-BRIEFS §2 and the kit's `PANEL-CAMERA.md`); "bindings as ONE data table": no key set, no consumer list; no test that the table is the *only* source — `tests/stage-gestures.test.mjs` (node) exists and is the natural closer, D2 names only the browser `camera-shift`. |
| **A9** (D2:61) | DONE | — but three leftovers HF-911 lists for A4 are orphaned now that A4 is struck: the MENUS table still calls the old ids through a one-line `ACTIONS.find` fallback on `was`; `dock` and `modulation` `data-key-action` tags; plus A5+A6 owes the transport tags (`transport.play`, `modArm`, `home`, `stepBack`, `stepFwd`). Say where each goes (C3 is the honest home). The drafted CLAUDE.md paragraph is Josh's to authorise; D2 does not carry it. |
| **A7** (D2:62) | PARTLY | the provider contract (return type; the 32-rect cap; the species list); the pre-A5 anchors; its closer `frame-occlusion` 7/7 "kit species at C0" **cannot see the kit species during A** (D2 admits the lock cannot either). The device report has no threshold. |
| **C0** (D2:97) | NO | the kit commit to pin (HF-911: alpha.24 = `1b7ae99b9905`; the kit moves one commit at a time, D2:18) — "pin alpha.24" is not enough to compute the sha-256 for `ACCEPTED`; the 32 `!important` are not listed by file:line (verified 12 + 20); where Josh sees the screenshots; and what C0 does when the seven rulings are pending (does C1 wait?). |
| **C1** (D2:98) | YES | the route script is new and not marked new. |
| **C2** (D2:99) | PARTLY | "the look lift" has no spec (which keys → `mir.gui` keys, in which direction); "the snapshot diff" is new and unmarked; `accent-wheel.js` is 152 here and 149 in §4 (D2:155). |
| **C3** (D2:100) | NO as one row | ~2,500 lines, five consumers, one commit order unstated, the largest test rewrite in the plan; sizes were in AO:196 and DRAFT 2 dropped them (D2:73–75 gives A's sizes only). The reference branch is named (D2:68–69) but its approach (extract to `lab/windows.js`) is not C3's (adopt `createRack`). |
| **C4** (D2:101) | YES | "the replay judges" is not a suite name; list them. |
| **C5** (D2:102) | PARTLY | the `history.clear(label)` call sites (boot/link/open/new) are not listed. |
| **C6** (D2:103) | PARTLY | "6 history snapshots": which ones, produced how; R10's fixture is new (D2:110 says so; the row does not). |
| **C7** (D2:104) | PARTLY | "THE ONE LOCK — 1004 and 1148" is unexplained (`tools/perf/digest-lock.mjs`, two voxel sizes?) and the tool is not named in this row. "The determinism verifier here (shared with D5)": D5 is after C-V; see §2.5. |
| **C8** (D2:105) | BLOCKED | by G1; fine. |
| **C9** (D2:106) | NO | five jobs in one row. "hit-probe 25 inside / 0 through" is **BASINS' probe count** (survey line 103), not a λWAVES baseline; λWAVES has no probe set, so "25 inside" cannot be checked. Say "0 through on the app's own probe set, N inside to be recorded". |
| **C-V** (D2:107) | NO | the CDP tool (above); "the R1–R15 table, each closer run": **there is no such table in DRAFT 2** (DRAFT 0 had a "risks closed" column; DRAFT 1 and 2 dropped it). "The `__LW` law" as a C-V check has no method. |
| **D9** (D2:118) | PARTLY | see change 3; "H₂ and ELECTROSTATICS by use": use of what — nobody can measure it; it is Josh's call, which D2:140 says, but then D9 cannot start before the ruling. |
| **D1** (D2:119) | PARTLY | "0 per-tick layout reads by the layer's witness": the witness is S3's counter for `stage-text.js` (REVIEW-SONNET-0 §1.5 said so and DRAFT 2 repeated the phrase); the layer has none. A new instrument, unmarked. The 132 lines of `stage-text.js` that D1 retires are a ledger credit D2 does not state. |
| **D2** (D2:120) | PARTLY | the generator's home; "(ledger C3)" points at a Sol ledger outside the plan. |
| **D3/D4** (D2:121–122) | YES | both gated by the spike's rules; fine. |
| **D5, D8, D10** (D2:123, :126, :127) | NO | closers are "—", "—" and "per row"; D5's verifier is the C7 one. |
| **D6** (D2:124) | NO | "one in, one out per piece" but only SCENES has an "out" (replaces A/B). FIGURE, chips, FLY-TO + search and MAPS name no deletion; the ledger cannot be kept. |
| **D7** (D2:125) | YES | `atoms.test` and `molecules.test` exist; the "38 lines" is KB's gross count. |

### 1.3 The A6 collision (the most urgent single finding)

D2:58 says: the facade holds the demand "**only while `modArm && clockLink`**", the dead LINKED retry and the re-arm go (−11), and **"The retirement of LINKED/SEPARATE and
of `modArm`/`clockLink`/`modCadence` in PREFERENCE goes to C4 unconditionally"**. HF-56 ("The plan as designed… Exact next step") says the opposite on each point, and it was
written before the audit: `appPlay.onChange((on) => mod.follow(on))` (the demand on *every* play edge); step 3 "`saveSettings :199` drop `modCadence/modArm/clockLink`;
`applySettings :296–298` read once and drop; `clockLink` ignored"; step 4 "delete the LINKED trig and the SEPARATE-only MOD ▶ trig" in `native-ui.js`; step 5
`history`'s SEPARATE scene rewritten; step 6 STATE-SCOPES edited. A builder that resumes from its own "Exact next step" builds the design Opus struck. AO:198–205 (§9) was
written to be forwarded; **DRAFT 2 neither carries it as a block nor says it was sent**. (Also: the facade adds a `clock.js` `onePlay` and a `mod-port.js` `follow`; the "−11" is only
the deleted dead code, so A6's net is not −11 — give its allowance.)

---

## 2 · Internal consistency

### 2.1 Numbers used twice

| Number | Where | Disagrees with |
|---|---|---|
| precache today **4.53 MiB**, 188 files | D2:16 (from S4a-BUILD) | HF-911 measures the same 188 entries at **4,864,170 B = 4.64 MiB** on `12451d2`; the canary row has 4.63 MiB on 205 entries. Three figures for "today". |
| A5 **−44** | D2:14, :59 | `git diff --numstat 12451d2 f9b47dd -- lab`: +119, −163 on `rack.js`, and `sw.js` +1 → **−43** (HF-56: 36,280 → 36,237). |
| `accent-wheel.js` **152** | D2:99 | **149** in the sum, D2:155 (the survey's old figure). `wc -l` = 152. |
| CAMERA MOTION **47** | D2:98 | the "~1,780 rack.js blocks" term in D2:155 is the survey's 1,890 less 112 for the look block only; it still carries camera UI at 65. |
| `__LW`: 1,507 uses, 96 members, **29** test files | D2:21 | `grep -l "__LW\." tests/*.mjs` = **28** files (uses 1,507 and members 96 reproduce exactly). |
| "G1 blocks C8, D1, D5, D7" | D2:29 | the dependency table (D2:38) also hangs **C9 on 9′** and **D2 on 3**, and D5 on **6** and D7 on **5**; the G1 header lists "8 first; then 2, 3, 4, 7, 13" — briefs 5, 6 and 9′ are in the table and not in the gate. D10 is in neither. |
| the legacy five, **1,469** | D2:23, :118 | see 2.3. |

The arithmetic that does reproduce: 36,280 − 34,721 = 1,559 (+4.49 %); 13/32 ms/s = +40 %; 3,110 + 1,104 + 198 + 187 + 149 + 548 + 63 + 140 + 396 + (0…150) + ~1,780 + (1,200…1,800) − 495
= **8,380–9,130** (the 548 is audio.js 438 + ~110 microphone block, the 63 is busy-mark + frame-coalescer, the 140 is paletteview's "~140 of 156 go": none is on a C row, so a
stranger cannot rebuild the sum; label the terms by row); 36,280 − 9,130 + 1,000 = 28,150 (**28.2**) and 36,280 − 8,380 + 1,500 + 150 = 29,550 (**29.6**). 8 MiB − 7,679,865 B = 0.68 MiB (**0.7**).

### 2.2 The ledger

- **A ≤ +150 does not add with the 1.0–1.5k "back".** The survey's glue estimate (survey line 146) *is* the port, project parts, camera port, look adapters,
  occlusion providers, clock facade and key rows: A's seams. D2:110–111 adds "+ A's ledger ≤ +150" on top of 1.0–1.5k back. At the high end that counts the same glue twice (up
  to 150). And A is −90 already. The honest range re-based on the measured A ledger at merge is about 28.1–29.5k, and it should be said that the A ledger is *inside* "back".
- **"`lab/*.js` falls" is true by the choice of metric.** `cat lab/*.js` excludes `lab/mir/**` (+196 files, +4.8 MB of kit) and the CSS. D2:3 and §0 should say what is counted
  (the command: `cat lab/*.js | wc -l`, which is how HF-56 and HF-911 measured) and what is not, because Josh's sentence "subtract don't add" will be read against the repo growing by
  5 MB. D2:111's "28.2–29.6k" is an *estimate*, and an estimate is not a "done when" (§4).
- **D ≤ 0 loophole.** The unit is lines of `lab/*.js`. D2's pages are generated Markdown/JSON (D2:120) and the library is Cache Storage; none counts, while the precache has
  **0.68 MiB** of headroom on the adopted copy (D2:56). The plan states no byte budget for D.
- **The 28.2–29.6k assumes the film (C7).** If the film slips the plan itself says +1.2–1.8k (D2:111), i.e. 29.4–31.4k — outside the stated range. R5-Q2 (D2:129–131) provides
  for the briefs slipping, not for C7.

### 2.3 D9 "pays for D" (D2:118, :23) — the measured premise is half false

`wc -l` confirms the 1,469 (219 + 598 + 215 + 437). But:
- `lab/h2ci.js` (330 lines) is imported by `density.js:19`, `mathworker.js:43, :48`, `scf.js:15`, `response-fit.js:28`, `rpa-inspector.js:29`, `rhf-molecule.js:12` and `rack.js:56`
  (`eigSym`, `h2CurveTable`: the molecular engine's linear algebra). `docs/LEGACY-WINDOWS.md` table, row `h2`: "`h2ci.js` is a shared library — keep it". D6's "MAPS (H₂'s FCI curve first)"
  also needs it. **The deletable ceiling is 1,139, not 1,469.**
- The **H₂⁺** files (`molecule.js` 83, `moleculeview.js` 124, `mo.js` 598, `moview.js` 395) are in R5-L1's list (D2:140) and not in the 1,469 (`mo.js`/`moview.js` may be shared: unverified).
- `cornell.js` (116) stays for QCD ("its Hamiltonian still restores", LEGACY-WINDOWS), correctly outside the 219.
- Under R5-L1's *default* (QCD deleted; H₂⁺ and HELIUM become demos with a shim; H₂ and ELECTROSTATICS "by use"), the *guaranteed* credit is QCD's **219**, less the shim.
  D ≤ 0 holds only if H₂ (268 without `h2ci`) and ELECTROSTATICS (437) go too. D2:140–141 says "it decides whether D can be net ≤ 0"; it should say by how much, and that the
  default does not make it.
- Deleting them also deletes node suites (`qcd`, `h2`, `h2ci` stays, `helium`, `electrostatics`, `cornell`): the "85 suites" of §0 is not stable.

### 2.4 Closers: exist in `tests/`, or marked new?

Exist (checked by `ls tests`): `camera-shift` (node and browser), `render-regressions`, `palette`, `first-run`, `official-defaults-palette`, `new-project` (node and browser), `menubar`,
`keyboard-window`, `keyboard-shortcuts`, `frame-occlusion`, `mir-controls`, `lfo-tension`, `routed-knob`, `history`, `take-in-bugs`, `offer`, `molecule-demos`, `render-exact`,
`export3d`, `pwa`, `wiring`, `mir-manifest`, `gpu-recovery`, `atoms`, `molecules`. The nine B-list browser suites all exist; 27 browser and 85 node counts are correct.

**Not in `tests/` and not marked new:** the whole-`localStorage` diff (D2:45–50, :57, :99 — the CLAUDE.md law "a project open leaves the settings byte-identical outside WORKSPACE" has no
named suite); the route script (C1); "the replay judges" (C4); "the layer's witness" (D1); the `__LW` law's check (a rule at 0 lines, which C-V is told to verify with no method); the "stylehash
classes" tool (kit); the CDP harness. **Marked new:** R10's and R14's suites (D2:109–110), only there.

### 2.5 Dependencies and gates against the rows

- **C-V (after C9) runs before C8 can exist.** C8 is blocked by G1 (D2:29, :105) yet §5 runs "C1 → C9, C-V once" (D2:162). "Done when: the 15 risks each closed" includes R1 (occlusion), closed by C8. **R5-Q2's "0.5.0 minimum = A + B + C"** (D2:129–131) therefore includes a blocked row. Say "C0–C7 + C9" or move C8 behind C-V.
- **The film verifier.** D2:104 puts "the determinism verifier here (shared with D5)" at C7; D5 comes after D9 and the spike. §5 says "one for the film (C7/D5)". A verifier at C7 cannot cover a D5 that does not exist; either it runs at D5 (and C7 has the lock only) or it runs twice.
- **"Re-adopt once"** (D2:33–36). Briefs arrive "8 first; then 2, 3, 4, 7, 13"; D1 needs 13 + 7, D5 needs 6 + 7, D7 needs 4 + 5. If each brief is a new kit version, "once, at most two" cannot hold. Define "re-adopt" (a full `adopt.mjs` plus the 27 suites) against "pick up an added kit file" (no run), or give the count the briefs imply.
- **A's acceptance** (D2:45) "the red list reduced to the kit's own deltas" never says which suites may stay red. From HF-911: `new-project` (`--check`, bpm 60 → 30, the documented regeneration step) and `wiring` (until R5-W1) — two of the seven. Name them.
- **Wave order vs the table order.** The A table (D2:52–62) lists A0, A10, A11, A1, A6, A5, A8, A9, A7 — the old Z/X/Y grouping, not the waves (D2:73–75). Reorder by wave.

---

## 3 · The three overrulings (D2:174–179)

**(i) A0 stays on Sonnet; the spike alone is re-run by Opus if "thin".** *Sound as a decision, thin as a test.* A0 was launched before the audit and its baseline, stylehash and measurements
are of use whoever runs the spike. But "thin numbers or unapplied rules" is not checkable. Make it a list: rules 1–4 each have a recorded number, or answer, or a stated reason it could not be taken. the AO Part A A0 row said the spike *writes
code against a layer no app has run*, over WebGPU; with no CDP harness (§1.1), no copy and no kit path to give it, the chance that Sonnet's first run is thin is high. I could not verify that A0 is running at all
(no hand-off for it exists on any branch I can read; both A-builders are paused).

**(ii) A6's demand "under `modArm && clockLink`" taken "with one clause".** *Not sound as written.* It is not an overruling; the clause ("if the facade makes the refusal impossible under both settings at no extra line, it may say so in
REPORT without retiring any key") (a) contradicts D2:58's own "only while `modArm && clockLink`" by licensing an unconditional demand, (b) is unactionable ("may say so in REPORT"), (c) never says which "both settings"
(`modArm` on/off? `clockLink`?), and (d) is exactly the builder's own pre-audit design (HF-56 step 2: `follow(on)` on every edge), so it invites it back. An unconditional demand changes what the MOD arm (Ctrl+Space,
"space then plays both clocks", `rack.js:4736`) means, which is a behaviour Josh sees and AO:200 (§9.1) said belongs to C4. Delete the clause, or write the behaviour it permits in one line with its scene.

**(iii) B's browser list: "the audit's nine now; the remaining 18 run once by A9–A11 on its throwaway if time allows".** *Not sound.* Taking the audit's nine is right. The addendum re-adds, by the back
door, what Opus listed under *Over-verifying* — "27 browser suites on a bare adopt (cut to 9)" (AO:176) — and it runs against Josh's "don't over-verify" (NACRE; D2:165). The canary already ran 3/3 browser green
on alpha.23 (CANARY line 20), C0's own 27-suite run comes "because C0 is real" (D2:79–80), the bare adopt has no cascade or INTENT rulings applied so a red there is mostly the 23–25 % restyling
noise, and "if time allows" is an unfalsifiable gate on a builder who is paused and whose scope is node + precache (HF-911). Drop it, or give it an owner (A0, on its own copy) and a stop.

---

## 4 · What a reader would mistake

1. **"In flight" (D2:73).** Read as "being built now". Both builders are paused (§0.2).
2. **"Done when `lab/*.js` in 28.2–29.6k, ESTIMATE" (D2:109–111).** Cannot be checked; it has no pass/fail. Josh will read it as a promise. Give a hard bar (for instance "below 36,280 by at least N, measured at C-V") and keep the range as expectation.
3. **"R5-G1 … re-adopt ONCE at the first kit version that carries brief 8" (D2:33–36).** Reads as "one event"; the briefs for D1/D5/D7 land later (§2.5).
4. **`·` means two things in §3.** In items 1–4 it separates *options* ("pin · wait · every alpha"). In item 5 (D2:142–144) it separates *rulings* and options in one run: "R5-C1 … · R5-Q2 … — Q2 · R5-S1/S2/S3 SETTINGS stays the surface and MIR OPTIONS hidden · LANGUAGE hidden · the KEYBOARD window… — Q3". Is "LANGUAGE hidden" an option of S1 or the default of S2? "Q3" has lost its question (DRAFT 1's "what may the adopted app show that it does not today?" is gone).
5. **"Power off SUCCEEDS" (D2:58).** Two meanings (§1.2).
6. **A table "closer" that is a rule.** "The `__LW` law" (D2:107) is a rule at 0 lines; its granularity is the 96 top-level members, but `.layout` (137 uses), `.mod` (93) and `.history` (67) are nested verbs (`__LW.layout.float…`). Does the law forbid renaming `layout.float`? It should say so, and name the check (`grep -oh "__LW\.[a-zA-Z.]*" tests/*.mjs | sort -u` against the tree).
7. **"The 1004 and 1148 lock" (D2:104).** Unexplained to a stranger.
8. **"Headroom ≈ 0.7 MiB today" (D2:56).** Not today's (§1.2 A11).
9. **"A5 DONE" (D2:59), "A9 DONE" (D2:61).** On branches, unmerged. "Done" in a plan Josh reads reads as "in the tree he is trying".
10. **The wiring clock.** D2:20 says C2/C6 consume four rows and C3 the fifth, "or R5-W1 retires all five". After C0, R5-W1 applies "from this commit" (D2:97). A reader cannot tell which; the default is R5-W1, so the dated rows need not be consumed at all. Say so, with the 2026-12-06 date and that R5-W1 makes it irrelevant only if Josh rules before C0.
11. **A "ruling" that is not Josh's.** R5-A3 (D2:139) is a builder-level choice (the kit's own ADOPTING §13 is the evidence); asking Josh costs a minute of attention in his first four.

---

## 5 · What Josh will ask in his first minute

| He said / will ask | Does the plan answer it where he looks? |
|---|---|
| "Don't over-verify." | Partly. The dial is §5 (D2:160–165), last page but one. Counted: the nine-suite and 27-suite canaries, the C-V verifier, a film verifier, the C7 lock, the ms/s protocol (10 runs plus an M5 pair), a possible Opus spike re-run, and overruling (iii)'s 18 extra suites. No one place counts them. Add one line at the top: "verifiers: N". |
| "Subtract, don't add." | Yes at the top (D2:3–6), then undercut: no per-seam allowance, "done when" is an estimate, the metric excludes `lab/mir/**` (+5 MB), D's credit is overstated (§2.3). |
| "The glass is Josh's." | The seven INTENT classes are in C0 and G3 (D2:31, :97), **not in §3 "Rulings for Josh"**. He opens §3 and does not find the thing that blocks C0. Also: where and how he sees the screenshots, per class, is unsaid. |
| "I want to try things on the test server." | **Not answered anywhere.** In 0.4.0 he tried the camera on `https://127.0.0.1:8721/lab/` and the LAN URL (HANDOFF 0.4.0 line 162). 0.5.0's first visible thing is C0, after A (invisible) and the spike. There is no line "after wave 2 the server serves X; Josh edits the A8 table and reloads", no line on what the server serves during A (merged or not, which branch), no stage-to-"what he can feel" column. For his camera-bindings ask this is the cheapest win in the plan: A8's one data table. |
| "Camera bindings, perhaps touch gestures." | R5-C1 Q1 (D2:142–143) asks per device and defers to "a diff of data" (D2:60). The kit's answer for pointer class is `installKbm({ key })` (ADOPTING §13, the live pointer: hover rules become `:where(:root:not(.kbm-touch))`, never `@media (hover: hover)`). It is not named in DRAFT 2; the app has one `hover: hover` rule (`lab/skin.css`, count 1). Name it under R5-C1 so the touch question has its kit seat. |
| "Is 0.4.0 cut?" | Only in the last clause of §6 (D2:171–172): "0.4.0-alpha's local cut follows the kernel verifier, before any A merge". HANDOFF says the cut is on Josh's word; the S4c verifier has said YES (sos-s0 tip). State it in the top paragraph with the decision it needs. |
| "How long?" | A has sizes (D2:74–75); C and D have none (AO:196 had them: C0 M, C1 S, C2 M, C3 L, C4 L, C5 S, C6 L, C7 L, C8 S, C9 M, D9 M). Restore them. |
| "Who builds the briefs in MIR?" | The HANDOFF already took a default (R5-M1: Josh's primary account when its week resets, 0.4.0 `HANDOFF.md` line 216); D2:143 asks "who builds the briefs" with no default. |

---

## 6 · What DRAFT 3 must change (ranked, at most eight)

1. **Reconcile stage A with the disk.** Say the two wave-1 builders are paused (HF-56, HF-911); add a "TODAY, for the resuming builders" block that carries AO:198–205 and states A6 must **not** retire `clockLink`/`modArm`/`modCadence`, the LINKED UI or STATE-SCOPES (HF-56 steps 3–6 do); correct A10 (`slider-keys` premise false on 1.4.3; `access` A8 needs a shim; which of the 26 ids stay; the `drv.mjs` race described) and A11 (one design, the `SKIP` list; headroom is the adopted copy's); delete overruling (ii)'s clause; add the `lab/sw.js` merge step and the orphaned A9 leftovers (MENUS `was` fallback, `dock`/`modulation` tags, transport tags → C3).
2. **Re-anchor every `rack.js` site by grep anchor,** and state that all numbers are of `7d10a63`; after A5 merges, everything below :2530 is −163 (A9: +5 at `ACTIONS`, +7 at `LW`). Name the integration branch and what the test server serves during A and C.
3. **Rebuild D9's premise:** 1,469 → ≤ 1,139 (`h2ci.js`, shared, keep; verified six importers); add the H₂⁺ files; state the guaranteed credit under R5-L1's default (QCD, 219) and that D ≤ 0 needs H₂ and ELECTROSTATICS to go; give D6's four pieces an "out"; state a byte budget for D (0.68 MiB headroom) so pages do not escape the ledger.
4. **Name the instruments and their owners:** the kit tool paths and flags (`stylehash`, `hit-probe`, the pin's `adopt.mjs`); the CDP `TaskDuration` harness as a new tool with a row and a size; the ms/s baseline's owner and moment (after wave 2, before C0); a copy for A0; the M5/WebKit commands by name; C7's lock tool and what 1004/1148 are.
5. **Make every "done" checkable:** A's residual red set (`new-project --check`, `wiring` until R5-W1); a hard bar for `lab/*.js` beside the estimate, re-based on A's measured ledger (−90 so far, and inside the 1.0–1.5k "back", not on top); the risk → closer table back (R1–R15); mark new the closers that are new (whole-`localStorage` diff, route script, witness, `__LW` check); λWAVES' own hit-probe baseline (BASINS' "25/0" is not ours).
6. **Make the gates and the table agree:** G1 vs the dependency table (C9/9′, D2/3, D5/6, D7/5, D10); R5-Q2's minimum without C8; define "re-adopt" against "pick up a kit file"; place the film verifier (C7 or D5, not both); one number for precache today (4.64 MiB, 188 entries) and the other twice-used numbers (§2.1).
7. **Rework §3 for Josh's first minute:** put R5-G1, R5-L1, the camera bindings Q1 (with `installKbm`) and the seven glass classes first (G3 as rulings); move R5-A3 and R5-W1 to "defaults unless you object"; separate rulings from options (one per line); give Q3 its question; carry R5-M1's default; add "where you can try it" and "is 0.4.0 cut"; restore the C/D sizes.
8. **Drop overruling (iii)'s 18-suite sweep** (or give it an owner and a stop) and put one "verifiers: N" line at the top, because "don't over-verify" is the line Josh will read against the dial.

**Ready for Josh: NO.** Because stage A as written would make a resuming builder rebuild the design Opus struck, wave 2 cannot find its lines, D's ledger premise loses a quarter of its credit, the CDP tool the gate depends on does not exist, and §3 does not show him the glass rulings or tell him where he can try anything. All eight are DRAFT 3 text, none re-opens the plan's shape.
