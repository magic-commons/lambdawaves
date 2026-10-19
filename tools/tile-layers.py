"""tools/tile-layers.py — THE LAYER COUNT (iteration 011 Q3): how many radial layers a half-cut atomic tile SHOWS.

    python3 -I tools/tile-layers.py DIR [--nuclei DIR/nuclei.json] [--only el-Fe,orb-5s_0] [--min 1.5] [--json OUT]

A tile from tools/menu-thumbs.mjs draws Im psi in SIGNED (or SHELL +-): the two signs of the wave are two opposite hues of the wheel.  The
cut through the nucleus shows each radial lobe as a ring, and neighbouring lobes have opposite signs, so the layers are counted as SIGN
RUNS along a ray from the nucleus outward:
  - the sign axis is found from the tile itself (the doubled-angle mean of the opaque pixels' hues, weighted by saturation), and a pixel's
    sign is the side of that axis its hue falls on; a pixel under 35 % alpha or 18 % saturation is no sign (a node's gap, the ground);
  - 72 rays, 0.5 px steps, from the nucleus (menu-thumbs' --nuclei, else the tile's centre) to the corner; signless samples are dropped,
    a run shorter than --min px (default 1.5) is folded into its neighbours (an edge pixel, not a layer), and the runs are counted;
  - the tile's count is the most common count over the rays (ties to the larger), with the spread reported.
An ns orbital has n - 1 radial nodes, so its tile should show n layers.  Prints one line per tile; --json writes them all.
"""
import sys, os, json, math, colorsys
from PIL import Image

args = sys.argv[1:]
def opt(k, d=None):
    return args[args.index('--' + k) + 1] if '--' + k in args else d
d = args[0]
nuc = json.load(open(opt('nuclei'))) if opt('nuclei') and os.path.exists(opt('nuclei')) else {}
only = opt('only', '').split(',') if opt('only') else None
MINRUN = round(2 * float(opt('min', '1.5')))
names = sorted(f[:-5] for f in os.listdir(d) if f.endswith('.webp') and (not only or f[:-5] in only))


def count(name):
    im = Image.open(os.path.join(d, name + '.webp')).convert('RGBA')
    W, H = im.size
    px = im.load()
    hs = {}
    cx = cy = 0.0
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a < 90:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.18:
                continue
            hs[(x, y)] = h
            cx += s * math.cos(4 * math.pi * h)
            cy += s * math.sin(4 * math.pi * h)
    axis = math.atan2(cy, cx) / 2                                  # the sign axis (an undirected line on the hue circle)

    def sign(x, y):
        h = hs.get((x, y))
        return None if h is None else (1 if math.cos(2 * math.pi * h - axis) > 0 else -1)
    fx, fy = nuc.get(name, [0.5, 0.5])
    ox, oy = fx * W, fy * H
    counts = []
    for k in range(72):
        t = 2 * math.pi * k / 72
        seq = []
        for i in range(int(W * 1.5 * 2)):
            rr = i * 0.5
            x, y = int(ox + rr * math.cos(t)), int(oy + rr * math.sin(t))
            if not (0 <= x < W and 0 <= y < H):
                break
            s = sign(x, y)
            if s is not None:
                seq.append(s)
        runs = []                                                  # [sign, length in samples]
        for s in seq:
            if runs and runs[-1][0] == s:
                runs[-1][1] += 1
            else:
                runs.append([s, 1])
        changed = True
        while changed and len(runs) > 1:                           # fold a run under --min px (1.5: 3 samples) into its neighbours
            changed = False
            for j, (s, n) in enumerate(runs):
                if n < MINRUN:
                    runs.pop(j)
                    if 0 < j < len(runs) and runs[j - 1][0] == runs[j][0]:
                        runs[j - 1][1] += runs.pop(j)[1]
                    changed = True
                    break
        counts.append(len(runs))
    best = max(set(counts), key=lambda c: (counts.count(c), c))
    return {'tile': name, 'layers': best, 'rays': counts.count(best), 'min': min(counts), 'max': max(counts)}


out = [count(n) for n in names]
for r in out:
    print(f"{r['tile']:>12}  {r['layers']} layers  ({r['rays']}/72 rays; {r['min']}–{r['max']})")
if opt('json'):
    json.dump(out, open(opt('json'), 'w'), indent=1)
