# Iteration 005 · S — THE SHELF (brief; the last row, content)

Branch `it005-shelf` from the BASE in the launch message (the physics rows merged). Gate server `LW_PORT=9651 GD_PORT=5751`. No push. Never edit
`lab/mir/**` or `lab/fonts/**`. Josh's dial: the feature, no new test files, existing gates, one light check. Josh 10-17: "I was going to use
Google Drive for the file thingy. After a donation they get a link to the google drive link to download." Read first: `PLAN.md`'s S section
(the whole design), `research/iteration-004/PLAN.md` (THE VOLUME FORMAT v1, THE TAGS), `tools/volumes/pack.mjs` (what it writes: `volumes.json`,
`index.json`, `m/`, `t/`; deterministic bytes; `--incremental`), `lab/volumes.js` whole (`install`: the cache keys are `indexUrl(v)`, `SHELF_URL`
(the entry itself), `inVolume(v, m.file)`, `inVolume(v, m.thumb)`; `deviceShelf()` reads the entry from each cache; `file()`/`picture()` match those
keys), `lab/picker.js` LIBRARY (the installer button, `card(v)`, `enter(v)`), `tools/build-deploy.mjs` (`DEV_LINKS`, what reaches `dist/`),
`research/iteration-004/CAT-BUILD.md` (the tags' counts), the catalogue `~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json`
(`tags`, `priority`, `heavy`).

## The rows
1. **THEMES.** `tools/volumes/themes.json` — an ordered list `[{ id, numeral, title, blurb, any: [tags…] }]`: I THE CLASSICS (`classic`, and every
   molecule of the app's own table — `sources` carries `λWAVES`) · II MEDICINE (`medicine · painkiller · antibiotic · antiviral · heart · mind ·
   cancer · allergy · anaesthetic · vitamin · hormone`) · III LIFE AND FOOD (`life · amino acid · nucleobase · sugar · fat · steroid · neurotransmitter ·
   food · flavour · scent · sweetener · natural · alkaloid`) · IV MATERIALS, ATMOSPHERE AND FUEL (`material · metal · plastic · solvent · fuel · gas ·
   atmosphere · pollutant · toxin · pesticide · colour`) · V THE REST (anything left). `pack.mjs --themes themes.json` assigns each FINISHED molecule to
   the FIRST theme whose `any` it carries, orders a theme by the catalogue's `priority`, splits a theme past 5 GB (5 × 10⁹ B of `.lwm` + `.webp`) into
   "TITLE · 2" with the next numeral, and writes `dist/vol-<n>/…` for each plus ONE `volumes.json`. Titles are data: Josh renames in the json.
   `--volume vol-1 --numeral I` (the pilot's way) keeps working for a single volume. Ids stay unique across volumes (a molecule is in one).
2. **THE ARCHIVE.** `pack.mjs --archive` writes, per volume, `dist/LAMBDAWAVES-VOL-<numeral>.lwv` — `'LWV1'` · u32 index length · the JSON index
   `{ schema: 1, volume: <the volumes.json entry>, files: [{ path, offset, length, sha256 }] }` (index.json first, then every `m/*.lwm` and
   `t/*.webp`, paths relative to the volume folder) · zero pad to 8 · the files, each 8-aligned — and `<name>.sha256` beside it; deterministic
   (same dist → same bytes, `cmp`). A reader in `lab/volumes-format.js` (`parseLwv(header)`: the index from the first bytes only) — pure. The
   volumes.json entry gains `archive: { name, bytes, sha256 }` and keeps `index` only where the packer is told the volume is fetchable
   (`--fetchable`, the dev link; a Drive volume has none). `tools/build-deploy.mjs --shelf <volumes.json>` ships that small file as
   `dist/volumes/volumes.json` (today the dev link is skipped and nothing under volumes/ reaches dist/).
3. **THE FILE ROAD.** `lab/volumes.js` `installFile(volId, file, { onProgress, signal })`: read the index from `file.slice(0, 8 + H)`, check the
   entry's id and `archive.sha256`'s presence against the shelf (an archive whose id is not on the shelf is refused with a sentence), check
   `navigator.storage.estimate()` — too little room for `archive.bytes` refuses with the two sizes named — then for each file entry
   `file.slice(offset, offset + length)` → `arrayBuffer` → sha-256 against the index (`hex`) → `c.put` under EXACTLY the key the fetch road uses
   (`indexUrl(v)` for index.json, `inVolume(v, path)` for the rest, `SHELF_URL` for the entry) so `statusOf · file · picture · remove` see no
   difference; skip an entry already present and matching (resumable); progress by bytes; `persistOnce()` as `install` does. Six at a time is the
   fetch road's choice; here one at a time is right (one disk read).
4. **THE PICKER.** In LIBRARY, a volume entry WITHOUT `index` shows OPEN FILE… (an `<input type=file accept=.lwv>` behind the button; the ring and
   the bytes as progress) and the card takes a drop of the `.lwv`; an entry WITH `index` keeps INSTALL. The card's meta line says the archive's
   size; its blurb says where the file comes from in one plain sentence ("a volume is a file you download once and open here"). No URL, no Drive
   name anywhere in `lab/`.
5. **`docs/VOLUMES-HOSTING.md`** (short): Josh's road — pack with themes, `--archive`, upload each `.lwv` to Google Drive, give the link after a
   donation (his page), what the reader does (download, PICKER › LIBRARY › OPEN FILE…), the quota table (Chrome/Firefox desktop: fine; Safari and
   iPad: a 5 GB volume will not fit — the card says so), and the dev road (the link).

## Checks, then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 (`tests/volumes-format.test.mjs` green) · rack-deps 0 · new-project in step ·
`node tools/build-deploy.mjs --quiet --shelf <file>` (dist/ has `volumes/volumes.json` and nothing else under volumes/) · one browser pass: pack the
pilot with `--themes` and `--archive` into a SCRATCH dist (`--out-dir` in your tmp — do not rewrite `~/Documents/LAMBDAWAVES-VOLUMES/dist`), serve
the app with the dev link pointed at the scratch, OPEN FILE… the 30 MB archive in the Picker, open a molecule from it at a rung, remove it. One
screenshot ≤ 300 KB. Lab count before and after.

Write `research/iteration-005/S-BUILD.md`, commit on `it005-shelf` with a `Co-Authored-By:` line for your model, report the tip sha — never push.
The CPU is shared with a niced PySCF solver — never touch `raw/`; one browser suite at a time; stop only your own pids.
