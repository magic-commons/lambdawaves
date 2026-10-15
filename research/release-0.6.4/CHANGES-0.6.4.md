# 0.6.4-alpha "Hydrogen Song" — what changed (Claude Yan / Fable 5.1, 2026-10-15)

Josh's dial: tight builds, features only, pre-1.0; §F-7 ★ applied as written (audio off by default behind a consent switch, folded into one octave, muted under
reduced motion). Two Opus builders in their own worktrees from the 0.6.3 cut tip `ece8308`; merged S2 `4b6b32b`, S1 `bd9f207`. Build notes: `S1-BUILD.md`,
`S2-BUILD.md`. Plan: `BUILD-PLAN.md`.

## S1 · THE SONG DRIVE (`lab/mathworker.js`, `lab/statesview.js`, `lab/windows/molecules.js`, one condition in `lab/rack.js`)
- Hydrogen is DRIVEN by a track: i ċ = (diag(E) + E_z(t)·z) c over the 91 labels through the molecules' own Strang step — `driveStep` now takes its free phases
  and operators from the drive (the chem drive's output byte-identical against the base), hydrogen's z built once per worker (⟨1s|z|2p₀⟩ = 128√2/243 to 8.6e-14,
  ⟨2s|z|2p₀⟩ = −3) and eigensolved by the tree's `eigSym`; ops `h.drive.init / run / set` on the chem worker's road.
- The track: a FILE button and a drop target on the new SONG row of STATES (under DRIVE); decoded in the page, peak-normalised (E₀ is the field at the peak),
  resampled ONCE by a polyphase Blackman-windowed sinc at the stepper's midpoints (dt 0.5, or 0.25 when RATE/sampleRate > 0.5), hashed FNV-1a. RATE is the tuning
  peg: t_atom = RATE × t_audio, so at RATE 3000 a 179 Hz tone sits on 1s–2p₀; the readout says "tuned: 179 Hz → 1s₀–2p₀" (the dominant pitch by zero-crossing
  rate — exact for a tone, rough for music), ‖c‖² − 1, and the lag; the note carries the scale sentence with live E₀ and RATE ("E₀ 0.003 a.u. = 1.5 GV/m · a
  91-level bound model … · RATE 3000 = 73 fs of atom time per second").
- Landings go through `anchorFrom` with no history row; the register free-evolves between them; editing the register restarts the song from it; the song runs
  with MO-REGISTRY off. PROJECT key `states.song = { hash, name, e0, rateAtDrop }` absent by default — never the bytes; "track missing · drop it again".
- **Measured:** a 179.049 Hz tone from 1s at E₀ 1e-3 for 2000 a.u. vs an independent RK4 on all 91 levels: 2.1e-5 (dt 0.5 vs 0.25: 3.6e-5); RWA departure
  5.1e-4 at 1e-3, 7.9e-3 at 1e-2 (the plan's "physics, not the integrator"); ‖c‖² − 1 = 2e-12 over 4000 steps, ≈ 100 ms. In the page through the real FILE
  input 2p₀ reaches 0.9996 at t = 1449 a.u. (π-time 1406).
- Film: the film holds the loop, so nothing lands mid-take; no new hazard row.

## S2 · THE CHORD (`lab/chord-audio.js`, `lab/windows/spectrum.js`, `lab/windows/settings-card.js`, `lab/shell/settings.js`, one line in `lab/native-ui.js`)
- SETTINGS › **AUDIO** (PREFERENCE `audio`, off by default; its title "sound from this page: the populated levels as tones, off by default"). With it on, SPECTRUM's
  BEAT EQUALIZER group shows **SOUND** · LEVELS | BEATS · a caption. A WebAudio sine bank: one voice per populated n at f_n = |E_n|·RATE/2π folded into [220, 440) Hz
  by ×2^k — at RATE 3000 {1, 2, 4} → 238.7, {5} → 305.6, {3, 6} → 424.4 Hz, three notes ("folded ×2^k · 3 notes"); BEATS the 15 pairs folded (12 distinct
  notes; 1s–2p 179.05 → 358.1 Hz); gains the populations, master −18 dBFS, 30 ms ramps. The context is created on the first SOUND press, suspended when paused,
  hidden, filming (`filmHold`) or under `prefers-reduced-motion`; "no audio device" when it cannot construct. Retune keyed on mode · register version · RATE, called
  from `syncEq`, never in a frame. SOUND and the mode are not saved (a hand press each session).

## The light check (existing gates only)
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds (SPECTRUM at its limit of 25); S2's `serialize-bytes`
  11/11 identical and `settings-probe` 0/6 red; the register suite 22/22 on the merged tree; **THE LOCK ×2 GREEN** at `bd9f207`: 860 values 0/0 (61 s) and the
  1004-value fixture 0/0 (61 s).
- **Lines:** 28,576 → 28,711 (+135: S2 +53, S1 +82; cap 28,862).

## Deferred on the dial (recorded)
The TIMELINE as the track lane (the kit's audio clips stay `audio: false`); ionisation (a bound model, the caption says so); E₀ as a modulation target; `aliasOf` for
the song's beat on screen; per-shell operators other than hydrogen's (the song refuses a Stark/Zeeman/Sturmian register — the stepper is Z = 1 free); the
equalizer's preset does not change the notes; recording the sound into a film (the film stays silent); the `modrive.js` subtraction (density.js imports it).
Known: a molecule solve in flight makes the song lag (one chem worker); the song's pitch readout is rough for music.
