# 0.5.2 — the ask (Josh, 2026-10-09 evening, verbatim) and the seed

**Josh, after the two cuts of 2026-10-09 (GUI Adoption 16:15, Informational Update 20:35), ≈20:40–21:05 CDT:**

- "Amazing! How's the code looking?"
- (after Claude Yan's read: healthy engine and tests; `rack.js` the one structural debt at 4,931 lines; the unlayered CSS waiting on the kit) — "How
  would you like to refactor the codebase? What would be your ambitions?"
- (after the six ambitions below) — **"I would love a refactor of that scale. Do you think this will take more time than the jump from 0.3.X to 0.5.X?"**
- (after the estimate: shorter — a day and a half to two of the relay, about 0.5.0's size, with one unknown that could double it: how entangled `boot()`'s
  closure is; measure it first) — **"Let's do that round"** — the planning round Josh ruled for stage D: a Fable draft of the module map on a MEASURED
  dependency graph, one Opus@high audit, then the briefs. The build starts on his word.

**The name and number are Josh's.** Working folder `research/release-0.5.2/`; the candidates offered: "Rack Dissolution" / "Engine Boundary" (no "The" in
release names, his 10-09 ruling).

## The seed — Claude Yan's six ambitions, as said to Josh (20:50 CDT)

1. **Dissolve `boot()` into modules, section by section, as moves not rewrites.** Each comment-headed section of `lab/rack.js` becomes a file that
   takes what it reads and returns what it registers. Start where the frame path is not touched (the transport strip, the badges, the install layer,
   the bow and Kepler control surfaces, the stage text and head, the notebook block); finish with the loop, the controller and the field. Target:
   `rack.js` under 1,500 lines holding only the boot order and the wiring; no module over 600. Measure per move: the lock 0/0, the pair, the owning
   suites, `__LW` unchanged, a hard cap on added lines (a move earns only its import/export lines).
2. **Every window becomes one module with one shape** — `create<Window>(deps)` → its root, its routes for the modulation port, its PROJECT slice and
   WORKSPACE keys, its key rows, its `__LW` api — the shape the camera port, the mod port and the settings store already have; the `ui` bag disappears
   into them.
3. **Generate the scope tables from the modules** (PREFERENCE / WORKSPACE / PROJECT): each module declares its slice; FAMILIES/WORKSPACE are derived,
   not hand-kept (the way C6 killed the undo ring's hand-kept key list).
4. **The engine gets a literal boundary**: `field.js`, the shaders, capture/render-exact and the physics (state, chemistry, orbitals, molecules, the
   workers) under `lab/engine/` with the digest lock as its published contract; the UI reaches it only through routes and readouts. Three truths in
   the tree: `lab/engine/`, `lab/windows/`, `lab/mir/`.
5. **The CSS shrinks toward tokens**: the 1,384 unlayered lines and 36 `!important`s become a token sheet (colours, type, the three glass rulings),
   zero `!important`, every structural rule the kit's — paced by MIR through `research/release-0.5.1/BRIEFS-0.5.1.md`, not by editing here.
6. **The tests follow the modules**: the boot suite's 152 laws move into per-window suites as windows become modules; the lock stays the frame path's
   one truth, the pair the cost's; D1's `--setup` hook grows into a small scene library.

**The method:** the relay that worked on 10-09 — one module per row, a fresh Opus builder with a brief naming the OUT and a measured closer, two
builders on `rack.js` at a time by region, merged by the recipe, one verifier at the end. Sequence what the kit will never own first (the physics
windows, the engine); leave kit-bound seams (the rack chrome, the CSS) to the briefs.

**The trade-offs, said to Josh:** moving code does not make it smaller (the line cap matters); module seams are where behaviour drifts (hence the lock,
the bytes and the suites per move, not reading); the project format must not move a byte; the payoff is structural — nothing Josh sees changes.

**The estimate, said to Josh (21:00):** ≈ 11 rows (6–8 moves, 2 engine boundary, 1 scope tables; CSS paced by MIR) at 1.5–3 h each with three builders
in parallel ≈ 15–18 h of integrator wall-clock ≈ 1.5–2 relay days — about 0.5.0's size, under the whole 0.3.3 → 0.5.1 jump (465 commits in 51 h, ≥ 56
agents, + a planning day). The one unknown: `boot()`'s closure entanglement (336 boot-level declarations, 398 `ui.` touches, 82 imports, the `LW`
literal at :4551–4807); a typical section dragging > 25 named locals would grow the estimate by half. **First: `tools/rack-deps.mjs` measures it.**
