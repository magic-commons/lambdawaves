// S4 VERIFY (ten minutes of play): MOLECULES on, then off by its own switch, then NEW — is the result the empty project file?
const w = (n) => new Promise((r) => setTimeout(r, n));
const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true;
const F = await (await fetch('./new-project.lambdawaves.json', { cache: 'no-cache' })).json();
const pick = (S) => ({ orbital: S.presentation.instruments?.chem?.orbital ?? null, lanes: (S.presentation.instruments?.states?.lanes || []).length, sel: JSON.stringify(S.presentation.instruments?.orbitals?.selection ?? null) });
await P.fresh(); await w(800);
const fresh0 = pick(__LW.serialize());
__LW.chem.setOn(true); await w(1500); const on = pick(__LW.serialize());
__LW.chem.setOn(false); await w(600); const off = pick(__LW.serialize());
await P.fresh(); await w(900); const fresh1 = pick(__LW.serialize()), dirty1 = P.dirty;
window.confirm = c0;
return { file: pick(F.data || F), fresh0, on, off, freshAfterMolecules: fresh1, dirtyAfterNew: dirty1, rows: __LW.history.entries().map((e) => e.label) };
