# 0.7.2-alpha "Lattice" — what changed (Claude Yan / Fable 5.1, integrating Claude Sos's plan, 2026-10-15 night)

The engine plan's D.9. Plan `BUILD-PLAN.md` (Sos, 20:33); L0 done by Sos at the base (`22d1e66` + `052f564`); two Opus builders from `0b60c39`: L1 merged
`ab367eb` (branch `l1-lattice-b`, tip `827a2a8`), L2 merged on top (branch `l2-tunnel`, tip `f080001`). Build notes: `L1-BUILD.md`, `L2-BUILD.md`.
Josh's dial (09:35): tight builds, features only, pre-1.0; 22:05: "let's continue onwards with the plan to 0.7.3."

## The shape
LATTICE is a window of the LADDER's kind: its own register, its own canvas, one worker op, nothing of the field touched (THE LOCK is untouched by
construction). The model is one real symmetric H, or Hermitian under a flux, on ≤ 256 sites built on the CPU from the preset and its knobs; the eigensolve runs
in the math worker (`eigSymQL` real, `hermitianEigen` complex); the evolution ψ(t) = C e^{−iEt} C†ψ₀ is exact on the frame thread from the eigenpairs (N²
complex multiply-adds, 0.12 ms at 256), so the picture is pure in t like VIBRATE's. Readouts say what is measured and print the closed form beside it.

## L0 · THE DEAD LINES (Sos, at the base)
`absorb.js`' three test-only roads (`fieldFreeTrace`, `integrate`, `kickSpectrum`) moved to `tests/lib/absorb-extra.js`; the three tests import from there.
The first commit landed with a red gate echoed and not asserted; `052f564` fixed the moved roads' local helpers. Lesson recorded: assert a gate's exit code
before `git commit`.

## L1 · THE LATTICE WINDOW (`lab/lattice.js` 70 lines, `lab/lattice-model.js` 66 lines; seats in `windows/readouts.js`, `rack.js`, `mathworker.js`, `shell/persist.js`, `shell/settings.js`, `verbs.js`)
- Nine presets — CHAIN · RING · SQUARE · SSH · ANDERSON · AUBRY–ANDRÉ · AB RING · GRAPHENE (flakes of 24 / 54 / 96 sites) · HÜCKEL BENZENE — each showing only
  its knobs (N 3…256, n×n ≤ 16×16, J₁/J₂, W + SEED, λ · β · φ, Φ as the Peierls phase e^{iΦ/N}); J = 1 is the unit, so there is no J knob (a builder's
  correction). States GROUND · PACKET (centre, width, k₀) · SITE n · EIGEN m; a click on the eigen-ladder strip picks EIGEN m, a click on the picture SITE n.
- The picture: bonds in the kit's ink, site bars |ψᵢ|² as height and arg ψᵢ as the palette's phase hue; the eigen-ladder strip along the bottom with each
  level's weight |⟨k|ψ₀⟩|² as brightness.
- Readouts: IPR Σ|ψ|⁴ with t in 1/J, LEVELS (range, E₁ − E₀, mid spacing), CLOSED FORM · PREDICTION — the chain's −2J cos(πk/(N+1)), the ring's and the
  AB ring's −2J cos((2πk+Φ)/N), the square's separable sum, benzene's ±2β, ±β, ±β falling 1 + 2 + 2 + 1 (a₂u · e₁g · e₂u · b₂g; the degenerate e₁g pair is the HOMO
  MOLECULES' stem names — the brief's "same numbers in the stem" was wrong and is corrected), SSH's gap 2|J₁ − J₂| and its edge states, Aubry–André's self-dual
  λ = 2J and the Lyapunov exponent γ = ln(λ/2J) as the PREDICTION beside the measured IPR.
- Plumbing: worker op `lattice.solve`; the loop's `may('lattice')`/`tick('lattice')` with a READERS entry (parked by the READER LAW while closed); PROJECT
  record `instruments.lattice` flat and absent at the defaults (STATE-SCOPES one row); the `lattice` verb (preset, N, play) with an inventory line while the
  window is open; `export let LAT` is the one handle — the `app` literal gained no key (still 30). Ships closed, listed in + and WINDOW.
- **Checked (`tests/lattice.test.mjs`, 8 laws):** chain/ring/square/AB-ring levels vs the closed forms to 1e-12 (AB ring 1e-10); benzene −2, −1, −1, 1, 1, 2;
  SSH at N = 40 two edge states with IPR 0.4615 each (theory (1−r²)/(1+r²)/2 = 0.46) and bulk gap 1.6; Aubry–André N = 144, β = 89/144: mean IPR 0.0169 at
  λ = J vs 0.4416 at λ = 3J; graphene flakes' spectra symmetric to 1e-10; unitarity at t = 100 to 1e-12. Timing: a 256-site chain solves in 78–129 ms, the
  256-site AB ring in 1.49 s (Hermitian: a 512 realified eigSym), the evolution 0.12–0.15 ms a frame; the whole tick with paint 1.01 ms in Firefox.
  serialize-bytes 11/11 identical, each full record +82 B (the one new WORKSPACE layout row); keyboard-window suite green (the + list changed shape).

## L2 · TUNNELLING + THE PATCH (+18 in `lattice-model.js` / `lattice.js`; `tools/lattice/ammann-beenker.mjs` → `lab/ab-patch.json`; `tests/tunnel.test.mjs`)
- **TUNNEL** on the chain: BARRIER V 0…4 J on SITES 1 or 2 at the centre, a Gaussian packet from the left (entering TUNNEL by any road brings N 256,
  PACKET, x₀ 0.25, σ 4; keys passed in win, so a saved project keeps its own), PLAY and RATE the transport's, t from the state pick. The T · R readout
  reads once the in-barrier norm has stayed under 10⁻⁴ for 2/J (read literally at the first dip it latches on the trailing ripple — a builder's correction,
  chosen against waits of 0, 1, 2 and 4/J): "T 0.492 measured · 0.5000 T(k₀) · R + T = 1.000000000". The closed form T(k) = 4 sin²k / (4 sin²k + (V/J)²) is
  printed with the packet's own ⟨T⟩ over its momenta (σ_k = 0.177 puts ⟨T⟩ up to 0.026 from T(k₀), so the gate is against ⟨T⟩), and the two-site barrier's
  one resonance cos k = −V/2J (exists for V < 2J; "ON IT" when k₀ is within the packet's spread). The barrier is drawn.
- **AB PATCH**: cut-and-project from ℤ⁴ through the octagonal window centred on 0 (no lattice point on an edge): 249 vertices, 464 bonds all of length 1,
  exactly 8-fold; the first six 8-fold diffraction orbits by |q| with S ≥ 0.1 stored in f64 — the first at |q| = π(1+√2) = 7.584476, S = 0.4907. The window
  says "a patch", never "the quasicrystal"; `ammann-beenker.mjs --check` holds the JSON to the tool.
- **The TUNNEL demo** (V = 2J, k₀ = π/2 so T(k₀) = ½, a notebook page, the 1s + 2p_z beat on the stage for the cover), saved through the app's own
  `projects.save` / `exportText` road, cover by `make-covers`; STARTERS ten (`main.js`, `project-store.js`); `tests/opener.browser-test.mjs` edited for ten.
- **Checked (`tests/tunnel.test.mjs`, 4 laws):** the closed form against an independent transfer matrix to 1e-12 (one and two sites, three V, nine k); T at
  nine k₀ in [0.6, π−0.6] — outside it the slow momenta are still arriving when the chain's end echoes return (the readout says "waiting"; the note says why) —
  measured within 1.3e-3 of ⟨T⟩, worst floor 2.56e-2, T + R = 1 to 1e-12; at the resonance (V = J, k = 2.0944) T = 1 to 1e-12, a packet there 0.968357 vs
  ⟨T⟩ 0.968634; the patch's count, unit bonds, 8-fold symmetry and first peak recomputed to 1e-12 at all eight rotations. project-formats green with TUNNEL seeded.
- `lattice-model.js` carries the tree's first JSON import attribute (`with { type: 'json' }`): Node 22, the wiring scanner, the PWA test and Firefox accept it;
  the floor is Safari 17.2+ / Firefox 138+ (recorded, not chased: every device this project targets is above it).

## The light check (existing gates only) and the cut
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds; `tests/lattice.test.mjs` 8/8; `tests/tunnel.test.mjs` 4/4;
  `tests/project-formats.test.mjs` green; `tests/opener.browser-test.mjs` once on the merged tree (the builder edited it and could not run it); THE LOCK ×2 at
  the merge tip with `--query gastab=0` on BOTH runs — results in the HANDOFF §2 block of the cut.
- **Lines:** 29,159 → 29,324 (+165 = L1 +147, L2 +18; cap 29,450).

## Known, deferred (recorded)
The RM VOLUME (the lattice as a field owner through the complex orbital path — a measured row: its frame cost at 256 shells first), BANDS E(k) for SSH as a
plot, Kronig–Penney, Hofstadter's butterfly (0.8.1, a record), a quantum walk and spin chains (0.8.1), 2-D tunnelling; `__LW` gains no `lattice` member
(`lw-facade.json` untouched); the L2 commits carry Opus's own co-author line.
