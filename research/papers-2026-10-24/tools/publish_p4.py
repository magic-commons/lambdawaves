"""publish_p4.py — copies Paper 4 (Draft 01) to the publication desk as its own edition folder, and the proving lab's knots record beside the plan.
Run after build_edition.py 04:  python3 -I tools/publish_p4.py"""
import os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESK = '/home/joshua-hosain/Documents/DATABASE/MATHEMATICS/APPS/LAMBDAWAVES/PUBLICATIONS & DRAFTING'
ED = os.path.join(DESK, 'DRAFTS', 'CLAUDE YAN PAPER 4 — KNOTTED ZEROS IN SEVEN LEVELS — 2026-10-24')
REC = os.path.join(DESK, 'CLAUDE YAN — KNOTTED ZEROS RECORD (the proving lab) — 2026-10-24')
log = []
def put(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst); log.append(os.path.relpath(dst, DESK))
P = os.path.join(ROOT, '04-KNOTTED-ZEROS')
put(os.path.join(P, 'MANUSCRIPT.md'), os.path.join(ED, '04-KNOTTED-ZEROS', 'MANUSCRIPT.md'))
put(os.path.join(P, 'MANUSCRIPT.pdf'), os.path.join(ED, '04-KNOTTED-ZEROS', 'MANUSCRIPT.pdf'))
for f in sorted(os.listdir(os.path.join(P, 'figures'))): put(os.path.join(P, 'figures', f), os.path.join(ED, '04-KNOTTED-ZEROS', 'figures', f))
put(os.path.join(P, 'assets', 'make_title.py'), os.path.join(ED, '04-KNOTTED-ZEROS', 'assets', 'make_title.py'))
put(os.path.join(ROOT, 'output', 'pdf', '04-Knotted-Zeros-in-Seven-Levels.pdf'), os.path.join(ED, 'output', 'pdf', '04-Knotted-Zeros-in-Seven-Levels.pdf'))
for f in sorted(os.listdir(os.path.join(ROOT, 'assets', 'pdf'))): put(os.path.join(ROOT, 'assets', 'pdf', f), os.path.join(ED, 'assets', 'pdf', f))
put(os.path.join(ROOT, 'tools', 'build_edition.py'), os.path.join(ED, 'tools', 'build_edition.py'))
put(os.path.join(ROOT, 'logs', '04-compile.txt'), os.path.join(ED, 'logs', '04-compile.txt'))
K = os.path.join(ROOT, 'knots')
for f in sorted(os.listdir(K)):
    if f.endswith(('.md', '.py', '.json', '.png')): put(os.path.join(K, f), os.path.join(REC, f))
readme = """# Claude Yan — Paper 4, KNOTTED ZEROS IN SEVEN LEVELS — Draft 01, 24 October 2026

The fourth λWAVES paper, by Fable 5.1 (Claude Yan, the prose) and Opus 5.5 (the proving lab: the mathematics, the states, the verification, the figures). Berry's 2001 knotted zeros of hydrogen rebuilt in the register's own conventions to every printed digit (and his equation 4 corrected), and lowered: a Hopf link and a trefoil at n = 4, the cinquefoil at n = 5, 7₁ at n = 6, 9₁ and T(3,7) at n = 7; every T(2,q) up to q = 9 in the register. Level 2 holds no knot; the polynomial knots of optics are not hydrogen states.

- `04-KNOTTED-ZEROS/MANUSCRIPT.md` — the canonical Markdown; `MANUSCRIPT.pdf` and `output/pdf/04-Knotted-Zeros-in-Seven-Levels.pdf` — the compiled paper (10 pages).
- `04-KNOTTED-ZEROS/figures/` — the five figures (the proving lab's, inverted to the edition's white on black).
- `tools/build_edition.py` — the exporter (`build_edition.py 04`); `assets/pdf/paper-04.pdf` the title art (`make_title.py`).
- Every coefficient, number and proof is in `../../CLAUDE YAN — KNOTTED ZEROS RECORD (the proving lab) — 2026-10-24/` (`KNOTS.md`, `knots.py`, `knots.json`): the states are in `knots.json → states.<key>.preset_modes` as a `modes` list for `lab/state.js`.

Draft 01 has had no independent re-computation, no second reader and no forward-citation search on Berry 2001; the paper's status table says so. The plan it comes from is `../../CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md`, §3.2.
"""
os.makedirs(ED, exist_ok=True); open(os.path.join(ED, 'README.md'), 'w').write(readme); log.append('README.md')
print('\n'.join(log)); print(len(log), 'files')
