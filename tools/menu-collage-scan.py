#!/usr/bin/env python3
"""tools/menu-collage-scan.py — 035 THE MAIN MENU'S COLLAGE, step one: THE SCOUT.

  python3 tools/menu-collage-scan.py [root=~/Videos] [--out .tmp/collage] [--jobs 4]

Every video under root (minus the folders that are not λWAVES) is read once at 96 px / 8 fps for its cut points (scene score > 0.35)
and its motion. Between cuts, windows of 2.4 s become candidates — one per 8 s of clean footage, at most 20 a file, never a still —
each with a centre-square thumbnail (the crop that would ship), a dark/light guess from the crop's rim, and a seat on a contact sheet
of 20 for the eye (a cheap model) to judge by Josh's order: no UI first, no informationals second, no cut inside.
Writes <out>/candidates.json, <out>/thumbs/<id>.jpg and <out>/sheets/sheet-NN.jpg. The eye answers in <out>/verdicts.jsonl (a line a candidate); then
`node tools/menu-collage.mjs cut|atlas` builds the pool and the two atlases. Needs ffmpeg/ffprobe and Pillow at tool time only.

  python3 tools/menu-collage-scan.py --rescore [--out .tmp/collage] [--jobs 8]

036 C1 THE STUTTER MEASURE (Josh 11-03: "inspect some of the videos for stutter and lag … don't confuse them for the incredibly fast rate
motion videos"): no new scene scan — every candidate's window [t, t + 2.4] is decoded at the source's own rate (centre square, 96 px grey)
and each frame's mean |Δ| from the last is read (tblend difference → signalstats YAVG). A frame is NEW when its |Δ| passes the window's
own floor, max(0.15, 0.05 × its 75th-percentile |Δ|): a held frame of an x264 recording is not 0 but carries 0.01–0.14 of residue, so a
fixed 0.02 would call it new. From the new frames' intervals (in source frames): `cadence` = the modal interval (1 = a true 60, 2 = a
30-in-60 recording: both smooth — speed is never stutter, only holds are), `stall` = the share of the window's time inside intervals of
50 ms or more beyond the cadence (3 frames at 60 fps), `run` = the longest interval in ms, `moved` = the 75th-percentile |Δ|. A
window is STUTTERY when it moves (moved > 0.3) and stall ≥ 0.08 or run ≥ 130 ms; a still scene never is. A stuttery window tries up to
four other starts 0.6 s apart inside its cut-free segment (forward from t, then back; a start whose frames hold a cut, scene > 0.35, is
passed over) and keeps the cleanest: a clean one rewrites `t` (the eye's own start kept as `t0`). Each item gains `stutter: { rate,
cadence, stall, run, moved, call }` (call: clean · still · rescued · stuttery); `menu-collage.mjs cut` refuses the stuttery. FILMSTRIPS
for the eye: <out>/strips/<id>.jpg (12 consecutive native frames at 96 px in a row, from just before the longest hold, or mid-window
when clean) for 24 stuttery windows and 12 clean ones, listed in <out>/strips.json with the measure's call and the frames' pattern.
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
RESCORE = '--rescore' in args
if RESCORE: args.remove('--rescore')
OUT = Path(opt('--out', '.tmp/collage')).resolve(); JOBS = int(opt('--jobs', '8' if RESCORE else '4'))
ROOT = Path(args[0] if args else '~/Videos').expanduser().resolve()
WORK, THUMBS, SHEETS = OUT / 'work', OUT / 'thumbs', OUT / 'sheets'
if not RESCORE:
    for d in (WORK, THUMBS, SHEETS): d.mkdir(parents=True, exist_ok=True)

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

# 036 C1 THE STUTTER MEASURE (the head)
MOVES, FLOOR_D, FRAC_D, STALL, RUN_MS, TRIES, STEP, SCENE_CUT = 0.3, 0.15, 0.05, 0.08, 130, 4, 0.6, 0.35
SQ = "crop='min(iw,ih)':'min(iw,ih)',scale=96:96:flags=area"

def native(src, t):
    """the window [t, t + WIN] at the source's own rate → per frame [pts, |Δ| from the last frame, scene score]"""
    out = run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', f'{t:.3f}', '-i', str(ROOT / src), '-t', str(WIN), '-an', '-sn', '-dn',
               '-fps_mode', 'passthrough', '-vf', f"{SQ},select='gte(scene,0)',format=gray,tblend=all_mode=difference,signalstats,metadata=print:file=-",
               '-f', 'null', '-']).stdout
    fr = []
    for line in out.splitlines():
        if line.startswith('frame:'): fr.append([float(line.split('pts_time:')[1]), 0.0, 0.0])
        elif fr and line.startswith('lavfi.signalstats.YAVG='): fr[-1][1] = float(line.split('=')[1])
        elif fr and line.startswith('lavfi.scene_score='): fr[-1][2] = float(line.split('=')[1])
    return fr

def measure(src, t):
    fr = native(src, t)
    if len(fr) < 8: return None
    pts, d = [f[0] for f in fr], [f[1] for f in fr]
    ds = sorted(b - a for a, b in zip(pts, pts[1:])); ok = [x for x in ds if x <= 1.5 * ds[len(ds) // 2]]
    dt = sum(ok) / len(ok) or 1 / 60   # the frame period: the mean step short of a gap (an mkv's 1-ms clock alternates 16 and 17 ms)
    lvl = sorted(d)[int(0.75 * (len(d) - 1))]; floor = max(FLOOR_D, FRAC_D * lvl)
    new = [pts[0] - dt] + [p for p, y in zip(pts, d) if y > floor]   # the window's first frame (before the first difference) is new
    iv = [max(1, round((b - a) / dt)) for a, b in zip(new, new[1:])] + [max(1, round((pts[-1] + dt - new[-1]) / dt))]
    cad = max(set(iv), key=lambda n: (iv.count(n), -n)); long = max(range(len(iv)), key=lambda i: iv[i])
    stall = sum(n for n in iv if (n - cad) * dt >= 0.049) / sum(iv); run_ms = round(max(iv) * dt * 1000)   # a stall: 50 ms or more beyond the cadence
    call = 'still' if lvl <= MOVES else 'stuttery' if stall >= STALL or run_ms >= RUN_MS else 'clean'
    return {'rate': round(1 / dt, 1), 'cadence': cad, 'stall': round(stall, 3), 'run': run_ms, 'moved': round(lvl, 2), 'call': call,
            'cut': max(f[2] for f in fr) > SCENE_CUT, 'hold': new[long] - (pts[0] - dt), 'dt': dt, 'pattern': ''.join('|' if y > floor else '.' for y in d)}

def rescore_one(it):
    t0 = it.get('t0', it['t']); m = measure(it['src'], t0)
    if m is None or m['call'] != 'stuttery': return it, m, t0
    hi = min(it['dur'] - 0.3, t0 - 0.3 + it['segment']) - WIN   # the segment's start is not kept: its farthest end, and the cut test, bound a try
    starts = [t0 + STEP * k for k in range(1, 9) if t0 + STEP * k <= hi] + [t0 - STEP * k for k in range(1, 9) if t0 - STEP * k >= 0]
    best, bt = None, t0   # a rescue is a clean MOVING window (a try that lands on a still is no rescue)
    for t in starts[:TRIES]:
        m2 = measure(it['src'], t)
        if m2 and not m2['cut'] and m2['call'] == 'clean' and (not best or (m2['stall'], m2['run']) < (best['stall'], best['run'])): best, bt = m2, t
    return (it, {**best, 'call': 'rescued'}, bt) if best else (it, m, t0)

def strip(it, m, out):
    """12 consecutive native frames from just before the longest hold (mid-window when clean), 96 px each, in a row → (its start, its pattern)"""
    off = max(0.0, m['hold'] - 3 * m['dt']) if m['call'] == 'stuttery' else 0.6
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', f"{it['t'] + off:.3f}", '-i', str(ROOT / it['src']), '-an', '-sn', '-dn',
         '-fps_mode', 'passthrough', '-vf', f'{SQ},tile=12x1', '-frames:v', '1', '-q:v', '3', str(out)])
    i = round(off / m['dt'])   # pattern[i - 1] is frame i's |Δ| from frame i − 1
    return round(it['t'] + off, 3), m['pattern'][max(0, i):max(0, i) + 11]

def rescore():
    global ROOT
    cand = json.loads((OUT / 'candidates.json').read_text()); items = cand['items']; ROOT = Path(cand['root'])
    verdicts = {}
    if (OUT / 'verdicts.jsonl').exists():
        for line in (OUT / 'verdicts.jsonl').read_text().splitlines():
            if line.strip(): v = json.loads(line); verdicts[v['id']] = v   # a later line amends
    def poolable(it):   # the pool's clean tier (menu-collage.mjs cut): λWAVES, grade ≥ 2, no UI, no informational (an atom's letters are its picture)
        v = verdicts.get(it['id'], {}); info = 0 if v.get('info') == 1 and re.search(r'atom|letter|glyph|symbol', v.get('note') or '', re.I) else v.get('info')
        return v.get('material') == 'lw' and v.get('grade', 0) >= 2 and v.get('ui') == 0 and info == 0
    print(f'rescore: {len(items)} windows at their native rate, {JOBS} at a time…', flush=True)
    keep = {}
    with cf.ThreadPoolExecutor(JOBS) as ex:
        for it, m, t in ex.map(rescore_one, items):
            t0 = it.get('t0', it['t'])
            if m is None: it['stutter'] = None; continue
            if abs(t - t0) > 1e-6: it['t0'] = t0; it['t'] = round(t, 2)
            else: it['t'] = t0; it.pop('t0', None)
            keep[it['id']] = m; it['stutter'] = {k: m[k] for k in ('rate', 'cadence', 'stall', 'run', 'moved', 'call')}
    (OUT / 'candidates.json').write_text(json.dumps(cand, indent=0))
    calls, theme = ('clean', 'still', 'rescued', 'stuttery'), lambda it: verdicts.get(it['id'], {}).get('theme') or it['theme']
    for scope, test in (('every candidate', lambda it: True), ("the pool's clean tier (λWAVES, grade ≥ 2, no UI, no informational)", poolable)):
        print(f'rescore: {scope}:')
        for th in ('dark', 'light', 'mid'):
            mine = [it for it in items if it.get('stutter') and theme(it) == th and test(it)]
            if mine: print(f'  {th:5s} {len(mine):3d}: ' + ' · '.join(f"{c} {sum(1 for it in mine if it['stutter']['call'] == c)}" for c in calls))
    fam = {}
    for it in items:
        if it.get('stutter'): fam.setdefault(it['src'], []).append(it['stutter'])
    worst = sorted(fam.items(), key=lambda kv: (-sum(s['call'] == 'stuttery' for s in kv[1]) / len(kv[1]), -sum(s['stall'] for s in kv[1]) / len(kv[1])))[:10]
    print('rescore: the ten worst families (stuttery / measured · mean stall · longest run):')
    for src, ss in worst:
        print(f"  {sum(s['call'] == 'stuttery' for s in ss):2d}/{len(ss):2d} · {sum(s['stall'] for s in ss) / len(ss):.3f} · {max(s['run'] for s in ss):4d} ms · {src}")
    sd = OUT / 'strips'; sd.mkdir(exist_ok=True)
    for f in sd.glob('*.jpg'): f.unlink()
    def pick(rows, n, per):   # at most `per` windows of one family
        out, seen = [], {}
        for it in rows:
            if len(out) < n and seen.get(it['src'], 0) < per: out.append(it); seen[it['src']] = seen.get(it['src'], 0) + 1
        return out
    st = sorted((it for it in items if it.get('stutter') and it['stutter']['call'] == 'stuttery'), key=lambda it: (not poolable(it), -it['stutter']['stall'], -it['stutter']['run']))
    cl = sorted((it for it in items if it.get('stutter') and it['stutter']['call'] in ('clean', 'rescued')), key=lambda it: (not poolable(it), -it['stutter']['moved']))
    chosen, rows = pick(st, 24, 2) + pick(cl, 12, 1), []
    with cf.ThreadPoolExecutor(JOBS) as ex:
        for it, (at, pat) in zip(chosen, ex.map(lambda it: strip(it, keep[it['id']], sd / f"{it['id']}.jpg"), chosen)):
            rows.append({'id': it['id'], 'src': it['src'], 'from': at, **it['stutter'], 'pattern': pat, 'pool': poolable(it)})
    (OUT / 'strips.json').write_text(json.dumps(rows, indent=1))
    print(f"rescore: {len(rows)} filmstrips → {sd}/<id>.jpg and {OUT}/strips.json (pattern: | a new frame, . a held one)", flush=True)

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

if RESCORE: rescore(); sys.exit(0)

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
