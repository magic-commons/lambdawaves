#!/usr/bin/env python3
"""tools/menu-collage-scan.py — 035 THE MAIN MENU'S COLLAGE, step one: THE SCOUT.

  python3 tools/menu-collage-scan.py [root=~/Videos] [--out .tmp/collage] [--jobs 4]

Every video under root (minus the folders that are not λWAVES) is read once at 96 px / 8 fps for its cut points (scene score > 0.35)
and its motion. Between cuts, windows of 2.4 s become candidates — one per 8 s of clean footage, at most 20 a file, never a still —
each with a centre-square thumbnail (the crop that would ship), a dark/light guess from the crop's rim, and a seat on a contact sheet
of 20 for the eye (a cheap model) to judge by Josh's order: no UI first, no informationals second, no cut inside.
Writes <out>/candidates.json, <out>/thumbs/<id>.jpg and <out>/sheets/sheet-NN.jpg. The eye answers in <out>/verdicts.jsonl (a line a candidate); then
`node tools/menu-collage.mjs cut|atlas` builds the pool and the two atlases. Needs ffmpeg/ffprobe and Pillow at tool time only.
"""
import json, os, re, subprocess, sys
import concurrent.futures as cf
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat

EXCLUDE = {'AUTOMATA HERO', 'SYNCHROSPECTRE CANVAS', 'Kden Projects', 'Thumbnails'}
EXT = {'.mp4', '.mkv', '.webm', '.mov'}
WIN, CUT, STILL, PER_FILE, PER_SEC = 2.4, 0.35, 0.004, 20, 8.0
COLS, ROWS, CELL, LABEL, GUT = 5, 4, 160, 22, 8

args = [a for a in sys.argv[1:]]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
OUT = Path(opt('--out', '.tmp/collage')).resolve(); JOBS = int(opt('--jobs', '4'))
ROOT = Path(args[0] if args else '~/Videos').expanduser().resolve()
WORK, THUMBS, SHEETS = OUT / 'work', OUT / 'thumbs', OUT / 'sheets'
for d in (WORK, THUMBS, SHEETS): d.mkdir(parents=True, exist_ok=True)

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def probe(f):
    j = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', str(f)]).stdout or '{}')
    s = (j.get('streams') or [{}])[0]; d = float((j.get('format') or {}).get('duration') or 0)
    return int(s.get('width') or 0), int(s.get('height') or 0), d

def scores(f, tag):
    path = WORK / f'{tag}.scores'
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', str(f), '-an', '-sn', '-dn',
         '-vf', f"scale=96:-2,fps=8,select='gte(scene,0)',metadata=print:key=lavfi.scene_score:file={path}", '-f', 'null', '-'])
    pts, sc, t = [], [], None
    if path.exists():
        for line in path.read_text(errors='replace').splitlines():
            if line.startswith('frame:'):
                m = re.search(r'pts_time:([\d.]+)', line); t = float(m.group(1)) if m else None
            elif line.startswith('lavfi.scene_score=') and t is not None:
                pts.append(t); sc.append(float(line.split('=')[1]))
        path.unlink()
    return pts, sc

def windows(pts, sc, dur):
    cuts = [t for t, s in zip(pts, sc) if s > CUT]
    edges = [0.0] + cuts + [dur]
    out = []
    for a, b in zip(edges, edges[1:]):
        a2, b2 = a + 0.3, b - 0.3
        length = b2 - a2
        if length < WIN: continue
        k = max(1, min(int(length // WIN), 1 + int(length // PER_SEC)))
        for i in range(k):
            t = a2 + (length - WIN) / 2 if k == 1 else a2 + i * (length - WIN) / (k - 1)
            seg = [s for p, s in zip(pts, sc) if t <= p < t + WIN]
            if not seg: continue
            motion = sum(seg) / len(seg)
            if motion < STILL: continue
            out.append({'t': round(t, 2), 'motion': round(motion, 4), 'peak': round(max(seg), 3), 'segment': round(b - a, 1)})
    if len(out) > PER_FILE:
        out = [out[int(i * (len(out) - 1) / (PER_FILE - 1))] for i in range(PER_FILE)]
    return out

def scan_file(f):
    w, h, dur = probe(f)
    if not w or dur < WIN + 0.8: return f, w, h, dur, []
    pts, sc = scores(f, re.sub(r'\W+', '_', str(f.relative_to(ROOT)))[:80])
    if not pts: return f, w, h, dur, []
    return f, w, h, dur, windows(pts, sc, dur)

def thumb(item):
    path = THUMBS / f"{item['id']}.jpg"
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', str(round(item['t'] + WIN / 2, 2)), '-i', str(ROOT / item['src']),
         '-frames:v', '1', '-vf', f'crop=min(iw\\,ih):min(iw\\,ih),scale={CELL}:{CELL}', '-q:v', '3', str(path)])
    if not path.exists(): return None
    im = Image.open(path).convert('L'); px = im.load(); n = im.size[0]
    rim = [px[x, y] for x in range(n) for y in range(n) if x < 24 or y < 24 or x >= n - 24 or y >= n - 24]
    whole = ImageStat.Stat(im).mean[0]; edge = sum(rim) / len(rim)
    item['lum'] = round(whole); item['rim'] = round(edge)
    item['theme'] = 'dark' if edge < 80 else 'light' if edge > 160 else 'mid'
    return item

files = sorted(p for p in ROOT.rglob('*') if p.suffix.lower() in EXT and not (set(p.relative_to(ROOT).parts[:-1]) & EXCLUDE))
print(f'scout: {len(files)} videos under {ROOT}', flush=True)
items = []
with cf.ThreadPoolExecutor(JOBS) as ex:
    for f, w, h, dur, wins in ex.map(scan_file, files):
        rel = str(f.relative_to(ROOT))
        print(f'  {len(wins):3d} windows · {dur:7.1f} s · {w}x{h} · {rel}', flush=True)
        for win in wins: items.append({'src': rel, 'w': w, 'h': h, 'dur': round(dur, 1), **win})
for i, it in enumerate(items): it['id'] = f'c{i:04d}'
print(f'scout: {len(items)} candidate windows; thumbnails…', flush=True)
with cf.ThreadPoolExecutor(JOBS + 2) as ex:
    items = [it for it in ex.map(thumb, items) if it]

font_path = run(['fc-match', '-f', '%{file}', 'sans']).stdout.strip()
font = ImageFont.truetype(font_path, 13) if font_path else ImageFont.load_default()
per = COLS * ROWS
for s in range(0, len(items), per):
    page = items[s:s + per]; n = s // per
    W = COLS * (CELL + GUT) + GUT; H = ROWS * (CELL + LABEL + GUT) + GUT
    sheet = Image.new('RGB', (W, H), (40, 40, 44)); draw = ImageDraw.Draw(sheet)
    for j, it in enumerate(page):
        x = GUT + (j % COLS) * (CELL + GUT); y = GUT + (j // COLS) * (CELL + LABEL + GUT)
        sheet.paste(Image.open(THUMBS / f"{it['id']}.jpg").convert('RGB'), (x, y))
        tag = Path(it['src']).stem[:14]
        draw.text((x + 2, y + CELL + 3), f"{it['id']} {it['theme'][0].upper()} {tag}", fill=(235, 235, 235), font=font)
        it['sheet'] = f'sheet-{n:02d}.jpg'; it['cell'] = j
    sheet.save(SHEETS / f'sheet-{n:02d}.jpg', quality=88)
(OUT / 'candidates.json').write_text(json.dumps({'root': str(ROOT), 'win': WIN, 'cell': CELL, 'items': items}, indent=0))
themes = {k: sum(1 for it in items if it['theme'] == k) for k in ('dark', 'light', 'mid')}
print(f"scout: {len(items)} candidates from {len({it['src'] for it in items})} videos → {OUT}/candidates.json; sheets: {(len(items) + per - 1) // per}; guessed {themes}", flush=True)
