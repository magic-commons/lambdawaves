# X4-BUILD · THE STALE ROWS (iteration 010, row X4)

Builder: Opus 5.5. Branch `it010-stale` from BASE `43d1e44`, in its own worktree. Gate server on 9371, GD 5371, stopped by pid when done. NOT pushed.

Each standing red was run on the base first, then judged, changed and run again. The whole suite each row lives in was run green afterwards.
Verdicts: **BUG** means the app was wrong and is fixed in the app. **STALE** means a newer law replaced the expectation, so the row is
re-aimed at that law. **GONE** means the row is already green on the base, so it leaves the list. No row was retired as DEAD.

## The table

| # | row | verdict | evidence on the base (43d1e44) | action |
|---|---|---|---|---|
| 1 | `molecular-names` :32 | **STALE** (×3 rows) | `names` came back `undefined`: there is no `.dev[data-id="orbitals"]`. Iteration 008 U folded MO-REGISTRY into MOLECULES (`RETIRED_WINDOWS` `orbitals: 'chem'`). The same row blocked two more stale rows behind it, found once it passed: ‹ SYSTEM ›'s QUARKONIUM has been a live row since 0.8.0 G1 (the expectation was "disabled, coming 0.8.0"), and the ATOMS table holds 118 cells in 2·8·8·18·18·32·32 (008 A7; the expectation was 36). The ATOMS mode has hidden MOLECULES since iteration 002, so its + row exists only with MOLECULES ON | Every `orbitals`-card read now reads the one card: the lane and the CORE fold live in `chem`, and the `core` WORKSPACE key is on chem's layout row. The suite asserts that MO-REGISTRY is no card and has no WINDOW row, and that the `instruments.orbitals` record is kept. The + press runs under MOLECULES ON. A register-ON file opens on VIEW REGISTRY (008 U). The reason is in the file's header. **6/6 PASS** |
| 2 | `lw-links` WATER | **GONE** (already re-aimed) | Green on the base, all five rows, on two separate runs. Iteration 007 I (`d3488c2`) re-aimed it: the suite switches INFORMATIONAL › ANNOUNCE › MOLECULE HEAD on (`sayHead`). That switch is how Josh's iteration-001 ruling brought the head back: off on a first run (`molecules.js:84-86`). Not reproduced: "aborts at WATER" | None. **5/5 PASS** on base and branch |
| 3 | `molecule-head` | **GONE** (already re-aimed) | Same as #2: green on the base (3/3) because it sets `sayHead: true` (`d3488c2`) | None. **3/3 PASS** |
| 4 | `chem` L5 | **STALE**, not a bug | `moreOpen:false` against "open (the desktop default)", which was the 0.4.0 S0 law. Josh's own commit `503997b` (iteration 001, 2026-10-16) says "MOLECULES' MORE starts folded". `lab/first-run.js` has `more: false` on both devices, and `tests/first-run.test.mjs` holds "arrive folded on every device (iteration 001)". Only CLAUDE.md and two comments still said open on a desktop | L5 now checks that the fold is folded on the first run, opens it with its chevron (the user's road), and then reads the plot. Screenshot: `x4-shots/chem-l5-more-open.png`. CLAUDE.md's MORE sentence was corrected, along with the comments at `chemview.js:493` and `molecules.js:60`. **56/56 GREEN** |
| 4′ | `chem` L7 (glycine timing) | **load-only** | Passes alone (56/56 above) | None |
| 5 | `menubar` styles row | **STALE** | `styles: false`. The row picked VIEW › `— style: GRAIN`, which iteration 008 G retired (GRAIN joined DUST; index 2 retired, DUST = 5; `notebook.js:111` lists CLOUD · SOLID · SIGNED · DUST · BANDS) | Re-aimed to the five live rows with their indices, and the reason is inline (the views row's own pattern). **PASS** |
| 6 | `library` step 5 | **BUG** | Step 5's `__LW.restore(file)` returned **false**: the restore threw and rolled the whole open back (palette not restored, H₂O still up). Console: `restore failed can't access property "preset", rec is null @ central.js:40 configure ← persist.js:208`. The file's `instruments.central` was `null`, and `configure(rec = {})` defaults only for `undefined`. SEPARABLE's, LATTICE's and BLOCH's loads already read null as absent | **`lab/central.js:41`**: `configure(rec) { rec = rec \|\| {}; …`. Null now means the defaults, as absent does (doc comment at :39-40). **7/7 PASS** (step 5: "lysine's record is not open: the network refused it (offline)…", palette restored) |
| 7 | `stage-text` §3 | **STALE** | `el is null`: the row selected the retired `orbitals` card's `.reg-bar select` | Re-aimed to `.dev[data-id="chem"] .reg-pane .reg-bar select.sel`, the first pane, which is ORBITAL (Yan's note). **4/4 PASS** |
| 8 | `orbitals` L9 | **GONE** | `GREEN orbitals — 0 failing of 24` on the base | None (re-run on the branch: 24/24) |
| 9 | `tools/settings-probe.mjs` (now 3 scenes; WAVE DANCER red) | **STALE probe**, not a WORKSPACE breach | WAVE DANCER's reload differs in `closed` (the same 20 ids in another order: the demo saved its own card order, and the reload's shipped order puts LATTICE…SEPARABLE after LADDER) and in `modwin.modes.s3` (the demo's own device). The probe reloads with a plain driven start, and THE START (0.5.0 C6b) treats that as a **BOOT** of the shipped rack, which never reads the session's arrangement. A person's reload goes through **RESUME** (`lambdawaves.q0.session` holds the project, layout included). Measured on the base with the reload as `?starter=resume`: **GREEN, all 3 scenes byte-identical, s3 and the order included**. The law "the device remembers it, last one wins" holds on the road a person takes | The probe reloads via `?starter=resume`, and its header says why. The `unseat` workaround (C4's "there is no reopen-last-project") is deleted because it is dead on that road. **GREEN 0 of 3 red** |

## App fix
- `lab/central.js:41` `configure(rec)`: a `null` record now opens the defaults instead of throwing inside `restore()`. Before the fix, a project, an undo or
  a link whose `instruments.central` was `null` was rolled back whole, with only "restore failed" in STATE. It has been red since G1 (`6b2c6ad`, 10-16).

## CLAUDE.md (one sentence's wording changed)
> MOLECULES keeps KICK / RUN / TDA / the spectra in the `.mol-more` fold: folded on every first run, desktop too (iteration 001, Josh;
> `first-run.js` `more: false`), its state in the card's WORKSPACE record (`more`); …

The old wording was "open on a desktop, folded on a phone or tablet".

## The gate
- `node tests/pwa.test.mjs --write`: written (sw.js picks up the three lab edits).
- `./test.sh node`: **rc 0**.
- `node tools/rack-deps.mjs --classes --no-write`: **rc 0**, G-G HOLDS (0 bare writes; spectrum 25/25).
- `node tools/new-project.mjs --check`: in step (16098 B).
- Browser, every suite touched or listed:
  - molecular-names 6/6
  - lw-links 5/5
  - molecule-head 3/3
  - chem 56/56
  - menubar PASS
  - library 7/7
  - stage-text 4/4
  - orbitals 24/24
  - history PASS
  - new-project PASS
- `tools/settings-probe.mjs`: GREEN, 0 of 3 red.
