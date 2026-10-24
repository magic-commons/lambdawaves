"""make_title.py — the masthead title art of Paper 4, in the edition's Butler Free SemiBold (the TTF made for Paper 3), white on transparent."""
import os, shutil
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt; from matplotlib import font_manager
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
fp = font_manager.FontProperties(fname=os.path.join(ROOT, '03-LEAK-AND-REPAIR', 'assets', 'Butler-Free-SBd.ttf')); plt.rcParams['pdf.fonttype'] = 42
W, H = 254.6 / 72, 56.6 / 72
fig = plt.figure(figsize=(W, H)); fig.patch.set_alpha(0)
fig.text(0.0, 0.76, 'Knotted Zeros', fontproperties=fp, fontsize=30, color='white', va='center', ha='left')
fig.text(0.0, 0.25, 'in Seven Levels', fontproperties=fp, fontsize=30, color='white', va='center', ha='left')
fig.savefig(os.path.join(HERE, 'paper-04.pdf'), transparent=True, bbox_inches=None, pad_inches=0)
shutil.copy2(os.path.join(HERE, 'paper-04.pdf'), os.path.join(ROOT, 'assets', 'pdf', 'paper-04.pdf')); print('ok')
