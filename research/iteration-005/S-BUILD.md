# Iteration 005 · S THE SHELF: build report

Branch `it005-shelf`, based on `0cfc275` (yan-c: A, P1, P3 and P4 merged). Nothing pushed, deployed or tagged. No new test files.
Lab lines (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`): **31,463 → 31,560 (+97)**. The precache is 7.32 MiB,
0.68 MiB under its ceiling.

## What landed

| row | file(s) | what it does |
|---|---|---|
| 1 THEMES | `tools/volumes/themes.json`, `tools/volumes/pack.mjs --themes` | Five themes in order: The Classics (`app: true` + `classic`), Medicine, Life and Food, Materials/Atmosphere/Fuel, The Rest (`rest: true`). Each FINISHED molecule goes to the first theme it matches. "From the app's table" means the candidate's `app`, or a source whose `db` is `λWAVES`. A theme is ordered by `priority`, then by candidate order. Past `--cap` (default 5e9 B of `.lwm` + `.webp`) it splits into "TITLE · 2". Volumes are numbered `vol-<n>` and given numerals in order over the volumes actually written, so an empty theme writes nothing. The run writes ONE fresh `volumes.json`. `--volume vol-1 --numeral I` without themes still writes one volume and merges into the shelf, as before. |
| | `pack.mjs` | `--out-dir D` writes to a scratch dist; `pack-report-<vol>.json` goes beside it, not into the data folder. `--incremental` finds a kept `.lwm` in any `vol-<n>/` of the out dir, then of the data's dist; pictures are found the same way. A molecule a theme or a split moves is **retargeted**: only its header's `volume` changes, and the blobs are re-laid in the same order. That gives exactly the bytes a direct pack would write (vol-1 → vol-7 → vol-1 is byte-identical for H₂O, aspirin and β-carotene). |
| 2 THE ARCHIVE | `pack.mjs --archive [--fetchable]`, `lab/volumes-format.js` `LWV_MAGIC · lwvIndexLength · parseLwv` | Per volume, `dist/LAMBDAWAVES-VOL-<numeral>.lwv`. Layout: `'LWV1'` · u32 H · `{ schema: 1, volume: <its shelf entry without archive>, files: [{ path, offset, length, sha256 }] }` · zero pad to 8 · index.json, then every `m/*.lwm`, then every `t/*.webp`, each at an 8-aligned **absolute** offset. The offsets live inside the index, so the packer iterates the index length to a fixed point. A `<name>.sha256` (sha256sum format) sits beside each archive. The packer reads every archive back through `parseLwv` and re-hashes every file. The entry gains `archive: { name, bytes, sha256 }` and drops `index` unless `--fetchable`. |
| | `tools/build-deploy.mjs --shelf F` | Ships F as `dist/volumes/volumes.json`. Each entry keeps only its archive: `index` is dropped, and an entry without an archive is refused (exit 2). |
| 3 THE FILE ROAD | `lab/volumes.js` `installFile(volId, file, { onProgress, signal })` | Reads 8 bytes, then the index (`file.slice(0, 8 + H)`). It refuses, with one sentence each: a file that is not a volume; a volume not on the shelf; another volume than the card's; another edition (the archive's index.json sha ≠ the shelf's `indexSha256`); too little room, from `navigator.storage.estimate()` against what is still to be kept, naming both sizes. Then, one entry at a time, it runs `File.slice` → sha-256 → `c.put` under the fetch road's keys (`indexUrl(v)`, `inVolume(v, path)`, `SHELF_URL`). It is resumable (a key kept at its `content-length` is skipped) and cancellable, and stores the ladder's basis records and `persistOnce()` as `install` does. A file-only entry has no `index`: `validVolume` accepts `archive` instead, and `indexUrl` falls back to `<id>/index.json`, so the keys are the same folder's. An absent catalogue says "VOL. II is not on this device: open its file". |
| | `lab/volumes-format.js` (a fix) | `parseLwm`'s `blob()` copied with `bytes.slice()`. On a node Buffer that is a VIEW, so `.buffer` was the whole pool and a re-encode wrote 12 MB for a 0.65 MB molecule. It now copies into a fresh Uint8Array. The page never hit this (a browser Uint8Array's slice copies); the retarget did. |
| 4 THE PICKER | `lab/picker.js`, `lab/skin.css` (one rule) | An entry WITHOUT `index` shows **OPEN FILE… · <archive size>**: a hidden `<input type=file accept=.lwv>`, with the ring and "42% · 9 MB OF 18 MB · CANCEL" as progress. It shows `RESUME · n / N · OPEN FILE…` when partial and `INSTALLED · REMOVE` (two presses) when installed. When `estimate()` says the volume will not fit, the button reads `… · TOO BIG FOR THIS DEVICE`. The card takes a drop of the `.lwv` (dashed accent outline). Its meta line gives the archive's size, and a second blurb line reads "A volume is a file you download once and open here." An entry WITH `index` keeps INSTALL. After a file opens from inside a volume's view, the view re-enters with its molecules. No URL and no Drive name anywhere in `lab/`. |
| 5 | `docs/VOLUMES-HOSTING.md` | Josh's road, what the reader does, the refusals, the quota table, the dev road. |

## The pilot, themed (MEASURED: `--themes --archive --incremental --out-dir <scratch>`, 11.7 s)

| volume | title | molecules | .lwm MiB | archive | archive sha-256 |
|---|---|---|---|---|---|
| VOL. I | The Classics | 10 (H₂O NH₃ CH₄ C₆H₆ C₅H₅N HBr TiCl₄ glycine alanine urea: the app's own) | 1.77 | 1,900,410 B | `8984d384c1469317…` |
| VOL. II | Medicine | 10 (aspirin caffeine ibuprofen paracetamol nicotine dopamine serotonin testosterone adrenaline β-carotene) | 16.70 | 17,558,692 B | `a8814d1d7a61513f…` |
| VOL. III | Life and Food | 8 (glucose vanillin menthol limonene capsaicin cholesterol citric acid ethanol) | 10.26 | 10,802,292 B | `162281088f2cdb8a…` |
| VOL. IV | Materials, Atmosphere and Fuel | 3 (acetone naphthalene styrene) | 1.08 | 1,147,004 B | `29253565e48b8806…` |
| (The Rest) | | 0: no volume written | | | |

- **Deterministic:** a second pack into a fresh scratch dist gave byte-identical archives and `volumes.json` (`cmp`, all five).
  `sha256sum -c LAMBDAWAVES-VOL-II.lwv.sha256`: OK.
- **The split:** `--cap 8000000` splits Medicine into "Medicine · 2" and "Medicine · 3" and Life and Food into "· 2", numbered I–VII.
- **The single-volume road:** `--volume vol-1 --numeral I --archive --fetchable` packs one volume of 31 molecules
  (29.82 MiB) into `LAMBDAWAVES-VOL-I.lwv` of 31,405,708 B (sha `292e57ad1b2c06b6…`).
- **The catalogue (950, first match, counted from `vol-1.candidates.json`):** The Classics 93 · Medicine 857 · Life and Food 0 ·
  Materials 0 · The Rest 0. The catalogue is ChEMBL-dominated (PubChem rate-blocked, CAT-BUILD.md). Every molecule there that carries
  a Life or Materials tag also carries a Medicine one, and first-match-wins sends it to Medicine. That is the brief's rule, kept.
  Reordering the themes or the catalogue's full run would change it. **Josh's call.**

## Checks

- `node tests/pwa.test.mjs --write`; `./test.sh node` exit 0, with `tests/volumes-format.test.mjs` green.
- `node tools/rack-deps.mjs --classes --no-write` exit 0 (G-G holds, 0 bare writes).
- `node tools/new-project.mjs --check` in step (16117 B).
- `node tools/build-deploy.mjs --quiet --shelf <scratch>/volumes.json` exit 0. dist/ is complete and verified (650 files). Under
  `dist/volumes/` there is `volumes.json` and nothing else. `volumes/volumes.json` is covered by sw.js' DATA rule, and every entry
  lost its `index`.

## The light check (Firefox headless, gate server 9651 / geckodriver 5751; dev link → the themed scratch dist)

```
shelf: four cards, each "OPEN FILE… · <size>" and the one-sentence blurb (VOL. I 2 MB · II 18 MB · III 11 MB · IV 1 MB)
OPEN FILE… VOL. II (17.6 MB, WebDriver's real file upload into the input) → 4.1 s; the word went:
  OPEN FILE… · 18 MB | 10% · 2 MB OF 18 MB · CANCEL | 35% · … | 100% · 18 MB OF 18 MB · CANCEL | INSTALLED · REMOVE
statusOf(vol-2): installed 10/10, 17,512,224 B; cache lw-vol-vol-2: 22 keys (index + 10 .lwm + 10 .webp + the shelf entry)
openVolume(vol-2, paracetamol, 6-31G, network:false): E = −512.1615612778 Eh, 117 AOs, from: device, VOL. II
REMOVE (two presses): absent, cache gone, the button back to "OPEN FILE… · 18 MB"
refusals: "LAMBDAWAVES-VOL-II.lwv holds VOL. II, not VOL. I" · "junk.lwv is not a λWAVES volume file" (no cache created)
console: the known ResizeObserver line only (the pre-existing `history` red)
```
Screenshot: `S-library.png` (181 KB): the LIBRARY with VOL. II installed and VOL. I offering OPEN FILE….

## What the brief got wrong, and how I decided

1. **"OPEN FILE… the 30 MB archive" after packing "with `--themes`".** Themed, the pilot is four archives (the largest is VOL. II at
   17.6 MB). The 30 MB archive exists only on the single-volume road. I followed the main instruction (themes) and opened VOL. II.
   The 31.4 MB single-volume archive was packed and measured too (above).
2. **"Safari and iPad: a 5 GB volume will not fit."** That holds for older Safari (≈1 GB). WebKit's 2023 storage policy (Safari 17)
   lets an origin in the browser app use a large share of the disk. That comes from the published policy as I know it, not measured
   here. So the app measures instead of guessing: `estimate()` drives TOO BIG FOR THIS DEVICE and the refusal. The doc's table
   says so. Also, the File road needs room for the downloaded `.lwv` beside the cache, about 2× during the install. The doc says that
   too.
3. **"Check `archive.sha256`'s presence."** The archive cannot carry its own hash, since the embedded entry is written before the
   archive exists. The check is stronger: the archive's index.json sha must equal the shelf's `indexSha256`, and every file's bytes
   are hashed against the archive's index.
4. **A Drive entry "has no index", but the store needed one for its keys and its validity.** `indexUrl` falls back to
   `<id>/index.json` (the keys the fetch road would use), and `validVolume` accepts an `archive` in place of an `index`.
5. **"`index` kept only with `--fetchable`."** An entry packed WITHOUT `--archive` keeps `index` (otherwise nothing could install
   it). `--fetchable` matters only alongside `--archive`.
6. **The theme numerals in `themes.json`** are what a theme gets when nothing before it splits. The packer numbers the volumes in
   order (a split shifts the rest), as the brief asks.

## Left undone / for the integrator

- The project `CLAUDE.md` VOLUMES paragraph does not yet name THE SHELF (themes, `.lwv`, OPEN FILE…, `--shelf`). It is left for the
  integrator to avoid a conflict with P2.
- The real dist (`~/Documents/LAMBDAWAVES-VOLUMES/dist`) was not touched. Josh's first themed pack there will repack into
  vol-1…vol-n. The pilot's `vol-1/m/` keeps files no row reaches; the packer lists them and does not delete them.
- When a volume's id changes (because an earlier theme split), a device that installed the old id keeps it under the old name.
