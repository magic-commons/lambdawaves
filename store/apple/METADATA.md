# App Store Connect metadata: λWAVES for iPad 1.0

Draft of 2026-09-24. The field limits come from Apple pages read that day:

- [P] https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- [I] https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- [A] https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- [PR] https://developer.apple.com/app-store/app-privacy-details/
- [G] https://developer.apple.com/app-store/review/guidelines/

`python3` counted every length below.

## App information

| Field | Value | Limit / note |
|---|---|---|
| Name | **λWAVES** | 2–30 characters [I]. If the name is taken in the store, use **λWAVES Quantum Lab** (18). |
| Subtitle | **Play hydrogen as an instrument** (30) | ≤ 30 [I]. Alternative: *Quantum waves you can play* (26). |
| Primary category | **Education** | |
| Secondary category | **Graphics & Design** | The captures and palettes are real design output, and people browsing Graphics & Design are the second audience. *Utilities* is the fallback, but it says nothing about the product. |
| Bundle ID | `com.magiccommons.lambdawaves` | as in `shells/ios/README.md` §2 |
| SKU | `lambdawaves-ipad` | private to you |
| Copyright | `2026 Joshua Hosain` | Apple adds the © [P] |
| Version / build | **1.0 / 1** | |
| Devices | **iPad only for 1.0** | Josh's call, 2026-09-24. The iPhone joins the same listing in an update once MIR Focus is ready. `shells/ios/README.md` §2 notes that a device family can be added later but not removed, so start narrow. |
| Price | **Josh's call** | |
| Support URL | `<support URL>` | Required. It "must lead to actual contact information" [P]. A page on the site or the GitHub issues page, plus `<josh's public contact>`. |
| Marketing URL | `https://lambdawaves.magic-commons.com` | optional [P] |
| Privacy policy URL | `https://lambdawaves.magic-commons.com/privacy.html` | Required for all apps [PR]. It goes live with the deploy that ships `store/privacy.html` (see `store/README.md`). |

## Promotional text (≤ 170; this one is 148)

Now on iPad: 91 exact hydrogen eigenstates and 52 small molecules, played as a living wave field on the GPU. Offline, no account, nothing collected.

## Keywords (≤ 100 bytes [P]; this list is exactly 100)

```
quantum,hydrogen,orbital,physics,chemistry,molecule,wavefunction,schrodinger,science,atom,visualizer
```

It does not repeat the app name, and it names no other app or company [P].

## Description (≤ 4000 characters, plain text [P]; this one is about 2,100)

```
λWAVES is a playable hydrogen shadow: a real-time instrument where quantum states become a wave field you can play. Pick states, tune their amplitudes and phases, turn the camera, and watch eigenmodes interfere and the cloud bloom into motion.

EXACT HYDROGEN
All 91 hydrogen states with n ≤ 6 are held in closed form and evolved exactly, one phase per energy. Nothing is integrated, so nothing drifts. The iPad's GPU rebuilds the wave function on a 3D grid every frame and draws it as density, phase, real or imaginary part, or a difference, in position or momentum space.

MOLECULES
MOLECULES solves restricted Hartree–Fock ground states for a library of 54 small molecules, 52 of them playable, in the STO-3G basis. 18 are also available in 6-31+G*. You get RPA and TDA spectra and real-time TDHF. MO-REGISTRY plays orbital packets or many-electron TD-CIS states, drives them with a field, and shows their current. These are closed shells with fixed nuclei, and there is no correlation beyond singles.

AN INSTRUMENT, NOT A VIEWER
• A rack of windows: STATE, SPECTRUM, SHADOW, ORBIT, SLICE, KEPLER, VORTEX, WIGNER, RADIATION, MOLECULES, MO-REGISTRY and more
• A transport with its own clocks, and presets to start from
• A modulation window: macros, LFOs, envelopes and live audio input, patched into exposure, camera, rate and other controls
• Draw back an impulse and release it to strike the wave

KEEP YOUR WORK
• Projects with folders, saved on your iPad and exported or imported as files
• A Markdown notebook with typeset maths beside every project
• Picture capture rendered at high resolution
• WAVE DANCER, a bundled demo performance, opens ready to play

HONEST NOTES
• Requires iPadOS 26 or later, which brings WebGPU. Performance depends on the iPad's chip. It was built and used on an M-series iPad.
• Works offline. No account, no analytics, no data collected. The microphone is used only if you add an AUDIO device, and the sound never leaves the iPad.
• Before the first frame, a photosensitivity notice explains that the field can flash and change colour quickly.
• Built by AI coding agents (Claude, GPT, Gemini) under the direction of one person, who decided what stayed. The physics is checked by automated tests against closed-form results.
```

Before submitting, check two lines against the real iPad build: "Draw back an impulse" (on the desktop it is Ctrl-drag; confirm the touch gesture) and "Picture capture". Video recording is left out on purpose until it has been measured in WKWebView.

## Age rating questionnaire [A]

Every content descriptor is **None**: profanity or crude humour; horror/fear; alcohol, tobacco or drugs; medical or treatment information; health or wellness topics; mature or suggestive themes; sexual content or nudity; graphic sexual content; cartoon or fantasy violence; realistic violence; prolonged graphic violence; guns or other weapons; simulated gambling; contests.

Every yes/no item is **No**: gambling; loot boxes; parental controls; age assurance; unrestricted web access (the five credit and "return home" links open Safari, and there is no in-app browsing); user-generated content (notes and projects stay on the device, with no sharing surface); social media; messaging and chat; advertising.

The expected result is **4+** ("No objectionable material"). The photosensitivity notice is the app's own and has no questionnaire item.

## App Privacy: **Data Not Collected**

Apple defines collection as "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time". It adds that "Data that is processed only on device is not 'collected' and does not need to be disclosed" [PR].

The iPad build loads its bundled `dist/` from inside the app and makes no network requests of its own. It has no accounts, analytics, advertising or third-party SDKs. Microphone audio is analysed in memory on the device and never stored or sent. Projects and notes live in the app's local storage. So the answer to "Do you or your third-party partners collect data from this app?" is **No**.

`NSMicrophoneUsageDescription` = "λWAVES listens only when you turn on audio input." (`shells/ios/README.md` §2).

## Export compliance

**`ITSAppUsesNonExemptEncryption` = NO** (Boolean, in Info.plist). In App Store Connect, answer that the app uses no non-exempt encryption.

Apple, read 2026-09-24:

- The key page (https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption, read through its JSON): "Set the value for this key to `NO` … to indicate that your app—including any third-party libraries you link against—either uses no encryption, or only uses encryption that's exempt from export compliance requirements." Also: "If you don't have the … key in your app's `Info.plist` file, App Store Connect walks you through an export compliance questionnaire every time you upload a new version."
- https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations: "Typically, the use of encryption that's built into the operating system—for example, when your app makes HTTPS connections using [URLSession]—is exempt." Also: "If your app uses exempt forms of encryption, you might alternatively be required to submit a year-end self-classification report to the U.S. government."
- The help overview the brief named, https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance, says that "When you submit a new version of your app, you'll need to answer questions in App Store Connect about your app's use of encryption." It names "Standard encryption algorithms" and "Crypto functionality within Apple's operating system" as examples that still need a determination. Its "no documentation required" path is to set the Info.plist key.

Why NO is right: λWAVES contains no cryptography of its own and links no crypto library. It makes no network connections, and the `.loopback` load mode, if that is the one chosen, serves plain HTTP on 127.0.0.1. Whether the self-classification report applies to an app that uses no encryption at all is Josh's to confirm. The Apple text ties it to *exempt* encryption use.

## App Review information

- Contact: `<name>`, `<josh's public contact>`, `<+country phone>` (all required [P]).
- Sign-in: **none required**, so leave username and password empty.
- Notes (≤ 4000 bytes [P]):

```
λWAVES is a self-contained scientific instrument, not a website wrapper. The whole app (HTML, JavaScript, WebGPU shaders, basis-set data) is bundled inside the app and runs offline in WKWebView. It computes exact hydrogen wave functions and Hartree–Fock molecular orbitals on the iPad's GPU and CPU and draws them in real time with WebGPU (iPadOS 26).

There is no sign-in, no account, no network use, no analytics and no purchase inside the app.

The microphone is optional. It is requested only if the reviewer adds an AUDIO device to the modulation window, and the sound is analysed on the device and never stored or sent.

On first launch a photosensitivity notice appears. Tap CONTINUE.

Five steps to the main workflows:
1. Tap ▶ in the transport at the bottom to play the field. Drag on the field to turn the camera, and pinch to zoom.
2. In SPECTRUM (left), tap mode buttons such as 2p₀ or 3d₂ to add hydrogen states to the superposition, and watch the field change.
3. Tap the λWAVES wordmark at the top left to open the menu, then WINDOW ▸ NOTEBOOK. In the notebook's header tap ▤ (projects) ▸ DEMOS ▸ WAVE DANCER. A saved performance opens with the modulation window and plays.
4. Tap + at the top right of the stage (reopen a closed window) ▸ MOLECULES, switch MOLECULES ON, and pick a molecule (for example C6H6) to see its computed electron density.
5. In the notebook, tap ◐ to edit and type Markdown (maths in $…$ is typeset), then tap ▤ and SAVE AS with a name to keep the session. EXPORT there writes a project file through the share sheet.
```

Before submitting, check steps 1–5 against the real iPad build. The exact button positions come from the desktop layout and have not been confirmed on an iPad (P04 rows pending).

Guideline 4.2, read 2026-09-24 [G]: "Your app should include features, content, and UI that elevate it beyond a repackaged website." The notes' first paragraph is there for that reason.
