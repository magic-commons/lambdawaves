# Scopes, records, projects and links

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 021

ONE STORE (021 R4): every stored key is a row of `lab/settings-store.js` RECORDS `{ key, scope, version, forget, owner }`; STATE-SCOPES' records table is generated (`node tools/state-scopes.mjs`, `--check` in the node gate), never hand-written; FORGET wipes the `forget` rows after `onForget` cancels, and `presets`, `palettes`, `curvePresets`, `nodePresets` are `forget: false` (the reader's work, R6); `saveSettings` writes `{ ...S0, ...owned }` minus RETIRED — never a carry list; the notebook lives only in the project part.

THE ROLLBACK ROAD (021 R1): `openLink`, quick LOAD and the resume all go through `openPayload(…, rollback = true)` (FOLDERS' road); a resume that fails never arms autosave and keeps its record (kit 1.5.6-alpha.1).

## The standing paragraphs

FOLDERS IS THE PROJECTS HOME (iteration 004, BASINS-shaped, `lab/projects.js`): THE ONE DEMO (iteration 009, Josh 10-19) is WAVE DANCER PROTOTYPE
(`lab/project-store.js` STARTERS: file id `wave-dancer`, seedId `demos/wave-dancer`, re-saved at KNEE 3 by the app's own road; the ten others
— WATER · BENZENE · N₂ · H₂ σu · HELIUM · CHORD · BUCKY · BREAK · TUNNEL · LDA — deleted with their covers, their files kept as
`tests/fixtures/retired-demos/`; Josh's new demos will be made on the timeline and the molecules). A reader's entry seeded from WAVE DANCER is
refreshed AND renamed in place (`seed()` renames a seeded entry once it carries its starter's revision — the kit's refresh keeps a name); an entry
seeded from a deleted demo stays the reader's, opens from their store (the DEMOS press finds it by seedId) and is never re-seeded
(`tests/molecule-demos.browser-test.mjs`, re-aimed). ITERATION 026 adds three conducted demos after it — STAR LOOP, BENZENE π, WATER ESP
(`docs/conductor/`) — and `demos/` is a sw.js DATA root (never precached; the boot's seed stores each demo in FOLDERS once per browser). The DEMOS wear their covers (a 4:3 middle of
`lab/demos/covers`, refreshed in place once by the starters' `·cover` revision; only a starter being added or refreshed fetches one),
folder cards the kit's `folder` glyph, RESTORE THE DEMOS in the foot, the toolbar SAVE · PROJECT · DUPLICATE · NEW, ⓘ the RENDER card's
SUBJECT, a save also its modulation preset in CAPS (a rack with routes). Its doors: O, WINDOW › FOLDERS, the notebook's ▤, FILE (NEW,
OPEN, the recent rows ask FOLDERS' own "Save this first?"), and the FOLDERS rack card (`projects`, the kit's mountGallery, 8 a page,
closed at the top of the LEFT rack, built at its first open); each puts the front page away first (the port's `cover`). RENDER carries
FOLDERS' FILES (SAVE AS ZIP… · OPEN ZIP…); MIR OPTIONS › SAMPLING reaches the modulation host (AUTOMATION) and the TIMELINE (SCRUB); the
modulation window is in the kit's one window stack (`registerWindow`).

Every stored key lives in exactly one of three scopes (`docs/STATE-SCOPES.md`,
0.3.1): PREFERENCE (the reader's furniture: theme, glass, hints, keys, the
quality budget, camera feel and mode, frame and axes; never written into a
project, a link or a history row, never changed by opening one), WORKSPACE
(the window arrangement; travels with a project and the device remembers it,
last one wins) and PROJECT (the work; the whole of the undo history except the
camera pose, the notebook text and the quality hint). A project open must
leave `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys.
PROJECTS are MIR's FOLDERS over ONE project part (lab/projects.js,
lab/project-store.js): `lambdawaves` = { data: projectSnapshot(), notebook } —
the notebook is the project's page 0 — signed by projectKey();
serialize({ scope: 'edit' }) bytes never move (tools/serialize-bytes.mjs); the full
bytes gain one WORKSPACE layout row per new card (RENDER at C7b, CURVES at 0.5.1, INFORMATIONAL at 0.5.3 M9).
`lambdawaves.q0.projects` keeps λWAVES' { items, recent } through a byte-exact
translator; an invalid collection is read-only, 8 MiB a project, 24 MiB the
library (tests/project-formats.*). `__LW.projects` keeps every old verb
(`demo(file)` is a DEMOS press, `status` the last line). NEW opens the hidden
empty project lab/new-project.lambdawaves.json through the same
restore-with-rollback road; tools/new-project.mjs writes it and --check proves
it. NEW's modulation is one LFO bound to MACRO 1 (`m1.sourceId = s1`, the LFO's OUT chip 1) and one AUDIO
device (MACRO 2 on its LEVEL), no routes, no clips, RATE 4; a pick (Picker, library, volume, a HISTORY row, the 140 table) never touches the
modulation, the timeline or the macros (checked in Firefox, 018 D1). The undo ring reads serialize({ scope: 'edit' }) and writes restore(S, {
history: true }); no hand-kept key list beside it. (0.5.0 C6)
An open never closes the notebook; it opens it only for non-blank text. Run
`tests/history.browser-test.mjs`, `tests/new-project.browser-test.mjs` and
`node tests/new-project.test.mjs` when touching any of this.

`lw:` LINKS (0.5.1 D8, R6-K): in the notebook's VIEW a link `lw:key=value[&…]` runs a WHITELIST of hand verbs — `preset` (STATE's
PRESET), `molecule` (the MOLECULE dropdown's pick, and MOLECULES on; its head is the fade), `view` (the V key's observable), `orbital`
(the ORBITAL dial by name or number, VIEW orbital) — one history row (`LINK · <text>`) and one fade a press, the ring never cleared; any
other key is ignored and said on the notebook's foot, and a whole state (`lw:s=`) is never a verb. A capture-phase click on `.nb-view`
stops the sanitiser's `target=_blank`; nothing on the stage takes a link (D8′, Group II). Run `tests/lw-links.browser-test.mjs`.

Every read and write of `lambdawaves.q0.settings` goes through
`lab/settings-store.js` (`createSettingsStore`; `WORKSPACE` and `FAMILIES` are
its scope tables, and `tools/settings-probe.mjs` is their gate). The camera's
port is `createCameraLaw(...).port`, the object MIR's CAMERA panel takes. The
stage's bindings are `STAGE_BINDINGS` in `lab/stage-gestures.js`; a binding
change is a row edit there. (0.5.0 A1/A8)

A DEMO OPENS CLEAN (027 D1): FOLDERS takes its clean mark at the restore, before the chem worker answers; a solve's derived fill (`derived` in lab/windows/molecules.js: the orbital, the register's selection, the STATES ladder's parked lane record, the first potential's view) joins the history row AND re-takes the clean mark it stood on, so a project clean when its solve lands is clean after it. No key list. `tests/molecule-demos.browser-test.mjs` says "opens CLEAN" for every bundled demo.
