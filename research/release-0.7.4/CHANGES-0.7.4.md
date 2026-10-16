# 0.7.4-alpha "Shelves" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.11. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 00:20 while 0.7.3 built; base `dc88903`, 29,479 lines, cap 29,773). Two Opus builders: C1 from
`dc88903` (branch `c1-catalogue`, tip `6de4f80`), C2 from C1's merge. Build notes: `C1-BUILD.md`, `C2-BUILD.md`. Josh 00:35: "Let's continue onward with the rest
of the build plans."

## The shape
THE CATALOGUE is one generated table of every system the instrument plays, each row with its status word in `lab/status.js`' grammar (EXACT · NUMERICAL ·
UNCHECKED) and the oracle test that stands behind it. It is the spine every picker reads and the paper's table; nothing in it is a claim the tree does not already
make. "Every system in one picker": SPECTRUM › the ‹ SYSTEM › stepper. "The library in shelves": MOLECULES' SECTION name opens the shelf — tiles you can read before
you pick, the periodic table first.

## C1 · THE CATALOGUE + THE PICKER (`lab/catalogue.js` 21 generated lines, `lab/windows/spectrum.js`, `lab/badges.js`, `lab/shell/facade.js`, one line in `lab/windows/molecules.js`, 4 rules in `lab.css`)
- `tools/catalogue-table.mjs` writes `lab/catalogue.js` from the live tables (HAMILTONIANS, MOLECULES + RECORD_ONLY with `library.json`'s `status.energy`, the
  lattice PRESETS, hydrogen's PRESETS, the STARTERS) plus a hand table whose every row names its SYSTEMS.md id: **181 rows in seven shelves** — hydrogen 41 ·
  operators 5 (GAS joined them) · molecules 102 (every live molecule and record once; method rows `basis-631`, `uhf`, `lda`; window rows `molecules`, `lattice`) ·
  registers 4 · readouts 6 · lattice 12 · demos 11 (a demo takes the word and oracle of the system it plays). Words: EXACT 47 · NUMERICAL 132 · UNCHECKED 2 (the A/B
  transition, the per-label RATE). Ids that would collide carry a prefix (`preset:`, `lattice:`, `demo:`; `tunnel` and `lda` are both a demo and a system). One
  shelf a line, rows as tuples, each oracle stored once (181 rows cannot sit one a line in 40 — a builder's correction); the exported `CATALOGUE` has the plan's
  object shape `{ id, name, shelf, opens, word, oracle: { test, what }, since }`. `--check` holds the 17,438 bytes. `since` from a scan of the tags.
- **The picker:** SPECTRUM's OPERATOR seg is the kit's ‹ SYSTEM › stepper with seven items, each item's hover `word · oracle.what` (set when the list opens — the
  kit's list has no per-row hover); HYDROGEN · OSCILLATOR · BOX · ATOM do exactly what they did; MOLECULES and LATTICE open their windows and leave the Hamiltonian
  alone, the name then reading what owns the field; QUARKONIUM listed and unpickable with "its editor returns in 0.8.0" — the hidden-button line and its comment
  are gone. `ui.hamSeg` keeps `{ root, value, set(id) }`, so persist, the verbs, LAUNCH, KEPLER and the facade read it unchanged. Known: the ‹ › arrows cannot step
  past MOLECULES (landing there opens the window and the name snaps back); the list reaches every item.
- **The MODEL sheet** renders the table on its first open under the prose (system · word · oracle · since, a heading per shelf) and scrolls. `__LW.catalogue`
  (+1 facade row after `presets`).
- **Checked:** `tests/catalogue.test.mjs` (24 lines) — every oracle test exists, every word one of the three, each of the 98 molecules once, the operators and
  the 11 lattice presets present, `--check` in step; serialize-bytes 0 of 11 differ; `molecular-names.browser-test` adapted to the stepper (QUARKONIUM listed but
  unpickable) and green; the + list did not change shape. rack-deps holds with SPECTRUM at its limit 25 — no headroom for another crossing in that module.

## C2 · THE SHELVES (`lab/chemview.js` +18 with one line in `lab/windows/molecules.js`, 7 lines in `lab.css`)
- **The shelf.** Pressing the SECTION name opens a `.mol-shelf` panel under the MOLECULE picker and above BASIS (folded shut by default; `aria-controls` and
  `aria-expanded` on the name — the chevron's ARIA idiom, no glyph: the kit sizes the name's seat to its longest word and a glyph would move the arrows; Alt+↓
  still opens the kit's list). It shows the page's molecules as TILES in GROUPS order: the formula (`<m>`), the name, the AO count, the catalogue's word (read from
  `CATALOGUE`, never a second table) and a lamp — LIVE · INSTALLED · DOWNLOAD · NOT A MINIMUM; the tooltip is the dropdown option's own text with the reason or
  "past the cap". One tap folds the shelf and is `handPick(id)`; the dropdown and its arrows are unchanged; the shelf refreshes on a page or lamp change and on a pick.
- **The periodic table.** ‹ ATOMS › is a new first page of the stepper's items (`SECTIONS` in `molecules.js` unchanged, so `__LW.chem.section`, INSTALLED and the
  tests' page loops behave as before): 36 tiles H–Kr with the symbol, Z and ATOM's word (NUMERICAL — there are no per-element rows). A tap switches MOLECULES off if
  it is on (else the molecule would keep the field), sets the element, sets the operator to ATOM, updates SPECTRUM's ‹ SYSTEM › and opens the ATOMS card — through
  the chem `api`'s new `atomZ()` / `atom(z)` in `windows/molecules.js` (the ATOM road lives there, not in `atomsview.js` as the brief guessed). On the ATOMS page
  the MOLECULE picker reads empty, as on any page not holding the molecule on screen.
- **Layout.** CSS grid with `auto-fill`: three tiles a row in the card, two on a phone (`body.phone`); the tiles reuse ATOMS' `.pk-c` cell, no new colour; five
  short lines a tile so nothing is cut at three a row. **Tiles per shelf:** ATOMS 36 · DIATOMICS 17 · HYDRIDES 23 · ORGANIC 12 · BIO 27 · LATTICE 6 · HEAVY 13 (the
  98 molecules, the dropdown's pages).
- **Checked:** chem.browser 0 failing of 56; serialize-bytes 0 of 22 shas differ against the base; rack-deps holds (SPECTRUM untouched at 25; molecules 13 → 14);
  a throwaway probe: the name opened the shelf and no kit list, Ar set the operator to ATOM and Z = 18 and opened ATOMS, benzene set the preset and the dropdown; no
  page errors; screenshots in the builder's `.tmp/` (c2-organic, c2-atoms).

## The light check (existing gates only) and the cut
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds; `tests/catalogue.test.mjs` + `tools/catalogue-table.mjs --check` green; lw-facade re-captured (+1 row) and
  molecular-names green on C1's merge; `tests/chem.browser-test.mjs` once on the merged tree; THE LOCK ×2 at the merge tip with `--query gastab=0` on BOTH runs — results in the HANDOFF §2 block of the cut.
- **Lines:** 29,479 → 29,525 (+46 = C1 +28, C2 +18; cap 29,773).

## Known, deferred (recorded)
The paper's table rendered from `CATALOGUE` (a tools step when the paper is next touched); search in the shelf; covers on the tiles; per-element catalogue rows
(the periodic table's tiles take ATOM's word); the Central Lab's rows (0.8.0 adds them through the same tool); the stepper's arrows past MOLECULES.
