/* w129-chem.mjs — W129-3's gate: THE CHEM-OWNER LAW.  A fresh desktop (MOLECULES and MO-REGISTRY closed by the first-visit
 * furniture), then project files opened through the project road (importText → open) whose field owner is MOLECULES:
 *   closedLayout   chem on, its layout marks chem and orbitals CLOSED            → MOLECULES on the rack and on
 *   omittedLayout  chem on, its layout OMITS chem and orbitals (an older layout)  → MOLECULES on the rack and on
 *   register       chem on + the register's record on, layout closes both         → MOLECULES and MO-REGISTRY on the rack
 *   atomic         an atom project (no owner), layout closes both                  → both stay closed (the law is the owner's)
 *   reopened       the + list's own road (layout.reopen) after a close             → on the rack
 * and the saved bytes of an existing (atomic) project, opened then serialized (layout.at / AUTO SCALE notch normalised).
 *   LW_PORT=8744 GD_PORT=5255 node research/optimization-2026-09-24/probes/W129/w129-chem.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8744', TAG = process.argv[2] || 'run';
const FNV = `const fnv=(s)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h=(h^s.charCodeAt(i))>>>0;h=Math.imul(h,16777619)>>>0;}return h.toString(16)+':'+s.length;};`;
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 600000 });
let out = null;
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out = await g.ev(`${FNV}
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), LW = __LW, P = LW.projects;
    try { if (LW.warning && LW.warning.dismiss) LW.warning.dismiss(); } catch (_) {}
    LW.pause(); await LW.settle();
    const card = (id) => document.querySelector('.dev[data-id="' + id + '"]');
    const onRack = (id) => { const d = card(id); return !!d && !d.hidden && !d.classList.contains('closed') && !!d.closest('#rack, #rackL, #floats'); };
    const read = () => ({ chemOnRack: onRack('chem'), orbsOnRack: onRack('orbitals'), chemOn: LW.chem.on, selected: LW.molsession.selected, errs: (window.__e || []).map(String).slice(0, 5) });
    const out = { boot: read() };
    const base = JSON.parse(JSON.stringify(LW.serialize()));
    const file = (name, mut) => { const d = JSON.parse(JSON.stringify(base)); mut(d.presentation); return JSON.stringify({ lambdawaves: 'project', version: 1, path: 'w129/' + name, folder: 'w129', name, data: d }); };
    const closeBoth = (pr) => { for (const c of pr.layout.cards) if (c.id === 'chem' || c.id === 'orbitals') { c.closed = true; c.folded = false; } };
    const chemOwner = (pr) => { pr.instruments.chem.on = true; };
    const openFile = async (text) => { const p = P.importText(text); const ok = P.open(p); await LW.settle(); await sleep(400); return ok; };
    const atomic = file('atomic', closeBoth);
    out.closedLayout = { ok: await openFile(file('closed', (pr) => { chemOwner(pr); closeBoth(pr); })), ...read() };
    await openFile(atomic); out.atomic = { ...read() };
    out.omittedLayout = { ok: await openFile(file('omitted', (pr) => { chemOwner(pr); pr.layout.cards = pr.layout.cards.filter((c) => c.id !== 'chem' && c.id !== 'orbitals'); })), ...read() };
    await openFile(atomic);
    out.register = { ok: await openFile(file('register', (pr) => { chemOwner(pr); pr.instruments.orbitals.on = true; closeBoth(pr); })), ...read() };
    await openFile(atomic);
    LW.layout.reopen('chem', 'R'); out.reopened = { ...read() };
    /* the saved bytes of an existing project, opened: the atomic file twice → the same serialize */
    await openFile(atomic); const o = LW.serialize(); o.presentation.layout.at = 0; o.presentation.quality.autoScale = 1; out.atomicBytes = fnv(JSON.stringify(o));
    out.errs = (window.__e || []).map(String).slice(0, 10);
    return out;`);
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { await g.close(); }
fs.writeFileSync(new URL(`./w129-chem.${TAG}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
