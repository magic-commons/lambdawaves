# The film: RENDER, the recorder, the time law

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 027

A FILM'S WORDS ARE THE FRAME'S (027 D2): the caption the road hands the film is a FUNCTION, read after each frame's modulation step (`J.words()`), so a lane on `chem.orbital` names that frame's orbital; the manifest keeps the start string. A FILM GIVES THE STAGE BACK (027 D3, no lab change): the put-back's one present redraws VORTEX; only a screenshot in the same instant as the film's return is black (`film-handover` §0 proves equal snapHashes before and after).

## The laws of 026

THE CONDUCTOR (Josh 10-29, `research/iteration-026/PLAN.md`, `A-BUILD.md`): a film is authored as a SCORE — one JSON in bars, beats and the targets' own units (`docs/conductor/SCORE.md`) — applied through the app's live doors into a project `CONDUCT/<name>` (`tools/conduct-score.js`, `__LW.conduct.apply`; loaded on demand, never precached: lab/ stands 15 KB under the 8 MiB ceiling) and bounced from node by `tools/conduct.mjs` (the kit's recorder through the RENDER card's own fields, the audit read back), which leaves the MP4, the project, the audit and a per-bar contact sheet side by side. THE SCORE THINKS IN BARS: every time in a score is a beat on the ruler at the score's tempo; an effect lands on a divisor of the bar; the physics goes on the grid too (`transport.rate` chosen so a state's own period is whole bars). ONE CLIP COVERS A TARGET AT A BEAT: an audio band owns its target over the whole range. THE ABSOLUTE TARGETS: `material.style`, `material.view`, `palette.index` are integer targets (A1), so a lane can say "bar 7 is GLASS on PHOSPHOR". A Claude reviews a film by its sheet and re-conducts (`~/.claude/skills/lambdawaves-conductor`); the NODES graph is applied live and does not ride in the project (nodes.md's law stands); the field's FRAME and AXIS, the caption and the stage ground are the score's to switch (F2/F3: `look.frame`, `look.axis`, `look.ground`, `render.caption`). THE ICON SAYS WHAT IT IS: MOLECULES wears a hex ring, NODES its three nodes (A0). Tracks live in `media/` (gitignored); films in `~/Documents/DATABASE/CLAUDE/APPS/LAMBDAWAVES/FILMS/`, never in git.

## The laws of 025

THE BOUNCE (Josh 10-28, `research/iteration-025/PLAN.md`): a render is a DAW's bounce — the arrangement rendered at its own clock, sample- and frame-exact, never a recording of the screen. THE AUDIO IS ON THE FILM (025 A, MIR 1.5.6-alpha.12–16, `A-BUILD.md`): the KEEP clips in the range are mixed offline by the same placement the live path uses (`timeline/audio-playback.js audioPlacement`, N = frames · 48000 / fps) and muxed as a second trak (`render/mp4.js`: mp4a/esds or Opus/dOps, `elst` + `sgpd/sbgp` roll for the encoder's priming measured by an impulse, integer `stts`; a WAV beside PNG frames); frame 0 and audible sample 0 are the play edge, and RUN SELF-TEST's alignment stage proves it (clicks at beats → samples, Δ 0). The recorder refuses only a LIVE audio source. ● REC is a FOR-MIR line.

THE FILM IS THE SCREEN (025 B, `B-BUILD.md`): `lab/film-bake.js` lays over each film frame, at the film's scale and as a function of the frame alone, the NODES graph (compiled at k, the grain hashed from the frame index, a SHADER node baked from the film's own tap), the overlays that are functions of (t, camera, seed) — PARTICLES reseeded from 13 at frame 0 — and the words (ATOM LABELS, ESP BAR), and names the rest OUT (FLOW's tracers, KEPLER's held impulse, the KaTeX texts, the bead's trail before frame 0); the digest is over the baked picture; NODES OFF · CHROME OFF give 024's field; EVERY SETTING IS A WITNESS (`render-exact.js audit`, `film.last.audit`, "RENDER DISOBEYED" when a row fails). CURRENT size is the stage at DPR 1, even.

THE BOUNCE IS ONE PRESS AWAY (025 C, MIR 1.5.6-alpha.17, `C-BUILD.md`): FILE › RENDER… / EXPORT FRAMES… and the TIMELINE's film chip open the RENDER card in front with its RANGE taken from what you have (a selection, the open timeline, ONE PERIOD, else STILL); the card's rows are even (the panel's `even`, `ranges`, `controls.switches` seats holding PERIOD and NODES · CHROME), and a landed render says one line read back from the file: frames · seconds · size · fps · codec. No chord until Josh names one.

## The standing paragraphs

THE FILM (0.5.0 C7, C7b) is MIR's `createRecorder` handed λWAVES' `frame(i, ctx)` (`lab/render-exact.js` `createFilm`), and its UI
is the kit's: the RENDER card (`createRenderCard` in `lab/film-card.js`, registered in the rack as `render`, closed on the right)
and the TIMELINE window (`installTimeline` over λWAVES' one modulation host through the seam in `lab/shell/keys.js`: its play is THE play,
λWAVES' pill the one transport until iteration 014 A5 gave the timeline its own kit work bar — play · power · BPM · t with the lap in brackets (`ui.tlTime`, painted beside `paintHead()`, 014 A9; in the UI face, 13 px t over an 18 px value in tabular numerals, a fixed 16 ch — iteration 015 T1) · ⏮ · door (the sine icon through the kit's `door: 'icon'` + `doorIcon`; the diamond stays the kit's for BASINS; the door SWAPS — the TIMELINE closes and the modulation window opens, `onSwitch`, iteration 015 T5), two plays while it is open, both THE play (Josh 10-22: ours, not BASINS' one bar moving into the timeline — "the control surface has too many useful features"); skin.css clears the window's own fill, the slab — the arrangement `presentation.timeline` with its own undo, the window the WORKSPACE key `tlwin`).
RENDER films STILL (a clip of the clock), TIMELINE · ACTIVE or TIMELINE · SELECTION as an MP4 or PNG frames; ONE PERIOD is a
`lw-period` clip (PLACE ONE PERIOD) whose t0 and T the frame reads. THE TIME LAW: the ruler is the automation's beat and t the
physics'; a frame's t is the period clip's, else the RATE integral when RATE can move, else the RECORD law from the lab's t. The
kit owns the encoding, the take clock, the store with its RECOVER / RESUME / DISCARD rows and the input guard; λWAVES keeps the
schedules, the readback and settle, seed 13, H1–H3 with their witnesses, `filmHold`, and capture.js `handOver` as every save;
`__LW.captureUI` is the scripting facade (createFilm's takes, no UI). The timeline's rows join the ONE KEY TABLE under THE FOCUS LAW
(`lab/key-table.js`: a scoped row wins its chord while its surface has the focus). Run `node tests/render-exact.test.mjs`, the
digest lock, `tools/perf/film-probe.mjs`, `tests/film-handover.browser-test.mjs` and `tests/timeline.browser-test.mjs` after
touching any of it.


