# Apple checklist: λWAVES for iPad 1.0

Status on 2026-09-24. The Apple pages cited here were read that day. Re-read any rule the day you act on it.

## Done in this kit (no account needed)

- [x] Name, subtitle, promotional text, description, keywords, categories, age-rating answers, App Privacy answer, export-compliance answer and review notes: `METADATA.md`.
- [x] Privacy policy text: `store/PRIVACY.md` and `store/privacy.html`. Serving it is proposed in `store/README.md`.
- [x] Five 13-inch screenshots at 2752 × 2064: `screenshots/`. They are renders of the same bundle at iPad size, not iPad captures (`SCREENSHOTS.md`).
- [x] The Xcode project recipe, Info keys and three load modes: `shells/ios/README.md`. The P04 builder wrote this, not this kit.

## Needs a change in the app before submission (not store work)

- [ ] **A privacy-policy link inside the app.** Guideline 5.1.1(i): "All apps must include a link to their privacy policy in the App Store Connect metadata field **and within the app in an easily accessible manner**." ABOUT has no such link today. The smallest fix is to ship `privacy.html` in `dist/` (the two lines in `store/README.md`) and add a `PRIVACY` link next to LICENSE/NOTICE on the ABOUT face (`lab/index.html`). Because it is relative (`./privacy.html`), it works offline inside the iPad bundle. It is a `lab/` edit, so `node tests/pwa.test.mjs --write` follows.
- [ ] `ITSAppUsesNonExemptEncryption` = NO added to the target's Info (it is not in `shells/ios/README.md` §2's key table yet).
- [ ] Remove the iPhone destination from the target for the 1.0 record (`shells/ios/README.md` §2, step 3).
- [ ] An app icon set in the Xcode asset catalog, taken from the Gemini mark.

## Waits for the $99 Apple Developer Program

1. Enrol under the chosen identity: personal name, or a Magic Commons entity, which needs a D-U-N-S number (`LEGAL-PROVENANCE.md` §5, item 4). This comes first because the seller name is hard to change later.
2. In App Store Connect ▸ Apps ▸ +: New App. Platform iOS, name **λWAVES**, primary language English (U.S.), bundle ID `com.magiccommons.lambdawaves` (register it under Identifiers first), SKU `lambdawaves-ipad`.
3. Fill App Information, Pricing, App Privacy (**Data Not Collected**) and the age rating from `METADATA.md`. Enter the privacy URL once the page is live.
4. Archive in Xcode 26 (⌘B, then Product ▸ Archive ▸ Distribute ▸ App Store Connect). The upload page (https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds) lists Xcode, `altool`, Transporter, the API and Xcode Cloud, and its table says iOS apps must be "Built with Xcode 26+". After processing, an e-mail arrives and the build shows in TestFlight.
5. TestFlight internal testing on the iPad. This needs no review and no licence decision (`LEGAL-PROVENANCE.md` §4).
6. Version 1.0: attach the build, add the screenshots, the review notes and the contact, then Submit for Review.

## Waits for the device rows (P04, `docs/ACCEPTANCE-MATRIX.md`)

- [ ] The iPad M5 row: which load mode boots with WebGPU (`.fileURL` / `.customScheme` / `.loopback`), fps at 64³ and 96³, 60 s background, export/import through Files, rotation and a window a third wide.
- [ ] The review-note steps 1–5 checked by hand on the iPad, especially the touch gesture for the impulse and where + and the menu sit.
- [ ] Real iPad screenshots, if Josh prefers them to the renders.
- [ ] Video capture in WKWebView measured before the description mentions it.

## Waits for the licence decision (before the **public** release, not before TestFlight)

- [ ] The store distribution licence for the App Store build, with counsel (`LEGAL-PROVENANCE.md` §4). GPL-3.0-only and Apple's minimum EULA terms conflict. Josh, as sole copyright holder, can dual-license. Until that is decided, submit only for TestFlight.

## Apple pages read for this kit (all 2026-09-24)

- https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications: sizes, 13-inch required, no alpha
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-information: name and subtitle ≤ 30
- https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information: promotional text 170, description 4000, keywords 100 bytes, review notes 4000 bytes, support URL must reach contact information
- https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions: the questionnaire items and the 4+/9+/13+/16+/18+ bands
- https://developer.apple.com/app-store/app-privacy-details/: "collect" defined, on-device processing exempt, privacy policy URL required
- https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance: questions asked at each new version; Info.plist route for "no documentation required"
- https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption: key semantics (read through the docs JSON)
- https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations: OS-provided encryption is typically exempt; the year-end self-classification note
- https://developer.apple.com/app-store/review/guidelines/: 2.3.3 screenshots, 4.2 minimum functionality, 5.1.1(i) the in-app privacy link
- https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds: upload routes, "Built with Xcode 26+"
