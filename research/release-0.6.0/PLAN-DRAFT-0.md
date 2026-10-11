# THE ENGINE PLAN · 0.6 → 1.0 · PLAN DRAFT 0 — Fable's pre-draft (Claude Sos / Fable 5.1, 2026-10-11)

**Status: PRE-DRAFT.** Sonnet 5.5 reviews this; DRAFT 1 follows. Every line estimate is UNVERIFIED (nothing built); every row's gate is a number an oracle can
produce; nothing is "novel". The ground is NACRE.md §The ground — two research rounds (Round 1 frozen, Round 2 DRAFT-3), the 0.5.4 contract plan, the four
sweeps, Josh's eleven asks and his standing ambitions, 38 + measurements, and this round's two censuses (`census/SYSTEMS.md`, `census/REPRESENTATIONS.md` —
cells below marked **[census]** are to be confirmed or corrected against them before DRAFT 1).

Josh's ask (00:38): *"an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum
systems/situations."* His constitution (the master goal spec, S:16): *"λWAVES is a real-time mathematical performance instrument for seeing how eigenmodes,
phases, couplings, wave packets, and observers assemble into evolving quantum and quantum-analogue fields."* And S:267: *"λWAVES should feel broad because it
can host many systems, not because it contains a solver zoo with duplicated infrastructure."* This plan is the reconciliation of the three: ONE architecture,
MANY systems, EVERY picture with its oracle.

---

## A · For Josh — what the instrument becomes (one page)

**The idea in one sentence.** λWAVES stays one instrument with one stage, one texel behind the stage and one set of laws — and learns, release by release, to
host a DIVERSE catalogue of quantum systems, each entering through the cheapest of three existing roads, each carrying its own oracle, status word and precision
floor, each with the representations that make its physics visible — so that by 1.0.0 a person can touch the spectrum of a hydrogen atom, a benzene ring, a
breathing water molecule, a disordered lattice, a Rabi-flopping two-level pair or a spreading free packet and discover, in the same glass, why the picture moves.

**The ladder, your A11 as the spine, named (one or two words, no "The"; yours to change):**

| release | name | what you would see, new | what the engine learns |
|---|---|---|---|
| 0.5.3 | Rack Tune | (in flight; resumes on your word) | — |
| 0.5.4 | Contract Layer | the STATUS line that tells the truth about what is on stage | identity as data, oracle + geometry + status in the record, the worker that refuses, the field law test |
| **0.6.0** | **Beat Equalizer** | the hydrogen chord in SPECTRUM, magenta/orange/yellow; turn a beat up or down; the three honest splits; "repeats every 1.094 ps"; the chord sounds | the first NEW KIND behind the texel (√ρ′, signed); the MEANING CHECK; the period guard; nodes stand down honestly |
| 0.6.1 | Factor Road | C₆₀'s density for the first time; VALENCE cheaper for heavy atoms; "symmetry: D₆h (still) · Cs while the RING plays" | the third contraction (orbitals in, density out, no size cap); the symmetry certificate |
| 0.6.2 | Honest Flow | FLOW's arrows conserve charge; AS COMPUTED and BALANCED with their measured numbers; the DEFECT view | the face-flux current; the 9-pattern tabulation in a worker |
| 0.6.3 | Event Census | VORTEX names every event (line · birth · death · saddle); the nodal lines of Y_lm on a sphere | the spacetime classifier; the ÷4/÷8 still-only savings behind a flag |
| 0.6.4 | Hydrogen Song | drop a track; the atom tunes to its tonic with RATE; the caption says the scale | the first STREAMING worker (a fifth, stateful queue); the DRIVEN kind; the flash law |
| 0.6.5 | Electrostatics | the molecule's potential as a second cloud, total and per orbital; water's lone pair as a sign | the first WORKER-BUILT VOLUME (a Poisson card uploaded as a new signed kind) |
| **0.7.0** | **Vibrate** | water and benzene breathe in their true normal modes, "STO-3G RHF harmonic, as computed" | the first NEW RECORD KIND (geometry + modes + D₀/D₁); the LINEAR + McWeeny road |
| 0.7.1 | Open Shells | O₂, NO, H₂⁺; H₂ dissociates | UHF/ROHF beside RHF (a brief names its lines) |
| 0.7.2 | Lattice | a ring or a square lattice, disorder, a flux, the Aubry–André knob; live ≤ 8×8 with flux, ≤ 16×16 without | the first NO-TEXEL system (sites from a worker) |
| 0.7.3 | Kohn–Sham | the same molecules under LDA, beside RHF, each with its PySCF number | a grid, a functional, the RKS oracle; ChronusQ a reference, never source |
| 0.7.4 | Shelves | the library in shelves: periodic table, heavy atoms, small biology, lattices; true orbital names (1a₁, 1b₂) | pickers over the records; no engine lines |
| **0.8.0** | **Laboratory** | the free packet (spreading, moving, coherent, squeezed), Rydberg circular states to n = 30, the 1-D potential lab (box · well · barrier · double well · Morse) in 3-D, two-level Rabi on a Bloch sphere, positronium and muonic hydrogen by one knob | the one deliberate LOCK RE-BAKE (the log-space space swapped for the two dead ones) and the TABULATED road generalised |
| 0.8.1 | Lattice II | Hofstadter's flux, Aharonov–Bohm on a ring, SSH edge states, a quantum walk, a small spin chain | the lattice register's second shelf |
| 0.8.2 | Phase Space | Wigner for the packets and the register; negativity shown; the autocorrelation strip | representations only |
| **0.9.0** | **Certification** | README, CITATION and ABOUT say what is measured, with the metric; the PySCF table; the provenance registry | the GPU-vs-CPU field law on a device; Sol's certificates as gated readouts; the fingerprint |
| 0.9.1 | Platform | the wrappers (desktop, iPad gated on MIR mobile); the standalone's build | zero `lab/` lines |
| **1.0.0** | λWAVES | the standalone; the paper beside it | — |

**What "ultimate engine upgrade" means here, honestly.** Not a rewrite. The tree already has the right shape: f64 truth on the CPU and in workers; THREE
producers writing ONE (re, im) texel; a presenter of 24 copies; records with PySCF oracles. The upgrade is to make that shape EXPLICIT and EXTENSIBLE — a kinds
table the presenter checks (C7), a worker plane with a queue that can stream, a record kind that can carry modes or sites, a tabulated road that can carry any
separable 1-D potential, a precision floor with its metric, a lock statement per row — and then to fill it with systems. The locked road (COMPUTE_WGSL for nine
still states, the tile for three) is never rewritten; new families enter as new producers behind the same texel, which leaves THE LOCK 0/0 by construction
(MAP §7); the lock is re-baked ONCE on the whole ladder (0.8.0), with its reason written and your word. **The line law holds per cut** (≈ 280); the ladder has
≈ 11 cuts between here and 1.0.0; the rows below sum to ≈ 1,350 new lines against ≈ 3,000 of headroom, with named subtractions ≈ −250 and an app-dead bound of
≈ 920 (UNVERIFIED as removable). The tight cuts are 0.6.1 (+225) and 0.7.3 (DFT, ≈ +180): each names its subtraction or waits.

**Three things to know before you answer §F.** (1) The two research rounds' starred defaults are taken (twenty-three decisions) — this plan lists the ones that
bear and you can flip any. (2) The paper's thesis is already visible: *observable-certified reconstruction of interactive quantum wavefields in WebGPU* — every
row's oracle is a line in its table; the catalogue IS the paper's spine. (3) 1.0.0's standalone is a wrapper around the PWA and waits on MIR's mobile upgrade
(your C:5397); nothing in this plan spends `lab/` lines on it.

---

## B · THE THESIS — one instrument, three planes, one contract

### B.1 The three planes (what exists, named)
- **TRUTH (f64; CPU, workers, records).** The hydrogen register (91 closed forms, `hydrogen.js`, `state.js`), the molecule engine (RHF/CDIIS, `rhf-molecule.js`,
  `md.js`, `density.js`), the TD-CIS register and the RT-TDHF drive (`mathworker.js`, `molecular-register.js`), the library records with their PySCF oracles
  (38, `library.json`), the closed-form families (momentum, oscillator, well/gas, tabulated radial — `hamiltonian.js:33,45,62,81,152` kernelSpace {0,1,2,3,6}),
  the ATOMS Xα solver (`atoms.js`), `h2ci.js`, `unitaryOf`/`eigSymQL` (lattices, in tests today). "All meters come from the coefficients" (REPORT.md:153).
- **PICTURE (f32 arithmetic; f16 storage; one texel).** Three compute producers — `COMPUTE_WGSL` (Mode records; seven spaces in one loop), `molWgsl` (the χ tile,
  four tiers), `ORB_WGSL` (one orbital, no tile) — all write `vec4(re, im, 0, 0)`; `RENDER_WGSL` reads `.rg` only, in up to 24 specialised copies; `LINE_WGSL`
  draws the frame. The texel's KINDS today: ψ (1–2), √ρ (0), signed Δρ (3). The f16 floor: worst 2.7–4.3·10⁻⁴ of peak, 4.88·10⁻⁴ the IEEE ceiling, relative L2
  2.0–2.4·10⁻⁴ (Round 2 §5; MAP §9 fact 9) — the law every picture inherits, WITH ITS METRIC.
- **FACE (the glass).** The windows (`lab/windows/`: spectrum, state, molecules, readouts, film, kepler, material, settings-card), the overlays (PARTICLES,
  VORTEX, FLOW, SHADOW, SLICE, atom labels, the stage formula), the readouts and badges, the exports (PNG, film, caption, project, link), the TIMELINE and the
  modulation kit (MIR's; `lab/mir/**` never edited).

### B.2 The three roads a system can take (the data shapes in front of the texel — and the one with no texel)
1. **THE MODE RECORD** (112 B, 4 spare f32; `field.js:25`): a sum of closed forms evaluated in-kernel. Hosts today: hydrogen (position), momentum, oscillator,
   well/gas (with the `gtab` table), tabulated radial (quarkonium, ATOM, sturmian) — nine of the thirteen locked states. Adds on this ladder: the equalizer's six
   accumulators (0.6.0; a new space, locked road untouched), the DRIVEN state's c_a(t) from a worker (0.6.4), SPIN in the spare words (lead), the log-space
   free-packet space (0.8.0; the one re-bake), and — the generalisation this plan proposes — **THE TABULATED ROAD**: the well/gas table and the tabulated-radial
   branch already evaluate a 1-D function from a table; a separable 1-D eigenfunction u_n(x) of ANY tabulated potential (box, finite well, barrier, double well,
   Morse, delta, Kronig–Penney) solved by Numerov on the CPU (`cornell.js` has the solver) rides the same mechanism **[census: confirm how `gtab` and space 6 index
   their tables, and whether a 1-D × transverse-box product fits without a kernel line]**. Oracle: the closed form where one exists (box, Morse, delta), scipy
   `solve_ivp`/`eigh_tridiagonal` elsewhere.
2. **SHELLS + A COEFFICIENT BUFFER** with three contractions: the tile on D (density, four tiers, locked for three states), the direct road on one c (ORBITAL,
   unlocked), the FACTOR road on a C matrix (0.6.1; `molMatBuf` 65,536 B its first limit; C₆₀'s 216,000 B real f32 needs a bigger binding). A BREATHING molecule
   (0.7.0) = moved centres + D(Q), buffer uploads only. A Kohn–Sham molecule (0.7.3) = the same shells, another D. Open shells (0.7.1) = Dα + Dβ, two uploads or
   one summed.
3. **NO TEXEL — lines, sites, bars, spheres, captions from f64 in a worker.** FLOW's arrows, the lattice's site densities (≤ 1,024 f64 a frame), the Bloch
   sphere, the expectation bead, the ESP probe, the readouts. The cheapest road for every system whose physics is not a volume. **A fourth road is NOT proposed:**
   a per-frame GRID upload (a worker's 64³ volume every frame) is reserved for RECORDS and CARDS (the Poisson cloud, 0.6.5: a card built once, not a frame) until
   a profile asks — a 2 MB f16 upload a frame is 120 MB/s and UNVERIFIED on a phone; the free packet, the barrier and the double well take road 1 instead, exactly.

### B.3 THE CONTRACT every new kind carries (0.5.4's contract layer, extended by Round 2 §5, made the law of this plan)
A system or a picture enters the tree with SIX declared things, written in its BRIEF and asserted by a test: **(i) its oracle** (a closed form · PySCF · an
RT-TDHF run · expm · scipy · a re-solve) and the number the gate asks; **(ii) its status word** (EXACT · NUMERICAL · UNCHECKED, 0.5.4's `statusOf()`); **(iii) its
precision floor in the texel WITH ITS METRIC** (or "no texel"); **(iv) its clock convention** (absolute E·rate · ground-relative · the propagator's; MAP §9
fact 3 — one of the three, named); **(v) its LOCK statement** ("outside the lock, gated by X" or "re-bakes with the reason"); **(vi) its MEANING** — the texel
kind/space it produces, from which the presenter derives what stands down (PHASE/Re/Im need ψ; VORTEX and PARTICLES need zeros that mean something; C7 THE
MEANING CHECK, 0.6.0). To these the plan adds, for every BEATING picture, **(vii) its flash declaration** (the on-screen alias of each populated pair, Round 2's
flash law) and, for every readout on the public face, **(viii) its metric and its script** (the honesty layer). Nothing enters without the eight.

### B.4 The worker plane
`worker-pool.js` has four request/reply queues with an 8 s timeout that falls back to the frame thread; 0.5.4 P6 makes the chem worker REFUSE after it has
answered. This plan adds **one stateful STREAM queue** (0.6.4; the song's c_a(t) a frame; failure mode "hold and say so"), and sends every heavy build off-thread:
the ESP card (0.6.5), the lattice eigensolve (0.7.2), the VIBRATE record's build (0.7.0, a `tools/` step for benzene's 41-min FD Hessian), the Kohn–Sham SCF
(0.7.3), the packet tables (0.8.0). THE STUTTER LAW (0.5.4 §E) stands: nothing a row adds runs in the frame loop but an upload the row priced.

### B.5 The precision law, the clock, the lock — stated once
- **Precision:** f64 truth → f32 upload → f32 arithmetic → f16 texel. The texel is a PICTURE; a readout never reads it. A signed kind needs a relative floor
  (2·10⁻⁴ of local ρ). A public number names its metric (the "2e-5" lesson). A GPU-vs-CPU field law test (0.5.4 P7c) becomes the standing gate for every family
  that rides road 1 (its CPU twin exists by construction: the closed form).
- **Clock:** one f64 t; three phase conventions exist; every new system DECLARES which. The hydrogen period is irrational in a.u.; "repeats" is arithmetic with the
  2⁵³ guard (C2). T_MAX declared (0.5.4 P7b).
- **THE LOCK:** 1,004 distinct values on 13 still states, same-machine, in no CI job; the presenter inside it. A new producer behind the texel leaves it 0/0 by
  construction; a new VIEW branch in RENDER_WGSL owes a 0/0 run (UNVERIFIED whether a branch moves the f32 order of the old views — the first such row measures
  it); the ONE re-bake on the ladder is 0.8.0's (the log-space space replaces the dead spaces 4–5 and `Mode.ctr`; a device delta recorded; Josh's word). "THE
  LOCK unchanged" is a precondition, never a gate.

### B.6 The subtraction budget (the line law is per cut; the ladder names its minus signs up front)
MAP §6/§7 and Round 2 §5: `modrive.js` 93 lines at 10.9 % live (−80, spent by 0.6.4), `absorb` at 37 % (its brief names it; 0.7.2), the two dead WGSL spaces +
`Mode.ctr` (≈ −40, the re-bake, 0.8.0), `vortex.js`' reconnection prose after the census (0.6.3), Round 1's stale comments and the retired shim (0.6.0),
`shadow.js` 97 lines at 0.9 % live (**[census: is the RK4 path the lattice's test oracle? if so it moves to `tests/lib/`, −90**), `molecule.js` 83 lines at 4.2 %
(two names used by `h2ci.js`: −75 after a two-line move). The ≈ 920 app-dead bound is a CEILING, not a plan: each minus is taken by the row that needs it, and
measured by `wc` in the BUILD. `lab/sw.js` (593, generated) stays counted until Josh rules (§F-4).

---

## C · THE CATALOGUE — systems × situations × representations (the plan's spine; the paper's table)

**The rule of diversity (Josh N:30: "Don't try to go for too many variations of the same molecule, try to be as diverse as possible").** Every Laboratory cut adds
systems from DIFFERENT families, never variants of one; a family is a row group below. **The rule of entry:** B.3's eight declarations. **The rule of the road:**
the cheapest of B.2's three that holds the physics exactly; a texel kind only for a volume.

Legend — status TODAY: LIVE (a window reaches it) · TEST (code in `tests/lib/` or dead in `lab/`) · GONE (deleted 0.5.0) · ABSENT. Road: M (Mode record, space n) ·
S (shells + coefficients) · W (no texel; worker lines/sites) · R (a record). Lines: S ≤ 30 · M ≤ 100 · L ≤ 250 · XL. **[census]** marks a cell the census confirms.

### C.1 The exact register and its situations (hydrogen; EXACT ANALYTIC)
| system / situation | today | road | oracle | representations (today → added) | release | lines |
|---|---|---|---|---|---|---|
| hydrogen, 91 states n ≤ 6, 31 presets | LIVE, locked (9 states) | M0 | the closed form; 2e-5-class GPU-vs-CPU (test owed, 0.5.4 P7c) | CLOUD/PHASE/Re/Im/Δρ · PARTICLES · VORTEX · SHADOW · SLICE · SPECTRUM grid · REPEATS | — | — |
| hydrogenic ions Z ≤ 36 | LIVE **[census: the Z knob's seat]** | M0 | scaling | the same | — | — |
| STARK · ZEEMAN · custom per-label RATE · PROPAGATOR | LIVE (`state.js:24–33, 87, 153, 186`) | M0 | the closed forms (ZEEMAN diagonal; STARK per (n,m) block) | the same + the REPEATS rescan | — | — |
| **the equalizer** (jitter · comb · pulse · a song's autocorrelation; the three splits; interference only) | ABSENT | M (a new space, six accumulators) | the node test on PSD tables; ρ′ = Σ Γ Ψ_nΨ̄_n′ on 64 voxels to 10⁻⁶ in a CPU twin; the split's static/zero-mean identities | BEAT grid in SPECTRUM · signed volume (√ρ′, sign·√\|ρ′\|) · PURITY · nodes stand down (C1) · the chord sounds (M12) | 0.6.0 | L (R1 +172 with C-rows) |
| the period sentence + the 2⁵³ guard | PARTIAL (`period.js`) | W | the arithmetic; L-6 harness 0/20,000 false | the INFORMATIONAL sentence | 0.6.0 | S (+9) |
| **a song drives the atom** (91-state Strang in a worker, midpoint field, polyphase low-pass) | ABSENT (Yan's and RS0's measurements) | M + STREAM | ⟨1s\|z\|2p₀⟩ = 128√2/243; unitarity 10⁻¹²; the 179.049 Hz resonance; the alias test; ≤ 25 % of a frame in the worker | the DRIVEN kind · the pitch map · the flash declaration · "tune to the tonic" | 0.6.4 | M–L (+90 − 80) |
| **dephasing as a situation** (a jitter table IS a random-clock Lindblad fixed point — Milburn 1991; R1 T2 ii) | ABSENT | (the equalizer) | KNOWN | a caption: "this is what decoherence looks like: the beats fade, the shells stay" | 0.6.0 (a sentence) | S |
| the chord sounds (beats as pitches) | ABSENT **[census: any audio OUTPUT in the tree?]** | W (WebAudio) | the pitch arithmetic | sonification | 0.6.0 M12 | S–M (+20) |
| **mass scaling** — positronium (μ = ½), muonic hydrogen (μ ≈ 186), deuterium | ABSENT | M0 (E ∝ μ, a₀ ∝ 1/μ: one scale beside Z) | the closed form | the same pictures; a caption with the scale | 0.8.0 | S (+10) **[census: where Z scales the kernel; does μ ride it?]** |
| Rydberg circular states to n = 30 (free-packet family) | PARTIAL (f32 fails from n = 16; NaN at 24) | M (the log-space space; the re-bake) | f32 vs mpmath ≤ 10⁻⁶ to n = 30 | the same pictures at large n | 0.8.0 | S (+30 − 40) |
| **Rabi / two-level on the register** (the 1s–2p pair under a resonant drive IS a two-level system) | ABSENT (the drive exists in the molecule register; hydrogen's drive is 0.6.4's) | W (a readout + a sphere) | Rabi's formula Ω = E₀⟨1s\|z\|2p⟩; Landau–Zener's P = e^{−2πδ} on a swept STARK | **the Bloch sphere** (lines; new) · population bars | 0.8.0 | M (+60; the sphere is a representation row shared with spin) |
| Dirac hydrogen / fine structure / spin textures | ABSENT (Yan's `fable0-dirac`: nothing shows at Z = 1) | M (spare words) | Sommerfeld levels; the Z = 36 beat | a texture | lead (0.8.x) | — |
| helium / two-electron (Hylleraas) | GONE (D9; a shim) | — | — | — | not proposed (S:533; its conditional cloud was a one-off) | — |

### C.2 The closed-form families already in the kernel (seven spaces; nine locked states)
| system | today | road | oracle | representations | release | lines |
|---|---|---|---|---|---|---|
| momentum-space hydrogen | LIVE, locked | M1 | the closed form | the same views | — | — |
| the oscillator (QHO) **[census: which states — eigenstates only? coherent? squeezed?]** | LIVE, locked | M2 | the closed form | the same | **coherent · squeezed · cat states** added as PRESETS of the same space if the phases allow (a coherent state is a sum of eigenstates with Poisson weights and e^{−iωt(n+½)} phases — the register's own law) | 0.8.0 | S (+15, presets + a caption) |
| the well / gas / box (3-D box; the `gtab` table) | LIVE, locked | M3 | the closed form | the same | **the 1-D potential lab**: finite well · barrier (a packet reflects and tunnels — the stationary states of box-with-slab, Numerov) · double well (the tunnelling splitting as a beat — the slowest beat the instrument will ever show) · Morse · delta · Kronig–Penney bands | 0.8.0 | M–L (+80 if the TABULATED road holds; XL if a kernel branch is needed **[census]**) |
| quarkonium (Cornell; Numerov) | LIVE, locked | M6 | Numerov vs the tabulated record | the same | — | — |
| ATOMS H–Kr (Xα, the periodic table) | LIVE, locked (ATOM) | M6 | Xα's own; **L1's R_m readout** (Xα tail +6…16 % vs HF — a caption) | the same + R_m sphere | 0.9.0 (a caption) | S |
| the Sturmian | LIVE, locked | M6 | the closed form | the same | — | — |
| **the free packet** (spreading, moving, in a uniform field; Gaussian) | ABSENT | M (the log-space space hosts it; a Gaussian packet's closed form σ(t), x₀ + vt, the chirp) | the closed form (Ehrenfest; σ(t)² = σ₀² + (ħt/2mσ₀)²) | the same views + the expectation bead with its ellipsoid + Wigner | 0.8.0 | M (+60) |
| Landau levels (symmetric gauge = a 2-D oscillator with a magnetic phase) | ABSENT | M2 (the oscillator space + a phase) | the closed form | the same + a circulating PARTICLES | 0.8.x | M **[census: can the oscillator space take an angular phase without a kernel line?]** |
| two particles in 1-D (fermion/boson exchange; a 2-D picture in the 3-D box) | ABSENT | M3 (x₁, x₂ as two axes of the box; the third axis unused) | the closed form (products ± exchanged) | the same views (a 2-D sheet) + "the Pauli hole" caption | 0.8.x | M |
| double slit · quantum walk · BEC/GP · kicked rotor | ABSENT | need a grid propagator or a nonlinear step | — | — | leads (not on the ladder: no road without a 4th data shape) | — |

### C.3 Molecules (RHF; NUMERICAL; the records with PySCF oracles)
| system / situation | today | road | oracle | representations | release | lines |
|---|---|---|---|---|---|---|
| 38 STO-3G records (H₂O … lysine, C₆₀ frontier) · live ≤ 128 AO density, ≤ 768 orbital | LIVE, 3 locked (+HOMO) | S (tile / ORB) | PySCF 38/38 ≤ 7e-9 Eh | DENSITY · ORBITAL · FLOW · VALENCE · Δρ · STATES ladder · MO-REGISTRY · the formula · atom labels | — | — |
| TD-CIS register · RT-TDHF drive · the kick | LIVE | S (D(t) uploads) | RT-TDHF's own; the 9-pattern tabulation | FLOW (AS COMPUTED) · BEAT · SHADOW | — | — |
| **the symmetry certificate** · the mirror half | ABSENT | W (≈ 1 ms per D refresh) | 24 ops of D₆h to 10⁻¹⁴; the RING keeps {E, σ_h} | "symmetry: D₆h (still) · Cs while the RING plays" | 0.6.1 | S–M |
| **C₆₀'s density** (the factor road; 180 columns) · frozen core | PARTIAL (the frontier record carries 8 of 300 columns) | S (C matrix) | ρ_factor = ρ_tile on benzene/lysine; Tr(DS) = N_e; C₆₀'s ms MEASURED, none promised | DENSITY · VALENCE for heavy atoms | 0.6.1 | L (+165) |
| **BALANCED flow** · the DEFECT view · gated readouts | ABSENT | W | the face-flux identities (10⁻⁸ on the RING; 1.75 % / 3.07 % on the Gaussians) | FLOW SOURCE seg · DEFECT · "gated n %" | 0.6.2 | L (+180) |
| H₂'s hidden correlation (two states, one density) | TEST (`h2ci.js`) | W (a caption) | Slater–Condon 4abK = 0.0725 Eh; PySCF FCI 1-RDM | a caption | 0.6.0 (C4) | S (+8) |
| **the potential cloud** (total + per orbital; the probe) | ABSENT (measured: 2 % of PySCF on water's line; 0.7 s a solve) | S → a worker CARD (64³ FFT Poisson + analytic nuclei) uploaded as a NEW signed kind | `int1e_rinv` ≤ 3 % / ≤ 10⁻³ a.u.; the charge to 10⁻² e; the sign map | the second cloud · the equal-share piece · the raw electron cloud · the probe in V | 0.6.5 | L (+140) |
| **vibrations** (normal modes; the LINEAR + McWeeny road) | ABSENT (measured: 0.08 cm⁻¹ of PySCF; relL2 ≤ 10⁻³ at 4·Q_max) | S (a new record kind; buffer uploads a frame) | the re-solve per mode at build; frequencies vs PySCF ≤ 0.1 cm⁻¹ | breathing · the cm⁻¹ readout "STO-3G RHF harmonic, as computed" · the ×N label · "not harmonic here" | 0.7.0 | M–L (+80) |
| **open shells** UHF/ROHF (O₂, NO, H₂⁺; H₂ dissociates — the MAPS road ships dead) | ABSENT | S (Dα, Dβ) | PySCF UHF H₂ at 5 bohr, O₂ triplet, 10⁻⁸ Eh | α/β densities · spin density as a signed kind (Δρ's own view) · the dissociation map | 0.7.1 | brief-named (L–XL) |
| **Kohn–Sham** (LDA first: Slater + VWN; a Becke/Lebedev grid; closed-shell) | ABSENT (ATOMS has Xα — a local functional on a radial mesh) | S (another D) | PySCF RKS LDA ≤ 10⁻⁶ Eh on water/benzene; the grid's ∫ρ = N to 10⁻⁴ | the same pictures with a "RKS LDA" STATUS; RHF ↔ LDA Δρ as the signed view | 0.7.3 | L–XL (≈ +180; a brief names its subtraction or it waits) |
| 6-31+G\* records (0.5.4 P13) · forces · moving nuclei · response | PARTIAL / ABSENT | S | PySCF | — | 0.5.4 / 0.7.x after Pulay terms (R1 §D) | — |
| **shelves**: periodic-table layout, heavy atoms, small biology (amino acids), lattices; the true orbital names (1a₁, 1b₂) | PARTIAL (91 offered, 38 records; HOMO-1 names) | — (pickers; the record's `names`) | the record's irrep labels (`names.js`) | the MOLECULES picker in shelves; the knob reads 1a₁ | 0.7.4 | M (UI; +60) |

### C.4 Lattices and the laboratory's discrete systems (the solver ships; the window does not)
| system | today | road | oracle | representations | release | lines |
|---|---|---|---|---|---|---|
| tight-binding ring/chain · Anderson disorder · Aubry–André · Peierls flux | TEST (`unitaryOf` 2.1e-14 of expm; `eigSymQL` 97 ms at 256 sites, 13.4 s at 1,024) | W (sites from a worker; ≤ 8×8 with flux, ≤ 16×16 without; 32×32 a record) | expm; unitarity; the λ = 2J transition; PPP benzene vs `pyscf.fci` | **the site-density window** (spheres/bars on a lattice) · BEAT/SHADOW reused · IPR readout | 0.7.2 | L (+120 − `absorb`) |
| Hofstadter (a square lattice with flux; the butterfly as a record) · Aharonov–Bohm (a ring with flux; the persistent current) · SSH (edge states) · a discrete quantum walk · a small spin chain (≤ 8 spins live = 256 dims; 10 a record) | ABSENT (the same solver) | W | expm; the known spectra (Hofstadter's q-periodicity; SSH's zero modes; the walk's ballistic σ ∝ t) | the same window + the Bloch sphere per site for spins | 0.8.1 | M (+70 total; presets of one window) |
| Laughlin (N = 3–6; a record of its density) | ABSENT | R (a `tools/` Monte Carlo; a 64³ card) | the plasma analogy's density ν = 1/3 | a card like the potential cloud | lead (0.8.x) | — |
| graphene / Dirac cone (a honeycomb tight-binding band) | ABSENT | W (the lattice window's honeycomb) | the known band E = ±t\|f(k)\| | the band plot (a readout) | 0.8.1 (a preset) | S |

### C.5 Representations (the presenter and the overlays; see `census/REPRESENTATIONS.md` for the full table)
| representation | today | what it needs | release | lines |
|---|---|---|---|---|
| CLOUD · PHASE · Re · Im · Δρ (signed) × cloud/grain/bands/dust | LIVE (24 copies; 120 locked style values) | — | — | — |
| **a signed kind that is not Δρ** (the equalizer's ρ′; the potential Φ; spin density) | ABSENT | ONE new VIEW branch "SIGNED" reused by all three (sign·√\|f\| with the relative floor), a 0/0 run owed — not three branches | 0.6.0 (first use), 0.6.5, 0.7.1 | M (+40 presenter, once) |
| the MEANING CHECK (producer kind ⇄ VIEW) | ABSENT | one assertion where the texel is bound | 0.6.0 (C7) | S (+4) |
| BEAT grid · PURITY · the three splits | ABSENT | SPECTRUM's grid mode | 0.6.0 | (in M2) |
| FLOW: AS COMPUTED · BALANCED · DEFECT | PARTIAL | the seg + the worker tabulation | 0.6.2 | (in M1) |
| VORTEX event names · ANGULAR NODES sphere | PARTIAL | the classifier; a sphere overlay | 0.6.3 | (in M8/M8′) |
| **the second cloud** (Φ) · the probe | ABSENT | the card kind + the SIGNED view + a probe readout | 0.6.5 | (in N2) |
| **the Bloch sphere** (a two-level subspace; a spin site) | ABSENT | a lines overlay from a worker (W) | 0.8.0 | M (+50, shared by Rabi, spin chain) |
| **the expectation bead + uncertainty ellipsoid** ⟨r⟩, Σ | ABSENT | W (f64 from the coefficients; the QHO coherent-state check) | 0.8.0 | S–M (+40) |
| **the site-density window** | ABSENT | W | 0.7.2 | (in N4) |
| Wigner **[census: for which states today?]** · negativity · the autocorrelation / survival strip | PARTIAL | the packets through the existing window; a strip readout | 0.8.2 | M |
| population bars · the energy ladder with populations | PARTIAL (STATES ladder; MO-REGISTRY) **[census]** | — | — | — |
| the chord (sonification) · the Lissajous as INPUT (the reverse problem) | ABSENT | WebAudio output; the equalizer's forward model first | 0.6.0 M12 · 0.6.x lead | S–M |
| STATUS word · symmetry readout · precision readout (the texel floor with its metric) | ABSENT / PARTIAL | 0.5.4's `statusOf()`; M10; N6 | 0.5.4 · 0.6.1 · 0.6.x | S |
| the radial distribution plot · a 1-D line plot of ψ(x) for the potential lab · a kymograph | ABSENT | SLICE's machinery **[census: can SLICE draw a 1-D cut as a line?]** | 0.8.0 | S–M |

---

## D · THE LADDER, release by release — rows · gates · lines · models

Conventions: every row = what Josh sees · the engine · the gate ([T] a test with an oracle; [R] a number the app computes) · Δ lines · the model. Every
release: a fresh verifier for frame-path, worker/storage and release changes (one light check otherwise); THE LOCK ×2 unchanged as PRECONDITION; serialize
11/11; `settings-probe` 0/6; `new-project --check`; `pwa --write` after every `lab/` edit; the ms/s pair vs the previous cut; the line count vs the cap; a local
cut on Josh's word; NO push. Each release gets its own BUILD PLAN by the nacre method before its briefs are written (Round 2 §G's next step) — THIS plan fixes
the rows, the order, the gates and the budget; the build plan fixes the files, the commits and the harness.

### D.0 Preconditions (not this plan's rows): 0.5.3 Rack Tune (resume: M7 + lock-ON, B-DISP merge, M-V, fix round, the cut) · 0.5.4 Contract Layer (its DRAFT-3 awaits Josh; ≈ +106; P1 identity, P3 oracle/status, P4 `statusOf()`, P6 the worker refuses, P7 precision + the field law). The ENGINE PLAN's rows ASSUME P4, P6 and P7 exist; where 0.5.4 is cut without one, the first row that needs it carries it (noted per row).

### D.1 · 0.6.0 Beat Equalizer (the exact register; ≈ +197; subtraction: Round 1's stale comments, the retired shim)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| C7 THE MEANING CHECK (first) | nothing when right; a refusal sentence when a kind and a VIEW disagree | one assertion where the texel is bound; the stand-down list derived from the kinds table | [T] every (kind/space, VIEW) pair in the tree agrees; the equalizer's kind refuses PHASE | +4 · Sonnet |
| C2 THE PERIOD GUARD | REPEATS never prints a false period | `exactFromDifferences` refuses at max v/g ≥ 2⁵³ | [T] 0 false of 20,000; 17,306 two-decimal kept (MEASURED) | +1 · Haiku |
| M2 THE EQUALIZER + M2′ THE SPLIT (R1; C3's re-cut gates) | the BEAT grid in SPECTRUM, magenta/orange/yellow; tables on the six shells; presets (jitters, the comb, pulses, a song's autocorrelation); PLAIN SUM · WITHIN-SHELL · BEATS · INTERFERENCE ONLY; PURITY; the labels gate ("jitter"/"static"/the period) | the new space with six accumulators; the SIGNED view (C.5, once); the eigen test with repair that keeps the diagonal | [T] PSD accept/reject; ρ′ on 64 voxels to 10⁻⁶ (CPU twin); within-shell static 10⁻¹⁵, beats zero-mean 10⁻¹⁶; +4–5 % a frame [R]; THE LOCK 0/0 after the SIGNED branch (the first presenter measurement) | +120 (+40 presenter) · Opus |
| C1 NODES STAND DOWN | VORTEX/PARTICLES grey out under a positive-definite table with λ_min ≥ floor | a flag from the table state | [T] ρ′ ≥ λ_min Σ\|Ψ_n\|² on 2p₀+3d₀+4f₀ | +6 · Sonnet |
| C4 H₂ HIDDEN CORRELATION | the caption on H₂ | `h2ci.js` | [T] the CI pair vs PySCF FCI 1-RDM 10⁻⁹ | +8 · Sonnet |
| M3 THE PERIOD | "repeats exactly every 1.094 ps" | REPEATS rescans the energies in force | [T] T = 14400π; the windings | +8 · Sonnet |
| M12 THE CHORD | the beats sound at their pitches (RATE-scaled); "sounds at … Hz at this RATE" | WebAudio oscillators **[census: output exists?]** | [T] the pitch arithmetic | +20 · Sonnet |
| M11a SONG BANDS → ROUTES | the six shell RATEs as modulation targets; LOW/MID/HIGH drive them | routes | [T] the routes exist; the flash declaration (the alias table) | +12 · Sonnet |
| THE FLASH LAW (Round 2 §F-5) | a labelled RATE when a beat aliases above 3 Hz; `sim-ladder` at RATE 40 | the alias arithmetic from the frame interval | [T] the alias table reproduced; 31 presets checked | +10 · Sonnet |
| the dephasing caption | "the beats fade, the shells stay" under a jitter | a sentence | — | +1 |
| 0.6.0-V | — | — | the verifier: THE LOCK ×2, the SIGNED branch's 0/0, serialize, the ms/s pair, the identities | — |
Sum ≈ +190 (+ the presenter's +40 counted once here) → **≈ +230 of 280.** Tight; M12 waits if the audio output does not exist.

### D.2 · 0.6.1 Factor Road (the molecule engine; ≈ +225; subtraction named in its brief — `molecule.js` −75 is the candidate)
M4 THE FACTOR ROAD (+150, Opus; the C-matrix binding past 65,536 B; C₆₀'s record grows by 180 f64 columns (R1 §F-4 ★), a DOWNLOAD) · M10 THE SYMMETRY CERTIFICATE
(+15, Sonnet, BEFORE M5a) · M6 FROZEN-CORE COLUMNS (+15, Sonnet) · M5a THE MIRROR HALF (+40, Opus; bit-identical digest still and in-plane) · N6's VALENCE bar (+5)
· 0.6.1-V with the device numbers. Gates as Round 1 §D. **≈ +225 − 75 = +150.**

### D.3 · 0.6.2 Honest Flow (≈ +180; subtraction: `vortex.js`' prose waits for 0.6.3 — so this cut names `absorb`'s dead half or runs at +180 inside 280)
M1 CONTINUITY with C5's face-flux current (+155, Opus; PCG tol 10⁻⁴; the zero-RHS guard; c as a test assertion) · M7 GATED + RESIDUAL (+12, Haiku) · M11b THE
DRIVE'S PITCH (+12, Sonnet) · N6's honest readouts beside it (+10, Haiku). Gates: Round 2 C5's four [T]. **≈ +190.**

### D.4 · 0.6.3 Event Census (≈ +140; subtraction: `vortex.js`' reconnection prose)
M8 THE SPACETIME CLASSIFIER (C6's B = [J, F_t]; +40, Opus) · M8′ ANGULAR NODES (+40, Sonnet; L3's nodal-length check as a test assertion) · M5b THE ASYMMETRIC UNIT
(+60, Opus; flag; still only). **≈ +140 − 20.**

### D.5 · 0.6.4 Hydrogen Song (≈ +90 + the STREAM queue; subtraction `modrive.js` −80)
N1 as Round 2 §6 (Opus): the worker Strang step in m-blocks (dt 0.5, midpoint field, 100 steps a frame), the polyphase low-pass, Z eigensolved at load through
`eigSymQL`, the DRIVEN kind through `packModes`, the pitch map, RATE as the tuning peg within the knob, the caption's scale sentence, the flash declaration. **The
STREAM queue** (+25, Opus; stateful like `chem`'s rt.init/rt.run; failure = hold and say so; 0.5.4 P6's `answered` flag reused). Gates: Round 2 N1's [T]/[R] list;
[T] the nine locked states byte-identical with the gate off. **≈ +115 − 80 = +35.**

### D.6 · 0.6.5 Electrostatics (≈ +140; subtraction: a `tools/` record step for benzene-sized molecules keeps the in-app FFT small, or `shadow.js` −90 if the census frees it)
N2 as Round 2 §6 (Opus): `md.js` exports the nuclear-attraction entry (+10); the probe in the worker; the CARD (64³ ρ from the f64 AOs, the analytic core split, the
free-space FFT Poisson, the nuclei added) uploaded as the SIGNED kind (the view exists since 0.6.0); the total first, then per orbital the equal-share piece with the
raw electron cloud beside it (Round 2 §F-3 ★); the ms printed. Gates: Round 2 N2's cloud gates. **≈ +140 (− 90).**

### D.7 · 0.7.0 Vibrate (Molecular Physics opens; ≈ +80)
N3 (Opus): the VIBRATE record kind (geometry, modes, D₀/D₁ per mode in f64; benzene 311 KB), built by a `tools/` step from the tree's own SCF (water live-buildable:
163 SCFs = 0.57 s; benzene 41 min offline); LINEAR + one McWeeny step ≤ 4·Q_max; the amplitude label; "not harmonic here". Gates: Round 2 N3's. **≈ +80.**
Also in 0.7.0: 0.5.4's P13 6-31+G\* records if Josh said yes there.

### D.8 · 0.7.1 Open Shells (brief-named; Opus)
N8: UHF/ROHF beside RHF; the α/β densities and the SPIN DENSITY as the SIGNED kind; the dissociation MAPS road revived; O₂, NO, H₂⁺. Gate: PySCF UHF H₂ at 5 bohr,
O₂ triplet, 10⁻⁸ Eh. The brief names its lines and a subtraction ≥ half of them, or the row waits (Round 2 §F-9 ★).

### D.9 · 0.7.2 Lattice (≈ +120; subtraction `absorb` or the brief's)
N4 (Opus): the site-density window on `unitaryOf` + `eigSymQL` in a worker; ring/chain/square; disorder W; flux Φ; the Aubry–André λ; live ≤ 8×8 with flux, ≤ 16×16
without; 32×32 as records; BEAT/SHADOW reused; the IPR readout; the ms printed. Gates: expm 10⁻¹³; unitarity; λ = 2J; PPP benzene vs `pyscf.fci`.

### D.10 · 0.7.3 Kohn–Sham (≈ +180; a brief names its subtraction or it waits — §F-6)
LDA (Slater exchange + VWN correlation) on a Becke-partitioned Lebedev/Euler–Maclaurin grid, closed-shell, in the chem worker; the same shells, another D; a "RKS LDA"
STATUS; RHF ↔ LDA as the SIGNED view. Gates: [T] PySCF RKS LDA (`xc='lda,vwn'`, the same grid level) ≤ 10⁻⁶ Eh on water and benzene; ∫ρ = N to 10⁻⁴; the SCF's
ms printed. ChronusQ is a REFERENCE (GPL-2 vs GPL-3.0-only — Sol C:5167; R1 §D) and is cited, never merged. PBE and hybrids are NOT on the ladder until LDA ships and
a profile asks (each functional is lines; Libxc is a C library and is not merged either). Josh's A4 word stands ("we should definitely go forward with it") and the
spec's S:2310 ("do not attempt to compete") is honoured by the oracle: the app never claims accuracy it did not measure against PySCF.

### D.11 · 0.7.4 Shelves (≈ +60 UI; Sonnet)
The MOLECULES picker in shelves (periodic table · heavy atoms · small biology · lattices — Josh N:31–34), data-driven from `library.json`'s existing rows; the ORBITAL knob
reads the record's irrep names (1a₁, 1b₂; `names.js`) where the record carries them — Josh N:23–26. No engine lines; no new records in this cut (the bucky-ball's
DENSITY came in 0.6.1).

### D.12 · 0.8.0 Laboratory (the diversity cut; ≈ +255; the ONE re-bake)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| N5 LOG-SPACE + THE RE-BAKE | circular states to n = 30 without NaN | the log-space space replaces spaces 4–5 and `Mode.ctr`; THE LOCK re-baked once, the delta recorded, Josh's word | [T] f32 vs mpmath ≤ 10⁻⁶ to n = 30 | +30 − 40 · Sonnet |
| THE FREE PACKET | a Gaussian packet spreads, moves, falls in a uniform field; the bead and its ellipsoid ride it | the same space's closed form (σ(t), x₀ + vt, the chirp phase) | [T] σ(t)² = σ₀² + (t/2σ₀)²; Ehrenfest ⟨x⟩ to 10⁻¹²; [T] the field law on the device | +60 · Opus |
| THE POTENTIAL LAB (box · finite well · barrier · double well · Morse · delta · Kronig–Penney) | pick a 1-D potential; its eigenstates in the 3-D box; superpose two and watch the double well's tunnelling beat; a packet hits a barrier and splits | the TABULATED road: Numerov on the CPU (the `cornell.js` solver) → u_n(x) tables → the well/gas or tabulated space **[census]** | [T] box/Morse/delta closed forms to 10⁻¹⁰; `eigh_tridiagonal` for the rest; the tunnelling splitting ΔE vs WKB and the exact value | +80 · Opus (XL if a kernel branch is needed → it waits for a brief) |
| COHERENT · SQUEEZED · CAT | the oscillator breathes without changing shape (coherent), breathes in width (squeezed), interferes with itself (cat) | presets of the oscillator space (Poisson weights, the register's phases) | [T] ⟨x⟩(t) = x₀cos ωt to 10⁻¹²; Wigner's negativity for the cat | +15 · Sonnet |
| RABI + THE BLOCH SPHERE | the 1s–2p pair flops under a resonant drive; a vector on a sphere; a STARK sweep shows Landau–Zener | the two-level reduction of the 0.6.4 drive (a readout); the sphere overlay (W) | [T] Ω = E₀⟨1s\|z\|2p₀⟩; P_LZ = e^{−2πδ} to 10⁻³ | +60 · Opus |
| MASS SCALING | positronium · muonic hydrogen · deuterium by one knob; the caption with the scale | μ beside Z in the register's scale | [T] E ∝ μ; the lock 0/0 at μ = 1 | +10 · Sonnet |
| THE EXPECTATION BEAD | ⟨r⟩ and its ellipsoid on every closed-form system | f64 from the coefficients in a worker | [T] the QHO coherent-state check; hydrogen's ⟨r⟩ = (3n² − l(l+1))/2 | +40 · Sonnet |
**≈ +295 − 40 = +255.** The diversity rule: five families (packets · potentials · oscillator states · two-level · mass-scaled atoms), no variant of one.

### D.13 · 0.8.1 Lattice II (≈ +70; presets of the lattice window + the sphere per site)
Hofstadter (the butterfly as a `tools/` record; the live square lattice with flux) · Aharonov–Bohm (the ring's persistent current, a readout) · SSH edge states ·
a discrete quantum walk · a spin chain ≤ 8 spins (Heisenberg; the Bloch sphere per site) · graphene's band (a preset + the band readout). Gates: the known spectra;
expm; the walk's σ ∝ t. Sonnet/Opus by preset.

### D.14 · 0.8.2 Phase Space (≈ +60; representations only)
Wigner for the packets and the register's superpositions (the existing window **[census]**), negativity shown as the signed kind in the window's own plane; the
autocorrelation / survival strip |⟨ψ(0)|ψ(t)⟩|² (the Loschmidt echo of a kicked state); a radial distribution plot; the 1-D line cut for the potential lab.

### D.15 · 0.9.0 Certification (0 `lab/` lines + tests + `tools/`)
N7 THE PUBLIC FACE (the nine rewordings; "2e-5" → the three-metric line; "nothing drifts" → field-free hydrogen; the ChronusQ credit as reference; the PySCF table
added; README:158–159's strobe sentence conditional) · THE FIELD LAW on a device (hydrogen vs the closed form; water vs the f64 oracle) as a standing browser test ·
THE PROVENANCE REGISTRY (every record's source, licence, oracle, script; Sol's A9 ask, 0 `lab/` lines — a `docs/` table and the catalogue's `oracle` columns) · THE
FINGERPRINT (0.5.4 P11) and the lock's scope written · Sol's certificates as GATED readouts where a number exists (the VALENCE bar, the SCF-residual bound) · L1's R_m
caption on ATOMS · the library study (Sol's Experiment 2) only after a profile wins a benchmark (Sol's own rule) — none is merged.

### D.16 · 0.9.1 Platform (0 `lab/` lines; `tools/`)
The PWA is the product; a desktop wrapper (Electron or Tauri, in `tools/platform/`) for STEAM; iPad/iOS gated on MIR's mobile upgrade (Josh C:5397; S:1861 "a later
explicit gate") and on WebGPU in WKWebView (UNVERIFIED on the target OS version); Android after MIR. The fingerprint report per device. Nothing here changes a lab
line or a digest.

### D.17 · 1.0.0 λWAVES + the paper
The standalone(s) from 0.9.1; the paper written FROM the certification table: (1) the exact hydrogen reconstruction and its field law; (2) the symmetry theorems and
the live certificate; (3) the three-velocity anatomy of a finite-basis current with the RT-TDHF comparison, vs Diestler–Manz–Paulus–Pohl 2013/2016 and
Pohl–Hermann–Tremblay 2017; (4) the equalizer theorem and the one-pass kernel; (5) the hydrogen drive (after its prior-art pass — sonification literature UNSEARCHED);
(6) the breathing road's LINEAR + McWeeny certificate; (7) the catalogue's oracle table as the method's evidence. Working title Sol's (C:2360) until the prior-art pass.
The Leiden disclosure; elicitor credit. "Novel" appears nowhere without the pass.

### D.18 The lines table (per cut; every figure UNVERIFIED)
| cut | +new | −named | net | vs ≈ 280 |
|---|---|---|---|---|
| 0.6.0 | 230 | ~10 | 220 | fits |
| 0.6.1 | 225 | 75 | 150 | fits |
| 0.6.2 | 190 | 0 (or `absorb` 35) | 190 | fits |
| 0.6.3 | 140 | 20 | 120 | fits |
| 0.6.4 | 115 | 80 | 35 | fits |
| 0.6.5 | 140 | 0 (or 90) | 140 | fits |
| 0.7.0 | 80 | 0 | 80 | fits |
| 0.7.1 | brief | ≥ half | ≤ 140 | gated |
| 0.7.2 | 120 | 35 | 85 | fits |
| 0.7.3 | 180 | brief | ≤ 180 | gated |
| 0.7.4 | 60 | 0 | 60 | fits |
| 0.8.0 | 295 | 40 | 255 | fits, tight |
| 0.8.1 | 70 | 0 | 70 | fits |
| 0.8.2 | 60 | 0 | 60 | fits |
| 0.9.x · 1.0 | 0 | — | 0 | — |
Sum new ≈ 1,900 incl. the gated two (≈ 1,580 without); named − ≈ 300; across ≈ 14 cuts of ≈ 280 (≈ 3,900 of headroom) — the law is PER CUT, and every cut above fits
or is gated. The app-dead ≈ 920 bound is NOT spent in this table; it is the reserve a tight cut draws on, measured by its BUILD.

---

## E · THE ENGINE UPGRADE PROPER — what changes under the glass (the "ultimate" list, each tied to the row that pays for it)
1. **THE KINDS TABLE + THE MEANING CHECK** (0.6.0 C7): the texel's kinds declared in one place; the presenter's stand-downs derived from it; every producer names its kind.
2. **THE SIGNED VIEW, ONCE** (0.6.0): one presenter branch serves the equalizer's ρ′, the potential Φ and the spin density; its 0/0 lock run is the first presenter
   measurement on the ladder and settles whether a branch moves the old views' f32 order.
3. **THE STREAM QUEUE** (0.6.4): the worker plane learns to stream state a frame and to HOLD; every later streaming row (a breathing molecule's D(Q)? no — that is an
   upload; a driven lattice) reuses it.
4. **THE CARD** (0.6.5): a worker-built volume uploaded once as a kind — the road for every record-shaped picture (Φ, Laughlin, Hofstadter's density).
5. **THE RECORD KINDS** (0.7.0, 0.7.2): the library's law (f64, PySCF oracle, `--check` byte-exact) extended to a VIBRATE record and a LATTICE record; `identityOf`
   (0.5.4 P1) covers them.
6. **THE FACTOR ROAD + THE C-MATRIX BINDING** (0.6.1): the molecule engine past the 128-AO density cap; the binding sized for C₆₀.
7. **THE TABULATED ROAD GENERALISED** (0.8.0): one CPU solver (Numerov) + one table mechanism = a family of 1-D potentials in 3-D, exactly, for ≈ 80 lines **[census]**.
8. **THE ONE RE-BAKE** (0.8.0): the dead spaces and `Mode.ctr` leave; the log-space space enters; the lock's delta recorded once with its reason.
9. **THE CLOCK DECLARED** (every row): each system names its phase convention; T_MAX; the 2⁵³ guard.
10. **THE PRECISION LAW WITH METRICS** (0.5.4 P7 + 0.9.0): the field law on a device; the texel floor stated as three numbers; a public claim never without them.
11. **THE WORKER PLANE'S HONESTY** (0.5.4 P6 → all): a failed job refuses or holds; nothing falls back to the frame thread after the first answer.
12. **THE SUBTRACTION LEDGER** (every cut): the named minus signs of B.6, measured by `wc` in each BUILD; the app-dead bound as the reserve.
What is NOT on the list, with the reason: a WASM/Rust engine (Sol: pays only for batched compute; no profile asks — A8); a kernel registry or compiler (no profile
asks); a WebGPU FFT propagator (the fourth data shape — not until a profile asks; the packets take the closed form); density fitting/THC (0.7.x after the factor road
is measured); the cyclotomic/DISK thread (closed 10-07 by Josh's ruling); the arithmetic wing QWAVE-7 (the spec's "future"); the finite-field engine (S:1674).

---

## F · Josh's decisions (the starred answer stands if you say nothing; the two research rounds' 23 starred defaults are taken unless flipped here)
1. **The plan's unit.** ONE master plan (this), then a BUILD PLAN per release by the same nacre method before its briefs ★ — or briefs straight from this plan.
2. **The order.** Features-first as both rounds ranked it (0.6.0 Beat Equalizer opens; the engine's upgrades ride the rows that need them) ★ — or engine-first
   (0.6.0 = the factor road + the kinds table, the equalizer second).
3. **The lock's one re-bake** at 0.8.0 (log-space in, the dead spaces out), with the delta recorded ★ — or never (Rydberg stays capped at n = 15).
4. **`lab/sw.js` in the count** (593 generated lines): keep counting ★ (the law as written) — or exclude generated files.
5. **Electrostatics' place:** 0.6.5 ★ — or 0.7.0's first row.
6. **Kohn–Sham:** 0.7.3, LDA first, PySCF RKS as the oracle, ChronusQ a cited reference, PBE/hybrids after a profile ★ — or hold DFT until a brief names its lines
   and a subtraction — or drop it from the ladder (your A4 said "definitely go forward"; the spec says "do not compete"; the oracle reconciles them).
7. **The Laboratory's first families** (0.8.0): packets · the 1-D potential lab · oscillator states · Rabi/Bloch · mass scaling ★ — or your own five.
8. **Mass scaling** (positronium, muonic hydrogen) as one knob on the register ★ — or not at all.
9. **The names** in §A's table ★ — yours to change (one or two words, no "The").
10. **The platform road:** PWA + wrappers in `tools/`, iPad gated on MIR mobile, zero `lab/` lines ★ — or a native shell earlier.
11. **The paper's thesis:** observable-certified reconstruction, the catalogue's oracle table as its spine, no "novel" before the prior-art pass ★.
12. **The audio output** (M12 the chord, 0.6.0): build it if the tree has no output (+20) ★ — or wait for MIR to offer one.
13. **The potential lab's road:** the TABULATED road if the census confirms it costs no kernel branch ★ — else it waits for a brief (XL).
14. **For Astra and Sol, through you,** Round 1's three lines + Round 2's two (unchanged) + one: "the catalogue's oracle list (C.1–C.4) is the set of numbers the
    app will certify; if a certificate of yours produces one of them at run time, it becomes a GATED readout in 0.9.0."

---

## G · What is not claimed; what is open
- No line figure is measured; no row is built; every GPU number (a branch's effect on the 120 style values; the upload cost of a card; the song on a phone) is
  UNVERIFIED on a device.
- The TABULATED road's generality (C.2, D.12) is a READING of MAP §2, not yet of the kernel's table code — the census and the Opus audit settle it.
- Kohn–Sham's +180 is an ESTIMATE from the parts (grid ≈ 60, functional ≈ 40, the SCF seam ≈ 50, status/tests ≈ 30); the brief measures it.
- No prior-art pass has been run for the song drive's sonification, the equalizer as a creative mapping, or the breathing road; "novel" is not used.
- The platform's feasibility (WebGPU in WKWebView on the target iPadOS; Tauri/Electron for Steam) is UNVERIFIED.
- Nothing resumes Sol's physical programme; every gate is the app's own oracle.

## H · Josh's words this round, verbatim
> Wow, let's wrap up here. We will continue in this account session so don't worry about Yan but we will definitely compact to get ready for an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations.

> Good morning Claude! Let's continue where we left off

## I · The record of the round (so far)
NACRE.md `86c486c` → two censuses (Sonnet 5.5, read-only) → this PLAN-DRAFT-0 → REVIEW-SONNET-0 → PLAN-DRAFT-1 → AUDIT-OPUS-1 → PLAN-DRAFT-2 → REVIEW-SONNET-2
→ PLAN-DRAFT-3 (Josh) → PLAN.md.

---

## J · The censuses, folded — corrections to the text above (written after the censuses landed; the reviewer reads both)

### J.1 From `census/REPRESENTATIONS.md` (Sonnet 5.5, 2026-10-11 09:36; every item KNOWN by file:line there)
1. **The SIGNED view costs nothing** — C.5's "+40 presenter, once" and D.1's "(+40 presenter)" are WITHDRAWN. A signed quantity in `.r` with the producer saying
   `view: 'real'` rides the molecule's kind-3 road today (field.js:1562; chemview.js:476); the equalizer's ρ′, a per-site density and Φ on a grid all reuse it at
   zero presenter lines and no lock run. Two caveats the rows inherit: (a) view 2's transfer is `w = (v/ampMax)^(2·soft)` (field.js:421–422) — a 1/r tail (Φ)
   fills the box unless EXPOSURE/KNEE/SOFT absorb it, else Φ needs its own transfer = one presenter branch (S, 0/0 owed); (b) hydrogen's COMPUTE_WGSL writes
   only ψ, so the equalizer's signed ρ′ is a NEW SPACE in the hydrogen kernel (Round 1's design; the hydrogen path is locked wholesale, 432 values) — "THE LOCK
   0/0 after the new space" is its precondition AND the ladder's first lock measurement (UNVERIFIED whether a new branch moves the other spaces' f32 order).
   0.6.0's sum falls to ≈ +190.
2. **A new VIEW or STYLE NAME turns `digest-lock --check` RED by key set alone** (digest-lock.mjs:174–175, :264–265 take the union of keys) — the remedy is a
   `tools/` edit teaching `styles()` to skip keys the fixture lacks, as it already does for states (:255–262). Any row that adds a view/style name carries that
   `tools/` line (B.5 amended). The Δρ branch is a bare `else` (field.js:435): a new view id must be placed BEFORE it.
3. **No audio output of ψ exists** (only the kit's clip playback and the microphone analyser). M12 THE CHORD builds an oscillator bank (one partial per populated
   lane, driven on change with `setValueAtTime`, never in the frame loop; the kit's context lifecycle reused): M–L, not S — §F-12's default becomes "build it";
   0.6.0 carries it only if the cut's count allows after M2 is measured, else it moves to 0.6.4 beside the song (which needs the same bank for "tune to the tonic").
4. **No 1-D system exists in the tree** ("every system is 3-D"; no 1-D Hamiltonian in hamiltonian.js). The potential lab (C.2, D.12) is therefore correctly
   framed as 1-D eigenfunctions living in the 3-D box; its line-plot representation is a ray sample (`sampleVoxel`, field.js:1414, or `psiAndGrad` along a line;
   S–M) — a new representation row in 0.8.0, +20.
5. **"MAPS" is not a window or a file.** The "dissociation MAPS road" of C.3/D.8 means `h2ci.js`'s `h2CurveTable` (D6's road; LEGACY-WINDOWS); the row's wording
   is corrected to "the H₂ curve table revived".
6. **Representations the tree already has that §C under-credited:** CALCULUS tiles ⟨z⟩, ⟨p_z⟩, ⟨L_z⟩, ⟨L²⟩, ⟨r⟩, ⟨1/r⟩ with Ehrenfest residuals (calculus.js:78–93);
   METERS' instantaneous AUTOCORR |⟨ψ(0)|ψ(t)⟩| (meters.js:10); the LADDER window (Rydberg revivals on its own register, A(t) with Airy predictions — a
   representation of packets the FIELD cannot draw at n > 6, ladder.js); PLANE (a complex slice, hydrogen only); WIGNER (64×64 signed slice, hydrogenic Z = 1
   only, the 1s negative lobe printed); RADIATION (the pair's A, τ, λ, the polar dP/dΩ); ORBIT (two SO(4) spheres — the Bloch sphere's painter exists);
   SHADOW's and the STATES window's Lissajous (output only). C.5's rows are re-cut accordingly in DRAFT 1.
7. **Cheap gaps the census priced, which the ladder takes:** the Bloch pair on ORBIT's painter (S–M; 0.8.0 Rabi row drops to +40); the expectation BEAD at
   (⟨x⟩,⟨y⟩,⟨z⟩) from `dipoleMatrix` (M; the ellipsoid ⟨r_i r_j⟩ is L and waits — 0.8.0's bead row becomes +30 without the ellipsoid, the ellipsoid a 0.8.2 row);
   current ARROWS and STREAMLINES as draw modes of `createParticles` (M each; a FLOW row in 0.6.2 if its count allows, else 0.8.2); the COHERENCE MAP |c_a c_b*|
   (S–M; 0.8.2); the BEAT TABLE as a static canvas (M; it IS M2's grid mode, no new row); an A(t) trace over one REPEATS period (M; 0.8.2); the SYMMETRY tile
   surfacing `names.js`' character test (S; 0.6.1 M10 reuses it); the TEXEL-FLOOR tile from `fieldDigest` (S; 0.6.x N6); the 1s Wigner negativity is already printed.
8. **Molecular geometry is ABSENT as a picture** (balls, sticks, a dipole arrow; the molecule is a density plus element labels). Josh's "ball and joints" (A2)
   and 0.7.0 VIBRATE (nuclei that move) want it: a KEPLER-style overlay through `toScreen` — M (+60), a new row **0.7.0 N3′ THE SKELETON** (atoms as beads,
   bonds from the geometry, the dipole arrow; off by default under the cloud), Sonnet.
9. **CLAUDE.md's LEGACY paragraph is stale** (all five windows deleted in 0.5.0): a doc fix, 0 `lab/` lines, in 0.6.0's P0-style truth row.
10. **Any new CPU reader must be a `READERS` entry with a `may()` gate** (rack.js:148, :732) or it is not governed — a law for every W-road row (B.2 amended).
11. **Currents: tracers only** — PARTICLES (hydrogen, Bohmian, seeded from |ψ|²) and FLOW (molecules, seeded by |j| — a tracer view, not an equilibrium ensemble);
    the DEFECT view (0.6.2) and any arrows are new draw modes on the same five-member source contract (`{weight, step, speed, lifetime, stride}`).
12. **Momentum space for molecules is ABSENT** (the SPACE seg serves hydrogen only; a molWgsl kind for the Fourier transform of contracted Gaussians is a closed
    form, L) — a 0.8.2 lead, not a row.
