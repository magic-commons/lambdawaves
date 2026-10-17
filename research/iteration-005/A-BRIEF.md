# Iteration 005 · A — THE ROOM (brief)

Branch `it005-room` from the BASE in the launch message. Gate server `LW_PORT=9601 GD_PORT=5701`. No push. Never edit `lab/mir/**` or
`lab/fonts/**`. Josh's dial: the feature, no new test files, existing gates, one light check. Read first: `PLAN.md` here; `lab/sw.js` §1b
(the DATA roots, line ≈ 599: `library/`, `volumes/`, the four ladder basis files — cache-first from `lw-data-v1`, else the network, "the worker
stores nothing there, and a new build's activate keeps it"); `lab/library.js` (`fetchRecord` + `persistOnce` — how the page stores a DATA
answer); `tests/pwa.test.mjs` (the precache walk, its skip rules and the 8 MiB ceiling at line ≈ 317); `lab/picker.js` `pic()` (lines ≈ 160–175,
`./img/menu/<id>.webp`); `lab/projects.js` ≈ 126 (`./demos/covers/<file>.jpg`); `lab/volumes.js` `install` (what it stores in `lw-vol-<id>`).

## The rows
1. **The pictures become DATA.** `lab/img/menu/` (720 KB, the Picker's thumbnails) and `lab/demos/covers/` (216 KB, the eleven demo covers) join
   `sw.js`' DATA roots and leave the precache: the pwa walk skips them by the same rule as `library/` (list the rule, not the files); the Picker's
   `pic()` and FOLDERS' cover fetch store a successful answer in `lw-data-v1` after the first fetch (the library's road — one small helper shared
   by both, not two copies), so an installed app has them offline from the second run; the first offline run shows the Picker's existing
   placeholder for a tile whose picture is not yet held, and nothing else changes. `tools/menu-thumbs.mjs` and the covers' refresh keep writing
   where they write. Print the precache before and after: it must read well under 7.2 MiB after.
2. **The ladder's basis files ride with a volume.** `V.install` (lab/volumes.js) stores the four files `vendor/bse/{sto-6g,3-21g,6-31g,6-31g-star}-v1.json`
   in `lw-data-v1` beside the volume when they are not yet there (they are DATA already — the worker serves them cache-first), so an installed
   volume opens OFFLINE at every rung. `V.remove` leaves them (another volume may need them; they are 675 KB).
3. **Nothing else.** The `app` literal gains no key; no window moves; the lab delta should be small (a few dozen lines).

## Checks, then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 · `node tools/rack-deps.mjs --classes --no-write` 0 · `node tools/new-project.mjs --check`
· `node tools/build-deploy.mjs --quiet` (dist/ built and deleted; the pictures must still be in dist/ — they ship with the site as DATA, like
`library/`). One browser pass on your gate server: the Picker shows its pictures; reload with the network throttled off in a second pass shows
them from the cache (print the `lw-data-v1` key count before and after); FOLDERS shows the covers; a volume install with the dev link
(`ln -s ~/Documents/LAMBDAWAVES-VOLUMES/dist lab/volumes` in your worktree) puts the four basis files in `lw-data-v1`. Count the lab lines
before and after (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`; base 31,474).

Write `research/iteration-005/A-BUILD.md` (seats, the precache before/after, what the brief got wrong, the light check's lines, the delta),
commit on `it005-room` with a `Co-Authored-By:` line for your model, report the tip sha — never push. The RTX is shared: another builder may
be running a CUDA solver on it while you test; run one browser suite at a time; stop only your own pids.
