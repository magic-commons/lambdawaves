# Ask Gemma (0.6.6)

## Hidden since iteration 011 (Q6)
Josh, 2026-10-19: "Also Gemma doesn't seem to appear to work. Isn't she built into the app? Or if not can we just hide the feature for
now until we find out our own lightweight AI assistant in the app?" She is not built in, so ASK is hidden behind one flag,
`ASK_ENABLED = false` in `lab/ask.js`. While it is off, the ASK button and the type box do not mount, the / key row is not in the key table,
and SETTINGS does not build the GEMMA address. The page never calls the broker. A stored `askOk` or `askUrl` and a saved `ask` chord are
kept as they were. The verb table (`lab/verbs.js`) and the notebook's `lw:` links work as before. To bring her back, set the flag to
`true` and run `node tests/pwa.test.mjs --write`. Everything below describes her as she works with the flag on.

## What she is
Gemma is a local Gemma 4 model that drives λWAVES through a table of verbs. She runs outside the browser, in Josh's userspace
Ollama (`~/ollama`), behind a small HTTPS broker on the workstation (`tools/gemma/broker.py`). The page sends her your words and the
app's own readouts. She sends back a short JSON list of verbs. The page runs that list through its own hand roads, so one ask is one
history row and undo takes the whole turn back. Nothing leaves your network, and no model weights ever reach the PWA.

## How to start her
```
tools/gemma/start.sh      # Ollama if it is not up; the model if it is not pulled (one download, ≈ 6.6 GB); then the broker
tools/gemma/stop.sh       # the broker only, by its pid (Ollama is left running: Odysseus may be using it)
```
The broker listens on `https://127.0.0.1:9443` (`GEMMA_PORT`); `GEMMA_HOST=0.0.0.0` puts her on the LAN for the iPad (see The LAN). It uses the gate server's certificate pair, found the way
`tools/gate/server.py` finds it: `LW_CERTS`, then `~/.config/lambdawaves/certs`, then `.certs/` at the repo root. If there is no pair,
run `tools/gate/server.py` once and it makes one. The pair is self-signed. On the iPad, open `https://<desktop>:9443/health` once and
accept the certificate, or the page's ask fails at the TLS step. `GET /health` answers `{ ok, model, ollama, pulled }`.

The first load from disk took 98 s on 2026-10-15, so `start.sh` warms the model in the background. Ollama frees the card after 5 idle
minutes, and the next ask reloads it (a few seconds, from the page cache). A warm ask takes about 1 s. The first ask after the prompt
changes takes about 9 s.

## The two preferences (SETTINGS, beside AUDIO)
- **ASK URL** (`askUrl`): where the ASK box sends. Default `https://<the page's host>:9443/ask`, so an iPad that loaded the lab
  from the desktop reaches the desktop's broker.
- **The consent line** (`askOk`): the first ASK press says "sends your words and this project's readouts to <askUrl> on your
  network · CONTINUE". You see it once, until you take it back.

Both are PREFERENCE: never in a project, a link or a history row.

## The model
| tag | on disk | on the RTX 3070 | when |
|---|---|---|---|
| `gemma4:e4b` (default) | 6.6 GB (Q4_K_M, 7.5 B with the embeddings) | ≈ 4.8 GB at an 8 k context | always: it leaves the stage 3 GB |
| `gemma4:12b` | ≈ 7–8 GB | most of the card | only when the stage is light: `GEMMA_MODEL=gemma4:12b tools/gemma/start.sh` |
| `gemma4:e2b` | smaller | less | the fallback `start.sh` tries if e4b will not pull |

The stage and Gemma share 8 GB. A heavy molecule with Gemma loaded can push the card into swapping. If that happens, stop her or let
Ollama's 5 idle minutes free the card. Other knobs: `GEMMA_CTX` (default 8192), `GEMMA_HOST`, and `GEMMA_VERBS` (another verb module,
for tests).

## What she can and cannot do
**Can:** open a new project and build benzene, water, C₆₀ or any library molecule in a basis; switch DENSITY · ORBITAL · Δρ · ESP and
name an orbital; open or close any window; pose the camera, auto-rotate and go home; set RATE within the flash law, play, pause and
scrub; turn LOCATE, PARTICLES, STAGE FORMULA and ATOM LABELS on or off; pick an equalizer preset; write a paragraph on the stage; and
write a block into the notebook using the app's numbers.

**Cannot (0.6.6):** edit the register's amplitudes, route modulation, save or export, change the look, or see the picture. She has
no eyes: the inventory she gets is text. She also cannot claim any number the inventory does not carry.

## The honesty rule
Every number she writes comes from INVENTORY, which is what the app already prints: the molecule head's stem numbers, the STATUS line,
the populated states, the camera pose and the open windows. If a number is not there, she must say she cannot see it and emit the
verb that would show it. A 4 B-class model does not always obey this, so the broker adds two sentences that were tested on 2026-10-15.
The broker also checks every verb against the table before the page sees it. An unknown verb, or an argument outside its enum, is
dropped, and her `say` says so. The page then refuses anything the broker let through that its own table rejects.

The verb table, the reply schema and the catalogue of ids (molecules, presets, windows, views, switches) all reach her system prompt
from `node tools/gemma/verb-doc.mjs`, run once when the broker starts. The prompt cannot drift from the tree. Restart the broker after
the table changes.

## The log
Each turn is one JSON line in `~/.cache/lambdawaves-gemma/log.jsonl`: time, your text (only with `GEMMA_LOG=1`), her `say`, the verbs that passed, the notebook,
the raw answer when the broker changed it, the milliseconds and the model. The broker's own output is in
`~/.cache/lambdawaves-gemma/broker.log`.

## The LAN
The broker binds `127.0.0.1` unless you start her with `GEMMA_HOST=0.0.0.0`, and says LAN OPT-IN when you do. A browser page may ask
only from a loopback origin, this desktop's hostname (or `<hostname>.local`), or an exact origin listed in `GEMMA_ORIGINS`
(comma-separated); any other origin gets 403 and no CORS headers, never `*`. She answers the `Access-Control-Allow-Private-Network`
preflight for the origins she allows, and that header is what lets a page on a PUBLIC address reach a host on your LAN, so list only
origins you serve yourself. Two asks run at once; a third gets 429. Her only routes are `POST /ask` and `GET /health` (plus the CORS
preflight). She reads no files and runs nothing a request names. She has no authentication: on the LAN, anyone on your Wi-Fi can ask
her questions with curl and use your GPU. Stop her when you do not need her (`tools/gemma/stop.sh`).

## Without the model
`node tools/gemma/replay.mjs [--port 9351] [--list file.json]` feeds a canned verb list ("benzene from a new project") to a served page
through `__LW.verbs.run(list, { who: 'REPLAY' })`. It photographs the stage to `.tmp/gemma-replay.png` and prints `inventory()`. If no
server answers on the port, it serves the repo itself and stops that server afterwards.
