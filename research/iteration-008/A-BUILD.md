# A · ATOMS TO RADON — the build note (iteration 008, branch `it008-atoms`, gate 9661 / GD 5661)

Josh asked why the atoms stop at Kr. They stopped there by choice, not because the basis forced it. hydrogen.js' 91 labels hold every
shell through 6p, and Rn (Z = 86) is the last atom whose every occupied shell is one of them. Fr needs 7s, which is row A7.

## What was built

1. **atoms.js is the one source, Z = 1 … 86.** It has the names H … Rn and `groundConfig(Z)`: the Madelung order (n + l, then n) through
   n + l = 8, then one exception move from the NIST ground-state table. The moves are Cr and Cu; Nb, Mo, Ru, Rh, Pd and Ag; La, Ce and Gd;
   Pt and Au; and the actinides 89–103, which only valence.js reads. Other changes in atoms.js:
   - `ZMAX = 86`.
   - Each ATOMS record also carries `core`, the noble-gas shorthand ("[Xe] 4f¹⁴ 5d¹⁰ 6s"), and `exception`.
   - valence.js lost its own copy of the Madelung order and its MOVE table and now reads `groundConfig`.
   - **Z ≤ 36 is bit-identical.** I took a snapshot before the change and one after (`.tmp/atoms-snap.mjs`, not committed). It covers
     every E, every ε and a sha-256 of every u, the GPU radial table, the virtual 6h ε, the configs and the terms. It found 0 differences
     for H–Kr. `valenceOf`/`configOf` agree for all of 1–118 (order-free).
2. **The solve past Kr, measured.** I solved all 50 of Rb … Rn (`.tmp/atoms-sweep.mjs`):
   - Every one converges below the 1e-8 tolerance (worst residual 9.9e-9), with ∫q = Z to 1.7e-13.
   - Every orbital is bound, normalised to 1e-8 and has n − l − 1 nodes. The totals fall monotonically. 33–54 iterations.
   - Solves are lazy and cached as before: an atom is solved when first asked, never at boot.
   - **One 5d atom's solve time:** Au takes 384 ms in a fresh node process, 245 ms warm. In Firefox, `setElement(79)` (the solve plus the
     table) took 321 ms; Rn took 348 ms.
   - The ATOMS window adds the ion and the α = 1 comparison: 526 ms more for Au, 676 ms for Rn. An element press past Kr costs ≈ 0.6–1 s
     on the main thread under the busy mark, against ≈ 0.3 s for Kr.
3. **The grid and the tail at Rn.** The reference is NIST's non-relativistic LDA table (Kotochigova, Levine, Shirley, Stiles & Clark,
   Phys. Rev. A 55, 191 (1997); math.nist.gov/DFTdata/atomdata/tables/86Rn.html). It uses the same α = 2/3 exchange plus VWN correlation.
   - **The grid holds.** M → 2M → 4M moves Rn's 1s ε by 6e-6 Eh and E by 2e-5. r_max 60 → 90 moves the 1s by 1e-5 and the 6p by 1e-5.
   - **Rn 1s:** −3204.7029 Eh here, −3204.756288 in NIST's LDA. That is 0.053 Eh, or 17 ppm.

   | Atom | 1s here vs NIST LDA |
   |---|---|
   | Kr | 33 ppm |
   | Ag | 37 ppm |
   | Xe | 33 ppm |
   | Cs | 63 ppm |
   | Au | 17 ppm |
   | Rn | 17 ppm |

   The gap stays a few tens of ppm from Kr to Rn, so it comes from the model (VWN correlation and the Latter tail), not from the grid.
   - **Rn 6p against measurement:**
     - −ε(6p) = 8.017 eV here, 7.978 in NIST's LDA.
     - The Δ-SCF ionisation is 10.715 eV, against a measured 10.7485 eV (NIST ASD). That agreement is fortuitous: NIST's LDA Δ-SCF is
       11.955.
   - **The relativistic gap at Rn**, in NIST's own tables:
     - The 1s is 394.1 Eh deeper scalar-relativistically (−3598.86 against −3204.76). That is 12 %.
     - Spin–orbit splits the 6p: 6p₃/₂ is 1.02 eV shallower than the non-relativistic 6p (−0.25569 against −0.29318 Eh) and 6p₁/₂ is
       2.56 eV deeper.
     - The Δ-SCF moves by only −0.02 eV.
   - **The 6s contraction**, the caveat named in STATUS, is largest at gold. Scalar relativity deepens Au's −ε(6s) by 1.62 eV and its
     Δ-SCF ionisation by 2.11 eV. Au's Δ-SCF here is 6.70 eV against a measured 9.2255. Relativity accounts for 2.11 eV of that 2.52 eV
     gap. For Ag the scalar-relativistic shift is 0.57 eV, for Cs 0.15 eV.
   - These numbers sit in atoms.js' header, where the past-Kr paragraph cites them.
4. **Relativity is stated in two places.**
   - **STATUS:** lab/status.js has an `atom` owner. For Z > 36 it gives "Rn · NUMERICAL · non-relativistic Xα: the valence levels drift
     from measurement with Z (the 6s contraction)", which is 107 characters (the budget is 110). The head line underneath reads "NUMERICAL ·
     ATOM · Rn · one Xα(2/3) + Latter-tail central field · no mass–velocity, no spin–orbit: the core and the 6s sit too shallow".
     INFORMATIONAL's STATUS row keys on the element. The export caption passes Z too, so a picture of Rn says NUMERICAL. **H–Kr keep no
     line (null), exactly as before.**
   - **ATOMS window:** past Kr, the MODEL readout's sub-line says it is non-relativistic.
5. **The ATOMS window's cells 37–86 are live**, in periods 5 and 6. Each cell's hover gives the name, Z and the core shorthand.
   - The readouts work for all 50. Δ-SCF, −ε, δ_l at α = 2/3 and at α = 1, and the half-width are all finite, and the ion and α = 1 solves
     converge.
   - The quantum defect says why it is missing where it is missing. Pd ([Kr] 4d¹⁰, no 5s) has no valence s or p, so its last s or p is
     core and the readout says that instead of printing δ for the 4p. That rule is never true for Z ≤ 36.
   - The "Aufbau exception" note now reads `exception`.
6. **LOAD VALENCE.** The ATOMS button reads LOAD VALENCE. The verb `fillValence` keeps its name, and its status line now says
   "Au 6s loaded · 1 label, equal and in phase". The helium demo's notebook sentence that named the button was updated too (its precache
   hash was refreshed with `pwa.test.mjs --write`).
7. **SPECTRUM's lines are plain.** `levelLine()` in lab/spectrum.js is the one rule. An empty level is the theme's ink, thin and dark; a
   populated level is its shell's vivid colour, opaque at 2 px. There is no population bar, halo or glow. It is used by both the
   hydrogen/operator ladder and the Sturmian eigen ladder, which now also uses the vivid ink. It is exported so MO-REGISTRY's ladder (row U)
   can draw the same line. The share is still in each line's hover.

Smaller changes:
- SPECTRUM's ELEMENT knob and `HAMILTONIANS.atom.configure` run to ZMAX.
- MOLECULES' ATOMS shelf line said "H–Kr" as a literal. It now reads the last symbol, so it says "86 elements, H–Rn".

## Screenshots (`research/iteration-008/a-build/`)

- `atoms-window-to-rn.png`: the ATOMS window on the card with Au in force. The shell ladder runs 1s … 6s, then the radials, the table H …
  Rn in six rows, and LOAD VALENCE.
- `spectrum-ladder-before.png` / `spectrum-ladder-after.png`: SPECTRUM's ladder on 1s + 2p₀. Before, n1 and n2 carry the translucent
  population bar (the "glow"). After, they are plain lines in full colour, and the empty n3–n6 are dark hairlines.

## Decisions

- **The table is rows of small cells, not columns.** 0.4.0 put the periods as columns on the card, with period 4 wrapping beside them. At
  86 cells that layout is about 25 rows tall, because period 6 alone wraps to 16. Each period is now a row of 25-px cells, eight to a row on
  the 300-px card. That is about the height the 36 had. On a phone, skin.css' touch seat still wins: it comes later and carries the same
  weight, because the compact rule is written under `:where()`.
- **H–Kr STATUS stays empty.** The brief asks for the caveat past Kr and for nothing ≤ 36 to change. A NUMERICAL line for every atom would
  be a one-line change in status.js (drop `Z > 36`) if Josh wants it. It would also add " · NUMERICAL" to the export caption of H–Kr atoms.
- **The population bar is gone from SPECTRUM's ladder** because Josh asked for simple lines. The amount is now only in the hover.
- **The every-atom sweep in tests/atoms.test.mjs stays H–Kr.** Adding the 50 heavy atoms would cost about 12 s a run. Josh's dial said no
  new gates, so the past-Kr sweep is the hand run above. The table law now checks 86 atoms, every configuration summing to Z, and the
  symbols through Ag, Au and Rn.

## What the brief got wrong

- **"THE LOCK's 860 / 1004 values include ATOM states."** They do not. The fixture's states are 1s+2pz, box, chem, chemC6H6, chemLys,
  chemLysHomo, gas, h2, h2plus, h91, helium, momentum, oscillator, quarkonium, rydberg and sturmian. No atom is digested, so THE LOCK cannot
  witness atoms.js. The witness for "nothing ≤ 36 moved" is the bit-identity snapshot in item 1. THE LOCK was still run, because
  hamiltonian.js and spectrum.js are on the boot path (result below).
- **"A non-relativistic Hartree–Fock–Slater reference."** Herman–Skillman (HFS, α = 1) is a printed table I could not verify digit by digit
  here. NIST's non-relativistic LDA is citable to the digit and uses this model's own α = 2/3, so it is the reference. For the record,
  Xα(1) + Latter (the Herman–Skillman model) gives Rn 1s = −3218.945 Eh = −6437.89 Ry here.
- **"SPECTRUM's state grid lines."** The 91-chip grid has no lines. What Josh called "the horizontal lines thing on spectrum" is the level
  ladder at the top of the card (lab/spectrum.js `paintLadder`), the same kind of object as MO-REGISTRY's ladder. That is what was made
  plain. The chips are untouched.
- **lab/hydrogen.js needed nothing.** `frozenChannel` already asks for n ≤ 6 per l, atomState fills all 21 (n, l) rows, and the radial
  record key `(Z·8 + n)·8 + l` stays unique to Z = 86.

## Tests

| Run | Result |
|---|---|
| `./test.sh node` | exit 0. atoms.test 29/29, among them the Δ-SCF Ne 21.09 eV and δ_s(Na) gates as they were; status.test; rack-deps law |
| `node tests/pwa.test.mjs --write` | the precache re-hashed |
| `node tools/rack-deps.mjs --classes` | 0 bare shared lets; the app literal unchanged |
| `LW_PORT=9661 GD_PORT=5661 node tests/molecule-head.browser-test.mjs` | GREEN |
| `LW_PORT=9661 GD_PORT=5661 node tests/start.browser-test.mjs` | GREEN, 3/3 |
| THE LOCK `node tools/perf/digest-lock.mjs --check --query gastab=0` | GREEN, 860 values, 0 differences (67 s); the 1004-value fixture `digest-lock-s4a.json` with `--query gastab=0` also GREEN, 0 differences (65 s) |
| Light check (Firefox, `.tmp/look-atoms.js`) | Fe, Ag, Cs, Au, Rn opened, all readouts filled, STATUS as above for Ag/Cs/Au/Rn and "—" for Fe; LOAD VALENCE on Au put the one 6s label in; no page errors |

## Next

- The integrator renders the Picker's el- pictures 37–86 (`tools/menu-thumbs.mjs --set elements`). picker.js already treats 37–86 as live
  because `ATOMS.find` finds them.
- Row U can import `levelLine` from lab/spectrum.js for MO-REGISTRY's ladder.
- Row A7 (n = 7, Fr …) starts from `groundConfig`, which already fills to 118.
