# C4 · THE SCREEN GAP AND THE STRAY TAGS (iteration 006)

Branch `it006-screen` (from `70b53b6`), tools only — `tools/volumes/catalogue/{build,chebi,curated,pubchem,report}.py`,
`tools/volumes/pack.mjs`, and `research/iteration-004/CAT-BUILD.md` regenerated. No `lab/` change. Data stays outside git in
`~/Documents/LAMBDAWAVES-VOLUMES/`. Nothing pushed. Every build ran cache-only (`LW_OFFLINE=1`), niced 18, one thread; PubChem was never
asked. The three solvers were never signalled.

## 1 · THE SCREEN GAP

**What was wrong.** The two NAME lists (the CWC Annex, the illicit list) already matched on the InChIKey's first block. Every other
signal was read off the one entry that carried it — Wikidata's weapon and recreational-drug uses, ChEBI's hallucinogen and opioid
roles — and nothing marked a controlled MEDICINE at all. d-Methamphetamine is an approved drug (ChEMBL, N06BA03) and on no list, so its
skeleton was unscreened; the racemate (`methamphetamine-2`, CID 1206, Wikidata alone, approved by nobody) and levomethamphetamine
passed, and both were solved and packed in VOL. V.

**The fix** (`build.py` step 5, `curated.CONTROLLED_ATC`):

- Every signal screens its whole first block — racemate, enantiomers, isotopologues, protonated forms — and, for a salt or a charged
  record, its neutral parent's too (`skeletons_of`: the largest organic fragment, neutralised). That holds for the name lists
  (`block_list`) and for the per-entry signals, gathered over all 34,191 merged entries before any filter.
- One new signal for the controlled-substance screen: an approved medicine whose OWN ATC code (ChEMBL's, never a combination's) sits
  in a controlled-drug group — opioids N02A · N01AH · N07BC, central stimulants N06BA, central anorectics A08AA, barbiturates N05CA ·
  N03AA, benzodiazepines and Z-drugs N05BA · N05CD · N05CF, ketamine N01AX03 · N01AX14. The medicine itself passes; it marks its
  skeleton.
- A row a screened skeleton holds stays only when it is ITSELF an approved drug by ChEMBL (max_phase 4): a ChEMBL approved parent
  whose own structure is one molecule and is this row — never a salt folded onto it (`is_own`; until now any ChEMBL nomination,
  folded or not, counted).
- The CWC's Annex names and class patterns still refuse outright, approved or not (the law: every scheduled agent and precursor; the
  class patterns are structural, so every skeleton-mate already meets them by itself). A Wikidata weapon use now screens its skeleton
  too, with the same approved-drug exemption.

29 first blocks carry a CWC signal and 189 a controlled-substance signal. **Newly refused: 10 rows**, every one through a
skeleton-mate's signal (`vol-1.excluded.json`, `screen: illicit`, with `skeleton` and `via`):

| row | source | refused because its skeleton is shared with … | state then |
|---|---|---|---|
| `methamphetamine-2` Methamphetamine (racemate) | Wikidata | Methamphetamine (d-, ATC N06BA03) | solved · packed VOL. V |
| `levomethamphetamine` Levomethamphetamine | Wikidata | Methamphetamine (d-, ATC N06BA03) | solved · packed VOL. V |
| `arketamine` Arketamine | ChEBI + Wikidata | Ketamine (N01AX03) | finish queue |
| `esmodafinil` Esmodafinil | ChEBI + Wikidata | Modafinil (N06BA07) | finish queue |
| `levofenfluramine` Levofenfluramine | ChEBI + Wikidata | Fenfluramine (A08AA02) | finish queue |
| `methorphan` Methorphan (racemethorphan) | ChEBI + Wikidata | Levomethorphan (ChEBI role opioid) | finish queue |
| `tilidine` Tilidine (one stereo form) | Wikidata | Tilidine (another form, ChEBI role opioid) | finish queue |
| `vinbarbital-2` Vinbarbital (racemate) | Wikidata | Vinbarbital (N05CA09) | finish queue |
| `acetylmethadol` Acetylmethadol (racemate) | Wikidata | Levacetylmethadol (ChEBI role opioid) | Rent-A-GPU queue |
| `pentazocine` Pentazocine (Wikipedia's stereo form) | Wikidata | Talwin = pentazocine, ChEMBL's (N02AD01) | Rent-A-GPU queue |

No row was refused by the CWC widening, and no row the old screen kept as "approved" was approved only through a folded salt, so the
narrower exemption refused nothing by itself.

**What the exemption keeps** (stats `screens.keptAsApprovedDrugs`, CAT-BUILD.md): 103 rows a screened skeleton holds stay because
each is itself a ChEMBL approved drug — the controlled medicines themselves (morphine, fentanyl, codeine, oxycodone, methadone,
d-methamphetamine, amphetamine, dextroamphetamine, methylphenidate, modafinil, ketamine, esketamine, diazepam, the barbiturates,
zolpidem, cannabidiol, dronabinol's THC, GHB …), and **four beside another form's signal**: dextromethorphan (beside levomethorphan),
levoamphetamine (beside amphetamine), levopropoxyphene (beside dextropropoxyphene) and `menthol-2` (beside a menthol stereoisomer
Wikidata lists as a "lachrymatory agent").

## 2 · THE STRAY DRUG TAGS

**Three causes, all found, all fixed** (each lost word traced to the evidence that had carried it, against `before-c4`; a row can have
several):

1. **ChEBI's SUBMITTED roles — 334 rows, the big one, and glucose's.** A ChEBI has_role relation carries a status (`status.tsv`: 1
   CHECKED, 3 OK, 9 SUBMITTED); 14,568 of the release's 59,170 has_role relations are SUBMITTED — submissions ChEBI's curators have not
   checked, in large id-contiguous blocks. D-glucopyranose (CHEBI:4167, a 3-star entity) has 21 of them (ids 1261020–1261040):
   cardiovascular drug, antineoplastic agent, anticonvulsant, antipsychotic agent, analgesic, anti-HIV agent, antifungal … — that, not
   salt-folding nor inheritance, is how glucose became a painkiller, a heart drug and a mind drug. Amoxicillin has 12 (analgesic,
   antimalarial, anti-obesity …), caffeine 16 (anti-HIV, antipsoriatic, analgesic …), atenolol 5 (antineoplastic, antidepressant …).
   `chebi.py` read every relation whatever its status. Words lost this way: cancer 207 · heart 89 · painkiller 84 · mind 68 ·
   antibiotic 28 · allergy 4 · hormone 4.
2. **Salt and mixture folding — 74 rows, sulfuric acid's.** ChEMBL keeps an inorganic or mixed substance as its own "parent" (magnesium
   sulfate, zinc sulfate, lithium carbonate, calcium gluconate, the omega-3 ethyl esters, racemic tranylcypromine drawn as two
   components), ChEBI files salts and hydrates as entities, and the build folds each onto its largest organic fragment, neutralised —
   so the six ChEMBL metal sulfates and magnesium sulfate's ChEBI roles (analgesic, anticonvulsant, cardiovascular, antineoplastic)
   landed on sulfuric acid; lithium citrate's and sodium citrate's on citric acid; sodium acetate's on acetic acid. Words lost: cancer
   39 · heart 17 · painkiller 13 · mind 10 · antibiotic 7 · hormone 2 · skin, stomach, allergy 1 each.
3. **ChEBI role inheritance down is_a — 45 rows.** A role asserted on a class (a steroid class's `hormone`, mostly) reached every
   member. Words lost: hormone 34 · heart 5 · mind 4 · antibiotic, painkiller, cancer 2 each.

**The rule now** (`build.py` THE DRUG-CLASS WORDS, `is_own`; `chebi.py` `ownRoleTags`): painkiller, heart, mind, cancer, antibiotic,
antiviral, allergy, anaesthetic, eye, lung, skin, stomach, diabetes, parasite, immune and hormone come only from evidence about THIS
molecule —

- its own ATC codes: a ChEMBL approved parent whose structure is ONE molecule (one component, water of crystallisation aside; never a
  salt, a mixture or a complex). The test is the structure's, not the InChIKey's: ChEMBL draws tetracycline, minoxidil and
  chlordiazepoxide as other tautomers than PubChem's record and atropine with other stereo flags, and each keeps its words (an
  InChIKey test, tried first, stripped them);
- a ChEBI role ChEBI's curators assert on the ChEBI entity that IS this molecule: has_role CHECKED or OK on the entity itself, closed
  upward through the role ontology only — not inherited down is_a, not SUBMITTED, never a salt's or a hydrate-salt's entity;
- a hand list or a Wikidata statement naming the molecule itself (a name PubChem had to take a salt's parent for does not count).

`chebi.py` was re-run from its cached flat files (no download): every entity identical but for the new `ownRoleTags` field; the old
outputs are kept as `cache/chebi/{nominations,by-inchikey}.before-c4.json`.

One more, outside the sixteen words, for the same root (3 rows): a salt of a metal other than sodium or potassium (or ammonium) never
gives its words to its INORGANIC anion — thallium sulfate's `pesticide`, copper carbonate's `colour`, calcium silicate's `food` were
the metal's (sulfuric acid, carbonic acid, silicic acid). Sodium and potassium salts still do (sodium nitrite, metabisulfite,
permanganate, arsenite act BY their anion — a blanket rule tried first stripped those), and every organic acid still takes its salts'
words (benzoate, sorbate, cyclamate, glutamate).

**The rows whose tags changed: 409** (408 lost a drug-class word; 62 also gained one — a freed slot let a word the four-tag cap had cut
come back, e.g. metformin `diabetes`, lidocaine `anaesthetic`, budesonide `lung`). Fifteen, old → new:

| row | before | after |
|---|---|---|
| Glucose | medicine · painkiller · heart · mind | medicine · food · sugar · life |
| Sulfuric Acid | medicine · painkiller · heart · mind | medicine · food · natural · acid |
| Carbonic Acid | medicine · painkiller · heart · mind | medicine · pesticide · food · natural |
| Citric Acid | medicine · heart · mind · flavour | medicine · flavour · food · life |
| Acetic Acid | medicine · cancer · toxin · food | medicine · toxin · food · solvent |
| Dioxygen | medicine · painkiller · heart · mind | medicine · food · natural |
| Caffeine | medicine · painkiller · heart · mind | medicine · mind · pollutant · flavour |
| Aspirin | medicine · painkiller · antibiotic · heart | medicine · painkiller · heart · acid |
| Amoxicillin | medicine · painkiller · antibiotic · cancer | medicine · antibiotic · acid · aromatic |
| Atenolol | medicine · heart · mind · cancer | medicine · heart · pollutant · aromatic |
| Cholecalciferol | medicine · antibiotic · heart · mind | medicine · vitamin · pesticide · food |
| Dapagliflozin | medicine · heart · mind · cancer | medicine · diabetes · aromatic |
| Cortisol | medicine · painkiller · heart · cancer | medicine · heart · allergy · hormone |
| 11-Deoxycorticosterone | medicine · hormone · steroid · ring | medicine · steroid · ring |
| (1R,2S)-Tranylcypromine | medicine · mind · aromatic | medicine · aromatic |

The tags (old = `vol-1.candidates.before-c4.json`, new = the file in place; only the words that moved):

| tag | old | new | tag | old | new |
|---|---|---|---|---|---|
| `cancer` | 443 | **221** | `aromatic` | 3968 | 4059 |
| `heart` | 371 | **268** | `acid` | 1429 | 1460 |
| `mind` | 347 | **269** | `ring` | 1261 | 1293 |
| `painkiller` | 218 | **126** | `pollutant` | 250 | 275 |
| `hormone` | 205 | **180** | `steroid` | 319 | 338 |
| `antibiotic` | 185 | **151** | `food` | 294 | 310 |
| `allergy` | 59 | 57 | `natural` | 1293 | 1305 |
| `anaesthetic` | 44 | 55 | `life` | 295 | 304 |
| `eye` | 102 | 116 | `amino acid` | 222 | 228 |
| `skin` | 88 | 97 | `vitamin` | 48 | 52 |
| `stomach` | 58 | 63 | `medicine` | 2439 | 2436 |
| `lung` | 42 | 48 | `classic` | 624 | 627 |
| `diabetes` | 26 | 32 | `pesticide` | 579 | 582 |
| `immune` | 28 | 30 | `flavour` | 143 | 146 |
| `parasite` | 50 | 51 | `neurotransmitter` | 13 | 16 |

Tags per row: 1 · 1,346 — 2 · 2,474 — 3 · 2,094 — 4 · 1,156 (was 1,346 · 2,431 · 1,990 · 1,313). Two blurbs changed (flumetasone,
tetrahydrocortisol: "a hormone" → "a steroid"; their λWAVES fallback names the first tag). Nothing else in any surviving row changed
but `priority` (dense, so ten fewer rows shift it).

**THE THEMES** (`pack.mjs --count-themes`, over the whole catalogue):

| theme | before (7,080) | after (7,070) |
|---|---|---|
| The Classics | 632 | **633** |
| Medicine | 2,447 | **2,419** |
| Life and Food | 1,952 | **1,975** |
| Materials, Atmosphere and Fuel | 924 | **923** |
| The Rest | 1,125 | **1,120** |

26 rows changed shelf. Medicine → Life and Food 25: glucose, sulfuric acid, carbonic acid, lactic acid, dioxygen, nicotinic acid,
pyridoxine, cholecalciferol, ergocalciferol, caffeine and capsaicin (a food or vitamin word the cap had cut came back), eleven
steroids whose only medicine word was ChEBI's `hormone`, inherited or unchecked (trenbolone, boldenone, bolandiol and its
dipropionate, dihydrodeoxycorticosterone, tetrahydrocortisol, 18-oxo- and 18-hydroxycortisol, clobetasol, flumetasone,
marinobufagenin — none of them a ChEMBL approved drug), and three medicines left with no class word at all — levodopa, baclofen,
cilastatin (see LEFT FOR JOSH). Life and Food → The Classics 1: silicic acid. The ten refused rows had sat in The Rest 5 · Medicine 3 ·
Materials 1 · Life 1.

## 3 · THE REBUILD, THE GATE, THE SWAP

- **A cache-only bug, found and fixed first** (`pubchem.py`). A batched PubChem answer is cached under its exact list of CIDs, so a
  catalogue ten rows lighter shifted every later batch of 50, and offline each shifted batch missed: the first C4 rebuild lost the
  synonyms of 6,318 rows and 237 blurbs. A cache-only run now answers a missed batch CID by CID from every cached answer of the same
  URL (synonyms, descriptions, conformers, properties). The unchanged code had first rebuilt C3's file row for row (0 field changes),
  and the final build differs from it only as described above.
- `LW_OFFLINE=1 build.py --out=…/vol-1.candidates.next.json` (23 s, log `catalogue/build-c4.log`) · `guards.py --pin` (0 rows: the
  solvers had finished nothing new at different atoms) · `check.py … --against vol-1.candidates.json` (`catalogue/check-c4.log`):
  **7070 rows checked · 0 complaints** — 7070/7080 previous ids present with the same InChIKey (the ten others named as refused by the
  screen) · 2676/2676 rows solved in `raw/` at exactly their solved atoms.
- **The swap, 08:53:53**: C3's files kept as **`vol-1.{candidates,stats,excluded}.before-c4.json`**, the gated files renamed over the live
  ones (rename(2), atomic); the gate run again on the live file against `before-c4`: 0 complaints.
- **The queues, 08:53:54**: `vol-1.finish.json` 1,248 → **1,242** (arketamine, methorphan, levofenfluramine, esmodafinil, tilidine,
  vinbarbital-2 dropped) and `vol-1.gpu-day.json` 3,232 → **3,230** (pentazocine, acetylmethadol dropped), each kept row taken from the new
  catalogue (same id, same atoms — checked row by row — new tags), written to a tmp and renamed; the old ones kept as
  `vol-1.{finish,gpu-day}.before-c4.json`. **The running solvers keep their in-memory list** (`solve.py` reads its queue once): the CPU and
  the two GPU processes (pids 358533, 358537, 359785, untouched) may still solve those six from the finish queue. Acceptable: a raw/
  directory the catalogue does not carry is never packed (the packer packs only `--candidates` ids), like the pilot's adrenaline,
  limonene and menthol. `methamphetamine-2` and `levomethamphetamine` were already solved (6/6 rungs each): their `raw/` stays as it
  is, unpacked.

## 4 · THE SHELF, REPACKED

`pack.mjs --incremental` now deletes what the index no longer reaches: once every volume is written, each `.lwm` and `.webp` in a
written volume's `m/` and `t/` that its new `index.json` does not list is removed (a refused molecule, one a theme moved, a pilot
leftover), and with `--themes` a `vol-<n>/` the shelf no longer has is emptied. Never with `--only` (a partial index). Tested first in
a sandbox dist (five molecules, planted stale files and a stale `vol-9/`: all five removed, nothing else).

**The 19 pilot leftovers in `dist/vol-1/m`**, listed before: adrenaline, aspirin, beta-carotene, caffeine, capsaicin, cholesterol,
citric-acid, dopamine, ethanol, glucose, ibuprofen, limonene, menthol, naphthalene, nicotine, paracetamol, serotonin, testosterone,
vanillin (`.lwm`, 28.9 MB with their 19 `t/*.webp`). Nothing references them: no `index.json` or `volumes.json` lists them, and
`lab/`, `tests/` and `tools/` name only the generic `vol-1/m/<id>.lwm` pattern (the kept pilot shelf `volumes.before-c3.json` lists the
volume, not files). The molecules that are in the catalogue live in their themed volumes with their own copies (aspirin, caffeine,
glucose … in II and III); adrenaline, limonene and menthol are pilot ids the catalogue does not carry.

**The run**: `node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json --themes
tools/volumes/themes.json --incremental`, from this worktree (generator `48cb6d3`), niced, 08:54 → 09:50 (55 min 43 s wall, 2.8 GB peak
RSS; log `~/Documents/LAMBDAWAVES-VOLUMES/pack-c4.log`). Nearly every molecule was packed again: its row's `priority` moved (ten fewer
rows) and the header carries the row. No new failure: helium and argon (no LUMO, as in C3) and the same four 6-31+G\* rungs refused by
the orthonormality gate (diphenylacetylene, biphenylene, tricyclobutabenzene, o-carborane). **55 files pruned**: the 19 pilot `.lwm`
and their 19 pictures in `vol-1/`, the 11 `.lwm` (and 3 pictures) of the molecules that moved Medicine → Life and Food, silicic acid's
in `vol-3/`, and `methamphetamine-2.lwm` and `levomethamphetamine.lwm` in `vol-5/`. Afterwards every volume's `m/` and `t/` hold exactly
what its index lists, no id is in two volumes, and none of the ten refused ids is in any index or any folder of `dist/`.

| volume | before (C3's pack, 08:15) | after | C4's own changes | newly finished since C3 |
|---|---|---|---|---|
| VOL. I The Classics | 564 · 200,971,048 B | **568 · 204,617,264 B** | + silicic acid (from III); 19 pilot leftovers deleted | 3 |
| VOL. II Medicine | 406 · 378,907,176 B | **404 · 381,973,384 B** | − 11 to III (glucose, sulfuric acid, carbonic acid, lactic acid, dioxygen, caffeine, capsaicin, nicotinic acid, pyridoxine, levodopa, baclofen) | 9 |
| VOL. III Life and Food | 796 · 534,088,576 B | **840 · 595,156,800 B** | + those 11; − silicic acid | 34 |
| VOL. IV Materials, Atmosphere and Fuel | 363 · 186,797,920 B | **378 · 204,919,320 B** | — | 15 |
| VOL. V The Rest | 497 · 302,373,928 B | **508 · 316,418,104 B** | − methamphetamine-2, − levomethamphetamine | 13 |
| **total** | **2,626 · 1,603,138,648 B** | **2,698 · 1,703,084,872 B** | | 74 |

(bytes: the `.lwm` the shelf lists. On disk, with pictures and indexes, `vol-1/` went 230,307,209 → 205,067,172 B: the 28.9 MB of pilot
leftovers is gone.) 4,372 not packed: not finished (the two queues), helium and argon.

## LEFT FOR JOSH

1. **The ATC groups that mark a controlled medicine** (`curated.CONTROLLED_ATC`). Two refusals are judgement calls: levofenfluramine
   (fenfluramine is not under international control and the US descheduled it in 2022: drop `A08AA` to keep it) and esmodafinil
   (modafinil is US Schedule IV, not UN-scheduled). Arketamine follows ketamine (nationally controlled almost everywhere). Each is one
   line to change.
2. **Three medicines now have no class word** and, being `amino acid` by structure, sit in Life and Food: levodopa, baclofen and
   cilastatin carried only ChEBI words that were unchecked or inherited. The ATC map has no entry for N04 (anti-Parkinson) or M03
   (muscle relaxants), and ChEMBL gives cilastatin none: `('N04', 'mind')` in `build.py`'s ATC_TAGS would bring levodopa,
   carbidopa and the dopamine agonists back to Medicine; your call.
3. **CHECKED ChEBI roles are still research activities sometimes** — midazolam is a ChEBI-checked "antineoplastic agent", so it reads
   `medicine · mind · cancer · anaesthetic`. Ranking ATC over ChEBI for approved drugs (ChEBI's drug roles only where a drug has no ATC
   code of its own) would drop those too — it was tried on the way and is a few lines; not applied, since your rule names "a ChEBI role
   asserted on the molecule itself" and it would take many more words off the shelf.
4. **`medicine` itself still comes from any ChEMBL approval, folded salts included** — 18 rows are approved only through a salt or
   mixture (sulfuric, carbonic, nitric, perchloric, gluconic acid, betaine from chloral betaine, fused quartz from talc … but also
   meclocycline, EDTA, benzoic and phenylacetic acid, whose salt IS the drug). Not in this row's sixteen words; sulfuric acid is in
   Life and Food now through `food` (it is E513) whatever `medicine` does.
5. **ChEBI's SUBMITTED statuses touch more than roles**: 103,516 SUBMITTED is_a relations still feed the structural classes (amino acid,
   sugar, fat, steroid, alkaloid, life) and the non-drug roles. Left as they were.
6. Unchanged from C3: helium and argon solve but do not pack; descriptions for 1,101 CIDs only; no thumbnails rendered; no `--archive`;
   nothing pushed — `it006-screen` waits for the integrator.
