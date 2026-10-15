# S2 THE CHORD — build note (0.6.4 "Hydrogen Song")

Branch `s2-chord`, from the 0.6.3 cut tip `ece8308`. Builder: Opus 5.5, for the integrator (Claude Yan, `yan-c`).

## What landed

The register now makes sound. SETTINGS › DISPLAY › **AUDIO** is a consent switch (PREFERENCE `audio`, off by default). While AUDIO
is on, SPECTRUM's BEAT EQUALIZER group shows a **SOUND** switch, a **LEVELS · BEATS** seg and a one-line caption
(`folded ×2^k · 3 notes · 238.7 · 305.6 · 424.4 Hz`). Josh's §F-7 ruling is followed as written: off by default, folded into one
octave, muted under reduced motion.

## Seats (by line, on `s2-chord`)

| File | Line(s) | What |
|---|---|---|
| `lab/chord-audio.js` (new, 42 lines) | whole | `createChord({ reg, clock, motion, onPlay })` → `{ set({ on, mode }), retune(), suspend(), resume(), dispose(), playing, voices, caption }`. A sine bank. Each voice is oscillator → its own gain → master gain (0.126, −18 dBFS) → destination. Ramps are `setTargetAtTime(…, 0.01)`, about 30 ms. The context is built on the first SOUND press. It runs only when SOUND is on, THE play runs, the page is shown, no film is recording and reduced motion is off; any other time the master gain ramps to 0 and the context suspends 60 ms later. If the constructor throws, the caption reads `no audio device`. |
| `lab/windows/spectrum.js` | 5–6, 17 | imports (`sw`, `createChord`); `appPlay` and `MOTION` destructured once at creation (THE READ LAW) |
| `lab/windows/spectrum.js` | 115–119 | THE CHORD in the BEAT EQUALIZER group: `app.state.chord` (the `app.state.eq` pattern), the SOUND switch, the LEVELS · BEATS seg, the caption, and `ui.setAudio(v)` (shows or hides the row; turning AUDIO off also turns SOUND off) |
| `lab/windows/spectrum.js` | 122 | `chord.retune()` at the top of `syncEq` (the loop's keyed seat and every equalizer preset or gain press). It is keyed on mode + `reg.version` + RATE + context, so a call with nothing new returns at once. |
| `lab/windows/settings-card.js` | 17 | the AUDIO switch. Its title carries the note "sound from this page: the populated levels as tones, off by default". |
| `lab/native-ui.js` | 66 | `row('display',['audioSw'])`. native-ui re-seats SETTINGS by registry name and removes the old groups, so a switch that is not named here would be left out of the page. |
| `lab/shell/settings.js` | 37, 104 | `audio` in `saveSettings()` beside `camLock`; `applySettings()` reads `audio === true` only |
| `lab/rack.js` | 120, 642 | `chord: null` in the `app.state` literal; `filmHold` calls `suspend()` / `resume()`, so a film stays silent |
| `docs/STATE-SCOPES.md` | end | one appended PREFERENCE row (`audio`) |

SOUND on/off and LEVELS/BEATS are **not saved** (consent law: one hand press each session). Nothing enters a project, a link or a history row.

## The folding table (RATE 3000 a.u./s, f = |E|·RATE/2π, folded into [220, 440) Hz by ×2^k)

| n | unfolded Hz | k | folded Hz |
|---|---|---|---|
| 1 | 238.732 | 0 | 238.732 |
| 2 | 59.683 | 2 | 238.732 |
| 3 | 26.526 | 4 | **424.413** |
| 4 | 14.921 | 4 | 238.732 |
| 5 | 9.549 | 5 | 305.577 |
| 6 | 6.631 | 6 | **424.413** |

LEVELS on all six shells, equally populated, gives **3 notes**: {1, 2, 4} → 238.73 Hz (gain 0.500), {5} → 305.58 Hz (0.167),
{3, 6} → 424.41 Hz (0.333). The Node hand check (`.tmp/s2-hand.mjs`, throwaway) and the live caption agree.

**A slip in the brief, flagged:** it gives {3, 6} → 212.21 Hz (26.526 × 8). But 212.21 is below 220, so it lies outside the
[220, 440) interval that both the plan and the brief set. The code follows the stated interval, which gives 212.21 × 2 = 424.41 Hz.
That is the same pitch class one octave up, so it is the same three-note chord. If Josh wants [200, 400) instead, change one
constant in `fold`.

BEATS: 1s–2p alone is 179.049 Hz unfolded → **358.10 Hz** (k = 1), as the brief says. All six shells give 15 pairs, which merge to
12 distinct folded notes: 223.8 · 229.2 · 232.1 · 265.3 · 271.6 · 318.3 · 343.8 · 358.1 · 371.4 · 373.5 · 401.1 · 424.4 Hz.
Each gain is Σ|c_a||c_b| = A_m·A_n (A the sum of the shell's amplitudes), and the gains are normalised to sum to 1.

## Gates (existing only; no new test file)

- `node tests/pwa.test.mjs --write` (precache), then `./test.sh node`: **exit 0, 41 suites GREEN, 0 RED**. `rack-deps` PASS;
  `equalizer.test.mjs` was not touched.
- `node tools/new-project.mjs --check`: in step (16117 B).
- `tools/serialize-bytes.mjs`, run on `ece8308` (served from a `git archive` copy) and on this tree: **all 11 cases byte-identical**
  (only the served `lab` URL differs).
- `tools/settings-probe.mjs`: **0 of 6 scenes red**. The first run went red on N₂ with "Render did not settle: animation frames
  stopped". That is a frame-settle timeout, with 15 Firefox processes from other sessions on the machine, and a lone re-run was
  green.
- No browser suite owns the BEAT EQUALIZER group (grep for `equaliz|PURITY|eq-grid` finds none). I ran
  `tests/official-defaults-palette.browser-test.mjs` (fresh defaults, saved choices): PASS ×3.
- A throwaway headless Firefox script (`.tmp/s2-browser.mjs`): SOUND is hidden before AUDIO and shown after it; the blob reads
  `audio: true`; LEVELS gives `folded ×2^k · 3 notes · 238.7 · 305.6 · 424.4 Hz`; BEATS gives 12 notes; STATUS TAGS off does not
  hide SOUND; no page error. `AudioContext` constructs in headless Firefox. **7/7 GREEN**.
- Facade: **no change**. `__LW.chord` was not added (the caption is read from the DOM), so `lw-facade.json` holds.
- THE LOCK: left to the integrator. No locked state turns SOUND on, and the chord does not touch the field.

## Lines

`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`: 28,576 → **28,629 (+53, budget +65)**. That count includes
`lab/sw.js`'s precache rewrite (+1).

## Deferred / notes

- The equalizer's preset and gains do not change the notes. `retune()` is called on those presses but returns at once, because a
  decohered shell still has the same frequency. Mapping the beat gains through |Γ_nn′| is a later choice.
- Frequencies use hydrogen's E_n = −1/2n² (Z = 1), per the plan, under every operator. Molecular lines as sound are NOT this cut.
- No sound is recorded into a film. `filmHold` suspends the chord; SOUND's title says "a film stays silent".
- A change in reduced motion is heard at the next keyed `retune()`, and the play edge and `visibilitychange` gate it at once.
  The caption says `muted: reduced motion` when it applies.
- `voices[i].k` is the first merged shell's k. The caption spells the law as `×2^k` rather than listing each k.
