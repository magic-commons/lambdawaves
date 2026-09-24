# store/: the three store kits

This folder holds everything Steam, the App Store and Google Play need that could be prepared before the accounts are paid. Josh can submit on the day he pays. It was built on 2026-09-24 against the `91c90bc` payload (v0.2.3-alpha.3). Every store rule quoted here names the page it came from and the date it was read. Re-read a rule on the day you act on it.

## Index

| Path | What it is |
|---|---|
| `PRIVACY.md`, `privacy.html` | The privacy policy all three stores need a URL for. It covers web, Steam, iPad and Android. The HTML is self-contained (no external assets) and readable on a phone. Keep the two files the same in content. |
| `shots.mjs` | Drives the packaged Electron build over CDP. `node store/shots.mjs` → the Steam screenshots; `--ipad` → the iPad renders; `--art` → the field-only capsule sources |
| `capsules.py` | `python3 store/capsules.py` → the capsule drafts, the Play feature graphic and the 32-bit Play icon |
| `steam/COPY.md` | Name, short description (279/300), About (Steam markup), five features, category, tags, languages, system requirements, the AI-disclosure text, "no Steamworks runtime", Early Access or not |
| `steam/ASSETS.md` | Every required Steam graphic with its size (read 2026-09-24), what each screenshot shows, the trailer and its ffmpeg command |
| `steam/screenshots/01…05-*.png` | 5 real 1920 × 1080 frames from the packaged Electron build |
| `steam/capsules/` | `header-capsule-920x430-DRAFT.png`, `library-capsule-600x900-DRAFT.png`, and their sources `src-field-*.png` (3840 × 2160) |
| `steam/trailer-draft.mp4` | 43.2 s, 1920 × 1080, 30 fps, H.264, silent AAC, 63 MB. **Gitignored; it exists only on disk in this worktree** |
| `steam/steampipe/` | `app_build.vdf`, `depot_build_windows.vdf`, `depot_build_linux.vdf` (APPID/DEPOTID placeholders) and `README.md` (steamcmd on Linux, the upload command) |
| `apple/METADATA.md` | Every App Store Connect field, the age rating, App Privacy = Data Not Collected, export compliance = NO, review notes |
| `apple/SCREENSHOTS.md`, `apple/screenshots/` | 5 renders at the required 13-inch size (2752 × 2064) and how they were made. They are renders, not iPad captures |
| `apple/CHECKLIST.md` | Done / waits for $99 / waits for device rows / waits for the licence, with every Apple page cited |
| `play/LISTING.md` | Name, short and full description, category, contact, Data safety, content rating, target audience |
| `play/ASSETS.md` | The Play graphic rules and what to shoot on the phone |
| `play/feature-graphic-1024x500-DRAFT.png`, `play/icon-512-32bit.png` | the feature graphic draft; the icon as a 32-bit PNG |
| `play/TESTING.md` | The closed test: 12+ testers × 14 consecutive days, track setup, the tester message, the production-access questions |

## Serving the privacy policy (proposed, not applied)

Put the page at `https://lambdawaves.magic-commons.com/privacy.html` as a **deploy-only** file, the same way `tools/build-deploy.mjs` now ships `shells/android/assetlinks.json`:

```js
// tools/build-deploy.mjs, §1 ASSEMBLE, next to the assetlinks copy (line ~201):
copyFileSync(path.join(ROOT, 'store/privacy.html'), path.join(DIST, 'privacy.html'));   // the stores' privacy-policy URL, origin root
// and in the DEPLOY_ONLY set (line ~141), so §V1 counts it as expected and not "neither precached nor covered":
const DEPLOY_ONLY = new Set(['_headers', '_redirects', 'robots.txt', '.well-known/assetlinks.json', 'privacy.html', ...SHIP_EXTRA.map(([f]) => at(f))]);
```

Why this works:

- `sw.js` answers only the app entry's navigations (`sw.js:346`), so `/privacy.html` always comes from the network, even for returning visitors.
- `_headers` sets no CSP, so the page's inline style applies.
- The page has no `href` or `src`, so §V2 has nothing to resolve.
- Because it lands in `dist/`, the Electron and iPad bundles carry it too. That makes an in-app `./privacy.html` link on the ABOUT face possible, and Apple's guideline 5.1.1(i) requires one (`apple/CHECKLIST.md`). That link is a `lab/` edit for a later package.

## Pay the fee, then do exactly this

### Steam ($100 Steam Direct fee; the account was opened 2026-09-24, and the plan puts the earliest first release at 2026-10-24)

1. Finish identity, tax and banking in Steamworks. Choose the app type: **Software ▸ Education** is recommended (`steam/COPY.md`).
2. Store page: paste name, short description, About, tags, languages and system requirements from `steam/COPY.md`. Set the website field. Answer the Content Survey with the AI text in `COPY.md`.
3. Upload the five `steam/screenshots/`, the capsule drafts (or Gemini's finals), and the trailer (after Josh decides its audio). Make the remaining "needs art" rows in `steam/ASSETS.md`.
4. Deploy with `privacy.html`, then submit the store page for review. Valve takes 3–5 business days and asks for 7 (review_process, read 2026-09-24). Set **Coming Soon**. It must be public for at least 2 weeks before release (`doc/store/coming_soon` and `doc/store/releasing`, read 2026-09-24).
5. SteamPipe: follow `steam/steampipe/README.md`. Windows depot only. Preview, then upload, then set live on `default`, then launch option `lambdawaves-desktop.exe`.
6. Before the build review: the Windows 30-minute row on Josh's PC, M3 polish (icon, `SOURCE.md`, `NOTICE` with BSE), and the Early Access decision (`COPY.md` criteria). Then submit the build for review (3–5 business days, plan for 7), and Release.

### Apple ($99 Developer Program)

1. Enrol under the chosen seller identity. An entity needs a D-U-N-S number.
2. Register the bundle ID `com.magiccommons.lambdawaves` and create the app record (iOS, **iPad only**, SKU `lambdawaves-ipad`).
3. Fill every field from `apple/METADATA.md`: App Privacy = **Data Not Collected**, age rating answers, categories, and the privacy URL once deployed.
4. Xcode 26 on the Mac: add `ITSAppUsesNonExemptEncryption` = NO, remove the iPhone destination, add the icon set, then Archive and upload. Distribute on TestFlight internal to the iPad.
5. After the P04 iPad row passes and the in-app privacy link ships: attach the build, upload `apple/screenshots/` (or real captures), paste the review notes, and **submit for TestFlight external or for review only after the licence decision** (`LEGAL-PROVENANCE.md` §4).

### Google Play ($25)

1. Create the app: name **λWAVES**, app not game, free or paid (Josh). Fill the store listing, Data safety, content rating and target audience from `play/LISTING.md`. The privacy URL must be live, and so must `/.well-known/assetlinks.json` (the same deploy).
2. Decide `minSdk` (31 recommended), rebuild the AAB in `shells/android/`, and upload it to a **closed** track.
3. Recruit 15 or more testers and follow `play/TESTING.md`. The clock starts when the 12th one opts in and needs 14 consecutive days.
4. Shoot 4 or more phone screenshots (9:16, not over 2:1) and upload them with the feature graphic.
5. Day 15 or later: Dashboard ▸ Apply for production, with the answers drafted from the tester log. Review usually takes up to 7 days.

## Still Josh's

| What | Where it goes | Blocks |
|---|---|---|
| Public contact e-mail (and a phone for Apple review) | `<josh's public contact>` in `PRIVACY.md`, `privacy.html`, `apple/METADATA.md`, `play/LISTING.md`, `play/TESTING.md` | all three stores |
| Support URL | `apple/METADATA.md` | Apple |
| Seller identity (personal or Magic Commons + D-U-N-S) | Apple enrolment, Steamworks, Play | all three |
| Prices (Steam, App Store, Play; free or paid) | each store's pricing page | release |
| Dates: Steam Coming Soon and release; TestFlight; Play closed-test start | the three sequences above | release |
| Final art: Steam small, main and vertical capsules, library hero and logo, shortcut and app icons; final header, library and feature graphics | `steam/ASSETS.md`, `play/ASSETS.md` | Steam store review; Play promotion |
| Trailer audio: confirm the HERO recordings' sound is his, or supply music | `steam/ASSETS.md` §Trailer | the trailer |
| Real device captures: 4+ phone screenshots; iPad captures if preferred | `play/ASSETS.md`, `apple/SCREENSHOTS.md` | Play |
| Steam category (Software vs Game) and Early Access vs normal | `steam/COPY.md` | Steam |
| The Apple store licence, with counsel | `LEGAL-PROVENANCE.md` §4 | the public App Store release |
| Approve the 2-line deploy change, then a deploy | this file, above | every privacy URL |
| One sudo line, if a sandboxed Linux capture or Linux depot is wanted | `docs/ACCEPTANCE-MATRIX.md` | Linux only |
