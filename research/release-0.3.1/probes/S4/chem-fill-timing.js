// S4 probe: after MOLECULES ON, do the three derived defaults (chem.orbital, orbitals.selection, states.lanes) land in ONE task
// (chemview's solve landing, whose notify() the register hears), or later and apart?  Polls the edit scope every 4 ms.
const w = (n) => new Promise((r) => setTimeout(r, n));
const L = __LW, H = L.history;
const S = () => L.serialize({ scope: 'edit' }).presentation.instruments;
H.flush(); await w(450); H.flush();
const t0 = performance.now(); L.chem.setOn(true);
const seen = {};
for (let i = 0; i < 400 && Object.keys(seen).length < 3; i++) {
  await w(4); const I = S(), t = +(performance.now() - t0).toFixed(1);
  if (!seen.orbital && I.chem && I.chem.orbital != null) seen.orbital = t;
  if (!seen.selection && I.orbitals && I.orbitals.selection && I.orbitals.selection.length) seen.selection = t;
  if (!seen.lanes && I.states && I.states.lanes && I.states.lanes.length) seen.lanes = t;
}
L.chem.setOn(false); await w(300); H.flush();
return { seen, errs: __e.slice() };
