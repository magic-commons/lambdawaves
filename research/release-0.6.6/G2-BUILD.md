# 0.6.6 G2 — THE TYPE BOX + THE CLIENT (build note, 2026-10-15)

Branch `g2-typebox` from the 0.6.5 cut tip `3a86298`, built by an Opus builder for Claude Yan. Josh's words: "Let's do the gemma model! It should be fun. The transport window should act as the type box."

## What landed, seat by seat
- **`lab/ask.js` (new, 34 lines)**: `askUrlOf(ui)` gives the address (the SETTINGS field, else `${location.protocol}//${location.hostname}:9443/ask`, computed and never stored). `createAsk(app)` returns `{ ask(text), busy, last }`.
  - `ask` reads `app.sh.verbs` when it is called. If the table is absent it returns `{ error: 'the verb table is not here' }`.
  - It POSTs JSON with a 60 s `AbortController`. It runs her verbs, plus `{ verb: 'notebook', args: { md } }` when she wrote one, as ONE `app.sh.verbs.run(list, { who: 'GEMMA' })`.
  - `say` goes to `app.state.stageText.announce(say, 0)` and is held until Escape or the next ask. It keeps the last 6 turns `{ text, say }`.
  - A transport error or a reply that is not JSON never throws. It writes the one line to METERS' status (`app.w.wMet.setStatus(…, 'warn')`, the FLASH GUARD's road) and returns `{ error }`. The next good answer clears that line.
- **`lab/shell/transport.js`**:
  - l.5 imports `createAsk` and `askUrlOf`.
  - ll.31–33: the seat `span.ask-seat` holds `input.ask-line`, `span.ask-note` and `button.tbtn.ask-ok` (CONTINUE). It sits in the strip's centre, between RATE and the `t` readout.
  - ll.50–69: `button.tbtn.ask` **ASK** (aria-label "ask Gemma") comes after JUMP. Then `createAsk(app)`, registered as `app.sh.ask`; `showAsk`, `echo`/`endEcho` and `openAsk`; the Enter/Escape handlers on the line; and a click outside the strip, or Escape, to end an echo early.
  - ll.212–213: `update()` leaves `tro` alone while an echo is up.
  - l.218: the strip returns `openAsk`.
- **`lab/shell/keys.js` l.51**: the ACTIONS row `{ id: 'ask', group: TRANSPORT, short: 'ask Gemma', key: 'Slash', shift: false, inFields: false }`. Its run is `transport.openAsk()`. Shift+/ stays HELP's.
- **`lab/shell/settings.js`**: l.37 adds `askOk: ui.askOk || undefined` and `askUrl: (typed value) || undefined` to `saveSettings` (JSON drops both when absent). l.105 applies them, as `audio` is applied.
- **`lab/windows/settings-card.js` ll.18–19** add `ui.askUrlIn`, an `input.ask-line`. It is empty by default, its placeholder is the computed default, and it saves on `change`. **`lab/native-ui.js` l.66** seats it on DISPLAY beside AUDIO (`row('display',['audioSw','askUrl'])`).
- **`lab/rack.js`**: one key, `ask: null`, at the head of the `app.sh` literal (line 138, so that G1's edits near `historyApi`/`LW` merge cleanly).
- **`lab/lab.css` ll.309–313**: four unlayered rules.
  - The swap: hide the seat unless asking; hide the centre (and the pill's scrub, which a 640-px pill had already collapsed to a dot) while asking; during CONSENT hide the whole play row except the seat and ASK; during an echo hide REPEATS and the formula.
  - The seat's flex box. The same rule spans the docked grid's row 3 and widens the echoing `t` readout.
  - The input's look: the kit's well, hairline, pill and UI face.
  - The quiet words: placeholder, note, CONTINUE and the docked ASK word.
- **`docs/STATE-SCOPES.md`**: two PREFERENCE rows at the end.

## The request and the reply
- POST `askUrl`, `content-type: application/json`: `{ text, inventory: app.sh.verbs.inventory(), history: [{ text, say }] }`. The history holds at most 6 turns, and only answered ones.
- Reply: `{ say: string, verbs: [{ verb, args }], notebook?: string }`. `refused` from the run is echoed as ` (dropped: a, b)`.
- Echo: her `say` sits in the `t` readout's seat (its label reads GEMMA) for 4 s. Then the readout returns.
- Unreachable: `Gemma is not reachable at <askUrl> — start tools/gemma/start.sh`, shown in the strip and in METERS' status.

## The consent line (exact words)
`sends your words and this project’s readouts to <askUrl> on your network ·` followed by **CONTINUE**. It shows only on the first ASK press in a browser (`askOk` absent). CONTINUE writes `askOk: true` and opens the line. The note carries the full sentence as its title.

## Checks
- Node gate `./test.sh node`: 0 red (after `node tests/pwa.test.mjs --write`).
- The first default URL was a literal `https://…` and tripped pwa D2 ("every absolute URL in lab/ is accounted for"). It now uses the page's own scheme, so D2 stays as it was and an HTTPS page fetches HTTPS.
- `node tools/new-project.mjs --check`: in step (16117 B).
- `tools/serialize-bytes.mjs`: base `3a86298` served from `git archive` against this tree, 11/11 readings byte-identical.
- `tools/settings-probe.mjs`: 0 of 6 scenes red.
- Browser suites (served on 9361): `keyboard-window` GREEN, `menubar` GREEN (the DOCK row included), `official-defaults-palette` 3 PASS, `lw-facade` GREEN (176 members, unchanged). `keyboard-shortcuts` is a node suite and is in the node gate.
- Throwaway headless check (`.tmp/g2-check.mjs`, not committed; `app` was exposed on `window` for the run only, then reverted): 18/18 GREEN.
  - The stub verbs and a fake broker were wired in through `fetch`.
  - The consent line comes first; CONTINUE stores `askOk: true` and no `askUrl`.
  - The run received `molecule, bogus, notebook` with `who: 'GEMMA'`. The request shape is right. The stage banner holds the say.
  - The `t` readout echoed `Benzene is a ring. (dropped: bogus)` under GEMMA and returned after 4 s, with the say still held. `/` opens the line without typing a slash. Escape swaps back and lets the say go.
  - Unreachable `https://127.0.0.1:9/ask`: the one line appears in the strip and in METERS, and there is no page error.
  - The docked card carries the box (244 px) and echoes across its row. History carries the previous turn.
  - A second run with no verb table says "the verb table is not here".
- Screenshots: light and dark themes, pill and docked, and the phone (500-px headless floor, rack open).

## Lines
`lab/` JS (less `lab/mir`): 28,758 → 28,820 (+62 of the ≤ 75). `lab.css`: +4 rules and one comment line.

## Deferred / notes
- `ask` is NOT on the `__LW` facade. G1 re-captures `lw-facade.json` too, so two re-captures would conflict. It is one line in `facade.js` (`ask: app.sh.ask`) plus a `--write` at the integration.
- On the phone the consent sentence is cut off with an ellipsis (the card is ≈ 250 px; no word-wrap by Josh's law). The full sentence is in the note's title and in this note.
- In the docked card ASK sits on a fifth grid row of its own: rows 1–4 are full, and a seat change there would be a `skin.css` edit.
- The one history row per ask, the inventory and the verbs themselves are G1's. The broker is G3's.
