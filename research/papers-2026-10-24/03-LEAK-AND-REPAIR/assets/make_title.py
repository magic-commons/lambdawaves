"""make_title.py — the masthead title art of Paper 3, in the edition's Butler Free SemiBold, white on transparent, the reference art's page size."""
import os, shutil
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt; from matplotlib import font_manager
HERE = os.path.dirname(os.path.abspath(__file__))
fp = font_manager.FontProperties(fname=os.path.join(HERE, 'Butler-Free-SBd.ttf')); plt.rcParams['pdf.fonttype'] = 42
W, H = 254.6 / 72, 56.6 / 72
fig = plt.figure(figsize=(W, H)); fig.patch.set_alpha(0)
fig.text(0.0, 0.76, 'The Leak', fontproperties=fp, fontsize=30, color='white', va='center', ha='left')
fig.text(0.0, 0.25, 'and the Repair', fontproperties=fp, fontsize=30, color='white', va='center', ha='left')
fig.savefig(os.path.join(HERE, 'paper-03.pdf'), transparent=True, bbox_inches=None, pad_inches=0)
shutil.copy2(os.path.join(HERE, 'paper-03.pdf'), os.path.join(HERE, '..', '..', 'assets', 'pdf', 'paper-03.pdf')); print('ok')
