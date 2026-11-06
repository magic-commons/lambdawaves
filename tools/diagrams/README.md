# tools/diagrams — THE DIAGRAMS (037 D · 038 D)

A chemist's perspective diagram of every molecule, drawn by RDKit from the molecule's own coordinates: the Picker's DIAGRAM look
(`lab/img/menu/<id>.diagram.svg`), MOLECULES' thumbnail, and a volume's pages (`<shelf>/dist/<vol>/t/diagrams-<page>.json`).
A drawing is kept only when it reads (THE ACCEPTANCE RULE: a skeletal formula, the better of CoordGen's and RDKit's template layout,
at ≤ 3 crossings and at most one clash that touches no letter; a perspective drawing at ≤ 2 and none); what no layout draws cleanly —
C₆₀, B₁₂H₁₂²⁻, Li₄F₄, the ice hexamer, the diamondoids — is THE INK STICKS, its 3-D skeleton with no letters, in the same file.
Each run prints its count by road and names the molecules that took the sticks (`docs/laws/chemistry.md` THE DIAGRAMS' PIPELINE).
The app ships none of this: Python lives in `tools/diagrams/.venv` (git-ignored), made once with
`uv venv --python 3.12 tools/diagrams/.venv && uv pip install --python tools/diagrams/.venv/bin/python -r tools/diagrams/requirements.txt`
(this machine's Python 3.14 has no ensurepip, so `python3 -m venv` is refused; `uv` is in `~/.local/bin`).

The two commands (the catalogue):

    node tools/diagrams/dump.mjs
    tools/diagrams/.venv/bin/python -I tools/diagrams/draw.py tools/diagrams/catalogue.json

A volume (VOL. I–III; under a minute each, CPU): `node tools/diagrams/dump.mjs --volume vol-1` then `draw.py tools/diagrams/vol-1.json`
(`--page N` for one page; `LW_VOLUMES=<dir>` writes under `<dir>/dist` instead of the shelf — a dry run). The contact sheet of the
catalogue in both inks: `draw.py --sheet <prefix>` → `<prefix>-dark.jpg`, `<prefix>-light.jpg`.
ONE WRITER PER VOLUME: `t/pages.json` is written whole by draw.py (`diagrams`) and by `tools/volume-thumbs.mjs` (`sheets`); never run
draw.py on a volume while its sheets are being drawn.
Every node run under the memory ceiling (`systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 …`), the Python runs too.
