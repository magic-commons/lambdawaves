# Proposed for MIR `docs/CONTRACT.md` — a new §9 after "8. Laws the kit keeps for an app" (docs-only; no kit code, no re-adopt)

Written 2026-09-26 by Fable for Josh, from λWAVES 0.3.1 (the scopes law is measured and shipped there as
`docs/STATE-SCOPES.md`). Josh applies it to `~/Documents/MIR/docs/CONTRACT.md` (the session that wrote this could not
touch the MIR checkout) and bumps the CHANGELOG as docs. Suggested text follows the CONTRACT's voice and layout.

---

## 9. The three scopes — what travels, what stays, what history remembers

Every control a host builds on this kit declares exactly one scope, and every stored key lives in exactly one:

- **PREFERENCE — the reader's furniture.** How this person, on this device, likes to see and handle any work: theme,
  material and glass, motion, hints and captions, key bindings, the performance budget (grid, AUTO SCALE, governor),
  camera feel and camera mode, frame and axes. Stored on the device. It never travels in a document, a link or a
  history row, and opening one never changes it. (`STYLE-LOCK` already says the half of this that concerns links: a
  link is somebody else's picture and the browser's preferences are the reader's furniture.)
- **WORKSPACE — the arrangement.** Which windows are where, how big, folded or closed; the notebook's size; a floating
  window's placement. It travels with a document (a demo brings its windows) and the device remembers it; the last
  arrangement wins, whoever put it there. It is never a history row.
- **DOCUMENT — the work.** The physics, the picture and the modulation: everything the author made. It travels, and
  it is the whole of history — except the view (a camera pose is not an edit), the notebook's text (edited in its own
  editor) and a quality hint the device may clamp.

Three consequences a host must honour:

1. **NEW opens the host's empty document.** A hidden document file at the DOCUMENT scope's shipped defaults, opened
   through the same road as any other document (with the same failed-open rollback). It carries no PREFERENCE and no
   WORKSPACE key, so a missing key keeps the live value and the reader's furniture and arrangement stand. The host
   ships a generator whose `--check` proves the file byte-exact, so a format bump cannot leave it stale.
2. **A document open writes nothing into the device's stored preferences.** The gate: the settings store, minus the
   WORKSPACE keys, is byte-identical before and after any open, and the theme is unchanged. A file that still carries a
   preference key from an older build is opened with that key ignored, never migrated away.
3. **History is the DOCUMENT scope, read by one reader and written by one writer.** One serializer with a scope
   argument, one restore with a history flag, one cheap key over the serialised document with every time-driven value
   removed (the clock, a transport's phase, a macro driven by its source): the ring gains no row while the instrument
   merely plays. Rows are named for the control and the window the hand touched; the bottom row is named for its origin
   (boot, link, open, new). A view change, a window move, a notebook keystroke and a quality change make no row.

The modulation kit is scope-neutral on purpose: `mod.js` emits no events and stores nothing (§7), so a host learns of an
edit from its own `apply` port and names it from the gesture. A host that wants the kit to carry scope declarations on
its controls asks for that as a kit change; today the declaration is the host's table (λWAVES: `docs/STATE-SCOPES.md`).
