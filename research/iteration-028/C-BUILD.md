# ITERATION 028 · CHAIN C — THE VOLUMES AND THE STORED COLLECTION · BUILD

Builder: Opus 5.5 (Claude Yan's fleet), 2026-10-30, on its own branch fast-forwarded to `yan-c` @ b225158f. One commit per row, each
with the test of its failure (each test was run against the old tree and went red); the integrator merges. No label moved: no stored key,
no format byte, no cache name (`lw-vol-<id>`, `lw-data-v1` and every cache key are as they were; the only addition is a response header).
No app-literal change, no module import added, nothing drawn differently (no LOCK run needed).

## ROWS CLOSED

| row | commit | what changed | its failure's test |
|---|---|---|---|
| R-07 | 8e258842 | `lab/volumes.js`: every put of a hashed file carries the sha it was checked against in an `x-lw-sha256` header (an .lwm by the catalogue's `sha256`, `index.json` by the shelf's `indexSha256`, every file of the .lwv road by its archive `sha256`). `keptShas(c)` reads url → header once; `isKept(shas, f)` is "present AND (no sha to hold OR the header equals it)". install(), installStatus(), kept() and the .lwv todo all read through it, so a file kept under an older edition's sha is NOT KEPT: install re-fetches it, the file road re-slices it (a stale `index.json` of equal length is replaced — the wedge is gone), and installMolecule() re-puts the catalogue and shelf entry when the kept catalogue is stale. Thumbnails have no hash in format v1 and stay presence-only on the fetch road | new `tests/volumes-store.test.mjs` (a fake Cache Storage + network): one row per road — installStatus partial 1/2 not installed; kept() = {b}; install re-fetches a's .lwm and only it; installFile replaces an equal-length stale index.json and .lwm, then installStatus reads installed. 7 assertions red on b225158f |
| R-21 | aa0e7cd2 | `lab/volumes.js` installMolecule(): each ladder basis `keepData()` that returns false goes into `failed`; `ok: !failed.length`, `why: 'a basis record could not be kept — press again online'` (chemview's status line already prints `was not kept: <why>`) | volumes-store.test: lw-data-v1 empty and the basis fetch answering 500 (keepData false) → ok false, failed = the basis rows, the why says so |
| R-24 app side | f55f3d2e | `lab/project-store.js` toFiles(): `thumb` forwarded only when it matches `/^data:image\//`; a URL or any other string reads `''` and the kit re-captures it | project-formats.test: an `https://…` thumb and a 4 KiB non-data string read `''`, a `data:image/jpeg` thumb stays |

## LEFT, AND WHY

- **A volume kept before this build reads as not kept once.** Entries put before the header have none, and a missing header is a sha that
  differs: a device that installed a volume before 028 sees it partial/absent until INSTALL (or OPEN FILE…) is pressed again, which re-fetches
  every hashed file once. Nothing is deployed, so only dev devices meet it; trusting header-less entries would have kept the very defect.
- **The cost of a status read.** installStatus/kept now `match` each key for its header (the .lwv road already did); on a 6,927-molecule volume
  that is ~14k cache matches per read. Not measured in a browser here (no volume fixture in the gate suites); if a lamp feels slow, the next
  step is to read the header only for the .lwm keys.
- **R-24's kit half** is the MIR session's (the kit is adopt.mjs' alone). The line for docs/FOR-MIR.md § FOR 1.5.6 (REVIEW §4 item 3):

  > **folders/files.js entryOk** (λWAVES 028 R-24): accept `thumb` only when it matches `/^data:image\//` — the test toThumb already applies
  > on the capture road — so a stored URL or an over-long string never reaches the gallery's `url(…)`. λWAVES carries the app-side test
  > (lab/project-store.js toFiles) until then.

  docs/FOR-MIR.md is not in this chain's files; the integrator (or CHAIN F) pastes the line.

## THE GATES

- `node tests/pwa.test.mjs --write && ./test.sh node`: RC 0 after R-07 and again on the final tree (pwa: 419 precached files, sw.js §1
  regenerated per commit).
- `node tests/volumes-store.test.mjs` PASS; `node tests/project-formats.test.mjs` GREEN 11 judged lines.
- Browser, own gate server on 9817 (GD 5817; pid started and stopped by pid), one browser at a time: `chem` 0 failing of 56 · `library` GREEN
  (install → open offline → evict → the sections → the two-press race) · `picker-looks` GREEN · `register` 0 failing of 23. No flake, no re-run.
- No module import, app-literal or shared name moved: rack-deps and the cycle count not needed. Nothing drawn: no LOCK.
