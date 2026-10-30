# LEGAL-PROVENANCE — what is in the tree, who owns it, and what each store needs

Drafted 2026-09-24 by Fable (Claude) from the tree at `91c90bc` (v0.2.3-alpha.3); **updated 2026-10-30 from the tree at `003578f4`** (iteration 028 chain F, REVIEW R-20: the authorship premise, the kit and vendor rows, the data rows, §5's proposed answers). **Status: DRAFT for Josh to confirm; not legal advice.** A licensing lawyer reviews the Apple route before any public App Store listing (§4). Nothing here changes the licence of the repository, which stays GPL-3.0-only.

## 1. Why this file exists

Selling λWAVES through a store means distributing a binary. Every binary must carry the notices its components require, and the App Store's own licence terms sit uneasily beside GPLv3 (§4). Before either submission we need one page that says, for every shipped part: where it came from, whether code was copied, its licence, who holds the copyright, and what the store needs. Sol and Astra both asked for this; here it is.

## 2. Components

| # | Component | Where in the tree | Origin | Copied code? | Licence | Copyright holder | Store concern |
|---|---|---|---|---|---|---|---|
| 1 | λWAVES application (physics, renderer, MIR host, tests, tools, docs) | `lab/*.js`, `lab/*.css`, `lab/index.html`, `tests/`, `tools/`, `research/` | Written with AI coding agents (Claude, OpenAI Codex/GPT, Gemini) under Josh's direction. Git authors at `003578f4` (2,119 commits): **Joshua Hosain** under two e-mail identities, and **five commits under the agent identity `Claude <noreply@anthropic.com>`** (`09d2492d` 2026-10-04; `1810ea67`, `3fed5f29`, `d917dc7a`, `00a15e44` 2026-10-05) — a Claude Code session Josh ran on the branch `claude/youthful-shannon-y0pdx5`, merged by Josh as PR #1 and #2. 1,910 commit messages carry a `Co-Authored-By:` trailer naming the model that wrote the commit under Josh's author identity. No other human authored a commit. | original | GPL-3.0-only (`LICENSE`, `NOTICE`, `package.json`) | Joshua Hosain, to the extent the work is copyrightable (AI-generated text has limited copyright under current US Copyright Office guidance; that limits what can be *enforced*, not what Josh may *distribute* or *license*). The agent identity is a tool account, not a second rights holder — Josh confirms (§5 item 1) | None for Steam. For Apple, Josh may license his own work under additional terms (§4). `git shortlog` shows a second author name; §5 item 1 is the sentence that answers it. |
| 2 | MIR interface kit | `lab/mir/**`, `lab/fonts/**` (adopted copy of github.com/magic-commons/mir; `MIR-MANIFEST.json` reads **1.5.6-alpha.17**: the base 1.5.5 plus the doors 1.5.6-alpha.1…17) | Extracted from λWAVES by the same agents; same owner | original | GPL-3.0 (MIR `LICENSE`) | Joshua Hosain | Same as #1. Any relicensing decision applies to MIR too, and MIR's copy is the one that ships. |
| 3 | KaTeX 0.16.11 (one copy) | `lab/mir/shell/vendor/katex/` | Vendored upstream build | vendored, unmodified | MIT (`LICENSE` ships beside it) | KaTeX contributors | Notice only (`NOTICE` §5). |
| 4 | KaTeX fonts | `…/katex/fonts/` | Vendored | unmodified | SIL OFL 1.1 (`OFL.txt` ships) | KaTeX / font authors | Notice only. |
| 5 | marked 12.0.2 (one copy) | `lab/mir/shell/vendor/marked.min.js` | Vendored | unmodified | MIT (`marked-LICENSE.md` ships) | marked contributors | Notice only (`NOTICE` §4). |
| 6 | LW Title typeface (five-glyph subset of Spinwerad 0.3, renamed per OFL §3) | `lab/fonts/LWTitle-title.woff2` | Subset made for the wordmark | derived font | SIL OFL 1.1 (`Spinwerad-OFL.txt`, `-SOURCE.txt`) | gluk (original); the subset is a Modified Version | `NOTICE` §1 already documents the rename; ships as-is. OFL forbids selling the font *alone*; bundling inside software is permitted. |
| 7 | Roboto subset | `lab/fonts/Roboto-ui.woff2` | Subset | derived font | SIL OFL 1.1 | The Roboto Project Authors | `NOTICE` §2. Same OFL note. |
| 8 | STIX Two Math subset | `lab/fonts/STIXTwoMath-subset.woff2` | Subset | derived font | SIL OFL 1.1 | The STIX Fonts Project Authors | `NOTICE` §3. Same OFL note. |
| 9 | Basis Set Exchange records (STO-3G, STO-6G, 3-21G, 6-31G, 6-31G* H–Kr; 6-31+G* H–Ar — the basis ladder, iteration 004) | `lab/vendor/bse/*.json` (sha256 pinned in `index.json`) | Downloaded verbatim from basissetexchange.org (API URLs recorded in `index.json`) | data, not code | Not recorded in the vendored files. The BSE project's repository is BSD 3-Clause (Copyright 2020 MolSSI, Virginia Tech) and names no separate data licence; the BSE site asks for citation of Pritchard et al., *J. Chem. Inf. Model.* 59 (2019) 4814 (both read 2026-10-30; this row said "CC BY 4.0" until then, which neither source states) | Basis Set Exchange / the original basis-set authors (named by reference key in each record) | **Done (028 R-16):** `NOTICE` §9 carries the licence as found, the citation and the files. No conflict with either store. |
| 9a | The notebook's typefaces: Spectral, Playfair Display, Alegreya SC (14 WOFF2) | `lab/fonts/info/` (`SOURCE.txt` records each URL and size) | Google Fonts' own files, fetched 2026-10-01 by the kit | unmodified fonts | SIL OFL 1.1 (each family's `OFL.txt` ships) | The Spectral, Playfair Display and Alegreya Project Authors | `NOTICE` §8 (028 R-16). Same OFL note as #6. |
| 9b | NIST ASD measured lines | `lab/vendor/nist/lines.json` (`tools/nist-lines.py`) | NIST Atomic Spectra Database, fetched 2026-10-25 | data | U.S. Government work, public domain in the US | n/a (credit: Kramida, Ralchenko, Reader and the NIST ASD Team) | `NOTICE` §10 and the ABOUT face credit it. None. |
| 10 | ChronusQ | credited in `lab/index.html:113` (ABOUT) and `README.md:198` | Reference only. The 2026-09-11 research pass (`research/chronusq-2026-09-11/SYNTHESIS.md`) found **no ChronusQ source in the tree**; `lab/scf.js`, `lab/density.js`, `lab/absorb.js` were written from the published papers (Williams-Young et al. 2020; Yabana–Bertsch 1996) | **no** | ChronusQ's public repo is GPL-2.0; not applicable to independent reimplementation of published methods | Chronus Quantum team | None. The credit line is Josh's choice ("for my humility"); SYNTHESIS §4 proposes more accurate wording. Keep or reword, no licence effect. |
| 11 | PySCF-derived oracle numbers | `lab/oracles/*.json`, `tests/fixtures/`, `research/**/oracle-pyscf.json` | Outputs of PySCF (Apache-2.0) runs on this machine | data | Facts/outputs, not PySCF code | n/a | None. |
| 12 | Icons and graphics | `lab/img/icon*.png`, `icon.svg`, `icon-maskable.svg`, `warning-sign.png`, `lambdawaves-logo.svg` (outlined from the LW Title subset and STIX Two Math, both OFL — a logo drawn from a font's outlines is artwork, not Font Software), the landing "square lambda" icon (commit `ef322ce`); `lab/img/menu/` (1,211 Picker pictures, renders of the app's own field by `tools/menu-thumbs.mjs`) | Made by Gemini under Josh's direction (README "AI disclosure"), the menu pictures by the app itself | AI-generated shipped content | Shipped under the app's licence; copyright in AI-generated images is limited | Joshua Hosain (limited) | **Steam content survey: disclose as pre-generated AI content** (artwork). Apple: no disclosure rule, no conflict. |
| 13 | Landing-page videos | `LANDING PAGE VIDEOS/*.mkv` (untracked, 2026-09-21) | Josh's own screen recordings of the app | original | Josh's | Joshua Hosain | Store trailer/screenshot material. **Josh confirms `AUDIO.mkv` and any trailer cut contain no third-party music.** |
| 14 | Demo projects and presets | `lab/demos/` | Made in the app by Josh/agents | original | GPL-3.0-only with the app | Joshua Hosain | None. |
| 15 | Electron (desktop host, M3) | `tools/platform/electron/` (runtime downloaded at build) | Upstream | unmodified runtime | MIT; bundled Chromium/Node carry BSD/MIT and others | Electron / Chromium / Node authors | The packaged app must ship Electron's `LICENSE` and `LICENSES.chromium.html` (the packager includes them; keep them). |
| 16 | Steamworks SDK | none in v1 | n/a | n/a | Valve's proprietary SDK licence | Valve | **Deliberately not linked.** Valve's own page on distributing open-source software says the SDK's terms and copyleft licences can conflict; v1 uses Steam only as a store and SteamPipe as an uploader. |
| 17 | Third-party services at runtime | none by the app; one road by content | The build proves no off-origin reference in the shipped files (`tools/build-deploy.mjs` §V2/§V4). An imported notebook's `![](https://…)` image is fetched from wherever it points on each open (REVIEW R-09; the kit fix is a FOR-MIR line); the ASK broker is off in this build (`lab/ask.js`). `SECURITY.md` lists every request (028 R-15) | n/a | n/a | n/a | Apple App Privacy: "no data collected" still holds (nothing reaches Josh or Magic Commons); the notebook image road is the user's own content and is said in `SECURITY.md`. Microphone and MIDI are local and gated by permission. |

## 3. Steam route (GPL is fine here)

- GPL software may be sold at any price (GNU FAQ). What buyers get: the convenient signed build, updates and Steam's delivery; they keep every GPL right to the source.
- Obligations per released binary: `LICENSE`, `NOTICE` (its BSE, NIST and notebook-face entries landed at 028 R-16), Electron's licence files, and **corresponding source**: a `SOURCE.md` in the package naming the exact git tag and commit, plus the public repository and a source archive attached to the matching GitHub Release. Since 028 R-29 `tools/platform/electron/package.mjs` writes `SOURCE.md` from `build-identity.json` and puts it, `COPYING` (λWAVES' GPL text; Electron's MIT `LICENSE` keeps that name) and `NOTICE` in each package root — proved by reading, not yet by a packaged run.
- Content survey: answer "pre-generated AI content: artwork/icons (Gemini)"; the app itself generates nothing with AI at runtime; code assistance is not surveyed content.
- No Steamworks runtime, no Steam DRM wrapper, until the SDK licence question is resolved on its own (M7 candidate: Steam Cloud).

## 4. Apple route (this is the one that needs a decision)

- Apple's Developer Program License Agreement requires any developer EULA to meet Apple's minimum terms (a non-transferable licence limited by Apple's usage rules). GPLv3 §10 forbids imposing further restrictions on recipients' rights and §12 says you may not convey the work if other obligations prevent GPL compliance. That is the tension; the FSF's 2010 GNU Go removal is the precedent for what happens when nobody addresses it.
- Because Josh is the only human author of #1, #2, #12 and #14 (the five agent-identity commits of row 1 are his own session's, §5 item 1), and every other shipped part (#3–#9b, #15) is MIT, OFL, BSD-3 or public domain and compatible with store terms, the clean route is **dual licensing**: the public repository stays GPL-3.0-only, and Josh grants a separate "official store distribution" licence for the App Store build. Nobody else has to agree. The GPL copies already released stay GPL forever.
- What counsel should confirm before M6: the wording of that store licence; whether any AI-authorship limitation affects Josh's ability to grant it (it should not affect distribution); that the OFL fonts and the BSE data are fine inside a proprietary-terms binary (they are, with notices); that the agent-identity commits of row 1 need nothing beyond Josh's word; the ChronusQ credit wording.
- Not needed before TestFlight internal testing (no public distribution).

## 5. Open items (Josh)

1. Confirm no other person contributed code, text or assets (friends, forum snippets, Codex sessions on someone else's account).
2. Confirm the videos carry no third-party audio.
3. Confirm the Gemini icon provenance and that no stock imagery was used.
4. Choose the publishing identity for both stores (personal name vs a Magic Commons entity; an entity needs a D-U-N-S number for Apple and its own tax/banking details for Valve) before creating either app record; changing the seller name later is painful.
5. Decide whether the ChronusQ credit line is reworded (no licence effect either way).

### 5a. PROPOSED (Josh confirms) — the fleet's wording, 2026-10-30

Nothing below is an answer until Josh says it is; each line is the sentence the fleet would write if he does.

1. *Contributors.* "No other person contributed code, text or assets to λWAVES. Every commit is Joshua Hosain's, under his two e-mail identities,
   except five (`09d2492d`, `1810ea67`, `3fed5f29`, `d917dc7a`, `00a15e44`; 2026-10-04/05) authored and committed as `Claude <noreply@anthropic.com>`
   by a Claude Code session he ran and merged himself (PR #1, #2): the same work, under the same direction. The `Co-Authored-By:` trailers in
   1,910 commit messages name the AI tools that wrote those commits under his identity (README, AI disclosure); they are tools, not
   contributors with rights of their own." (To check before confirming: any Codex or Gemini session run on an account that is not Josh's.)
2. *The videos' audio.* "The landing-page recordings (`LANDING PAGE VIDEOS/*.mkv`, untracked, never shipped) are Josh's screen captures of the
   app. Their sound is the app's own output or none; no recording carries third-party music." (Josh names `AUDIO.mkv`'s source; until he
   does, no recording with sound goes into a store trailer.)
3. *The icons.* "The icon set, the mark and the warning sign were made with Gemini under Josh's direction and finished by the agents; the
   wordmark (`lambdawaves-logo.svg`) is outlined from the OFL faces of `NOTICE` §1 and §3; the Picker's pictures are renders of the app's own
   field. No stock imagery and no other third-party artwork is in `lab/img/`."
4. *The publishing identity.* "Both stores publish as ______ (Joshua Hosain personally / a Magic Commons entity with D-U-N-S ______)." The
   fleet cannot propose this one; it is Josh's alone. The fleet's reading: decide it before either app record exists.
5. *ChronusQ.* "Team @ Chronus Quantum, for the Molecular Orbital Model" stays as the thanks line (Josh's choice), with README's sentence
   beside it as the accurate statement: ChronusQ is read and cited, never merged; no ChronusQ code is in this tree
   (`research/chronusq-2026-09-11/SYNTHESIS.md` §4 holds the longer wording if he prefers it).

## 6. Actions this file generates for the repo

- ~~`NOTICE`: add the Basis Set Exchange data with the citation and the API URLs.~~ Done at 028 R-16 (§9, with the notebook faces §8 and NIST §10).
- ~~M3 packaging: include `LICENSE`, `NOTICE`, Electron's licence files and `SOURCE.md`.~~ Written at 028 R-29 (`package.mjs`); a packaged run proves it at the 1.0 build.
- `store/apple/CHECKLIST.md`'s "sole copyright holder" now reads as row 1 does (028 R-20).
- M6: the store licence text, after counsel.
