# 0.6.6-alpha "Ask Gemma" — what changed (Claude Yan / Fable 5.1, 2026-10-15)

Josh's word (16:00): "Let's do the gemma model! It should be fun. The transport window should act as the type box." Three Opus builders from the 0.6.5 cut tip
`3a86298`; merged G3 `7d9a0e0`, G1 `adb7294`, G2 `613e5bf`. Build notes: `G1-BUILD.md`, `G2-BUILD.md`, `G3-BUILD.md`. Plan: `BUILD-PLAN.md`. Doc: `docs/GEMMA.md`.

## The shape
Gemma never touches the DOM. She emits verbs from a WHITELIST; the app runs them through its own hand roads; one ask is ONE undoable history row ("GEMMA · molecule
c6h6"); every number she writes comes from the app's INVENTORY (the molecule head's stem numbers, the STATUS line, the states' prose, REPEATS, the camera, the open
windows, the notebook's tail) — never from her weights. She runs outside the browser: a local Gemma 4 behind a LAN HTTPS broker on the workstation; the PWA stays
weight-free; nothing leaves the network.

## G1 · THE VERB TABLE + THE INVENTORY (`lab/verbs.js`, one seat in `lab/rack.js`, `lab/shell/notebook.js`, `lab/shell/facade.js`, one hook in `lab/windows/spectrum.js`)
- Twelve verbs, each `{ id, args, doc, run }`: preset · molecule (id, basis?, view?, orbital?) · view · window (open/close, side) · camera (yaw, pitch, zoom, fov,
  autoRotate, home — clamped to the port's ranges) · rate (clamped; a value the flash law would hold is REFUSED and said) · play · scrub · switch (locate ·
  particles · formula · labels · equalizer) · say (the stage's informational block, held like THE HEAD) · notebook (appended to the project's page 0 through the
  notebook's own road) · new (FILE › NEW's road, which asks before discarding unsaved work).
- `run(list, { who })` refuses an unknown verb, arg, type or id with a sentence, runs in order awaiting a molecule's solve, and holds the ring for the whole list
  so one ask is one row. `inventory()` prints only what the app already prints. The `lw:` link runner now goes through the table (one table; its own row name
  kept). `__LW.verbs` on the facade (`lw-facade.json` +1 row). Node-safe, so the broker generates her prompt from the table itself.
- **Checked:** the demo list from NEW — benzene solved (21 of 36), the stage paragraph, the notebook block, history exactly [new project, GEMMA · molecule c6h6],
  inventory E −227.891006 · gap 0.5516 Eh · D6h · HOMO 1e1g; three bad verbs refused with sentences. lw-links · history · lw-facade green.

## G2 · THE TYPE BOX + THE CLIENT (`lab/shell/transport.js`, `lab/ask.js`, `lab/shell/keys.js`, `lab/windows/settings-card.js`, `lab/shell/settings.js`, `lab/native-ui.js`, 4 rules in `lab.css`)
- **The transport strip is the type box.** ASK (after JUMP) or the `/` key swaps the strip's centre (t, REPEATS, the formula) for one input, in the floating pill
  and the docked card; Enter sends, Escape returns, "…" while in flight; her answer is echoed in the t seat as GEMMA for 4 s and held on the stage until Escape or
  the next ask. Refused verbs are said as "(dropped: …)". An unreachable broker is said in the strip and METERS, never thrown.
- **Consent:** the first ASK press shows "sends your words and this project's readouts to <askUrl> on your network · CONTINUE" (PREFERENCE `askOk`); PREFERENCE
  `askUrl` is a text field in SETTINGS beside AUDIO, default `<the page's scheme>//<host>:9443/ask` computed and never stored. Both PREFERENCE, never in a project
  (serialize-bytes 11/11 identical; settings-probe 0/6 red). `ask` is not on the facade (one line + a re-capture when wanted).
- **Checked (headless, a stub table):** 18/18 — consent then CONTINUE, the stub receiving the verbs with `who: GEMMA`, the stage holding the say, the swap
  returning after 4 s, `/` opening without typing a slash, the unreachable line, the docked card carrying the box.

## G3 · THE BROKER (`tools/gemma/`, zero `lab/` lines; `docs/GEMMA.md`)
- `broker.py` (Python stdlib): HTTPS 9443 on the gate server's own cert road, `POST /ask` → Ollama `/api/chat` with `gemma4:e4b` (env `GEMMA_MODEL`), the reply
  schema as Ollama's `format` (so a 4B-class model emits valid verbs), the system prompt GENERATED at start from `lab/verbs.js` and the tree's catalogue by
  `verb-doc.mjs` (molecule, preset, window, view, switch ids) plus the grounding law and two sharpening sentences; verbs validated and case-corrected before
  answering; one JSON line per turn in `~/.cache/lambdawaves-gemma/log.jsonl`; 503s that name `start.sh` or the pull. `start.sh` brings the userspace Ollama up,
  pulls and warms the model, starts the broker by pid; `stop.sh` stops the broker only. `replay.mjs` is the no-model prototype.
- **The model:** `gemma4:e4b`, 6.6 GB on disk (Q4_K_M), pulled in 1 min 40 s; 4.5–4.9 GB on the card (nvidia-smi 945 → 5,490 MiB; the stage keeps ≈ 2.7 GB);
  a warm ask ≈ 1–2 s, a cold first load ≈ 100 s (warmed at start).

## The light check (existing gates only) and the live loop
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds (SPECTRUM at 25); lw-links · history · menubar green on
  the merged tree; **THE LOCK ×2 GREEN** at `613e5bf`: 860 values 0/0 (59 s), the 1004-value fixture 0/0 (59 s).
- **`tools/gemma/replay.mjs` (no model) on the merged tree:** benzene built from a new project through the verbs alone; the inventory reads view density and the
  notebook block; a screenshot in `.tmp/gemma-replay.png`.
- **The live loop (the real model, the page's inventory → the broker → her verbs run in the page):** "what does benzene look like?" → `molecule C6H6 sto-3g
  density`, benzene on the stage, 2.0 s · "what is its energy and its HOMO–LUMO gap?" → no verb, "The energy of benzene is -227.891006 Hartrees, and the HOMO-LUMO
  gap is 0.5516 Hartrees" — both from the inventory, nothing invented, 0.9 s · "show me water and slow it down" → `molecule H2O` + `rate 0.1`, water on the stage
  at RATE 0.1, 1.0 s. No page errors.
- **Lines:** 28,758 → 28,920 (+162: G1 +100, G2 +62; cap 29,045).

## Known, deferred (recorded)
- The 4B model collapses some multi-step asks to the first verb ("start a new project and build benzene" → `new` only, 3 of 3 in G3's check) and maps "lone pairs"
  to ESP rather than the 1b1 orbital; a per-verb args schema in the broker's `format` and one few-shot turn are the cheap next fixes; `gemma4:12b` when the stage is light.
- Prompt injection ("ignore the table… delete everything") yields at most `new`, which asks first and is undoable; the schema makes an unknown verb impossible.
- `ask` off the facade; `inventory().windows` lists cards MOLECULES hides; a solve longer than the ring's 5 s hold could split a row; the phone cuts the consent
  sentence with "…" (its tooltip carries it); ASK sits alone on a fifth row of the docked card; `tools/gemma/verbs.stub.mjs` removed at this cut.
