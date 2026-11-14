# Going live with the new volumes on the website (a checklist for Josh)

Prepared 2026-11-14 (044 S13–S15). Nothing here has been done: no file was uploaded, nothing was deployed, the live site is as it was.
What changes for a visitor: LIBRARY › EXPANSIONS shows **VOL. I · Common Molecules I** and **VOL. II · Common Molecules II**, and
VOL. II gets a one-press INSTALL like VOL. I (today it is OPEN FILE… only). VOL. III stays hidden.

Everything is in `~/Documents/LAMBDAWAVES-VOLUMES/dist-sheets-2026-11-14/` (the old `dist/` is untouched and still what the live site
was built from).

## The numbers

| | files | bytes |
|---|---|---|
| the site without volumes | 1,835 | |
| VOL. I, new edition (pictures in 70 sheets, WebP quality 90) | 7,419 | 6,065,795,241 (the old edition: 14,276 files, 6,064,046,591) |
| VOL. II (unchanged) | 4,947 | 5,848,310,795 |
| VOL. III (hidden, still shipped) | 87 | 158,748,701 |
| **the whole deploy** | **14,289 of the free plan's 20,000** | 12,184,076,371 |

The largest file is 13,149,000 B (12.5 MiB) against the 25 MiB limit. `build-deploy` checked both limits and passed.

## 1. Upload the new VOL. I file to Drive

- [ ] Upload `~/Documents/LAMBDAWAVES-VOLUMES/dist-sheets-2026-11-14/LAMBDAWAVES-VOL-I.lwv` (5,924,888,496 B, 5.5 GiB) and share it
      as "anyone with the link".
- [ ] Its sha-256 is `016ae865b48cd343d33486480c20cdb34a8e17ad1893b07b54be48df69311e1f` (also in the `.sha256` file beside it; put
      that next to the link if you list one).
- [ ] Put the new link where the old VOL. I link is (the tip jar's thank-you message). **Take the old VOL. I file down, or mark it
      old**: once the site is live the app refuses it ("another edition of VOL. I than the one this app lists").
- [ ] VOL. II's file on Drive does not change.

## 2. Deploy (one build, one publish)

From the repository, on the branch you ship from:

```bash
node tests/pwa.test.mjs --write
node tools/build-deploy.mjs --shelf ~/Documents/LAMBDAWAVES-VOLUMES/dist-sheets-2026-11-14/volumes.json --ship vol-1,vol-2,vol-3
npx wrangler deploy --dry-run     # uploads nothing
npx wrangler deploy               # the one command that goes live
```

- [ ] The build must end with `PASS  14289 of 20000 files` (a few more or fewer if the app changed) and no "DO NOT DEPLOY" line.
- [ ] The first publish uploads VOL. II's 4,947 files (5.8 GB) and VOL. I's 70 new sheets; VOL. I's molecule files are already
      there. Expect it to take a while on your connection.

## 3. Check after

- [ ] Open the site in a private window › LIBRARY › EXPANSIONS: two cards, "Common Molecules I" and "Common Molecules II" under VOL. I
      and VOL. II; no VOL. III; neither says WIP.
- [ ] Open VOL. I: the tiles have pictures. Open VOL. II: the same.
- [ ] Press INSTALL on VOL. II: it counts up to 4,616 and says REMOVE. (Measured here: about 40 seconds from a local disk; from the
      network it is 5.7 GB of download.)
- [ ] In a browser where VOL. I was already installed: its card still says REMOVE (installed), nothing downloads, the tiles show.
- [ ] OPEN FILE… on VOL. I with the new file from Drive: it installs. With the old file: it is refused, in words.

## What I measured before writing this (Firefox, my own server, 2026-11-14)

- A browser with the old VOL. I installed, then given the new edition: still INSTALLED 6,927 / 6,927; pressing install again fetched
  the catalogue and **no molecule and no picture** (0 of 6,927). Its 6,927 old pictures stay in its storage, unused, until REMOVE.
- VOL. II installed beside it with one press: 39 s, 4,616 molecules.
- Both installed together: **9.76 GB used of a 10.7 GB allowance** in Firefox. It fits, with under 1 GB to spare — a third volume
  will not fit in Firefox without the browser's "persistent storage" permission.
- A fresh install of the new VOL. I: 50 s, 6,929 kept entries (the old edition kept 13,856).
- OPEN FILE… with the new `.lwv`: 73 s, installed, nothing fetched from the network. With VOL. II already installed the same press
  is refused for space ("needs 5.9 GB and this device has 998 MB free"): true, and said in words.

## Not done, on purpose

- The packer's own folder is still the old `dist/`. The packer (`tools/volumes/pack.mjs`) now keeps sheets and no longer deletes them,
  but the next real pack should run on the new folder. Making `dist-sheets-2026-11-14` the packer's `dist` (and keeping the old one
  as a backup) is a rename you have not asked for.
- VOL. II's own catalogue still carries the title "All the Molecules · 2" inside it (nothing shows it); only its shelf entry was
  renamed, so VOL. II is not a new edition and its Drive file stays valid.
