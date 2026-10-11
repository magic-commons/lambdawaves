# THE ENGINE PLAN · 0.6 → 1.0 · PLAN DRAFT 1 (Claude Sos / Fable 5.1, 2026-10-11)

**Status: DRAFT 1** — the pre-draft (`PLAN-DRAFT-0.md`, with its §J census corrections) resynthesised after Sonnet 5.5's review (`REVIEW-SONNET-0.md`: fourteen fact
checks F1–F14, thirteen missed spots M1–M13, twelve picks C1–C12, eight ideas B1–B8, eight measurements `measure/sonnet0-*`). Every finding is taken unless this draft
says why; the review's own numbers are quoted with their files. Next: Opus 5.5 @ high audits and edits (`AUDIT-OPUS-1.md`) → DRAFT 2. Every line estimate is UNVERIFIED
(nothing built); every gate is [T] (a test with an oracle) or [R] (a number the app computes); nothing is "novel".

Josh's ask (00:38): *"an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations."*
The master goal spec (Claude-written for QWAVE-0, 2026-09-02; read as Josh's constitution, not his typing — CHAT-AND-ASKS §4), S:16: *"λWAVES is a real-time
mathematical performance instrument for seeing how eigenmodes, phases, couplings, wave packets, and observers assemble into evolving quantum and quantum-analogue
fields"*; S:267: *"λWAVES should feel broad because it can host many systems, not because it contains a solver zoo with duplicated infrastructure."*

---

## A · For Josh — what the instrument becomes (one page)

**In one sentence.** λWAVES stays one instrument — one stage, one texel behind the stage, one set of laws — and learns, cut by cut, to host a DIVERSE catalogue of
quantum systems: each enters by the cheapest of four roads the tree already has or nearly has, each carries its own oracle, status word and precision floor, each
gets the representations that make its physics visible, and every new producer is its own compute pipeline so THE LOCK is never re-baked. By 1.0.0 a person touches
the spectrum of a hydrogen atom, a benzene ring, a breathing water molecule, a hydrogen in a hard sphere, a disordered or quasi-periodic lattice, a Rabi-flopping
two-level pair or a spinning spin-½ and discovers, in the same glass, why the picture moves.

**The ladder** — Sol's organisation (C:5411–5422, "my proposed organization, not … milestones Claude has already approved"), which your A11 accepted by asking "Can
this be update 0.6.0?"; the names are one or two words, no "The", yours to change. Fourteen local cuts of ≈ 280 lines each (the law is PER CUT).

| cut | name | what you would see, new | what the engine learns |
|---|---|---|---|
| 0.5.3 | Rack Tune | (in flight; resumes on your word) | — |
| 0.5.4 | Contract Layer | the STATUS line that tells the truth about what is on stage | identity as data; oracle + geometry + status in the record; the worker that refuses; the field-law test |
| **0.6.0** | **Beat Equalizer** | the hydrogen chord in SPECTRUM, magenta/orange/yellow; turn a beat up or down; the three honest splits; "repeats every 1.094 ps"; nodes stand down honestly; "this is what decoherence looks like" | the FIRST SEPARATE PRODUCER behind the texel (the six-accumulator module); the MEANING CHECK; the period guard; the situation-fixture lock |
| 0.6.1 | Factor Road | C₆₀'s density for the first time; VALENCE cheaper for heavy atoms; "symmetry: D₆h (still) · Cs while the RING plays"; the ORBITAL knob reads 1a₁, 1b₂ | the third contraction (orbitals in, density out, no size cap); the symmetry certificate |
| 0.6.2 | Honest Flow | FLOW's arrows conserve charge; AS COMPUTED and BALANCED with their measured numbers; the DEFECT view | the face-flux current; the 9-pattern tabulation in a worker |
| 0.6.3 | Event Census | VORTEX names every event (line · birth · death · saddle); the nodal lines of Y_lm on a sphere | the spacetime classifier; the ÷4/÷8 still-only savings behind a flag |
| 0.6.4 | Hydrogen Song | drop a track; the atom tunes to its tonic with RATE; the chord SOUNDS (audio out, off by default); a film of the song you can share | hydrogen's FIRST DRIVE; the first STREAMING worker queue; the oscillator bank; the flash law |
| 0.6.5 | Electrostatics | the molecule's potential as a second cloud, total and per orbital; water's lone pair as a sign; a live probe in volts | the CARD road (a worker-built volume uploaded once) |
| **0.7.0** | **Vibrate** | water and benzene breathe in their true normal modes; the nuclei as beads and bonds you can see move; a spin-½ on a Bloch sphere; molecules under shaped pulses | the first NEW RECORD KIND; the skeleton overlay; the first non-spatial system |
| 0.7.1 | Open Shells | O₂, NO, H₂⁺; H₂ dissociates; the spin density as a signed cloud | UHF/ROHF beside RHF (its brief names its lines) |
| 0.7.2 | Lattice | a chain, ring or square lattice, disorder, a flux, the Aubry–André knob, SSH edges, graphene, an Ammann–Beenker quasicrystal — as site bars and, if measured, as a volume with phase as hue | the first NO-TEXEL system; "molecule-as-lattice" |
| 0.7.3 | Kohn–Sham | the same molecules under LDA beside RHF, each with its PySCF number | a grid, a functional, the RKS oracle; ChronusQ a reference, never source |
| 0.7.4 | Shelves | the catalogue as the front door: every system in one picker with its status word; the library in shelves (periodic table · heavy atoms · small biology · lattices) | one catalogue data file read by the picker, the MODEL sheet, the README table and the paper |
| **0.8.0** | **Central Lab** | hydrogen in a hard sphere (pressure ionisation), a finite well, a screened Coulomb, an anharmonic well, a rigid rotor; squeezed and cat oscillator states; a STARK field that ionises; the expectation bead | a GENERIC central-potential Hamiltonian through the Numerov road; the inter-shell propagator |
| 0.8.1 | Doubles | H₂⁺ as the double well with tunnelling (1s-LCAO, labelled); the H₂ dissociation curve, RHF vs FCI; Rabi and Landau–Zener on the Bloch sphere; positronium and muonic hydrogen by one knob | the revivals (the deleted physics, not the deleted windows) |
| 0.8.2 | Phase Space | Wigner for the oscillator with its negativity; the coherence map; the autocorrelation trace; the uncertainty ellipsoid; circular Rydberg to n = 30 if you say so | representations; the log-space module (gated) |
| **0.9.0** | **Certification** | README, CITATION and ABOUT say what is measured, with the metric; the provenance registry; the fingerprint | the GPU-vs-CPU field law on a device; Sol's certificates as gated readouts |
| 0.9.1 | Platform | the wrappers (desktop; iPad gated on MIR mobile) | zero `lab/` lines |
| **1.0.0** | λWAVES | the standalone; the paper beside it | — |

**What "ultimate engine upgrade" means here, honestly.** Not a rewrite. The tree has the right shape: f64 truth on the CPU and in workers; three producers writing one
(re, im) texel; a presenter of 24 copies; records with PySCF oracles. The upgrade makes that shape EXPLICIT and EXTENSIBLE — a kinds table the presenter checks, a
worker plane that can stream and hold, a record kind that can carry modes or sites, a card road, a generic central-potential Hamiltonian, a catalogue file, a
precision floor with its metric, a lock statement per row — and fills it with systems. The locked road is never edited; new producers are separate pipelines; THE
LOCK is re-baked ZERO times on this ladder. The rows sum to ≈ 2,400 new lines over fourteen cuts (≈ 3,900 of headroom), with ≈ 275 of named subtraction; every cut
below is at or under ≈ 280 or is gated on a brief that names its own.

**Four things to know before §F.** (1) Both research rounds' starred defaults are taken (twenty-three decisions); flip any. (2) Two of your eleven asks have no row and
are put to you plainly: the quasicrystal SIEVE and a "third basis" (A3), and cloning the C++ libraries (A9). (3) The paper's thesis is already visible — *observable-
certified reconstruction of interactive quantum wavefields in WebGPU* — and its table is built PER CUT from the catalogue, not assembled at 0.9. (4) 1.0.0's
standalone is a wrapper around the PWA and waits on MIR's mobile upgrade (your C:5397); no `lab/` line is spent on it.

---

## B · THE THESIS — one instrument, three planes, four roads, one contract

### B.1 The three planes (what exists, named)
- **TRUTH (f64; CPU, workers, records).** The hydrogen register (91 closed forms over n ≤ 6 — `hydrogen.js:25` NMAX = 6; `state.js`), five central Hamiltonians
  (`hamiltonian.js:26, 38, 55, 74, 144`: hydrogen + Z, QHO, BOX + the AXIAL gas, quarkonium [button hidden], ATOM), the Sturmian scale, the molecule engine
  (RHF/CDIIS; 54 live STO-3G, 18 with 6-31+G\*; 38 records with PySCF oracles), the TD-CIS register and RT-TDHF drive, `h2ci.js`, `unitaryOf`/`eigSymQL` (lattices, in
  tests), and the deleted non-central physics that survives in tests (≈ 1,430 lines: `tests/lib/mo.js`, `twocentre.js`, `hellmann-feynman.js`, `h2ci.js`,
  `molecule.js`, `modrive.js`). "All meters come from the coefficients" (REPORT.md:153).
- **PICTURE (f32 arithmetic; f16 storage; one texel).** Three compute producers — `COMPUTE_WGSL` (Mode records; seven spaces in one loop, two dead), `molWgsl`
  (the χ tile, four tiers), `ORB_WGSL` — write `vec4(re, im, 0, 0)`; `RENDER_WGSL` reads `.rg` in 6 views × 8 styles, 24 specialised copies per format; `LINE_WGSL`
  draws the frame. The texel's kinds: ψ (1–2), √ρ (0), signed Δρ in f64 (3, molecules). The f16 floor: worst 2.7–4.3·10⁻⁴ of peak, 4.88·10⁻⁴ the IEEE ceiling,
  relative L2 2.0–2.4·10⁻⁴ — the law every picture inherits, WITH ITS METRIC, shown nowhere today (REPRESENTATIONS §4-31).
- **FACE.** 22 rack windows + the kit's; four overlay canvases (vortex, particles, flow, kepler) that never read the texel; 83 readout sites; the exports (PNG,
  film, GLB/OBJ/STL, NPZ/CUBE, project, link, LaTeX, TSV); one aria sentence; no audio output of ψ.

### B.2 The four roads a system can take
1. **M — THE MODE RECORD** (112 B, 4 spare f32): a sum of "radial function × Y_lm" closed forms evaluated in-kernel; the kernel's only vocabulary
   (`field.js:83–84`). Hosts hydrogen, momentum, oscillator, the spherical box + gas table, tabulated radial (quarkonium, ATOM, Sturmian). On this ladder: the
   equalizer's 6×6 form (a SEPARATE MODULE), the DRIVEN state's c_a(t) from a worker (0.6.4), H₂⁺'s two centres through `Mode.ctr` (0.8.1), circular Rydberg to
   n ≈ 14 (the CPU twin's FACT fixed; F1) and to n = 30 only through a separate log-space module (0.8.2, gated).
   **RC — the CENTRAL-POTENTIAL road** inside M: V(r) → Numerov (`cornell.js`) → the 36-row radial table → kernel space 6; no WGSL. It needs ONE generic Hamiltonian
   first (μ = 1, rmax per row, a bound/virtual flag per row, `configure`/`domainFor`/`labelOf`/`unit`, the solve in the worker with the table uploaded — ≈ 90
   lines; F5), after which each potential is 1–3 lines. Accuracy: 10⁻⁷…10⁻¹⁰ on smooth V (Yukawa 4·10⁻⁷ Eh vs a tridiagonal oracle; the confined atom's
   critical radius to 10⁻¹⁰), O(h) on a step (the finite well 1.1·10⁻² at N = 4000 — a grid point ON the step, gate 10⁻³) — MEASURED `sonnet0-b*`, `sonnet0-h`.
   Screened wells bind few rows (Yukawa 23/9/5/3/2/1 of 36 at λ = 0.02…0.5): depths are chosen so ≥ 10 rows bind, or the system is a preset, not a row.
2. **S — SHELLS + A COEFFICIENT BUFFER** with three contractions: the tile on D (locked for three states), the direct road on one c (unlocked), the FACTOR road on
   a C matrix (0.6.1; `molMatBuf` 65,536 B its first limit). A BREATHING molecule = moved centres + D(Q) (0.7.0); Kohn–Sham = another D (0.7.3); open shells
   = Dα + Dβ summed (0.7.1). **RM — "molecule-as-lattice"** inside S: one narrow s-shell per site, the register as the kind-2 COMPLEX ORBITAL (amplitude + phase as
   hue) through `setMolecule({nAO, half, shells})` + `setMoleculeMatrix(M, {kind: 'orbital'})` and a session product `{kind: 'orbital', AO vector}` from a new model
   id — NO SCF injection (F6: the `atomsSha256` rule binds library records and the ORBITALS window, not the field); the limit is `MOL_LIMITS.shells = 256` → ≤ 16×16
   sites. UNVERIFIED on a device; the audit's measurement.
3. **W — NO TEXEL:** lines, sites, bars, spheres, captions from f64 in a worker, drawn on an overlay canvas through `toScreen` or on a window canvas. FLOW's arrows,
   the lattice's bars, the Bloch sphere (ORBIT's painter), the bead, the H₂ curve, the readouts. Law (REPRESENTATIONS §5-2): **a new CPU reader is a `READERS`
   entry with a `may()` gate** (rack.js:148, :732) or it is not governed.
4. **RU — THE CARD:** a worker-built volume uploaded ONCE (never a frame) — `COPY_DST` on `psiTex`, the worker resamples its 64³ card to the current `res` and packs
   f16, `queue.writeTexture`, a stats word (`stats[slot]` = max ρ, else the picture is blank), `refValid = false`: ≈ +15 JS, 0 WGSL, no pass (F4 — DRAFT 0's "+35
   compute pass" withdrawn). Two traps named: `setResolution` destroys `psiTex` (field.js:1038–1052) so a card RE-UPLOADS on every res change the governor makes; and
   bytes are 8 B a texel (64³ = 2.1 MB, 96³ = 7 MB, 128³ = 16.8 MB). Gate [T] on a device: a CPU-generated 1s volume through the card road hashes within one f16 ulp
   of the kernel's own `fieldDigest` — which doubles as the field-law test. First use 0.6.5; then every record-shaped picture (the Laughlin density, Hofstadter's,
   a barrier-scattering record, a double slit, two particles in 1-D, Gross–Pitaevskii) has a road as a RECORD at a few Hz, gated on the upload's profile.

### B.3 THE CONTRACT every new kind carries (0.5.4's contract layer, made the law of this plan)
A system or picture enters with these declared in its BRIEF and asserted by a test: **(i) its oracle** (closed form · PySCF · RT-TDHF · expm · scipy · a
re-solve) and the number the gate asks — stated as EITHER an f64-twin gate (10⁻⁷…10⁻¹²) OR a texel-limited device gate (the f16 floor ≈ 5·10⁻⁴; never "10⁻⁶ on
the texel" — F2); **(ii) its status word** (EXACT · NUMERICAL · UNCHECKED; 0.5.4 P4's `statusOf()` — until it lands, the file-header line); **(iii) its precision
floor in the texel with its metric**, or "no texel"; **(iv) its clock convention** (absolute E·rate · ground-relative · the propagator's — one of three, named);
**(v) its LOCK statement** ("outside the lock, gated by X" — never a re-bake on this ladder); **(vi) its MEANING** — the texel kind it produces, from which the
presenter derives what stands down (C7); **(vii) its flash declaration** if it beats (the on-screen alias of each populated pair); **(viii) its metric and script**
for every public number; and, added by the review (M3, M4, M2, M8, M5): **(ix) "persists as …"** — the scope (PREFERENCE / WORKSPACE / PROJECT) and key of every
parameter, DEFAULT-ABSENT so serialize bytes do not move, with the link/history/undo consequence named (a DRIVEN state cannot be reproduced from a project that does
not carry the audio: the song persists as "the track's hash + RATE + filter", and the project says "track missing" honestly); **(x) its FILM law** — pure (closed
form at t) · precomputed at export (the song's stored c_a(t), B6) · refused; **(xi) its PHONE budget [R]** — boot ms (every `createShaderModule` compiles and is
`getCompilationInfo`'d at boot, field.js:869–882), pipelines, MB of storage, frame ms at the governor's lowest tier, and the governor's rule for it; **(xii) its
MODULATION targets** — which knobs register in `mod-port.js` (never `lab/mir/**`), with ranges and what the flash guard sees; **(xiii) its NON-VISUAL line** — a
label for the aria sentence, and audible output OFF by default.

### B.4 The worker plane
Four request/reply queues with an 8 s timeout that falls back to the frame thread; 0.5.4 P6 makes chem REFUSE after it has answered. This plan adds **one stateful
STREAM queue** (0.6.4; c_a(t) a frame; failure = hold and say so) and sends every heavy build off-thread: the ESP card (0.6.5), the central-potential solve (0.8.0 —
208 ms for 36 rows on the frame thread today, MEASURED; the kick on a tabulated H stays main-thread and is PRICED, `mathworker.js:24`), the lattice eigensolve
(0.7.2), the VIBRATE build (0.7.0; a `tools/` step for benzene), Kohn–Sham (0.7.3), the squeeze operator (0.8.0). THE STUTTER LAW stands.

### B.5 The precision law, the clock, the lock — stated once
- **Precision:** f64 → f32 → f16 texel. A readout never reads the texel. A signed kind needs a relative floor (2·10⁻⁴ of local ρ). A public number names its
  metric. The field-law test (0.5.4 P7c) is the standing gate for every M-road family (its CPU twin is the closed form) and the card road reproduces it.
- **Clock:** one f64 t; three conventions; every system declares which. T_MAX declared; the 2⁵³ period guard (C2).
- **THE LOCK:** 1,004 values on 13 still states (5 kernel spaces + 3 tile tiers), same-machine, no CI job; the presenter's 120 style values inside it; ZERO situations
  locked. It hashes TEXEL BYTES, PIXELS and `packModes` BYTES — not shader text, not pipeline keys (digest-lock.mjs:1–60, :137–155; F3). So: **a new producer is a
  separate `createShaderModule` + pipeline (as `molPipelines` already coexists with `computePipeline`, field.js:875–887) and is NON-INTERFERING for the locked bytes —
  but not "by construction": the JS dispatch edit in `encodeCompute`/`reconstruct` (:1056–1068) is the path the locked states take, and a bug there moves them; so
  every cut runs the lock as a PRECONDITION and prices the dispatch edit and the boot-time compile in its row.** A new VIEW/STYLE NAME turns `--check` red by key
  set alone (:174–175, :264–265) — the row carries the `tools/` line that teaches `styles()` to skip fixture-missing keys. The dead spaces 4–5 and `Mode.ctr` STAY
  (≈ 40 lines, counted; two are hooks for revivals). **Before 0.6.0 touches the dispatch path: a SITUATION-FIXTURE LOCK** (B8) — five or six fixtures (STARK,
  ZEEMAN, a kick, the A/B mix, the drive at a fixed t) recorded on the base in `tools/perf/digest-lock.mjs`' state set, `--check` 0/0 per cut; `tools/` only.
- **The deliberate exception, named once:** no row on this ladder re-bakes. If Josh wants circular Rydberg to n = 30 (0.8.2), it is a separate module, not a branch.

### B.6 The subtraction ledger (per cut; measured by `wc` in each BUILD; settled by the review's F9)
`modrive.js` −85 after `sin2Pulse` (:86–93) moves to `mathworker.js` (0.6.4) · `shadow.js` → `tests/lib/` −90 (the app imports `SQRT2` only; 0.6.5) · `absorb.js`'
≈ 70 dead lines → `tests/lib/` (its `spectrum`/`peaks` stay; `kick`/`fieldFreeTrace`/`kickSpectrum` become PULSES' test oracle there; 0.7.2, spent ONCE) ·
`vortex.js`' reconnection PROSE (≈ 20 of 95 lines — confirmed prose, not live strings, by 0.6.3's brief) · Round 1's stale comments + the retired shim (−10, 0.6.0).
**NOT taken:** `molecule.js` (kept whole for 0.8.1's H₂⁺; C7) · the dead WGSL spaces (zero re-bakes). The ≈ 920 app-dead bound is the reserve, never the plan.

---

## C · THE CATALOGUE — systems × situations × representations (the spine; the paper's table; a data file the app reads)

**Rules.** DIVERSITY (Josh N:30 "as diverse as possible"): a cut adds systems from different FAMILIES, never variants of one — so the Central Lab is capped at five
CONTRASTING potentials (C4) and the rest are presets without a row. ENTRY: B.3's thirteen declarations. ROAD: the cheapest of B.2's four that holds the physics; a
texel only for a volume. **THE FRONT DOOR (B1, M1): one `lab/catalogue.js` data file** — id · family · road · oracle test name · status word · lock statement ·
preset — read by SPECTRUM's operator picker, the MODEL sheet, a `tools/` README-table generator and the paper; [T] a node test asserts every row names an existing
oracle test and every preset resolves; a count test pins the table. Lands in 0.7.4 (before the Central Lab's systems arrive) and is back-filled with every system
that exists.

Legend — today: LIVE · TEST · GONE · ABSENT. Road: M / RC / S / RM / W / RU. Lines: S ≤ 30 · M ≤ 100 · L ≤ 250 · XL.

### C.1 The exact register and its situations (hydrogen; EXACT ANALYTIC)
| system / situation | today | road | oracle | representations (today → added) | cut |
|---|---|---|---|---|---|
| hydrogen 91 states n ≤ 6, 31 presets; Z = 1…6 (knob); ATOM for Z = 7…36 | LIVE, locked (9 states) | M0 | closed forms; the field law | CLOUD/PHASE/Re/Im/Δρ · PARTICLES · VORTEX · SHADOW · PLANE · WIGNER · RADIATION · CALCULUS · SPECTRUM · REPEATS | — |
| STARK (Z = 1, intra-shell) · ZEEMAN (orbital, universal) · per-label RATE · PROPAGATOR (Sturmian only) · A/B Rabi mix (a toy; no oracle) · KICK/BOW/DRAG | LIVE | M0 | closed forms; **A/B Rabi gets its node oracle: Ω = E₀⟨1s\|z\|2p₀⟩ to ≈ 10⁻³ for E₀ ≤ 3·10⁻³ (MEASURED `sonnet0-g-rabi`)** | the same | 0.6.0 (oracle) |
| **the equalizer** (jitter · comb · pulse · a song's autocorrelation; three splits; interference only) + **dephasing** ("the beats fade, the shells stay" — a jitter table is a random-clock Lindblad fixed point, Milburn 1991) | ABSENT | M (a SEPARATE six-accumulator module; the signed ROOT stored, view 'real' reads it, C7 tags it "signed-root", not Δρ's kind — C9) | PSD accept/reject; ρ′ vs the f64 contraction 10⁻¹² in a node twin, ≤ 5·10⁻⁴ on the device; within-shell static, beats zero-mean | BEAT grid · signed volume · PURITY · nodes stand down (C1) | 0.6.0 |
| the period sentence + 2⁻⁵³ guard · the flash law | PARTIAL | W | arithmetic; 0/20,000 false (MEASURED) | INFORMATIONAL; labelled RATE | 0.6.0 |
| **a song drives the atom** — hydrogen's FIRST drive | ABSENT | M + STREAM | ⟨1s\|z\|2p₀⟩ = 128√2/243 (the tree's: 1.4·10⁻¹⁵); unitarity 10⁻¹²; the 179.049 Hz resonance; the alias test; the song's E₀ ≤ 0.01 gets its own number | DRIVEN kind · pitch map · the chord sounds · film-safe (B6) | 0.6.4 |
| **circular Rydberg** | PARTIAL (CPU twin NaN from n = 13 — FACT ≤ 24, `hydrogen.js:31–32`; f32 underflow from n = 15–17; ipow overflow at n = 24; MEASURED F1) | M0 to n ≈ 14 (FACT fixed, +1); a separate LOG-SPACE module for n = 30 | mpmath in an emulated-f32 twin (tests the formula); the f16 floor on the device | the same pictures at large n; SPECTRUM shows a separate small producer, not the register (M11) | 0.8.0 (n ≈ 14) · 0.8.2 (n = 30, gated) |
| **inter-shell STARK** (field ionisation; the Rydberg Stark map) | ABSENT | M0 through the PROPAGATOR hook (`state.js:106`): H = diag(E) + F·z over 91 labels | exact diagonalisation (its own); E_n + (3/2)nkF | the same; a STARK sweep | 0.8.0 |
| **mass scaling** μ (positronium, muonic H, deuterium) | ABSENT (`radiation.js` already uses μ) | M0 (μ beside Z in `setZ`; ≈ 10) | E = −μ/2n² | the same + the scale caption | 0.8.1 |
| **Rabi + Landau–Zener on the Bloch sphere** | PARTIAL (Rabi as A/B toy; ORBIT's spheres) | W (ORBIT's painter) + the song drive's two-level reduction; LZ = a chirp ω₀ + βt on the drive | Rabi closed form ≈ 10⁻³; P_LZ = e^{−2πδ} (its 10⁻³ accuracy UNVERIFIED) | the Bloch sphere · population bars | 0.8.1 |
| Dirac / fine structure | ABSENT | (a) the spinless shift as a per-label energy (S–M) · (b) spinors (XL) | Sommerfeld | — | lead |
| helium (Hylleraas) | GONE (D9; space 4 compiled in) | M (space 4; `helium.js` from git ≈ 215) | Pekeris −2.9037243770 | the conditional cloud | lead (§F) |

### C.2 The closed-form families and the Central Lab
| system | today | road | oracle | cut |
|---|---|---|---|---|
| momentum-space hydrogen/QHO | LIVE, locked | M1 | closed | — |
| QHO: eigenstates; **coherent** (a slap IS a coherent state, `qho.js:14–19`) | LIVE, locked | M2 | closed | — |
| **squeezed · cat** | ABSENT | an operator `applySqueeze(r, axis)` beside `applyKick`, lost norm reported; a cat = A/B store of two coherent states + a sum | Var(z) = e^{±2r}/2; the Fock series; Wigner negativity for the cat | 0.8.0 |
| the spherical BOX + GAS (a Gaussian packet in the well, NUMERICAL projection, capture reported) | LIVE, locked | M3 | j_l zeros 10⁻¹³; the gas's capture number | — (the "free packet" is the gas at the largest radius, PRE-WALL, gated at its capture number — F8; a preset, +5) |
| quarkonium (hidden button) · ATOM H–Kr | LIVE, locked | M6 | PDG; HF limits | the button un-hidden (S) in 0.8.0 |
| **THE CENTRAL LAB** — the generic Hamiltonian + five contrasting potentials: **the confined atom** (hydrogen in a hard sphere; R_c = j₁,₁²/8 = 1.8352463 to 10⁻¹⁰ MEASURED — the first and best-gated system, B3) · the finite well (a grid point on the step; 10⁻³) · Yukawa/screened Coulomb (λ_c ≈ 1.19 known; 4·10⁻⁷) · the anharmonic/soft-core well · the rigid rotor/ring (a narrow shell; T = 4πI exactly). Presets without rows: Gaussian well, delta shell, power laws, Coulomb + linear, radial Morse | ABSENT | RC | as listed; a bound/virtual flag per row | 0.8.0 |
| the separable product (cube, 2-D/anisotropic oscillator, 1-D box faces) | ABSENT | M (a SEPARATE module; L) | closed | 0.8.2 (gated on a brief) |
| two particles in 1-D · barrier scattering · double slit · Gross–Pitaevskii · Landau/Fock–Darwin · Laughlin · kicked rotor · quantum walk · Lindblad | ABSENT | RU records (after 0.6.5) · W | closed/expm | 0.8.2 candidates gated on the upload profile; the rest leads |

### C.3 Molecules (NUMERICAL; the records with PySCF oracles)
| system / situation | today | road | oracle | cut |
|---|---|---|---|---|
| 54 live STO-3G · 18 with 6-31+G\* · 38 records (C₆₀ a frontier record) · TD-CIS · RT-TDHF δ-kick · FLOW | LIVE (3 locked) | S | PySCF ≤ 7e-9 Eh | — |
| the symmetry certificate · the orbital NAMES (1a₁, 1b₂) on the knob (`names.js` reads them already; C5) | PARTIAL | W | 24 ops to 10⁻¹⁴; the character test | 0.6.1 |
| C₆₀'s density (the factor road) · frozen core · the mirror half | PARTIAL | S (C matrix) | ρ_factor = ρ_tile; Tr(DS) = N_e | 0.6.1 |
| BALANCED flow · DEFECT · gated readouts | ABSENT | W | the face-flux identities | 0.6.2 |
| H₂'s hidden correlation (caption) | TEST | W | Slater–Condon; PySCF FCI 1-RDM | 0.6.0 |
| **the potential cloud** (total + per orbital; the probe) | ABSENT | S → RU card | `int1e_rinv` ≤ 3 % / ≤ 10⁻³ a.u.; charge to 10⁻² e; the sign map; the card-road digest gate | 0.6.5 |
| **vibrations** + **the skeleton** (beads, bonds, dipole arrow) + **PULSES** (`fieldOf` wired to `chem.rt.init`) | ABSENT | S (record kind) · W · S | re-solve per mode; PySCF ≤ 0.1 cm⁻¹; `absorb`'s linear response | 0.7.0 |
| **open shells** UHF/ROHF; the spin density (signed kind); the H₂ curve table revived in 0.8.1 | ABSENT (refused by design; `multiplicity` in the schema, unused) | S (Dα + Dβ) | PySCF UHF; ⟨S²⟩ | 0.7.1 |
| **Kohn–Sham** LDA | ABSENT (ATOMS has Xα) | S | PySCF RKS `lda,vwn` ≤ 10⁻⁶ Eh; ∫ρ = N to 10⁻⁴ | 0.7.3 |
| molecular momentum space | ABSENT | S (a Fourier kind; L) | closed | lead |

### C.4 Lattices and discrete systems
| system | today | road | oracle | cut |
|---|---|---|---|---|
| tight-binding chain/ring/square · Anderson · Aubry–André · Peierls/AB · SSH · graphene · Hückel/PPP benzene | TEST (`unitaryOf` 2.1e-14; `eigSymQL` 97 ms at 256, 13.4 s at 1,024) | W (bars) + RM (the volume, if measured; ≤ 256 sites) | expm; unitarity; λ = 2J; the known bands; PPP vs `pyscf.fci` | 0.7.2 |
| **Ammann–Beenker / Penrose** (a 2-D quasicrystal; Josh's A2/A3 made a lattice, B4) | ABSENT | RM | Bragg peaks at silver/golden positions; IPR scaling | 0.7.2 |
| Hofstadter (a record) · a quantum walk · a spin chain ≤ 8 spins | ABSENT | W / RU | the butterfly; σ ∝ t; exact diagonalisation | 0.8.1 (presets) |
| **spin-½ Larmor/Rabi** — the first NON-SPATIAL system (B5) | ABSENT | W (a two-level register on ORBIT's painter) | Larmor/Rabi closed | 0.7.0 |

### C.5 Representations (REPRESENTATIONS §4's 40 rows re-cut; the ones the ladder takes)
| representation | today | road / cost | cut |
|---|---|---|---|
| signed kinds through view 'real' (the equalizer's root, Φ, spin density) | the kind-3 road exists | 0 presenter lines; Φ's 1/r tail: EXPOSURE/KNEE/SOFT absorb it or one transfer branch (S, a lock run) | 0.6.0 · 0.6.5 · 0.7.1 |
| the MEANING CHECK | ABSENT (four hand-written stand-downs) | one assertion at `setMoleculeMatrix`/`setSpace`, joined to `VIEW_SAY` | 0.6.0 |
| BEAT grid · PURITY · splits | ABSENT | SPECTRUM's grid mode | 0.6.0 |
| the TEXEL-FLOOR tile (the f16 floor with its metric, from `fieldDigest`) · the SYMMETRY tile | ABSENT | METERS / MOLECULES tiles (S) | 0.6.0 · 0.6.1 |
| the chord (audio OUT, off by default) | ABSENT (no output exists) | an oscillator bank on change, never a frame (M) | 0.6.4 |
| FLOW: BALANCED · DEFECT · arrows/streamlines as draw modes of `createParticles` | tracers only | W (M each) | 0.6.2 (DEFECT) · 0.8.2 (arrows) |
| VORTEX events · ANGULAR NODES sphere | PARTIAL | W | 0.6.3 |
| the second cloud + probe | ABSENT | RU + view 'real' | 0.6.5 |
| the skeleton (balls, bonds, dipole arrow) | ABSENT | W (KEPLER-style overlay) | 0.7.0 |
| the Bloch sphere | ORBIT's painter exists | W (S–M) | 0.7.0 (spin-½) · 0.8.1 (Rabi/LZ) |
| the site-density window (+ RM volume) | ABSENT | W / RM | 0.7.2 |
| the catalogue picker + MODEL sheet | ABSENT | data (B1) | 0.7.4 |
| the expectation BEAD (⟨x⟩,⟨y⟩,⟨z⟩ from `dipoleMatrix`) · the 1-D ray-sample line plot | PARTIAL (CALCULUS tiles) | W (M) · `sampleVoxel` along a ray (S–M) | 0.8.0 |
| QHO Wigner (negativity) · the coherence map · the A(t) trace · the uncertainty ellipsoid ⟨r_i r_j⟩ | PARTIAL (hydrogenic Wigner; instantaneous AUTOCORR) | W (M · S–M · M · L) | 0.8.2 |
| non-visual: a label per new picture in the aria sentence | one sentence today | S per row | every cut |

---

## D · THE LADDER, release by release — rows · gates · lines · models

Conventions: every row = what Josh sees · the engine · the gate ([T]/[R]) · Δ lines · the model. Every cut: THE LOCK ×2 and the SITUATION FIXTURES 0/0 as
PRECONDITIONS (same machine, human-run — not a CI gate; M6); serialize 11/11; `settings-probe` 0/6; `new-project --check`; `pwa --write` after every `lab/`
edit; the ms/s pair and the PHONE budget vs the previous cut; the line count vs the cap; a fresh verifier for frame-path, worker/storage and release changes (one
light check otherwise); **its `tests/*.test.mjs` list, split into gates the node half can fail (f64 twins, PSD, identities, citations, counts) and gates a human runs
(GPU-vs-CPU, the lock, ms/s)**; the oracle test of every row asserted to exist (the certification table grows PER CUT, M10); **`tools/changelog.mjs` writes the
major-feature changelog Josh asked for on 10-09 (M7)**; a local cut on Josh's word; NO push. **Each release gets its own BUILD PLAN by the nacre method** before its
briefs (Round 2 §G); this plan fixes rows, order, gates and budgets; the build plan fixes files, commits and harness. **Josh's 0.0.X (A11): "merged/committed
worktrees/Claude sessions that build into it" — this plan reads the five 0.6.x as FEATURE cuts, each a local tag; if you meant patch = a merge, say so (§F-14).**

### D.0 Preconditions (not this plan's rows)
0.5.3 Rack Tune (resume) · 0.5.4 Contract Layer (its DRAFT-3 awaits Josh; P1 identity, P3 oracle/status, P4 `statusOf()`, P6 the worker refuses, P7 precision + the
field law). Rows below ASSUME P4, P6, P7; where 0.5.4 cuts without one, the first row that needs it carries it. **Also before 0.6.0: the SITUATION-FIXTURE LOCK (B.5;
`tools/` only) and the CLAUDE.md LEGACY paragraph corrected (stale: all five windows deleted; 0 `lab/` lines).**

### D.1 · 0.6.0 Beat Equalizer (≈ +223 − 10 = +213)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| C7 THE MEANING CHECK | a refusal sentence when a kind and a VIEW disagree | one assertion where the texel is bound (`setMoleculeMatrix`/`setSpace`), the stand-downs derived; `VIEW_SAY` truthful | [T] every (kind, VIEW) pair agrees; the equalizer's "signed-root" refuses PHASE | +4 · Sonnet |
| C2 THE PERIOD GUARD | no false period | refuse at max v/g ≥ 2⁵³ | [T] 0/20,000; 17,306 kept (MEASURED) | +1 · Haiku |
| M2 + M2′ THE EQUALIZER + THE SPLIT | the BEAT grid; tables on six shells; presets; PLAIN SUM · WITHIN-SHELL · BEATS · INTERFERENCE ONLY; PURITY; the labels gate | **a SEPARATE compute module** (≈ 55–65 WGSL: the space-0 evaluation + the 6×6 form + Γ binding + sign store — MEASURED `sonnet0-a`) + its JS (pipeline, layout, Γ/shell-index packing, the dispatch select in `encodeCompute`, the CPU twin ≈ 85); the signed ROOT stored; view 'real' reads it | [T] PSD accept/reject; ρ′ vs the f64 contraction 10⁻¹² (node twin); within-shell static 10⁻¹⁵, beats zero-mean 10⁻¹⁶; [T] device: ρ′ vs twin ≤ 5·10⁻⁴; [R] +4–5 % a frame; [R] boot ms with the module; PRECONDITION the lock + fixtures 0/0 | +150 · Opus |
| C1 NODES STAND DOWN | VORTEX/PARTICLES grey out under Γ ≻ 0, λ_min ≥ floor | a flag from the table state | [T] ρ′ ≥ λ_min Σ\|Ψ_n\|² | +6 · Sonnet |
| C4 H₂ HIDDEN CORRELATION | the caption on H₂ | `h2ci.js` | [T] vs PySCF FCI 1-RDM 10⁻⁹ | +8 · Sonnet |
| M3 THE PERIOD | "repeats exactly every 1.094 ps" | REPEATS rescans | [T] T = 14400π | +8 · Sonnet |
| M11a SONG BANDS → ROUTES | six shell RATEs as targets (registered in `mod-port.js`) | routes | [T] routes exist; the flash declaration | +12 · Sonnet |
| THE FLASH LAW | labelled RATE above 3 Hz; `sim-ladder` at 40 | the alias arithmetic | [T] the alias table; 31 presets | +10 · Sonnet |
| N6 (part) + the A/B RABI ORACLE + the TEXEL-FLOOR tile | "79.7 % of the polarizability"; the Rabi formula as a test; METERS shows the f16 floor with its metric | sentences; a node test; a `fieldDigest` tile | [T] each number's script; Ω to 10⁻³ (MEASURED) | +23 · Haiku/Sonnet |
| the dephasing caption | "the beats fade, the shells stay" | one sentence | — | +1 |
| 0.6.0-V | — | — | the verifier: lock ×2 + fixtures, serialize, the ms/s pair, boot ms, the identities | — |
Sum +223; − stale comments/shim 10 → **+213.** M12 THE CHORD moves to 0.6.4 (no audio output exists; it is an oscillator bank, M; the song needs it).

### D.2 · 0.6.1 Factor Road (≈ +233; no subtraction — `molecule.js` stays for 0.8.1)
M4 THE FACTOR ROAD (+150, Opus; the C-matrix binding past 65,536 B; C₆₀'s record grows by 180 f64 columns, a DOWNLOAD) · M10 THE SYMMETRY CERTIFICATE + the SYMMETRY
tile + **the orbital NAMES on the knob** (1a₁, 1b₂ from `names.js`; +23, Sonnet) · M6 FROZEN-CORE COLUMNS (+15) · M5a THE MIRROR HALF (+40, Opus) · N6's VALENCE bar
(+5). Gates as Round 1 §D. **+233 of 280** — tight; M6 waits if M4 runs long.

### D.3 · 0.6.2 Honest Flow (≈ +189; no subtraction)
M1 CONTINUITY + C5's face-flux current (+155, Opus) · M7 GATED + RESIDUAL (+12, Haiku) · M11b THE DRIVE'S PITCH (+12, Sonnet) · N6 honest readouts (+10). Gates: Round 2
C5's four [T]. **+189.**

### D.4 · 0.6.3 Event Census (≈ +140 − 20 = +120)
M8 THE SPACETIME CLASSIFIER (+40, Opus) · M8′ ANGULAR NODES (+40, Sonnet; L3's nodal-length check as a test assertion) · M5b THE ASYMMETRIC UNIT (+60, Opus; flag;
still only). − `vortex.js`' reconnection prose (confirmed prose by the brief).

### D.5 · 0.6.4 Hydrogen Song (≈ +205 − 85 = +120)
N1 (Opus, +90): the worker Strang step in m-blocks (dt 0.5, midpoint field, 100 steps a frame), the polyphase low-pass, Z eigensolved at load, the DRIVEN kind through
`packModes`, the pitch map, RATE as the tuning peg, the caption's scale sentence, the flash declaration · **THE STREAM QUEUE** (+25, Opus; stateful; hold and say so)
· **M12 THE CHORD** (+60, Sonnet; an oscillator bank, one partial per populated lane, `setValueAtTime` on change, the kit's context lifecycle; audio OFF by default
with a consent switch; "sounds at … Hz at this RATE") · **FILM-SAFE** (+30, B6: at export the worker runs the same steps offline and `modesAt(t)` reads the stored
c_a(t); [T] byte-equal re-render of two exports). Persists as: the track's hash + RATE + filter (PROJECT); "track missing" honestly. Gates: Round 2 N1's [T]/[R]
list; [T] the nine locked states' `packModes` bytes identical with the gate off (a node test, not a lock run — C8). − `modrive.js` 85 after `sin2Pulse` moves.

### D.6 · 0.6.5 Electrostatics (≈ +155 − 90 = +65)
N2 (Opus, +140): `md.js` exports the nuclear-attraction entry (+10); the probe in the worker; the CARD (64³ ρ from the f64 AOs, the analytic core split, the free-space
FFT Poisson, the nuclei added); the total first, then per orbital the equal-share piece with the raw electron cloud beside it (Round 2 §F-3 ★); the ms printed · **THE
CARD ROAD (RU)** (+15: `COPY_DST`, the worker's resample + f16 pack, `writeTexture`, the stats word, re-upload on `setResolution`). Gates: Round 2 N2's cloud gates;
[T] device: a CPU 1s volume through the card road within one f16 ulp of `fieldDigest`. Persists as: nothing (a card is derived; PROJECT keeps the view only).
− `shadow.js` → `tests/lib/` 90.

### D.7 · 0.7.0 Vibrate (≈ +185)
N3 VIBRATE (+80, Opus; the record kind; LINEAR + McWeeny ≤ 4·Q_max; the amplitude label; "not harmonic here"; a `tools/` build step) · **N3′ THE SKELETON** (+60,
Sonnet; beads, bonds from the geometry, the dipole arrow; off by default; moves with the modes) · **PULSES** (+20, Sonnet; `fieldOf` step/ramp/wave/gaussian wired to
`chem.rt.init`; `absorb`'s linear response as the oracle) · **SPIN-½** (+25, Sonnet, B5; a two-level register on ORBIT's painter; Larmor and Rabi closed forms; the
first non-spatial system). Film: VIBRATE pure (closed form in Q(t)); PULSES precomputed.

### D.8 · 0.7.1 Open Shells (brief-named ≤ 140 with a subtraction ≥ half; Opus)
`uhf` beside `rhf` in `scf.js` with D = Dα + Dβ to the existing tile (no kernel change; `multiplicity` already in the schema); the spin density Dα − Dβ as the signed
kind; O₂, NO, H₂⁺. Gate: PySCF UHF H₂ at 5 bohr, O₂ triplet, 10⁻⁸ Eh; ⟨S²⟩.

### D.9 · 0.7.2 Lattice (≈ +180 − 70 = +110)
N4 (Opus, +120): the site-density window on `unitaryOf` + `eigSymQL` in a worker; chain/ring/square; W; Φ; λ; live ≤ 8×8 with flux, ≤ 16×16 without (consistent with
the 256-shell limit); records beyond; the IPR readout; the ms printed; the seed persists (PROJECT) for determinism · **RM THE VOLUME** (+30 if the audit's measurement
says the session takes a lattice model: one narrow s-shell per site, kind-2 complex orbital, phase as hue) · presets S each: Anderson, Aubry–André, Peierls/AB, SSH,
graphene, Hückel benzene · **AMMANN–BEENKER** (+30, B4; Bragg peaks at the silver-ratio positions; IPR scaling). − `absorb.js`' dead lines → `tests/lib/` 70.

### D.10 · 0.7.3 Kohn–Sham (≈ +180; gated on a brief that names its subtraction — §F-6)
LDA (Slater + VWN) on a Becke/Lebedev grid, closed-shell, in the chem worker; "RKS LDA" STATUS; RHF ↔ LDA as the signed view. Gates: [T] PySCF RKS `lda,vwn` ≤ 10⁻⁶
Eh on water and benzene; ∫ρ = N to 10⁻⁴; the SCF's ms. ChronusQ cited, never merged (GPL-2 vs GPL-3.0-only). The spec says "do not attempt to compete with
Octopus/ChronusQ/RMT" (S:2310, verbatim); Josh's A4 says "we should definitely go forward with it"; the oracle reconciles them: no accuracy is claimed that PySCF
did not measure.

### D.11 · 0.7.4 Shelves (≈ +92)
**THE CATALOGUE FILE** (+40, Sonnet; B1): `lab/catalogue.js`, read by SPECTRUM's operator picker (which gains the systems as they land; the QQ̄ special case
subtracted), the MODEL sheet, `tools/catalogue-table.mjs` (the README table) and the paper; [T] every row's oracle test exists, every preset resolves, the count
pinned · the MOLECULES picker in shelves (+52; periodic table · heavy atoms · small biology · lattices; data-driven from `library.json`).

### D.12 · 0.8.0 Central Lab (≈ +270; zero lock risk; the diversity cut — five families)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| THE GENERIC CENTRAL HAMILTONIAN + FIVE POTENTIALS | pick a potential; its bound states in the same glass; superpose and watch; the quarkonium button back with an (α_s, σ) editor | the generic Hamiltonian (μ = 1, rmax per row, bound/virtual flag, configure/domainFor/labelOf/unit, the solve in the worker + table upload; +90) · the confined atom · the finite well (grid point on the step) · Yukawa · the anharmonic/soft-core well · the rigid rotor (+15) · the picker (+15) | [T] confined atom R_c = j₁,₁²/8 to 10⁻¹⁰; Yukawa vs a tridiagonal oracle 10⁻⁷; the well 10⁻³; the rotor T = 4πI; ≥ 10 bound rows per shipped preset; [R] solve ms (worker) | +120 · Opus |
| SQUEEZED + CAT | the oscillator breathes in width; interferes with itself | `applySqueeze`; A/B + sum | [T] Var(z) = e^{±2r}/2; the Fock series; lost norm reported | +40 · Sonnet |
| INTER-SHELL STARK | a STARK field that ionises; the Stark map | the propagator hook with H = diag(E) + F·z | [T] exact diagonalisation; E_n + (3/2)nkF | +50 · Opus |
| CIRCULAR TO n ≈ 14 | circular states beyond the register's n = 6 | FACT fixed; a small producer, not the register | [T] the emulated-f32 twin vs mpmath; the device at the f16 floor | +10 · Sonnet |
| THE BEAD · THE LINE PLOT | ⟨r⟩ as a dot on every closed-form system; ψ along a ray as a line | `dipoleMatrix`; `sampleVoxel` along a ray | [T] hydrogen's ⟨r⟩ = (3n² − l(l+1))/2 | +50 · Sonnet |
**+270.** Mass scaling moves to 0.8.1 to keep the cut under the cap.

### D.13 · 0.8.1 Doubles (≈ +210)
**H₂⁺ THE DOUBLE WELL** (+80, Opus; `molecule.js:72 fieldModes` → K0 modes at ±R/2 through `Mode.ctr`; the tunnelling beat T = 2π/(E_u − E_g) = 16.0 a.u. at R = 2 in
1s-LCAO — labelled "1s-LCAO, not exact" (exact ≈ 14.4, Bates — UNVERIFIED); status NUMERICAL; oracle `tests/lib/twocentre.js`, the exact prolate-spheroidal solver) ·
**THE H₂ CURVE** (+50, Sonnet; RHF vs FCI dissociation on a canvas from `h2CurveTable`; PySCF at 0.74/3.00 Å to 10⁻⁸) · **RABI + LANDAU–ZENER on the Bloch sphere**
(+50, Opus; the song drive's two-level reduction; the chirp; P_LZ) · MASS SCALING (+10) · Lattice II presets: Hofstadter record, quantum walk, spin chain ≤ 8 (+20).

### D.14 · 0.8.2 Phase Space (≈ +150 + gated)
QHO Wigner with negativity (+40) · the coherence map (+30) · the A(t) trace over one REPEATS period (+30) · the uncertainty ellipsoid (+50) · gated on briefs: the
LOG-SPACE module for n = 30 (+40; §F-3) · the SEPARABLE module (L) · RU records (barrier scattering, double slit, two particles, GP) on the upload profile · the helium
revival (L; §F-15) · FLOW arrows/streamlines (M).

### D.15 · 0.9.0 Certification (0 `lab/` lines + tests + `tools/`)
N7 THE PUBLIC FACE (the nine rewordings; the three-metric line; the PySCF table; the strobe sentence conditional) · THE FIELD LAW on a device as a standing browser test
· THE PROVENANCE REGISTRY (`docs/`; the catalogue's oracle column; A9's archive question answered by Josh) · THE FINGERPRINT · Sol's certificates as GATED readouts ·
L1's R_m caption on ATOMS · the library study only after a profile wins (nothing merged).

### D.16 · 0.9.1 Platform (0 `lab/` lines) · D.17 · 1.0.0 λWAVES + the paper
As DRAFT 0 §D.16–D.17: wrappers in `tools/platform/`; iPad gated on MIR mobile and WebGPU in WKWebView (UNVERIFIED); the paper's seven sections written FROM the
certification table that each cut grew; the prior-art pass before any "novel".

### D.18 The lines table (per cut; every figure UNVERIFIED; recomputed from D.1–D.14)
| cut | +new | −named | net | vs ≈ 280 |
|---|---|---|---|---|
| 0.6.0 | 223 | 10 | 213 | fits |
| 0.6.1 | 233 | 0 | 233 | fits, tight |
| 0.6.2 | 189 | 0 | 189 | fits |
| 0.6.3 | 140 | 20 | 120 | fits |
| 0.6.4 | 205 | 85 | 120 | fits |
| 0.6.5 | 155 | 90 | 65 | fits |
| 0.7.0 | 185 | 0 | 185 | fits |
| 0.7.1 | ≤ 140 | ≥ 70 | ≤ 70 | gated |
| 0.7.2 | 180 | 70 | 110 | fits |
| 0.7.3 | 180 | brief | ≤ 180 | gated |
| 0.7.4 | 92 | 0 | 92 | fits |
| 0.8.0 | 270 | 0 | 270 | fits, tight |
| 0.8.1 | 210 | 0 | 210 | fits |
| 0.8.2 | 150 (+ gated) | 0 | 150 | fits |
| 0.9.x · 1.0 | 0 | — | 0 | — |
Σ new ≈ 2,412 (+ the two gated at their caps ≈ 2,730); Σ named − ≈ 275; fourteen cuts of ≈ 280 (≈ 3,900). The reserve (≈ 920 app-dead, UNVERIFIED) is never spent on
paper.

---

## E · THE ENGINE UPGRADE PROPER — what changes under the glass, tied to the row that pays
1. **THE KINDS TABLE + THE MEANING CHECK** (0.6.0 C7). 2. **SEPARATE PRODUCERS** (0.6.0 first; the law of B.5) — zero re-bakes; the dispatch edit and boot cost
priced per row. 3. **THE SITUATION-FIXTURE LOCK** (before 0.6.0; `tools/`). 4. **THE STREAM QUEUE** (0.6.4). 5. **THE OSCILLATOR BANK** (0.6.4; the instrument's first
sound). 6. **THE CARD ROAD** (0.6.5; `writeTexture`; re-upload on res change). 7. **THE RECORD KINDS** (0.7.0 VIBRATE, 0.7.2 LATTICE; `identityOf` covers them).
8. **THE FACTOR ROAD + THE C-MATRIX BINDING** (0.6.1). 9. **THE SKELETON OVERLAY** (0.7.0). 10. **MOLECULE-AS-LATTICE** (0.7.2, measured first). 11. **THE
CATALOGUE FILE** (0.7.4). 12. **THE GENERIC CENTRAL HAMILTONIAN** (0.8.0; the worker solve; the bound flag). 13. **THE PROPAGATOR HOOK OPENED** (0.8.0 inter-shell
STARK). 14. **THE CLOCK DECLARED** (every row). 15. **THE PRECISION LAW WITH METRICS** (0.6.0's tile; 0.5.4 P7; 0.9.0). 16. **THE WORKER PLANE'S HONESTY** (P6 → all).
17. **PERSISTENCE, FILM, PHONE, MODULATION, NON-VISUAL — per row** (B.3 ix–xiii). 18. **THE SUBTRACTION LEDGER** (B.6).
**NOT on the list, with the reason:** a WASM/Rust engine (no profile asks — A8); a kernel registry/compiler (same); a WebGPU FFT propagator (RU records first); density
fitting/THC (after the factor road is measured); the cyclotomic/DISK thread (closed 10-07); QWAVE-7's arithmetic wing (the spec's "future"); the finite-field engine
(S:1674); **the quasicrystal SIEVE and a "third basis" (A3)** — INTERFERENCE ONLY (0.6.0) is the exact subtraction a sieve would have to beat, Sol said the sieve
"doesn't guarantee a speedup" and λQ-CAD is "a research proposal" — a non-goal unless Josh says otherwise (§F-12); **cloning the C++ libraries (A9)** — reference
and citation only; a fork only after a benchmark wins (Sol's rule) and on Josh's word (§F-13).

---

## F · Josh's decisions (the starred answer stands if you say nothing; both research rounds' 23 starred defaults are taken unless flipped here)
1. **The plan's unit.** This master plan, then a BUILD PLAN per cut by the same method ★ — or briefs straight from this plan.
2. **The order.** Features-first (0.6.0 Beat Equalizer opens) ★ — or engine-first (0.6.0 = the factor road + the kinds table).
3. **Circular Rydberg.** n ≈ 14 at zero lock risk in 0.8.0 ★ — or n = 30 through a separate log-space module in 0.8.2 (+40). (DRAFT 0's "n = 24" was false.)
4. **`lab/sw.js` in the count.** Keep counting ★ — or exclude generated files.
5. **Electrostatics' place.** 0.6.5 ★ — or 0.7.0's first row.
6. **Kohn–Sham.** 0.7.3, LDA first, PySCF RKS the oracle, ChronusQ cited ★ — or hold until a brief names lines and a subtraction — or drop.
7. **The Central Lab's five.** The confined atom · the finite well · Yukawa · an anharmonic well · the rigid rotor ★ — or your five.
8. **The revivals.** H₂⁺ as the double well and the H₂ curve in 0.8.1 ★ (the physics, not the windows — your 10-09 "H2 and Electrostatics should go" stands for the
   windows); helium as a lead; or none.
9. **The names** in §A ★ — yours.
10. **The platform road.** PWA + wrappers, iPad gated on MIR mobile, zero `lab/` lines ★.
11. **The paper's thesis.** Observable-certified reconstruction; the catalogue's table grown per cut ★.
12. **A3 — the quasicrystal sieve and a "third basis".** A non-goal on this ladder; INTERFERENCE ONLY and the 2-D quasicrystal lattice are what ships ★ — or a
    research row (a `tools/` experiment with Sol's own test order SYMMETRY SIEVE → Q-SIEVE → λQ-CAD) before 0.8.0.
13. **A9 — the C++ libraries.** Study, cite, run as references; no clone until a benchmark wins ★ — or name one library to fork now (which, and for what row).
14. **0.0.X's meaning.** The five 0.6.x are FEATURE cuts, each a local tag ★ — or 0.0.X = a merged worktree (patch), with the features re-grouped.
15. **Audio out.** The chord in 0.6.4, OFF by default behind a consent switch ★ — or wait for MIR to offer an output.
16. **Separate producers, zero re-bakes** (the duplicated WGSL named and counted) ★ — or branches in the locked text with a re-bake budget of one.
17. **The changelog of major features** at every cut (`tools/changelog.mjs`) ★.
18. **For Astra and Sol, through you:** Round 1's three lines + Round 2's two + "the catalogue's oracle list (C.1–C.4) is the set of numbers the app will certify; a
    certificate of yours that produces one at run time becomes a GATED readout in 0.9.0."

## G · What is not claimed; what is open
No line is measured; no row built; every GPU number UNVERIFIED on a device (the module's boot cost; `writeTexture`; denormal flush — n ≈ 14 assumes flush-to-zero;
the phone). RM on a device; RC's worker solve timing; the exact H₂⁺ energies (Bates) recalled, not re-derived; LZ's 10⁻³; N4's live timing; the tabulated-H kick on the
main thread. No prior-art pass yet for the song's sonification, the equalizer mapping or the breathing road. The platform's feasibility. Nothing resumes Sol's
programme; every gate is the app's own oracle.

## H · Josh's words this round, verbatim
> Wow, let's wrap up here. We will continue in this account session so don't worry about Yan but we will definitely compact to get ready for an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations.

> Good morning Claude! Let's continue where we left off

## I · The record of the round
`NACRE.md` `86c486c` → `census/SYSTEMS.md`, `census/REPRESENTATIONS.md` (Sonnet 5.5 readers) → `PLAN-DRAFT-0.md` `542aa35` + §J `37b79d3` → `REVIEW-SONNET-0.md`
(Sonnet 5.5 @ high; `measure/sonnet0-*`: WGSL count, Numerov on the finite well/Yukawa/confined atom, f32 circular limits, line sums, 38/38 citations, the eleven asks
3/6/2, the Rabi oracle) → this DRAFT 1 → `AUDIT-OPUS-1.md` → DRAFT 2 → `REVIEW-SONNET-2.md` → DRAFT 3 (Josh) → `PLAN.md`.
