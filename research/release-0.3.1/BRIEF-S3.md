# BRIEF · STAGE S3 · THE TRUE HISTORY — core (λWAVES 0.3.1)

Read first: `research/release-0.3.1/PLAN.md` §0 (fact 1), §1 (the law; D6), §4 (your specification), §6 row S3, §7;
`docs/STATE-SCOPES.md`; `docs/NOTES-FOR-AGENTS.md`; `CLAUDE.md`. Build on `release-0.3.1` after S2 has merged (your
first command: `git merge --no-edit release-0.3.1`).

## The situation (measured before you)
- The ring is `lab/history.js` (`createHistory({ read, write, liveKey, depth, quiet, driven, onChange })`: a linear
  timeline with a cursor, `hold`/`release` coalescing, `note`, `goto`, a one-use `historyUndo`, `clear`, `entries`).
  It is wired in lab/rack.js in one block (search `createHistory(`): `hLook`/`hLookKey`/`hLookWrite`, `hLiveKey`, `hRead`,
  `hWrite`, the `reg.version` setter → `hNote()`, the document pointer capture (`hold(hTouchName(target))` on pointerdown,
  `release()` on pointerup/cancel/lostpointercapture/blur/pagehide/hidden), `historyApi`, then the HISTORY card
  (`device({ id: 'history' … })`, `renderHistory`) — the card's list is S4's; you may only change what it is fed.
- Today's scope: register (`reg.serialize`), damping, hamiltonian {id,Z,atomZ,well,gasBasis}, rates, sturmian, the A/B
  stores, and the LOOK knobs (exposure … bow, slice, finish — and still the field chrome frame/axis/…, which S1 made a
  PREFERENCE; the ring must stop carrying it). Not covered: the modulation model, stage colour, overlays, palette,
  instruments (element, molecule, chem, orbitals …), field lines, readers, wigner, mo, space, domain, shadow, rotation
  rates' *values* (only a note), gamma/boost.
- `restore(obj, opt)` (rack.js, search `function restore(`) knows `opt.project` (scrub to 0, clear the ring) and
  `opt.keepTime`. `serialize()` builds the whole project INCLUDING `layout` via `captureLayout()`, which reads the DOM.
- The modulation window's host port (rack.js, search `apply:` near `createModView` / the `modwindow` import) exposes
  `apply()` — modwindow.js calls it after each of its ~56 model edits — and `persist()` for presentation. `mod.js` emits
  nothing. `LW.mod.*` wrappers (search `LW.mod = ` / `addSource`, `route`, `bind`) also mutate the model.
- Clears today: boot (bottom of boot(), "the shipped boot is the BOTTOM of the stack"), a link open, a project open
  (`opt.project`), NEW (S2's `fresh()`). The bottom row's label is the constant `'start'`.
- Time-varying fields: `experiment.t` (the clock), the modulation transport's time/playing and any per-source phase the
  model serialises, and `modulation.seq` if it is a counter. Today's `hLiveKey` avoids them by hashing `reg.digest()`
  (the anchor coefficients, not the time). Your scope must exclude them too, or a playing instrument would commit a
  phantom row every quiet window.

## What S3 delivers (one commit)
1. **One reader, one writer, one key, over the PROJECT scope.**
   - `serialize(opt)` gains `opt.scope === 'edit'`: it builds the PROJECT keys only — no `layout` (so `captureLayout()`
     and its DOM reads are not run), no `modwin`, no `notebook`, no `obs`, no `camera`, no `quality`, and with the
     time-varying fields removed (`experiment.t`, the modulation transport's time/playing/phases, a save counter). This
     is `readEdit`. Prefer the argument on the existing function to a second serializer.
   - `restore(S, { history: true })`: applies the PROJECT keys, skips the same excluded keys, implies `keepTime`, does
     NOT clear the ring, and does not touch the notebook or the arrangement. This is `writeEdit`.
   - `liveKey()` = a fast 32-bit string hash (FNV-1a) of `JSON.stringify(serialize({ scope: 'edit' }))`. Keep
     `driven: rotDriving` (a rotation drive is one gesture).
   - DELETE `hLook`, `hLookKey`, `hLookWrite`, `hLiveKey`, `hRead`, `hWrite` and their hand-kept key lists. The ring's
     port becomes `{ read: () => serialize({scope:'edit'}) + key, write: (S) => restore(S, {history:true}), liveKey }`.
     lab/ must shrink.
2. **Triggers.** The modulation port's `apply()` calls `hNote()` (one line); the `LW.mod.*` wrappers that mutate the model
   call `hNote()` unless they already reach `apply()`. `reg.version` and the existing direct `hNote()` sites stay. The
   pointer capture stays as is.
3. **Names.** `hTouchName` learns the modulation window's own controls (read modwindow.js for its slider/button/label
   classes and the window's eyebrow/title element) so a row reads like `LFO RATE · MODULATION`; the ring's `clear(name)`
   takes an optional bottom-row name (default `'start'` stays for callers that pass none): boot → `boot`, link → `link`,
   a project open → `open · <project name>`, NEW → `new project`. `entries()` is unchanged in shape.
4. **Cost budget (measured, written into your report).** `note()` arms a timer and nothing else. `liveKey()` runs only at
   a commit (≥ 400 ms quiet) and when the EDIT menu or the HISTORY card reads `canUndo`/`canRedo` — never per frame:
   measure the time of one `__LW.history.flush()` after an edit (< 2 ms on the RTX); during a 5 s play with no gesture
   the ring gains **zero** rows. Snapshot size (bytes per row for the default scene, the demo, a chem scene) and the
   ring's worst case (60 rows). Undo latency: one `writeEdit` measured (`performance.now()` around
   `__LW.history.undo()`) for the default scene and the demo; count modulation-window rebuilds per undo (expect one).
   If an undo visibly flickers or costs > 150 ms on the desktop, then and only then skip a section whose serialised
   form is unchanged (compare the section's JSON) — report the measurement that made you add it.
5. **The chrome leaves the ring**: after an undo, frame/axis/frameMode/axisMode/cornerSide/invert/axisInk are exactly
   what they were before the undo (S1's verifier saw an undo put axes back on — that ends here).

## Tests
- `tests/history.test.mjs` (node): extend for `clear(name)` (the bottom row carries the name; `clear()` still says
  `start`); the existing 15 stay green.
- NEW `tests/history.browser-test.mjs`, one scene per edit family, each: do the edit → exactly one new row with the
  expected name → `undo()` → `serialize({scope:'edit'})` byte-identical to the pre-edit reading → `redo()` → identical to
  the post-edit reading:
  - a modulation edit through the WINDOW (add a source via its own UI or `LW.mod.addSource`, move a slider by pointer
    events on it, add a route);
  - the stage colour (the `.stage-colour` input);
  - an overlay switch (kepler or vortex);
  - a LOOK knob drag by pointer events: one row per drag, not one per move;
  - a preset (`loadPreset`) and an element change;
  - A/B STORE A then STORE B; the transition on;
  - a palette choice and a custom stop;
  - the chem/molecule owner switch if cheap (or state why not);
  - a project open and NEW each start a fresh timeline with depth 0 and a bottom row named `open · WAVE DANCER` /
    `new project`; a link open → `link`; the boot's bottom row is `boot`;
  - NO row from: a camera orbit (pointer drag on the stage), a window drag, typing in the notebook, a GRID change, a
    notebook resize, toggling the modulation window open/closed, 5 s of play;
  - the depth: 61 distinct edits → 60 undos available, the oldest fell off; `historyUndo` after a `goto` jump;
  - the chrome test of §5;
  - the cost assertions of §4 (flush time, zero rows while playing).
- Suites that must stay green: current, input, render-regressions, keyboard-window, menubar, new-project (S2's),
  render-exact (`tests/render-exact*.mjs` pins quality.auto/governor.on — untouched), the node gate.
- Probes with numbers in `research/release-0.3.1/probes/S3/`.

## Laws
- Subtract, don't add: the six hand-kept functions and their key lists go; the two trigger lines and the names come
  in; no new module, no new setting, no new UI (the card is S4). Report the lab/ line delta.
- NEVER edit `lab/mir/**` (mod.js, host.js, modwindow's kit files) or `lab/fonts/**`; `lab/modwindow.js` is the APP host
  and may be touched on the host side only. Run `node /home/joshua-hosain/Documents/MIR/tools/adopt.mjs <worktree root>
  --check` at the end → "in step with MIR 1.4.3".
- After any lab/ edit: `node tests/pwa.test.mjs --write` then `node tests/pwa.test.mjs`.
- No CSS. Do not touch the frame loop, field.js, the controller or the digest-lock fixtures.

## Gates in your worktree
- Node: `bash test.sh node` (if refused: `node research/optimization-2026-09-24/probes/LA/run-node.mjs`).
- Browser: your own gate server `LW_CERTS=/home/joshua-hosain/Documents/LAMBDAWAVES/.certs python3
  tools/gate/server.py <worktree root> 8737 > /tmp/lw-s3-server.log 2>&1 &` (wait for "λWAVES gate server on"), then
  `LW_PORT=8737 GD_PORT=5237 node tests/<suite>.browser-test.mjs`, one at a time. Other ports if taken.
- THE DIGEST LOCK ×2: `LW_PORT=8737 GD_PORT=5237 node tools/perf/digest-lock.mjs --check --fixture
  research/optimization-2026-09-24/digest-lock-base-w125.json` and `… --check --query 'gastab=0'`. Contention ("Not
  enough memory left" / "Context lost" / "Render did not settle") → `nvidia-smi`, `uptime`, rerun when quiet.
- `node tests/render-exact.test.mjs` if present as a node suite, else the browser form.
- Stop your server when done.

## Commit
One commit: `0.3.1 · S3 the true history: one reader/writer/key over the PROJECT scope (serialize {scope:'edit'} /
restore {history:true}); modulation edits are rows; the bottom row is named; the chrome leaves the ring` with the
gates and the measured budget in the body, ending with:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ADfznhVLrgqTQjNSNtMUE8
Do not push; do not merge into other branches.

## Hand back
What changed (file:line), lab/ delta, the excluded time-varying fields you found, the cost table (flush ms, bytes/row,
undo ms, rebuilds per undo), every gate's exact result line, anything undone and why, branch + final hash.
