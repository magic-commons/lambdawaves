# Google Play listing: λWAVES (Trusted Web Activity)

Draft of 2026-09-24. Package `com.magiccommons.lambdawaves` (`shells/android/twa-manifest.json`), which wraps the live site in Chrome.

Limits were read that day:

- [L] https://support.google.com/googleplay/android-developer/answer/9859152
- [D] https://support.google.com/googleplay/android-developer/answer/10787469 (Data safety)
- [T] https://support.google.com/googleplay/android-developer/answer/9867159 (target audience)
- [R] https://support.google.com/googleplay/android-developer/answer/9859655 (content rating)

## Store listing

| Field | Value | Limit [L] |
|---|---|---|
| App name | **λWAVES** | 30 |
| Short description | **Play hydrogen's exact quantum states and small molecules as a living 3D wave.** (77) | 80 |
| Category | **Education** | |
| Tags | Science, Physics, Chemistry, Education (pick from Play Console's list; up to five) | |
| Contact e-mail | `<josh's public contact>` | required [L] |
| Website | `https://lambdawaves.magic-commons.com` | recommended [L] |
| Phone | leave empty | optional |
| Privacy policy | `https://lambdawaves.magic-commons.com/privacy.html` | required, even with no data collected [D] |
| Contains ads | **No** | |
| In-app purchases | **None** | |
| Price | **Josh's call.** Free fits a wrapper of a free website. A paid TWA of a free site is allowed but draws reviews. | |

Play's policy text on names and descriptions [L]: "Repetitive or irrelevant use of keywords in the app name, description … can … result in an app being suspended". So no keyword list goes in the name.

## Full description (≤ 4000 [L]; about 2,000)

```
λWAVES is a playable hydrogen shadow: a real-time instrument where quantum states become a wave field you can play. Pick states, tune their amplitudes and phases, turn the camera, and watch eigenmodes interfere and the cloud bloom into motion.

EXACT HYDROGEN
All 91 hydrogen states with n ≤ 6 are held in closed form and evolved exactly, one phase per energy. Nothing is integrated, so nothing drifts. Your phone's GPU rebuilds the wave function on a 3D grid and draws it as density, phase, real or imaginary part, or a difference, in position or momentum space.

MOLECULES
Restricted Hartree–Fock ground states for a library of 54 small molecules, 52 of them playable, in the STO-3G basis. 18 are also available in 6-31+G*. You get RPA and TDA spectra and real-time TDHF. MO-REGISTRY plays orbital packets or many-electron TD-CIS states and shows their current. These are closed shells with fixed nuclei, and there is no correlation beyond singles.

AN INSTRUMENT, NOT A VIEWER
• A rack of windows: STATE, SPECTRUM, SHADOW, ORBIT, SLICE, KEPLER, VORTEX, WIGNER, RADIATION, MOLECULES, MO-REGISTRY and more
• A modulation window: macros, LFOs, envelopes and live audio input, patched into exposure, camera, rate and other controls
• Presets, and a transport with its own clocks

KEEP YOUR WORK
• Projects with folders, saved on your device and exported or imported as files
• A Markdown notebook with typeset maths
• WAVE DANCER, a bundled demo performance, opens ready to play

HONEST NOTES
• Needs Chrome with WebGPU. On Android that means Android 12 or later on a recent GPU. It was measured working on a Pixel 10 Pro XL with Chrome 153. Phones without WebGPU get a notice instead of the lab.
• The first launch needs an internet connection, because the app is the λWAVES website running in Chrome.
• No account, no analytics, no ads, no data collected. The microphone is used only if you add an AUDIO device, and the sound never leaves your phone.
• Before the first frame, a photosensitivity notice explains that the field can flash and change colour quickly.
• Free and open source under GPL-3.0. Built by AI coding agents (Claude, GPT, Gemini) under the direction of one person. The physics is checked by automated tests against closed-form results.
```

Keep "Android 12 or later" in line with the release. `minSdk` is 21 today, and `docs/ACCEPTANCE-MATRIX.md` P06 records the pending decision to raise it to 31 (Android 12) before the store build.

## Data safety form [D]

- **Does your app collect or share any of the required user data types? No.**
- Play's definition: "'Collect' means transmitting data from your app off a user's device". It includes "data from webviews controlled by your app". The exemptions: data "only processed locally on the user's device … does **not** need to be disclosed", and "ephemeral" processing to serve a real-time request.
- Microphone: audio is analysed on the device only and never sent, so nothing is disclosed. `shells/android/app/src/main/AndroidManifest.xml` declares no `uses-permission`. The merged manifest in the built AAB was not inspected here, so check Play Console ▸ App bundle explorer ▸ permissions before answering. The microphone prompt, when AUDIO is added, is Chrome's site permission for lambdawaves.magic-commons.com.
- The one off-device transfer is Chrome fetching the app's static files, with the IP address and user agent that every web request carries, served by Cloudflare. λWAVES keeps nothing and adds no analytics. **Revisit this answer if Cloudflare Web Analytics, log retention or any SDK is ever turned on.**
- Even with no data collected, the form and the privacy policy link are still required [D].

## Content rating (IARC questionnaire, Policy ▸ App content [R])

- E-mail for IARC correspondence: `<josh's public contact>` [R].
- Category: the educational/reference app category (not "Game"). Pick the label that says so in the Console.
- Answer **No** to every content question: violence, fear, sexuality, language, controlled substances, crude humour, gambling or simulated gambling. Also No to users interacting or sharing content, sharing location, digital purchases, and unrestricted internet access. The app is one site. Its five credit and "return home" links open outside the app.
- The expected outcome is the lowest band in each region (Everyone / PEGI 3). The questionnaire calculates it; this is not a promise.

## Target audience and content [T]

- Age groups: **13–15, 16–17, 18 and over.** Leave out every group under 13.
- Why: λWAVES is a dense science instrument with mathematical notation, a photosensitivity notice before the first frame, and nothing designed for young children. Play says: "Any apps that have at least one target audience age group that includes children must comply with Google Play's Families Policy Requirements". Excluding under-13 groups keeps the app out of that programme.
- "Could your store listing unintentionally appeal to children?" **No.** There are no characters, no cartoon art and no child-directed wording in the listing or the graphics.

## Other App content declarations

App access: **all functionality is available without special access** (no login). Ads: No. News app: No. Government app: No. Financial features: None. Health: None. Data deletion: there is no account and no data, so the privacy policy's "Keeping and deleting data" section applies.
