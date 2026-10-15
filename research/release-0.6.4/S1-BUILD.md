# 0.6.4 S1 THE SONG DRIVE — build note (Opus builder, 2026-10-15)

Branch `s1-song-drive` off `ece8308` (the 0.6.3 cut tip). Not pushed, not merged.

## What landed, by seat
- **lab/mathworker.js**
  - `driveStep` (l.407) takes its free phases from `D.w` (zeros skipped) and its operators from `D.ops`; it no longer reads `chemSol.states`.
    `chemDriveInit` fills `D.w = [0, ω_K…]` (l.397). The chem drive's printed numbers are identical to base: `tests/molecular-drive.test.mjs`
    output diffs clean against `ece8308` (timing lines stripped).
  - THE SONG block (l.445–474): `hydrogenZ()` (z over the 91 labels, built once per worker, eigensolved once by the tree's `eigSym`),
    `songResample()` (the resampler, the FNV-1a hash of the decoded samples, the zero-crossing pitch), `SONG.init/run/set`.
  - Ops `h.drive.init { e0, t0, re, im, samples?, sampleRate, rate }` → `{ t, re, im, norm, hash, omega, dt, length }` ·
    `h.drive.run { to, maxSteps }` → `{ t, re, im, norm, taken, steps, lag }` · `h.drive.set { e0 }`. They sit in the worker's `CHEM` set
    (they finish while parked) and travel the chem road (`api.solve` = `solveChem`, the road `chem.drive.*` takes from statesview). Dispatch: l.147.
    The worker keeps the resampled track, so the samples ship only on the first init after a drop (a respawned worker answers "no track",
    and the next press ships them again).
- **lab/statesview.js** — the SONG row under the DRIVE rows (l.141–150): `SONG` switch, `FILE` (hidden `<input type=file accept=audio/*>`),
  the row as a drop target, `E₀` log knob 1e-4…1e-2 a.u. (default 3e-3), a wide readout and a `note` with the scale sentence.
  `songFile` (l.414) decodes with `AudioContext.decodeAudioData` and mixes to mono; `pumpSong` (l.424) is the drive's pump again: one request
  in flight, newest wins, each reply landed by `api.song.land` = `reg.anchorFrom(re, im, t)`; an edit of the register (its `version`) restarts
  the song from the register as it stands. `refreshSong` (l.438): the readout and the note. `update(t)` pumps first (l.727), so the song runs with
  MO-REGISTRY OFF. `songLoad` (l.772), `save()` (l.766, `...(song.meta && { song })`), `get songOn` (l.789).
- **lab/windows/molecules.js** l.97 — `api.song = { reg, hydrogen(), filming(), land() }`. `land` brackets the anchor with
  `app.state.rotTicking`, the rotation drive's road, so a landing writes no history row, then calls `touchState()`.
- **lab/rack.js** l.514 — the register's update also runs while `states.songOn`.
- **docs/STATE-SCOPES.md** — one row: `instruments.states.song`.

## The z-matrix check (throwaway `.tmp/s1/z.mjs`)
⟨1s|z|2p₀⟩ = 0.7449355390278893 against 128√2/243 = 0.7449355390278032: **8.6e-14**. ⟨2s|z|2p₀⟩ = −2.99999999999995 (|·| = 3).
Exactly symmetric; 420 nonzeros; ‖U diag Uᵀ − z‖_max = 2.0e-13. Built in about 310 ms, once per worker. The trapezoid is spectrally accurate
here because the integrand goes as r^(l+l'+3) at 0 and decays by r = 400.

## The resampler
dt = 0.5 a.u., or 0.25 when RATE/sampleRate > 0.5 (that is, when the audio is coarser than half a step in atom time). The track's atom time is
t_atom = RATE_drop × t_audio. q = dt·sr/RATE input samples per step (8 at RATE 3000, 48 kHz). Polyphase windowed sinc: Blackman,
cutoff fc = 0.5/max(1, q) cycles per input sample (the stepper's Nyquist), half-width K = ⌈4/fc⌉ input samples (64 at q = 8), a 64-phase table,
normalised by the sum of the taps. It is evaluated at the steps' **MIDPOINTS** t0 + (j + ½)dt, so Strang's midpoint field is a sample, not an
interpolation. My first version interpolated linearly at the midpoint, which shrinks a tone's amplitude by cos(ω dt/2) and put a 3e-3 error in
P(2p₀); sampling at the midpoints removed it. As a consequence the worker takes whole steps only: `run` snaps `to` down to the step grid, the
remainder under dt is `lag`, and the register free-evolves it. The track is peak-normalised, so E₀ is the field at the track's peak, and it is 0
past the end. The pitch is the zero-crossing rate of the resampled track (ω in Eh; f = ω·RATE/2π): exact for a tone and a crude centroid for
music. The readout names the nearest z-allowed line (Δl = ±1, Δm = 0, Δn ≠ 0) from a label populated above 1e-3.

## The tone check (throwaway `.tmp/s1/tone.mjs`)
A pure 179.049 Hz tone at RATE 3000 (ω = 0.375 Eh, on 1s–2p₀), starting from 1s, T = 2000 a.u. The reference is an independent RK4 (h = 0.05)
on the full 91-level equation with the analytic cos field.

| E₀ | song dt 0.5 | song dt 0.25 (4 kHz track, upsampled) | RK4 | RWA sin²(ΩT/2) | dt0.5 − RK4 | dt0.5 − dt0.25 | RWA departure |
|---|---|---|---|---|---|---|---|
| 1e-3 | 0.4590500605 | 0.4590144159 | 0.4590710089 | 0.4595815254 | 2.1e-5 | 3.6e-5 | 5.1e-4 |
| 1e-2 | 0.8367914762 | 0.8365380385 | 0.8371336028 | 0.8450198270 | 3.4e-4 | 2.5e-4 | 7.9e-3 |

- Unitarity: ‖c‖² − 1 = 2.1e-12 after 4000 steps (E₀ 1e-3) and 9e-12 (1e-2).
- Cost: 4000 steps in about 100 ms in node, so RATE 3000 at dt 0.5 (6000 steps/s) uses about 15 % of the worker.
- The zero-crossing pitch reads ω = 0.37546.
- The dt agreement is 1e-5-scale, not the plan's guessed 1e-6. Two causes:
  - The dt 0.25 road can only be reached by upsampling a low-rate track, and its 16-tap interpolator adds about 1e-4 of amplitude ripple, which
    the peak normalisation turns into a gain error.
  - The midpoint quadrature of the counter-rotating term (ΔE + ω = 0.75) at dt 0.5 is a genuine O(dt²) Bloch–Siegert error.
- The RWA departure at E₀ = 1e-2 (7.9e-3) matches the plan's 8.8e-3 scale.

## Gates
- `node tests/pwa.test.mjs --write`, then `./test.sh node`: **exit 0**. One earlier run went red on two things:
  - my own key collision (the free-phase array first went into `D.omega`, which is the carrier's key), fixed by naming it `D.w`;
  - the timing law W42-8 in `wigner.test` (a load flake: green alone, 0 of 16 failing).
- `node tools/new-project.mjs --check`: in step, so the empty project gains no key. A project without a song serialises no `song` key
  (`...null`). I did not run the two-tree `tools/serialize-bytes.mjs`: it needs two served trees and a free Firefox driver.
- Browser, served on 9311:
  - `tests/register.browser-test.mjs`: **0 failing of 22**.
  - Throwaway `.tmp/s1/song.browser.mjs`: **0 failing of 7**. It builds a 4 s, 48 kHz, 179.049 Hz WAV in the page, feeds it through the FILE
    input (DataTransfer) at RATE 3000 and E₀ 3e-3, and plays.
    - 2p₀ flops: 0.9996 at t = 1449 a.u. (π/Ω = 1406), back to 0.0094 at 3199, 0.94 at 4001.
    - The readout prints `tuned: 179 Hz → 1s₀–2p₀ (-0.0 %)` and `‖c‖² − 1 = 2e-11`.
    - The note prints `E₀ 0.003 a.u. = 1.5 GV/m · a 91-level bound model — above the over-barrier field 1/16n⁴ of n ≥ 3 nothing ionises here ·
      RATE 3000 = 73 fs of atom time per second`.
    - `save().song` = `{ hash: '8cdec79e:192000', name, e0: 0.003, rateAtDrop: 3000 }`, the same in the edit-scope serialize.
    - A record with another hash shows "track missing · drop it again" with SONG off and the register's version untouched.
    - A record without `song` clears it.
    - No page errors.
  - Housekeeping: the gate driver's `done()` hung after the summary, which left two orphaned geckodriver/Firefox pairs of mine. I killed them
    by pid.
- THE LOCK is the integrator's. No locked state carries `song`, and the song is off by default.

## FILM-SAFE (item 5)
`lab/render-exact.js`' HAZARDS carries **no** row for the molecular drive. The chem drive is film-safe by the film's own hold: while a film owns
the page the rack loop is held (`exportLocked`, no rAF), so no pump runs and the frame renders the register's closed-form free evolution from the
last landing. The song follows that road and adds one guard, `api.song.filming()`, so the pump issues nothing during a film. No hazard row was
added. An in-flight reply that lands just after frame 0 is the same interloper the existing `interloper` hazard's witnesses catch.

## Lines
`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`: 28,576 → **28,658 (+82)**, against a budget of ≤ +85.
By file (net): mathworker +31, statesview +50, molecules.js +1, rack.js 0. `lab/sw.js` changed only through
`pwa --write`.

## Deferred / honest limits
- The SONG row sits on MO-REGISTRY › STATES, as the plan seats it, but it drives **hydrogen's** register. It refuses any Hamiltonian other than
  hydrogen ("switch the Hamiltonian to hydrogen").
- The worker's free phases are E_n = −1/2n² and its z is Z = 1's. A B field, a Stark Fz, an ion Z ≠ 1 or a Sturmian propagator are honoured by
  the register's own `anchorFrom`/`at` between landings, but not by the stepper.
- The song shares the chem worker's FIFO, so a molecule solve in flight makes it lag.
- `aliasOf` is not consulted: H2's DRIVE readout does not consult it either.
- E₀ is not a modulation target. The TIMELINE as the track lane and ionisation are not in this cut, per the plan.
- On a project reopen or an undo with the **same** track in memory, the song keeps playing. With another track, or none, it stops.
