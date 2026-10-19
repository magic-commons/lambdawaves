# Q6 · GEMMA, HIDDEN — build note (iteration 011, branch `it011-gemma` from 0afba10)

Josh, 2026-10-19: "Also Gemma doesn't seem to appear to work. Isn't she built into the app? Or if not can we just hide the feature for
now until we find out our own lightweight AI assistant in the app?"

## The answer for Josh
**She is not built in.** ASK never had a model inside the app. The page sent your words and its own readouts to a small HTTPS broker on
your desktop (`tools/gemma/broker.py`, `https://<host>:9443/ask`). That broker forwarded them to **Gemma 4 `gemma4:e4b`** running in your
userspace **Ollama** (`~/ollama`; the model is Google's Gemma 4 "effective 4 B", Q4_K_M, 6.6 GB on disk, about 4.8 GB of the RTX 3070's
8 GB at an 8 k context; `gemma4:12b` and `gemma4:e2b` were options). She answered with a JSON list of verbs, and the page ran them through
its own hand roads (`lab/verbs.js`). To work she needed three things:
1. **A local server.** `tools/gemma/start.sh` started Ollama and the broker, and the broker needed the gate server's self-signed
   certificate pair. On the iPad you also had to accept `https://<desktop>:9443/health` once.
2. **A model download.** That was a one-time pull of about 6.6 GB, and the first load from disk took 98 s.
3. **Consent.** The first ASK press showed "sends your words and this project's readouts to <address> on your network · CONTINUE"
   (`askOk`).

When the broker was not running, every ask ended in "Gemma is not reachable at … — start tools/gemma/start.sh". That is what Josh saw.

**What a built-in lightweight assistant would take** (no building done here; the figures are from what I know as of mid-2026, not
measured on this machine). The usual road is in-browser inference over WebGPU, either MLC's WebLLM or transformers.js with its WebGPU
backend, running a small instruction model at 4-bit. A 0.5 B model (Qwen2.5-0.5B class) is about 0.3–0.4 GB to download and under
1 GB of GPU memory. A 1–2 B model (Llama-3.2-1B, Gemma-class 1–2 B) is about 0.7–1.5 GB to download and 1–2 GB of GPU memory. On a
desktop GPU like the 3070, a 1 B model decodes at tens of tokens per second; on an iPad it is slower. λWAVES' job suits a small model,
because the task is mapping words onto the 16 verbs of a fixed table. Constrained JSON decoding (WebLLM's grammar/JSON-schema mode)
holds a small model to the verb schema the broker already builds. The costs:
- The weights can never be precache, which has an 8 MiB ceiling. They would be DATA, like the volumes: fetched on a press, after a
  consent line that states the size, and kept in Cache Storage.
- The model shares the GPU with the field renderer, so a heavy molecule plus a loaded model could run out of GPU memory.
- A 1 B model's prose would be noticeably weaker than e4b's, and the honesty rule (numbers only from INVENTORY) would need the same
  validator.

The idea is feasible as a bounded row, but it is a download-on-demand feature, not something that ships inside the app.

## What was built: ONE flag, nothing deleted
`export const ASK_ENABLED = false;` sits in **`lab/ask.js`** (line 10). It lives there because `ask.js` is the client: the only module
that touches the network for her. It is DOM-free at its top, and the two doors that already import it (`transport.js`,
`settings-card.js`) keep importing from one place. The other two readers (`keys.js`, `settings.js`) import that one module rather than a
shell file. Turning her back on takes one line plus `node tests/pwa.test.mjs --write`, which refreshes the precache hash.

### The doors closed (file:line on this branch)
| door | where | with the flag off |
|---|---|---|
| ASK button + THE TYPE BOX (seat, line, consent note, CONTINUE, the GEMMA echo, `createAsk`) | `lab/shell/transport.js:47-75` (was 31-33 and 50-69) | not mounted. `createAsk` is never called, so `fetch` to `askUrl` cannot happen. `openAsk` is a no-op, and `app.sh.ask` stays `null`. With the flag on, the seat is inserted just before the t readout, which is the same DOM order as 0.6.6 (`transport-typebox-on.png`). |
| the / key row `ask` | `lab/shell/keys.js:51` | not in ACTIONS, so it is not in the kit's table, and the KEYBOARD window lists 96 rows instead of 97, with no "ask Gemma". / is free. |
| a saved `ask` chord | `lab/key-table.js:35-42` (`keep`), `lab/shell/keys.js:128` | kept but inert. The kit drops a saved chord for an id it does not hold on its next save, so `createKeyTable({ keep: ['ask'] })` carries the stored entry through every save exactly as it was stored. It runs nothing and blocks nothing. `keep` defaults to `[]`, and with the flag on it is `[]`, which is the old road byte for byte. |
| SETTINGS › the GEMMA address (`askUrl` input) | `lab/windows/settings-card.js:17-20`; its row `lab/native-ui.js:62` (`if(ui.askUrl)`) | not built, and no empty row is left (the proof reads 0 empty rows). |
| ASK's consent / address in the settings blob | `lab/shell/settings.js:39` (save), `:101` (read, unchanged) | still readable (`ui.askOk` is read). `saveSettings` writes `S0.askOk` / `S0.askUrl`, the stored values, as they were. Nothing new is ever written. Both stay PREFERENCE, and `new-project --check` is in step. |
| menubar / + rows | none mention her (`lab/shell/notebook.js` MENUS has no ASK row; + lists windows) | the proof opens all 6 menus and finds 0 rows naming her |
| the rest of the name | `rack.js:857` is a comment ("Gemma's window list" = the verb's window ids); `lab.css:317-321` styles only the classes the seat sets | untouched; inert without the seat |

**Not touched:** `lab/verbs.js` (the verb table, the inventory, `__LW.verbs`), the notebook's `lw:` links (`shell/notebook.js` `lwLink` →
`app.sh.verbs.run`), CALCULUS' REVIVAL (also a verb list), `tools/gemma/**`, `lab/field.js` (THE LOCK did not move), `lab/mir/**`, `lab/fonts/**`,
the `app` literal (`sh.ask: null` was already a slot).

Docs: `docs/GEMMA.md` (a "Hidden since iteration 011" head), `docs/STATE-SCOPES.md` (the `askOk` / `askUrl` rows say "read and carried, never
written" while the flag is off), and `CLAUDE.md` (the paragraph below).

## The proof (headless Firefox, `research/iteration-011/q6-proof.mjs off|on`, port 9451 / geckodriver 5451)
The proof seeds a stored consent, a stored address `https://gemma.invalid:9443/ask` and a saved `{ ask: ["KeyK"] }`. Then it boots,
photographs the parts, presses / from the stage, opens the KEYBOARD window and SETTINGS (unfolded), opens every menubar menu, changes and
resets another binding, saves the settings, and wraps `fetch` to record every request.

| | flag OFF (shipped) | flag ON (one line flipped, then flipped back) |
|---|---|---|
| transport ASK button / seat / any "Gemma"·"ASK" text | 0 / 0 / none (`transport-off.png`) | 1 / 1 / yes (`transport-on.png`) |
| / from the stage | nothing: no `.asking`, no line, 0 requests | THE TYPE BOX opens, focused (`transport-typebox-on.png`) |
| key table row `ask` · holders of Slash | absent · [] | present · ["ask"] |
| KEYBOARD window | 96 rows, no `ask` row, no "Gemma" (`keyboard-off.png`) | 97 rows, `ask` row listed (`keyboard-on.png`) |
| SETTINGS › DISPLAY | no address input, no "Gemma", 0 empty rows (`settings-off.png`) | the input holds the stored address (`settings-on.png`) |
| menubar (6 menus) rows naming her | 0 | 0 (there never was one) |
| after a binding change + reset + `saveSettings` | `askOk: true`, `askUrl` the seeded string, `keys = { ask: ["KeyK"] }`: carried | `askOk`/`askUrl` as stored. The seeded K chord was dropped by the binding law on read (K is SLAP's), which is today's law. |
| requests made | 0 (none to 9443, `gemma`, `/ask`) | 0 (no ask was sent) |
| `__LW.verbs` (run, inventory, 16 verbs) · page errors | here · none | here · none |

Both runs print GREEN. The shots are in `research/iteration-011/q6-shots/`.

## The gate
- `node tests/pwa.test.mjs --write`: PASS. It refreshed sw.js' hashes for the 7 lab files touched, and the re-run without `--write`
  passes.
- `./test.sh node`: exit 0.
- `node tools/rack-deps.mjs --classes --no-write`: G-G HOLDS (0 bare writes, spectrum 25/25), the app literal has 30 keys, and no member
  is named outside it.
- `node tools/new-project.mjs --check`: in step (16098 B), so the project defaults are unchanged.
- Browser suites (LW_PORT 9451, GD_PORT 5451):
  - Green: `keyboard-window`, `menubar`, `current`, `history`, `lw-links` (the notebook's `lw:` links through the verb table),
    `new-project`, `start`.
  - `latex-copy`: its first seven sections pass, including WAVE DANCER, the copies, the paste and KaTeX. It reds at §8, which expects
    SPECTRUM *folded*, not hidden, under MOLECULES. That is iteration 002's HIDE and is the known stale assertion recorded in
    `research/iteration-009/DEMOS-BUILD.md`, unrelated to ASK.
  - `official-defaults-palette`: reds at its first probe, which looks for a VIVID knob in SETTINGS. VIVID left SETTINGS for MIR OPTIONS
    in iteration 003, so this is pre-existing and unrelated to ASK.
- No ask-specific node suite exists. `grep -l "ask\|verbs" tests/` finds no ASK test, and the verb table is exercised by `lw-links`.

## CLAUDE.md (added after the `lw:` LINKS paragraph)
> GEMMA IS HIDDEN (iteration 011 Q6). Josh 10-19: "Also Gemma doesn't seem to appear to work. Isn't she built into the app? Or if not can
> we just hide the feature for now until we find out our own lightweight AI assistant in the app?" She was never built in: ASK posts to a
> local broker (`tools/gemma`, Ollama's `gemma4:e4b`, `docs/GEMMA.md`). ONE flag, `ASK_ENABLED = false` in `lab/ask.js`, closes every
> door, and nothing is deleted. With the flag off, the transport's ASK button and THE TYPE BOX do not mount (`shell/transport.js`), and
> the / row is not in ACTIONS (`shell/keys.js`), so the KEYBOARD window does not list it. A saved `ask` chord is carried, inert, through
> every save (`key-table.js` `keep`). SETTINGS does not build the GEMMA address (`windows/settings-card.js`, `native-ui.js`). A stored
> `askOk` or `askUrl` is carried by `saveSettings` as it was stored and never written. `createAsk` is never made, so no request can
> leave. THE VERB TABLE and the `lw:` links do not read the flag. To bring her back, flip the flag and run `pwa.test.mjs --write`. The
> proof is `research/iteration-011/q6-proof.mjs off|on`.
