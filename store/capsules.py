#!/usr/bin/env python3
"""capsules.py — DRAFT capsules from a real field still (store/steam/capsules/src-*.png, made by `node store/shots.mjs --art`)
plus the λ mark keyed out of lab/img/icon-512.png and "WAVES" set in the app's own LW Title face.  No text but the name.
Gemini/Josh replace these; they exist so the store pages can be filled and reviewed today.   python3 store/capsules.py"""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageFont, ImageDraw

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
SRC = HERE / 'steam/capsules/src-field-wave-dancer.png'
ICON = REPO / 'lab/img/icon-512.png'
FONT = REPO / 'lab/fonts/LWTitle-title.woff2'
ICON_BG = (7, 17, 30)


def field_box(im):
    """bounding box of whatever is not the stage's flat background (sampled at the corner)"""
    bg = Image.new('RGB', im.size, im.getpixel((8, 8)))
    diff = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 18 else 0)
    return diff.filter(ImageFilter.MaxFilter(9)).getbbox()


def framed(im, size, fx, fy, fill):
    """crop `im` to `size`'s aspect so the field's centre lands at (fx, fy) of the frame and the field fills `fill` of its height"""
    W, H = size
    x0, y0, x1, y1 = field_box(im)
    ch = (y1 - y0) / fill
    cw = ch * W / H
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left, top = cx - fx * cw, cy - fy * ch
    bg = Image.new('RGB', (round(cw), round(ch)), im.getpixel((8, 8)))
    bg.paste(im, (round(-left), round(-top)))   # pads with the stage colour if the frame runs past the still
    return bg.resize(size, Image.LANCZOS)


def lam():
    """the λ + dot from the app icon, its navy keyed to transparency"""
    ic = Image.open(ICON).convert('RGB')
    out = Image.new('RGBA', ic.size)
    px, po = ic.load(), out.load()
    for y in range(ic.height):
        for x in range(ic.width):
            p = px[x, y]
            a = min(1.0, max(abs(p[i] - ICON_BG[i]) for i in range(3)) / 150)
            if a > 0.02:
                po[x, y] = tuple(round(min(255, max(0, (p[i] - ICON_BG[i] * (1 - a)) / a))) for i in range(3)) + (round(a * 255),)
    return out.crop(out.getbbox())


def wordmark(h):
    """λ mark + WAVES (LW Title, white, the header's letter-spacing), `h` px tall"""
    font = ImageFont.truetype(str(FONT), round(h * 0.78))
    l0, t0, r0, b0 = font.getbbox('WAVES')
    track = round(h * 0.06)
    tw = sum(font.getbbox(c)[2] - font.getbbox(c)[0] for c in 'WAVES') + track * 4
    L = lam()
    L = L.resize((round(L.width * h / L.height), h), Image.LANCZOS)
    img = Image.new('RGBA', (L.width + round(h * 0.06) + tw, h))
    img.alpha_composite(L, (0, 0))
    d, x = ImageDraw.Draw(img), L.width + round(h * 0.06)
    for c in 'WAVES':
        cb = font.getbbox(c)
        d.text((x - cb[0], h - b0 + round(h * 0.02)), c, font=font, fill=(255, 255, 255, 255))   # baseline on the λ's foot
        x += cb[2] - cb[0] + track
    return img


def compose(size, fx, fy, fill, mark_h, mx, my, name):
    base = framed(Image.open(SRC).convert('RGB'), size, fx, fy, fill).convert('RGBA')
    wm = wordmark(mark_h)
    glow = Image.new('RGBA', base.size)
    glow.alpha_composite(Image.new('RGBA', wm.size, (0, 0, 0, 150)), (round(mx * size[0] - wm.width / 2), round(my * size[1] - wm.height / 2)))
    base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(mark_h * 0.6)))
    base.alpha_composite(wm, (round(mx * size[0] - wm.width / 2), round(my * size[1] - wm.height / 2)))
    out = base.convert('RGB')   # no alpha: Play's feature graphic and Apple's rules both forbid it; Steam does not care
    path = HERE / name
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, optimize=True)
    print(f'{path.relative_to(REPO)}  {out.size[0]}×{out.size[1]}  {path.stat().st_size} B')


# Steam (partner.steamgames.com/doc/store/assets, read 2026-09-24): header capsule 920×430, library capsule 600×900
compose((920, 430), 0.22, 0.50, 0.84, 92, 0.70, 0.50, 'steam/capsules/header-capsule-920x430-DRAFT.png')
compose((600, 900), 0.50, 0.40, 0.46, 92, 0.50, 0.80, 'steam/capsules/library-capsule-600x900-DRAFT.png')
# Google Play (support.google.com/googleplay/android-developer/answer/9866151, read 2026-09-24): feature graphic 1024×500, 24-bit, no alpha
compose((1024, 500), 0.22, 0.50, 0.84, 100, 0.70, 0.50, 'play/feature-graphic-1024x500-DRAFT.png')
# Google Play app icon (same page): "32-bit PNG (with alpha)", 512×512 — the app's own icon, still opaque, re-saved with an alpha channel
icon = HERE / 'play/icon-512-32bit.png'
Image.open(ICON).convert('RGBA').save(icon, optimize=True)
print(f'{icon.relative_to(REPO)}  512×512 RGBA  {icon.stat().st_size} B')
