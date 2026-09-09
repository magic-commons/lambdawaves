# Audio response ranges — 2026-09-08

LEVEL, LOW, MID and HIGH now have independent lower/upper input-level boundaries. The lower boundary maps to 0% modulation; the upper boundary maps to 100%, with clamping outside that interval. These are amplitude-response ranges in dB, not frequency crossover controls or an audio-output compressor.

## Use

- Drag a meter boundary to resize its range. Drag inside the range or scroll over it to shift both boundaries together. Double-click resets that band to −60…−6 dB.
- Click a band name to select it for the card's ATTACK and RELEASE knobs. Each band keeps its own times. The footer identifies the selected band and its settings.
- Focus a boundary and use arrow keys for 1 dB changes, Shift+arrow for 0.1 dB, or Home/End for its allowed limits.
- SET provides exact numeric ranges/times and input selection. It also contains NOISE GATE, GATE dB, GATE HOLD, hysteresis and HIT sensitivity.
- GATE HOLD delays noise-gate closing; RELEASE controls the follower's falling response. Turn NOISE GATE off for release tails that decay through silence instead of being cut off by the gate.

The fill shows normalized modulation output; the vertical line shows the measured post-gain input level. Boundaries span −90…0 dB, with at least 1 dB separation. Attack/release use the existing follower time constants, 0…60,000 ms. Microphone capture and the frequency-band split are unchanged. HIT remains the existing event output.

## Files and compatibility

`lab/mir/mod.js` owns normalization, range validation, gate bypass and persistence. `lab/modwindow.js` supplies meter gestures, selected-band timing and the conditioning sheet. `lab/modhost.css` keeps all four meters visible in the original plot and preserves the 336 px card height. The frozen `lab/mir/modwindow/*` files were not edited; its COPY configuration hook supplies the new controls.

The model now writes version 106 and reads 3, 4, 104, 105 and 106. Older patches retain their −60…−6 dB mapping, existing time constants and enabled noise gate. The reversible model-extension inventory is updated in `docs/mir-matrix-patch.json`.

## Focused checks

Audio tests pass 52/52: independent bands, amplitude/power units, endpoints, attack, release through silence, saved-state restoration, malformed bounds and legacy defaults. MIR/provenance, accessibility, performance and import-wiring suites also pass on the combined working tree.

The Firefox probe uses real pointer dragging, keyboard arrows and wheel input. It confirms changing LOW leaves LEVEL unchanged, and setting LOW attack to 75 ms preserves LEVEL's 10 ms. All four meters fit without scrolling in the full card's 110 px plot; the expanded numeric sheet scrolls inside the card. No page errors were reported. No microphone was opened: audible/input-device acceptance remains a user check.

The later shared frame-budget, shader and control edits were retained. This pass checks their integration with audio; it is not an exhaustive audit of that separate work.

The final interaction rerun confirmed the same results against the latest files. Its checks completed without page errors, but the harness then exited with `kill EACCES` while stopping geckodriver; this is a cleanup failure, so that process exit is not reported as a green test run. Service-worker hashes were refreshed and the local deployment build passed: 139 files, 4.24 MiB.
