# Steam store copy: λWAVES

Draft of 2026-09-24, written from `README.md`, the ABOUT face in `lab/index.html` and `LEGAL-PROVENANCE.md`. Every feature named here exists in the 0.2.3-alpha.3 build (`91c90bc`). Before submitting, compare it with the build you upload. Valve's review rule, read 2026-09-24 at https://partner.steamgames.com/doc/store/review_process: "Your store page should only contain features and content that will be available at launch."

## Name

**λWAVES**

The Latin fallback, for places that cannot show λ, is **LambdaWaves**. It is the same name the Windows executable and the depot use.

## Short description (Steam limit 300 characters; this one is 279)

A real-time instrument for quantum waves. Play the exact eigenstates of hydrogen and the orbitals of small molecules as a living 3D wave field on your GPU: mix amplitudes and phases, patch LFOs, envelopes, macros and live audio into the controls, and watch the interference move.

## About this software (Steam markup)

```
λWAVES is a playable hydrogen shadow: a real-time instrument where quantum states become a wave field you can play. Pick states, tune their amplitudes and phases, turn the camera, and watch eigenmodes interfere and the cloud bloom into motion.

[h2]Exact hydrogen[/h2]
All 91 hydrogen states with n ≤ 6 are held in closed form and evolved exactly, one phase per energy. Nothing is integrated, so nothing drifts. Your GPU rebuilds the wave function on a 3D grid every frame and draws it as density, phase, real or imaginary part, or a difference, in position or momentum space.

[h2]Molecules[/h2]
MOLECULES solves restricted Hartree–Fock ground states for a library of 54 small molecules, 52 of them playable, in the STO-3G basis. 18 are also available in 6-31+G*. You get RPA and TDA spectra and real-time TDHF. MO-REGISTRY plays orbital packets or many-electron TD-CIS states, drives them with a field, and shows their current. These are closed shells with fixed nuclei, and there is no correlation beyond singles. The limits are stated because they are real.

[h2]An instrument, not a viewer[/h2]
[list]
[*]A rack of windows: STATE, SPECTRUM, SHADOW, ORBIT, SLICE, KEPLER, VORTEX, WIGNER, RADIATION, MOLECULES, MO-REGISTRY and more
[*]A transport with its own clocks, and presets to start from
[*]A modulation window: macros, LFOs, envelopes and live audio input, patched into exposure, camera, rate and other controls by dragging
[*]Hold Ctrl and drag to draw back an impulse, then release to strike the wave
[/list]

[h2]Keep your work[/h2]
[list]
[*]Projects with folders, saved on your machine and exported or imported as files
[*]A Markdown notebook with typeset maths beside every project
[*]Picture capture rendered at high resolution, and video recording
[*]WAVE DANCER, a bundled demo performance, opens ready to play
[/list]

[h2]Honest notes[/h2]
[list]
[*]Needs a GPU that runs WebGPU (Direct3D 12 on Windows, Vulkan on Linux) with current drivers.
[*]Runs offline. No account, no analytics, no data collected. The microphone is used only if you add an AUDIO device.
[*]Free and open source under GPL-3.0. The same instrument runs free in a browser at lambdawaves.magic-commons.com. The Steam edition is the packaged desktop build, with updates delivered by Steam.
[*]Built by AI coding agents (Claude, GPT, Gemini) under the direction of one person, who decided what stayed. The physics is checked by automated tests against closed forms.
[/list]
```

Steam may strip external links from this text, so the website goes in Steamworks ▸ Store page ▸ Basic Info ▸ website (`https://lambdawaves.magic-commons.com`) and the source goes in the SOURCE.md that ships in the package (`LEGAL-PROVENANCE.md` §3).

## Five key features (for the bullets, capsule sidebars and press kit)

1. 91 exact hydrogen eigenstates (n ≤ 6), evolved exactly: nothing integrated, nothing drifts.
2. Molecules: Hartree–Fock ground states, spectra and real-time TDHF / TD-CIS for 52 small molecules (STO-3G; 18 also in 6-31+G*).
3. A modulation rack: macros, LFOs, envelopes and live audio drive the field, the camera and the clock.
4. Projects, a Markdown notebook with typeset maths, share links, and high-resolution picture and video capture.
5. Runs on your GPU with WebGPU, offline, with no account and no data collected. Free and open source (GPL-3.0).

## Category

**Recommendation: Software ▸ Education.** The lead leans Software too.

Why: λWAVES has no goal, score or fail state. It is an instrument and a teaching tool, and Steam's Game ▸ Simulation buyers expect goals and systems to master, which would be a promise the product does not keep. Software ▸ Education says what it is, and the "Design & Illustration" genre can be added as a secondary genre for the capture side.

What Game ▸ Simulation would buy: the Games hub is where most traffic is. The cost is reviews from people who expected a game.

Decide before creating the app record in Steamworks, since that record carries the app type.

## Tags (choose from Steamworks' own list; check that each exists there)

Education · Science · Physics · Simulation · Sandbox · Relaxing · Colorful · Abstract · Experimental · Singleplayer · Design & Illustration · Utilities

## Supported languages

English: interface. There is no audio or subtitle track.

## System requirements

Measured facts are from `docs/ACCEPTANCE-MATRIX.md` (2026-09-24) and `README.md`. The Windows figures do not exist yet.

| | Minimum | Recommended |
|---|---|---|
| OS | Windows 10 or 11, 64-bit | Windows 11, 64-bit |
| Processor | x64 | measured on a Ryzen 5 5600G; **recommended tier to be measured on the Windows PC** |
| Memory | **to be measured** (the Windows 30-minute run records it) | **to be measured on the Windows PC** |
| Graphics | A GPU with current drivers supporting Direct3D 12 (Windows) or Vulkan (Linux), on which Chromium enables WebGPU. The app shows a banner, not a lab, when there is no WebGPU adapter. | RTX 3070 class. Measured on Linux: first frame ≈ 1.0 s (958–1084 ms), about 3 ms per frame at 96³ and 3.9 ms at 128³ × 16 modes. **Recommended tier to be measured on the Windows PC.** |
| Storage | 400 MB (the win32-x64 package is 374 MB) | 400 MB |
| Notes | No network needed. Microphone optional (AUDIO input only). | |

Linux (second depot): 64-bit, a Vulkan driver. Measured only on Ubuntu 26.04 with an RTX 3070 (driver 595.91.07). Do not list Linux until the sandbox question is solved without sudo (plan M3, "sudo-free sandbox"). Steam cannot make `chrome-sandbox` root:4755 on a user's machine.

## Content Survey: AI disclosure (paste into Steamworks ▸ Content Survey)

The survey's definitions, read 2026-09-24 at https://partner.steamgames.com/doc/gettingstarted/contentsurvey: **Pre-Generated** is "Any kind of content that ships with your game and is consumed by players that is created with the help of AI tools during development". **Live-Generated** is content "created with the help of AI tools while the game is running". On development tools, the page says "Efficiency gains through the use of these tools is not the focus of this section."

> **Pre-generated:** The app icon, the λ mark and some interface graphics (for example the orbital illustration on the photosensitivity notice) were generated with Google Gemini under the developer's direction and chosen by him. The program's code, tests and documentation were written with AI coding assistants (Anthropic Claude, OpenAI Codex/GPT, Google Gemini) under the developer's direction. Each change was tried in the running app before it was kept, and the physics is verified by automated tests against closed-form results.
>
> **Live-generated:** None. λWAVES uses no AI at runtime. Everything on screen is computed from physics, meaning closed-form hydrogen states and Hartree–Fock calculations, on the player's own GPU and CPU.

## No Steamworks runtime

> This product does not link or call the Steamworks SDK. Steam distributes the build and SteamPipe uploads it. There are no achievements, cloud saves, Workshop or DRM wrapper.

Why: Valve's SDK licence and GPL-3.0 can conflict (`LEGAL-PROVENANCE.md` §2 row 16 and §3). Projects live in the app's local storage and in files the user exports.

## Release type: Early Access or a normal release

**Recommendation: Early Access for the first release, unless the criteria below are all met by the Coming Soon date.**

Valve's guidance, read 2026-09-24 at https://partner.steamgames.com/doc/store/earlyaccess, says Early Access is for products that are playable now and will keep developing with the community. It is "not a way to crowdfund development", and a product cannot go back into Early Access once it is released. λWAVES matches that description. Its own README says "Status: 0.2.3 alpha", the device matrix has one desktop row, the Windows row reads "built, not run", and features still land every week.

Ship as a normal release only if all of these hold. They are the plan's M3 rows (`snoopy-purring-cocke.md` §M3, "Early Access vs normal decided from the M3 rows"):

1. The Windows row passes on Josh's PC in the 30-minute checklist: hydrogen, a molecule, modulation, capture, save/close/relaunch, and offline, with fps at 96³ recorded.
2. A second Windows GPU vendor (AMD or Intel) boots with WebGPU and no device loss.
3. The package carries `LICENSE`, `NOTICE` (with the BSE entry), Electron's licence files and `SOURCE.md`, and the icon and version metadata are finished (M3 polish).
4. Josh is content to call the version 1.0 and not alpha.

If Early Access, the store page needs Valve's Q&A. Drafts:

- **Why Early Access?** The instrument is complete enough to play every day. Hardware coverage on Windows is what grows next, and players' GPUs are the widest test there is.
- **How long?** Josh's call. Suggested wording: until the Windows device matrix covers the three GPU vendors and the version leaves alpha. Valve asks for a timeframe or a reason why there isn't one yet.
- **What is planned for the full version?** A broader device matrix, quality tiers measured per GPU, and a session checkpoint beside the project save (plan M1–M2). Anything further is added to this answer once it is actually built, not before.
- **What is the current state?** Everything on this page works in the current build. Closed-shell molecules only, fixed nuclei.
- **Will the price change?** Josh's decision. Write the answer here when the price is set.
- **How will the community be involved?** Steam discussions and GitHub issues. Changes are listed in the CHANGELOG at every release.
