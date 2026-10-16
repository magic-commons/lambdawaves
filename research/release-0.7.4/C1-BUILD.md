# 0.7.4 C1 THE CATALOGUE + THE PICKER — build note (Opus, 2026-10-16)

Branch `c1-catalogue` from `dc88903`. lab/ lines **29,479 → 29,507 (+28 of the +45 budget, the 21 generated lines included)**.

## Seats
- `tools/catalogue-table.mjs` (new, node): it builds the rows from HAMILTONIANS (each operator needs a hand row, or the tool throws), MOLECULES + RECORD_ONLY
  (word = statusOf's own rule: a record's `status.energy`, else MEASURED when PySCF's energy is on file → `STATE_WORD`), lattice-model PRESETS, state.js
  PRESETS and STARTERS, plus the HAND table (each row carries its SYSTEMS.md id). A demo row takes the word and oracle of the system it plays. `--check` is byte-exact.
- `lab/catalogue.js` (new, generated, 21 lines): `export const CATALOGUE`, frozen rows `{ id, name, shelf, opens, word, oracle: { test, what }, since }`.
- `tests/catalogue.test.mjs` (24 lines): ids are unique; every `oracle.test` exists in tests/; every word is one of the three; every row is whole; each of the
  98 molecules appears once; each HAMILTONIANS id appears with `opens: 'ham:<id>'`; all 11 lattice presets appear; `--check` passes.
- THE PICKER, `lab/windows/spectrum.js:32–42`: the OPERATOR `seg` is now the kit's `stepper` ‹ SYSTEM ›, with seven items (HYDROGEN · OSCILLATOR · BOX ·
  ATOM · QUARKONIUM · MOLECULES · LATTICE). The name opens the kit's list. Each list row's hover is `word · oracle.what`, and so is the stepper's own title.
  QUARKONIUM is `coming` (listed, never chosen), titled "its editor returns in 0.8.0". The hidden-button line and its comment are gone. HYDROGEN, OSCILLATOR,
  BOX and ATOM run exactly the old onChange (`switchHamiltonian`, `enterBox`, ATOMS un-hidden). MOLECULES and LATTICE call `app.sh.layout.reopen('chem' |
  'lattice')` and leave the Hamiltonian alone; the name then reads back what owns the field. `ui.hamSeg` keeps its name: `{ root, value, set(id) }`, and
  `set` shows MOLECULES while `app.state.chem.on`. `lab/windows/molecules.js:26` (moleculeMode) calls `ui.hamSeg.set` on every owner change.
- THE MODEL SHEET, `lab/badges.js:17–21`: `sheetToggle` builds the table on the sheet's first open, under the prose: SYSTEM · STATUS · ORACLE (`what · test`)
  · SINCE, with one heading row per shelf. `lab/lab.css` (after `#sheet b`): the sheet scrolls (`max-height`, `overflow: auto`) and the table uses the sheet's
  own glass and small type (4 rules, unlayered).
- `__LW.catalogue`, `lab/shell/facade.js:18` (after `presets`). `research/release-0.5.2/lw-facade.json` diff, re-captured with `--write`: **+1 line,
  `["catalogue","value"]` after `["presets","value"]`** (178 members).

## Rows (181)
| shelf | rows | of them |
|---|---|---|
| hydrogen | 41 | HYDROGEN, Z ion, MOMENTUM, STURMIAN, STARK, ZEEMAN, A/B, KICK, SO(4), RATE (S01–S03, S09, S11–S16) + 31 `preset:<id>` |
| operators | 5 | OSCILLATOR, BOX, QUARKONIUM, ATOM (from HAMILTONIANS), GAS (S06) |
| molecules | 102 | MOLECULES · RHF STO-3G, 6-31+G*, OPEN SHELLS · UHF, KOHN–SHAM · RKS LDA + 61 live (7 open shells) + 37 record-only, one line per SECTION |
| registers | 4 | MO-REGISTRY, STATES, RT-TDHF, FLOW |
| readouts | 6 | WIGNER, RADIATION, CALCULUS · METERS · PERIOD, KEPLER · ORBIT · VORTEX · PLANE, SHADOW, LADDER |
| lattice | 12 | LATTICE (the window) + 11 `lattice:<id>` |
| demos | 11 | `demo:<file>` for each STARTER |

Words: **EXACT 47 · NUMERICAL 132 · UNCHECKED 2** (A/B TRANSITION: no node oracle; PER-LABEL RATE: a toy). `--check`: **17,438 bytes, 181 rows, in step.**
`since` is the first alpha tag whose tree carried the row (a one-off git-tag scan): pre-alpha items count as 0.1.0. Live closed shells are 0.2.0, records
0.4.0 and open shells 0.7.1; the molecule scan put every molecule in one of those three groups with no exceptions.

## Corrections to the brief
1. **Packing.** 181 rows cannot fit one row a line in 40 lines, and two a line would still need 91. The file therefore packs **one shelf a line** (one line per
   molecule SECTION), with each row as a tuple `[id, name, opens, word, oracleIndex, since]` and each distinct oracle stored once in `O`. The exported
   CATALOGUE is still exactly the brief's object shape.
2. Two window rows were added so that the picker's MOLECULES and LATTICE items have a word and oracle: `molecules` (S17) and `lattice`. Four method rows sit
   on the molecules shelf: `basis-631` (S18), `uhf` and `lda`, plus `molecules` itself. The open shells are molecule rows (their oracle is `uhf.test.mjs`)
   and also have the family row `uhf`.
3. Ids carry a prefix wherever they would collide: `preset:`, `lattice:` and `demo:` (`tunnel` and `lda` are both a demo and a system). Molecule rows use the
   bare molecule id.
4. The kit's list pane has no per-row hover, so the picker sets each row's `title` when its name opens the list (one listener after the kit's).
5. `tests/molecular-names.browser-test.mjs` read the old `seg` buttons (QUARKONIUM hidden, an ATOM press), so it now reads the stepper: QUARKONIUM is `coming`
   with the 0.8.0 reason, and ATOM is picked from the list. It was run once and is green.

## Gates
`./test.sh node` rc 0 (after `pwa --write`). `node tests/catalogue.test.mjs` PASS. `node tools/catalogue-table.mjs --check` in step. `rack-deps --classes`
HOLDS: spectrum stays at 25 (it was 25 on the base too). `new-project --check` in step. `serialize-bytes`: 11 readings on C1 and on the base tree, **0 of
11 shas differ**. `lw-facade --write`: +1 member. `molecular-names.browser` green. A one-off probe: the pickers route as described, the sheet shows 181 rows
under 7 shelf headings and scrolls, and there are no console errors. The + list did not change shape, so `keyboard-window` was not run.

## Dropped
- The arrows' walk keeps the read-back. Stepping onto MOLECULES or LATTICE opens the window, and the name returns to the field's owner, so ‹ › never
  get past MOLECULES. The list reaches every item.
- No per-row since table for the hand rows past what the tag scan gave. There are no covers, search or paper table (deferred by the plan).

## What C2 needs
- Row shape: `{ id, name, shelf, opens, word, oracle: { test, what }, since }` from `import { CATALOGUE } from './catalogue.js'`.
- A molecule's row: `CATALOGUE.find((r) => r.id === m.id && r.shelf === 'molecules')`. The id is the molecule's own MOLECULE_BY_ID key, and `opens` is
  `molecule:<id>`. Every live and record-only molecule has exactly one row.
- ATOM's row: `id: 'atom'`, `shelf: 'operators'`, `opens: 'ham:atom'`, word NUMERICAL, oracle `atoms.test.mjs` (HF limits). There are no per-element
  rows: the periodic shelf's tiles take ATOM's word.
