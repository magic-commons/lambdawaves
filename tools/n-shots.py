"""n-shots.py — iteration 019 chain N: crop tools/n-probe.mjs `shots` PNGs (.tmp/n-*.png, .tmp/n-rects.json) into small JPEGs.
   python3 -I tools/n-shots.py  → research/iteration-019/N-shots/*.jpg"""
import json, os
from PIL import Image

os.makedirs('research/iteration-019/N-shots', exist_ok=True)
R = json.load(open('.tmp/n-rects.json'))
def box(r, pad=8):
    return (max(0, int(r['left']) - pad), max(0, int(r['top']) - pad), min(1600, int(r['left'] + r['width']) + pad), min(1000, int(r['top'] + r['height']) + pad))
def out(src, name, crop=None, width=900):
    im = Image.open('.tmp/n-' + src + '.png').convert('RGB')
    im = im.crop(crop) if crop else im
    if im.width > width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save('research/iteration-019/N-shots/' + name + '.jpg', quality=78, optimize=True)
out('graph', 'n5-graph-six-nodes', box(R['graph']), 640)
out('menu', 'n5-plus-menu-cost-marks', box(R['menu'], 12), 520)
out('stage', 'n3-grain-vignette-stage', None, 960)
out('card', 'n5-rack-card-column', box(R['card']), 300)
