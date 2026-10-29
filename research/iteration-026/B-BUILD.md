# 026 CHAIN B — THE DEMOS · BUILD (Opus builder, 2026-10-29)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-abbae3b11b551f495`, branch `it026-B` from `a4fbe28d`. Calls at their defaults (call 7: after WAVE DANCER PROTOTYPE; A-BUILD blocker 1: demos/ becomes DATA). No kit door (1.5.6-alpha.17).

## B1 ALONGSIDE WAVE DANCER
- `lab/demos/{star-loop,benzene-pi,water-esp}.lambdawaves.json` from `research/iteration-026/projects/`, `path` DEMOS/<NAME>, `folder` DEMOS, one fresh `saved`/`opened` stamp. STARTERS (`lab/project-store.js`) after WAVE DANCER PROTOTYPE: STAR LOOP · BENZENE π · WATER ESP.
- **The data is NOT quite byte-for-byte; two standing laws won.** `presentation.quality` and `presentation.camera` (`{autoRotate:false}`) are removed: `tests/first-run.test.mjs` A BUNDLED DEMO CARRIES NO LOOK (W129) and THE WIRING (`demosCarryNoQuality`). The notebook (outside `data`) is now page 0 with a heading and one line on what the demo is (`project-formats` R10 c: every bundled demo has a page 0); the conductor left it blank. Everything else in `data` is the conducted bytes.
- Covers: `tools/make-covers.mjs star-loop benzene-pi water-esp` on gate 9693 / gd 5693 → 540×960 JPEG like wave-dancer's (25 / 20 / 22 KB).
- THE PRECACHE CEILING: `demos/` is a DATA root in `lab/sw.js` (it replaces `demos/covers/`, which it now holds); the §1b prose and NEVER_PRECACHE row say so; `tests/pwa.test.mjs`' DATA assertion and its rule text re-aimed; `--write` dropped the WAVE DANCER entry: **419 files, 7.96 MiB** (was 420 / 7.99).
- **Deviation from "cached on use like their covers": the demo JSONs are NOT kept in lw-data-v1.** The worker answers a DATA path from the device first, so a kept demo file would freeze its `saved` stamp, and with it the DEMOS refresh law (`starterOf` revision) for that browser forever. They are deployed, never precached, fetched from the network each boot by `seed()`.
- **What it means offline:** the boot's `seed()` stores each demo whole in FOLDERS' DEMOS (localStorage) the first time the browser boots online; from then on a DEMOS press opens that stored copy with no network, and the covers are kept as before. A browser that has never booted online (or cleared its store) needs the network once: an offline DEMOS press there says "demo failed: …". RESTORE THE DEMOS needs the network.
- Catalogue: `tools/catalogue-table.mjs` HAND.demos gains the three (STAR LOOP → hydrogen's row, BENZENE π → C6H6, WATER ESP → H2O; `since` **1.0.0** — the next release's number is a guess, see Q1); `lab/catalogue.js` and `docs/PROVENANCE.md` regenerated.
- Tests re-aimed (no law deleted): `molecule-demos` §1 four starters in order with covers, `.seeded` four ids; §2/§3 the older store gains the three new starters (seeded after the eleven old ids); new §4 STAR LOOP opens from DEMOS with 27 lanes, 41 clips, no error. `project-formats` R10 c's line names the four.
- Shot: `research/iteration-026/B-shots/b1-demos-four.jpg` (FOLDERS › DEMOS, the four covers, "4 PROJECTS").

## B2 (docs)
- `docs/laws/scopes-and-records.md` (FOLDERS IS THE PROJECTS HOME): one sentence — the three 026 demos, `demos/` a DATA root. Shell.md and film.md do not describe the DEMOS (shell.md only says FOLDERS opens on them), so the sentence went where they are described. README untouched.

## Tests
`node tests/pwa.test.mjs` PASS · `project-formats` GREEN · `new-project` GREEN · `first-run` GREEN 13/13 · `catalogue` PASS · `molecule-demos.browser-test` GREEN (9693/5693) · `./test.sh node` **EXIT 0** · rack-deps HOLDS (persist 24). THE LOCK not run (no frame path touched).

## Findings / open questions
1. `since: '1.0.0'` for the three catalogue rows is a guess at the next release (the last tag is v0.9.9-alpha). Re-aim in HAND.demos if the release is named otherwise.
2. **BENZENE π and WATER ESP turn dirty about 1–3 s after their open** (STAR LOOP and WAVE DANCER stay clean): the armed timeline writes its first values over what the conductor saved (WATER ESP: `mat.view` 0 → 2 and a `states` lane; BENZENE π: `orbitals.selection` gains k 20). The next DEMOS press asks OPEN WITHOUT SAVING? about a read-only demo. Conductor fix (chain A's road): `tools/conduct-score.js` should save after the arrangement's first apply. Re-conducting and re-copying the two files is then all B needs. Not patched here (the data stays as conducted).
3. A headless navigation within ~1 s of the STAR LOOP open stalls the next page's rAF (WebGPU pipelines still building; 6 s later it is fine). §4 of molecule-demos therefore runs last. I did not see it outside the gate's Firefox.
4. STAR LOOP's open status reads "opened demo DEMOS/STAR LOOP"; no missing-file line appears (keys.js installs the timeline with `audio: false` and the project has no asset manifest, A-BUILD #2), so the envelopes drive with nothing to say.

## The CLAUDE.md sentence to add
THE DEMOS (026): STARTERS are WAVE DANCER PROTOTYPE, STAR LOOP, BENZENE π, WATER ESP; `lab/demos/` is a sw.js DATA root (never precached, never kept by the worker; FOLDERS' seed stores each demo once per browser), covers by `tools/make-covers.mjs`.
