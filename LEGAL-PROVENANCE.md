# LEGAL-PROVENANCE — what is in the tree, who owns it, and what each store needs

Drafted 2026-09-24 by Fable (Claude) from the tree at `91c90bc` (v0.2.3-alpha.3). **Status: DRAFT for Josh to confirm; not legal advice.** A licensing lawyer reviews the Apple route before any public App Store listing (§4). Nothing here changes the licence of the repository, which stays GPL-3.0-only.

## 1. Why this file exists

Selling λWAVES through a store means distributing a binary. Every binary must carry the notices its components require, and the App Store's own licence terms sit uneasily beside GPLv3 (§4). Before either submission we need one page that says, for every shipped part: where it came from, whether code was copied, its licence, who holds the copyright, and what the store needs. Sol and Astra both asked for this; here it is.

## 2. Components

| # | Component | Where in the tree | Origin | Copied code? | Licence | Copyright holder | Store concern |
|---|---|---|---|---|---|---|---|
| 1 | λWAVES application (physics, renderer, MIR host, tests, tools, docs) | `lab/*.js`, `lab/*.css`, `lab/index.html`, `tests/`, `tools/`, `research/` | Written with AI coding agents (Claude, OpenAI Codex/GPT, Gemini) under Josh's direction; git authors = Joshua Hosain only (117 commits, two e-mail identities, no other human) | original | GPL-3.0-only (`LICENSE`, `NOTICE`, `package.json`) | Joshua Hosain, to the extent the work is copyrightable (AI-generated text has limited copyright under current US Copyright Office guidance; that limits what can be *enforced*, not what Josh may *distribute* or *license*) | None for Steam. For Apple, Josh may license his own work under additional terms (§4); no third party needs to agree. **Josh confirms: no other person contributed code or assets.** |
| 2 | MIR interface kit | `lab/mir/**`, `lab/fonts/**` (adopted copy of github.com/magic-commons/mir, manifest `MIR-MANIFEST.json`, 1.4.3) | Extracted from λWAVES by the same agents; same owner | original | GPL-3.0 (MIR `LICENSE`) | Joshua Hosain | Same as #1. Any relicensing decision applies to MIR too, and MIR's copy is the one that ships. |
| 3 | KaTeX (two copies) | `lab/vendor/katex/`, `lab/mir/shell/vendor/katex/` | Vendored upstream build | vendored, unmodified | MIT (`LICENSE` ships beside it) | KaTeX contributors | Notice only. |
| 4 | KaTeX fonts | `…/katex/fonts/` | Vendored | unmodified | SIL OFL 1.1 (`OFL.txt` ships) | KaTeX / font authors | Notice only. |
| 5 | marked 12.0.2 (two copies) | `lab/vendor/marked.min.js`, `lab/mir/shell/vendor/marked.min.js` | Vendored | unmodified | MIT (`marked-LICENSE.md` ships) | marked contributors | Notice only. |
| 6 | LW Title typeface (five-glyph subset of Spinwerad 0.3, renamed per OFL §3) | `lab/fonts/LWTitle-title.woff2` | Subset made for the wordmark | derived font | SIL OFL 1.1 (`Spinwerad-OFL.txt`, `-SOURCE.txt`) | gluk (original); the subset is a Modified Version | `NOTICE` §1 already documents the rename; ships as-is. OFL forbids selling the font *alone*; bundling inside software is permitted. |
| 7 | Roboto subset | `lab/fonts/Roboto-ui.woff2` | Subset | derived font | SIL OFL 1.1 | The Roboto Project Authors | `NOTICE` §2. Same OFL note. |
| 8 | STIX Two Math subset | `lab/fonts/STIXTwoMath-subset.woff2` | Subset | derived font | SIL OFL 1.1 | The STIX Fonts Project Authors | `NOTICE` §3. Same OFL note. |
| 9 | Basis Set Exchange records (STO-3G H–Kr; 6-31+G* H,C,N,O,F) | `lab/vendor/bse/*.json` (sha256 pinned in `index.json`) | Downloaded verbatim from basissetexchange.org (API URLs recorded in `index.json`) | data, not code | **Not recorded in the vendored files.** BSE publishes its data under CC BY 4.0 and asks for citation of Pritchard et al., *J. Chem. Inf. Model.* 59 (2019) 4814 | Basis Set Exchange / the original basis-set authors | **Action:** add a BSE entry to `NOTICE` with the CC BY 4.0 attribution and the citation; re-verify the licence on the BSE site at execution. No conflict with either store. |
| 10 | ChronusQ | credited in `lab/index.html:113` (ABOUT) and `README.md:198` | Reference only. The 2026-09-11 research pass (`research/chronusq-2026-09-11/SYNTHESIS.md`) found **no ChronusQ source in the tree**; `lab/scf.js`, `lab/density.js`, `lab/absorb.js` were written from the published papers (Williams-Young et al. 2020; Yabana–Bertsch 1996) | **no** | ChronusQ's public repo is GPL-2.0; not applicable to independent reimplementation of published methods | Chronus Quantum team | None. The credit line is Josh's choice ("for my humility"); SYNTHESIS §4 proposes more accurate wording. Keep or reword, no licence effect. |
| 11 | PySCF-derived oracle numbers | `lab/oracles/*.json`, `tests/fixtures/`, `research/**/oracle-pyscf.json` | Outputs of PySCF (Apache-2.0) runs on this machine | data | Facts/outputs, not PySCF code | n/a | None. |
| 12 | Icons and graphics | `lab/img/icon*.png`, `icon.svg`, `icon-maskable.svg`, `warning-orbital.png`, the landing "square lambda" icon (commit `ef322ce`) | Made by Gemini under Josh's direction (README "AI disclosure") | AI-generated shipped content | Shipped under the app's licence; copyright in AI-generated images is limited | Joshua Hosain (limited) | **Steam content survey: disclose as pre-generated AI content** (artwork). Apple: no disclosure rule, no conflict. |
| 13 | Landing-page videos | `LANDING PAGE VIDEOS/*.mkv` (untracked, 2026-09-21) | Josh's own screen recordings of the app | original | Josh's | Joshua Hosain | Store trailer/screenshot material. **Josh confirms `AUDIO.mkv` and any trailer cut contain no third-party music.** |
| 14 | Demo projects and presets | `lab/demos/` | Made in the app by Josh/agents | original | GPL-3.0-only with the app | Joshua Hosain | None. |
| 15 | Electron (desktop host, M3) | `shells/electron/` (runtime downloaded at build) | Upstream | unmodified runtime | MIT; bundled Chromium/Node carry BSD/MIT and others | Electron / Chromium / Node authors | The packaged app must ship Electron's `LICENSE` and `LICENSES.chromium.html` (the packager includes them; keep them). |
| 16 | Steamworks SDK | none in v1 | n/a | n/a | Valve's proprietary SDK licence | Valve | **Deliberately not linked.** Valve's own page on distributing open-source software says the SDK's terms and copyleft licences can conflict; v1 uses Steam only as a store and SteamPipe as an uploader. |
| 17 | Third-party services at runtime | none | The build proves no off-origin fetch (`tools/build-deploy.mjs` §V2/§V4) | n/a | n/a | n/a | No privacy disclosure beyond "no data collected" (Apple App Privacy: none; microphone use is local and gated by permission). |

## 3. Steam route (GPL is fine here)

- GPL software may be sold at any price (GNU FAQ). What buyers get: the convenient signed build, updates and Steam's delivery; they keep every GPL right to the source.
- Obligations per released binary: `LICENSE`, `NOTICE` (with the BSE addition), Electron's licence files, and **corresponding source**: a `SOURCE.md` in the package naming the exact git tag and commit, plus the public repository and a source archive attached to the matching GitHub Release. `shells/electron/out/build-identity.json` (from P03) is the seed for `SOURCE.md`.
- Content survey: answer "pre-generated AI content: artwork/icons (Gemini)"; the app itself generates nothing with AI at runtime; code assistance is not surveyed content.
- No Steamworks runtime, no Steam DRM wrapper, until the SDK licence question is resolved on its own (M7 candidate: Steam Cloud).

## 4. Apple route (this is the one that needs a decision)

- Apple's Developer Program License Agreement requires any developer EULA to meet Apple's minimum terms (a non-transferable licence limited by Apple's usage rules). GPLv3 §10 forbids imposing further restrictions on recipients' rights and §12 says you may not convey the work if other obligations prevent GPL compliance. That is the tension; the FSF's 2010 GNU Go removal is the precedent for what happens when nobody addresses it.
- Because Josh is the sole copyright holder of #1, #2, #12 and #14, and every other shipped part (#3–#9, #15) is MIT/OFL/CC BY and compatible with store terms, the clean route is **dual licensing**: the public repository stays GPL-3.0-only, and Josh grants a separate "official store distribution" licence for the App Store build. Nobody else has to agree. The GPL copies already released stay GPL forever.
- What counsel should confirm before M6: the wording of that store licence; whether any AI-authorship limitation affects Josh's ability to grant it (it should not affect distribution); that the OFL fonts and CC BY data are fine inside a proprietary-terms binary (they are, with notices); the ChronusQ credit wording.
- Not needed before TestFlight internal testing (no public distribution).

## 5. Open items (Josh)

1. Confirm no other person contributed code, text or assets (friends, forum snippets, Codex sessions on someone else's account).
2. Confirm the videos carry no third-party audio.
3. Confirm the Gemini icon provenance and that no stock imagery was used.
4. Choose the publishing identity for both stores (personal name vs a Magic Commons entity; an entity needs a D-U-N-S number for Apple and its own tax/banking details for Valve) before creating either app record; changing the seller name later is painful.
5. Decide whether the ChronusQ credit line is reworded (no licence effect either way).

## 6. Actions this file generates for the repo

- `NOTICE`: add entry 4, Basis Set Exchange data, CC BY 4.0, with the citation and the two API URLs from `lab/vendor/bse/index.json` (a `lab/` change → `node tests/pwa.test.mjs --write`).
- M3 packaging: include `LICENSE`, `NOTICE`, Electron's licence files and `SOURCE.md`.
- M6: the store licence text, after counsel.
