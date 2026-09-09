# Final II — local implementation handoff

Follow-up: [AUDIO-RANGES-HANDOFF.md](AUDIO-RANGES-HANDOFF.md) documents the completed
audio range/timing controls and model version 106, superseding the version 105 note below.

2026-09-08. Continues the interrupted session against the read-only Obsidian board `λWAVES FINAL II.md`. Changes are on the current working branch; no merge, push or deployment is included.

| Board request | Implementation / boundary |
| --- | --- |
| Stable text and window heights | Readouts reserve value/subtext lanes; long subtext scrolls within its lane and values no longer wrap unexpectedly. This intentionally supersedes the earlier unrestricted readout wrapping rule. |
| Playhead returns below when modulation closes | Host close callback invokes transport placement, including a delayed retry during its existing transition. |
| Deterministic modulated export | EXPORT FRAMES starts physics and modulation at zero. Defaults to at least 30 seconds; an unmodulated exact period may run longer. Driven modulation uses frame-index time, integrates RATE and operator rotation, and restores live state. Readback retries never advance modulation twice. |
| Axis modes | BOX → CORNER → OFF. Corner axis follows rack clearance and changes sides on double-click/tap (keyboard activation also swaps). |
| Frame types | BOX → LATTICE → DOTS → OFF. The lattice is a finite, faded surrounding grid that creates the repeating-field effect, clipped on the camera-facing side. Dots use tiny line crosses. |
| New draw styles | DUST, GLASS and ADD. Glass is a translucent density shell; no physical refraction, caustics, Houdini or shader-plugin runtime. |
| Native RATE in modulation | A synchronized RATE knob sits between play and BPM and follows the native target/base behavior. |
| Sideways macro minimization | Compact rail retains 336 px height and shrinks to 112 px, showing macro drag handles and value knobs. Bound macros remain source-driven. |
| Playhead-logo motion | Enter/leave spins in opposite directions; press uses inset/scale feedback; reduced-motion preference shortens animation. |
| Move macros to either end | Header grip drag, double-click or arrow keys chooses left/right. Chip placement follows; preset/tempo bars retain their homes and temporarily move into the matrix. |
| DJ stutter | Existing latch behavior retained; pressed state and messages explain that it affects BPM-synced LFOs and rejoins the shadow beat on release. |
| Macro matrix | Expanded fixed-width dialog with source, destination, signed amount, polarity, curve, bypass, removal and add route. SOURCE means existing MIR macro; devices keep their existing bindings. |
| Native range mini-knob | Signed RANGE knob edits the selected route; large destination knob remains the base. |
| Stage and Gamma | Both registered as modulation destinations. |

## Code map

- `lab/rack.js`: transport placement, export UI/lock/restoration, axis placement, modes, logo and added targets.
- `lab/render-exact.js`: deterministic frame stepping and modulation phase/transport/shadow restoration.
- `lab/modwindow.js`, `lab/modhost.css`: matrix, compact/end placement, RATE and RANGE controls, stutter feedback.
- `lab/mir/mod.js`: route curve/bypass persistence and evaluation, model version 105. Reversible extension enumerated in `docs/mir-matrix-patch.json`; frozen `lab/mir/modwindow/*` unchanged.
- `lab/field.js`: lattice, corner axes and three draw styles.
- `lab/kit.js`, `lab/lab.css`: stable readout lanes and interaction styling.
- `lab/statelink.js`: reports the new presentation fields as omitted from compact links; project/settings persistence carries them.

## Focused validation

The render-exact suite passes all 40 cases, including byte equality under an injected retry with exactly N−1 modulation advances. Final II route checks cover curve, signed/bipolar amounts, bypass, persistence and older readable versions. MIR, modrive, statelink, accessibility and import-wiring suites pass. The Final II test is included in `test.sh`.

A short real Firefox/WebGPU probe checked compact geometry, end placement, matrix/bar presence, Gamma curve/bypass and compilation of DUST/GLASS/ADD. Two 3-frame 48×32 driven exports produced identical corresponding digests and restored a running LFO's beat and phase to 0.37. No page/GPU errors were reported. The matrix screenshot was visually reviewed at desktop size. This is sampled verification, not the historical 165-block browser gate, mobile acceptance or a full-resolution 30-second export; Josh requested limited verification.

Service-worker hashes were regenerated. Local build results are recorded in `.tmp/build-final-ii.log`. No production deployment is implied.

## Practical limits

### Astra review of the Gemini follow-up — 2026-09-08

Gemini's lattice segment preallocation and corner-axis aspect fallback are retained. The origin-plane cut is the intended camera-facing half-space in this handoff, not a mistaken near-plane clip. Its readout `:empty` collapse has been removed: an empty status lane must retain its height when text appears or disappears. Its ADD early exit on one saturated colour channel has been removed because later samples can still contribute other colours. GLASS skips lighting only at zero shell contribution; the former 0.02 cutoff altered faint shell colour.

The subsequent performance pass was also corrected. Wave 89 explicitly selected FROST ALWAYS for new profiles; that default is restored, along with accurate explanatory text. The 120 mode now learns a conservative frame budget from sustained browser delivery, beginning at 60 Hz and supporting up to 120 Hz. One unusually short callback does not change that estimate, and subsequent load does not lower an already observed refresh ceiling. AUTO SCALE probes upward when delivery meets the target; the previous recovery test demanded an interval shorter than vsync permits. Idle gaps and mode-switch samples no longer contaminate the measurement. This estimates delivered cadence, not physical monitor refresh or GPU execution time.

Focused checks: performance 7/7 (including 60/120 Hz cadence traces), audio 52/52, MIR 98/98, exact export 40/40, accessibility 11/11, and Final II routes pass. Browser sampling confirmed unchanged readout height through empty/populated/empty states, stage background preservation through play/pause, and 36 presents for 36 frames in 120 mode. PWA content hashes are regenerated after source changes. The earlier broad browser pass had failures and was interrupted; those failures were not proven pre-existing, and that run must not be described as all-green. No physical-display 120 fps claim, complete mobile acceptance, or deployment is implied.

Modulated exports use a timed span and make no combined-loop closure claim. Live microphone input must be bypassed for deterministic export. Export produces a PNG ZIP and manifest/ffmpeg instructions rather than directly encoding a video. Camera inertia/auto-rotation is pinned; explicit camera parameter modulation remains part of the render. Compact share links omit the new field/corner settings and already omit modulation; use a saved project for the full patch.

Research findings and the limits of the Serum 1 evidence are in [the architecture note](research/SERUM-MASSIVE-MATRIX-2026-09-08.md). AUX routing and free-form curve editors were deliberately excluded from this release. Visual acceptance remains Josh's; this handoff does not claim a screenshot match where no reference was supplied.
