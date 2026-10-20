# H2 THE WINDOWS THAT FOLLOW THE SYSTEM — build (stage chain, Opus, 2026-10-20)

Josh: "Make leaving 'seperable' system also close the seperable window. And other windows that appear when messing
with 'spectrum's window (Like lattice)."

## What changed
- `lab/windows/spectrum.js :36–41` — the SYSTEM stepper's `onChange` remembers the window it opened
  (`WIN`: central/cornell → `central`, separable → `separable`, lattice → `lattice`, atom → `atoms`) in one `opened`
  slot, and when the stepper moves to a system whose window differs, it closes that window by the card's own ✕
  (`.dev-close` → the rack's `close(id)`: `closed` class, `devclose`, onSleep, save — the road a reader's click takes).
- **Hand-opened windows are honoured** (cheap): if the system's window was already open when the stepper reached it,
  the stepper did not open it, `opened` stays null and nothing closes on leaving.
- CENTRAL ↔ CORNELL share the CENTRAL window: stepping between them keeps it open.
- MOLECULES' card is the mode: never closed by the stepper. BOX (`well`) opens no window (`enterBox()` launches the
  packet), so there is nothing to close.
- Only the stepper's road is followed; a system set elsewhere (a project open, LAUNCH, COHERENT BOUNCE) leaves windows
  as they are.
- Hinge: a first draft read `app.sh.devById` / `app.sh.rk` and took spectrum to 27 (> 25, RED); it now reads the card
  by `document.querySelector` and closes by its ✕, so spectrum stands at exactly **25** (green, at the limit — the
  next forward name in this module will need one dropped).
- `lab/sw.js` by `pwa --write`.

## Proof (probe over 9621, `.tmp/it013/h2.js`, not committed)
`separable open → hydrogen: closed · lattice open → central: lattice closed, central open → cornell: central open →
atom: central closed, atoms open → hydrogen: atoms closed · SEPARABLE reopened by hand, then separable → hydrogen:
stays open · errors []`.
Visual: `H2-shots/after.jpg` (the probe's end: only the hand-opened SEPARABLE stands on the right rack).

## Tests
`./test.sh node` green (rack-deps green at 25); `molecular-names.browser-test` 6/6; `menubar.browser-test` GREEN.

## CLAUDE.md sentence for Sos
SPECTRUM's SYSTEM stepper closes the window it opened (CENTRAL, SEPARABLE, LATTICE, ATOMS) when it leaves that
system (013 H2); a window the reader had already open stays, and MOLECULES (the mode) is never closed by it.

## Open questions for Josh
- Should a system set by other roads (LAUNCH → BOX, COHERENT BOUNCE → oscillator) also close the stepper's window? Today: no.
