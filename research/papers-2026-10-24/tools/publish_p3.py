"""publish_p3.py — copies Paper 3 (Draft 01) to the publication desk as its own edition folder, and refreshes the pilot folder there.
Run after build_edition.py 03:  python3 -I tools/publish_p3.py"""
import os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESK = '/home/joshua-hosain/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING'
ED = os.path.join(DESK, 'DRAFTS', 'CLAUDE YAN PAPER 3 — THE LEAK AND THE REPAIR — 2026-10-24')
PILOT = os.path.join(DESK, 'CLAUDE YAN — THE LEAK AND THE REPAIR PILOT — 2026-10-24')
log = []
def put(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst); log.append(os.path.relpath(dst, DESK))
# the paper
P = os.path.join(ROOT, '03-LEAK-AND-REPAIR')
put(os.path.join(P, 'MANUSCRIPT.md'), os.path.join(ED, '03-LEAK-AND-REPAIR', 'MANUSCRIPT.md'))
put(os.path.join(P, 'MANUSCRIPT.pdf'), os.path.join(ED, '03-LEAK-AND-REPAIR', 'MANUSCRIPT.pdf'))
for f in sorted(os.listdir(os.path.join(P, 'figures'))): put(os.path.join(P, 'figures', f), os.path.join(ED, '03-LEAK-AND-REPAIR', 'figures', f))
put(os.path.join(P, 'assets', 'make_title.py'), os.path.join(ED, '03-LEAK-AND-REPAIR', 'assets', 'make_title.py'))
put(os.path.join(ROOT, 'output', 'pdf', '03-The-Leak-and-the-Repair.pdf'), os.path.join(ED, 'output', 'pdf', '03-The-Leak-and-the-Repair.pdf'))
for f in sorted(os.listdir(os.path.join(ROOT, 'assets', 'pdf'))): put(os.path.join(ROOT, 'assets', 'pdf', f), os.path.join(ED, 'assets', 'pdf', f))
put(os.path.join(ROOT, 'tools', 'build_edition.py'), os.path.join(ED, 'tools', 'build_edition.py'))
put(os.path.join(ROOT, 'logs', '03-compile.txt'), os.path.join(ED, 'logs', '03-compile.txt'))
put(os.path.join(ROOT, 'logs', 'build_summary.json'), os.path.join(ED, 'logs', 'build_summary.json'))
# the pilot folder, refreshed with the ladder and benzene work
L = os.path.join(ROOT, 'leak')
for f in sorted(os.listdir(L)):
    if f.endswith(('.md', '.py', '.sh', '.json', '.png')): put(os.path.join(L, f), os.path.join(PILOT, f))
readme = """# Claude Yan — Paper 3, THE LEAK AND THE REPAIR — Draft 01, 24 October 2026

The third λWAVES paper, by Fable 5.1 (Claude Yan): the continuity source of the second paper drawn as a field, split exactly into a frozen-exchange part and a finite-basis part, and repaired by the smallest confined potential flow; the net flow of the repaired current depends on the walls (closed: the dipole rate exactly; open: unchanged; free space: one third); water up the basis ladder and benzene's π packet.

- `03-LEAK-AND-REPAIR/MANUSCRIPT.md` — the canonical Markdown (the exporter's grammar); `MANUSCRIPT.pdf` and `output/pdf/03-The-Leak-and-the-Repair.pdf` — the compiled paper (10 pages).
- `03-LEAK-AND-REPAIR/figures/` — the three figures, drawn by the pilot folder's scripts from the computed fields.
- `tools/build_edition.py` — the review's exporter, extended to a third paper with its own byline and edition (`build_edition.py 03`); `assets/pdf/` the edition's logo art and `paper-03.pdf`, the title art (`make_title.py`, Butler Free SemiBold).
- Every number is in `../../CLAUDE YAN — THE LEAK AND THE REPAIR PILOT — 2026-10-24/` (`leak_repair.py` for the exported water record, `leak_any.py` for any catalogue molecule and basis, the result files `leak_*.json`, the figures' scripts, `LEAK-AND-REPAIR.md` the pilot's record).

Draft 01 has had no independent re-computation and no second reader; the paper's status table says so. The plan it comes from is `../../CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`, §3.1.
"""
os.makedirs(ED, exist_ok=True); open(os.path.join(ED, 'README.md'), 'w').write(readme); log.append('README.md')
print('\n'.join(log)); print(len(log), 'files')
