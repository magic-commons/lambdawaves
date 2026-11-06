# tools/diagrams — THE DIAGRAMS (037 D)

A chemist's perspective diagram of every molecule, drawn by RDKit from the molecule's own coordinates: the Picker's DIAGRAM look
(`lab/img/menu/<id>.diagram.svg`), MOLECULES' thumbnail, and a volume's pages (`<shelf>/dist/<vol>/t/diagrams-<page>.json`).
The app ships none of this: Python lives in `tools/diagrams/.venv` (git-ignored), made once with
`uv venv --python 3.12 tools/diagrams/.venv && uv pip install --python tools/diagrams/.venv/bin/python -r tools/diagrams/requirements.txt`
(this machine's Python 3.14 has no ensurepip, so `python3 -m venv` is refused; `uv` is in `~/.local/bin`).

The two commands (the catalogue):

    node tools/diagrams/dump.mjs
    tools/diagrams/.venv/bin/python -I tools/diagrams/draw.py tools/diagrams/catalogue.json

A volume (VOL. I–III; minutes, CPU): `node tools/diagrams/dump.mjs --volume vol-1` then `draw.py tools/diagrams/vol-1.json`
(`--page N` for one page). The contact sheet of the catalogue in both inks: `draw.py --sheet <prefix>` → `<prefix>-dark.jpg`, `<prefix>-light.jpg`.
Every node run under the memory ceiling (`systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 …`), the Python runs too.
