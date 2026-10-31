# Hosting the volumes

A volume is one file, `LAMBDAWAVES-VOL-<numeral>.lwv`. The reader downloads it once and opens it in the app; the app keeps every
molecule on the device and never fetches it again. The app holds no link to where the file lives: no URL and no host name appear in
`lab/`. The link belongs to the maintainer's donation page.

## Publishing a volume

1. **Pack with the themes and the archive** (the data stay in `~/Documents/LAMBDAWAVES-VOLUMES/`, never in git):
   ```
   node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json \
        --themes tools/volumes/themes.json --archive --incremental
   node tools/menu-thumbs.mjs --volume vol-<n>     # once per volume that lacks pictures, then pack again
   ```
   Every finished molecule goes to the first theme it matches (THE CLASSICS · MEDICINE · LIFE AND FOOD · MATERIALS, ATMOSPHERE AND
   FUEL · THE REST). A theme past 5 GB continues as "· 2" and takes the next numeral. To rename a theme, edit `themes.json`. The
   packer writes `dist/vol-<n>/`, ONE `dist/volumes.json`, and per volume `dist/LAMBDAWAVES-VOL-<numeral>.lwv` plus its `.sha256`.
   It reads each archive back before it finishes. The same dist always gives the same bytes.
2. **Upload each `.lwv`** to Google Drive and share it as "anyone with the link". The `.sha256` beside it is for anyone who wants to
   check a download (`sha256sum -c`).
3. **Ship the shelf with the app:** `node tools/build-deploy.mjs --shelf ~/Documents/LAMBDAWAVES-VOLUMES/dist/volumes.json` puts the
   small `volumes.json` (title, count, size, `archive: { name, bytes, sha256 }`) at `dist/volumes/volumes.json`. No volume bytes ship.
   An entry without an archive is refused.
4. **After a donation,** the donor gets the Drive link on the donation page.

## What the reader does

Download the `.lwv`. Then open PICKER › LIBRARY, find the volume's card and press **OPEN FILE…** (or drop the file on the card).
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
