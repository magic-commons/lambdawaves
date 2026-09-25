/* instr-loads.expr.js — wave 127: what the field-owning instruments' load(…, on:false) costs inside a restore of a saved
 * project (every app-written project carries `instruments`; the device report's restore-back showed molecule.load 21–48 ms
 * self).  Each piece of molecule.load timed alone with the values a booted state saves, ×5, medians; and restore(snapshot)
 * of the state as found, whole. */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW;
  LW.pause(); await LW.settle(); await sleep(800);
  const snap = JSON.parse(JSON.stringify(LW.serialize()));
  const I = snap.presentation.instruments;
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return +s[s.length >> 1].toFixed(2); };
  const time = (f) => { const t = performance.now(); f(); return performance.now() - t; };
  const T = { setR: [], setKind: [], setOnFalse: [], moleculeLoad: [], heliumLoad: [], h2Load: [], chemLoad: [], restore: [] };
  for (let i = 0; i < 5; i++) {
    T.setR.push(time(() => LW.molecule.setR(I.molecule.R)));
    T.setKind.push(time(() => LW.molecule.setKind(I.molecule.kind)));
    T.setOnFalse.push(time(() => LW.molecule.setOn(false)));
    T.moleculeLoad.push(time(() => LW.molecule.load({ ...I.molecule, on: false })));
    T.heliumLoad.push(time(() => LW.helium.load({ ...I.helium, on: false })));
    T.h2Load.push(time(() => LW.h2.load({ ...I.h2, on: false })));
    T.chemLoad.push(time(() => LW.chem.load({ ...I.chem, on: false })));
    await LW.settle();
    T.restore.push(time(() => LW.restore(JSON.parse(JSON.stringify(snap)))));
    await LW.settle(); await sleep(200);
  }
  return { instruments: { molecule: I.molecule, helium: I.helium && { on: I.helium.on, basis: I.helium.basis }, h2: I.h2 && { on: I.h2.on, R: I.h2.R }, chem: I.chem && { on: I.chem.on } },
    median: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, med(v)])), all: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v.map((x) => +x.toFixed(1))])) };
})()
