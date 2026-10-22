# C4 VOL. II WIP + THE 5 GB CUT (chain C, iteration 014)

**What.** `pack.mjs --max-gb G [--wip]` (Josh: 5–5.5 GB a volume, one every other week; VOL. II filled partially now with a WIP label;
indexes versioned, payloads immutable):
- **THE CUT.** A volume holds at most G GiB of `.lwm` + pictures. A molecule already shelved in a `vol-<n>/` of the out dir **stays
  there**, so a released volume never loses or reshuffles a molecule. Every new molecule, in catalogue order, goes to the **last** shelved
  volume while it has room, then a new `vol-<n+1>` opens (numeral II, title `<title> · 2`). An earlier volume is never refilled, so VOL. I
  stays as released. The night runs `--max-gb 5.25`.
- **WIP.** With `--wip`, when there is more than one volume the last one (the one still filling) carries `wip: true` in its index and its shelf
  entry.
- **`indexVersion` in every index** (and the shelf entry). It is the old file's number, plus 1 when anything except the number and the
  packer's commit moved; a new index starts at 1. A reader can tell an index it holds from a newer one, and the payloads stay immutable per
  id (the .lwm bytes are deterministic, and a kept file is not rewritten).
- **The Picker**: a WIP volume's card wears a **WIP** pill (`.mm-vol-wip`, accent; its hover reads "Work in progress: this volume is still
  being filled — it installs now, and grows"). It installs and opens like any other volume.

**Dry run (scratch only).** 13 molecules (5 from C1/C2 plus 8 of ~1.8 MB each, raw copied read-only) into `<scratch>/dist-c4` with
`--max-gb 0.01 --wip --incremental`, in three runs:
1. 9 molecules → vol-1 alone (8.63 MiB), indexVersion 1, no WIP (one volume).
2. The same 9 plus 4 new → vol-1 untouched (the same 9, indexVersion still 1, aspirin.lwm the same bytes); the 4 new → **vol-2 II "All the
   Molecules · 2", wip: true** (7.01 MiB), indexVersion 1.
3. The same again → nothing moved, both versions held.
Then a pack with C3's `geo` in the rows → both indexes went to **indexVersion 2** (their content changed). The Picker over that shelf:
VOL. I and VOL. II · WIP, both offering INSTALL (`c-shots/C4-wip-card.jpg`).

**Files.** `tools/volumes/pack.mjs` (`--max-gb`, `--wip`, the cut, `indexVersion`), `lab/picker.js` (the WIP pill), `lab/skin.css`, `lab/sw.js`.

**Tests.** `./test.sh node` exit 0; `library` and `start` browser suites GREEN; the three dry runs above.

**CLAUDE.md sentence.** THE CUT (iteration 014 C4): `pack.mjs --max-gb 5.25 --wip` keeps a shelved molecule in its volume, fills the
last volume and opens the next past the cut (never refilling a released one), marks the still-filling last volume `wip: true` (the
Picker's card wears WIP and installs it), and versions every index (`indexVersion`, +1 on any change but the packer's commit).

**For Josh.** (1) The live run is yours: `pack.mjs --candidates … --volume vol-1 --title 'All the Molecules' --max-gb 5.25 --wip --incremental`
(not `--sole` with the old single-volume habit, or it would still be one volume; `--sole` and `--max-gb` work together). VOL. I is 4.43 GB
today; C1's grids add ~0.4 GB, so the cut lands soon after. (2) Should a lone volume still filling also say WIP? Today only the last of two or
more does. (3) The app does not yet re-read an installed volume whose shelf `indexVersion` moved (it re-checks by `indexSha256`, as before).
