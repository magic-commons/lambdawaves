# D6 BONDS (iteration 014, chain D)

**What.** Josh: "Let the Ball and stick model show double/triple bonds, whether a bond is sigma, or ionic, or different types of attraction,
resonances (like benzene) and other 'sticks' you could think of. Let these be a customizable feature to be in the informational."
INFORMATIONAL › BALL AND STICK gains a BONDS row, four switches in `lambdawaves.q0.info` (all ON by default; BALL AND STICK itself stays OFF,
so a first run and THE LOCK draw nothing new): ORDER (`bondOrder`), AROMATIC (`bondAromatic`), IONIC (`bondIonic`), H-BOND (`bondHydrogen`).
`lab/skeleton.js` `bondsOf(atoms, { rec, charges })` finds them once per molecule (pure, node-importable); `draw` paints them in the words' layer:
- ORDER: 2 / 3 parallel sticks (±3 px; 0 ± 4.5 px). THE ROAD: a record's own `bonds` [[i, j, order]] (1 · 2 · 3, 1.5 aromatic) when it carries
  them — read from the .lwm header (`geometry.bonds` / `meta.bonds`) or the index row (`bonds`), chain C's pack day; **no live file has them
  today**, so every molecule now draws by THE LENGTH RULE: Pyykkö's single/double/triple covalent radii between B C N O Si P S; order k once the
  length is 40 % of the way past order k−1's toward k's; an atom whose neighbours fill its valence keeps single bonds; an atom past it is stepped
  down (CO₂ reads O=C=O, not triple), never in a diatomic (CO keeps its triple).
- AROMATIC: a 5/6-ring of C N O S, ≤ 3 neighbours each (every C exactly 3), every ring bond shorter than single − 0.05 Å (a 5-ring's O, S or
  3-bonded N exempt: furan) — single sticks plus a dashed circle in the ring's own plane (0.6 × its mean radius, projected through the eye).
- IONIC / DATIVE (one switch, IONIC): Mulliken charges of opposite sign ≥ 0.8 e apart when the rung carries them (a volume molecule: the .lwm's
  `mulliken` blob, now put on the landing as `sol.mulliken`), else Pauling Δχ ≥ 2 (≥ 1 to Li Na K Mg Ca); DATIVE = a donor N O P S past its
  valence bound to B, Al, Be or a metal (ammonia borane's B–N) — a dotted stick.
- H-BOND: N/O/F–H···N/O/F, H···A ≤ 2.5 Å, angle at H ≥ 120°, A not the donor's neighbour — dotted, in the accent.
**THE STATUS LINE** (INFORMATIONAL's card status, said when it changes): `BONDS · orders by length (Pyykkö radii; no record bonds) · ionic by
Pauling Δχ` — or `orders from the record`, `ionic by Mulliken charges`.

**Measured** (`bondsOf` over the 64 catalogue molecules): N₂ CO HCN C₂H₂ CH₃CN CN⁻ triple; O₂ NO CO₂ (2×) SO₂ C₂H₄ H₂CO HCOOH urea glycine
butadiene (2×) double; benzene, pyridine and furan one aromatic ring each; LiH LiF NaH NaCl ionic; HF, BF₃ covalent. VOL. I: naphthalene 2
rings, aspirin 1 ring + 2 C=O, caffeine its imidazole, ammonia borane B–N dative; a water dimer one H-bond; a fake record → `road: record`.
Shot: `d-shots/D6-bonds.jpg` (benzene's ring + the card; acetonitrile's C≡N). Status read: the length / Δχ line above.

**Files.** `lab/skeleton.js` (`bondsOf`, the draw), `lab/shell/stage-words.js` (four INFO_ROWS), `lab/informational.js` (the row, `ui.bondsOf`,
`ui.bondSay`), `lab/rack.js` (two arguments: the draw's `bo`, the skeleton's `say`), `lab/chemview.js` (`sol.mulliken`, `sol.bonds`,
`chargesNow` / `bondsNow`), `lab/skin.css` (`.info-bonds` 2 × 2), `lab/sw.js`, `tools/d-shots.mjs` (scene `bonds`, `MOL=<id>`).

**Tests.** `./test.sh node` 41 suites GREEN; `stage-text` GREEN; `history` 45 PASS; `menubar` GREEN; `rack-deps --classes` HOLDS (spectrum 25).

**CLAUDE.md sentence.** BALL AND STICK's BONDS (iteration 014 D6): ORDER · AROMATIC · IONIC · H-BOND, four switches in `lambdawaves.q0.info`,
found by `skeleton.js` `bondsOf` — a record's `bonds` when it has them, else Pyykkö's radii by length; aromatic rings a dashed circle; ionic /
dative and H-bonds dotted (Mulliken from a volume rung, else Δχ) — and INFORMATIONAL's status says which road drew.

**Calls for Josh.** (1) All four default ON once BALL AND STICK is on — say if any should start off. (2) "Sigma": every single stick is σ and
each extra stick a π, so no separate σ mark was drawn — say if you want σ/π coloured. (3) Live molecules carry no Mulliken charges (the worker
would need S); they read ionic by Δχ until a record carries charges or bonds.
