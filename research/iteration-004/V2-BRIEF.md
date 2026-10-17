# Iteration 004 · V2 — A VOLUME'S MOLECULE ON THE STAGE (brief)

Branch `it004-v2` from the BASE named in the launch message (yan-c after V1 THE VOLUME ENGINE and CAT THE CATALOGUE merged). Gate
server `LW_PORT=9591 GD_PORT=5691`. No push, no deploy. Never edit `lab/mir/**` or `lab/fonts/**`. Josh's dial: build the feature, no
new test files, one light visual check; existing gates only. Read first: `PLAN.md` (THE VOLUME FORMAT v1), `V1-BUILD.md` (what the
engine landed and where it corrected the plan), `lab/volumes.js` (the store: `shelf · index · statusOf · install · remove · file ·
picture`), `lab/volumes-format.js` (`parseLwm · rungs · rungRecord`), `lab/picker.js` (LIBRARY: a molecule press already calls
`app.state.chem.openVolume(v.id, m.id)` when it exists — grep `openVolume`; today it pops "this build cannot open a volume's molecule
yet"), `lab/chemview.js` THE RECORD ROAD (grep `viaRecord`: `{ op: 'chem.open', lib: record, hash, basis }` under the `seq` law) and its
`save()` / `load()` (`o.library`), `docs/STATE-SCOPES.md` rows 73–76, `lab/shell/notebook.js` the `lw:` whitelist (grep `lw:`).

The data: `lab/volumes` is a git-ignored dev link to `~/Documents/LAMBDAWAVES-VOLUMES/dist` — make it in your worktree
(`ln -s ~/Documents/LAMBDAWAVES-VOLUMES/dist lab/volumes`). `dist/vol-1` holds THE PILOT (30 molecules, every rung; `index.json`,
`volumes.json`, `m/<id>.lwm`). From your launch you own `dist/vol-1` (pack `--incremental`, the thumbnails); never touch `raw/` or
run `solve.py` — the integrator's long solve owns `raw/` (`raw/solver.pid`). PubChem is rate-blocked for this machine: no fetch.

## The rows (all in `lab/chemview.js` unless said; keep every seat where it is)

1. **`openVolume(volId, molId, basis?)`** on chemview's api (the Picker calls it; also `__LW.chem.openVolume`): `V.file(volId, molId)`
   → `parseLwm` → `rungRecord(lwm, basis)` (the lowest rung when none is asked, else the asked one, else the lowest and a status line)
   → THE RECORD ROAD's `chem.open` message with the record's own `ground.hash` as `hash`, under the same `seq` / `call` discipline, MOLECULES
   ON, the head (the record's `stem`) and STATUS as a library record gets them, one history row as a hand pick. The molecule control
   shows the volume molecule by name with its volume (`ASPIRIN · VOL. I` — the stepper's name; the `<select>` gains one disabled-free
   option in an optgroup named for the volume, removed when a catalogue molecule is picked). A volume molecule is not in
   `PRESET_BY_ID`: give it its own small presence (`volRef = { volume, id, lwm, meta }`) rather than a fake preset; `chemAtoms`,
   `chemCharge`, `query()`, `record()` and the caption read it. KICK / RUN / TDA / VIBRATE / LDA stand down for it (one sentence each
   where they would run: "a volume molecule is its record; the live roads are the catalogue's").
2. **The BASIS seg is the ladder.** The seg's options become the six of `BASIS_LABEL` in ladder order. For a volume molecule a press
   opens that rung (`rungRecord`, no solve); a rung the file lacks (Sc–Zn's 6-31G*, K–Kr's 6-31+G*) is disabled with the header's
   `skipped` / `failed` reason as its title. For a CATALOGUE molecule the live law is unchanged (STO-3G, 6-31+G* under the cap); its
   four other rungs are offered only when an INSTALLED volume holds a molecule of the same id (`V.statusOf` + the index) — then they open
   from that volume's record; otherwise disabled with the title "in a volume" (not "unknown"). The live-cap law and `basis631` stay.
3. **PROJECT.** `instruments.chem.volume = { volume, id, basis, sha256 }` (the `.lwm`'s sha-256 from the index) written ONLY while a
   volume molecule is on screen; `load()` re-opens it from the installed volume, or — not installed — leaves the catalogue molecule and
   says "ASPIRIN · VOL. I is not on this device — install it in the PICKER's LIBRARY" (MOLECULES' status), no solve. `o.library` is not
   written for a volume molecule. One row in `docs/STATE-SCOPES.md`. `node tools/new-project.mjs --check` and
   `node tools/serialize-bytes.mjs` stay in step (absent at the default).
4. **`lw:` link:** one more whitelist key — `lw:volume=vol-1&id=aspirin[&basis=6-31g]` runs `openVolume` as a hand press (one row,
   one fade); an unknown volume or id is said on the notebook's foot like any other refused key.
5. **The pictures.** `tools/menu-thumbs.mjs --volume vol-1` renders each molecule of the volume at the molecules' HOME pose through
   `openVolume` on the gate page (the lowest rung; density, the look the tool already has) into `<dist>/vol-1/t/<id>.webp`; then
   `tools/volumes/pack.mjs --incremental` fills `index.json`'s `thumb` where the file exists (a small change: the packer reads `t/`).
   The Picker's tile already asks `V.picture`.
6. **pack.mjs:** an `app` candidate (the app's own molecule) takes the APP's `formula` / `formulaM` from `lab/molecules.js` (the pilot
   prints Hill "H₃N", "BrH"). Verify with `--out` into your tmp, then re-pack vol-1 `--incremental`.
7. **`tests/wiring.test.mjs`:** delete the `lab/volumes-format.js` ALLOWLIST entry — the store imports it now (the test says so itself).

## Checks (existing gates), then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 · `node tools/rack-deps.mjs --classes --no-write` 0 · `node tools/new-project.mjs
--check` · `node tools/serialize-bytes.mjs` · ONE browser pass on your gate server with the link in place: PICKER › LIBRARY › VOL. I
INSTALL, open ASPIRIN, step the BASIS seg STO-3G → 6-31+G* (DENSITY draws at every rung, the head names the rung and E), SAVE, NEW,
open the project (the volume molecule returns), `lw:volume=vol-1&id=aspirin` from the notebook. One or two screenshots ≤ 300 KB each
beside the note. Count `find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l` before and after and print both.

Write `research/iteration-004/V2-BUILD.md` (what landed with its seats, what the brief got wrong and how you decided, the light
check's lines, the delta), commit on `it004-v2` (`Co-Authored-By` your model), and report the tip sha, the files, the lab delta and
anything left — never push.
