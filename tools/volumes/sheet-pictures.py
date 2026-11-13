#!/usr/bin/env python3
"""tools/volumes/sheet-pictures.py — A VOLUME'S SINGLE PICTURES INTO PAGE SHEETS (044 S12).

VOL. I ships one t/<id>.webp per molecule (6,927 files); VOL. II ships its plain picture as the `density` sheet of each page
(tools/volume-thumbs.mjs, lab/volumes.js pagePicture).  This writes a NEW edition of a volume whose plain pictures are sheets too, so
both volumes fit the free plan's 20,000 files as loose files.  It draws nothing: each sheet is the existing pictures, pixel for pixel
(lossless WebP), `cols` a row in the page's order.

    python3 tools/volumes/sheet-pictures.py --src <dist> --out <new dir> --volume vol-1

--out must not exist.  --src is only read.  The new directory holds: <vol>/ (m/ copied, t/ the other sheets and diagrams copied, t/density-<page>.webp
new, t/pages.json naming them and the new catalogue, index.json with every `thumb` null and indexVersion + 1), every other volume of the
shelf as a symlink to --src's, and volumes.json with this volume's new indexSha256 and indexVersion and WITHOUT its `archive` (the old
.lwv is the old edition; a new one is tools/volumes/pack.mjs --archive's to write).
"""
import argparse, hashlib, json, math, os, re, shutil, sys
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True); ap.add_argument('--out', required=True); ap.add_argument('--volume', required=True)
a = ap.parse_args()
SRC, OUT, VOL = os.path.realpath(os.path.expanduser(a.src)), os.path.abspath(os.path.expanduser(a.out)), a.volume
if os.path.exists(OUT): sys.exit(f'{OUT} exists: this tool writes a new directory only')
if OUT == SRC or OUT.startswith(SRC + os.sep): sys.exit('--out is inside --src')
sha = lambda b: hashlib.sha256(b).hexdigest()
S, O = os.path.join(SRC, VOL), os.path.join(OUT, VOL)
raw = open(os.path.join(S, 'index.json'), encoding='utf8').read(); idx = json.loads(raw)
man_raw = open(os.path.join(S, 't/pages.json'), encoding='utf8').read(); man = json.loads(man_raw)
shelf = json.load(open(os.path.join(SRC, 'volumes.json'), encoding='utf8'))
entry = next(v for v in shelf['volumes'] if v['id'] == VOL)
assert sha(raw.encode()) == entry['indexSha256'] == man['index'], 'the catalogue, the shelf and the pages are not one edition'
rows = {m['id']: m for m in idx['molecules']}
assert sorted(i for p in man['pages'] for i in p) == sorted(rows), 'the pages do not cover the catalogue'
assert all(m.get('thumb') == f"t/{m['id']}.webp" and not m.get('thumbs') for m in idx['molecules']), 'a row without its single picture (or with variants)'
singles = {f't/{i}.webp' for i in rows}

os.makedirs(os.path.join(O, 'm')); os.makedirs(os.path.join(O, 't'))
for m in idx['molecules']: shutil.copyfile(os.path.join(S, m['file']), os.path.join(O, m['file']))
for f in sorted(os.listdir(os.path.join(S, 't'))):
    if f'{"t/" + f}' in singles or f == 'pages.json': continue
    assert re.fullmatch(r'[a-z]+-\d+\.(webp|json)', f), f'an unexpected file in t/: {f}'
    shutil.copyfile(os.path.join(S, 't', f), os.path.join(O, 't', f))

cols = man['cols']; density = {}; tile = None
for p, ids in enumerate(man['pages']):
    n_rows = math.ceil(len(ids) / cols); sheet = None
    for n, i in enumerate(ids):
        im = Image.open(os.path.join(S, 't', i + '.webp')).convert('RGBA')
        if tile is None: tile = im.size[0]
        assert im.size == (tile, tile), f'{i}: {im.size}, not {tile} square'
        if sheet is None: sheet = Image.new('RGBA', (cols * tile, n_rows * tile), (0, 0, 0, 0))
        sheet.paste(im, ((n % cols) * tile, (n // cols) * tile))
    at = os.path.join(O, 't', f'density-{p}.webp'); sheet.save(at, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    back = Image.open(at).convert('RGBA'); assert back.tobytes() == sheet.tobytes(), f'page {p}: the sheet does not read back as it was drawn'
    density[str(p)] = {'v': sha(open(at, 'rb').read())[:8], 'rows': n_rows, 'missing': []}

new_raw, k = re.subn(r'"thumb":"t/[^"]+\.webp"', '"thumb":null', raw); assert k == len(rows), (k, len(rows))
v0 = idx.get('indexVersion', 1); new_raw, k = re.subn(r'"indexVersion":%d\b' % v0, '"indexVersion":%d' % (v0 + 1), new_raw, count=1); assert k == 1
open(os.path.join(O, 'index.json'), 'w', encoding='utf8').write(new_raw); new_sha = sha(new_raw.encode())
man['index'] = new_sha; man.setdefault('sheets', {})['density'] = density
open(os.path.join(O, 't/pages.json'), 'w', encoding='utf8').write(json.dumps(man, ensure_ascii=False, separators=(',', ':')))
entry['indexSha256'] = new_sha; entry['indexVersion'] = v0 + 1; entry.pop('archive', None)
open(os.path.join(OUT, 'volumes.json'), 'w', encoding='utf8').write(json.dumps(shelf, ensure_ascii=False, indent=1) + '\n')
for v in shelf['volumes']:
    if v['id'] != VOL and os.path.isdir(os.path.join(SRC, v['id'])): os.symlink(os.path.join(SRC, v['id']), os.path.join(OUT, v['id']))
n = sum(len(fs) for _, _, fs in os.walk(O)); b = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(O) for f in fs)
sh = [os.path.getsize(os.path.join(O, 't', f'density-{p}.webp')) for p in range(len(man['pages']))]
print(json.dumps({'volume': VOL, 'indexSha256': new_sha, 'indexVersion': v0 + 1, 'files': n, 'bytes': b, 'tile': tile, 'sheets': len(sh), 'sheetBytes': sum(sh), 'largestSheet': max(sh)}))
