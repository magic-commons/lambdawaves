# LEGACY WINDOWS

**Status (2026-10, Josh):** hidden. Each of these windows **needs an upgrade, re-adoption, or deletion.** They are
not offered by the + menu, the WINDOW menu or TAB, and a first visit never sees them. Nothing was deleted: ids,
models, save records and node suites are intact, so every older project still opens.

| id | title | what it is | files |
|---|---|---|---|
| `molecule` | H₂⁺ · LEGACY | H₂⁺ in the 1s LCAO basis (hidden since 0.2.0; the model for the rest) | `molecule.js`, `moleculeview.js`, `mo.js`, `moview.js` |
| `h2` | H₂ · LEGACY | two atoms, Heitler–London curves and the collision | `h2.js`, `h2view.js` (`h2ci.js` is a shared library — keep it) |
| `helium` | HELIUM · LEGACY | two electrons, Hylleraas; the conditional cloud of electron 2 | `helium.js`, `heliumview.js` |
| `atoms` | ATOMS · LEGACY | the periodic table as one central field (Xα(2/3) + Latter tail) | `atoms.js`, `atomsview.js` |
| `qcd` | QCD · LEGACY | quarkonium under a chosen potential; the CORNELL parameters | `cornell.js`, `qcdview.js` |
| `field` | ELECTROSTATICS · LEGACY | Φ, E, B and the current of the register's own charge; the stage overlay | `electrostatics.js`, `fieldlines` in `rack.js` |

## How they are hidden

`rack.js` `legacyWindow(w)` sets `w.root.hidden = true` and puts a `.legacy-note` banner at the top of the body (its
own class: LEAN hides every `.note`). `hidden` is the whole mechanism, exactly as for the H₂⁺ card: the + menu lists
`.dev.closed:not([hidden])`, the WINDOW menu `.dev:not([hidden])`, TAB skips hidden cards and `canPresent()` is false
for them, so their readers stop. `layout.raise(id)` / `layout.reopen(id)` still un-hide by id (tests use them).

## When one comes back

A project that NEEDS one brings it back, so a live field owner never loses its OFF switch:

- **HELIUM, H₂** — field owners. Their `setOn(true)` un-hides and opens the card; `restore` does the same when the
  file turns one on (beside the H₂⁺ line).
- **ELECTROSTATICS** — its overlay draws only while the card can present, so a file whose overlay is not `off` raises
  the card (`layout.raise('field')`: un-hidden, open, unfolded, on screen).
- **ATOMS, QCD** — never. Their Hamiltonians (`atom`, `cornell`) are still chosen in SPECTRUM and QCD's saved
  parameters still apply; they simply cannot be edited until this is decided.

## The three choices, per window

- **Upgrade** — bring it up to the current window laws (MIR kit controls, LEAN, occlusion, state scopes, the molecular
  session for anything that owns the field) and un-hide it.
- **Re-adoption** — move its generic behaviour into MIR first, adopt it, then adapt the app (CLAUDE.md's order), the
  way the modulation window was done.
- **Deletion** — remove the window, its view module and its save record; keep a `restore` shim (like `RETIRED_WINDOWS`)
  so older projects still open, and keep any shared library (`h2ci.js`'s `eigSym` is used by `density.js`,
  `rhf-molecule.js`, `response-fit.js` and `mathworker.js`).
