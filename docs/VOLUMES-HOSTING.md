# Hosting the volumes

A volume is one file, `LAMBDAWAVES-VOL-<numeral>.lwv`. The reader downloads it once and opens it in the app; the app keeps every
molecule on the device and never fetches it again. The app holds no link to where the file lives: no URL and no host name appear in
`lab/`. The link belongs to the maintainer's donation page.

## Publishing a volume

1. **Pack with the cut and the archive** (the data stay in `~/Documents/LAMBDAWAVES-VOLUMES/`, never in git):
   ```
   node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json \
        --volume vol-1 --numeral I --title 'All the Molecules' --sole --max-gb 5.25 --wip --next II --incremental --archive --fetchable
   node tools/menu-thumbs.mjs --volume vol-<n>     # once per volume that lacks pictures, then pack again
   ```
   Every finished molecule fills VOL. I until the cut (5.25 GiB of `.lwm` and pictures), then the next numeral ("· 2", "· 3"); a released
   volume is never refilled and the last one is WIP until it is cut. `--fetchable` keeps `index` beside `archive`, which the dev link and
   `--ship` need. (`--themes tools/volumes/themes.json` is the other road: one volume per theme.) The packer writes `dist/vol-<n>/`, ONE
   `dist/volumes.json`, and per volume `dist/LAMBDAWAVES-VOL-<numeral>.lwv` plus its `.sha256`. It reads each archive back before it
   finishes. The same dist always gives the same bytes.
2. **Upload each `.lwv`** to Google Drive and share it as "anyone with the link". The `.sha256` beside it is for anyone who wants to
   check a download (`sha256sum -c`).
3. **Ship the shelf with the app:** `node tools/build-deploy.mjs --shelf ~/Documents/LAMBDAWAVES-VOLUMES/dist/volumes.json --ship vol-1,vol-3`
   puts `volumes.json` at `dist/volumes/volumes.json`. A volume named by `--ship` travels with the site as static assets (its folder is
   copied to `dist/volumes/vol-<n>/` and its entry keeps `index`, so INSTALL and the single-molecule fetch work); every other entry keeps
   only `archive: { name, bytes, sha256 }` and its bytes come from the Drive file. An entry with neither is refused.
4. **After a donation,** the donor gets the Drive link on the donation page.

## The free plan: a volume as files

Cloudflare Workers static assets are free with unlimited requests, within 20,000 files per deploy and 25 MiB per file; the account
carries no payment method, so there is nothing to bill. VOL. I (13,855 files) travels with the site this way (`--ship vol-1`), and the
LIBRARY installs it with one press or fetches one molecule at a time. Measured 2026-11-12 (044): the site alone is 1,834 files, VOL. I
14,276, VOL. III 87 — 16,197 as deployed; VOL. II is 4,947 files (5.85 GB, none over 25 MiB), which would make 21,144. Since 044 the
shelf offers VOL. I and II on every host and holds VOL. III back (`lab/volumes.js` `HELD`); VOL. III's files still ship so what a
browser already kept of it, and old links, still open. VOL. II would push the deploy past 20,000 files, so it is an
archive on Drive until a second assets-only Worker on the path `/volumes/vol-2/*` carries it (which needs the main Worker on a route
instead of a custom domain). `tools/build-deploy.mjs` §V7 THE FREE PLAN refuses a build over either limit and says what is left.

**VOL. II as files beside VOL. I (044 S12, built 2026-11-13, NOT deployed).** Josh, 11-13: "There can be an update to the volumes."
VOL. I's 6,927 single pictures become 70 page sheets, as VOL. II's are:

```
python3 tools/volumes/sheet-pictures.py --src ~/Documents/LAMBDAWAVES-VOLUMES/dist \
        --out ~/Documents/LAMBDAWAVES-VOLUMES/dist-sheets-2026-11-13 --volume vol-1        # 13 minutes; reads --src, writes a new directory only
node tools/build-deploy.mjs --shelf ~/Documents/LAMBDAWAVES-VOLUMES/dist-sheets-2026-11-13/volumes.json --ship vol-1,vol-2,vol-3
```

| | files | bytes | largest file |
|---|---|---|---|
| the site alone | 1,835 | — | — |
| VOL. I as shipped today | 14,276 | 6,064,046,591 | 13,149,000 |
| VOL. I sheet-packed (edition 3) | 7,419 | 6,185,171,588 | 13,149,000 |
| VOL. II | 4,947 | 5,848,310,795 | 4,904,462 |
| VOL. III (held, still shipped) | 87 | 158,748,701 | 2,314,888 |
| **the deploy with all three** | **14,289 of 20,000** | 12,303,456,120 | under 25 MiB (§V7 PASS) |

The sheets are lossless (each cell is the old picture pixel for pixel), which is why the volume grows by 121 MB: 70 sheets are
145,962,264 B where the 6,927 pictures were 24,697,930 B. The `.lwm` files are byte-identical; the catalogue differs only in `thumb`
(null in every row) and `indexVersion` (3), so its `indexSha256` is new and this is a new edition.

What a browser that installed the old VOL. I meets (proved in Firefox, the old dist served, installed, then the new one served to the
same page): it still says INSTALLED 6,927 / 6,927 with nothing to download (a molecule's file is kept by its own hash, which did not
change); its pictures now come from the sheets; the 6,927 old single pictures stay in its storage, unused, until REMOVE. A fresh
install of the new edition keeps 6,929 entries where the old kept 13,856.

Owed before a deploy: (1) the old `LAMBDAWAVES-VOL-I.lwv` is the old edition and OPEN FILE… would refuse it, so the new shelf entry
has no `archive` — `tools/volumes/pack.mjs --archive` must write a new one if the file road is to stay; (2) `pack.mjs` still names a
single picture per molecule, so the next real pack would undo this unless it is taught that a `density` cell is the picture; (3) both
volumes installed are about 9.8 GB of browser storage (4.9 GB each as Firefox counts it), against a 10.7 GB best-effort quota
measured in Firefox here — not tried together.

## What the reader does

Download the `.lwv`. Then open the MAIN MENU › LIBRARY, scroll down to EXPANSIONS, find the volume's card and press **OPEN FILE…** (or drop the file on the card).
The ring shows progress by bytes. Every file in the archive is checked against its sha-256 before the app keeps it. If the reader
stops part-way, opening the same file again resumes. Once installed, the file on disk can be deleted, and **INSTALLED · REMOVE**
frees the space.

The app refuses, with one sentence:
- a file that is not a volume;
- a volume that is not on the app's shelf;
- another volume than the card's;
- another edition of the volume (its catalogue's hash differs from the shelf's);
- a damaged file;
- a device without room. It names both sizes: "VOL. II needs 5.0 GB and this device has 1.2 GB free for it".

## Room on the device

The app asks the browser (`navigator.storage.estimate()`) rather than guessing. When the volume will not fit, the card says
**TOO BIG FOR THIS DEVICE** before the reader opens anything. The reader also needs room for the downloaded `.lwv` while it is being
opened, so the device needs about twice the volume's size for the length of the install.

| browser | what an origin may keep (the browsers' published policies, not measured here) | a 5 GB volume |
|---|---|---|
| Chrome / Edge, desktop | up to ~60 % of the disk | fits |
| Firefox, desktop | ~10 % of the disk (max 10 GiB) best-effort; up to 50 % once storage is persisted (the app asks on the first install) | fits on most disks |
| Safari 17+ (macOS, iPadOS) | up to ~60 % of the disk in the browser app (WebKit's 2023 policy); older Safari ≈ 1 GB | fits only where the device has the room; on older Safari and small iPads it does not, and the card says so |
| an iPad home-screen app | the same policy, with less room in practice | the card says so |

## The dev road (the link)

In a checkout, `lab/volumes` is a git-ignored link to a dist. To get the old one-press INSTALL, pack with `--fetchable`: the entries
keep `index`, and the app fetches the files from the link. Without `--fetchable`, a dev shelf behaves like the deployed one: the
cards show OPEN FILE… and the archives in that dist are the files to open. Packing with `--volume vol-1 --numeral I` (the pilot's
road, no themes) still writes one volume. Without `--archive` it always keeps `index`.
