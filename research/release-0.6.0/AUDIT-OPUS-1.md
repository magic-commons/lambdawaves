# AUDIT-OPUS-1 — of PLAN-DRAFT-1 (THE ENGINE PLAN 0.6 → 1.0) · Opus 5.5 @ high · 2026-10-11

Tree: `.claude/worktrees/sos-s0` @ `c262fcf` (read-only; `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` = **27,989**, cap 28,222 → **233** left, KNOWN — DRAFT 1's
figure holds). No browser, no GPU, no lock run, no script of Sol's, the pilot's or OpenAI's. Scripts + JSON beside this file, `opus1-*` (six measurements, §AO1·7).
**How to read this file.** It is DRAFT 1 in full. Every change is marked inline: *(AO1: …)* adds or re-cuts, ~~struck~~ deletes (with the reason in the AO1 note beside
it). Unmarked text is DRAFT 1's, kept. My own sections are **AO1·1 … AO1·9** at the end, then "What I measured, what I changed, what I could not verify" and the hand-back.
Tags as the round's: KNOWN · DERIVED-HERE · MEASURED · UNVERIFIED.

**The audit in seven lines (for Fable).** (1) Josh's "1a₁, 1b₂ on the knob" is ALREADY LIVE (`chemview.js:75`; 52/52 named, MEASURED) — strike it as new, tell him it's
there. (2) The RC road should be ATOM's own log-mesh solver (`atoms.js` solveL), not a second Numerov table builder: 4× faster, bound flag free, ≈ 54 lines not 90.
(3) The STREAM queue is not new engine: hydrogen's drive is the TD-CIS drive's stepper and its init·run·set ops (`mathworker.js:383–445`) — 2 ms per 100 steps at 91 labels.
(4) RU by `writeTexture` is ≈ +33, not +15, and fights the governor; a small lazy pass over a storage buffer is the same price and lets the governor work. (5) The
real engine prerequisite is THE FIELD OWNER — one predicate replacing four hand-written stand-downs (`rack.js:478`, `:738`, `moleculeMode`, `molFieldView`) — without it
a lattice (RM) paints under the hydrogen overlays. (6) Every new producer compiles LAZILY (the `specCache` precedent, `field.js:914–925`): zero boot cost becomes a node
[T]. (7) The tree's own BUILD record: additions land at 0.6–2.0× their estimate, named subtractions deliver 0.5–0.8× — D.18 is re-cut to "≤ 200 planned a cut", and
0.6.1, 0.8.0 and 0.8.1 move rows.

---

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
| **0.6.0** | **Beat Equalizer** | the hydrogen chord in SPECTRUM, magenta/orange/yellow; turn a beat up or down; the three honest splits; "repeats every 1.094 ps" *(AO1: re-derived — lcm(2n², n ≤ 6) = 7200, T = 14400π a.u. = 1.0943 ps, `opus1-g`)*; nodes stand down honestly; "this is what decoherence looks like" | the FIRST SEPARATE PRODUCER behind the texel (the six-accumulator module) *(AO1: compiled LAZILY on first use, its WGSL DERIVED from the locked text by anchors, not copied — AO1·2)*; ~~the MEANING CHECK~~ *(AO1: THE FIELD OWNER — the meaning check widened to the one predicate every overlay, reader and stand-down asks; AO1·1)*; the period guard; the situation-fixture lock |
| 0.6.1 | Factor Road | C₆₀'s density for the first time *(AO1: your own "maybe a bucky-ball as our next milestone", N:31–34 — say so here)*; VALENCE cheaper for heavy atoms; "symmetry: D₆h (still) · Cs while the RING plays"; ~~the ORBITAL knob reads 1a₁, 1b₂~~ *(AO1: ALREADY LIVE since 0.4.0 S1 — MOLECULES › ORBITAL reads `1b₁ · HOMO` (`chemview.js:75` orbFmt → `names.js` orbitalName); 52 of 52 live solves named, 11 point groups, 0 refused, MEASURED `opus1-f-names`. Your N:23–26 is answered; this plan must not sell it twice)* | the third contraction (orbitals in, density out, no size cap); the symmetry certificate |
| 0.6.2 | Honest Flow | FLOW's arrows conserve charge; AS COMPUTED and BALANCED with their measured numbers; the DEFECT view | the face-flux current; the 9-pattern tabulation in a worker |
| 0.6.3 | Event Census | VORTEX names every event (line · birth · death · saddle); the nodal lines of Y_lm on a sphere | the spacetime classifier; the ÷4/÷8 still-only savings behind a flag |
| 0.6.4 | Hydrogen Song | drop a track; the atom tunes to its tonic with RATE; the chord SOUNDS (audio out, off by default); a film of the song you can share | hydrogen's FIRST DRIVE; ~~the first STREAMING worker queue~~ *(AO1: the molecular drive's own Strang stepper and init · run-to-t · set ops, handed hydrogen's 91 labels — one stepper for both drives, no new queue; MEASURED `opus1-e`)*; the oscillator bank; the flash law |
| 0.6.5 | Electrostatics | the molecule's potential as a second cloud, total and per orbital; water's lone pair as a sign; a live probe in volts | the CARD road (a worker-built volume uploaded once) *(AO1: uploaded to a storage buffer and drawn into the texel by a small lazy pass, so the governor's grid notch re-draws it for free — not `writeTexture`; AO1·3)* |
| **0.7.0** | **Vibrate** | water and benzene breathe in their true normal modes; the nuclei as beads and bonds you can see move; a spin-½ on a Bloch sphere; molecules under shaped pulses | the first NEW RECORD KIND; the skeleton overlay; the first non-spatial system |
| 0.7.1 | Open Shells | O₂, NO, H₂⁺; H₂ dissociates; the spin density as a signed cloud | UHF/ROHF beside RHF (its brief names its lines) |
| 0.7.2 | Lattice | a chain, ring or square lattice, disorder, a flux, the Aubry–André knob, SSH edges, graphene, an Ammann–Beenker quasicrystal — as site bars and, if measured, as a volume with phase as hue | the first NO-TEXEL system; "molecule-as-lattice" |
| 0.7.3 | Kohn–Sham | the same molecules under LDA beside RHF, each with its PySCF number | a grid, a functional, the RKS oracle; ChronusQ a reference, never source |
| 0.7.4 | Shelves | the catalogue as the front door: every system in one picker with its status word; the library in shelves (periodic table · heavy atoms · small biology · lattices) | one catalogue data file read by the picker, the MODEL sheet, the README table and the paper |
| **0.8.0** | **Central Lab** | hydrogen in a hard sphere (pressure ionisation), a finite well, a screened Coulomb, an anharmonic well, a rigid rotor; squeezed and cat oscillator states; a STARK field that ionises; ~~the expectation bead~~ *(AO1: the bead moves to 0.8.2 — the cut is over the cap at the tree's own overrun, AO1·5)* | a GENERIC central-potential Hamiltonian ~~through the Numerov road~~ *(AO1: through ATOM's own log-mesh l-channel solver — `atoms.js:172` solveL, every shell of one l from one matrix, the bound flag its Sturm count; MEASURED `opus1-b`)*; the inter-shell propagator |
| 0.8.1 | Doubles | ~~H₂⁺ as the double well with tunnelling (1s-LCAO, labelled);~~ *(AO1: the 1s-LCAO beat is 11 % off the exact one (F7) and the cut is over the cap at the tree's overrun — H₂⁺ becomes a lead, §F-8)* the H₂ dissociation curve, RHF vs FCI; Rabi and Landau–Zener on the Bloch sphere; positronium and muonic hydrogen by one knob | the revivals (the deleted physics, not the deleted windows) |
| 0.8.2 | Phase Space | Wigner for the oscillator with its negativity; the coherence map; the autocorrelation trace; the uncertainty ellipsoid; circular Rydberg to n = 30 if you say so | representations; the log-space module (gated) |
| **0.9.0** | **Certification** | README, CITATION and ABOUT say what is measured, with the metric; the provenance registry; the fingerprint | the GPU-vs-CPU field law on a device; Sol's certificates as gated readouts |
| 0.9.1 | Platform | the wrappers (desktop; iPad gated on MIR mobile) | zero `lab/` lines |
| **1.0.0** | λWAVES | the standalone; the paper beside it | — |

**What "ultimate engine upgrade" means here, honestly.** Not a rewrite. The tree has the right shape: f64 truth on the CPU and in workers; three producers writing one
(re, im) texel; a presenter of 24 copies; records with PySCF oracles. The upgrade makes that shape EXPLICIT and EXTENSIBLE — a kinds table the presenter checks, a
worker plane that can stream and hold, a record kind that can carry modes or sites, a card road, a generic central-potential Hamiltonian, a catalogue file, a
precision floor with its metric, a lock statement per row — and fills it with systems. The locked road is never edited; new producers are separate pipelines; THE
LOCK is re-baked ZERO times on this ladder. The rows sum to ≈ 2,400 new lines over fourteen cuts (≈ 3,900 of headroom), with ≈ 275 of named subtraction; every cut
below is at or under ≈ 280 or is gated on a brief that names its own. *(AO1: the tree's own record says to plan lower — eight BUILD files show additions landing at
0.6–2.0× their estimate (C6 project-store 436 vs 220, C7B's card road 91 vs 45) and named subtractions delivering 0.5–0.8× (C7 −716 vs −1,500, D1 −35 vs −70),
MEASURED `opus1-g`. So each cut is planned at ≤ 200 new, and a subtraction counts at half until its BUILD measures it; D.18 carries both columns. And "worker plane
that can stream" is withdrawn below: the drive already streams.)*

**Four things to know before §F.** (1) Both research rounds' starred defaults are taken (twenty-three decisions); flip any. (2) Two of your eleven asks have no row and
are put to you plainly: the quasicrystal SIEVE and a "third basis" (A3), and cloning the C++ libraries (A9). (3) The paper's thesis is already visible — *observable-
certified reconstruction of interactive quantum wavefields in WebGPU* — and its table is built PER CUT from the catalogue, not assembled at 0.9. (4) 1.0.0's
standalone is a wrapper around the PWA and waits on MIR's mobile upgrade (your C:5397); no `lab/` line is spent on it. *(AO1: (5) One of your standing asks is already
done: "The knob currently reads HOMO-1, HOMO-2 … let it read like 1a1, 1b2" (N:23–26) — MOLECULES' ORBITAL knob has read `1b₁ · HOMO`, `3a₁` since 0.4.0, for all 52
live molecules. (6) Two of your words this plan answers late or not at all, put in §F: "maybe a bucky-ball as our next milestone" (the factor road is the SECOND cut,
§F-2) and "Wave indexing the presolved orbitals … dynamic waves with true electrostatics" (N:27–29; a lead, §F-19).)*

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
   **RC — the CENTRAL-POTENTIAL road** inside M: V(r) → ~~Numerov (`cornell.js`)~~ *(AO1: ATOM's own solver — `atoms.js:172` solveL, the log mesh + Sturm bisection +
   inverse iteration that already builds every element's 40 × 256 table, `atoms.js:502` atomRadialTable)* → the ~~36-row~~ *(AO1: 21-row — the labels need n ≤ 6,
   21 (n, l) pairs; the table has 36/40 slots)* radial table → kernel space 6; no WGSL. It needs ONE generic Hamiltonian
   first (μ = 1, rmax per row, a bound/virtual flag per row, `configure`/`domainFor`/`labelOf`/`unit`, the solve in the worker with the table uploaded — ~~≈ 90
   lines; F5~~ *(AO1: ≈ 54 lines on ATOM's solver — export solveL and the table writer (+4), the solve (≈ 18), a HAMILTONIANS entry shaped like `cornell`'s 14 fields
   (≈ 16), the bound flag = the Sturm count at E = V(∞) (≈ 3, free), five potentials (≈ 7), one worker op (≈ 6); hand count, UNVERIFIED until built. ATOM IS the
   generic central Hamiltonian with the SCF in front: the RC row removes the SCF, it does not add a second solver beside `cornell.js`)*), after which each potential is
   1–3 lines. Accuracy: 10⁻⁷…10⁻¹⁰ on smooth V (Yukawa 4·10⁻⁷ Eh vs a tridiagonal oracle; the confined atom's
   critical radius to 10⁻¹⁰), O(h) on a step (the finite well 1.1·10⁻² at N = 4000 — a grid point ON the step, gate 10⁻³) — MEASURED `sonnet0-b*`, `sonnet0-h`.
   *(AO1, MEASURED `opus1-b-rc-generic`, M = 4000: the log mesh solves 21 Yukawa rows in 32 ms against Numerov's 137–148 ms (4.3×), hydrogen to 4.4·10⁻⁷ against
   1.7·10⁻⁵, the same bound counts (21/9/5/3/1 at λ = 0.02/0.05/0.1/0.2/0.5 of the 21 labels), the finite well to 1.4·10⁻³ against 7.9·10⁻³; but the confined
   atom's R_c only to 1.6·10⁻⁶ (Numerov 10⁻¹⁰). So the confined-atom gate is 10⁻⁶ on the shipped solver, 10⁻¹⁰ in the Numerov TEST oracle — the test keeps
   `cornell.js`' numerov as its independent second solver (S:2096: never the engine's formula as its own oracle).)*
   Screened wells bind few rows (Yukawa 23/9/5/3/2/1 of 36 at λ = 0.02…0.5): depths are chosen so ≥ 10 rows bind, or the system is a preset, not a row.
2. **S — SHELLS + A COEFFICIENT BUFFER** with three contractions: the tile on D (locked for three states), the direct road on one c (unlocked), the FACTOR road on
   a C matrix (0.6.1; `molMatBuf` 65,536 B its first limit). A BREATHING molecule = moved centres + D(Q) (0.7.0); Kohn–Sham = another D (0.7.3); open shells
   = Dα + Dβ summed (0.7.1). **RM — "molecule-as-lattice"** inside S: one narrow s-shell per site, the register as the kind-2 COMPLEX ORBITAL (amplitude + phase as
   hue) through `setMolecule({nAO, half, shells})` + `setMoleculeMatrix(M, {kind: 'orbital'})` and a session product `{kind: 'orbital', AO vector}` from a new model
   id — NO SCF injection (F6: the `atomsSha256` rule binds library records and the ORBITALS window, not the field); the limit is `MOL_LIMITS.shells = 256` → ≤ 16×16
   sites. UNVERIFIED on a device; the audit's measurement. *(AO1, MEASURED `opus1-c-rm-session` (node, the real session + `packMolecule`): an 8×8 lattice (tile 2) and
   a 16×16 (ORB_WGSL) adopt and publish a complex orbital with no SCF; 17×17 is refused ("more than 256 shells"). Two costs the plan missed: (a) `MODEL_RANK` is a
   CLOSED list (`molecular-session.js:41`) — `register('lattice')` throws; +1 line and a rank decision (below `tdhf`/`states`, above `ground`?); (b) the session owns
   the MOLECULAR volume only: `rack.js:478` overlayDomain keys on `app.state.chem.on`, so a lattice adopted while MOLECULES is off draws under VORTEX/PARTICLES/KEPLER
   reading the hydrogen register. RM needs THE FIELD OWNER (AO1·1) first; it is 0.6.0's row, so 0.7.2 inherits it. Device cost: a 256-site complex orbital re-dispatched
   every frame is C₆₀'s ORBITALS-register road (300 AO), UNVERIFIED for a lattice's 256 one-primitive shells.)*
3. **W — NO TEXEL:** lines, sites, bars, spheres, captions from f64 in a worker, drawn on an overlay canvas through `toScreen` or on a window canvas. FLOW's arrows,
   the lattice's bars, the Bloch sphere (ORBIT's painter), the bead, the H₂ curve, the readouts. Law (REPRESENTATIONS §5-2): **a new CPU reader is a `READERS`
   entry with a `may()` gate** (rack.js:148, :732) or it is not governed.
4. **RU — THE CARD:** a worker-built volume uploaded ONCE (never a frame) — ~~`COPY_DST` on `psiTex`, the worker resamples its 64³ card to the current `res` and packs
   f16, `queue.writeTexture`, a stats word (`stats[slot]` = max ρ, else the picture is blank), `refValid = false`: ≈ +15 JS, 0 WGSL, no pass (F4 — DRAFT 0's "+35
   compute pass" withdrawn).~~ *(AO1, re-cut, MEASURED static census `opus1-a-boot-card`: `writeTexture` is not +15. (a) A card must OWN the volume in `frame()` —
   today two arms, `molOn` → `encodeMolecule` else `encodeCompute` (`field.js:1318–1328`) — or the next RECONSTRUCT overwrites it: a third arm on the locked dispatch
   path, the same F3 risk the plan prices for the equalizer and not here. (b) A card has no GPU producer, so after `setResolution` destroys `psiTex` (`:1039`) the MAIN
   thread must keep the 64³ f32 card and re-resample it on every governor notch over `RES_LADDER = [64, 96, 128]` (`controller.js:62`) — 0.26/0.9/2.1 M trilinear taps
   on the frame thread — or the governor is pinned while a card owns the field. (c) `stats[0]` written from the CPU. Honest ≈ +33 with a frame-thread resample. THE
   ROAD AO1 TAKES: DRAFT 0's pass, made a law-abiding producer — the worker's 64³ f32 card into a STORAGE BUFFER (1 MB, uploaded once), a ≈ 20-line WGSL pass that
   trilinear-samples it into `psiTex` at whatever `res` is current and `atomicMax`es `stats[slot]` like every producer, its pipeline built LAZILY; `setResolution`
   sets `cardDirty` exactly as it sets `molDirty` (`:1052`). ≈ +35, 0 frame-thread work, the governor free; the same third arm in `frame()` (lock PRECONDITION). It is
   also a separate producer, so B.5's law covers it with no exception.)* Two traps named: `setResolution` destroys `psiTex` (field.js:1038–1052) so a card RE-UPLOADS
   on every res change the governor makes *(AO1: the pass re-dispatches from the buffer instead)*; and
   bytes are 8 B a texel (64³ = 2.1 MB, 96³ = 7 MB, 128³ = 16.8 MB). Gate [T] on a device: a CPU-generated 1s volume through the card road hashes within one f16 ulp
   of the kernel's own `fieldDigest` — which doubles as the field-law test. *(AO1: through a trilinear resample the gate is "within the resample's own error at the
   kernel's grid" — exact only when card res = field res; state the gate at 64³ = 64³, the phone's grid.)* First use 0.6.5; then every record-shaped picture (the Laughlin density, Hofstadter's,
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
`getCompilationInfo`'d at boot, field.js:869–882), pipelines, MB of storage, frame ms at the governor's lowest tier, and the governor's rule for it *(AO1: the boot
half becomes a node [T]: a new producer is built on FIRST USE (`createComputePipelineAsync`, as `specEntry` builds the 24 render copies, `field.js:914–925`), so the
boot block keeps exactly its 8 modules (compute, render, line, 4 χ tiers, ORB — `:869–875`, each awaited in sequence `:878–880`) and a source-count test pins that.
The frame-ms half stays [R] — and is UNVERIFIED for any phone: `research/device-reports/` holds nine iPad-Safari reports of 0.3.0-alpha (2026-09-25/26; 16 KiB
workgroup memory → the cap-128 tier at 32 lanes) and no phone at all; the phone's first-run grid is 64³ (`first-run.js:39`). Each cut's [R] is "the iPad report
re-run, or UNVERIFIED")*; **(xii) its
MODULATION targets** — which knobs register in `mod-port.js` (never `lab/mir/**`), with ranges and what the flash guard sees; **(xiii) its NON-VISUAL line** — a
label for the aria sentence, and audible output OFF by default.

### B.4 The worker plane
Four request/reply queues with an 8 s timeout that falls back to the frame thread; 0.5.4 P6 makes chem REFUSE after it has answered. This plan ~~adds **one stateful
STREAM queue** (0.6.4; c_a(t) a frame; failure = hold and say so)~~ *(AO1: adds NO queue. A stateful stream already exists: the TD-CIS drive holds its state in the
`chem` worker and the window asks `chem.drive.run({to: t, maxSteps})` each frame, with `lag` reported and `chem.drive.set` for live knobs (`mathworker.js:383–445`,
`statesview.js:340–395`). The song is `h.drive.{init, run, set}` on the same request/reply shape and the same Strang step (`driveStep`, `:400–416`) with its two
inputs made arguments — MEASURED `opus1-e-song-stepper`: 91 labels, 2.0 ms per 100 steps, unitarity 2·10⁻¹¹ after 8,435 steps. Failure = hold and say so stands — it
is P6's law, not a new queue's. A8's "unified engine" is honoured by ONE drive stepper, not two)* and sends every heavy build off-thread: the ESP card (0.6.5), the central-potential solve (0.8.0 —
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
  every cut runs the lock as a PRECONDITION and prices the dispatch edit and the boot-time compile in its row.** *(AO1: two refinements. (1) THE DUPLICATED WGSL is
  avoidable: the tree already DERIVES 24 specialised render shaders from `RENDER_WGSL` by anchored substitution (`specRenderWGSL`, `once(...)`, `field.js:551–558`,
  a drift throws and falls back). The equalizer module is derived the same way from `COMPUTE_WGSL` — keep the space-0 branch, replace the accumulate/store with the
  6×6 form — so the locked text is untouched AND nothing is copied; subtract-don't-add and the lock agree. UNVERIFIED that the anchors are unique in COMPUTE_WGSL; the
  brief checks it, and falls back to the copy if not. (2) Every new producer compiles LAZILY (B.3-xi): the boot path the lock and every visitor take is unchanged.)* A new VIEW/STYLE NAME turns `--check` red by key
  set alone (:174–175, :264–265) — the row carries the `tools/` line that teaches `styles()` to skip fixture-missing keys. The dead spaces 4–5 and `Mode.ctr` STAY
  (≈ 40 lines, counted; two are hooks for revivals). **Before 0.6.0 touches the dispatch path: a SITUATION-FIXTURE LOCK** (B8) — five or six fixtures (STARK,
  ZEEMAN, a kick, the A/B mix, the drive at a fixed t) recorded on the base in `tools/perf/digest-lock.mjs`' state set, `--check` 0/0 per cut; `tools/` only.
- **The deliberate exception, named once:** no row on this ladder re-bakes. If Josh wants circular Rydberg to n = 30 (0.8.2), it is a separate module, not a branch.

### B.6 The subtraction ledger (per cut; measured by `wc` in each BUILD; settled by the review's F9) *(AO1: counted at HALF until measured — the tree's named subtractions have delivered 0.48–0.78
of their estimate, `opus1-g`; and `molecule.js` is not app-dead: `h2ci.js:51` imports `overlapS`/`EV` from it, so keeping it is not a choice to make)*
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
that exists. *(AO1: split it. The ROWS land in 0.6.0 as a `tests/` data file (`tests/catalogue.json`, 0 `lab/` lines — the line law does not count tests) with the
node test asserting every row's oracle test exists: that is the only way M10's "certification table grows PER CUT" is true from the first cut. 0.7.4 then moves the
file into `lab/` and points the picker, the MODEL sheet and the README generator at it. Back-filled from SYSTEMS §1's 30 rows (KNOWN).)*

Legend — today: LIVE · TEST · GONE · ABSENT. Road: M / RC / S / RM / W / RU. Lines: S ≤ 30 · M ≤ 100 · L ≤ 250 · XL.

### C.1 The exact register and its situations (hydrogen; EXACT ANALYTIC)
| system / situation | today | road | oracle | representations (today → added) | cut |
|---|---|---|---|---|---|
| hydrogen 91 states n ≤ 6, 31 presets; Z = 1…6 (knob); ATOM for Z = 7…36 | LIVE, locked (9 states) | M0 | closed forms; the field law | CLOUD/PHASE/Re/Im/Δρ · PARTICLES · VORTEX · SHADOW · PLANE · WIGNER · RADIATION · CALCULUS · SPECTRUM · REPEATS | — |
| STARK (Z = 1, intra-shell) · ZEEMAN (orbital, universal) · per-label RATE · PROPAGATOR (Sturmian only) · A/B Rabi mix (a toy; no oracle) · KICK/BOW/DRAG | LIVE | M0 | closed forms; **A/B Rabi gets its node oracle: Ω = E₀⟨1s\|z\|2p₀⟩ to ≈ 10⁻³ for E₀ ≤ 3·10⁻³ (MEASURED `sonnet0-g-rabi`)** | the same | 0.6.0 (oracle) |
| **the equalizer** (jitter · comb · pulse · a song's autocorrelation; three splits; interference only) + **dephasing** ("the beats fade, the shells stay" — a jitter table is a random-clock Lindblad fixed point, Milburn 1991) | ABSENT | M (a SEPARATE six-accumulator module; the signed ROOT stored, view 'real' reads it, C7 tags it "signed-root", not Δρ's kind — C9) | PSD accept/reject; ρ′ vs the f64 contraction 10⁻¹² in a node twin, ≤ 5·10⁻⁴ on the device; within-shell static, beats zero-mean | BEAT grid · signed volume · PURITY · nodes stand down (C1) | 0.6.0 |
| the period sentence + 2⁻⁵³ guard · the flash law | PARTIAL | W | arithmetic; 0/20,000 false (MEASURED) | INFORMATIONAL; labelled RATE | 0.6.0 |
| **a song drives the atom** — hydrogen's FIRST drive | ABSENT | M + ~~STREAM~~ *(AO1: the TD-CIS drive's stepper + ops)* | ⟨1s\|z\|2p₀⟩ = 128√2/243 (the tree's: 1.4·10⁻¹⁵); unitarity ~~10⁻¹²~~ *(AO1: 10⁻¹⁴ a step, ≤ 10⁻¹⁰ a run — 2·10⁻¹¹ after 8,435 steps MEASURED `opus1-e`)*; the 179.049 Hz resonance; the alias test; the song's E₀ ≤ 0.01 gets its own number *(AO1: it must — at E₀ = 10⁻² the 91-label drive departs from the RWA formula by 8.8·10⁻³ while dt = 0.5 and 0.1 agree, so the gap is physics, not the integrator; the oracle is a dt-halving re-solve, not RWA)* | DRIVEN kind · pitch map · the chord sounds · film-safe (B6) | 0.6.4 |
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
| **THE CENTRAL LAB** — the generic Hamiltonian + five contrasting potentials: **the confined atom** (hydrogen in a hard sphere; R_c = j₁,₁²/8 = 1.8352463 to 10⁻¹⁰ MEASURED *(AO1: in the Numerov test oracle; 1.6·10⁻⁶ on the log-mesh solver the app ships, `opus1-b`)* — the first and best-gated system, B3) · the finite well (a grid point on the step; 10⁻³) · Yukawa/screened Coulomb (λ_c ≈ 1.19 known; 4·10⁻⁷) · the anharmonic/soft-core well *(AO1: no closed form — its oracle is the second solver (Numerov) at 2N, named)* · the rigid rotor/ring (a narrow shell; ~~T = 4πI exactly~~ *(AO1: NOT exact on this road — a finite-width radial shell adds a radial zero-point and centrifugal stretching, so E_l − E_0 = l(l+1)/2I only to O((w/r₀)²); gate the ladder ratio at the width's own order, and say "rotor-like")*). Presets without rows: Gaussian well, delta shell, power laws, Coulomb + linear, radial Morse | ABSENT | RC | as listed; a bound/virtual flag per row | 0.8.0 |
| the separable product (cube, 2-D/anisotropic oscillator, 1-D box faces) | ABSENT | M (a SEPARATE module; L) | closed | 0.8.2 (gated on a brief) |
| two particles in 1-D · barrier scattering · double slit · Gross–Pitaevskii · Landau/Fock–Darwin · Laughlin · kicked rotor · quantum walk · Lindblad | ABSENT | RU records (after 0.6.5) · W | closed/expm | 0.8.2 candidates gated on the upload profile; the rest leads |

### C.3 Molecules (NUMERICAL; the records with PySCF oracles)
| system / situation | today | road | oracle | cut |
|---|---|---|---|---|
| 54 live STO-3G · 18 with 6-31+G\* · 38 records (C₆₀ a frontier record) · TD-CIS · RT-TDHF δ-kick · FLOW | LIVE (3 locked) | S | PySCF ≤ 7e-9 Eh | — |
| the symmetry certificate · ~~the orbital NAMES (1a₁, 1b₂) on the knob (`names.js` reads them already; C5)~~ *(AO1: the names are LIVE on the knob and the MO-REGISTRY ladder, `chemview.js:75`, `orbitalsview.js:161–166`; 52/52 MEASURED)* | PARTIAL *(AO1: the certificate; the names LIVE)* | W | 24 ops to 10⁻¹⁴; the character test | 0.6.1 |
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
| **Ammann–Beenker / Penrose** (a 2-D quasicrystal; Josh's A2/A3 made a lattice, B4) | ABSENT | RM | Bragg peaks at silver/golden positions; IPR scaling *(AO1: on a ≤ 256-vertex PATCH — the RM ceiling, measured — "IPR scaling" is not a gate (no size range to scale over); the oracle is the patch's own f64 diffraction from its coordinates (8-fold peaks at the silver-ratio positions) and the spectrum's bipartite ± symmetry. Say "a patch", never "the quasicrystal")* | 0.7.2 |
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
(GPU-vs-CPU, the lock, ms/s)**; *(AO1: the verifier of every cut RUNS: `bash test.sh node` (the node half), `node tools/new-project.mjs --check`,
`tools/serialize-bytes.mjs`, `tools/settings-probe.mjs`, the boot-module source count (AO1·2) — and hands Josh ONE line for the human half: "run the lock ×2 + the
fixtures on this machine". Each new knob proves its undo row: one `tests/history.browser-test.mjs` case per PROJECT key the cut adds, because the undo ring reads
`serialize({scope:'edit'})` and a key that is not default-absent moves every history row)*; the oracle test of every row asserted to exist (the certification table grows PER CUT, M10); **`tools/changelog.mjs` writes the
major-feature changelog Josh asked for on 10-09 (M7)**; a local cut on Josh's word; NO push. **Each release gets its own BUILD PLAN by the nacre method** before its
briefs (Round 2 §G); this plan fixes rows, order, gates and budgets; the build plan fixes files, commits and harness. **Josh's 0.0.X (A11): "merged/committed
worktrees/Claude sessions that build into it" — this plan reads the five 0.6.x as FEATURE cuts, each a local tag; if you meant patch = a merge, say so (§F-14).**

### D.0 Preconditions (not this plan's rows)
0.5.3 Rack Tune (resume) · 0.5.4 Contract Layer (its DRAFT-3 awaits Josh; P1 identity, P3 oracle/status, P4 `statusOf()`, P6 the worker refuses, P7 precision + the
field law). Rows below ASSUME P4, P6, P7; where 0.5.4 cuts without one, the first row that needs it carries it. **Also before 0.6.0: the SITUATION-FIXTURE LOCK (B.5;
`tools/` only) and the CLAUDE.md LEGACY paragraph corrected (stale: all five windows deleted; 0 `lab/` lines).** *(AO1: the correction must be exact —
CLAUDE.md names "QCD, HELIUM, H₂, ATOMS and ELECTROSTATICS"; the deleted five are QCD, H₂⁺ (`molecule`), HELIUM, H₂, ELECTROSTATICS, and ATOMS is LIVE again since
0.4.0 S3 (`docs/LEGACY-WINDOWS.md`:1–4). CLAUDE.md is Josh's instruction file: the row shows him the two-word diff, it does not just land. Also A10's "benchmarks
first" (profile T_prepare…T_present, C:4790–4841): one `tools/perf` profile of today's base, 0 `lab/` lines, so every cut's ms/s pair has a named baseline.)*

### D.1 · 0.6.0 Beat Equalizer (≈ +223 − 10 = +213)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| C7 ~~THE MEANING CHECK~~ *(AO1: THE FIELD OWNER)* | a refusal sentence when a kind and a VIEW disagree *(AO1: and no overlay ever draws a register the field is not showing)* | one assertion where the texel is bound (`setMoleculeMatrix`/`setSpace`), the stand-downs derived; `VIEW_SAY` truthful *(AO1: ONE `owner()` — {id, kind, views, theorems} — read by `rack.js:478` overlayDomain, `rack.js:738–746` hydroReader, `moleculeMode` and `molFieldView` (`windows/molecules.js:15–45`), the four hand-written stand-downs it replaces (REPRESENTATIONS §5-3); the equalizer (C1), the lattice (RM) and the card (RU) each enter as an owner, not as a fifth expression)* | [T] every (kind, VIEW) pair agrees; the equalizer's "signed-root" refuses PHASE *(AO1: [T] node: a table of (owner × overlay/reader) → may-draw, asserted against the four old expressions on every state they cover today — byte-for-byte the same answers before the first new owner arrives)* | ~~+4 · Sonnet~~ *(AO1: +20 − 8 · Opus — it is the frame-path gate every later producer rides; a fresh verifier)* |
| C2 THE PERIOD GUARD | no false period | refuse at max v/g ≥ 2⁵³ | [T] 0/20,000; 17,306 kept (MEASURED) | +1 · Haiku |
| M2 + M2′ THE EQUALIZER + THE SPLIT | the BEAT grid; tables on six shells; presets; PLAIN SUM · WITHIN-SHELL · BEATS · INTERFERENCE ONLY; PURITY; the labels gate | **a SEPARATE compute module** (≈ 55–65 WGSL: the space-0 evaluation + the 6×6 form + Γ binding + sign store — MEASURED `sonnet0-a`) *(AO1: DERIVED from COMPUTE_WGSL by anchors, ≈ 20 lines of substitution instead of ≈ 60 copied, B.5; built on first use)* + its JS (pipeline, layout, Γ/shell-index packing, the dispatch select in `encodeCompute`, the CPU twin ≈ 85 *(AO1: the CPU twin is a TEST — `tests/`, 0 `lab/` lines — unless the app reads it; it should not)*); the signed ROOT stored; view 'real' reads it | [T] PSD accept/reject; ρ′ vs the f64 contraction 10⁻¹² (node twin); within-shell static 10⁻¹⁵, beats zero-mean 10⁻¹⁶; [T] device: ρ′ vs twin ≤ 5·10⁻⁴; [R] +4–5 % a frame; ~~[R] boot ms with the module~~ *(AO1: [T] node: the boot block still creates 8 modules)*; PRECONDITION the lock + fixtures 0/0 | ~~+150~~ *(AO1: ≈ +125, the copy and the twin out)* · Opus |
| C1 NODES STAND DOWN | VORTEX/PARTICLES grey out under Γ ≻ 0, λ_min ≥ floor | a flag from the table state | [T] ρ′ ≥ λ_min Σ\|Ψ_n\|² | +6 · Sonnet |
| ~~C4 H₂ HIDDEN CORRELATION~~ | ~~the caption on H₂~~ | ~~`h2ci.js`~~ | ~~[T] vs PySCF FCI 1-RDM 10⁻⁹~~ | ~~+8 · Sonnet~~ *(AO1: to 0.6.2 Honest Flow, with the other honest readouts — 0.6.0 is planned ≤ 200)* |
| M3 THE PERIOD | "repeats exactly every 1.094 ps" | REPEATS rescans | [T] T = 14400π | +8 · Sonnet |
| M11a SONG BANDS → ROUTES | six shell RATEs as targets (registered in `mod-port.js`) | routes | [T] routes exist; the flash declaration | +12 · Sonnet |
| THE FLASH LAW | labelled RATE above 3 Hz; `sim-ladder` at 40 | the alias arithmetic | [T] the alias table; 31 presets | +10 · Sonnet |
| N6 (part) + the A/B RABI ORACLE + the TEXEL-FLOOR tile | "79.7 % of the polarizability"; the Rabi formula as a test; METERS shows the f16 floor with its metric | sentences; a node test; a `fieldDigest` tile | [T] each number's script; Ω to 10⁻³ (MEASURED) | ~~+23~~ *(AO1: +15 — the Rabi oracle is a `tests/` file, 0 `lab/` lines)* · Haiku/Sonnet |
| the dephasing caption | "the beats fade, the shells stay" | one sentence | — | +1 |
| *(AO1)* THE CATALOGUE ROWS | — (the paper's table starts) | `tests/catalogue.json` from SYSTEMS §1 + one node test | [T] every row's oracle test exists; the count pinned | 0 `lab/` · Haiku |
| 0.6.0-V | — | — | the verifier: lock ×2 + fixtures, serialize, the ms/s pair, boot ms, the identities | — |
Sum +223; − stale comments/shim 10 → **+213.** M12 THE CHORD moves to 0.6.4 (no audio output exists; it is an oscillator bank, M; the song needs it).
*(AO1 sum: C7 20 + C2 1 + M2 125 + C1 6 + M3 8 + M11a 12 + flash 10 + N6 15 + dephasing 1 = **+198 new; − 8 (the four stand-downs) − 10 (stale) = +180 net**;
at the tree's 1.4× mean overrun ≈ 277 new — fits. Named-subtraction risk: the −8 is inside the owner row's own BUILD.)*

### D.2 · 0.6.1 Factor Road (≈ +233; no subtraction — `molecule.js` stays for 0.8.1)
M4 THE FACTOR ROAD (+150, Opus; the C-matrix binding past 65,536 B; C₆₀'s record grows by 180 f64 columns, a DOWNLOAD) · M10 THE SYMMETRY CERTIFICATE + the SYMMETRY
tile ~~+ **the orbital NAMES on the knob** (1a₁, 1b₂ from `names.js`; +23, Sonnet)~~ *(AO1: the names are LIVE — the row is the certificate + tile, +15)* ·
~~M6 FROZEN-CORE COLUMNS (+15) · M5a THE MIRROR HALF (+40, Opus)~~ *(AO1: both to 0.6.3, beside M5b THE ASYMMETRIC UNIT — the mirror half and the asymmetric unit are
the same symmetry saving at two depths and one brief should hold both)* · N6's VALENCE bar
(+5). Gates as Round 1 §D. ~~**+233 of 280** — tight; M6 waits if M4 runs long.~~ *(AO1: **+170**; ×1.4 ≈ 238 — fits with room for M4, the row that can overrun.
The factor road's own risk: a C₆₀ density at 96³ through 180 columns is UNVERIFIED in ms; the [R] is the brief's first number.)*

### D.3 · 0.6.2 Honest Flow (≈ +189; no subtraction)
M1 CONTINUITY + C5's face-flux current (+155, Opus) · M7 GATED + RESIDUAL (+12, Haiku) · M11b THE DRIVE'S PITCH (+12, Sonnet) · N6 honest readouts (+10). Gates: Round 2
C5's four [T]. **+189.** *(AO1: + C4 H₂ HIDDEN CORRELATION from 0.6.0 (+8) → **+197**; ×1.4 ≈ 276. This cut answers A4's "fix FLOW continuity" (C:2180) — it stops a
picture being false, which ranks it above most new pictures, AO1·6.)*

### D.4 · 0.6.3 Event Census (≈ +140 − 20 = +120)
M8 THE SPACETIME CLASSIFIER (+40, Opus) · M8′ ANGULAR NODES (+40, Sonnet; L3's nodal-length check as a test assertion) · M5b THE ASYMMETRIC UNIT (+60, Opus; flag;
still only). − `vortex.js`' reconnection prose (confirmed prose by the brief). *(AO1: + M5a THE MIRROR HALF (+40) and M6 FROZEN-CORE COLUMNS (+15) from 0.6.1 →
**+195 − 20 = +175**; ×1.4 ≈ 273, the −20 at half. M8 is Sol's own "publication prerequisite" (the reconnection correction, C:5356): the paper cannot cite VORTEX's
event count until this cut lands.)*

### D.5 · 0.6.4 Hydrogen Song (≈ +205 − 85 = +120)
N1 (Opus, ~~+90~~ *(AO1: ≈ +75)*): the worker Strang step ~~in m-blocks~~ *(AO1: = `driveStep` (`mathworker.js:400–416`) with `omega` and the eigendecomposed operator as
arguments (+4); hydrogen's z over the 91 labels eigensolved once (38.6 ms for the dense 91, 1.6 ms for the m = 0 block; +14); `h.drive.{init, run, set}` (+6) —
MEASURED `opus1-e`)* (dt 0.5, midpoint field, 100 steps a frame *(AO1: 2.0 ms per 100 at 91 labels)*), the polyphase low-pass, Z eigensolved at load, the DRIVEN kind through
`packModes`, the pitch map, RATE as the tuning peg, the caption's scale sentence, the flash declaration · ~~**THE STREAM QUEUE** (+25, Opus; stateful; hold and say so)~~
*(AO1: struck — the drive pattern already streams, B.4)*
· **M12 THE CHORD** (+60, Sonnet; an oscillator bank, one partial per populated lane, `setValueAtTime` on change, the kit's context lifecycle; audio OFF by default
with a consent switch; "sounds at … Hz at this RATE") · **FILM-SAFE** (+30, B6: at export the worker runs the same steps offline and `modesAt(t)` reads the stored
c_a(t); [T] byte-equal re-render of two exports). Persists as: the track's hash + RATE + filter (PROJECT); "track missing" honestly. Gates: Round 2 N1's [T]/[R]
list; [T] the nine locked states' `packModes` bytes identical with the gate off (a node test, not a lock run — C8). − `modrive.js` 85 after `sin2Pulse` moves.
*(AO1: **+75 + 60 + 30 = +165 − 85 = +80** (at half the −85: +122); ×1.4 new ≈ 231. Two words the brief owes: (1) the TRACK is the user's file — the project stores
its hash, never its bytes, and a link carries neither: "track missing" is the honest default in a link, not an error; (2) audio OUT obeys the kit's context
lifecycle and the reduced-motion preference mutes it too — say so beside the flash law. Film: B6's precompute is the stepper run offline, same code, same bytes.)*

### D.6 · 0.6.5 Electrostatics (≈ +155 − 90 = +65)
N2 (Opus, +140): `md.js` exports the nuclear-attraction entry (+10); the probe in the worker; the CARD (64³ ρ from the f64 AOs, the analytic core split, the free-space
FFT Poisson, the nuclei added); the total first, then per orbital the equal-share piece with the raw electron cloud beside it (Round 2 §F-3 ★); the ms printed · **THE
CARD ROAD (RU)** ~~(+15: `COPY_DST`, the worker's resample + f16 pack, `writeTexture`, the stats word, re-upload on `setResolution`)~~ *(AO1: (+35: the storage
buffer, the ≈ 20-line lazy pass, `cardDirty` on `setResolution`, the owner arm in `frame()`; B.2-4)*. Gates: Round 2 N2's cloud gates;
[T] device: a CPU 1s volume through the card road within one f16 ulp of `fieldDigest`. Persists as: nothing (a card is derived; PROJECT keeps the view only).
− `shadow.js` → `tests/lib/` 90. *(AO1: **+175 − 90 = +85** (at half: +130); ×1.4 ≈ 245. The governor: the card's pass costs one dispatch per notch, nothing per frame; a
PROBE readout is a CPU reader and enters `READERS` with a `may()` gate (B.2-3's law). The phone: 1 MB buffer + the module on first use; UNVERIFIED in ms.)*

### D.7 · 0.7.0 Vibrate (≈ +185)
N3 VIBRATE (+80, Opus; the record kind; LINEAR + McWeeny ≤ 4·Q_max; the amplitude label; "not harmonic here"; a `tools/` build step) · **N3′ THE SKELETON** (+60,
Sonnet; beads, bonds from the geometry, the dipole arrow; off by default; moves with the modes) · **PULSES** (+20, Sonnet; `fieldOf` step/ramp/wave/gaussian wired to
`chem.rt.init`; `absorb`'s linear response as the oracle) · **SPIN-½** (+25, Sonnet, B5; a two-level register on ORBIT's painter; Larmor and Rabi closed forms; the
first non-spatial system). Film: VIBRATE pure (closed form in Q(t)); PULSES precomputed. *(AO1: **+185**; ×1.4 ≈ 259. THE SKELETON is a UI/overlay row — the class
the tree has overrun 2×, so it is the first row to slip; it is also Josh's "ball and joints" (A2), so it slips to 0.7.1, never out. Persists as: VIBRATE's mode +
amplitude (PROJECT, default-absent); the skeleton's on/off is PREFERENCE furniture, not project.)*

### D.8 · 0.7.1 Open Shells (brief-named ≤ 140 with a subtraction ≥ half; Opus)
`uhf` beside `rhf` in `scf.js` with D = Dα + Dβ to the existing tile (no kernel change; `multiplicity` already in the schema); the spin density Dα − Dβ as the signed
kind; O₂, NO, H₂⁺. Gate: PySCF UHF H₂ at 5 bohr, O₂ triplet, 10⁻⁸ Eh; ⟨S²⟩.

### D.9 · 0.7.2 Lattice (≈ +180 − 70 = +110)
N4 (Opus, +120): the site-density window on `unitaryOf` + `eigSymQL` in a worker; chain/ring/square; W; Φ; λ; live ≤ 8×8 with flux, ≤ 16×16 without (consistent with
the 256-shell limit); records beyond; the IPR readout; the ms printed; the seed persists (PROJECT) for determinism · **RM THE VOLUME** (+30 if the audit's measurement
says the session takes a lattice model: one narrow s-shell per site, kind-2 complex orbital, phase as hue) · presets S each: Anderson, Aubry–André, Peierls/AB, SSH,
graphene, Hückel benzene · **AMMANN–BEENKER** (+30, B4; Bragg peaks at the silver-ratio positions; IPR scaling *(AO1: a ≤ 256-vertex patch; IPR out of the gate, C.4)*). − `absorb.js`' dead lines → `tests/lib/` 70.
*(AO1: RM MEASURED in node — it takes a lattice (8×8 tile, 16×16 ORB_WGSL; 17×17 refused); add +1 for `MODEL_RANK` and the rank decision; the lattice enters as an
OWNER (0.6.0's row). **+181 − 70 = +111** (at half: +146); ×1.4 ≈ 253.)*

### D.10 · 0.7.3 Kohn–Sham (≈ +180; gated on a brief that names its subtraction — §F-6)
LDA (Slater + VWN) on a Becke/Lebedev grid, closed-shell, in the chem worker; "RKS LDA" STATUS; RHF ↔ LDA as the signed view. Gates: [T] PySCF RKS `lda,vwn` ≤ 10⁻⁶
Eh on water and benzene; ∫ρ = N to 10⁻⁴; the SCF's ms. ChronusQ cited, never merged (GPL-2 vs GPL-3.0-only). The spec says "do not attempt to compete with
Octopus/ChronusQ/RMT" (S:2310, verbatim); Josh's A4 says "we should definitely go forward with it"; the oracle reconciles them: no accuracy is claimed that PySCF
did not measure.

### D.11 · 0.7.4 Shelves (≈ +92)
**THE CATALOGUE FILE** (+40, Sonnet; B1): `lab/catalogue.js`, read by SPECTRUM's operator picker (which gains the systems as they land; the QQ̄ special case
subtracted), the MODEL sheet, `tools/catalogue-table.mjs` (the README table) and the paper; [T] every row's oracle test exists, every preset resolves, the count
pinned · the MOLECULES picker in shelves (+52; periodic table · heavy atoms · small biology · lattices; data-driven from `library.json`). *(AO1: the catalogue's rows
already exist from 0.6.0 (`tests/catalogue.json`); this cut MOVES the file into `lab/` and points the readers at it. Both rows are UI: at the tree's 2× for UI
rows, **+92 → ≈ 184**, still the lightest cut. The QQ̄ special case's subtraction is real (`windows/spectrum.js:39`) and counted at half.)*

### D.12 · 0.8.0 Central Lab (≈ +270; zero lock risk; the diversity cut — five families)
| row | what Josh sees | the engine | the gate | Δ · model |
|---|---|---|---|---|
| THE GENERIC CENTRAL HAMILTONIAN + FIVE POTENTIALS | pick a potential; its bound states in the same glass; superpose and watch; the quarkonium button back with an (α_s, σ) editor | the generic Hamiltonian (μ = 1, rmax per row, bound/virtual flag, configure/domainFor/labelOf/unit, the solve in the worker + table upload; ~~+90~~ *(AO1: ≈ +54 on ATOM's solver, B.2-1)*) · the confined atom · the finite well (grid point on the step) · Yukawa · the anharmonic/soft-core well · the rigid rotor (+15) · the picker (+15) | [T] confined atom R_c = j₁,₁²/8 to ~~10⁻¹⁰~~ *(AO1: 10⁻⁶ shipped / 10⁻¹⁰ Numerov oracle)*; Yukawa vs a tridiagonal oracle 10⁻⁷ *(AO1: the tridiagonal IS the shipped solver now — the independent oracle becomes Numerov, 4·10⁻⁵ apart at M = N = 4000, `opus1-b`; tighten both grids or gate at 10⁻⁴)*; the well 10⁻³; the rotor ~~T = 4πI~~ *(AO1: the ladder ratio to O((w/r₀)²))*; ≥ 10 bound rows per shipped preset; [R] solve ms (worker) *(AO1: 32 ms for 21 rows on this machine — the worker is still right, the kick on it stays main-thread and priced)* | ~~+120~~ *(AO1: ≈ +84)* · Opus |
| SQUEEZED + CAT | the oscillator breathes in width; interferes with itself | `applySqueeze`; A/B + sum | [T] Var(z) = e^{±2r}/2; the Fock series; lost norm reported | +40 · Sonnet |
| INTER-SHELL STARK | a STARK field that ionises; the Stark map | the propagator hook with H = diag(E) + F·z | [T] exact diagonalisation; E_n + (3/2)nkF | +50 · Opus |
| ~~CIRCULAR TO n ≈ 14~~ | ~~circular states beyond the register's n = 6~~ | ~~FACT fixed; a small producer, not the register~~ | ~~[T] the emulated-f32 twin vs mpmath; the device at the f16 floor~~ | ~~+10 · Sonnet~~ *(AO1: dropped as a row — n ≈ 14 at the f16 floor shows a thinner ring of what the register shows at n = 6, and LADDER already plays Rydberg revivals to n̄ = 400 on its own canvas (`ladder.js`, SYSTEMS S10). Kept: the one-line FACT fix as a test-side correction; n = 30 stays §F-3's gated option in 0.8.2)* |
| ~~THE BEAD · THE LINE PLOT~~ | | | | *(AO1: to 0.8.2 Phase Space, beside the ellipsoid it is the first half of)* |
~~**+270.**~~ *(AO1: **84 + 40 + 50 = +174**; ×1.4 ≈ 244 — the diversity cut now fits with room for the one row (RC) that can surprise.)* Mass scaling moves to 0.8.1 to keep the cut under the cap.

### D.13 · 0.8.1 Doubles (≈ +210)
~~**H₂⁺ THE DOUBLE WELL** (+80, Opus; `molecule.js:72 fieldModes` → K0 modes at ±R/2 through `Mode.ctr`; the tunnelling beat T = 2π/(E_u − E_g) = 16.0 a.u. at R = 2 in
1s-LCAO — labelled "1s-LCAO, not exact" (exact ≈ 14.4, Bates — UNVERIFIED); status NUMERICAL; oracle `tests/lib/twocentre.js`, the exact prolate-spheroidal solver) ·~~
*(AO1: H₂⁺ to a lead (§F-8). It is the most expensive row of the cut (+80, Opus, the dead `Mode.ctr` path that THE LOCK has never seen in any locked state) for a beat
11 % off the true one, and its tunnelling picture is available exactly and cheaper as a two-site RM lattice (0.7.2). If Josh wants it, it returns with the exact
two-centre energies from `twocentre.js` as the beat, not the LCAO ones.)* ·
**THE H₂ CURVE** (+50, Sonnet; RHF vs FCI dissociation on a canvas from `h2CurveTable`; PySCF at 0.74/3.00 Å to 10⁻⁸) · **RABI + LANDAU–ZENER on the Bloch sphere**
(+50, Opus; the song drive's two-level reduction; the chirp; P_LZ) · MASS SCALING (+10) · Lattice II presets: Hofstadter record, quantum walk, spin chain ≤ 8 (+20).
*(AO1: **+130** without H₂⁺; ×1.4 ≈ 182. LZ's P = e^{−2πδ} is a closed form for a LINEAR chirp through an isolated crossing; on the 91-label drive the crossing
is not isolated — the gate is the stepper's own dt-halving re-solve, with the formula as a caption "in the two-level limit". "Doubles" no longer describes it: name
it **Two Levels** (Rabi · LZ · spin on the Bloch sphere) if Josh keeps it.)*

### D.14 · 0.8.2 Phase Space (≈ +150 + gated)
QHO Wigner with negativity (+40) · the coherence map (+30) · the A(t) trace over one REPEATS period (+30) · the uncertainty ellipsoid (+50) · *(AO1: + THE BEAD · THE
LINE PLOT from 0.8.0 (+50) = +200 planned, ×1.4 ≈ 280 — at the cap: the ellipsoid is the row that waits)* · gated on briefs: the
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

*(AO1 · THE LINES TABLE RE-CUT — planned new · named − · net · RISK = new × 1.4 (the tree's mean overrun on additions; UI rows × 2) − named × 0.5 · vs 280.
Every figure UNVERIFIED; the multipliers MEASURED from eight BUILD files, `opus1-g`.)*

| cut | new | − named | net | risk | vs 280 |
|---|---|---|---|---|---|
| 0.6.0 | 198 | 18 | 180 | 268 | fits |
| 0.6.1 | 170 | 0 | 170 | 238 | fits |
| 0.6.2 | 197 | 0 | 197 | 276 | fits, tight |
| 0.6.3 | 195 | 20 | 175 | 263 | fits |
| 0.6.4 | 165 | 85 | 80 | 189 | fits |
| 0.6.5 | 175 | 90 | 85 | 200 | fits |
| 0.7.0 | 185 | 0 | 185 | 259 (skeleton ×2: 301 → slips to 0.7.1) | fits if the skeleton slips |
| 0.7.1 | ≤ 140 (+ skeleton 60 if slipped) | ≥ 70 | ≤ 130 | ≤ 249 | gated |
| 0.7.2 | 181 | 70 | 111 | 218 | fits |
| 0.7.3 | 180 | brief | ≤ 180 | 252 | gated |
| 0.7.4 | 92 | (QQ̄) | 92 | 184 (UI ×2) | fits |
| 0.8.0 | 174 | 0 | 174 | 244 | fits |
| 0.8.1 | 130 | 0 | 130 | 182 | fits (or dropped, §F-8) |
| 0.8.2 | 200 (+ gated) | 0 | 200 | 280 | at the cap; the ellipsoid waits |
| Σ | ≈ 2,382 | ≈ 353 named (≈ 177 at half) | ≈ 2,029 | | |
*(AO1: the circular row and H₂⁺ leave (−90), the RC row shrinks (−36), the queue and the copies leave (−50), the FIELD OWNER grows (+16); the ladder's shape holds and
no cut needs the reserve.)*

---

## E · THE ENGINE UPGRADE PROPER — what changes under the glass, tied to the row that pays
1. **THE KINDS TABLE + THE MEANING CHECK** (0.6.0 C7) *(AO1: = THE FIELD OWNER — the one predicate; the engine's real prerequisite for RM, RU and every later producer)*. 2. **SEPARATE PRODUCERS** (0.6.0 first; the law of B.5) — zero re-bakes; the dispatch edit and boot cost
priced per row *(AO1: built LAZILY; their WGSL DERIVED by anchors where the locked text holds the part, never copied)*. 3. **THE SITUATION-FIXTURE LOCK** (before 0.6.0; `tools/`). 4. ~~**THE STREAM QUEUE** (0.6.4)~~ *(AO1: **ONE DRIVE STEPPER** — `driveStep` generalised, the TD-CIS drive and hydrogen's song on the same code)*. 5. **THE OSCILLATOR BANK** (0.6.4; the instrument's first
sound). 6. **THE CARD ROAD** (0.6.5; `writeTexture`; re-upload on res change). 7. **THE RECORD KINDS** (0.7.0 VIBRATE, 0.7.2 LATTICE; `identityOf` covers them).
8. **THE FACTOR ROAD + THE C-MATRIX BINDING** (0.6.1). 9. **THE SKELETON OVERLAY** (0.7.0). 10. **MOLECULE-AS-LATTICE** (0.7.2, measured first). 11. **THE
CATALOGUE FILE** (0.7.4). 12. **THE GENERIC CENTRAL HAMILTONIAN** (0.8.0; the worker solve; the bound flag) *(AO1: ATOM's solver without the SCF — one radial solver in the app, `cornell.js`' numerov the test's second opinion)*. 13. **THE PROPAGATOR HOOK OPENED** (0.8.0 inter-shell
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
2. **The order.** Features-first (0.6.0 Beat Equalizer opens) ★ — or engine-first (0.6.0 = the factor road + the kinds table). *(AO1: put his own words beside it —
"maybe a bucky-ball as our next milestone (Remember how Benzene was the weird un-accomplish-able goal? We can do this!)" (N:31–34). The star stands (both rounds'
default), but the honest third option is "bucky-ball first": 0.6.0 = Factor Road (+170, C₆₀'s density — the thing he named), 0.6.1 = Beat Equalizer. THE FIELD
OWNER rides whichever opens. AO1 would take the bucky-ball first on value-to-Josh (AO1·6); Fable decides the star.)*
3. **Circular Rydberg.** n ≈ 14 at zero lock risk in 0.8.0 ★ — or n = 30 through a separate log-space module in 0.8.2 (+40). (DRAFT 0's "n = 24" was false.)
4. **`lab/sw.js` in the count.** Keep counting ★ — or exclude generated files.
5. **Electrostatics' place.** 0.6.5 ★ — or 0.7.0's first row.
6. **Kohn–Sham.** 0.7.3, LDA first, PySCF RKS the oracle, ChronusQ cited ★ — or hold until a brief names lines and a subtraction — or drop.
7. **The Central Lab's five.** The confined atom · the finite well · Yukawa · an anharmonic well · the rigid rotor ★ — or your five.
8. **The revivals.** ~~H₂⁺ as the double well and the H₂ curve in 0.8.1 ★~~ *(AO1: the H₂ curve and the two-level pictures in 0.8.1 ★; H₂⁺ and helium as leads)* (the physics, not the windows — your 10-09 "H2 and Electrostatics should go" stands for the
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
19. *(AO1, new)* **N:27–29 — "Wave indexing the presolved orbitals … dynamic waves with true electrostatics like a higher level QHO but based on taylor 3D shells."**
    A lead on this ladder ★ (the nearest rows: the factor road's C-matrix, 0.6.5's potential, Kohn–Sham's grid — none of them is it) — or a research row (a `tools/`
    experiment, 0 `lab/` lines) before 0.8.0. *(Sol: "Taylor-expanding Gaussian orbitals would not automatically increase accuracy" (C:1008); Taylor belongs on H_e(Q) — which is 0.7.0 VIBRATE's road.)*
20. *(AO1, recorded, not asked — technical laws Josh need not rule on, kept so he can: F-4, F-16, F-17 and the card road's pass-over-`writeTexture`.)*

## G · What is not claimed; what is open
No line is measured; no row built; every GPU number UNVERIFIED on a device (the module's boot cost; `writeTexture`; denormal flush — n ≈ 14 assumes flush-to-zero;
the phone). *(AO1: and nothing about a phone is known at all — the tree's only device reports are nine iPad-Safari runs of 0.3.0-alpha; the anchor-derived equalizer
module, the RU pass's ms, a 256-site RM orbital's ms, and the log-mesh solver's 10⁻⁶ on the confined atom at other M are UNVERIFIED here.)* RM on a device; RC's worker solve timing; the exact H₂⁺ energies (Bates) recalled, not re-derived; LZ's 10⁻³; N4's live timing; the tabulated-H kick on the
main thread. No prior-art pass yet for the song's sonification, the equalizer mapping or the breathing road. The platform's feasibility. Nothing resumes Sol's
programme; every gate is the app's own oracle.

## H · Josh's words this round, verbatim
> Wow, let's wrap up here. We will continue in this account session so don't worry about Yan but we will definitely compact to get ready for an ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations.

> Good morning Claude! Let's continue where we left off

## I · The record of the round
`NACRE.md` `86c486c` → `census/SYSTEMS.md`, `census/REPRESENTATIONS.md` (Sonnet 5.5 readers) → `PLAN-DRAFT-0.md` `542aa35` + §J `37b79d3` → `REVIEW-SONNET-0.md`
(Sonnet 5.5 @ high; `measure/sonnet0-*`: WGSL count, Numerov on the finite well/Yukawa/confined atom, f32 circular limits, line sums, 38/38 citations, the eleven asks
3/6/2, the Rabi oracle) → this DRAFT 1 → `AUDIT-OPUS-1.md` → DRAFT 2 → `REVIEW-SONNET-2.md` → DRAFT 3 (Josh) → `PLAN.md`.


---

# AO1 · THE AUDITOR'S SECTIONS

## AO1·1 · The architecture — right shape, three over-promises, one missing piece
**Verdict.** "One texel contract · four roads · separate producers · zero re-bakes · a catalogue · thirteen declarations" is the right shape for THIS tree: the lock
hashes texel bytes, pixels and `packModes` bytes (`digest-lock.mjs:137–190`, KNOWN), so a new pipeline beside the locked ones is the only road that never re-bakes,
and the tree already runs two producer families that way (`computePipeline`, `molPipelines`, `field.js:886–887`). Keep it. Where it over-promises:
1. **"Four roads the tree already has or nearly has" hides that two roads are an existing solver used twice.** RC is ATOM without its SCF (`atoms.js:172`, `:502`) —
   DRAFT 1 would add a second radial table builder on `cornell.js` beside it. The song's drive is the TD-CIS drive's stepper (`mathworker.js:400–416`) — DRAFT 1
   would add a new stepper and a new queue. Both re-cut above; both are A8's "a discovery in one could be relevant, perhaps computationally for another", made literal.
2. **"Separate producers" against subtract-don't-add.** The law as written duplicates ≈ 60 WGSL for the equalizer and, later, the separable and log-space modules.
   The tree's own answer is the anchored derivation it uses for 24 render copies (`specRenderWGSL`, `field.js:551–558`): derive, don't copy (AO1·2).
3. **"Thirteen declarations per kind" is a lot of paper for a Sonnet row.** Five of them (iv clock, vii flash, x film, xii modulation, xiii non-visual) are one line
   each and belong in a TEMPLATE the brief fills, not in prose per row; (ix) persistence and (xi) phone are the two a verifier can actually fail. The plan should say
   which declarations a node test asserts (i oracle exists, ii status word, ix default-absent key, xi boot-module count) and stop there — "don't over-verify".
**The missing piece: THE FIELD OWNER.** The texel has one owner at a time, and the tree decides who in four hand-written places (`rack.js:478` overlayDomain on
`chem.on`; `rack.js:738–746` hydroReader; `moleculeMode`; `molFieldView`, `windows/molecules.js:15–45`; REPRESENTATIONS §5-3). Every new producer on this ladder is a
new owner — the equalizer (whose nodes must stand down), the lattice (MEASURED to adopt the field with MOLECULES off, under the hydrogen overlays), the card. C7's "+4
assertion" cannot carry that; one `owner()` that the four sites read can, and it SUBTRACTS the four expressions. It is the first engine row of 0.6.0.
**Boot on a phone.** Today's boot compiles 8 modules and awaits their compile info in sequence (`field.js:869–880`); DRAFT 1 adds one per producer at boot. The
specialised render copies are already lazy (`field.js:914–925`). Law: producers compile on first use — a visitor who never opens the equalizer pays nothing; the gate
is a node source count, not an unmeasurable phone [R].

## AO1·2 · Separate producers: lazy, derived, and what the verifier proves
- **Lazy:** `createComputePipelineAsync` on first dispatch, a `ready` flag, the frame falls back to the base producer for the frames before it lands (as the generic
  render pipeline covers an unready specialised one). +3 lines a producer. [T] node: count `createShaderModule` in the boot block = 8.
- **Derived:** the equalizer = COMPUTE_WGSL with the space switch pinned to 0 and the accumulate/store replaced by the 6×6 form, by `once(anchor, text)` as
  `specRenderWGSL` does; a missing anchor throws at build, and the brief falls back to the copy. UNVERIFIED that the anchors are unique — a 10-minute read for the brief.
- **The dispatch edit** (F3) stays the risk and stays a lock PRECONDITION; THE FIELD OWNER makes it one `switch (owner.road)` in `frame()` instead of a third
  `if` — the same arm the card needs (AO1·3).

## AO1·3 · The card road — writeTexture vs a pass (MEASURED static census, `opus1-a-boot-card`)
| | `writeTexture` (DRAFT 1, F4) | a pass over a storage buffer (DRAFT 0, re-cut) |
|---|---|---|
| owns the volume in `frame()` | needs the third arm (lock precondition) | the same arm |
| governor notch (`RES_LADDER` 64/96/128) | `psiTex` destroyed (`field.js:1039`) → main thread keeps the f32 card and re-resamples 0.26–2.1 M taps, or the governor is pinned | `cardDirty` like `molDirty` (`:1052`) → one GPU dispatch |
| `stats[slot]` | a CPU `writeBuffer` | `atomicMax` in the pass, like every producer |
| usage flags of the locked texture | `COPY_DST` added | unchanged |
| lines | ≈ +33 | ≈ +35 (≈ 20 WGSL, lazy pipeline, buffer, flag) |
| frame-thread work | yes, per notch | none |
**AO1 takes the pass.** It is also simply another separate producer, so it needs no exception in B.5.

## AO1·4 · Every §D row, checked — gate · road · lines · lock · the five declarations
Legend: ✓ holds · ✗ fails, re-cut above · ~ holds with a note. "Decl" = persistence/film/phone/modulation/non-visual present (P/F/Ph/M/N).
| row (cut) | gate [T]-able? | road real (file:line) | lines vs tree | lock statement | Decl missing |
|---|---|---|---|---|---|
| C7 → FIELD OWNER (0.6.0) | ✓ node table | `rack.js:478`, `:738` | ✗ +4 → +20−8 | precondition ✓ | — |
| C2 period guard | ✓ 0/20,000 | `period.js` | ✓ | — | — |
| M2 equalizer | ✓ f64 twin 10⁻¹²; device at f16 | ~ new module (derived) | ~ +150 → +125 | precondition ✓ | P (Γ table: PROJECT, default-absent, enters undo); Ph (lazy) |
| C1 nodes stand down | ✓ | through the owner | ✓ | — | — |
| C4 H₂ caption → 0.6.2 | ✓ PySCF FCI 1-RDM | `h2ci.js` | ✓ | — | N |
| M3 the period | ✓ T = 14400π re-derived | REPEATS | ✓ | — | N (the sentence IS non-visual) |
| M11a routes | ~ "routes exist" is a count, fine | `mod-port.js` | ✓ | — | M ✓ |
| flash law | ✓ alias table | `tools/flash-calibrate.mjs` exists | ✓ | — | — |
| N6 + Rabi oracle + floor tile | ✓ (Rabi 5.3·10⁻⁴ at E₀ = 10⁻³, two integrators agree) | `fieldDigest` | ~ +23 → +15 (oracle is a test) | — | N |
| M4 factor road (0.6.1) | ✓ ρ_factor = ρ_tile | `molMatBuf` 65,536 B | ~ Opus engine, can overrun | outside the lock (C₆₀ unlocked) | Ph: C₆₀'s record grows 180 f64 columns — a DOWNLOAD size line owed |
| M10 symmetry tile | ✓ 24 ops 10⁻¹⁴ | `names.js:142–170` | ✓ +15 | — | — |
| names on the knob | — LIVE | `chemview.js:75` | ✗ struck | — | — |
| M1 + C5 honest flow (0.6.2) | ✓ face-flux identities | `molecular-flow.js` | ~ +155 Opus | FLOW unlocked ✓ | F: tracers are stateful — film "refused or reseeded", say which |
| M8 classifier · M8′ nodes · M5a/b · M6 (0.6.3) | ✓ | `vortex.js` 95 lines | ~ −20 prose: confirm | M5 "still only, behind a flag" ✓ | — |
| N1 song (0.6.4) | ✓ dt-halving re-solve (not RWA at E₀ = 10⁻²) | `mathworker.js:400–416` | ✗ +90+25 → +75 | `packModes` bytes node test ✓ | P ✓ (hash, never bytes) |
| M12 chord | ~ "sounds at … Hz" is arithmetic | no audio out exists (REPRESENTATIONS §3.12) | ✓ +60 M | — | N: reduced-motion must mute it too |
| FILM-SAFE | ✓ byte-equal re-render | `render-exact.js` | ✓ +30 | — | — |
| N2 electrostatics (0.6.5) | ✓ `int1e_rinv` | `md.js` | ✓ +140 | outside ✓ | Ph: 1 MB + module on first use |
| RU card | ✓ only at card res = field res | `field.js:1036–1054`, `:1318–1328` | ✗ +15 → +35 (pass) | precondition (owner arm) | — |
| N3 vibrate · skeleton · pulses · spin (0.7.0) | ✓ re-solve; PySCF ≤ 0.1 cm⁻¹ | `density.js:171` `fieldOf` | ~ skeleton is UI (2×) | outside ✓ | P: mode + amplitude PROJECT; skeleton on/off PREFERENCE |
| UHF (0.7.1) | ✓ PySCF UHF | `scf.js` 114 lines; `molecule-state.js:137` | gated ✓ | outside ✓ | — |
| N4 lattice + RM + A–B (0.7.2) | ~ A–B: patch diffraction, not IPR scaling | MEASURED `opus1-c` | ~ +1 `MODEL_RANK` | outside ✓ | P: the seed PROJECT ✓ |
| Kohn–Sham (0.7.3) | ✓ PySCF RKS | — new grid | gated ✓ | outside ✓ | Ph: a Becke/Lebedev grid in the chem worker — the ms on the iPad is the brief's first [R] |
| catalogue + shelves (0.7.4) | ✓ node | rows from 0.6.0 | UI 2× | — | — |
| RC + five (0.8.0) | ✓ but gates re-stated (10⁻⁶ shipped; rotor not exact; anharmonic's oracle = Numerov 2N) | `atoms.js:172` | ✗ +90 → +54 | space 6 table path: quarkonium's locked texels are only safe if the generic H never writes while QQ̄ is in force — owner ✓ | P: potential id + params PROJECT (like `instruments.qcd`) |
| squeezed + cat | ✓ Var(z) = e^{±2r}/2 | `qho.js:14–19`, `kick.js` | ✓ +40 | outside ✓ | — |
| inter-shell STARK | ✓ exact diagonalisation | `state.js:106` hook | ✓ +50 | outside ✓ (the propagator disables RATE/K_z/DEFECT/A⇄B — `state.js:95`, say so on screen) | — |
| circular n ≈ 14 | ✓ | — | dropped (AO1·6) | — | — |
| bead · line plot → 0.8.2 | ✓ closed ⟨r⟩ | `dipoleMatrix`, `sampleVoxel` | ✓ | — | N |
| H₂⁺ double well (0.8.1) | ~ 1s-LCAO 11 % off | `Mode.ctr` (dead, never locked) | lead | the ONLY row that runs a never-locked kernel path — owes its own fixture | — |
| H₂ curve · Rabi/LZ · mass · Lattice II | ~ LZ via re-solve | ORBIT's painter | ✓ | outside ✓ | — |
No row's gate needs the exact answer at run time; none is struck for that reason. Struck or re-cut for the reasons in the table: 5.

## AO1·5 · The ladder and its order
- **Features-first is right, with one honest alternative put to Josh (§F-2):** his own named milestone is the bucky-ball. THE FIELD OWNER, the lazy-producer law,
  the fixtures and the catalogue rows ride whichever cut opens; nothing else in 0.6.0 is a prerequisite of 0.6.1, so the two can swap at no cost.
- **The arithmetic (D.18) was honest about its own estimates and silent about the tree's record.** Re-cut: plan ≤ 200 new a cut; subtractions at half; UI rows ×2.
  0.6.1 (+233) and 0.8.0 (+270) were NOT survivable at the tree's 1.4× (≈ 326, ≈ 378): 0.6.1 sheds the names (live) and M5a + M6 (to 0.6.3, M5b's sibling);
  0.8.0 sheds circular n ≈ 14 (dropped) and the bead/line plot (to 0.8.2) and its RC row shrinks to ≈ 54. Both now fit with room.
- **Moves:** C4 → 0.6.2 · M5a, M6 → 0.6.3 · the bead/line plot → 0.8.2 · **the H₂ curve → 0.7.1 Open Shells** (RHF vs UHF vs FCI on dissociation is THE picture that
  explains why UHF exists — the curve and the method belong in one cut; 0.7.1 is brief-gated anyway) · H₂⁺ → a lead.
- **The Central Lab's five.** Three of DRAFT 1's five sit beside systems already live — the finite well beside the BOX, Yukawa beside hydrogen, the anharmonic well
  beside the QHO — and the rotor is only "rotor-like" on this road. What makes the cut DIVERSE is the SITUATION, not the potential: a knob that pushes states out of
  the bound spectrum (the wall closing in; the screening rising) and the picture "states leaving" — the bound count is free from the Sturm count. AO1's five:
  **the confined atom · Yukawa (both as "ionise by a knob") · the finite well · quarkonium un-hidden with its editor (already a system; the cheapest diversity on the
  list) · the soft-core/anharmonic well**; the rotor a preset labelled "rotor-like". Josh's §F-7 keeps the choice.
- **"Doubles" is the weakest cut.** After H₂⁺ leaves and the H₂ curve moves, it is Rabi + LZ + mass scaling + Lattice II ≈ +80: name it **Two Levels** and let it be
  the ladder's 0.0.X-sized merge, or fold it into 0.8.2 if 0.8.2's gated rows stay gated.

## AO1·6 · The order by value (what Josh sees, or what stops being false — per line, per Opus-hour)
| rank | row | why | lines | builder |
|---|---|---|---|---|
| 1 | THE FIELD OWNER (0.6.0) | stops four silent falsehoods (Im ψ on √ρ; overlays over a foreign field); unlocks RM, RU | +12 net | Opus |
| 2 | Factor road — C₆₀'s density (0.6.1) | his named milestone ("we can do this!") | +150 | Opus |
| 3 | Electrostatics — the second cloud (0.6.5) | his newest explicit ask (00:10) | +85 net | Opus |
| 4 | Beat equalizer + splits (0.6.0) | his A2 colours on the spectrum; "what decoherence looks like" | +125 | Opus |
| 5 | Event census — reconnection reclassified (0.6.3) | the paper cannot cite VORTEX without it (C:5356) | +80 + 60 | Opus/Sonnet |
| 6 | Honest flow (0.6.2) | FLOW stops violating continuity (A4, C:2180) | +155 | Opus |
| 7 | Hydrogen song (0.6.4) | his A2 "reverse Lissajous", on one stepper | +80 net | Opus/Sonnet |
| 8 | Confined atom + Yukawa (0.8.0) | a knob that ionises; the best-gated new system | +54 + 15 | Opus |
| 9 | Lattice + A–B patch (0.7.2) | A1's DISORDER, A2/A3's quasicrystal, cheap via RM | +111 net | Opus |
| 10 | Vibrate + skeleton (0.7.0) | "ball and joints" (A2) | +140 | Opus/Sonnet |
| 11 | Spin-½ on ORBIT's painter (0.7.0) | the first non-spatial system for +25 | +25 | Sonnet |
| 12 | Kohn–Sham LDA (0.7.3) | A4 "definitely go forward" | ≤ 180 | Opus |
| 13 | UHF + the H₂ curve (0.7.1) | open shells; dissociation made honest | ≤ 190 | Opus |
| 14 | Squeezed + cat · inter-shell STARK (0.8.0) | new situations on live systems | +90 | Sonnet/Opus |
| 15 | Shelves + catalogue picker (0.7.4) | the front door (N:31–34) | +92 (UI ×2) | Sonnet |
| 16 | Phase-space representations (0.8.2) | pictures of states already shown | +200 | Sonnet |
| 17 | Two Levels (0.8.1) | Rabi/LZ on the Bloch sphere | +80 | Opus/Sonnet |
| — | **dropped:** circular Rydberg n ≈ 14 (a thinner ring of the n = 6 picture; LADDER already plays n̄ to 400) · H₂⁺ 1s-LCAO double well (11 % off; a two-site RM lattice shows tunnelling exactly) | | −90 | |
Per Opus-hour the cheapest wins are 1, 3 (the card is a pass), 7 (the stepper exists) and 8 (the solver exists); the dearest is 2, and it is also rank 2 in value.

## AO1·7 · Josh's asks — answered, partly, ignored (CHAT-AND-ASKS §1, §4)
| ask | DRAFT 1 | after AO1 |
|---|---|---|
| A1 symmetry & waves; DISORDER first, ANGULAR NODES | PARTIAL (0.7.2, 0.6.3) | same — DISORDER is rank 9, not first; say so |
| A2 electrostatics · ball-and-joints · quasicrystals · pitch/song · magenta/orange/yellow | FULL | FULL |
| A3 quasicrystal SIEVE · "third basis" | NON-GOAL named (§F-12) | same |
| A4 ChronusQ/DFT · experiments · paper "be ambitious" | PARTIAL (0.7.3 · 0.9) | same; "compilers" a named non-goal (E) |
| A5 roles; "Simplify, don't add" | n/a (the house law) | AO1's three subtractions (one solver, one stepper, derived WGSL) are this ask |
| A6 reconnection · dynamic symmetry · rendering contract | FULL (0.6.3, 0.6.1, the floor tile) | same |
| A7 equalizer · current sieve · omitted-electron budget | FULL (0.6.0, 0.6.2, VALENCE/frozen core) | same |
| A8 WASM · "a unified engine" | PARTIAL (WASM a non-goal; unified = the plan) | stronger: one radial solver, one drive stepper |
| A9 clone the C++ libraries | §F-13 | same |
| A10 next moves; "benchmarks first" | no row | a `tools/perf` profile of the base in D.0 (0 `lab/`) |
| A11 the ladder · 0.0.X · 1.0 standalone | FULL + §F-14 | same |
| N:35–37 larger atoms, heavier; cyclotomy/DISK | PARTIAL (factor road; DISK closed 10-07) | same |
| N:27–29 wave-indexing presolved orbitals; true electrostatics on Taylor shells | IGNORED | §F-19 (a lead ★) |
| N:31–34 shelves, periodic table, biology, "a bucky-ball as our next milestone" | FULL (0.7.4, 0.6.1) | + the bucky-ball quote in §F-2 |
| N:23–26 "1a1, 1b2" on the knob | sold as new (0.6.1) | LIVE since 0.4.0 — told, not sold |
| N:30 "as diverse as possible" | FULL (C intro) | the Central Lab's five re-picked for contrast |
**Verbatim:** every Josh quote DRAFT 1 carries matches CHAT-AND-ASKS / NACRE (KNOWN, re-read). **§F defaults:** the stars are the ones he takes (defaults, one-word
names, diversity, ambitious, don't over-verify) except F-8 (AO1: H₂⁺ to a lead) and F-2 (the bucky-ball put beside the star). Eighteen questions is long for a man
who takes defaults: AO1 marks four as "recorded, not asked" (§F-20).

## AO1·8 · Strike and add — what DRAFT 1 misses
1. **What Josh will ask on reading §A:** "where do I SEE each of these?" — §A's table says what is new, not where it opens. Each row of §A owes its door (window ›
   control), one phrase. And "is the knob thing done?" — yes (N:23–26).
2. **Phones:** nothing is measured; the plan's [R]s are iPad-only at best (AO1·1). The honest per-cut line: "boot modules 8 (node [T]); the iPad report re-run; the
   phone UNVERIFIED". The first-run phone grid is 64³ — every device gate is stated at 64³ (the card gate too).
3. **The governor and a card:** the pass re-draws per notch (AO1·3); a card is never a `READERS` entry (it is not a CPU reader), its PROBE is.
4. **Undo/history per knob:** every new PROJECT key (Γ table, track hash + RATE + filter, potential id + params, lattice seed, VIBRATE mode + amplitude) is in every
   undo row (`history.js` reads `serialize({scope:'edit'})`) — default-ABSENT so `new-project --check` stays byte-exact; one history browser case per key.
5. **What the verifier of each cut runs:** named in D's conventions (AO1 note) — the node half, three `tools/` checks, the boot count; the lock is Josh's one line.
6. **What the paper cannot say:** "real-time" for a card or a record (they are 1–4 Hz pictures); "Lindblad" for the equalizer beyond the random-clock (Gaussian
   jitter) case it is a fixed point of; any RC accuracy as the texel's (it is the solver's; the texel is f16); "H₂⁺" without "1s-LCAO" if it returns; "the
   quasicrystal" for a 256-vertex patch; "DFT-certified" beyond the PySCF RKS numbers 0.7.3 measures; VORTEX's event count before 0.6.3; "novel" anywhere.

## AO1·9 · Sonnet's items — every one taken or refused
F1–F14: all taken in DRAFT 1 (F4 re-cut by AO1·3 — DRAFT 1 took writeTexture; the census shows its hidden costs). M1–M13: all taken except two halves of M9 —
N:27–29 (now §F-19) and A10's "benchmarks first" (now D.0). C1–C12: all taken as picked. B1–B8: all taken (B1's file split by AO1: rows in 0.6.0, picker in 0.7.4;
B2 re-cut by AO1·3). Nothing refused without a reason.

---

## AO1 · What I measured, what I changed, what I could not verify
**Measured** (node, scripts + JSON beside this file):
1. `opus1-f-names` — the app's own `moleculeRHF` + `namesOf` on every live STO-3G entry: **52 of 52 named, 0 refused, 11 groups** (D∞h C∞v D3h Td C3v C2v C2
   D2h D3d Cs D6h), 8.3 s for all solves. The ORBITAL knob (`chemview.js:75`) has shown these since 0.4.0 S1.
2. `opus1-b-rc-generic` — the generic central Hamiltonian two ways: ATOM's log-mesh solver vs `cornell.js` numerov, M = N = 4000, 21 rows: **32 ms vs 137–148 ms**
   (Yukawa), hydrogen 4.4·10⁻⁷ vs 1.7·10⁻⁵, the same bound counts (21/9/5/3/1), finite well 1.4·10⁻³ vs 7.9·10⁻³, confined R_c **1.6·10⁻⁶** (numerov 10⁻¹⁰).
3. `opus1-c-rm-session` — the real `molecular-session.js` + `packMolecule`: 8×8 and 16×16 lattices adopt and publish a complex orbital with no SCF; 17×17
   refused; `register('lattice')` refused (closed `MODEL_RANK`).
4. `opus1-e-song-stepper` — the TD-CIS `driveStep` with its inputs as arguments, on hydrogen: 91 labels **2.0 ms / 100 steps**, eig 38.6 ms once; unitarity
   2·10⁻¹¹ over 8,435 steps; vs RWA 5.3·10⁻⁴ at E₀ = 10⁻³ (equal to Sonnet's RK4 — physics, not integrator), 8.8·10⁻³ at E₀ = 10⁻².
5. `opus1-a-boot-card` — static census of `field.js`: 8 modules at boot, compile info awaited in sequence; render copies lazy; `writeTexture` absent; `frame()`'s two
   owner arms; `setResolution` destroys the texel; `molDirty` re-dispatch precedent; f16 decode only.
6. `opus1-g-estimates` — eight BUILD estimate-vs-actual pairs: additions 0.58–2.02× (mean 1.43), subtractions 0.48–0.78×; and the period re-derived: lcm = 7200,
   **T = 14400π a.u. = 1.0943 ps** ✓. Also KNOWN: the counted total is 27,989 → 233 under the cap (DRAFT 1 ✓).
**Changed** (inline above): names struck as new · RC on ATOM's solver (+90 → +54; gates re-stated) · RM's two hidden costs · RU as a lazy pass (+15 → +35) · the
STREAM queue struck (one stepper) · C7 widened to THE FIELD OWNER · lazy + derived producers · the catalogue rows from 0.6.0 in `tests/` · D.18 re-cut with risk ·
moves C4/M5a/M6/bead/H₂ curve · drops circular n ≈ 14 and H₂⁺ · the rotor and A–B gates made honest · CLAUDE.md fix made exact · A10 and N:27–29 given homes ·
§F-2 note, §F-8 re-star, §F-19/20.
**Could not verify:** any GPU or device number (the derived equalizer module's anchors, the pass's ms, a 256-site RM orbital per frame, the factor road at 96³, the
boot ms of anything); any phone; the log-mesh solver's convergence order (I ran one M); Richardson on it (atoms.js uses it — unmeasured here for the confined atom);
the hand line counts of the re-cut rows (DERIVED, UNVERIFIED until built); the 37 record-only molecules' names; Bates' H₂⁺ energies; LZ on the 91-label drive.

## Hand-back
**File:** `/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/plan-audit/AUDIT-OPUS-1.md` (DRAFT 1 in full, edits marked *(AO1: …)* / ~~struck~~, sections
AO1·1–AO1·9). Measurements beside it: `opus1-a-boot-card`, `opus1-b-rc-generic`, `opus1-c-rm-session`, `opus1-e-song-stepper`, `opus1-f-names`, `opus1-g-estimates`
(`.mjs` + `.json`), and `opus1-build-audit.py` (assembles the file from DRAFT 1 with every anchor asserted unique).
**Headlines.** (1) Josh's "1a₁, 1b₂ on the knob" is already live — 52/52 named; strike it as new. (2) RC = ATOM's own log-mesh solver: 4× faster, bound flag free,
≈ 54 lines, one radial solver in the app. (3) No STREAM queue: the song is the TD-CIS drive's stepper and ops (2 ms/100 steps at 91 labels). (4) RU as a lazy
pass over a storage buffer (≈ +35), not `writeTexture` (≈ +33 plus a frame-thread resample per governor notch). (5) THE FIELD OWNER — one predicate for four
hand-written stand-downs — is the real engine prerequisite (a lattice otherwise paints under hydrogen overlays, measured). (6) Producers compile lazily and derive
their WGSL by anchors: zero boot cost, no duplicated text. (7) The tree's BUILD record (adds ×1.4, subtractions ×0.5) re-cuts D.18; 0.6.1 and 0.8.0 now fit;
circular n ≈ 14 and H₂⁺ drop; the H₂ curve joins UHF.
**Unsettled for Fable:** the bucky-ball-first option (§F-2); the Central Lab's five (AO1·5); whether "Two Levels" stays a cut; every device number.
