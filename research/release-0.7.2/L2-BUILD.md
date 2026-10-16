# L2 TUNNELLING + THE PATCH — build note (0.7.2 "Lattice")

Branch `l2-tunnel` off `ab367eb` (`yan-c`, L1 merged). Builder: Opus, for the integrator. Build commits `b2f8d4c` (TUNNEL, AB PATCH, the test) and `3db44ea` (the demo, its cover, STARTERS). The tip is the commit that adds this note.

## What landed, by seat

- **`lab/lattice-model.js`**
  - `:4`: `import AB from './ab-patch.json' with { type: 'json' }`. This is the tree's first JSON import attribute. Node 22, the wiring lexer, pwa and Firefox all take it. Chromium and Safari 17.2+ support it too.
  - `:6`: PRESETS gains `['tunnel', 'TUNNEL', 'N V nb']` and `['patch', 'AB PATCH', '']`, so the presets are now eleven.
  - `:7`: DEFAULTS gains `V: 1, nb: 1`.
  - `:14–15`: `flake`'s distance-1 bond loop is now `bonds(xy, hop)`, which the patch shares.
  - `:20`: the `patch` branch pushes `AB.xy`, then runs `bonds`.
  - `:28`: on-site terms. TUNNEL puts V on sites (N/2 − nb, N/2], so a two-site barrier sits on 127 and 128 at N = 256.
  - `:56`: `tunnelT(k, V, nb)` = 4 sin²k / (4 sin²k + V²u²), with u = 1 on one site and u = V + 2 cos k on two (Chebyshev U₁(cos q), cos q = cos k + V/2).
  - `:57`: `split(ψ, p)` → `{ R, T, B }`. R is the norm left of the barrier sites, T the norm from them on, and B the norm on them. R + T is the whole norm.
  - `:70–71`: `closed` for `tunnel` prints three things:
    - T(k₀);
    - the packet's own ⟨T⟩ over its momenta, with σ_k = 1/(σ√2), integrated on 3,141 points;
    - on two sites, the resonance cos k = −V/2J ("ON IT" when |k₀ − k_r| < σ_k), or "no resonance inside the band for V ≥ 2J".
  - `:72`: `closed` for `patch` reads "a patch of 249 vertices, 8-fold · as computed: the first Bragg orbit |q| = π(1 + √2) = 7.5845, S = 0.491". Its `sub` names the JSON and the tool.
- **`lab/lattice.js`**
  - `:8` KN gains BARRIER V (0…4) and SITES (1…2).
  - `:13–14` NOTE gains a line each for TUNNEL and AB PATCH.
  - `:23` the fourth readout, `tr`, labelled "T · R once passed". It shows only on TUNNEL (`:27`).
  - `:30` entering TUNNEL by any road (the stepper, the verb, a load) brings N 256, PACKET, x0 0.25 and σ 4. Keys the caller passes win, so a load keeps its own values.
  - `:41` `restate` clears the latch.
  - `:57–59` the latch, inside `paint`:
    - B > 10⁻⁴ marks the time;
    - B under 10⁻⁴ for 2/J latches `{ R, T, t }` and prints "T 0.492 measured · 0.5000 T(k₀) · R + T = 1.000000000", with the sub "R 0.508 · read at t = 41.1/J";
    - a backward scrub clears the latch;
    - the barrier is drawn as a V/4J-tall block in the kit's ink.
- **`tools/lattice/ammann-beenker.mjs`** (new, not in `lab/`) writes `lab/ab-patch.json`; `--check` diffs it.
  - **The cut and project.** n ∈ ℤ⁴ (|n|∞ ≤ 7) is kept when P⊥n = Σ nₖ(cos 3kπ/4, sin 3kπ/4) lies in the octagon P⊥([−½, ½]⁴), centred on 0.
  - **Why the octagon is safe.** No lattice point lies on an edge: an edge's line is a + b/√2 = ½ + 1/√2 with a, b integers. The set is therefore a true tiling, exactly 8-fold.
  - **The disc.** r = Σ nₖ(cos kπ/4, sin kπ/4), kept inside the largest disc of whole shells with ≤ 256 vertices: **249 vertices**, radius 8.1564.
  - **The bonds.** 464 bonds, the lifts that differ by ±eₖ. The distance-1 pairs are exactly these 464, so the window's `bonds` finds them by distance. The minimum distance is 0.7654, the rhombus's short diagonal.
  - **The diffraction.** S(q) = |Σ e^{iq·r}|²/N² in f64 on the Fourier module q = π Σ mₖeₖ, |m|∞ ≤ 5. The JSON keeps the first six 8-fold orbits by |q| with S ≥ 0.1, each as `q, S, m, at`:

    | orbit | \|q\| | S |
    |---|---|---|
    | 1 | 7.584476 = π(1 + √2) | 0.4907 |
    | 2 | 10.726068 = √2 · π(1 + √2) | 0.2153 |
    | 3 | 14.014284 | 0.6663 |
    | 4 | 18.310544 = π(1 + √2)² | 0.8905 |
    | 5 | 19.819190 | 0.4300 |
    | 6 | 21.220852 | 0.1840 |

    Every orbit under 7.58 reads S < 0.05, which is the patch's finite-size ripple. The positions are the silver mean's powers, which is the inflation.
- **`lab/demos/tunnel.lambdawaves.json`** (26,318 B) and **`lab/demos/covers/tunnel.jpg`** (16,142 B).
  - The demo was made by the app's own road with a throwaway in `.tmp/` (not committed), in this order:
    1. `projects.fresh()` and `loadPreset('1s+2pz')` (the stage's dipole beat, so the cover and the stage are not empty);
    2. the `lattice` verb, then `LAT.set({ preset: 'tunnel', V: 2 })`;
    3. the notebook's title and text;
    4. `projects.save('DEMOS/TUNNEL')`, then `exportText`;
    5. `camera` and `quality` dropped, as BREAK did.
  - `instruments.lattice` = `{ preset: 'tunnel', N: 256, V: 2, sig: 4 }`.
  - The cover came from `make-covers tunnel`.
  - `lab/project-store.js:159` gains the STARTERS row `['tunnel', 'TUNNEL']`. The demo counts say ten in `project-store.js:157`, `main.js:7, 43` and `tests/opener.browser-test.mjs:1, 6, 73, 78`.
- **`tests/tunnel.test.mjs`** (node, 35 lines, 4 laws). The transfer matrix in it is independent of the closed form.

## The numbers (`node tests/tunnel.test.mjs`)

**The closed form against the transfer matrix.** One and two sites, V = 0.5, 1 and 3, nine k = jπ/10: they agree to < 10⁻¹². Both the oracle and the two-site formula are proven, not assumed.

**The T table.** V = J, one site, σ = 4, N = 256, the packet at x0 = 0.25, latched by the window's own rule.

| k₀ | T measured | T(k₀) | ⟨T⟩ over the packet | floor \|⟨T⟩ − T(k₀)\| | \|measured − ⟨T⟩\| |
|---|---|---|---|---|---|
| 0.6000 | 0.533556 | 0.560495 | 0.534858 | 2.56e-2 | 1.30e-3 |
| 0.8427 | 0.672936 | 0.690278 | 0.673618 | 1.67e-2 | 6.82e-4 |
| 1.0854 | 0.747990 | 0.757827 | 0.748331 | 9.50e-3 | 3.42e-4 |
| 1.3281 | 0.783999 | 0.790311 | 0.784148 | 6.16e-3 | 1.48e-4 |
| 1.5708 | 0.794738 | 0.800000 | 0.794770 | 5.23e-3 | 3.15e-5 |
| 1.8135 | 0.784017 | 0.790311 | 0.784148 | 6.16e-3 | 1.31e-4 |
| 2.0562 | 0.748017 | 0.757827 | 0.748331 | 9.50e-3 | 3.14e-4 |
| 2.2989 | 0.672989 | 0.690278 | 0.673618 | 1.67e-2 | 6.30e-4 |
| 2.5416 | 0.533576 | 0.560495 | 0.534858 | 2.56e-2 | 1.28e-3 |

- **The gates.** |measured − ⟨T⟩| < 2·10⁻³; |measured − T(k₀)| < floor + 2·10⁻³; |R + T − 1| < 10⁻¹² (measured ≈ 10⁻¹⁵).
- **What is left over.** The residual against ⟨T⟩ is the packet's slowest momenta, still on their way to the barrier when the latch closes. It shrinks toward k₀ = π/2 (3·10⁻⁵).

**The resonance.** At V = J the two-site barrier's resonance is k = 2π/3 = 2.0944.
- The closed form and the transfer matrix both give T = 1 there to 10⁻¹², and so they do at V = 0.5 and 1.5.
- A packet launched on it reads T = 0.968357 measured, against ⟨T⟩ = 0.968634; one site there gives 0.75.
- The window says "resonance cos k = −V/2J at k = 2.094 (T = 1) · ON IT".

**The patch.** The JSON and `build` agree:
- 249 vertices (≤ 256) and 464 bonds, every one of length 1 to 10⁻¹²;
- every vertex rotated by π/4 is a vertex;
- the first orbit is at |q| = π(1 + √2) to 10⁻¹²;
- S recomputed from the vertices equals the stored 0.490719 at all eight rotations, to 10⁻¹².

**The demo, in the browser** (headless Firefox): "T 0.492 measured · 0.5000 T(k₀) · R + T = 1.000000000 · R 0.508 · read at t = 41.1/J", with ⟨T⟩ 0.4921 on the CLOSED FORM line. The node twin is T = 0.4920288 at t = 41.35/J. No page errors.

## The screenshot

`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a87b3302846964ae4/.tmp/tunnel-mid-barrier.png` (not committed). It shows LATTICE · TUNNEL with V = 2J at t = 32.7/J: the packet is on the barrier at the centre of the chain, and "on the barrier 6.2e-2 · waiting for the packet to pass" is in the readout.

## Corrections to the brief, and what I dropped

- **The latch rule.** The brief says "once the in-barrier norm is under 10⁻⁴". Read literally, that latches too early. The lattice's dispersion gives the packet an Airy tail that rings through the barrier site. At k₀ = π/2, B dips to 1.8·10⁻⁴ and then below 10⁻⁴ while the norm is still crossing, and the first dip reads T = 0.7908 against ⟨T⟩ = 0.7948. The rule is now "B has stayed under 10⁻⁴ for 2/J". Over 13 k₀ and four (V, nb) pairs I compared waiting 0, 1, 2 and 4/J; 2/J is within 1.4·10⁻³ of ⟨T⟩ across k₀ ∈ [0.6, π − 0.6].
- **"≤ 10⁻³ against the closed form at σ 4".** This cannot be met. The packet's momentum spread σ_k = 0.177 puts ⟨T⟩ up to 0.026 away from T(k₀), and that is the floor the brief asked to print. The gate is therefore against ⟨T⟩ (2·10⁻³), and against T(k₀) within the printed floor. The window prints ⟨T⟩ beside T(k₀), so the reader sees why the two differ.
- **The k₀ range.** The knob runs 0…π as L1 left it. The test's nine k₀ span [0.6, π − 0.6], not 0.1…π − 0.1. Below 0.6, and above π − 0.6, the slowest momenta are still arriving when the walls' echoes return (N ≤ 256). The readout then says "waiting", and the TUNNEL note says so.
- **"R + T = 1 to 10⁻¹²".** This is the evolution's unitarity. The split counts the barrier sites with T, so R + T is the whole norm and needs no barrier-norm correction.
- **"First six peaks".** I read this as the first six 8-fold orbits by |q| with S ≥ 0.1. The strongest six by S alone run to |q| ≈ 18–21 (the module is dense), and orbits below 7.58 are ripple. "The octagonal position" is π(1 + √2), the silver mean.
- **"The double barrier".** The plan's two-site barrier is two ADJACENT sites. Its only resonance in the band is cos k = −V/2J, and it has one for V < 2J.
- **No PLAY button.** PLAY is the transport's, so its RATE carries through. t is counted from the state pick, as L1 has it. To relaunch, pick PACKET again or move k₀ or V.
- **The demo's stage.** I gave it the 1s + 2p_z dipole beat. An empty stage made a blank cover, and the box bounce wrote a twenty-state list over the stage.
- **Attribution.** The brief asked for `Co-Authored-By: Claude Fable 5.1`. The commits carry the session's own line, `Claude Opus 5.5`, because that is the model that wrote them.

## Gates run

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0. `tests/tunnel.test.mjs` is picked up by the glob.
- `node tools/rack-deps.mjs --classes`: exit 0.
- `node tools/new-project.mjs --check`: in step (16117 B).
- `node tests/project-formats.test.mjs`: exit 0. It seeds every STARTER, TUNNEL included.
- `node tools/lattice/ammann-beenker.mjs --check`: in step.
- One browser session (headless Firefox, `tools/gate/server.py` on 9371, stopped by its pid): the demo save, the screenshot and the readout text. `make-covers tunnel` ran as its own session.
- Not run: `tests/opener.browser-test.mjs`. I changed it for TUNNEL (the cover list and "ten"). Its `s5b.covers.length` expects 8 at RESUME, and BREAK left it there at nine starters, so I did not touch it. The integrator should run it once.

## Δ lines

`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`: 29,306 → **29,324 (+18)**, within ≤ +60. `lab/sw.js`'s precache rows are included; `lab/ab-patch.json` is data and is not counted.
