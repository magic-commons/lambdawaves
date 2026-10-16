# L1 THE LATTICE WINDOW — build note (0.7.2 "Lattice")

Branch `l1-lattice-b` off `0b60c39` (`yan-c`). Builder: Opus, for the integrator. Tip: the commit that adds this note (`git log -1 l1-lattice-b`).
The build commit is `e333938`. The branch is not `l1-lattice` because that name is held, with no work on it, by the paused worktree `agent-a426362f9165fc09f` at `052f564`.

## What landed, by seat

- **`lab/lattice-model.js`** (new, 66 lines). It is DOM-free, so the worker, the node test and the verb table all import it, as `ladder-model.js` sits beside `ladder.js`.
  - `PRESETS :5` is the one table: id, label and the knobs each preset shows. The nine presets are CHAIN · RING · SQUARE · SSH · ANDERSON · AUBRY–ANDRÉ · AB RING · GRAPHENE · HÜCKEL BENZENE.
  - `DEFAULTS :7` holds every knob and the state. `BETA` is (√5−1)/2.
  - `build(p) :16` returns `{ n, re, im, xy, hop }`. A bond is H = −t. The AB ring carries the Peierls phase e^{iΦ/N} on every forward bond, and `im` is null unless there is a flux. Anderson's W(r − ½) uses a seeded mulberry32. Aubry–André is λ cos(2πβi + φ), where a test may pass `beta`.
  - `flake(m) :9` builds the honeycomb of m rings of hexagons, 6m² sites: 6 / 24 / 54 / 96. HÜCKEL BENZENE is m = 1.
  - `solveLattice :29`: real goes to `eigSymQL`; Hermitian goes to `hermitianEigen`, with its `{ w, V }` mapped to `{ E, re, im }`.
  - `psi0 :33`: GROUND · PACKET (a Gaussian of width σ about the site nearest `x0` of the way along, with e^{ik₀·Δx} along x) · SITE n · EIGEN m.
  - `evolver :43` returns `{ ar, ai, at(t) }`. a = C†ψ₀ is computed once; `at(t)` is ψ = C e^{−iEt} a, N² complex multiply-adds.
  - `ipr :51`.
  - `closed :53` returns `{ levels | null, line }` per preset. The levels are the closed form: −2J cos(πk/(N+1)); −2J cos(2πk/N); −2J cos((2πk+Φ)/N); the square's separable sum; benzene's ring of 6. The lines are SSH's gap 2|J₁ − J₂| and its edge states; Aubry–André's self-dual λ = 2J and γ = ln(λ/2J) with ξ = 1/γ; Anderson's ξ(0) ≈ 105 J²/W² (Kappus–Wegner); and graphene's sheet E(k), "the flake's levels, not the sheet's".
- **`lab/lattice.js`** (new, 70 lines). `createLattice(host, api) :13` builds the window in LADDER's shape.
  - The controls are the PRESET stepper (`mol-step`), the STATE seg, and the knobs from `KN :8`. Only the preset's knobs and the state's knobs show (`sync :23`).
  - The canvas is 180 px (`.ladder-c`). It draws the bonds in the kit's ink, then the site bars: |ψ|²/max as the height and arg ψ through the palette's LUT, with `toLUT(hsvWheel())` when the palette is off (the field's own wheel). The eigen-ladder strip runs along the bottom; each level's brightness is its weight |⟨k|ψ₀⟩|².
  - A click on the strip picks EIGEN m. A click on the picture picks the nearest SITE n.
  - The readouts are IPR (with t in 1/J), LEVELS (the range, E₁ − E₀ and the mid spacing) and CLOSED FORM · PREDICTION ("the measured levels agree to …", or "the prediction; the IPR is the measurement"). Below them is a note on units, plus a caption for benzene, graphene and Aubry–André.
  - `set :27` re-solves only when a Hamiltonian key moves. A state key only re-projects (`restate :37`, with t₀ = the clock's t at the pick).
  - `update(t) :43` is the loop's tick. `export let LAT` is the one handle that persist and the verb read; the `app` literal gains no key.
- **`lab/windows/readouts.js:131–134`**: LATTICE's device, made inside `createCalcMetersLadder()` right after LADDER's. It ships closed and is appended to the rack. `createLattice(wLat.body, { active, t, palette, solve: solveCard({ op: 'lattice.solve', … }, fallback) })` follows, then a `devopen` that calls `prepare()`. `wLat` and `lattice` are returned from the seat.
- **`lab/rack.js`**:
  - `:707`: the seat's destructure gains `wLat, lattice`.
  - `:739`: READERS gains `lattice: wLat`, so the READER LAW may park it and `windowActivity` tracks it.
  - `:541`: `if (may('lattice', wLat)) tick('lattice', () => lattice.update(clock.t))` inside `cpuTick`, after CALCULUS.
- **`lab/mathworker.js:12, :42, :137`**: the header row, the import, and `lattice.solve` → `{ result: solveLattice(m) }`.
- **`lab/shell/persist.js:9, :59, :238`**: `instruments.lattice = LAT.save()` (absent at the defaults) and `LAT.load(I.lattice)`. An absent record restores the defaults.
- **`lab/shell/settings.js:136`**: `KIND.lattice = 'info'`.
- **`lab/verbs.js:8, :48–49, :112`**:
  - the `lattice` verb, with args `preset?` (an enum from PRESETS), `N?` and `play?`. It opens the window by `layout.reopen`, sets the preset and N, plays or pauses, and fades "LATTICE · SSH";
  - the inventory line `lattice` (the preset plus the readouts' text), present only while the window is open.
- **`docs/STATE-SCOPES.md`**: one row, `presentation.instruments.lattice`.
- **`tests/lattice.test.mjs`** (node, 8 laws).

## The numbers and their gates (`node tests/lattice.test.mjs`)

| check | gate | measured |
|---|---|---|
| chain levels vs −2J cos(πk/(N+1)) at N = 3, 40, 256 | < 1e-12 | green |
| ring vs −2J cos(2πk/N) at N = 30 | < 1e-12 | green |
| AB ring vs −2J cos((2πk+Φ)/N) at N = 24, Φ = 0.3, 1.7, π | < 1e-10 (`hermitianEigen` averages each conjugate pair) | green |
| square 6×6 separable sum | < 1e-12 | green |
| Hückel benzene | −2, −1, −1, 1, 1, 2 to 1e-9 | green |
| SSH at N = 40, J₁ = 0.2, J₂ = 1: two edge states | \|E\| < 1e-8, IPR > 0.4 each | IPR 0.4615 in the browser (theory (1−r²)/(1+r²)/2 = 0.46) |
| SSH bulk gap E₂₁ − E₁₈ | 2\|J₁ − J₂\| = 1.6 ± 0.05; the trivial side has no edge pair | green |
| Aubry–André at N = 144, β = 89/144: mean IPR over all eigenstates | λ = J < 0.05, λ = 3J > 0.3 | 0.0169 · 0.4416 |
| graphene flakes | 24 / 54 / 96 sites, E_k = −E_{N−1−k} to 1e-10 | green |
| unitarity at t = 100 (chain 128 real, AB ring 48 Hermitian) and ψ(0) = ψ₀ | 1e-12 | green |

**Timing (node, this machine).**

| preset | solve | evolution a frame |
|---|---|---|
| chain, 256 sites | 78–129 ms | 0.115–0.128 ms |
| square 16×16 | 100 ms | 0.125 ms |
| AB ring, 256 sites (Hermitian: a 512 realified eigSym plus clustering) | **1.49 s**, on the cards worker | 0.150 ms |
| graphene, 96 sites | 2.7 ms | 0.018 ms |

In Firefox, the governor's EMA of the whole `tick('lattice')` (evolution plus the 256-bar paint) read 1.01 ms while playing a 256-site chain packet.

## Gates run

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0.
- `node tools/rack-deps.mjs --classes`: exit 0. The hinge holds; readouts reads fwd + shared = 7; `app` is still 30 keys, `w` 71.
- `node tools/new-project.mjs --check`: in step (16117 B).
- `node tools/serialize-bytes.mjs`, base (`git archive 0b60c39` on :9362) against this tree (:9361):
  - all 11 edit shas are identical;
  - each full record grows by 82 B, which is the one new WORKSPACE layout row. `lattice` R closed is seated after INFORMATIONAL, "where an unlisted card stays", because the NEW file's layout does not list it.
- Browser, once: `tests/keyboard-window.browser-test.mjs`, GREEN; the + list changed shape.
- Screenshots (throwaway driver `.tmp/lat-shot.mjs`, not committed):
  - `.tmp/lattice-ssh.png`: SSH, N = 40, J₁ = 0.2, the edge eigenstate m = 19. Its weight sits on both ends, red and cyan (phases 0 and π), and the strip's level 19 is lit.
  - `.tmp/lattice-graphene.png`: a 54-site flake with a packet after 3.5/J.
  - Neither run logged a page error.

## Dropped, and why

- **The J knob.** J = 1 is the unit (the brief's own law), so a J knob only rescales energy and time. J₁/J₂ (SSH), λ (AA) and W (Anderson) are the ratios that matter, and they are knobs.
- **"n×n ≤ 8×8 under a flux".** No preset puts a flux on the square; the flux lives on the AB ring.
- **The PROJECT record's shape.** It is flat: only the keys that differ from DEFAULTS. The plan named `{ preset, knobs, state, seed }`.
- **Benzene caption (corrected).** The brief says the six levels are "the same numbers MOLECULES' STO-3G benzene names in its stem". The record's stem names no ±2β numbers: it holds the HOMO `1e1g`, the gap and the point group. The caption now says what is true: the six π levels ±2β, ±β, ±β fall 1 + 2 + 2 + 1 (a₂u · e₁g · e₂u · b₂g), and the degenerate e₁g pair is the HOMO the stem names.
- **N starts at 3, not 2.** A ring of 2 has one bond, not two.
- **Square and graphene packets.** k₀ is along x, and the centre is the site nearest `x0` of the way through the site list (row-major on the square).
- **The facade.** `__LW` has no `lattice` member, so `lw-facade.json` is untouched. A script reaches the handle through the module (`import { LAT } from '/lab/lattice.js'` in a page module) or through the verb.

## Δ lines

`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`: 29,159 → **29,306 (+147)**, within ≤ +150. `lab/sw.js` +2 (two precache rows) is included.

## For L2 (TUNNELLING + THE PATCH extends `lab/lattice.js` / `lattice-model.js`)

- **A preset.** Add a row to `PRESETS` (`lattice-model.js:5`) with its knobs, the defaults to `DEFAULTS :7`, a branch in `build :16` (sites in `xy`, bonds in `hop`, on-site terms in the diagonal loop at the end), and a `case` in `closed :53` for its line (TUNNEL's T(k) oracle). A new knob is one entry in `KN` (`lattice.js:8`).
- **The packet.** The state lives in `P.state`, `x0`, `sig`, `k0` (`psi0`, `lattice-model.js:33`). `restate` (`lattice.js:37`) projects it into `ev = evolver(...)`. `ev.at(t)` gives ψ at any t, so T and R are sums of |ψᵢ|² right and left of the barrier at the time the in-barrier norm falls under 1e-4.
- **The readouts.** `ro` (`lattice.js:21`) holds three; a fourth is one more key there, and it reaches the inventory through `LAT.ro`. Per-frame readouts are written in `paint :44`; per-solve readouts in `restate :37`.
- **The clock.** t is the transport's `clock.t` from t₀ (the pick), read through the loop's `may/tick('lattice')` (`rack.js:541`). L2's "PLAY on the window's own clock" can keep t₀ and read the same t.
- **The AB patch.** A vertex set baked into `lab/ab-patch.json` becomes a `build` branch. The bonds come from the edge length, as `flake`'s bonds come from distance 1 (`lattice-model.js:13`).
- **The line budget.** L1 used 147 of its 150, so the cap leaves 29,450 − 29,306 = **144** for L2.
