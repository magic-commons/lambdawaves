# THE ENGINE PLAN · 0.6 → 1.0 · PLAN DRAFT 2 (Claude Sos / Fable 5.1, 2026-10-11)

**Status: DRAFT 2** — DRAFT 1 synthesised with Opus 5.5 @ high's audit (`AUDIT-OPUS-1.md`: 61 inline marks, nine sections AO1·1–9, six measurements
`measure/opus1-*`). Every mark is taken; the three the auditor left to Fable are decided below (§F-2 the order, §F-7 the Central Lab's five, 0.8.1 kept as a cut and
renamed). Next: Sonnet 5.5 @ high, the junior (`REVIEW-SONNET-2.md`) → DRAFT 3, the one Josh reads. Every line estimate is UNVERIFIED (nothing built) and is now
carried with the tree's own overrun (additions land at 0.58–2.02× their estimate, mean 1.43; named subtractions at 0.48–0.78× — MEASURED over eight BUILD files,
`opus1-g`); every gate is [T] (a test with an oracle) or [R] (a number the app computes); nothing is "novel".

Josh's ask (00:38): *"an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations."*
The master goal spec (Claude-written for QWAVE-0, 2026-09-02 — read as Josh's constitution, not his typing): S:16 *"λWAVES is a real-time mathematical performance
instrument for seeing how eigenmodes, phases, couplings, wave packets, and observers assemble into evolving quantum and quantum-analogue fields"*; S:267 *"λWAVES should
feel broad because it can host many systems, not because it contains a solver zoo with duplicated infrastructure."*

---

## A · For Josh — what the instrument becomes (one page)

**In one sentence.** λWAVES stays one instrument — one stage, one texel behind the stage, one set of laws — and learns, cut by cut, to host a DIVERSE catalogue of
quantum systems: each enters by the cheapest of four roads the tree has or nearly has, each carries its own oracle, status word and precision floor, each gets the
representations that make its physics visible; every new producer is its own compute pipeline, built on first use and derived from the locked text, so THE LOCK is
never re-baked and a visitor who never opens a feature never pays for it. By 1.0.0 a person touches the spectrum of a hydrogen atom, a benzene ring, a breathing
water molecule, a hydrogen in a hard sphere that ionises as the wall closes in, a disordered or quasi-periodic lattice, a Rabi-flopping pair or a spinning spin-½ and
discovers, in the same glass, why the picture moves.

**Two things already true that you asked for.** "The knob currently reads HOMO-1, HOMO-2 … let it read like 1a1, 1b2" (your N:23–26): MOLECULES › ORBITAL has read
`1b₁ · HOMO`, `3a₁` since 0.4.0 — 52 of 52 live molecules named, eleven point groups (MEASURED `opus1-f-names`). And "repeats every 1.094 ps" is re-derived this round
(lcm(2n², n ≤ 6) = 7200, T = 14400π a.u.).

**The ladder** — Sol's organisation (C:5411–5422, "my proposed organization, not … milestones Claude has already approved"), which your A11 accepted by asking "Can
this be update 0.6.0?"; names one or two words, no "The", yours to change. Fourteen local cuts, each PLANNED at ≤ 200 new lines so that the tree's own 1.4× overrun
lands under ≈ 280. The DOOR column says where you would open each thing.

| cut | name | what you would see, new | door | what the engine learns |
|---|---|---|---|---|
| 0.5.3 | Rack Tune | (in flight; resumes on your word) | — | — |
| 0.5.4 | Contract Layer | the STATUS line that tells the truth about what is on stage | THE HEAD · INFORMATIONAL | identity as data; oracle + geometry + status in the record; the worker that refuses; the field-law test |
| **0.6.0** | **Beat Equalizer** | the hydrogen chord in SPECTRUM, magenta/orange/yellow; turn a beat up or down; PLAIN SUM · WITHIN-SHELL · BEATS · INTERFERENCE ONLY; "repeats every 1.094 ps"; nodes stand down honestly; "this is what decoherence looks like"; METERS shows the texel's own floor | SPECTRUM › BEAT · METERS | THE FIELD OWNER (one predicate for four hand-written stand-downs); the first separate producer — lazy, derived, zero re-bakes; the period guard; the situation-fixture lock; the catalogue's first rows |
| 0.6.1 | Factor Road | C₆₀'s density for the first time — your "maybe a bucky-ball as our next milestone"; VALENCE cheaper for heavy atoms; "symmetry: D₆h (still) · Cs while the RING plays" | MOLECULES › C₆₀ · DENSITY · VALENCE · a SYMMETRY tile | the third contraction (orbitals in, density out, no size cap); the symmetry certificate |
| 0.6.2 | Honest Flow | FLOW's arrows conserve charge; AS COMPUTED and BALANCED with their measured numbers; the DEFECT view; on H₂ "two states share this density; their energies differ by 0.0725 Eh" | MOLECULES › FLOW SOURCE · DEFECT | the face-flux current; the 9-pattern tabulation in a worker |
| 0.6.3 | Event Census | VORTEX names every event (line · birth · death · saddle); the nodal lines of Y_lm on a sphere; the mirror half and the asymmetric unit (still picture, behind a flag); VALENCE through the frozen core | VORTEX · ANGULAR NODES · Settings › STILL SAVINGS | the spacetime classifier; one brief for the symmetry savings at two depths |
| 0.6.4 | Hydrogen Song | drop a track; the atom tunes to its tonic with RATE; the chord SOUNDS (off by default); a film of the song you can share | TIMELINE › a track · SPECTRUM › TUNE · Settings › AUDIO | hydrogen's FIRST drive on the molecular drive's own stepper (one stepper for both); the oscillator bank; the flash law |
| 0.6.5 | Electrostatics | the molecule's potential as a second cloud, total and per orbital; water's lone pair as a sign; a live probe in volts | MOLECULES › VIEW POTENTIAL · PROBE | the CARD road: a worker's volume in a storage buffer drawn by a small lazy pass, so the governor keeps working |
| **0.7.0** | **Vibrate** | water and benzene breathe in their true normal modes; the nuclei as beads and bonds you can see move (your "ball and joints"); a spin-½ on a Bloch sphere; molecules under shaped pulses | MOLECULES › VIBRATE · SKELETON · PULSE · + › SPIN | the first new record kind; the skeleton overlay; the first non-spatial system |
| 0.7.1 | Open Shells | O₂, NO, H₂⁺; the H₂ dissociation curve, RHF vs UHF vs FCI — the picture that explains why UHF exists; the spin density as a signed cloud | MOLECULES › O₂ · CURVE · VIEW SPIN | UHF/ROHF beside RHF (its brief names its lines) |
| 0.7.2 | Lattice | a chain, ring or square lattice, disorder, a flux, the Aubry–André knob, SSH edges, graphene, an Ammann–Beenker patch — as site bars and as a volume with phase as hue | + › LATTICE | the first NO-TEXEL system, and "molecule-as-lattice" (measured: 16×16 sites adopt the field with no SCF) |
| 0.7.3 | Kohn–Sham | the same molecules under LDA beside RHF, each with its PySCF number | MOLECULES › METHOD | a grid, a functional, the RKS oracle; ChronusQ a reference, never source |
| 0.7.4 | Shelves | every system in one picker with its status word; the library in shelves (periodic table · heavy atoms · small biology · lattices) | SPECTRUM › OPERATOR · MOLECULES › SHELF | the catalogue file moves into `lab/` and the picker, the MODEL sheet, the README table and the paper read it |
| **0.8.0** | **Central Lab** | hydrogen in a hard sphere and a screened Coulomb — a knob that pushes states out of the bound spectrum and you watch them leave; a finite well; quarkonium back with its editor; a soft-core well; squeezed and cat oscillator states; a STARK field that ionises | SPECTRUM › OPERATOR › POTENTIAL · OSCILLATOR › SQUEEZE · STATE › STARK (inter-shell) | ATOM's own radial solver without its SCF — one radial solver in the app; the propagator hook opened |
| 0.8.1 | Two Levels | Rabi and Landau–Zener on the Bloch sphere; positronium and muonic hydrogen by one knob; Hofstadter, a quantum walk, a small spin chain | ORBIT › BLOCH · SPECTRUM › MASS · LATTICE presets | — |
| 0.8.2 | Phase Space | Wigner for the oscillator with its negativity; the coherence map; the autocorrelation trace; the expectation bead; ψ along a ray; circular Rydberg to n = 30 if you say so | WIGNER · METERS · CALCULUS | representations; the log-space module (gated) |
| **0.9.0** | **Certification** | README, CITATION and ABOUT say what is measured, with the metric; the provenance registry; the fingerprint | — | the GPU-vs-CPU field law on a device; Sol's certificates as gated readouts |
| 0.9.1 | Platform | the wrappers (desktop; iPad gated on MIR mobile) | — | zero `lab/` lines |
| **1.0.0** | λWAVES | the standalone; the paper beside it | — | — |

**What "ultimate engine upgrade" means here, honestly.** Not a rewrite. The tree has the right shape — f64 truth on the CPU and in workers; three producers writing
one (re, im) texel; a presenter of 24 copies; records with PySCF oracles — and it has, as the audit found, a radial solver (ATOM's) and a drive stepper (the TD-CIS
drive's) that this plan reuses instead of adding a second of each: A8's "a discovery in one could be relevant, perhaps computationally for another", made literal.
The upgrade makes the shape explicit and extensible — ONE FIELD OWNER the overlays and readers ask; producers that compile on first use and derive their shader from
the locked text; a card road; a generic central Hamiltonian; a catalogue file; a precision floor with its metric; a persistence, film and phone line per row — and
fills it with systems. THE LOCK is re-baked ZERO times. The rows sum to ≈ 2,380 planned new lines over fourteen cuts (≈ 3,900 of headroom) with ≈ 350 named
subtraction counted at half; at the tree's overrun every cut below lands under ≈ 280 or is gated on a brief that names its own.

**Four things to know before §F.** (1) Both research rounds' starred defaults are taken (twenty-three decisions); flip any. (2) Two of your eleven asks have no row and
are put to you plainly: the quasicrystal SIEVE and a "third basis" (A3), and cloning the C++ libraries (A9); one standing ask (N:27–29, wave-indexing on Taylor shells)
is a lead. (3) The paper's thesis is visible — *observable-certified reconstruction of interactive quantum wavefields in WebGPU* — and its table is grown PER CUT
from the catalogue file, starting at 0.6.0. (4) Nothing about a phone is known: the tree's only device reports are nine iPad-Safari runs of 0.3.0-alpha; every
device gate below is stated at 64³, the phone's first-run grid, and marked UNVERIFIED until an iPad report is re-run.

---

## B · THE THESIS — one instrument, three planes, four roads, one contract

### B.1 The three planes (what exists, named)
- **TRUTH (f64; CPU, workers, records).** The hydrogen register (91 closed forms, n ≤ 6), five central Hamiltonians (`hamiltonian.js:26, 38, 55, 74, 144`: hydrogen
  + Z, QHO, BOX + the AXIAL gas, quarkonium [button hidden, `windows/spectrum.js:39`], ATOM — whose log-mesh l-channel solver `atoms.js:172` IS a generic central
  solver with an SCF in front), the Sturmian scale, the molecule engine (RHF/CDIIS; 54 live STO-3G, 18 with 6-31+G\*; 38 records with PySCF oracles), the TD-CIS
  register whose DRIVE already holds its state in the worker and is stepped to the clock each frame (`mathworker.js:383–445`, `statesview.js:340–395`), RT-TDHF,
  `h2ci.js`, `unitaryOf`/`eigSymQL`, and the deleted non-central physics that survives in tests (≈ 1,430 lines). "All meters come from the coefficients".
- **PICTURE (f32 arithmetic; f16 storage; one texel).** Three compute producers write `vec4(re, im, 0, 0)`; `RENDER_WGSL` reads `.rg` in 6 views × 8 styles, 24
  specialised copies DERIVED from the one text by anchored substitution (`specRenderWGSL`, `field.js:551–558`) and built lazily (`:914–925`); boot compiles exactly
  8 modules (`:869–880`). Kinds: ψ (1–2), √ρ (0), signed Δρ in f64 (3). The f16 floor: worst 2.7–4.3·10⁻⁴ of peak, 4.88·10⁻⁴ the IEEE ceiling, relative L2
  2.0–2.4·10⁻⁴ — shown nowhere today.
- **FACE.** 22 rack windows + the kit's; four overlay canvases that never read the texel; 83 readout sites; the exports; one aria sentence; no audio output of ψ.
  **Four hand-written places decide who owns the field** (`rack.js:478` overlayDomain on `chem.on`; `rack.js:738–746` hydroReader; `moleculeMode`; `molFieldView`,
  `windows/molecules.js:15–45`) — the engine's missing piece (B.5).

### B.2 The four roads a system can take
1. **M — THE MODE RECORD** (112 B, 4 spare f32): "radial function × Y_lm" closed forms evaluated in-kernel — the kernel's only vocabulary (`field.js:83–84`). On
   this ladder: the equalizer's 6×6 form (a separate, derived, lazy module), the DRIVEN state's c_a(t) from the drive stepper (0.6.4), and — gated — a log-space
   module for circular Rydberg to n = 30 (the register's own road fails at n = 13 on the CPU twin and n ≈ 15 on the GPU; MEASURED `sonnet0-c*`).
   **RC — the CENTRAL-POTENTIAL road** inside M: V(r) → ATOM's solver (`atoms.js:172` solveL: the log mesh, Sturm bisection, inverse iteration; `atoms.js:502` builds
   the 40 × 256 table) → the 21-row radial table (the labels need n ≤ 6: 21 (n, l) pairs of 36 slots) → kernel space 6; no WGSL. ONE generic Hamiltonian first
   (export solveL and the table writer, the solve in the worker, a HAMILTONIANS entry shaped like `cornell`'s, the bound flag = the Sturm count at E = V(∞), one
   worker op — ≈ 54 lines hand-counted, UNVERIFIED until built), after which each potential is 1–3 lines. MEASURED `opus1-b`: 21 Yukawa rows in 32 ms (Numerov
   137–148 ms), hydrogen to 4.4·10⁻⁷, the same bound counts (21/9/5/3/1 at λ = 0.02…0.5), the finite well to 1.4·10⁻³ (a grid point on the step), the confined atom's
   R_c to 1.6·10⁻⁶. `cornell.js`' Numerov stays as the TEST's independent second solver (R_c to 10⁻¹⁰; S:2096 — never the engine's formula as its own oracle).
   Screened wells bind few rows: a shipped preset binds ≥ 10 or it is a preset, not a row.
2. **S — SHELLS + A COEFFICIENT BUFFER** with three contractions (the tile on D; the direct road on one c; the FACTOR road on a C matrix, 0.6.1). Breathing = moved
   centres + D(Q); Kohn–Sham = another D; open shells = Dα + Dβ. **RM — "molecule-as-lattice"**: one narrow s-shell per site, the register as the kind-2 complex
   orbital — MEASURED `opus1-c-rm-session` in node with the real session: 8×8 (tile) and 16×16 (ORB_WGSL) adopt the field and publish a complex orbital with NO SCF;
   17×17 refused ("more than 256 shells"); `MODEL_RANK` is a closed list (+1 line and a rank decision); and a lattice adopted while MOLECULES is off paints UNDER the
   hydrogen overlays — which is why RM needs THE FIELD OWNER first.
3. **W — NO TEXEL:** lines, sites, bars, spheres, captions from f64 in a worker. Law: a new CPU reader is a `READERS` entry with a `may()` gate (rack.js:148, :732).
4. **RU — THE CARD:** a worker-built 64³ f32 volume into a STORAGE BUFFER (1 MB, uploaded once); a ≈ 20-line WGSL pass, built lazily, trilinear-samples it into
   `psiTex` at whatever `res` is current and `atomicMax`es `stats[slot]` like every producer; `setResolution` sets `cardDirty` exactly as it sets `molDirty`
   (`field.js:1052`); the card OWNS the volume through the owner arm in `frame()` (today two arms, `field.js:1318–1328`). ≈ +35, zero frame-thread work, the governor
   free. (`writeTexture` was measured OUT, `opus1-a`: ≈ +33 plus a main-thread re-resample of 0.26–2.1 M taps on every governor notch, or a pinned governor.) Gate [T]
   on a device at 64³ = 64³: a CPU 1s volume through the card road within the resample's own error of `fieldDigest`. First use 0.6.5; then every record-shaped picture
   has a road at a few Hz, gated on the pass's profile. The paper never calls a card "real-time".

### B.3 THE CONTRACT every new kind carries — a TEMPLATE the brief fills, four of which a node test asserts
(i) its oracle and the number — an f64-twin gate (10⁻⁷…10⁻¹²) OR a texel-limited device gate (≈ 5·10⁻⁴), never "10⁻⁶ on the texel"; (ii) its status word (EXACT ·
NUMERICAL · UNCHECKED — 0.5.4's `statusOf()`; until then the header line); (iii) its texel floor with its metric, or "no texel"; (iv) its clock convention (one of
three); (v) its lock statement ("outside the lock, gated by X"; never a re-bake); (vi) its MEANING — the owner and kind it registers (B.5); (vii) its flash
declaration if it beats; (viii) its metric and script for every public number; (ix) **"persists as …"** — scope and key, DEFAULT-ABSENT so serialize bytes and
`new-project --check` do not move; every new PROJECT key enters every undo row (`history.js` reads `serialize({scope: 'edit'})`) and proves it with one history case;
(x) its FILM law — pure · precomputed at export · refused (FLOW's tracers: reseeded, say so); (xi) its PHONE line — the boot block keeps exactly 8 modules (a node
source count, [T]); the frame-ms half [R] "the iPad report re-run, or UNVERIFIED"; (xii) its modulation targets, registered in `mod-port.js`; (xiii) its non-visual
line, and audible output OFF by default, muted under reduced motion. **A node test asserts (i) the oracle test exists, (ii) the status word, (ix) the key is
default-absent, (xi) the boot count — and stops there ("don't over-verify").**

### B.4 The worker plane
Four request/reply queues with an 8 s timeout that falls back to the frame thread; 0.5.4 P6 makes chem REFUSE after it has answered. This plan adds NO queue: the
drive pattern already streams (`chem.drive.{init, run, set}`; `lag` reported). The song is `h.drive.{init, run, set}` on the same shape and the same Strang step
(`driveStep`, `mathworker.js:400–416`) with its two inputs made arguments — MEASURED `opus1-e`: 91 labels, 2.0 ms per 100 steps, unitarity 2·10⁻¹¹ after 8,435
steps; at E₀ = 10⁻² it departs from the RWA formula by 8.8·10⁻³ with dt = 0.5 and 0.1 agreeing, so the gap is physics and the oracle is a dt-halving re-solve.
Every heavy build goes off-thread: the ESP card, the central-potential solve (32 ms for 21 rows), the lattice eigensolve, the VIBRATE build (a `tools/` step for
benzene), Kohn–Sham, the squeeze. The kick on a tabulated H stays main-thread and is priced. THE STUTTER LAW stands.

### B.5 The field owner, the precision law, the clock, the lock
- **THE FIELD OWNER (0.6.0's first engine row).** ONE `owner()` — {id, kind, views, theorems} — read by the four sites of B.1, which it subtracts (−8). Every later
  producer enters as an owner: the equalizer (its nodes stand down), the lattice (otherwise painted under VORTEX/PARTICLES/KEPLER — measured), the card. [T] node:
  a table of (owner × overlay/reader) → may-draw, asserted byte-for-byte against the four old expressions on every state they cover today, before the first new
  owner arrives. It is the frame-path gate every producer rides: Opus, a fresh verifier.
- **Precision:** f64 → f32 → f16 texel; a readout never reads the texel; a signed kind needs a relative floor (2·10⁻⁴ of local ρ); a public number names its metric;
  the field-law test is the standing gate for every M-road family and the card road reproduces it.
- **Clock:** one f64 t; three conventions; every system declares which. T_MAX; the 2⁵³ guard.
- **THE LOCK:** 1,004 values on 13 still states, same-machine, no CI job; the presenter inside it; ZERO situations locked. It hashes TEXEL BYTES, PIXELS and
  `packModes` BYTES — not shader text, not pipeline keys (`digest-lock.mjs:137–190`). **Every new producer is a separate module + pipeline (as `molPipelines`
  coexists with `computePipeline`, `field.js:886–887`), BUILT LAZILY on first dispatch (`createComputePipelineAsync`, a `ready` flag, the base producer covers the
  frames before it lands — the `specEntry` precedent) and DERIVED from the locked text by anchored substitution where the locked text holds the part (the
  equalizer = COMPUTE_WGSL with the space switch pinned to 0 and the accumulate/store replaced by the 6×6 form; a missing anchor throws at build and the brief falls
  back to a copy — UNVERIFIED that the anchors are unique).** So subtract-don't-add and the lock agree, and a visitor who never opens a feature never pays. What is
  NOT by construction: the dispatch arm in `frame()` is the path the locked states take — every cut runs the lock as a PRECONDITION and prices the arm. A new
  VIEW/STYLE NAME turns `--check` red by key set alone — the row carries the `tools/` line that teaches `styles()` to skip fixture-missing keys. The dead spaces 4–5
  and `Mode.ctr` STAY. **Before 0.6.0 touches the dispatch path: the SITUATION-FIXTURE LOCK** — five or six fixtures (STARK, ZEEMAN, a kick, the A/B mix, the drive at
  a fixed t) recorded on the base in `tools/perf/digest-lock.mjs`' state set; `--check` 0/0 per cut; `tools/` only.

### B.6 The subtraction ledger (counted at HALF until a BUILD measures it; the tree delivers 0.48–0.78×)
`modrive.js` −85 after `sin2Pulse` (:86–93) moves (0.6.4) · `shadow.js` → `tests/lib/` −90 (the app imports `SQRT2` only; 0.6.5) · `absorb.js`' ≈ 70 dead lines →
`tests/lib/` (0.7.2, once; `kick`/`fieldFreeTrace`/`kickSpectrum` become PULSES' oracle there) · `vortex.js`' reconnection PROSE (≈ 20 of 95; confirmed prose by the
brief; 0.6.3) · the four stand-downs (−8, 0.6.0) · the QQ̄ button special case (0.7.4) · stale comments + the retired shim (−10, 0.6.0). **NOT taken:** `molecule.js`
(`h2ci.js:51` imports `overlapS`/`EV` from it — not app-dead); the dead WGSL spaces. The ≈ 920 app-dead bound is the reserve, never the plan.

---

## C · THE CATALOGUE — systems × situations × representations (the spine; the paper's table; a data file)

**Rules.** DIVERSITY (Josh N:30): a cut adds systems from different FAMILIES, never variants of one — and in the Central Lab the diversity is the SITUATION (a knob
that pushes states out of the bound spectrum), not the potential. ENTRY: B.3's template. ROAD: the cheapest of B.2's four; a texel only for a volume. **THE FRONT
DOOR (two steps):** the ROWS land in 0.6.0 as `tests/catalogue.json` (0 `lab/` lines; back-filled from SYSTEMS §1's 30 rows; a node test asserts every row's oracle
test exists and pins the count — so the certification table grows PER CUT from the first cut); 0.7.4 moves the file into `lab/catalogue.js` and points SPECTRUM's
operator picker, the MODEL sheet, `tools/catalogue-table.mjs` (the README table) and the paper at it.

Legend — today: LIVE · TEST · GONE · ABSENT. Road: M / RC / S / RM / W / RU. Classes: S ≤ 30 · M ≤ 100 · L ≤ 250 · XL.

### C.1 The exact register and its situations (hydrogen; EXACT ANALYTIC)
| system / situation | today | road | oracle | representations (today → added) | cut |
|---|---|---|---|---|---|
| hydrogen 91 states n ≤ 6, 31 presets; Z = 1…6; ATOM for Z = 7…36 | LIVE, locked (9 states) | M0 | closed forms; the field law | CLOUD/PHASE/Re/Im/Δρ · PARTICLES · VORTEX · SHADOW · PLANE · WIGNER · RADIATION · CALCULUS · SPECTRUM · REPEATS · LADDER (revivals to n̄ = 400 on its own canvas) | — |
| STARK (Z = 1, intra-shell) · ZEEMAN · per-label RATE · PROPAGATOR (Sturmian only) · A/B Rabi mix (a toy, no oracle) · KICK/BOW/DRAG | LIVE | M0 | closed; **A/B Rabi gets its node oracle: Ω = E₀⟨1s\|z\|2p₀⟩ to 5.3·10⁻⁴ at E₀ = 10⁻³, two integrators agreeing (`sonnet0-g`, `opus1-e`)** | the same | 0.6.0 (a `tests/` file) |
| **the equalizer** (jitter · comb · pulse · a song's autocorrelation; three splits; interference only) + **dephasing** (a Gaussian jitter table is a random-clock Lindblad fixed point, Milburn 1991 — the caption says that much and no more) | ABSENT | M (a derived, lazy module; the signed ROOT stored, view 'real' reads it, the owner tags it "signed-root") | PSD accept/reject; ρ′ vs the f64 contraction 10⁻¹² in a node twin (a TEST, 0 `lab/` lines); ≤ 5·10⁻⁴ on the device; within-shell static, beats zero-mean | BEAT grid · signed volume · PURITY · nodes stand down (C1) | 0.6.0 |
| the period sentence + 2⁵³ guard · the flash law | PARTIAL | W | arithmetic; 0/20,000 false (MEASURED) | INFORMATIONAL; labelled RATE | 0.6.0 |
| **a song drives the atom** — hydrogen's FIRST drive, on the TD-CIS drive's stepper | ABSENT | M + the drive ops | ⟨1s\|z\|2p₀⟩ = 128√2/243 (the tree's: 1.4·10⁻¹⁵); unitarity 10⁻¹⁴ a step, ≤ 10⁻¹⁰ a run; the 179.049 Hz resonance; the alias test; a dt-halving re-solve as the oracle at E₀ ≤ 0.01 | DRIVEN kind · pitch map · the chord sounds · film-safe | 0.6.4 |
| **inter-shell STARK** (field ionisation; the Stark map) | ABSENT | M0 through the PROPAGATOR hook (`state.js:106`; H = diag(E) + F·z) | exact diagonalisation (its own); E_n + (3/2)nkF | the same; a STARK sweep; on screen: "the propagator disables RATE/K_z/DEFECT/A⇄B" (`state.js:95`) | 0.8.0 |
| **mass scaling** μ (positronium, muonic H, deuterium) | ABSENT (`radiation.js` already uses μ) | M0 (μ beside Z; ≈ 10) | E = −μ/2n² | the same + the scale caption | 0.8.1 |
| **Rabi + Landau–Zener on the Bloch sphere** | PARTIAL (A/B toy; ORBIT's spheres) | W (ORBIT's painter) + the song drive's two-level reduction; LZ = a chirp on the drive | Rabi ≈ 5·10⁻⁴; LZ: the stepper's dt-halving re-solve, the formula as a caption "in the two-level limit" | the Bloch sphere · population bars | 0.8.1 |
| circular Rydberg to n = 30 | PARTIAL (fails from n = 13/15) | a separate LOG-SPACE module (+40) | an emulated-f32 twin vs mpmath; the device at the f16 floor | the same at large n | 0.8.2 (gated, §F-3); the one-line FACT fix lands as a test-side correction |
| Dirac / fine structure · helium (space 4) · **H₂⁺ 1s-LCAO double well** (its beat 11 % off the exact; a two-site RM lattice shows tunnelling exactly and cheaper) | ABSENT / GONE | — | — | — | leads (§F-8) |

### C.2 The closed-form families and the Central Lab
| system | today | road | oracle | cut |
|---|---|---|---|---|
| momentum-space hydrogen/QHO · QHO eigenstates · **coherent** (a slap IS one, `qho.js:14–19`) · BOX + GAS (the "free packet" = the gas at the largest radius, pre-wall, gated at its capture number) · ATOM · Sturmian | LIVE, locked | M1–M6 | closed; PDG; HF limits | — |
| **squeezed · cat** | ABSENT | `applySqueeze(r, axis)` beside `applyKick`, lost norm reported; a cat = A/B store + a sum | Var(z) = e^{±2r}/2; the Fock series; the cat's Wigner negativity | 0.8.0 |
| **THE CENTRAL LAB** — the generic Hamiltonian + five: **the confined atom** (R_c = j₁,₁²/8 = 1.8352463: 1.6·10⁻⁶ on the shipped solver, 10⁻¹⁰ in the Numerov oracle) · **Yukawa** (λ_c ≈ 1.19 known; "ionise by a knob" both) · **the finite well** (a grid point on the step; 10⁻³) · **quarkonium un-hidden** with its (α_s, σ) editor (already a system — the cheapest diversity on the list) · **the soft-core/anharmonic well** (its oracle: Numerov at 2N). A preset labelled "rotor-like" (a narrow shell; E_l − E_0 = l(l+1)/2I only to O((w/r₀)²)); Gaussian well, delta shell, power laws, radial Morse as presets | ABSENT | RC | as listed; the bound flag per row; ≥ 10 bound rows per shipped preset | 0.8.0 |
| the separable product (cube, 2-D/anisotropic oscillator) | ABSENT | M (a derived module; L) | closed | 0.8.2 (gated) |
| two particles in 1-D · barrier scattering · double slit · GP · Landau/Fock–Darwin · Laughlin · kicked rotor · quantum walk · Lindblad | ABSENT | RU records (after 0.6.5) · W | closed/expm | 0.8.1–0.8.2 candidates gated on the pass's profile; the rest leads |

### C.3 Molecules (NUMERICAL; the records with PySCF oracles)
| system / situation | today | road | oracle | cut |
|---|---|---|---|---|
| 54 live STO-3G · 18 with 6-31+G\* · 38 records · TD-CIS + DRIVE · RT-TDHF δ-kick · FLOW · **the orbital names 1a₁, 1b₂ on the knob and the ladder (LIVE, 52/52)** | LIVE (3 locked) | S | PySCF ≤ 7e-9 Eh | — |
| the symmetry certificate + tile | ABSENT | W | 24 ops to 10⁻¹⁴ (`names.js:142–170`) | 0.6.1 |
| C₆₀'s density (the factor road; 180 f64 columns, a DOWNLOAD whose size the brief states) | PARTIAL (a frontier record) | S (C matrix) | ρ_factor = ρ_tile; Tr(DS) = N_e; the ms at 96³ is the brief's first [R] | 0.6.1 |
| BALANCED flow · DEFECT · gated readouts · **H₂'s hidden correlation** (caption) | ABSENT / TEST | W | the face-flux identities; Slater–Condon; PySCF FCI 1-RDM | 0.6.2 |
| frozen core · the mirror half · the asymmetric unit | ABSENT | S | TiCl₄, KrF₂ to the texel; bit-identical digests still and in-plane | 0.6.3 |
| **the potential cloud** (total + per orbital; the probe — a `READERS` entry) | ABSENT | S → RU card | `int1e_rinv` ≤ 3 % / ≤ 10⁻³ a.u.; charge to 10⁻² e; the sign map; the card-road digest gate at 64³ | 0.6.5 |
| **vibrations** · **the skeleton** (the first row to slip, to 0.7.1, never out) · **PULSES** (`fieldOf` wired to `chem.rt.init`) | ABSENT | S (record kind) · W · S | re-solve per mode; PySCF ≤ 0.1 cm⁻¹; `absorb`'s linear response | 0.7.0 |
| **open shells** UHF/ROHF; the spin density; **the H₂ curve** (RHF vs UHF vs FCI from `h2CurveTable`) | ABSENT (refused by design; `multiplicity` in the schema, unused) | S (Dα + Dβ) · W | PySCF UHF; ⟨S²⟩; PySCF at 0.74/3.00 Å to 10⁻⁸ | 0.7.1 |
| **Kohn–Sham** LDA | ABSENT (ATOMS has Xα) | S | PySCF RKS `lda,vwn` ≤ 10⁻⁶ Eh; ∫ρ = N to 10⁻⁴; the grid's ms on the iPad the brief's first [R] | 0.7.3 |

### C.4 Lattices and discrete systems
| system | today | road | oracle | cut |
|---|---|---|---|---|
| tight-binding chain/ring/square · Anderson · Aubry–André · Peierls/AB · SSH · graphene · Hückel benzene | TEST (`unitaryOf` 2.1e-14; `eigSymQL` 97 ms at 256) | W (bars) + RM (the volume; ≤ 256 sites, measured) | expm; unitarity; λ = 2J; the known bands; PPP vs `pyscf.fci` | 0.7.2 |
| **an Ammann–Beenker PATCH** (≤ 256 vertices — "a patch", never "the quasicrystal") | ABSENT | RM | the patch's own f64 diffraction from its coordinates (8-fold peaks at the silver-ratio positions); the spectrum's bipartite ± symmetry | 0.7.2 |
| Hofstadter (a record) · a quantum walk · a spin chain ≤ 8 | ABSENT | W / RU | the butterfly; σ ∝ t; exact diagonalisation | 0.8.1 |
| **spin-½ Larmor/Rabi** — the first NON-SPATIAL system | ABSENT | W (a two-level register on ORBIT's painter) | Larmor/Rabi closed | 0.7.0 |

### C.5 Representations the ladder takes (from REPRESENTATIONS §4)
signed kinds through view 'real' (0 presenter lines; Φ's 1/r tail absorbed by EXPOSURE/KNEE/SOFT or one transfer branch, S, a lock run) · THE FIELD OWNER (0.6.0) ·
BEAT grid · PURITY · the splits (0.6.0) · the TEXEL-FLOOR tile (0.6.0) · the SYMMETRY tile (0.6.1) · the chord — audio OUT, off by default (0.6.4) · FLOW's DEFECT
(0.6.2); arrows/streamlines as draw modes of `createParticles` (0.8.2) · VORTEX events · the ANGULAR NODES sphere (0.6.3) · the second cloud + probe (0.6.5) · the
skeleton (0.7.0/0.7.1) · the Bloch sphere (0.7.0 spin-½; 0.8.1 Rabi/LZ) · the site-density window + the RM volume (0.7.2) · the catalogue picker + MODEL sheet
(0.7.4) · QHO Wigner with negativity · the coherence map · the A(t) trace · the expectation BEAD · ψ along a ray · the uncertainty ellipsoid (0.8.2) · a non-visual
label per new picture (every cut).

---

## D · THE LADDER, release by release — rows · gates · lines · models

Conventions. Every row = what Josh sees · the engine · the gate ([T]/[R]) · Δ planned · the model; UI/overlay rows are the class that has run 2×. Every cut: THE LOCK
×2 + the SITUATION FIXTURES 0/0 as PRECONDITIONS (same machine — Josh's one line: "run the lock ×2 + the fixtures on this machine"); the verifier RUNS `bash test.sh
node`, `node tools/new-project.mjs --check`, `tools/serialize-bytes.mjs` 11/11, `tools/settings-probe.mjs` 0/6, the boot-module source count (= 8), one
`history.browser-test` case per new PROJECT key, the owning suites, and the ms/s pair against the base profile; `pwa --write` after every `lab/` edit; the line
count vs the cap; a fresh verifier for frame-path, worker/storage and release changes (one light check otherwise); the catalogue test green; `tools/changelog.mjs`
writes the major-feature changelog Josh asked for on 10-09; a local cut on Josh's word; NO push. **Each cut gets its own BUILD PLAN by the nacre method** before its
briefs; this plan fixes rows, order, gates and budgets. **Josh's 0.0.X (A11) — "merged/committed worktrees/Claude sessions that build into it": this plan reads the
0.6.x as FEATURE cuts, each a local tag; if you meant patch = a merge, say so (§F-14).**

### D.0 Before 0.6.0 (0 `lab/` lines)
0.5.3 Rack Tune's resume · 0.5.4 Contract Layer (its DRAFT-3 awaits Josh; rows below assume P4 `statusOf()`, P6 the worker refuses, P7 the field law — the first row
that needs a missing one carries it) · **the SITUATION-FIXTURE LOCK** (`tools/`) · **a `tools/perf` profile of today's base** (A10's "benchmarks first", T_prepare …
T_present, C:4790–4841 — every cut's ms/s pair gets a named baseline) · **CLAUDE.md's LEGACY paragraph** ("QCD, HELIUM, H₂, ATOMS and ELECTROSTATICS are hidden
LEGACY windows" → the deleted five are QCD, H₂⁺, HELIUM, H₂, ELECTROSTATICS, and ATOMS is live again since 0.4.0 S3 — CLAUDE.md is Josh's instruction file: the row
shows him the two-word diff, it does not just land).

### D.1 · 0.6.0 Beat Equalizer (planned +198 − 18 = +180; at 1.4× ≈ 268 — fits)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| **THE FIELD OWNER** (first) | no overlay ever draws a register the field is not showing; a refusal sentence when a kind and a VIEW disagree | ONE `owner()` {id, kind, views, theorems} read by the four sites it replaces; `VIEW_SAY` truthful; the equalizer, the lattice and the card enter as owners | [T] node: (owner × overlay/reader) → may-draw, byte-for-byte the four old answers on every state today | +20 − 8 · Opus, a fresh verifier |
| C2 THE PERIOD GUARD | no false period | refuse at max v/g ≥ 2⁵³ | [T] 0/20,000; 17,306 kept | +1 · Haiku |
| M2 + M2′ THE EQUALIZER + THE SPLIT | the BEAT grid; tables on six shells; presets; PLAIN SUM · WITHIN-SHELL · BEATS · INTERFERENCE ONLY; PURITY; the labels gate | a derived, lazy module (≈ 20 lines of anchored substitution, not ≈ 60 copied) + its JS (pipeline, layout, Γ/shell-index packing, the dispatch arm); the signed ROOT; the CPU twin in `tests/` | [T] PSD; ρ′ vs the twin 10⁻¹²; static/zero-mean identities; [T] device ≤ 5·10⁻⁴; [R] +4–5 % a frame; [T] boot block = 8 modules; PRECONDITION lock + fixtures | +125 · Opus |
| C1 NODES STAND DOWN | VORTEX/PARTICLES grey out under Γ ≻ 0, λ_min ≥ floor | through the owner | [T] ρ′ ≥ λ_min Σ\|Ψ_n\|² | +6 · Sonnet |
| M3 THE PERIOD | "repeats exactly every 1.094 ps" | REPEATS rescans | [T] T = 14400π | +8 · Sonnet |
| M11a SONG BANDS → ROUTES | six shell RATEs as targets (`mod-port.js`) | routes | [T] the routes exist; the flash declaration | +12 · Sonnet |
| THE FLASH LAW | labelled RATE above 3 Hz; `sim-ladder` at 40 | the alias arithmetic (`tools/flash-calibrate.mjs` exists) | [T] the alias table; 31 presets | +10 · Sonnet |
| N6 (part) + THE TEXEL-FLOOR tile | "79.7 % of the polarizability"; METERS shows the f16 floor with its metric | sentences; a `fieldDigest` tile; the A/B Rabi oracle as a `tests/` file | [T] each number's script; Ω to 5·10⁻⁴ | +15 · Haiku/Sonnet |
| the dephasing caption | "the beats fade, the shells stay" | one sentence | — | +1 |
| THE CATALOGUE ROWS | — | `tests/catalogue.json` from SYSTEMS §1 + one node test | [T] every row's oracle test exists; the count pinned | 0 · Haiku |
| 0.6.0-V | — | — | the verifier (D's list); the equalizer's Γ table persists as PROJECT, default-absent, one history case | — |
Persists: the Γ table (PROJECT). Film: pure. Non-visual: "equalizer: <preset>" in the sentence.

### D.2 · 0.6.1 Factor Road (planned +170; ×1.4 ≈ 238 — fits, room for M4)
M4 THE FACTOR ROAD (+150, Opus; the C-matrix binding past 65,536 B; C₆₀'s record grows by 180 f64 columns, a DOWNLOAD whose size the brief states; the ms at 96³
through 180 columns UNVERIFIED — the brief's first [R]) · M10 THE SYMMETRY CERTIFICATE + tile (+15, Sonnet) · N6's VALENCE bar (+5). Gates as Round 1 §D. Persists:
nothing new. Josh's own words on the door: "maybe a bucky-ball as our next milestone (Remember how Benzene was the weird un-accomplish-able goal? We can do this!)".

### D.3 · 0.6.2 Honest Flow (planned +197; ×1.4 ≈ 276 — fits, tight)
M1 CONTINUITY + C5's face-flux current (+155, Opus) · M7 GATED + RESIDUAL (+12, Haiku) · M11b THE DRIVE'S PITCH (+12, Sonnet) · N6 honest readouts (+10) · C4 H₂
HIDDEN CORRELATION (+8, Sonnet). Gates: Round 2 C5's four [T]; PySCF FCI 1-RDM 10⁻⁹. This cut answers A4's "fix FLOW continuity" (C:2180): a picture stops being
false. Film: tracers reseeded, said so.

### D.4 · 0.6.3 Event Census (planned +195 − 20 = +175; ×1.4 ≈ 263 — fits)
M8 THE SPACETIME CLASSIFIER (+40, Opus; Sol's "publication prerequisite", C:5356 — the paper cannot cite VORTEX's count before this) · M8′ ANGULAR NODES (+40,
Sonnet; L3's nodal-length check as a test assertion) · M5a THE MIRROR HALF + M5b THE ASYMMETRIC UNIT (+100, Opus; one brief, two depths; still only, behind a flag)
· M6 FROZEN-CORE COLUMNS (+15, Sonnet). − `vortex.js`' prose (confirmed by the brief). Persists: the STILL SAVINGS flag (PREFERENCE).

### D.5 · 0.6.4 Hydrogen Song (planned +165 − 85 = +80; ×1.4 new ≈ 231; the −85 at half → fits)
N1 (Opus, +75): `driveStep` with `omega` and the eigendecomposed operator as arguments (+4); hydrogen's z over the 91 labels eigensolved once (38.6 ms dense, 1.6 ms the
m = 0 block; +14); `h.drive.{init, run, set}` (+6); the polyphase low-pass; the DRIVEN kind through `packModes`; the pitch map; RATE as the tuning peg; the caption's
scale sentence; the flash declaration · **M12 THE CHORD** (+60, Sonnet; an oscillator bank, one partial per populated lane, `setValueAtTime` on change, the kit's
context lifecycle; OFF by default behind a consent switch; muted under reduced motion; "sounds at … Hz at this RATE") · **FILM-SAFE** (+30; at export the stepper runs
offline — same code, same bytes — and `modesAt(t)` reads the stored c_a(t); [T] byte-equal re-render of two exports). Gates: Round 2 N1's [T]/[R] list with the
dt-halving re-solve as the oracle; [T] node: the nine locked states' `packModes` bytes identical with the drive off. Persists as: the TRACK's hash + RATE + filter
(PROJECT; never the bytes; a link carries neither — "track missing" is the honest default, not an error). − `modrive.js` 85 after `sin2Pulse` moves.

### D.6 · 0.6.5 Electrostatics (planned +175 − 90 = +85; ×1.4 ≈ 245; the −90 at half → fits)
N2 (Opus, +140): `md.js` exports the nuclear-attraction entry (+10); the PROBE in the worker (a `READERS` entry with `may()`); the CARD (64³ ρ from the f64 AOs, the
analytic core split, the free-space FFT Poisson, the nuclei added); the total first, then per orbital the equal-share piece with the raw electron cloud beside it
(Round 2 §F-3 ★); the ms printed · **THE CARD ROAD** (+35: the storage buffer, the ≈ 20-line lazy pass, `cardDirty` on `setResolution`, the owner arm). Gates: Round 2
N2's cloud gates; [T] device at 64³: a CPU 1s volume through the card road within the resample's error of `fieldDigest`. Phone: 1 MB + the module on first use,
UNVERIFIED in ms. Persists: the view only. − `shadow.js` → `tests/lib/` 90.

### D.7 · 0.7.0 Vibrate (planned +185; ×1.4 ≈ 259; the skeleton at 2× → 301, so it slips to 0.7.1 — never out)
N3 VIBRATE (+80, Opus; the record kind; LINEAR + McWeeny ≤ 4·Q_max; the amplitude label; "not harmonic here"; a `tools/` build step) · **N3′ THE SKELETON** (+60,
Sonnet; beads, bonds from the geometry, the dipole arrow; off by default; moves with the modes; Josh's "ball and joints") · **PULSES** (+20; `fieldOf`
step/ramp/wave/gaussian wired to `chem.rt.init`; `absorb`'s linear response the oracle) · **SPIN-½** (+25, Sonnet; a two-level register on ORBIT's painter; Larmor
and Rabi closed forms; the first non-spatial system). Persists: VIBRATE's mode + amplitude (PROJECT); the skeleton on/off (PREFERENCE). Film: VIBRATE pure;
PULSES precomputed.

### D.8 · 0.7.1 Open Shells (brief-named ≤ 140 + the skeleton if slipped; a subtraction ≥ half; Opus)
`uhf` beside `rhf` in `scf.js` with D = Dα + Dβ to the existing tile (no kernel change; `multiplicity` already in the schema); the spin density Dα − Dβ as the signed
kind; O₂, NO, H₂⁺ · **THE H₂ CURVE** (+50, Sonnet; RHF vs UHF vs FCI on dissociation from `h2CurveTable` — the picture that explains why UHF exists). Gates: PySCF
UHF H₂ at 5 bohr, O₂ triplet, 10⁻⁸ Eh; ⟨S²⟩; PySCF at 0.74/3.00 Å to 10⁻⁸.

### D.9 · 0.7.2 Lattice (planned +181 − 70 = +111; ×1.4 ≈ 253 — fits)
N4 (Opus, +120): the site-density window on `unitaryOf` + `eigSymQL` in a worker; chain/ring/square; W; Φ; λ; live ≤ 8×8 with flux, ≤ 16×16 without; records beyond;
the IPR readout; the ms printed; the seed persists (PROJECT) · **RM THE VOLUME** (+31: the lattice as an OWNER; `MODEL_RANK` +1 and a rank decision; one narrow s-shell
per site, kind-2 complex orbital, phase as hue — measured in node; a 256-site orbital re-dispatched a frame is C₆₀'s ORBITALS road, UNVERIFIED in ms) · presets S
each: Anderson, Aubry–André, Peierls/AB, SSH, graphene, Hückel benzene · **THE AMMANN–BEENKER PATCH** (+30; its own diffraction as the oracle). − `absorb.js`' dead
lines → `tests/lib/` 70.

### D.10 · 0.7.3 Kohn–Sham (planned +180; gated on a brief that names its subtraction — §F-6)
LDA (Slater + VWN) on a Becke/Lebedev grid, closed-shell, in the chem worker; "RKS LDA" STATUS; RHF ↔ LDA as the signed view. Gates: [T] PySCF RKS `lda,vwn` ≤ 10⁻⁶
Eh on water and benzene; ∫ρ = N to 10⁻⁴; [R] the grid's ms (the iPad the brief's first number). ChronusQ cited, never merged (GPL-2 vs GPL-3.0-only). The spec says
"do not attempt to compete with Octopus/ChronusQ/RMT" (S:2310); Josh's A4 says "we should definitely go forward with it"; the oracle reconciles them: no accuracy is
claimed that PySCF did not measure, and the paper says "DFT-certified" only for those numbers.

### D.11 · 0.7.4 Shelves (planned +92; UI ×2 ≈ 184 — the lightest cut)
THE CATALOGUE into `lab/` (+40, Sonnet; `lab/catalogue.js` from 0.6.0's rows; the picker, the MODEL sheet, `tools/catalogue-table.mjs`; the QQ̄ special case
subtracted at half) · the MOLECULES picker in shelves (+52; periodic table · heavy atoms · small biology · lattices; data-driven from `library.json`).

### D.12 · 0.8.0 Central Lab (planned +174; ×1.4 ≈ 244 — fits, room for the RC row)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| THE GENERIC CENTRAL HAMILTONIAN + FIVE | pick a potential; its bound states in the same glass; superpose and watch; turn the wall in or the screening up and watch states LEAVE the bound spectrum (the bound count free from the Sturm count); quarkonium back with its editor | ATOM's solver without the SCF (+54); the confined atom · Yukawa · the finite well · quarkonium's editor · the soft-core well (+15); the picker (+15) | [T] R_c to 10⁻⁶ shipped / 10⁻¹⁰ Numerov; Yukawa vs Numerov at 10⁻⁴ (4·10⁻⁵ apart at M = N = 4000 — or tighten both); the well 10⁻³; the soft-core vs Numerov 2N; ≥ 10 bound rows per preset; [R] solve ms in the worker (32 ms for 21 rows here) | +84 · Opus |
| SQUEEZED + CAT | the oscillator breathes in width; interferes with itself | `applySqueeze`; A/B + sum | [T] Var(z) = e^{±2r}/2; lost norm reported | +40 · Sonnet |
| INTER-SHELL STARK | a field that ionises; the Stark map; "the propagator disables RATE/K_z/DEFECT/A⇄B" on screen | the propagator hook | [T] exact diagonalisation; E_n + (3/2)nkF | +50 · Opus |
Persists: potential id + params (PROJECT, like `instruments.qcd`); the squeeze r (PROJECT). The quarkonium's locked texels are safe only because the generic H never
writes while QQ̄ is in force — the owner says so.

### D.13 · 0.8.1 Two Levels (planned +130; ×1.4 ≈ 182)
RABI + LANDAU–ZENER on the Bloch sphere (+50, Opus; the song drive's two-level reduction; the chirp; the dt-halving re-solve as the gate, the formula as a caption) ·
MASS SCALING (+10) · Hofstadter record, quantum walk, spin chain ≤ 8 as presets (+20) · the first RU records if the pass's profile allows (+50; barrier scattering or
two particles in 1-D). Josh's 0.0.X-sized cut; foldable into 0.8.2 if its gated rows stay gated.

### D.14 · 0.8.2 Phase Space (planned +200; at the cap — the ellipsoid waits)
QHO Wigner with negativity (+40) · the coherence map (+30) · the A(t) trace over one REPEATS period (+30) · THE BEAD + ψ along a ray (+50) · the uncertainty ellipsoid
(+50 — the row that waits) · gated on briefs: the LOG-SPACE module (§F-3), the SEPARABLE module, FLOW arrows/streamlines, further RU records, helium (§F-8).

### D.15 · 0.9.0 Certification (0 `lab/` lines + tests + `tools/`) · D.16 · 0.9.1 Platform · D.17 · 1.0.0 + the paper
As DRAFT 1: N7 THE PUBLIC FACE · the field law on a device · the provenance registry (A9's archive on Josh's word) · the fingerprint · Sol's certificates as gated
readouts · L1's R_m caption · wrappers in `tools/platform/`, iPad gated on MIR mobile · the paper's seven sections written FROM the certification table each cut grew.
**What the paper cannot say:** "real-time" for a card or a record; "Lindblad" beyond the random-clock case; any RC accuracy as the texel's (it is the solver's);
"H₂⁺" without "1s-LCAO" if it returns; "the quasicrystal" for a 256-vertex patch; "DFT-certified" beyond 0.7.3's PySCF numbers; VORTEX's event count before 0.6.3;
"novel" anywhere.

### D.18 The lines table — planned new · named − (at half) · net · RISK (new × 1.4; UI × 2) · vs ≈ 280
| cut | new | − named | net | risk | vs 280 |
|---|---|---|---|---|---|
| 0.6.0 | 198 | 18 | 180 | 268 | fits |
| 0.6.1 | 170 | 0 | 170 | 238 | fits |
| 0.6.2 | 197 | 0 | 197 | 276 | fits, tight |
| 0.6.3 | 195 | 20 | 175 | 263 | fits |
| 0.6.4 | 165 | 85 | 80 | 189 | fits |
| 0.6.5 | 175 | 90 | 85 | 200 | fits |
| 0.7.0 | 185 | 0 | 185 | 259 (301 with the skeleton at 2× → it slips) | fits |
| 0.7.1 | ≤ 140 (+60) | ≥ 70 | ≤ 130 | ≤ 249 | gated |
| 0.7.2 | 181 | 70 | 111 | 218 | fits |
| 0.7.3 | 180 | brief | ≤ 180 | 252 | gated |
| 0.7.4 | 92 | (QQ̄) | 92 | 184 | fits |
| 0.8.0 | 174 | 0 | 174 | 244 | fits |
| 0.8.1 | 130 | 0 | 130 | 182 | fits |
| 0.8.2 | 200 | 0 | 200 | 280 | at the cap |
| Σ | ≈ 2,382 | ≈ 353 (≈ 177 at half) | ≈ 2,029 | | no cut needs the reserve |

---

## E · THE ENGINE UPGRADE PROPER — under the glass, tied to the row that pays
1. **THE FIELD OWNER** (0.6.0) — one predicate; the prerequisite for RM, RU and every later producer. 2. **SEPARATE PRODUCERS, LAZY AND DERIVED** (0.6.0 first) —
zero re-bakes, zero boot cost, no duplicated text. 3. **THE SITUATION-FIXTURE LOCK** (before 0.6.0). 4. **ONE DRIVE STEPPER** (0.6.4) — `driveStep` generalised; the
TD-CIS drive and the song on the same code. 5. **THE OSCILLATOR BANK** (0.6.4). 6. **THE CARD ROAD** (0.6.5) — a lazy pass over a storage buffer. 7. **THE RECORD
KINDS** (0.7.0, 0.7.2). 8. **THE FACTOR ROAD + THE C-MATRIX BINDING** (0.6.1). 9. **THE SKELETON OVERLAY** (0.7.0/0.7.1). 10. **MOLECULE-AS-LATTICE** (0.7.2).
11. **THE CATALOGUE** (rows 0.6.0; the file 0.7.4). 12. **ONE RADIAL SOLVER** (0.8.0) — ATOM's, without the SCF; Numerov the test's second opinion. 13. **THE
PROPAGATOR HOOK OPENED** (0.8.0). 14. **THE CLOCK DECLARED**; 15. **THE PRECISION LAW WITH METRICS**; 16. **THE WORKER PLANE'S HONESTY**; 17. **PERSISTENCE, FILM,
PHONE, MODULATION, NON-VISUAL per row**; 18. **THE SUBTRACTION LEDGER at half**.
**NOT on the list, with the reason:** WASM/Rust (no profile asks — A8); a kernel registry or compiler (same); a WebGPU FFT propagator (RU records first); density
fitting/THC (after the factor road is measured); the cyclotomic/DISK thread (closed 10-07); QWAVE-7's arithmetic wing; the finite-field engine; **A3's sieve and
"third basis"** (INTERFERENCE ONLY is the exact subtraction a sieve would have to beat; Sol: the sieve "doesn't guarantee a speedup", λQ-CAD "a research proposal");
**A9's library clones** (reference and citation; a fork only after a benchmark wins, on Josh's word); **N:27–29's wave-indexing on Taylor shells** (a lead; Sol C:1008:
Taylor belongs on H_e(Q) — 0.7.0 VIBRATE's road).

---

## F · Josh's decisions
**ASKED — the ones that change what you see (the starred answer stands if you say nothing; both research rounds' 23 starred defaults are taken unless flipped here):**
1. **The plan's unit.** This master plan, then a BUILD PLAN per cut by the same method ★ — or briefs straight from this plan.
2. **The order.** Beat Equalizer first ★ (both rounds' default; your pitch and colours; lowest engine risk) — or **bucky-ball first**: 0.6.0 = Factor Road (C₆₀'s
   density, +170 — "maybe a bucky-ball as our next milestone (Remember how Benzene was the weird un-accomplish-able goal? We can do this!)"), 0.6.1 = Beat Equalizer.
   THE FIELD OWNER rides whichever opens; nothing else couples the two; the auditor would take the bucky-ball on value-to-you.
3. **Circular Rydberg.** Not a row ★ (n ≈ 14 shows a thinner ring of the n = 6 picture; LADDER already plays revivals to n̄ = 400) — or n = 30 through a separate
   log-space module in 0.8.2 (+40).
4. **Electrostatics' place.** 0.6.5 ★ — or 0.7.0's first row.
5. **Kohn–Sham.** 0.7.3, LDA first, PySCF RKS the oracle, ChronusQ cited ★ — or hold until a brief names lines and a subtraction — or drop.
6. **The Central Lab's five.** The confined atom · Yukawa · the finite well · quarkonium un-hidden with its editor · the soft-core well ★ (the diversity is the knob that
   ionises) — or your five.
7. **The revivals.** The H₂ curve beside UHF in 0.7.1 ★; H₂⁺'s double well and helium as leads (H₂⁺ returns only with the exact two-centre energies as its beat; a
   two-site lattice shows tunnelling exactly in 0.7.2) — or H₂⁺ as a row. Your 10-09 "H2 and Electrostatics should go" stands for the WINDOWS; this plan brings
   back physics, not windows.
8. **The names** in §A ★ — yours. "Two Levels" for 0.8.1, or fold it into 0.8.2.
9. **A3 — the quasicrystal sieve and a "third basis".** A non-goal on this ladder; INTERFERENCE ONLY and the Ammann–Beenker patch are what ships ★ — or a `tools/`
   research row (Sol's own order SYMMETRY SIEVE → Q-SIEVE → λQ-CAD) before 0.8.0.
10. **A9 — the C++ libraries.** Study, cite, run as references; no clone until a benchmark wins ★ — or name one library to fork now, and for which row.
11. **N:27–29 — "Wave indexing the presolved orbitals … dynamic waves with true electrostatics like a higher level QHO but based on taylor 3D shells."** A lead ★ (the
    nearest rows: the factor road's C-matrix, 0.6.5's potential, VIBRATE's H_e(Q)) — or a `tools/` research row before 0.8.0.
12. **Audio out.** The chord in 0.6.4, OFF by default behind a consent switch, muted under reduced motion ★ — or wait for MIR to offer an output.
13. **The platform road.** PWA + wrappers, iPad gated on MIR mobile, zero `lab/` lines ★.
14. **0.0.X's meaning.** The 0.6.x are FEATURE cuts, each a local tag ★ — or 0.0.X = a merged worktree, with the features re-grouped.
15. **For Astra and Sol, through you:** Round 1's three lines + Round 2's two + "the catalogue's oracle list is the set of numbers the app will certify; a certificate
    of yours that produces one at run time becomes a GATED readout in 0.9.0."
**RECORDED, not asked — technical laws you need not rule on, kept so you can:** `lab/sw.js` stays in the count (the law as written) · separate producers, lazy and
derived, zero re-bakes (the lock's own arithmetic) · the card road is a pass, not `writeTexture` (the governor's arithmetic) · the changelog of major features at
every cut (`tools/changelog.mjs`) · the paper's thesis (observable-certified reconstruction; the table grown per cut).

## G · What is not claimed; what is open
No line is measured; no row built; the multipliers are the tree's history, not a law. Nothing about a phone is known (nine iPad reports of 0.3.0-alpha; no phone
ever). UNVERIFIED on a device: the derived module's anchors; the pass's ms; a 256-site RM orbital a frame; the factor road at 96³; any boot ms. UNVERIFIED in
numerics: the log-mesh solver's convergence order and Richardson on the confined atom at other M; Bates' H₂⁺ energies (recalled); LZ on the 91-label drive; N4's live
timing; the 37 record-only molecules' names. No prior-art pass yet for the song's sonification, the equalizer mapping or the breathing road. Nothing resumes Sol's
programme; every gate is the app's own oracle.

## H · Josh's words this round, verbatim
> Wow, let's wrap up here. We will continue in this account session so don't worry about Yan but we will definitely compact to get ready for an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations.

> Good morning Claude! Let's continue where we left off

## I · The record of the round
`NACRE.md` `86c486c` → the censuses (Sonnet 5.5) → `PLAN-DRAFT-0.md` `542aa35` + §J `37b79d3` → `REVIEW-SONNET-0.md` (eight measurements) → `PLAN-DRAFT-1.md`
`c262fcf` → `AUDIT-OPUS-1.md` (Opus 5.5 @ high; six measurements `opus1-*`: the names live 52/52, RC on ATOM's solver 4× faster, RM in the real session 16×16 / 17×17
refused, the drive stepper 2.0 ms per 100 steps, the boot/card census, eight BUILD overruns) → this DRAFT 2 → `REVIEW-SONNET-2.md` (the junior) → DRAFT 3 (Josh) →
`PLAN.md`.
