# λWAVES

MIR owns generic instrument behavior. Before changing modulation controls, read
`lab/mir/modulation/modwindow/host-contract.md` and the upstream
`/home/joshua-hosain/Documents/MIR/PROMPT.md`. Update MIR first, adopt it, then
adapt `lab/modwindow.js`; do not edit adopted files under `lab/mir/`.

MIR 1.4.2 restores FL Studio's curve workflow: right-drag empty space adds and
places a point; Shift-right-click adds at the curve's current value; left-drag moves a point or tension handle; Ctrl fine-tunes
tension; right-click resets a tension handle; Alt-left-click deletes a point;
Shift locks a moved point's value and Ctrl locks its time. Plain left-click on
empty space is inert. A deterministic analytic wave becomes its equivalent
editable curve on first edit and must never demand a preset first.

Run `bash test.sh node` and the focused curve/impulse browser regression before
shipping modulation edits. Keep `tests/render-regressions.browser-test.mjs` as
the permanent guard against the paused-redraw, scaled-hit-test, and impulse
overlay regressions.

The 0.2.0 alpha molecular UI is MOLECULES (`chem`) and MO-REGISTRY
(`orbitals`). Keep those saved IDs, `chem.*` and `reg.*` modulation targets,
and the `mol-*`/`reg-*` CSS hooks stable. The old H₂⁺ `molecule` card is hidden
at startup but must be shown if an older project restores it as field owner.

The stage frame/axis mask is built in `lab/rack.js` `refreshOcclusion()` and
consumed by the line shader in `lab/field.js`. Mask painted window surfaces,
never a transparent layout box: the modulation root, its chip rail, and
disconnected rack cards all have intentional gaps. A moved or scrolled window
must schedule a PRESENT even while paused. Run
`tests/frame-occlusion.browser-test.mjs` after changing this geometry.
