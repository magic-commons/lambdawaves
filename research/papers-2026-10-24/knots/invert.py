"""invert.py — the proving lab's figures were drawn on white; the edition is white on black. Invert each PNG (white → black, the red curves → cyan,
the blue second components → orange) into ../04-KNOTTED-ZEROS/figures/."""
import os
from PIL import Image, ImageOps
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', '04-KNOTTED-ZEROS', 'figures'); os.makedirs(OUT, exist_ok=True)
names = {'fig_table_knots.png': 'p4_fig1_gallery.png', 'fig_trefoils_3d.png': 'p4_fig2_trefoils.png', 'fig_trefoil_projection.png': 'p4_fig3_projection.png',
         'fig_hopf_3d.png': 'p4_fig4_hopf.png', 'fig_radial_profile.png': 'p4_fig5_radial.png'}
for src, dst in names.items():
    im = Image.open(os.path.join(HERE, src)).convert('RGB'); ImageOps.invert(im).save(os.path.join(OUT, dst)); print(dst, im.size)
