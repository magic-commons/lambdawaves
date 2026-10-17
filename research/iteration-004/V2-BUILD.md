# Iteration 004 · V2 A VOLUME'S MOLECULE ON THE STAGE — build report

Branch `it004-v2` from `4deff68` (yan-c after V1 and CAT). No push, no deploy, no tag. No new test files. Lab line count
(`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`): **31,346 → 31,474 (+128)**.

## What landed (seats unchanged)

| row | where | what |
|---|---|---|
| 1 `openVolume` | `lab/chemview.js` (after `solve()`: `openVolume`, `volSolve`, `methodsVol`; the api's `openVolume`, `volume`, `row`) | `V.file` (this device first, the network on a hand press) → `parseLwm` once → `rungRecord(lwm, basis)` (the lowest rung by default; an asked rung the file lacks opens the lowest and says why) → THE RECORD ROAD's `{ op: 'chem.open', lib, hash: lib.ground.hash, basis }` under the same `solveSeq` / `call` / `pending` discipline, landed by the same `land()`. MOLECULES on, `api.hand` (the head's road), STATUS through `statusOf` with the rung's own oracle (`IMPORTED` → NUMERICAL, "energy is PySCF's own"; a PubChem geometry says "computed"). A volume molecule is `volRef` (not a preset); `preset` is its key `vol-1:aspirin`, `catPreset` the catalogue molecule beside it. The dropdown gains one optgroup `VOL. I` with `ASPIRIN · VOL. I`, gone on a catalogue pick. `chemAtoms` / `chemCharge` (card-level shadows), `query()`, `record()`, `atomsNow()`, `capability()`, the symmetry line (the record's declared group) and the caption read it. KICK, RUN, FLOW, PULSE, TDA and VIBRATE stand down through `standDown()` with one sentence, LDA through the METHOD seg: "a volume molecule is its record; the live roads are the catalogue's". The Picker's tile already called `chem.openVolume`; its "cannot open yet" fallback is gone. `__LW.chem.openVolume` is the same object. |
| 2 the ladder | `lab/chemview.js` `bSeg`, `paintBasis`, `pressBasis`, `readHolds`, `liveOk` | six options from `BASIS_LABEL`. A volume molecule: every rung its record (no solve); a missing rung disabled with the header's `skipped` / `failed` reason. A catalogue molecule: STO-3G and 6-31+G* keep the live law (`basis631`, the cap); every other rung — and 6-31+G* past the cap — opens from an INSTALLED volume holding the same id (`readHolds`: shelf → `statusOf` installed → index), else disabled "in a volume". The volumes are read when the hand comes near the seg (pointerenter / focusin) and after a volume open — never at boot. A catalogue molecule left on a non-live rung goes back to STO-3G with a sentence. `setBasis` takes the whole ladder. |
| 3 PROJECT | `lab/chemview.js` `presentation` / `save` / `load`; `docs/STATE-SCOPES.md` | `instruments.chem.volume = { volume, id, basis, sha256 }` only while a volume molecule is on screen (or a project's is still to open); `library` not written then; `preset` / `basis` keep the catalogue molecule (a live rung). `load()`: the same molecule keeps its file; another opens on the next solve from this device only (`V.file(…, { network: false })`, a new option in `lab/volumes.js`) — not installed: the catalogue molecule stays chosen, MOLECULES' status says "ASPIRIN · VOL. I is not on this device — install it in the PICKER's LIBRARY", 0 solver calls. A different `sha256` opens the current file and says so. Undo / redo re-open the last volume molecule without a read (`volKeep`). `new-project --check` and `serialize-bytes` unchanged (bytes identical to the base on all 11 readings). |
| 4 `lw:` | `lab/shell/notebook.js` `lwLink`; `lab/verbs.js` VERBS row `volume` | `lw:volume=vol-1&id=aspirin[&basis=6-31g]` → the `volume` verb (`openVolume` as a hand press, one history row, one fade `Aspirin · VOL. I · 6-31G`). An unknown volume or id is refused → "ignored: volume" on the foot. `id` / `basis` are consumed only beside `volume`. |
| 5 the pictures | `tools/menu-thumbs.mjs --volume vol-1` | each molecule of `<dist>/vol-1/index.json` through `__LW.chem.openVolume` (lowest rung) at HOME in the tool's look → `<dist>/vol-1/t/<id>.webp` (31 pictures, 104 kB; no manifest). `pack.mjs` already filled `thumb` where `t/<id>.webp` exists — no packer change was needed; re-packed, `index.json` has 31/31 thumbs. |
| 6 pack.mjs | `tools/volumes/pack.mjs` (`PACKER` → `pack.mjs v2`) | an `app` candidate takes the app's formula: `formulaM` is `lab/molecules.js`' markup (`<m>NH₃</m>`, `<m>HBr</m>`, `<m>CO(NH₂)₂</m>`), `formula` its plain ASCII (`NH3`, `CO(NH2)2`); the packer's formula now also wins over the candidate's PubChem Hill in `meta` (it was spread after). Verified with `--out` into tmp (NH₃, urea, HBr), then vol-1 re-packed `--incremental` (the version bump repacks all). |
| 7 wiring | `tests/wiring.test.mjs` | the `lab/volumes-format.js` ALLOWLIST entry deleted (chemview imports it); the module is now precached. |

Readers moved off `MOLECULE_BY_ID.get(chem.preset())` onto `chem.row()` (catalogue row or `{ id, name, formula, charge, volume }`):
`lab/shell/stage-words.js` (the STAGE FORMULA and the CAPTION, which adds `VOL. I`), `lab/windows/spectrum.js` (EDIT › COPY's
molecule page), `lab/verbs.js` `inventory()`. `lab/film-card.js` names a volume molecule and its rung.

## Where the brief was wrong, and what I decided

1. **The precache ceiling.** Row 7 puts `volumes-format.js` (5.5 kB) into the precache and rows 1–2 add ~11 kB to `chemview.js`;
   the base had ~8 kB under the 8 MiB ceiling, so `pwa.test` went red at 8.01 MiB. Decided: re-encode `lab/img/warning-sign.png`
   losslessly (PIL optimize, compress 9: 68,053 → 53,750 B, pixel-identical RGBA, same 480 × 424) and tighten my own comments
   (and drop chemview's unused `AO_GUESS`). Precache now 8,385,267 B — **3.3 kB under** the ceiling. The next row that adds code
   will hit it; the honest fixes are Josh's (a ceiling decision, or moving something to DATA).
2. **"the pilot: 29 molecules packed"** — `dist/vol-1` held 12 at the base. Re-packed from `catalogue/pilot.candidates.json`:
   30, then 31 when β-carotene finished during the run. Meanwhile the integrator's long solve has moved on to
   `vol-1.candidates.json` (STATUS: 131 done / 819 left at the time of writing); vol-1 is still packed from the PILOT candidates —
   the integrator re-packs from the full catalogue when it wants.
3. **"the packer reads `t/`"** — it already did (V1: `thumb` set when `t/<id>.webp` exists). No change.
4. **"the head (the record's stem)"** — since iteration 001 the head is the notebook's (`headLand` is a no-op); the landing carries
   `r.stem` and calls `api.hand` exactly as a library record does, so the head works wherever it is wired. The light check reads the
   rung and E from the E readout and the STATUS line instead.
5. **"no solve" for a missing volume** — read as: no fetch and no solve at all (the catalogue molecule stays chosen, nothing lands),
   so the sentence is not overwritten. The project's reference is dropped after that one attempt (a re-save without the volume no
   longer names it); a catalogue pick, a basis press or MOLECULES ON afterwards behave as for any catalogue molecule.
6. **A catalogue molecule's volume rung** opens the VOLUME molecule (`WATER · VOL. I` at 6-31G) rather than a catalogue molecule
   with a borrowed record: one presence, one road; picking the catalogue molecule again returns to the live law.
7. **The six-rung seg** wraps to two lines in the 280-px card (4 + 2), as VIEW already does — no new row (seats kept).
8. **`query()`** returns the volume molecule's atoms / rung (as the brief says); the worker answers STATES from the record's caps
   (it refuses with its own sentence, the C₆₀ road).

## The light check (one pass, headless Firefox on 9591 with the dev link)

```
install          PICKER › LIBRARY › VOL. I → INSTALLED · REMOVE
open aspirin     ASPIRIN · VOL. I (optgroup VOL. I), MOLECULES on, 73 AOs, "from its record (825 KB, on this device) in 9 ms, no solver call"
rung sto-3g      73 AO  E −636.642060  solver calls 0  field 73   DENSITY · NUMERICAL · energy is PySCF's own
rung sto-6g      73 AO  E −642.835243  0  73
rung 3-21g      133 AO  E −641.345849  0  133  DENSITY · exact · 47 orbitals summed (the FACTOR road past 128 AOs)
rung 6-31g      133 AO  E −644.661098  0  133
rung 6-31g-star 211 AO  E −644.944845  0  211
rung 6-31+g-star 263 AO E −644.961920  0  263   readout "ASPIRIN · VOL. I · 6-31+G* · E_nuc 782.160488"
stood down       KICK disabled: "a volume molecule is its record; the live roads are the catalogue's"
save → new → open  { volume: vol-1, id: aspirin, basis: 3-21g, sha256 8754… }, preset H2O, no `library` → NEW: none → reopened aspirin 3-21G, 133 AO, field 133
lw:volume=vol-1&id=caffeine                  caffeine sto-3g, 80 AO
lw:volume=vol-1&id=aspirin&basis=6-31g-star  aspirin 6-31g-star, 211 AO
lw:volume=vol-1&id=nosuch                    foot "ignored: volume", the molecule unchanged
catalogue H2O    the VOL optgroup gone; BASIS 6-31G → WATER · VOL. I at 6-31G, E −75.983974 (the volume's record)
not installed    a fresh profile, a project naming aspirin: NH₃ stays chosen, nothing lands, 0 solver calls, the sentence on MOLECULES
undo / redo      urea (volume) → undo H₂O → redo urea STO-3G
errors           2 × "ResizeObserver loop completed" (the existing noise), nothing else
```
Screenshots: `V2-aspirin-6-31g.jpg` (the factor-road density at 6-31G, the stage formula, the BASIS pop-up) and
`V2-caffeine-card.jpg` (the MOLECULES card: `CAFFEINE · VOL. I`, the six-rung ladder, METHOD's LDA stood down).

## Gates

`node tests/pwa.test.mjs --write` 0 (548 files, 8.00 MiB) · `./test.sh node` 0 · `node tools/rack-deps.mjs --classes --no-write`
HOLDS (spectrum at 25 of 25, unchanged) · `node tools/new-project.mjs --check` in step · `node tools/serialize-bytes.mjs` 11 readings,
byte-identical to the base tree.

## Left

- The precache headroom (3.3 kB) — a ceiling or DATA decision for Josh before the next code row.
- `V.install` does not store the four ladder basis files in `lw-data-v1` (V1's note says a volume installer should): an installed
  volume opened OFFLINE at STO-6G / 3-21G / 6-31G / 6-31G* would miss its basis file. Online it works (they are DATA, served).
- DIFF / ESP / FLOW stay offered only where a rung carries D (≤ 128 AOs), as V1 decided; past that DENSITY is the factor road.
- vol-1 is packed from the pilot candidates; the long run's molecules are not in it yet.
