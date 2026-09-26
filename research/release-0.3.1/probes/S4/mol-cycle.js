// S4 follow-up probe: the three derived MOLECULES defaults through a cycle — NEW → ON → undo → ON again, and ON → NEW → ON.
// Which ones does an undo / NEW leave standing, and which does a second ON (a cached solution: no re-solve) derive again?
const w = (n) => new Promise((r) => setTimeout(r, n));
const P = __LW.layout.projects, H = __LW.history, c0 = window.confirm; window.confirm = () => true;
const pick = () => { const I = __LW.serialize({ scope: 'edit' }).presentation.instruments || {};
  return { on: __LW.chem.on, orbital: I.chem ? I.chem.orbital : undefined, sel: (I.orbitals && I.orbitals.selection || []).length, lanes: (I.states && I.states.lanes || []).length }; };
const out = {};
await P.fresh(); await w(800); const pre = JSON.stringify(__LW.serialize({ scope: 'edit' })); out.fresh = pick();
__LW.chem.setOn(true); H.note(); await w(1500); H.flush(); out.on1 = pick();
H.undo(); await w(800); out.undo = { ...pick(), same: JSON.stringify(__LW.serialize({ scope: 'edit' })) === pre, dirty: P.dirty };
__LW.chem.setOn(true); H.note(); await w(1500); H.flush(); out.on2 = pick();
await P.fresh(); await w(900); out.newAfter = { ...pick(), dirty: P.dirty };
__LW.chem.setOn(true); H.note(); await w(1500); H.flush(); out.on3 = pick();
__LW.chem.setOn(false); await P.fresh(); await w(600);
window.confirm = c0; out.errs = __e.slice();
return out;
