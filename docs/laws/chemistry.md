# Chemistry: MOLECULES, the mode, the worker and the volumes

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 021

ONE MODE (021 R5): a window's mode is `MODE` in `shell/settings.js` (hydrogen | molecules | both); `moleculeMode` iterates it; field decisions read `molSession.selected`; the HYDROGEN button is `#lwMode [data-id="hydrogen"]`.

## The standing paragraphs

The 0.2.0 alpha molecular UI is MOLECULES (`chem`) and MO-REGISTRY
(`orbitals`). Keep those saved IDs, `chem.*` and `reg.*` modulation targets,
and the `mol-*`/`reg-*` CSS hooks stable. The old H₂⁺ `molecule` card was DELETED
in 0.5.0 D9: an older project whose field it owned opens as MOLECULES · H₂ on σg
or σu (the minimal-basis shape of its orbital; RHF cannot hold one electron).
MOLECULES sits on the first-run LEFT rack under INFORMATIONAL and
SPECTRUM (MO-REGISTRY's seat is retired — iteration 008 U, below); since iteration 001 (2026-10-16) EVERY first-run window arrives FOLDED
(`lab/first-run.js` FOLD_ALL), unsolved until MOLECULES is switched on;
a restored project whose field owner is MOLECULES brings it back onto the rack. There are
TWO MODES, HYDROGEN | MOLECULES (`#lwMode` on the CONTROL SURFACE's second row since iteration 014 A1: LIBRARY · MOLECULAR · HYDROGEN, the ids
`molecules` | `hydrogen` since 021 R5, a stored `atoms` read as HYDROGEN): the mode IS MOLECULES ON. ONE MODE (021 R5): every window's mode is the
`MODE` table in `lab/shell/settings.js` beside KIND — `hydrogen` (SPECTRUM, EQUALIZER and the atomic readers and operators: CENTRAL, SEPARABLE,
ATOMS, WIGNER, RADIATION …), `molecules` (the one MOLECULES card) or, absent, both (LATTICE, BLOCH) — and `moleculeMode` (windows/molecules.js)
iterates it: HYDROGEN's windows hide under MOLECULES, the MOLECULES card under HYDROGEN (hidden, never closed or moved); the FINDER greys by the
same table. Field decisions read `molSession.selected`, `chem.on` is the UI's; chemview's `setOn` claims first, then `moleculeMode` (one repaint). Long windows fold their details behind
one chevron (`lab/fold.js`, `.lw-fold`): MOLECULES, SHADOW, CAMERA, MO-REGISTRY. MOLECULES' first row is the SECTION header, which is the library's page turner (0.4.0 S4b; 0.5.3 M8, as Josh drew it): the kit's `stepper` in PALETTE's preset look (‹ NAME ›, a whole line; its name opens the kit's list, its hover carries the section's record line, `__LW.chem.section().sub`), and since iteration 008 V ‹ SECTION › turns, after the six, every readable volume's pages — one per primary tag (‹ VOL. I · AMIDE ›; a one-atom entry on none; read when the hand nears the pickers, never at boot) — and the MOLECULE stepper's name carries the molecule's picture or, off the device, the kit's download glyph whose press keeps THAT molecule with the kit's ring (`volumes.js` `installMolecule`, `statusOf` partial; a pick opens through `openVolume` without keeping); `volumes.js` `watch` tells the card of the Picker's INSTALL / REMOVE (INSTALLED left the card); the MOLECULE picker below is a second stepper whose name IS the `<select>` (optgroups, disabled reasons and native keys kept; ‹ › and ← → walk the page's enabled rows as a hand pick) and holds that one section
(DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY, `lab/molecules.js`
SECTIONS), a pick elsewhere turns the page, and the page is never saved. A
library record ships only through `tools/orbital-library.mjs`'s diversity
gate, and a molecule past the live cap opens only from its record (DOWNLOAD,
never DISABLED). Since iteration 008 U MOLECULES is THE ONE CARD: MOLECULES ON · ORBITAL | STATES (`.mol-top`), the register's ladder right
under it (`.mol-reg`; MO-REGISTRY's `orbitals` seat retired through RETIRED_WINDOWS, its ids and `reg.*` targets kept), then ‹ SECTION ›,
‹ MOLECULE › (a record-only molecule's download glyph in its name), BASIS, VIEW in two rows of three (`.mol-view`: DENSITY · ORBITAL ·
MIX / ESP · SPIN · Δ LDA−RHF; MIX's id is `registry`), METHOD · VALENCE or the ORBITAL dial (one seat, 0.4.0 S4c) and the fold (five lines at 300 px and at
phone width, 0.5.3 M8). MOLECULES ON IS REGISTRY ON: a register has the field under VIEW MIX (the saved id stays `registry`: projects, `lw:view=registry`, the verb, `LW.setView`) and its pane. THE ONE LADDER (iteration 008 R): the ladder carries two marks — the register's lit levels and the ORBITAL dial's CURSOR, a bracket round its row in the theme's ink (a degenerate row bracketed AND lit whole — iteration 009 D, Josh: "when the knob lands on a degenerate pair, light both lines" — while VIEW ORBITAL still draws the one orbital the dial names; a modulator on `chem.orbital` lights the row the same way and never moves the VIEW; the cursor as last painted is `orbitals.state().cursor` ({ k, row, lead }; its lit lines are `row` while it leads — iteration 010 X6), the ladder's own `rowsOf()` grouping (|Δε| < 1e-6) — never a second degeneracy rule), never a saved key (it IS `chem.orbital`); under VIEW ORBITAL the cursor leads and the register's marks step back, under every other VIEW the reverse. THE HAND DECIDES THE VIEW: a stroke → MIX (normalised at its end); a HAND turn of the dial (drag, keys, routed or not) → ORBITAL and the ORBITAL pane; a modulator stepping `chem.orbital` moves the cursor, never the VIEW; an undo, a restore, a project or link open move neither. MOLECULES OFF dims the ladder (`.mol-reg-off`); Δρ is a switch beside KICK; EMPTY ↔ FILL ALL is one button; NORM is gone
MOLECULES keeps KICK / RUN / TDA / the spectra in the `.mol-more` fold: folded
on every first run, desktop too (iteration 001, Josh; `first-run.js` `more: false`), its state in the card's WORKSPACE
record (`more`); its `Aa` stays visible with HELP off. THE CHEM WORKER REFUSES (0.5.4 P6, `lab/worker-pool.js`): once it has answered, an error or a
timeout is `{ error, refused }` ("pick the molecule again"), never re-run on the frame thread; it respawns once, then refuses; only a worker that never
answered (no module Worker, a construction throw) keeps the frame-thread road (`tests/worker-pool.test.mjs`, `worker-refusal`). A solve's `sol.identity`
(`molecule-state.js` `identityOf`, P1) is DATA, never a stamp — `sol.hash` stays the basis hash.

While a molecule owns the field SPECTRUM is HIDDEN with the other ATOMS
windows (`moleculeMode`, iteration 002; THE BEAT EQUALIZER is its own window,
`equalizer`, whose AUDIO IN reads the modulation window's first AUDIO device); EDIT › COPY then
copies the molecule's page (`moleculeLatex`, `lab/latex-state.js`).

THE VOLUMES (iteration 004, `research/iteration-004/PLAN.md`) are the expansion library: VOL. I,
VOL. II … (≈5 GB each), every molecule solved in RHF up THE BASIS LADDER STO-3G · STO-6G ·
3-21G · 6-31G · 6-31G* · 6-31+G* (Cartesian, the BSE decimals vendored verbatim in
`lab/vendor/bse`; BSE has no 6-31+G* past Ar and 6-31G* puts an f shell on Sc–Zn the l ≤ 2
engine refuses, so such a molecule carries five or four rungs), with PubChem's identifiers,
plain-word tags (PLAN.md's vocabulary) and a blurb with its source. THE FORMAT v1: `<VOLUME_BASE>/
volumes.json` THE SHELF → `vol-1/index.json` THE CATALOGUE → `vol-1/m/<id>.lwm` (one molecule,
all its rungs: `'LWM1'` · a JSON header whose each rung is a schema-1 FRONTIER record with every
column and `{ $blob }` placeholders · the f64 ε and f32 C blobs; `lab/volumes-format.js`
`parseLwm · rungs · rungRecord · encodeLwm`, pure and DOM-free, and no clock anywhere in a
volume's bytes). `VOLUME_BASE` is `./volumes/` beside `lab/index.html`; in dev `lab/volumes` is a
git-ignored link to `~/Documents/LAMBDAWAVES-VOLUMES/dist` that no walker follows (pwa, build-deploy,
release-inputs, field-owner, verb-doc, the DATABASE map). The store is `lab/volumes.js` (`shelf ·
index · statusOf · install · remove · file · picture · installMolecule · kept · watch` over Cache Storage `lw-vol-<id>`); the
Picker's LIBRARY installs a volume with one press and its ring; a volume molecule opens through
chemview's `openVolume(volId, molId, basis)` — each rung is `rungRecord` → the worker's
`chem.open`, ZERO solver calls, the live roads (KICK · RUN · TDA · VIBRATE · LDA) standing down
in one sentence; the BASIS seg carries the six rungs in ladder order (a rung the file lacks
disabled with the header's reason; a catalogue molecule's extra rung opens the volume's own
molecule, `WATER · VOL. I`); the molecule on screen is `chem.row()`. PROJECT holds
`instruments.chem.volume = { volume, id, basis, sha256 }` only while a volume molecule is on
screen (a project naming a volume this device lacks keeps the catalogue molecule and says so —
no fetch, no solve); the notebook's `lw:volume=vol-1&id=…[&basis=…]` is a hand verb. THE
PIPELINE (`tools/volumes/`, data in `~/Documents/LAMBDAWAVES-VOLUMES/`, never in git): the
catalogue (`catalogue/build.py` — six collectors, PubChem resolves, the two screens), the solver
(`solve.py`: PySCF 2.14, every AO kept, the rung below's projected density as the guess, resumable,
SIGTERM-safe, a flock queue), the packer (`pack.mjs`: CᵀSC = I, Tr DS = N, dipole and E_nuc
against PySCF, `chem.open` with 0 solver calls, deterministic bytes, `--incremental`), the
pictures. sw.js treats `volumes/`, the four ladder basis files, the Picker's pictures (`img/menu/`)
and the demo covers as DATA, not precache (iteration 005 A: `library.js` `keepData` stores a good
answer on the device after its first fetch; a volume install keeps its basis files beside it, so
an installed volume opens offline at every rung) — the precache sits ≈ 0.7 MiB under its 8 MiB
ceiling (`tests/pwa.test.mjs`). THE SHELF (iteration 005 S, Josh: Google Drive after a donation):
`tools/volumes/themes.json` sends each finished molecule to the first theme it matches (I THE
CLASSICS · II MEDICINE · III LIFE AND FOOD · IV MATERIALS, ATMOSPHERE AND FUEL · THE REST; a theme
past 5 GB continues as "· 2"); `pack.mjs --archive` writes one `LAMBDAWAVES-VOL-<numeral>.lwv`
per volume ('LWV1' · a JSON index · the files; `volumes-format.js` `parseLwv`) that Josh hands out
himself — the shelf entry carries `archive: { name, bytes, sha256 }` and no `index`, and the
Picker's card shows OPEN FILE… (or takes a drop): `volumes.js` `installFile` slices the file per
entry, hashes every file, stores under the fetch road's own cache keys, resumes, and refuses with
a sentence when `navigator.storage.estimate()` says the device cannot hold it. No URL and no
Drive name ever enters `lab/`; `build-deploy --shelf F` ships the small `volumes.json` with the
site (`docs/VOLUMES-HOSTING.md`). The GPU solver (`tools/volumes/long-run-gpu.sh`, gpu4pyscf on
the RTX 3070, 2.24× over this CPU on drug-size rungs, every energy within 1.2e-11 Eh of the CPU's)
shares the CPU solver's flock queue. THE LIBRARY'S METADATA (iteration 014 C; every run DRY, in a scratch tree — the live raw/, catalogue/ and dist/ wait for Josh's word): THE POTENTIAL GRID (C1) — `tools/volumes/esp-pass.py` evaluates φ from a molecule's saved top rung (D from C and occ, PySCF int1e_grids + the nuclear term; no re-solve) on 32³ cell centres of the march box into `raw/<id>/esp.npz`, `pack.mjs` carries it as the rung blob `esp` (f16) and `header.esp`, `volumes-format.js espOf(lwm)` → { n, box, f16, basis, min, max, charges } and `chem.solution().esp`, null before the pass; ISOMERS (C2) — `catalogue/isomers.py` gives each row `isomers` (same formula and charge, another InChIKey first block) and `bonds: [[i, j, order]]` (RDKit; 1.5 aromatic) over its atom order, the index carries `isomers`, the .lwm `header.meta.bonds` (`chem.solution().bonds`), a volume tile with isomers wears `.mm-iso` and opens THE ISOMER DECK (`.mm-isos`), and FLIP (CAMERA, beside LOCK) is the view's parity, `field.js setParity`, a session toggle never saved; THE SHAPE WORDS (C3) — a Haiku pass proposed geometry words (`c-data/tags.proposed.json`), `structure_tags.py` adopts only those RDKit decides (GEO: linear · planar · strained · macrocycle · spiro · bridged · fused · polycyclic · organometallic · zwitterion · chiral) into `row['geo']`, never `tags` (the cap and the themes stay), the index carries `geo`, the Picker's tag strip is three rows over tags ∪ geo; THE CUT (C4) — `pack.mjs --max-gb 5.25 --wip` keeps a shelved molecule in its volume, fills the last volume and opens the next past the cut (never refilling a released one), marks the still-filling last volume `wip: true` (the Picker's card wears WIP and installs it), and versions every index (`indexVersion`).
