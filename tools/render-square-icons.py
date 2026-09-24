#!/usr/bin/env python3
"""Render the landing-page λ-and-dot icon for the app's PWA and link preview.

Run with the local scientific Python environment, which has CairoSVG and Pillow:
    ~/bin/scipython tools/render-square-icons.py

The browser favicon SVG is copied from the λWAVES landing page into
lab/img/icon.svg. The maskable SVG uses the same artwork at 80% size so its
foreground remains within the launcher safe zone. PNG corners are flattened
onto the icon's navy ground so every installed-app icon is fully opaque.
"""

from io import BytesIO
from pathlib import Path
import re

import cairosvg
from PIL import Image


images = Path(__file__).resolve().parents[1] / 'lab/img'
source = (images / 'icon.svg').read_text()
background = '#07111e'
path = re.search(r'  <path [^\n]+/>', source)
dot = re.search(r'  <circle [^\n]+/>', source)
if not path or not dot or '<rect width="512" height="512" rx="108" fill="#07111e"/>' not in source:
    raise ValueError('The landing-page SVG artwork changed; review the maskable icon before rendering')

maskable = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="λWAVES">
  <rect width="512" height="512" fill="{background}"/>
  <g transform="translate(256 256) scale(.8) translate(-256 -256)">
{path.group()}
{dot.group()}
  </g>
</svg>
'''
(images / 'icon-maskable.svg').write_text(maskable)

for filename, size, svg in [
    ('icon-192.png', 192, source),
    ('icon-512.png', 512, source),
    ('icon-apple-180.png', 180, source),
    ('icon-maskable-192.png', 192, maskable),
    ('icon-maskable-512.png', 512, maskable),
]:
    rendered = cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size)
    foreground = Image.open(BytesIO(rendered)).convert('RGBA')
    canvas = Image.new('RGBA', (size, size), background)
    canvas.alpha_composite(foreground)
    canvas.convert('RGB').save(images / filename, format='PNG', optimize=True)
    print(f'{filename}: {size}×{size}')
