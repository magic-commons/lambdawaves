# λWAVES on Steam — the two free add-ons' store pages (drafts)

For Josh (044 S11, 2026-11-13: "Sure."). Drafts to paste into each add-on's store page in Steamworks and edit. Every count below was
read on 2026-11-13 from the volume's own catalogue (`~/Documents/LAMBDAWAVES-VOLUMES/dist/vol-N/index.json`) and its folder; nothing
is estimated. How the add-ons are built and wired is [`STEAM.md`](STEAM.md) §8.

## What is in each volume (the facts the drafts use)

| | VOL. I | VOL. II |
|---|---|---|
| molecules | 6,927 | 4,616 |
| solved states (a molecule × a basis set) | 41,039 | 27,555 |
| basis sets | 6: STO-3G, STO-6G, 3-21G, 6-31G, 6-31G*, 6-31+G* | the same 6 |
| molecules with all 6 | 6,484 (363 have 5, 80 have 4) | 4,475 (141 have 5) |
| method | restricted Hartree–Fock (RHF), one closed-shell ground state each | the same |
| largest molecule | 60 heavy atoms (buckminsterfullerene) | 20 heavy atoms |
| most common kinds (a molecule can be several) | aromatic 2,488 · chain 2,152 · heterocycle 2,045 · halogen 1,176 · amine 1,120 · alkene 969 · alcohol 858 · amide 844 · sulfur 842 · acid 807 | aromatic 1,949 · heterocycle 1,943 · amine 1,268 · chain 903 · alkene 881 · alcohol 827 · ether 787 · acid 625 · halogen 543 · amide 528 |
| pictures | one per molecule, and five more looks (phase, imaginary part, balls, sticks, potential map) and a structure diagram | six looks and a structure diagram |
| size on disk | 6.06 GB (6,064,047,914 B, 14,277 files) | 5.85 GB (5,848,312,098 B, 4,948 files) |

The first molecules of VOL. I are the familiar ones (water, ammonia, urea, carbon dioxide, methane, glycine, benzene); VOL. II is ordered
by name and runs to natural products, drugs and flavour molecules. The names, formulas and identifiers come from PubChem; every orbital
was computed for λWAVES (PySCF), then checked by the app's own code before it was packed.

## VOL. I — Common Molecules I

- **Name:** λWAVES — Common Molecules I
- **One line (short description):** 6,927 real molecules for λWAVES, each with its electron orbitals already solved, ready to open, turn and animate.
- **About this content:**

  Common Molecules I (VOL. I on the shelf) adds 6,927 named molecules to λWAVES' library, from water and benzene to buckminsterfullerene. Each one arrives with its
  orbitals already computed, so it opens at once: pick it in LIBRARY › EXPANSIONS or type its name in the search, and it is on the
  stage as a field you can light, slice, colour and play.

  Every molecule was solved up a ladder of six basis sets (STO-3G to 6-31+G*), 41,039 solved states in all, so you can step from the
  crudest picture of a bond to a finer one and watch what changes. Each has its name, formula, the kinds of chemistry it belongs to
  (aromatic, amine, sugar, steroid and thirty-one more), and pictures in six looks plus a structure diagram.

  It is free. It needs λWAVES and 6.1 GB of disk. Nothing is downloaded while you use it and nothing leaves your machine.

## VOL. II — Common Molecules II

- **Name:** λWAVES — Common Molecules II
- **One line (short description):** 4,616 more molecules for λWAVES: natural products, medicines, flavours and fragrances, each with its orbitals solved.
- **About this content:**

  Common Molecules II (VOL. II on the shelf) adds 4,616 more named molecules, none of them in Common Molecules I: amino acids and sugars, alkaloids and terpenes, drugs, flavour and
  fragrance molecules, up to 20 heavy atoms. Like VOL. I, each opens at once from LIBRARY › EXPANSIONS or the search, with its
  orbitals already computed.

  Each was solved on the same ladder of six basis sets (27,555 solved states), and each has its name, formula, kinds, six pictures and
  a structure diagram.

  It is free and does not need Common Molecules I. It needs λWAVES and 5.9 GB of disk.

## The pictures Steam asks for

From Steamworks' "Store Graphical Assets" page (partner.steamgames.com/doc/store/assets/standard, read 2026-11-13). The page lists
these for a store page and says "Most of these are required as part of setting up your game on Steam"; it does not say which a DLC
page needs, and its DLC page (…/doc/store/application/dlc) lists none — so the partner site's own checklist for the add-on is the
authority, and this is the full list to draw from.

| picture | size (that page's numbers) | drawn? |
|---|---|---|
| Header capsule | 920 × 430 px | owed |
| Small capsule | 462 × 174 px | owed |
| Main capsule | 1232 × 706 px | owed |
| Vertical capsule | 748 × 896 px | owed |
| Screenshots | at least 5, 1920 × 1080 minimum, 16:9 | owed (the app can take them: EXPANSIONS' shelf, a page of tiles, three molecules on the stage) |
| Page background (optional) | 1438 × 810 px | owed |

None is made. What exists is each volume's card art in the app (`lab/img/menu/vol/vol-N.{dark,light}.webp` and its film, portrait
9:16, from `tools/volume-heroes.mjs`) and the molecules' own pictures; no tool in the tree composes a capsule (the art cropped to
Steam's shapes with the λWAVES logo and "VOL. I" set on it). They are a design job, not a pipeline run.

## Still yours

- The add-ons' names are yours (2026-11-14): "Common Molecules I" and "Common Molecules II". The app's shelf still calls them VOL. I and VOL. II in large type, with the name beneath; the texts below say VOL. I / VOL. II where they mean the card.
- Whether the page says where the names come from (PubChem) and how the orbitals were computed (PySCF, RHF); the drafts say neither
  in the short text.
- The AI disclosure for each add-on's page: the molecules' pictures are renders by the app, not AI-generated; the data was computed.
