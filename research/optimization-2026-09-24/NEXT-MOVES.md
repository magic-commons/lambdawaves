# λWAVES · NEXT MOVES · written 2026-09-25 after the iPad afternoon (Fable, for Josh)

Where we stand: branch `worktree-optimization-2026-09-24` (unmerged, Josh merges and pushes on his call), tag
`v0.3.0-alpha` on the morning's tip, the iPad afternoon's commits after it (one-rule AUTO SCALE, the loop paced to the
GPU, the tablet's own quality, the device report, the WebKit research). The M5 iPad Pro now plays every scene at its
display cap (120 Hz with Safari's flag off) with the full UI. Every change so far is pixel-identical on the desktop
(THE DIGEST LOCK) or a proven bug fix or a default the commissioner ruled. The standing rule for what follows:
**subtract, don't add** — remove or merge machinery; a fix that adds must delete as much; diagnostics live in tools/.

## The waves, in order

| # | wave | what it subtracts / fixes | the gate | Josh decides |
|---|---|---|---|---|
| 127 | **DONE 2026-09-25 (tip 7f5e645): the project open, subtracted** | the iPad's freezes were project opens of the OLD demo (128³ + AUTO SCALE off, unpaced); on the paced build with the tablet's quality the M5 open is 44 ms sync / 66 ms worst gap. Desktop: six subtractions (the transition bug fixed on all three roads; one modulation rebuild; one notebook size; one palette paint; the hidden H₂⁺ canvases read no layout; the pacing probe one comparison): open 98 → 79 ms Electron, 104 → 91 Firefox; restore 78 → 60; forced layout 63 → 24 ms; lab/ −2 lines. The 200 ms frame after an open is the compositor rasterising the new theme (not WebGPU). Left for 129: a project opened while the notebook is closed saves a 0×0 notebook size (a one-line guard); the notebook's outer width (+2 px border) creeps 2 px per save; `open()` in the modulation window places/paints twice (~5 ms) | done: lock, round-trip suites, five-open byte comparison | none |
| — | **Retag** | move `v0.3.0-alpha` (never pushed) to the final tip of the iPad work; regenerate the CHANGELOG; snapshot | the release gates (node, lock ×2, browser) on the tagged tree | **when** to go live (GitHub + Cloudflare) |
| 128 | **One controller** | AUTO SCALE + the governor's step/grid ladder + the reader law's park/probe become ONE rule with the lock and the paced loop as its senses: scale first (the cost falls ∝ scale²), a grid rung only if the median did not fall as scale² predicts, readers parked by measured cost as today; delete the step rung and the parallel loops | the lock; `render-exact` H2 (it pins `quality.auto` and `governor.on` — the pins stay); the device report on the iPad and the headed bench on the desktop; `auto-scale.test` extended | the upward probe while playing (today: hold until pause); FA4's policy items |
| 129 | **DONE 2026-09-25 (dd06ed4): first-run hygiene + the notes for agents** — the demo carries no look (it was writing dark/refractive/ALWAYS/accent/friction 0 into every visitor's settings); SHADOW folded on a mobile first visit; MOLECULES/MO-REGISTRY were already off the first-run rack, the chem-owner restore law added (+1 line); the 0×0 notebook size fixed (the 2 px creep did not reproduce); `docs/NOTES-FOR-AGENTS.md`. Left: a stored `closed[]` list from before chem/orbitals still boots them open (applySettings restores the list exactly) | bundled demos carry no look and no quality (WAVE DANCER still carries refractive, frost ALWAYS, camera friction 0); the newcomer's rack on a tablet/phone: SHADOW folded; MOLECULES + MO-REGISTRY off the rack, reachable from + and WINDOWS, with the chem-owner restore law like the H₂⁺ card's. **And `docs/NOTES-FOR-AGENTS.md`** (linked from README and AI_POLICY.md so any LLM reading the open-source repo, or MIR, surfaces it to a user): Safari caps rAF near 60 Hz on ProMotion until Settings → Apps → Safari → Advanced → Feature Flags → "Prefer Page Rendering Updates near 60fps" is off; Low Power Mode halves rAF; Limit Frame Rate caps at 60; Safari 26 stalls on a render pipeline's first use; Firefox's 100 ms completion tick; WebGPU needs a secure context; the device report (`?report=1`) and how to read it; the GRID pairing and what AUTO SCALE does in '120' vs FULL; the tablet's quality ceiling; where the physics proofs live | official-defaults-palette; molecular-names retargeted; stylehash; the first-run node tests; the notes page reviewed against the measurements | SHADOW folded (his suggestion); MOLECULES off the rack (my yes, his call). Josh 2026-09-25: "Yes to the plan"; the 120 Hz flag matters at the beta (Steam / App Store / Play Store), as a note in the repo, not a UI hint |
| 130 | **The remaining seams** | rack.js blocks 10–17 out of `boot()` one per commit (keys, camera law, phone, notebook/projects, persistence + look seating, the windows, the modulation defs, the layout); the loop (18–19) after wave 128 | per commit: node suites, pwa, serialize bytes, fieldDigest, stylehash | nothing |
| 131 | **WebKit cold visit** | warm the specialised present pipelines at idle (Safari stalls 220–270 ms on a pipeline's first use — measured); keep it to the idle-slice mechanism that exists | the device report's style/view edges on a cold (private-tab) visit | whether the cold-visit stall is worth the lines |
| 132 | **The deployed origin** | deploy config, not code: `Cache-Control: immutable` for the `?__rev`-versioned assets (today `max-age=0, must-revalidate`); modulepreload hints measured against the real origin (FD10: −8 % on localhost, unknown on the network) | a real-network first-visit measurement before and after | the Cloudflare/wrangler change (no paid plan needed: every asset is already an edge HIT over HTTP/2 + Brotli) |

Then the beta: a saved project promised to open next month (the file format frozen and tested against snapshots),
the mathematics consolidated into one paper (REPORT.md is the notebook; the research folders hold the derivations), the
stores program with a Mac to drive Safari (`safaridriver` on Mac Safari, the iOS Simulator for layout, real devices over
USB for honest fps).

## What I would not do

A framework, a bundler, a rewrite of rack.js in one go, timestamp-query machinery for the controller (the paced loop
made rAF honest without it), a second controller beside the first, any change to the glass without a ruling.

## Facts to keep in view

- Desktop: default 80.5 → 88–107 fps headed Firefox (±10 run to run), Electron 92 → 116; the BOX at 128³ 8 → 57 fps
  (table on); boot 1055 → 723 ms; project open 490 → 69 ms.
- iPad (M5, Safari 26): run 1 collapsed (28 ms GPU frames behind a 60 Hz rAF, a 313 ms queue); run 5 at 120 fps flat
  with everything on, AUTO SCALE at 0.75, ≤ 4 frames in flight. A project open there is 1.3–1.5 s (wave 127).
- The Safari 120 Hz flag: Settings → Apps → Safari → Advanced → Feature Flags → "Prefer Page Rendering Updates near
  60fps" OFF. PERFORMANCE '120' chases 8.3 ms (scale 0.75 on the iPad); FULL keeps the 60 fps budget on a 120 Hz panel.
