# BRIEF D1 · THE STAGE TEXT becomes the kit's block (0.5.1 "Informational Update"; Opus builder)

**Read first, whole:** `research/release-0.5.1/PLAN.md` (§0, §1, the D1 row, §5 U1–U5, §8, §9 R6-I/R6-F/R6-L), `research/release-0.5.1/AUDIT-OPUS.md`
E1, E2, E13, E14, E15, E16 and §4 U1–U5 (they carry the file:lines this brief rests on), `CLAUDE.md` (THE STAGE TEXT paragraph — the laws you keep — and
the kit law), `lab/stage-text.js` (132 lines, whole), `lab/mir/info/layer.js` (whole: the header contract; `createInfoLayer`'s options at :98; the
runner, `kick()`, `viewChanged()`, `freeze()`, the placement at :346–355, parallax at :120/:649, the API at :700–789), `lab/mir/info/info.css`,
`tests/stage-text.browser-test.mjs` (106 lines; its scenes are the law), `tools/perf/main-thread.mjs` (whole), and the `rack.js` sites:
`:160`, `:241–244`, `:850` (the tick), `:1017` (the hand announce), `:1133–1135` (the DISPLAY row), `:1993`, `:2006–2039` (`stageText`, `stageMd()`,
`stageTextTick()`, `initStageText()`), the `window.__LW` literal (the witnesses `stats`, `md`, `formula`, `banner`). Then `lab/key-table.js` (an ACTIONS
row's shape; whether an `up`/hold row exists) and `lab/mir/info/layer.js` `infoActions`.

## The contract

1. **ONE kit layer, one block.** `createInfoLayer({ stage: dom.stage, avoid: () => [the two racks' rects, the transport's, a bottom-docked TIMELINE's],
   parallax: false, drift: false, follow: false })` once, in `rack.js` where `initStageText()` is. **No `subject`, no `features`, no labels. Never call
   `viewChanged()` for a camera move** (a block with no subject and no anchor does not depend on the view; the layer's ResizeObserver and `resize`
   cover a size change). The formula / the states' prose (`stageMd()`) = `addBlock({ md })`. A changed string = `remove()` + `addBlock()` **behind
   the 250 ms KaTeX gate** (keep `stage-text.js`' `KATEX_MS` logic: a change inside the quarter second waits, then renders whatever is wanted by
   then — the DOM moves only when the string does). THE FADE = a second `addBlock({ md })` + λWAVES' own `setTimeout(ttl 2400) → remove()` (the kit's
   exit IS the fade; `hold` is NOT a lifetime); only a HAND reaches it (`{ hand: true }`, `rack.js:1017`; the register's `announce`). While a fade
   block is up, the formula block stays (or leaves and returns — choose what reads best; say which in the BUILD).
2. **THE ATOM LABELS stay λWAVES' letters, unchanged in look and law** (on each nucleus, every atom, `difference`, written per camera key only, one
   element symbol per nucleus): move `atomLabels()` and its ResizeObserver (`stage-text.js:88–112`, ≈ 28 lines) into `rack.js` next to the tick (or
   `lab/molecule-state.js`), with the SIZE knob still × `TYPE.body`. Then **delete `lab/stage-text.js`** and its `lab.css` rules (`#molFormula`,
   `.mf-top/.mf-foot`, `.st-fade`; keep `#atomLabels`/`.atom-label`). Update the `import` in `rack.js`.
3. **The DISPLAY row stays ONE row** (`rack.js:1133–1135`; PREFERENCE `molFormula` / `molFormulaSize`, read at `:241–244`): the switch = `layer.root.hidden`
   plus "add nothing while off" (OFF COSTS NOTHING; turning on renders the string wanted then); SIZE = an unlayered `lab.css` rule overriding the kit's
   `--info-size-*` clamps (`info.css:28–32`) × SIZE, so the formula is the title size (34 px × SIZE) and a fade the heading size (22 px × SIZE) as
   today. The layer root's z-index goes UNDER the racks (as `#molFormula`'s 20 under 30) in an unlayered rule. The root is `pointer-events: none`
   (the kit's) and is **never part of the occlusion mask** (`refreshOcclusion` enumerates painted window surfaces; the layer is not one).
4. **Placement (R6-F taken): the kit's seat, still** — top of the free stage + 12 %, between the racks, no parallax, no fleeing the cursor. The foot
   seat (`stage-text.js:51`, when the transport is docked or at the top, or narrow) is NOT reproduced: the layer has no seat option — write it as a
   brief candidate (`BRIEFS-0.5.1.md` already lists "a block SEAT option"). `avoid()` MUST include the transport and a bottom-docked TIMELINE
   (C7b's open item) so the block never sits under either; prove it in U3.
5. **The look (R6-I taken): the kit's** — ink, the feathered shade, the serif face (`info.css:54, 76–79`). Do not restyle the kit's block to look like
   today's transparent KaTeX; Josh judges the look from the PNGs. KaTeX stays `renderNotebook`'s (the layer renders md through it).
6. **HOLD (I):** one ACTIONS row from `infoActions` in `rack.js`' ACTIONS table (KeyI is free; `group`/`short` for the keyboard window). If the kit's
   `infoActions` needs an `up` row and `lab/key-table.js` has no `up`, write the row as a plain toggle (hold on press, release on the next press) and
   note it as a brief candidate — never edit `lab/mir/**`.
7. **The `__LW` law (G-W):** keep `__LW`'s stage-text witnesses — `stats.renders` (KaTeX runs), `stats.announced`, `stats.places` (may become 0 — say
   so), `stats.labelWrites`, and the `md` / `formula` / `banner` getters — or re-aim `tests/stage-text.browser-test.mjs` in the SAME commit. Prefer
   keeping them (the five-row boot pass and `legacy/boot` B6/B22/B23 read them).
8. **No `ui:` and no feature callouts** anywhere (G-U). Nothing of yours reaches an export (the caption `drawCaption` is unchanged until D5).
9. **Lines:** OUT 132 + CSS; IN ≈ 35 + 28 moved → ≈ −70 net. Say the real number in the BUILD. The bar: `lab/*.js` ≤ 30,000 (you start at ≈ 27,594).

## THE FIRST STEP — the instrument, before any D1 code (U1; a `tools/` edit, allowed)

Add `--setup '<js>'` to `tools/perf/main-thread.mjs`: an expression `await`-evaluated on the MEASURED page after `__LW.ready` and the notice dismissal
and BEFORE the pause/settle/400 ms/play (`main-thread.mjs:55–58`); record it in the JSON (`setup`); also record the SERVED tree's version line (fetch
`https://127.0.0.1:PORT/lab/rack.js` and regex `const BUILD_LINE = '…'`) beside the CWD sha (C-V N8: the sha printed today is the CWD's, not the
served tree's). The D1 scene: MOLECULES on + the H₂O pick; ORBITAL view + the HOMO; AUTO-ROTATE on; STAGE TEXT on — through `__LW` verbs (read the
`window.__LW` literal in `rack.js`; the spike's own script is `p2-cost.mjs` in the A0 pass-2 agent's `.tmp/`: `find /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees -maxdepth 3 -name 'p2-cost.mjs'`
— read-only, copy what you need). Then **the three arms on the BASE tree** (`git archive <your base sha>` into `.tmp/base`, served on your second port):
STAGE TEXT off · STAGE TEXT on (today) · and later the tip; `--runs 1`, interleaved base/tip 5 + 5 as the header says; GPU quiet (`wait-gpu`, no other
geckodriver/Chromium). Today's stage-text cost falls out of the first two arms. Commit the tool + the base figures as step 1 with `D1-HANDOFF.md`.

## Acceptance (the closers; every one before the row is offered for merge)

- **The pair:** |Δ median| ≤ 3.536 ms/s, base vs tip, in the BOOT scene (the tool as it is) AND in the D1 scene (above, + a CDP pointer sweep over the
  stage for 10 of the 30 s: `Input.dispatchMouseEvent` ≈ 40 moves/s). Each pair interleaved 5 + 5, notice dismissed, `__LW.field.ok` true.
- **The idle witness (U2):** on the tip in the D1 scene, a `MutationObserver({ subtree: true, attributes: true, childList: true, characterData: true })`
  on `layer.root` counts **0 records over 10 s of AUTO-ROTATE** after the entrance landed, and again under the 40 moves/s pointer sweep (parallax off),
  and `layer.debug().running === false`. If any record appears, find its writer before taking the pair.
- **Placement (U3):** at `setShift(±1, 0)` and centred × the transport floating / docked / at the top × the TIMELINE docked at the foot: the block's rect
  never meets a `uiSpace()` rect (the spike's `09-rack-d4` recipe on the block alone; `research/release-0.5.0/canary-a0/`).
- **The churn (U4):** a paint stroke across 6 rows of SPECTRUM's ladder in 1 s → ≤ 4 KaTeX renders and ≤ 4 block entrances. If the remove + add flicker
  reads badly, say so (Josh's to see; `handle.update(md)` is the brief).
- **The fade (U5):** `loadPreset(…, { hand: true })` → one fade block for 2.4 s then the exit; a restore, an undo, a project or link open → 0
  (`stats.announced` is the witness).
- **Suites:** `tests/stage-text.browser-test.mjs` re-aimed (the key law; KaTeX ≤ 4/s; the fade on `{ hand: true }` only; the caption unchanged; the
  letters unchanged); `frame-occlusion` 7; `hit-probe-set` 0 reached; `keyboard-shortcuts` + `keyboard-window` (the I row); `tests/legacy/boot` B6,
  B22, B23 (the stage text's tick reads — run those blocks alone with the re-aim's `.tmp/chunk.mjs` recipe, `LEGACY-BOOT-REAIM.md` §8); `offer`;
  `history`; `node tests/pwa.test.mjs --write`; `bash test.sh node` exit 0. THE LOCK is not needed (no frame-path change) — say so.
- **If the pair or the witness fails, the row is NOT merged and `stage-text.js` stays**: report the numbers and stop; do not shrink the block to pass.

## Commits (each lock-free, each followed by `D1-HANDOFF.md`)
1. `0.5.1 D1 · main-thread.mjs --setup; the three base arms` (tool + figures in `D1-BUILD.md` §measure).
2. `0.5.1 D1 · the formula and the fade are the kit's block; the letters move; stage-text.js leaves` (code + CSS + the suite re-aim + pwa).
3. `0.5.1 D1 · the pair, the witness, placement, churn, fade; wave 2xx; D1-BUILD.md` (REPORT.md gets a wave under a "0.5.1 · THE INFORMATIONAL UPDATE"
   heading — read REPORT.md's last wave number first; the CLAUDE.md THE STAGE TEXT paragraph DRAFTED in `D1-BUILD.md` for the integrator, not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 8973/5443 (tip) + 8977/5447 (base).
`python3 tools/gate/server.py <worktree> 8973` (run_in_background); `LW_PORT=8973 GD_PORT=5443` for suites; the ms/s tool uses `LW_PORT` only
(Chromium through `tools/perf/cdp.mjs`). ONE browser at a time on the rig: `node tools/perf/wait-gpu.mjs` and `pgrep -a geckodriver`/`pgrep -a -f chrome`
empty before each run; never kill another's process; stop yours by pid. Never `pkill -f`. The guard refuses compound shell lines (plain commands or
`bash .tmp/x.sh`). Never edit `lab/mir/**`, `lab/fonts/**`. Subtract, don't add. A red that could be the RTX 3070 in P5 is re-run alone once. Never
merge, push, tag. `D1-BUILD.md` at the end: the ledger (lines before/after), the measured numbers (both pairs, the witness counts, U3–U5), the brief
candidates (the seat option; `handle.update`; anything new), the merge notes (rack.js sites), the drafted CLAUDE.md paragraph, "what Josh will see"
(the formula's new look and seat; the letters unchanged). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
