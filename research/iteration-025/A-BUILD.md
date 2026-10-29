# 025 · CHAIN A — THE AUDIO · BUILD (Opus builder, branch `it025-A`, base e027c0f2, 2026-10-28)

Kit MIR 1.5.6-alpha.11 → **1.5.6-alpha.16**, one alpha per row (A1 .12 · A2 .13 · A3 .14 · A4 .15 · A5 .16), clone road, every door additive.
**Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a6a633c925ed3dfd8/.tmp/kit-1.5.6-alpha.16.bundle`**
(kit-1.5.5 @ 7b94cbc + v1.5.5; `git bundle verify`: okay, 2 refs). No λWAVES file outside the adopt set moved: `lab/render-exact.js` and `lab/film-card.js`
untouched (the recorder reads `o.editor.model`, which λWAVES already hands it), `lab/fonts/**` untouched, the rack `app` literal untouched. THE LOCK not run (no field path).

## Rows (kit commit · λWAVES adopt commit)
- **A1 THE AUDIO TRACK** (6b3c933 · 16c19c52) `render/mp4.js`: `mp4Parts({ …, audio: { codec, sampleRate, channels, description, samples:[{data,dur}], priming?, frames? } })`
  writes trak 2 (`mp4a`+`esds` with the ASC verbatim, or `Opus`+`dOps` from the OpusHead), timescale = rate, `stts` from integer sample counts, the priming as the
  audio `elst` media_time AND `sgpd`/`sbgp` 'roll' (AAC −1, Opus −4), segment = the valid samples (= the video's duration at 24/30/48/60 fps); the video gets its own
  `elst`; chunks interleave by the half second; the moov is built twice (fixed-width offsets) instead of searched; `headersOnly` carries `.layout`. `mp4Parse` gains
  `.tracks`/`.movie`. Without `audio` the file is byte for byte alpha.11's (sha-256s pinned in the test). ffprobe reads the synthetic files: h264 + opus/aac, start 0, 2.000 s.
- **A2 THE MIXDOWN** (8c5c6cb · d4da4805) `render/audio-mix.js` (new): `mixPlan` (pure: unmuted KEEP clips in range, placed by `audioPlacement` with frame 0 = sample 0,
  varispeed, clipped at the range / the source's end), `mixdown` (`OfflineAudioContext(2, N, 48000)`, N = round(frames·48000/fps), the file decoded by that context,
  unity gain, no normalise/limiter — call 2), `wavBytes` (16-bit PCM). No clip → null → no audio track.
- **A3 THE ENCODE** (ee085ca · 90be6d7f) `render/encoder.js` `decideAudioPath` (AAC-LC 256 k → Opus 192 k @48 k, asked), `verifyAudioEncoder` (preflight: an impulse
  at sample 24000 encoded + decoded, the onset's offset = the delay, memoised), `encodeAudio` (AudioData ts = round(s·1e6/sr) from the index, packet `dur` in samples,
  a 2-packet silent tail, refuses a stream short of delay + N; Opus takes the OpusHead pre-skip), `muxAudio`; `render/store.js` `saveAudio` (audio.bin + the table in
  the manifest; finalize interleaves by `.layout`; a recovered prefix keeps its own frames' audio); `render/recorder.js` `run({ audio })` (default on) mixes + encodes
  BEFORE the first frame (the clock untouched), `result.audio`; PNG frames get `audio.wav` in the last ZIP part (re-mixed on a PNG resume).
- **A4 THE PANEL, THE RESULT, THE REFUSAL** (39e3f4a · 6671a764) `render/panel.js` AUDIO row (ON · THE TIMELINE’S AUDIO default · OFF · SILENT FILM, stored, a motion
  seat); the estimate names the clips + codec ("… · audio CLICK · Opus 48 k · …", PNG: WAV 48 k); the done note reads `res.audio`; `estimate().audio`, `rec.audioPath()`.
  The refusal stays for a LIVE mic only: "A live microphone cannot be replayed exactly. Switch the AUDIO device off, or drop the sound on the TIMELINE as a file (a file
  is on the film, aligned)." (● REC is not built, so the sentence does not name it.) KEEP AUDIO's busy-mute unchanged. Shot: `research/iteration-025/A-shots/A4-audio-row.jpg`.
- **A5 THE ALIGNMENT PROOF** (b7e4158 + 4a5b4f7 + 7b94cbc · fb9adcba) `render/selftest.js` `audioAlignment()` + a RUN SELF-TEST stage; `decodeFirstChannel` exported.
  Clicks at beats 0·1·2 (120 BPM) → mixPlan → mixdown → encodeAudio → WcSink + muxer → parsed → the audio trak decoded where the index says → elst dropped as a player
  does (less what this browser's decoder drops itself) → each click vs its frame. 4a5b4f7: frame 0's check reads the video elst against its ctts (Firefox's H.264
  reorders: elst 6000 = the B-frame shift); 7b94cbc: i18n re-extract.
- **A6 ● REC — NOT BUILT** (call 3: it does not fit in ≤ 120 kit lines with its proof): it spans `modulation/audio-capture.js` (MediaRecorder on the track), the
  modwindow's AUDIO face (the button beside MIC), a new seam from the modulation window to the timeline editor (the window knows no editor) and the timeline's clip
  creation (`installAudioDrop` keeps it private), and a mic cannot be proven in the headless gate. FOR-MIR line below.

## The alignment line (verbatim)
Firefox (gate, RUN SELF-TEST stage): `Opus 48 k · elst 312 = OpusHead pre-skip (this decoder drops 312 itself) · roll -4 · audible sample 0 = frame 0 · beats 0 · 1 · 2 → frame→sample 0→0 · 15→24000 · 30→48000 · Δ 0 · 0 · 0 samples · lengths equal`
Chromium (kit `tests/render-audio.browser.mjs`): the same line. ffmpeg decoding the browser files (a real player's demuxer + decoder): clicks at 0 · 24000 · 48000, Δ 0 · 0 · 0,
for the self-test file AND a real λWAVES TIMELINE · ACTIVE render in Firefox (OPFS store, 320×180, 60 frames, a KEEP click clip; `result.audio` = Opus 48 k, 96000
samples, 103 packets; ffprobe: h264 + opus, both start 0.000, 2.000 s).
**Chromium on Linux** takes the same road (AAC refused, Opus); **Chromium on macOS/Windows and Safari 26+** take AAC: `verifyAudioEncoder` measures the priming
(1024–2112), it goes into elst + roll −1, and `audioAlignment` checks it (an AAC decoder drops nothing: the impulse shows the whole delay). Not run here (no AAC encoder on this box).

## CHANGELOG lines (kit, one per door)
1.5.6-alpha.12 THE AUDIO TRACK IN THE MUXER · alpha.13 THE MIXDOWN · alpha.14 THE AUDIO ENCODE · alpha.15 THE AUDIO ROW, THE RESULT, THE REFUSAL · alpha.16 THE ALIGNMENT
PROOF (full text in the clone's CHANGELOG.md, each naming its files and "λWAVES 025 A<n>").

## Tests
- Kit `MIR_SKIP_BROWSER=1 npm test`: 82/82 after every row (new `tests/render-audio.node.mjs`, 47 checks: byte-identity, two-track Opus at 24/30/60 fps and AAC,
  every sample where its offset says, co64, `.layout`, mixPlan, WAV, the ladder, the store's audio + recovered prefix, the estimate). Re-aimed: `render.browser.mjs`'s
  three row lists (+ audio). Kit browser (Chromium, CDP 9770): `render.browser.mjs` 64/65 — the one red ("a press at its centre starts nothing", `rb.hit` true) is RED
  at alpha.11 too (checked on c18957a: 64/65, alpha.8's disabled-control hint law); `render-audio.browser.mjs` 2/2. Other kit browser files not run (no row touches them).
- λWAVES (gate 9689 / gd 5689, Firefox): `film-handover.browser-test` GREEN; `timeline.browser-test` GREEN (0 failing of 14); `./test.sh node` EXIT 0;
  `mir-manifest` pinned alpha.12–.16 (alpha.16 = 3908370e…); `adopt.mjs . --check` in step; `pwa.test --write`; `rack-deps --classes --no-write` HOLDS (persist 24/25).

## FOR-MIR lines
- FOR 1.5.6 · ● REC (025 A6): the AUDIO device's ● REC beside MIC — `MediaRecorder` on the capture's own track from the beat the press lands on (`outputLatency`
  noted), a second press → `audioClipFromFile` → a KEEP clip named REC-n on the device's lane at that beat; needs an app seam `onRecorded(file, beat)` from the
  modulation window to the timeline (or `installAudioDrop` exporting its clip maker); THE PRIVACY LAW 4 amended: "nothing is recorded, stored or sent WITHOUT ● REC;
  a recording is a file in the project and nowhere else".
- FOR 1.5.6 · the AUDIO row's label ellipsizes in the rack card ("ON · THE TIMELINE’…", as MODULATION's does): C3's re-lay owns the widths.

## The CLAUDE.md sentence (for the close)
MIR 1.5.6-alpha.12–.16: THE AUDIO IS ON THE FILM — a render mixes the TIMELINE's KEEP AUDIO clips offline from frame zero (`render/audio-mix.js`), encodes them
before the first frame (AAC, else Opus: Linux and Firefox are Opus-in-MP4; PNG frames get `audio.wav`), muxes a second trak with the priming in the edit list and a
roll group, and RUN SELF-TEST proves clicks at beats 0·1·2 land within one sample of their frames.

## Open questions for Josh
1. Your editor and Opus-in-MP4: VLC, ffmpeg, Chromium and Firefox play it; Premiere/Resolve versions vary. If yours refuses, PNG frames + `audio.wav` is the road (call 1).
2. The tempo is read once at the start of a run (as the frame plan reads it). A BPM automated DURING the range would move the frames' beats but not the audio's: say if you automate tempo.
3. A long arrangement: the mixdown and encode happen before frame 0 (≈ seconds for minutes of audio) and the encoded audio is held in memory (≈ 1.4 MB/min at 192 k).
