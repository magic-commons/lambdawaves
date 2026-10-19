"""F2 (scratch): crop the probe's element rects out of the driver's full-page shots and lay them side by side."""
import json, sys
from PIL import Image, ImageDraw
SRC, OUT = sys.argv[1], sys.argv[2]   # .tmp/f2, research/iteration-009/f2-shots

def crop(tag, name, pad=6, z=1):
    r = json.load(open(f'{SRC}/{tag}/rect-{name}.json'))
    x, y, w, h, d = r
    im = Image.open(f'{SRC}/{tag}/full-{name}.png').convert('RGB')
    c = im.crop((max(0, int((x - pad) * d)), max(0, int((y - pad) * d)), int((x + w + pad) * d), int((y + h + pad) * d)))
    return c.resize((c.width * z, c.height * z), Image.NEAREST) if z > 1 else c

def label(im, text, band=22):
    w = max(im.width, int(ImageDraw.Draw(im).textlength(text)) + 12)
    out = Image.new('RGB', (w, im.height + band), (24, 26, 30))
    out.paste(im, (0, band)); ImageDraw.Draw(out).text((6, 5), text, fill=(235, 235, 235)); return out

def row(ims, gap=12):
    W = sum(i.width for i in ims) + gap * (len(ims) - 1); H = max(i.height for i in ims)
    out = Image.new('RGB', (W, H), (12, 13, 15)); x = 0
    for i in ims: out.paste(i, (x, 0)); x += i.width + gap
    return out

def col(ims, gap=12):
    W = max(i.width for i in ims); H = sum(i.height for i in ims) + gap * (len(ims) - 1)
    out = Image.new('RGB', (W, H), (12, 13, 15)); y = 0
    for i in ims: out.paste(i, (0, y)); y += i.height + gap
    return out

# 1 · SPECTRUM's fill button before / after, beside the register's
col([
    row([label(crop('before', 'spectrum-head-empty-shown'), 'BEFORE · SPECTRUM head (register populated): EMPTY in words'),
         label(crop('before', 'spectrum-head-fill-shown'), 'BEFORE · SPECTRUM head (register empty): FILL ALL in words')]),
    row([label(crop('after', 'spectrum-head-empty-shown'), 'AFTER · SPECTRUM head (populated): the EMPTY glyph'),
         label(crop('after', 'spectrum-head-fill-shown'), 'AFTER · SPECTRUM head (empty): the FILL ALL glyph')]),
    label(crop('after', 'orbital-head'), 'the register (MOLECULES · ORBITAL pane head): its EMPTY glyph, the same source (paint-stroke.js fillButton)'),
]).save(f'{OUT}/1-fill-button.png')

# 2 · the three ladders side by side, before and after
for tag in ('before', 'after'):
    row([label(crop(tag, 'spectrum-ladder-filled', z=2), f'{tag.upper()} · SPECTRUM (FILL ALL: every level on)'),
         label(crop(tag, 'spectrum-ladder', z=2), f'{tag.upper()} · SPECTRUM (boot preset)'),
         label(crop(tag, 'orbital-ladder', z=2), f'{tag.upper()} · ORBITAL (H2O, HOMO lit)'),
         label(crop(tag, 'states-ladder', z=2), f'{tag.upper()} · STATES (H2O, BEAT)')]).save(f'{OUT}/2-ladders-{tag}.png')
col([Image.open(f'{OUT}/2-ladders-before.png'), Image.open(f'{OUT}/2-ladders-after.png')]).save(f'{OUT}/2-ladders.png')

# 3 · a saved STATES MORPH project reopened
row([label(crop('after', 'states-morph-hand'), 'MORPH set by hand: lanes dimmed (.reg-morphing, opacity .45)'),
     label(crop('before', 'states-morph-restored'), 'BEFORE · the project reopened: MORPH on, lanes NOT dimmed'),
     label(crop('after', 'states-morph-restored'), 'AFTER · the project reopened: MORPH on, lanes dimmed')]).save(f'{OUT}/3-morph-restored.png')
print('ok')
