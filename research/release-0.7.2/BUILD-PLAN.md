# 0.7.2 "Lattice" — THE BUILD PLAN (Claude Sos / Fable 5.1, drafted 2026-10-15 20:33 while 0.7.1 builds; base and cap filled at the 0.7.1 cut)

The engine plan's D.9 (`../release-0.6.0/PLAN.md` l.274; C.4 l.188; the ladder row l.39: "a chain, ring or square lattice; disorder, a flux, the Aubry–André knob,
SSH edges, graphene; a packet TUNNELS through a barrier on the chain with T and R read out; an Ammann–Beenker patch — as site bars, and as a volume with phase as
hue if its frame cost measures · + › LATTICE · tap TUNNEL"). The census: `../release-0.6.0/census/SYSTEMS.md` rows 4, 16–21 and the RM/RW/RU note l.110.
Josh's dial (09:35): tight builds, features only, pre-1.0. Base: `yan-c` at the commit carrying the briefs after the v0.7.1-alpha cut (**TO FILL**); lines
**TO FILL**; cap = lines × 1.01. Three rows; the integrator merges L0, L1, then L2, light check, cut `v0.7.2-alpha` "Lattice".

## The shape (the law of this cut)
LATTICE is a WINDOW of the LADDER's kind (`lab/ladder.js`: its OWN register, its own canvas, a worker op, nothing touching the main register, the clock or the
camera except to read t) — a new file `lab/lattice.js` in `lab/` (never `lab/windows/`), registered like LADDER with a row in + and WINDOW. The model is one
real symmetric H (N ≤ 256 sites) or Hermitian under a flux, built on the CPU from the preset and the knobs; the eigensolve is `linalg.js` `eigSymQL` (real) or
`density.js` `hermitianEigen` (complex) in the MATH WORKER (one op `lattice.solve { H }` → { E, C }); the evolution ψ(t) = C e^{−iEt} C†ψ₀ is exact on the frame
thread from the eigenpairs (N² multiply-adds a frame, under 0.1 ms at 256), so the picture is pure in t like VIBRATE's. The picture is SITE BARS on the window's
canvas — |ψᵢ|² as bar height, arg ψᵢ as hue from the palette's own phase ramp, the sites placed by the preset's geometry (a line, a ring, a square, a honeycomb, the
AB patch); the field is NOT touched in this cut: the RM volume (sites as narrow s-shells through the molecule kernel's complex orbital path) is DEFERRED to a
measured row after this cut unless L2 lands under plan with room (see "Deferred"). Readouts say what is measured: the IPR Σ|ψᵢ|⁴, the level spacing, E(k)'s closed
form where one exists (−2J cos k; the SSH gap 2|J₁ − J₂|; the AB ring E = −2J cos((2πk + Φ)/N)), the Aubry–André self-dual point λ = 2J, "localised" only by the
IPR's number. TUNNELLING is the chain with a one- or two-site barrier V on sites, a Gaussian packet of momentum k₀ launched from the left, T and R read as the
norm right/left of the barrier after the packet has passed (the time when the norm in the barrier's two sites falls under 10⁻⁴), the oracle in the readout:
T(k) = 4 sin²k / (4 sin²k + (V/J)²) for the one-site barrier (checked at nine points to 3·10⁻¹⁶ by `sonnet2-s1`), T + R = 1 to 10⁻¹² — printed beside the
measured T. The Ammann–Beenker PATCH is a vertex set of ≤ 256 vertices built by the cut-and-project (or inflation) rule in `tools/`, baked once as a small JSON
in `lab/` with its f64 diffraction pattern's first peaks as the oracle; the window says "a patch", never "the quasicrystal".

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **L0 THE DEAD LINES** (Haiku @ xhigh) | `lab/absorb.js`' `fieldFreeTrace`, `integrate`, `kickSpectrum` (used by tests only — `grep` finds no `lab/` caller) move to `tests/lib/absorb-extra.js`; the three tests import from there; nothing else changes. | `lab/absorb.js`, `tests/lib/absorb-extra.js`, `tests/{absorb,density,response-fit}.test.mjs` | **≈ −60** |
| **L1 THE LATTICE WINDOW** (Opus) | **`lab/lattice.js`** (new, ≤ 130 lines): `createLattice(app)` — the device (id `lattice`, eyebrow LATTICE), PRESET stepper **CHAIN · RING · SQUARE · SSH · ANDERSON · AUBRY–ANDRÉ · AB RING · GRAPHENE · HÜCKEL BENZENE** with their knobs shown per preset (N 2…256 (chain/ring), n×n ≤ 16×16 (square; ≤ 8×8 under a flux), J, J₁/J₂ (SSH), W + SEED (Anderson; the seed a PROJECT key), λ · β = (√5−1)/2 · φ (Aubry–André), Φ (AB ring; the flux as the Peierls phase e^{iΦ/N} on every bond), a honeycomb flake of 24/54/96 sites (graphene; E = ±J|1 + e^{ik·a₁} + e^{ik·a₂}| printed for the infinite sheet beside the flake's own levels), Hückel benzene (J = β; the six levels ±2β, ±β, ±β — the same numbers MOLECULES' STO-3G benzene names in its stem, said in the caption)); the STATE row: GROUND · PACKET (centre, width, k₀) · SITE n · EIGENSTATE m (the eigen-ladder as a small bar strip, click to pick); the canvas (site bars with the palette's phase hue; the geometry per preset); the readouts IPR · gap · E(k)'s closed form · "self-dual λ = 2J" / "the Lyapunov exponent ln(λ/2J) = …" (closed form, printed as the prediction beside the IPR); the worker op `lattice.solve` in `lab/mathworker.js` (≤ 12 lines: real → `eigSymQL`, Hermitian → `hermitianEigen`); the evolution on the frame thread from the eigenpairs, governed through the loop's `may('lattice')`/`tick('lattice')` as LADDER's; PROJECT keys `lattice { preset, knobs, state, seed }` default-absent (`docs/STATE-SCOPES.md` one row; bytes unchanged); one row in + and WINDOW (the kit's `rk.register` as LADDER's); the `lattice` verb for Gemma (preset, N, play) + an inventory line. `tests/lattice.test.mjs` (node, ≤ 50 lines): the chain's levels −2J cos(πk/(N+1)) to 10⁻¹²; the ring's E(Φ) closed form; the SSH gap and its two edge states at J₁ < J₂ (IPR > 0.4 on 40 sites); Aubry–André IPR jumps across λ = 2J (N = 144 = F₁₂, β = F₁₁/F₁₂); graphene's flake levels symmetric about 0; unitarity of the evolution to 10⁻¹² at t = 100. | `lab/lattice.js`, `lab/mathworker.js`, `lab/rack.js` (the register seat, ≤ 4 lines), `lab/verbs.js`, `lab/persist.js` (0 or 2), `docs/STATE-SCOPES.md`, `tests/lattice.test.mjs` | **≤ +150** |
| **L2 TUNNELLING + THE PATCH** (Opus, after L1 merges — it extends `lab/lattice.js`) | **TUNNEL** preset on the chain: BARRIER V (0…4 J) on one or two sites at the centre, a PACKET from the left (σ 4 sites, k₀ 0.1…π−0.1), PLAY on the window's own clock (t in units of 1/J, RATE from the transport), the T · R readout "T 0.412 measured · 0.4118 T(k₀) · R + T = 1.000000000" once the packet has passed (the in-barrier norm under 10⁻⁴), the two-site barrier's resonances said when V and k₀ sit on one (T → 1); the **AB PATCH** preset: `tools/lattice/ammann-beenker.mjs` writes `lab/ab-patch.json` (≤ 256 vertices by the cut-and-project rule from ℤ⁴ with the octagonal window, their 8-fold diffraction's first six peaks as f64) — the window draws the vertices as sites with nearest-neighbour hopping (edge length 1), "a patch of 2xx vertices, 8-fold · as computed"; the TUNNEL demo (`lab/demos/tunnel.lambdawaves.json` + cover; STARTERS +1) saved by the app's own road. `tests/tunnel.test.mjs` (node, ≤ 40 lines): T at nine k₀ against the closed form (≤ 10⁻³ at σ 4 on N = 256 — the packet's momentum spread is the floor, printed), T + R = 1 to 10⁻¹², the double barrier's first resonance, the patch's vertex count and its diffraction's first peak at the octagonal position. | `lab/lattice.js`, `tools/lattice/ammann-beenker.mjs`, `lab/ab-patch.json`, `lab/demos/*`, `tests/tunnel.test.mjs` | **≤ +60** |

## Laws for both builders
- Your own worktree, your own branch (`l0-dead`, `l1-lattice`, `l2-tunnel`) from the base commit (L2 from L1's merge); NO push; never edit `lab/mir/**` or
  `lab/fonts/**`; after any `lab/` edit `node tests/pwa.test.mjs --write` then `./test.sh node`. `node tools/rack-deps.mjs --classes` holds (a new window
  registers its `app.w`/`app.state` slot as LADDER does); `node tools/new-project.mjs --check`; `node tools/serialize-bytes.mjs` (default-absent keys: the edit
  bytes never move); `tests/keyboard-window.browser-test.mjs` once if the + list changes shape.
- THE LOCK is sacred: LATTICE closed = the picture byte for byte (no field write — this cut never touches `field.js`). The integrator runs it ×2 at the merge with
  `--query gastab=0` on BOTH runs.
- Line budgets are the table's; count `find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`. One build note each: `research/release-0.7.2/L<n>-BUILD.md`
  (seats with file:line; the numbers with their gates — L1: the chain/ring/SSH/AA/graphene checks and the solve's ms at 256; L2: the T table at nine k₀, the
  resonance, the patch's count and peak; a headless screenshot's path; what you dropped and why; Δ lines; branch and tip). Node only for the gates; ONE browser
  check each; never `pkill -f`; ports 9241, 9443, 8721/8741, 8731/8735 are taken.

## Gates (existing only) · the cut · deferred
Node gate 0 after each merge; `pwa --write`; `tests/lattice.test.mjs` + `tests/tunnel.test.mjs`; THE LOCK ×2 at the merge tip (860 and 1004, 0/0); the line law;
then the local cut `v0.7.2-alpha` "Lattice" by the cut script's shape, CHANGELOG, snapshot. NO push, NO deploy, NO gh release. Deferred by name: the RM VOLUME
(the lattice as a field OWNER through the complex orbital path — a measured row after this cut: its frame cost at 256 shells first, the volume ships only if it
costs ≤ 10 % at 64³), BANDS E(k) for SSH as a plot, Kronig–Penney, Hofstadter's butterfly (0.8.1, a record), a quantum walk and spin chains (0.8.1), 2-D tunnelling.
