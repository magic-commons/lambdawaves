#!/usr/bin/env python3
"""tools/tip-qr.py — THE TIP JAR's picture (030): the donation link as a colorful QR, and the one constant that names the link.

    python3 tools/tip-qr.py https://ko-fi.com/<name>     writes lab/img/tip-qr.svg and sets TIP_URL in lab/picker.js to the same link
    python3 tools/tip-qr.py --out F URL                  writes the picture to F only (a preview); lab/ is not touched

Needs the `qrcode` package at tool time only (any Python that has it; the app ships the SVG, never a QR library). The code is level Q
(25 % of it can be lost), so the heart over its centre and the round dots still scan; the dots are dark (each stop of the gradient is
under 0.2 relative luminance) on white, with the standard four-module quiet zone. After a run: node tests/pwa.test.mjs --write.
"""
import re, sys
from pathlib import Path

try:
    import qrcode
except ImportError:
    sys.exit("tip-qr: needs the qrcode package (pip install qrcode, in any Python; the app never ships it)")

ROOT = Path(__file__).resolve().parent.parent
args = sys.argv[1:]
out = None
if args[:1] == ["--out"]:
    out, args = Path(args[1]), args[2:]
if len(args) != 1 or not re.fullmatch(r"https://[A-Za-z0-9.-]+/[A-Za-z0-9._~/-]*", args[0]):
    sys.exit("usage: tools/tip-qr.py [--out FILE] https://ko-fi.com/<name>")
url = args[0]

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=0)
qr.add_data(url)
qr.make(fit=True)
m = qr.get_matrix()
n, q = len(m), 4                                   # modules, quiet zone
size = n + 2 * q
finders = [(0, 0), (0, n - 7), (n - 7, 0)]         # (row, col) of the three 7x7 finder patterns
in_finder = lambda r, c: any(fr <= r < fr + 7 and fc <= c < fc + 7 for fr, fc in finders)
h = 7 if n >= 33 else 5                            # the heart's clear square, in modules (always odd, centred)
h0 = (n - h) // 2
in_heart = lambda r, c: h0 - 1 <= r <= h0 + h and h0 - 1 <= c <= h0 + h

parts = []
for r in range(n):
    for c in range(n):
        if m[r][c] and not in_finder(r, c) and not in_heart(r, c):
            parts.append(f'<circle cx="{c + q + .5}" cy="{r + q + .5}" r=".46"/>')
for fr, fc in finders:
    x, y = fc + q, fr + q
    parts.append(f'<rect x="{x + .5}" y="{y + .5}" width="6" height="6" rx="1.9" fill="none" stroke="url(#g)" stroke-width="1"/>')
    parts.append(f'<rect x="{x + 2}" y="{y + 2}" width="3" height="3" rx="1"/>')
cx = cy = q + n / 2
s = h / 7                                           # the heart scales with its square
heart = (f'M{cx} {cy + 2.6 * s} C{cx - 4.2 * s} {cy - .2 * s} {cx - 2.6 * s} {cy - 3.4 * s} {cx} {cy - 1.5 * s} '
         f'C{cx + 2.6 * s} {cy - 3.4 * s} {cx + 4.2 * s} {cy - .2 * s} {cx} {cy + 2.6 * s}Z')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="geometricPrecision">'
       f'<!-- tools/tip-qr.py: {url} · version {qr.version} · level Q -->'
       f'<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="{q}" y1="{q}" x2="{size - q}" y2="{size - q}">'   # one sweep across the code, not one per dot
       '<stop offset="0" stop-color="#d1146a"/><stop offset=".5" stop-color="#6d28d9"/><stop offset="1" stop-color="#0e7490"/>'
       '</linearGradient></defs>'
       f'<rect width="{size}" height="{size}" rx="{q}" fill="#fff"/>'
       f'<g fill="url(#g)">{"".join(parts)}</g>'
       f'<path d="{heart}" fill="#ff4f9a"/>'
       '</svg>\n')

if out:
    out.write_text(svg, encoding="utf-8")
    print(f"tip-qr: {out} (preview; lab/ untouched) · {url} · version {qr.version}, {n}x{n} modules")
    sys.exit(0)

(ROOT / "lab/img/tip-qr.svg").write_text(svg, encoding="utf-8")
picker = ROOT / "lab/picker.js"
src = picker.read_text(encoding="utf-8")
new, k = re.subn(r"^const TIP_URL = '[^']*';", f"const TIP_URL = '{url}';", src, count=1, flags=re.M)
if k != 1:
    sys.exit("tip-qr: lab/picker.js has no `const TIP_URL = '…';` line")
picker.write_text(new, encoding="utf-8")
print(f"tip-qr: lab/img/tip-qr.svg + TIP_URL in lab/picker.js · {url} · version {qr.version}, {n}x{n} modules. Next: node tests/pwa.test.mjs --write")
