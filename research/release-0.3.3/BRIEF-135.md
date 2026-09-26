# BRIEF 135 · THE COPY — SPECTRUM's window bar copies the state as LaTeX, in Josh's notebook style, in chemistry order

Builder: Opus 5.5, isolated worktree from `origin/main` (a577e3b = v0.3.2-alpha). Fable, 2026-09-26. Read `PLAN.md` beside
this file first (rulings R4, R5), then `CLAUDE.md` whole.

## 0 · Read first
`lab/demos/wave-dancer.lambdawaves.json` → `notebook.text` (Josh's style: *"running $2p_{-1}$, $2p_{1}$, $4p_{-1}$, and
$4d_{2}$ in STATE-A and $2s_{0}$, $2p_{0}$, $4p_{1}$, and $4d_{-2}$ in STATE-B"*); `lab/rack.js` ≈ 1905 (the SPECTRUM
device), ≈ 3671–3680 (`layout.digest` and `copyDigest`: the clipboard road and the `copied` flash), ≈ 3760–3768 (the EDIT
menu rows), `lab/mir/kit.js` `device()` ≈ 510–600 (the head: `.dev-id`, `.dev-stat`, `.dev-util` with power and fold — read
only, never edit), the head-button styles in `lab/mir/*.css` (read, to match tokens), the register (`reg.populated()`,
coefficients, `BASIS` in `lab/hydrogen.js`, `getHamiltonian().labelOf`), `lab/statesview.js` (what SPECTRUM lists),
the notebook's KaTeX road (`<m>`/`$…$` rendering, `tests/notebook*.test.mjs` or the `current` suite's renderer scene).

## 1 · The law
One road: the head button and EDIT › COPY the state as LaTeX call the same `copyLatex()`, which writes
`stateLatex(...)` to the clipboard through `copyDigest`'s road and flashes `copied` on the SPECTRUM window. The text pastes
into the notebook and renders under KaTeX with no error. The names are Josh's: `2p_{-1}`, letter from `spdfgh`, m as a signed
subscript (`_{0}`, `_{1}`, `_{-1}`). The order is chemistry's (R4). The copy is two lines (R5).

## 2 · Build
**A. `lab/latex-state.js`** (new, pure): `stateLatex({ states, H })` where `states` is the populated register as
`[{ n, l, m, re, im }]` (or the Hamiltonian's own state records) and `H` the Hamiltonian:
- Normalise: amplitudes a_k = |c_k| / √Σ|c|²; phases φ_k = arg c_k − arg c_first (the first term in the chemistry order
  carries phase 0).
- Order (R4): key (n + l, n, l, m) ascending — Madelung for the shell, then m from −l to l.
- Names: hydrogen-like → `${n}${'spdfgh'[l]}_{${m}}` (so `2p_{-1}`, `4d_{2}`, `1s_{0}`); any other Hamiltonian → its
  `labelOf` made LaTeX-safe: `\mathrm{…}` with `₊`/`₋` + digit → `_{+1}` / `_{-1}` and spaces → `\,`.
- Line 1, the list in Josh's prose: `$2p_{-1}$, $2p_{1}$, $4p_{-1}$, and $4d_{2}$` (two names: `$a$ and $b$`; one: `$a$`).
- Line 2, the expansion: `$\psi = 0.50\,2p_{-1} + 0.50\,e^{i\pi/2}\,2p_{1} + \dots$` — amplitude to two decimals; omitted
  when it is 1.00 (a single state); the phase factor omitted when |φ| < 0.005; written as a multiple of π when φ/π is
  within 1e-3 of p/q with q ≤ 12 (`e^{i\pi/2}`, `e^{-3i\pi/4}`, `e^{i\pi}`), else `e^{1.23i}`; a `−` sign as `-`.
- Empty register → `''` (the caller says "nothing to copy — the register is empty" in the status line, no clipboard write).
- Phases are the LIVE ones (c(t) at the current t — what the field shows); note in the header that amplitudes are constant
  under field-free evolution and the relative phases move with t.
- STATE-A/B: the live register is the mix; copy that.
- MOLECULES as field owner (the register off): copy the MO list SPECTRUM shows if it shows one (`\phi_k` with occupation);
  if SPECTRUM shows nothing usable, copy nothing and say so. Keep this arm minimal.

**B. The head button** — app-owned, no MIR edit: `lab/rack.js` after the SPECTRUM device is made, insert a
`button.dev-copy` (type button, `title` "Copy the state as LaTeX", `aria-label` the same, a ⧉ glyph or the notebook copy
button's glyph if it is a character) into `wSpec.root.querySelector('.dev-util')` **before** the power button. `lab/lab.css`:
`.dev-copy` matches `.dev-power`'s box, ink and hover using the same tokens (read them in the kit's CSS; do not restyle the
kit). It hit-tests: `elementFromPoint` at its centre is the button. On press → `copyLatex()`.

**C. EDIT menu:** a row `COPY the state as LaTeX` after `COPY as JSON`'s neighbour — read where the FILE/EDIT rows are and
put it in EDIT beside NORMALIZE (it is an act on the register), tooltip "the populated states in chemistry order, in the
notebook's LaTeX — two lines: the list, then ψ with amplitudes and phases".

**D. `copyLatex()`** in rack.js: reads the populated register, calls `stateLatex`, writes through the same clipboard call
`copyDigest` uses (factor a `copyText(id, text)` out of `copyDigest` if that is the smallest change: one clipboard road,
one flash), and sets SETTINGS' status line `COPIED · 4 states as LaTeX` (or the empty message).

## 3 · Tests
- `tests/latex-state.test.mjs` (node), exact strings: 1s alone → line 1 `$1s_{0}$`, line 2 `$\psi = 1s_{0}$`; WAVE
  DANCER's A set with equal real coefficients → line 1 exactly `$2p_{-1}$, $2p_{1}$, $4p_{-1}$, and $4d_{2}$`, line 2 with
  `0.50\,` on each and no phase factors; B set likewise; 2p_{0} + i·2p_{1} → `e^{i\pi/2}`; a phase of 0.37 rad → `e^{0.37i}`;
  3d_{0} + 4s_{0} → **4s first** (Madelung); m order −1, 0, 1 inside 2p; un-normalised input normalised; the empty
  register → `''`; an oscillator label → `\mathrm{…}` with a legal subscript; every output has balanced `$` and braces.
- `tests/latex-copy.browser-test.mjs`: boot the WAVE DANCER demo (or load its A set), stub `navigator.clipboard.writeText`
  to capture; the head button exists in `.dev-util` before power and wins `elementFromPoint` at its centre; a real press →
  the captured text's line 1 equals the notebook's own sentence for that set; the `copied` class flashes; EDIT › COPY the
  state as LaTeX (through the menubar driver) yields the same text; paste it into the notebook (`ta.value`, an `input`
  event, the notebook open) → the rendered page has KaTeX output and no `.katex-error`; the empty register → nothing
  captured and the status message. `tests/menubar.browser-test.mjs`: the new EDIT row is driven.

## 4 · Docs
`REPORT.md`: `### wave 135:` under the 0.3.3 heading (create the `## 2026-09-26 · 0.3.3 — THE EXPORTS` heading if wave 134
has not; on merge the two entries sit together). `docs/NOTES-FOR-AGENTS.md`: one bullet. No CHANGELOG edit.

## 5 · Proof
`node tests/pwa.test.mjs --write`; `bash test.sh node`; `node ~/Documents/MIR/tools/adopt.mjs <root> --check` in step;
browser on your own server (`LW_CERTS=/home/joshua-hosain/Documents/LAMBDAWAVES/.certs python3 tools/gate/server.py <root>
8734`; ports 8711, 8721, 8723, 8731, 8732, 8733, 8766, 8792, 8796 are others'; `LW_PORT=8734 GD_PORT=5234`): latex-copy,
menubar, current, history, frame-occlusion (a head button is painted chrome), keyboard-window. Commit on your branch with
the attribution lines; report the exact copied strings for the WAVE DANCER sets, the PASS lines, and what in this brief
was wrong.

## 6 · Don'ts
No MIR edits (the head button is the app's, styled by lab.css with the kit's tokens), no second clipboard road, no dialog,
no preference, no `pkill -f`, no git outside your worktree.
