# Iteration 005 · A — THE ROOM (build note)

Branch `it005-room` from `679dd7e` (yan-c, "Iteration 005 THE PHYSICS: the plan"). Builder: Claude Opus 5.5. No push, no tag, no new test file.

## The seats
| row | file | what |
|---|---|---|
| 1 | `lab/sw.js` §1b | `DATA` gains `img/menu/` and `demos/covers/` (the rule, not the files); the §1b prose and the NEVER_PRECACHE row name them. `pwa --write` drops 153 entries from §1 (142 menu files incl. `manifest.json`, which the lab never reads, and 11 covers). |
| 1 | `lab/library.js` | `keepData(url, res?)` — the ONE helper: opens `lw-data-v1`, returns at once when the device holds the URL, else stores the answer (`res`, a clone the caller holds, or a fetch) when it is `ok`. true when the device holds it afterwards. |
| 1 | `lab/picker.js` `pic()` | an `img/menu/` picture calls `keepData(src)` once on `load` (a volume's own picture, `pic(t, null)`, is untouched). An offline tile whose picture is not held keeps the existing error road: the `<img>` is removed and the tile's letters stand. |
| 1 | `lab/projects.js` `coverOf` | the cover's fetch answer is handed to `keepData(url, r.clone())`; nothing else in FOLDERS changes. |
| 2 | `lab/volumes.js` `install` | after the molecules (and not after a cancel or a full device), the ladder's basis records the volume's `bases` names among STO-6G · 3-21G · 6-31G · 6-31G* go through `keepData` (names from `rhf-molecule.js` `BASIS_FILES`); one that cannot be kept is a `failed` row ("press again to resume"). `remove` leaves them. |
| — | `tests/pwa.test.mjs` | the two string pins on the DATA list and its NEVER_PRECACHE label follow the new members (an edit of an existing gate, not a new one). |

The `app` literal gains no key; no window moves; `tools/menu-thumbs.mjs` and `tools/make-covers.mjs` write where they wrote.

## Numbers
- lab lines: **31,474 → 31,503 (+29)**.
- precache: **8,378,359 B (548 files, 8.00 MiB, 10,249 B under the ceiling) → 7,646,952 B (395 files, 7.30 MiB, 741,656 B = 0.71 MiB under)**.
- `node tests/pwa.test.mjs --write` PASS · `./test.sh node` exit 0 · `node tools/rack-deps.mjs --classes --no-write` exit 0 · `node tools/new-project.mjs --check` in step (16117 B) · `node tools/build-deploy.mjs --quiet`: dist/ holds `img/menu/` (142) and `demos/covers/` (11); dist/ deleted after.

## What the brief got wrong, and how I decided
1. **The sizes were disk blocks.** 720 KB and 216 KB are `du -h`; the bytes are 541,796 + 191,812 = 733,608 B (716 KiB). The precache lands at **7.30 MiB, not "well under 7.2"**, and the headroom is 0.71 MiB, not ≈ 0.9. I kept row 3's "nothing else" and moved nothing more; the next candidate, if one is wanted, is the brief's call.
2. **The base headroom was 10,249 B, not 3.3 kB** (measured on 679dd7e's own §1).
3. **`build-deploy --quiet` reports one problem, and it is the base's**: `V2: dist/volumes.js → ./volumes/ (no shipped file under dist/volumes/)`. The same line prints on a detached worktree of 679dd7e (checked, then removed) — the volumes ship on their own road; not this row's.
4. **FOLDERS' covers are already device-held as thumbnails.** `coverOf` turns a cover into a data-URL thumb stored with the starter in the project store at seeding, so FOLDERS shows the demos offline regardless; the cover fetch happens at seeding, a `·cover` refresh or RESTORE THE DEMOS. Keeping the answer in `lw-data-v1` makes those offline-safe, which is what the row needs.
5. **"The four files" read as the volume's own rungs**: `install` keeps the ones among the four that the shelf entry's `bases` names (all four for VOL. I; all four when an entry has no `bases`).
6. A Picker picture is kept when it LOADS, and the decks load lazily — so the device holds what has been seen (93 of 142 after one Picker pass), and a tile never shown stays the placeholder offline. That is the brief's own "not yet held" clause.

## The light check (one Firefox pass on 9601 / 5701, `?sw=1&menu=1`, a fresh profile, the dev link present, a scratch script never committed)
```
lw-data-v1 at boot (fresh profile) {"total":83,"menu":72,"covers":11,"bases":[]}
sw "activated"
PASS 1 picker {"tiles":182,"imgs":173,"shown":157,"placeholders":9,"controlled":false}
PASS 1 lw-data-v1 after the picker + the demos seeded {"total":104,"menu":93,"covers":11,"bases":[]}
folders covers {"coverPictures":1,"named":["DEMOS11"]}
volume install {"ok":true,"n":31,"N":31,"why":"","failed":0}
lw-data-v1 after the install {"total":108,"menu":93,"covers":11,"bases":["sto-6g-v1.json","3-21g-v1.json","6-31g-v1.json","6-31g-star-v1.json"]}
— the gate server stopped (its own pid), the page reloaded —
PASS 2 ready (offline) {"ok":1,"i":3}
PASS 2 picker opened by the home button {"was":false,"now":true}
PASS 2 picker (offline) {"tiles":182,"imgs":173,"shown":157,"placeholders":9,"controlled":true}
PASS 2 lw-data-v1 (offline) {"total":108,"menu":93,"covers":11,...}
PASS 2 a basis record offline {"ok":true,"bytes":200579}
PASS 2 a volume rung offline {"ok":true, ... "op":"chem.open","energy":-76.01050499531253, ... "nAO":19 (water 6-31G*)}
errors: ResizeObserver loop notifications only
```
The 9 placeholders are the same online and offline: the 7s (Fr, Ra), 7p (Nh–Og) and Lr tiles, whose `orb-7s` / `orb-7p` pictures `tools/menu-thumbs.mjs` has never made (base behaviour). The FOLDERS line counts the top level, where the eleven demos sit behind the one DEMOS folder card; the folder was not opened in the pass.

## Left undone
Nothing in the row. The precache figure misses the brief's 7.2 MiB line by 0.1 MiB for the reason in (1).
