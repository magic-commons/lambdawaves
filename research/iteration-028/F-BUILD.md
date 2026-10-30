# ITERATION 028 · CHAIN F — THE WORDS THAT SHIP · BUILD

Builder: Opus 5.5 (Claude Yan's fleet), 2026-10-30, on its own branch fast-forwarded to `yan-c` @ bff04ad5 (E · A · B · C · D merged). One
commit per row; the integrator merges. No tag. Label renames only: no saved key, window id, target id, CSS hook or format byte moved;
`lab/mir/**` untouched; the `app` literal untouched. The row ids are REVIEW.md's (R-15 SECURITY, R-16 NOTICE; the brief had the two swapped).

The integrator's defaults bound this chain: CALL 1 → (C), CALL 4 → (a) with no 0.9.10 tag, CALL 5 → Josh's (written as PROPOSED).

## ROWS CLOSED

| row | commit | what changed |
|---|---|---|
| R-15 | dd5557e4 | SECURITY.md names every request after load (the 30-min build check, the records / volume / pictures / demos / NIST lines you open, an imported notebook's images, ASK off in this build) and every store (localStorage, Cache Storage `lw-lab-<build>` · `lw-data-v1` · `lw-vol-*`, IndexedDB `mir-assets`, exported files), Web MIDI's launch road; README § Privacy mirrors it |
| R-16 | f15966cf | NOTICE §8 the notebook faces (unmodified Google Fonts files, OFL, the three copyright lines), §9 the BSE records, §10 NIST ASD, §7 → `glyph.js` alone; ABOUT (index.html) names the notebook faces and credits the BSE; pwa --write |
| R-17 | 4b81c6eb | README: 140 states / n ≤ 7 in the five places, line 44 says n ≤ 6 then n ≤ 7, the 91-label timing said as measured before n = 7 (not re-measured); CITATION.cff 0.9.9-alpha · 2026-10-25, abstract 140 / n ≤ 7; README's notice list follows NOTICE |
| R-28 | 19c42348 | manifest `name` and `og:title` → "λWAVES · Magic Commons"; Electron `package.mjs` stamps BUILD_LINE's version (`appVersion`), its package.json version 0.0.0 "not a seat"; THE KIT SENTENCE one law (CLAUDE.md:6 and :14, NOTES-FOR-AGENTS); pwa --write |
| R-29 (matrix half) | a0d79217 | ACCEPTANCE-MATRIX: the TWA row's keystore NONE and what to do; a 028 block with the Electron 44.10.0 smoke row and the stores program's M0 state |
| R-19 | 003578f4 | the one definition of 1.0 (PLAN 028, CALL 1 → C) in RELEASING, release-1.0.0/BUILD-PLAN and a 2026-10-30 status atop SHIPPING-READINESS; DEPLOY points at it; E's and D's lines |
| R-20 | 1298fd21 | LEGAL-PROVENANCE updated from the tree (authorship, kit, vendor, data rows; §5a PROPOSED; §6 done); store/apple/CHECKLIST.md:37; README's AI disclosure names the agent identity |
| FOR-MIR | 450d8e15 | docs/FOR-MIR.md § 028 (2026-10-30): REVIEW §4's five lines, B's and C's verbatim |
| R-18 | ccf63f3e | REPORT.md waves 225–236 = iterations 017–028; `tools/changelog.mjs` UNRELEASED lists waves only; CHANGELOG.md regenerated; `--check` green on the committed tree |

### Four things that differ from the brief, and why

1. **The BSE licence is not CC BY 4.0 as far as anyone can read.** REVIEW R-16 and LEGAL row 9 said CC BY 4.0. Read 2026-10-30: the BSE site
   states no licence (only the citation it asks for); the repository (MolSSI-BSE/basis_set_exchange) is BSD 3-Clause, Copyright 2020 MolSSI ·
   Virginia Tech, and names no separate data licence. NOTICE §9 and LEGAL row 9 say that, with the citation. If Josh or counsel finds a data
   licence elsewhere, §9 is the one place to change.
2. **lab/mir-gui.js needed no edit.** The kit's GUI ABOUT (`lab/mir/shell/gui.js`) already names Spectral, Playfair Display and Alegreya SC;
   `createGui` gives the app no `type` seat. The ABOUT that named three faces is λWAVES' own static one in `lab/index.html`, so the faces went
   there. The `kitType` ask (createApp apps) is a FOR-MIR line.
3. **The manifest name is "λWAVES · Magic Commons", not "λWAVES".** REVIEW R-28 proposed name "λWAVES" and og:title "λWAVES · Magic Commons",
   but pwa's A2 law holds og:title equal to the manifest name, character for character (ANTI-PATTERN 6). Both now equal the `<title>`.
4. **`tools/changelog.mjs` changed (E's file).** The UNRELEASED section listed every commit since the newest tag, so a committed CHANGELOG.md
   was stale by the commit that carried it, and RELEASING's tag-then-commit recipe left it one commit behind: `--check` could pass only in a
   dirty tree, and verify.yml's step would be red on every push. Now UNRELEASED lists its waves (and exists only when there are some); a tag
   still lists its commits. The judge is E's, unchanged: in step, CITATION.cff = BUILD_LINE, newest `## \`tag\`` heading = newest tag. Green on
   the committed tree after ccf63f3e (checked).

## EVERY DOCUMENT, BEFORE → AFTER

- `SECURITY.md`: "no network calls after the page loads" → four named request roads, the microphone, MIDI, and the four stores.
- `README.md`: 91 / n ≤ 6 → 140 / n ≤ 7; § Privacy "Nothing you do is sent anywhere … localStorage" → what is fetched, where kept, the notebook image road; the AI disclosure names the five agent-identity commits; the notice list names what NOTICE carries; REPORT.md's row says one wave line per iteration since 017.
- `NOTICE`: seven entries (§7 naming three files of which two do not exist) → ten (§7 glyph.js; §8 notebook faces; §9 BSE; §10 NIST).
- `lab/index.html`: ABOUT's Type line names three faces → six; a BSE credit line; og:title "λWAVES — QWAVE-0 Hydrogen Shadow Lab" → "λWAVES · Magic Commons".
- `lab/manifest.webmanifest`: name "λWAVES — QWAVE-0 Hydrogen Shadow Lab" → "λWAVES · Magic Commons".
- `CITATION.cff`: 0.9.0-alpha · 2026-10-16 · 91 / n ≤ 6 → 0.9.9-alpha · 2026-10-25 · 140 / n ≤ 7.
- `tools/platform/electron/package.json` + lock: 0.2.3-alpha.3 → 0.0.0 (not a seat); `package.mjs`: the binary takes BUILD_LINE's version.
- `CLAUDE.md`: line 6 "THE KIT IS 1.5.5 …" and :14 "The kit reads 1.5.6-alpha.17" (two numbers) → line 6 adds "The doors stand at 1.5.6-alpha.17 (MIR-MANIFEST.json is the number)", :14 "the base is 1.5.5, the doors 1.5.6-alpha.1…17".
- `docs/NOTES-FOR-AGENTS.md`: "MIR 1.5.5" → "MIR 1.5.5 plus the doors 1.5.6-alpha.1…17"; "REPORT.md (the notebook every session appends to)" → the notebook to 0.5.2 + one wave line per iteration.
- `docs/ACCEPTANCE-MATRIX.md`: keystore "exists only in the worktree-hosts-m0 worktree" → NONE on this machine, what to do; + 028 block (Electron 44.10.0 17/17; M0 said plainly).
- `docs/SHIPPING-READINESS.md`: newest status 2026-10-16 (109/37 suites) → 2026-10-30 (1.0's definition, 116/41, LOCK, Wrangler 4.156.0, npm audit 0/0, origin/main 28fe4457); "Wrangler 4.129.0 … sharp overridden" and "no remote" corrected in place.
- `RELEASING.md`: 1.0 = device matrix + PWA update + screen reader → PLAN 028's definition, those three shipped WITH as UNVERIFIED; recipe + `npm audit` both packages, CITATION beside BUILD_LINE, `changelog --check`; header dated 10-30; REPORT.md sentence.
- `research/release-1.0.0/BUILD-PLAN.md`: defined 1.0 → a 10-30 block: the definition is PLAN 028's, this plan is what 1.0 ships with; BUILD_LINE's seat and the generated CHANGELOG corrected.
- `DEPLOY.md`: status "2026-09-10" → points at the 10-30 block; "Measured against wrangler 4.129.0" said as September's; V2 table + the conductor and the EMPTY_BASE row.
- `LEGAL-PROVENANCE.md`: "Joshua Hosain only (117 commits)" → two identities + five agent-identity commits (2,119 commits, 1,910 trailers at 003578f4); kit 1.4.3 → 1.5.6-alpha.17; KaTeX/marked "two copies" → one each; BSE "CC BY 4.0" → as found; + rows 9a info faces, 9b NIST; row 12 current files; row 17 the notebook image road; §5a PROPOSED; §6 done.
- `store/apple/CHECKLIST.md:37`: "sole copyright holder" → "the only human author (… five commits … agent identity); counsel confirms".
- `docs/FOR-MIR.md`: + § 028 with five lines.
- `REPORT.md`: ends at wave 224 → + "THE ITERATIONS, ONE WAVE LINE EACH" with waves 225–236.
- `CHANGELOG.md`: stopped at v0.9.4-alpha, `--check` red → regenerated: UNRELEASED waves 225–236 above `v0.9.9-alpha`; `--check` green.

## THE LEGAL §5 PROPOSALS (for the FOR-JOSH note of the cut)

All in LEGAL-PROVENANCE §5a, marked PROPOSED (Josh confirms):
1. Contributors — no other person; five commits under `Claude <noreply@anthropic.com>` from his own merged session (PR #1, #2); the
   `Co-Authored-By:` trailers (1,910 at 003578f4) name tools, not rights holders. To check first: any Codex or Gemini session on an account not his.
   (The brief's `grep -c Co-Authored-By` counts trailers, 1,910, not the five authored commits; both numbers are in the text.)
2. The videos' audio — the app's own sound or none; Josh names AUDIO.mkv's source; until then no recording with sound in a trailer.
3. The icons — Gemini under Josh's direction, finished by agents; the wordmark outlined from NOTICE's OFL faces; the Picker pictures renders of the app; no stock imagery.
4. The publishing identity — blank for Josh (personal or a Magic Commons entity with D-U-N-S); decide before either app record exists.
5. ChronusQ — keep the thanks line, README's sentence beside it as the accurate statement.

## LEFT, AND WHY

- **README:7 "λWAVES · QWAVE-0 · Hydrogen Shadow Lab"** kept: a subtitle, not a seat REVIEW names.
- **The 140-label reconstruction time** is not re-measured (README says so).
- **R-29's packaged run** (SOURCE.md / COPYING / NOTICE / appVersion in a built package): `node_modules` is absent in this worktree's
  `tools/platform/electron`; proved by `node --check` and reading. The deploy build `package.mjs` starts with passes on this tree.
- **CALL 5's answers** are Josh's; **the broker pid 1055617** is Josh's (E's note).

## THE GATES

- `node tests/pwa.test.mjs --write` after each lab/ commit (R-16, R-28): green (419 files precached; A2's og:title = manifest name, the ABOUT
  tagline = the description; the 14 info faces as SOURCE.txt records them).
- `./test.sh node` on the tree at ccf63f3e: **EXIT 0** (116 suites, pwa last; `state-scopes --check` 32 rows; `hints-census --check`;
  provenance with `pyscf-table --check`).
- `node tools/changelog.mjs --check` on the committed tree: **green** — "CHANGELOG.md is up to date; CITATION.cff and BUILD_LINE say
  0.9.9-alpha; the newest heading is v0.9.9-alpha." (12 unreleased waves, 225–236; the wave-number gaps 70–106, 149–154, 175–177, 183–187
  are history's and were warnings before.) It stays green across later commits now, this note's included.
- `node tools/build-deploy.mjs --quiet`: rc 0, §V1–§V6 pass (the ABOUT face's `./NOTICE` resolves to the shipped /NOTICE).
- Browser, own gate server on 9847 (GD 5847), pid recorded and stopped: `official-defaults-palette` GREEN (3 of 3), `start` GREEN (3 of 3
  scenes). No flake, no re-run.
- Not run, by the brief: rack-deps and the cycle count (no module or import moved), THE LOCK (nothing that draws changed), adopt --check
  (lab/mir untouched).
