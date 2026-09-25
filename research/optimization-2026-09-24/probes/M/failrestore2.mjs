/* failrestore2.mjs — lane M · M5b gate: a failed open leaves the instrument as it was.  BASE (lab-base) vs built lab/,
 * plus lab-rbfail (built, with the roll-back snapshot deliberately broken, mk-rbfail.py) for the fallback road.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/failrestore2.mjs
 * The broken file: an importable envelope whose palette.stops = [5] makes restore() throw half-way.
 *   A  from a clean, different state with NO project current: open broken → state back? clean? a plain SAVE overwrites?
 *   B  a GOOD project current and clean: open broken → current, notebook, serialize (layout.at zeroed) and fieldDigest
 *      back as before, clean again; a plain SAVE must not change the good file.
 *   C  the good project current but DIRTY (an edit after opening): after the failed open it is still dirty and the edit
 *      is back on screen.
 *   R  (lab-rbfail) the roll-back itself fails: nothing is current, the status says so, a plain SAVE writes nothing. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const out = {};
for (const [tag, p] of [['base', M + 'lab-base/'], ['built', 'lab/'], ['rbfail', M + 'lab-rbfail/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`
      const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h; };
      const P = __LW.layout.projects, KEY = 'lambdawaves.q0.projects', items = () => JSON.parse(localStorage.getItem(KEY)).items;
      const ser = () => { const o = __LW.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; return H(JSON.stringify(o)); };
      const dig = async () => { __LW.schedule(4); await __LW.settle(); await __LW.settle(); return (await __LW.fieldDigest()).hash; };
      const nb = () => document.querySelector('.nb-text').value + '|' + document.querySelector('.nb-title').value;
      const st = () => document.querySelector('.pj-status').textContent;
      __LW.schedule(4); await __LW.settle();
      const good = JSON.parse(JSON.stringify(__LW.serialize()));
      const broken = JSON.parse(JSON.stringify(good)); broken.presentation.palette.stops = [5];
      const bp = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/broken', data: broken, notebook: { title: 'broken', text: 'the broken notes' } }));
      const res = {};
      /* A */
      __LW.loadPreset('2pz'); await __LW.settle(); P.markClean();
      const flat = (o, p = '', acc = {}) => { if (o && typeof o === 'object') { for (const k of Object.keys(o)) flat(o[k], p ? p + '.' + k : k, acc); } else acc[p] = o; return acc; };
      const raw = () => { const o = __LW.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; return flat(JSON.parse(JSON.stringify(o))); };
      const leafDiff = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => x[k] !== y[k]).slice(0, 12).map((k) => [k, x[k], y[k]]);
      let s0 = ser(), d0 = await dig(), n0 = nb(), r0 = raw();
      let opened = P.open(bp); let d1 = await dig();
      res.Adiff = leafDiff(r0, raw());
      const bA = JSON.stringify(items()[bp].data); const savedA = P.save();
      res.A = { opened, status: st(), current: P.current, dirty: P.dirty, stateBack: ser() === s0, digestBack: d1 === d0, notebookKept: nb() === n0, saved: savedA, saveOverwrote: savedA && bA !== JSON.stringify(items()[bp].data) };
      /* B */
      __LW.loadPreset('1s+2pz'); __LW.setStage(0.3); document.querySelector('.nb-text').value = 'good notes'; P.save('probe/good'); P.open('probe/good'); await __LW.settle();
      P.save(); await __LW.settle();   /* the good file as THIS state saves it (restore normalises e.g. mat.finish null → 'lit'), so a later SAVE of the same state is byte-comparable */
      const zat = (d) => { const o = JSON.parse(JSON.stringify(d)); if (o.presentation && o.presentation.layout) o.presentation.layout.at = 0; return JSON.stringify(o); };   /* layout.at is a Date.now() inside every save */
      const goodFile = zat(items()['probe/good'].data);
      s0 = ser(); d0 = await dig(); n0 = nb(); const dirty0 = P.dirty;
      opened = P.open(bp); d1 = await dig();
      res.B = { opened, status: st(), current: P.current, dirtyBefore: dirty0, dirty: P.dirty, stateBack: ser() === s0, digestBack: d1 === d0, digests: [d0, d1], notebookKept: nb() === n0 };
      const savedB = P.save(); res.B.saved = savedB; res.B.overwroteGood = savedB && goodFile !== zat(items()['probe/good'].data);
      res.B.overwroteBroken = JSON.stringify(items()[bp].data) !== JSON.stringify(broken);
      /* C */
      P.open('probe/good'); await __LW.settle(); __LW.setStage(0.55); await __LW.settle();
      s0 = ser(); d0 = await dig(); const dirtyC = P.dirty;
      opened = P.open(bp); d1 = await dig();
      res.C = { opened, dirtyBefore: dirtyC, dirty: P.dirty, stateBack: ser() === s0, digestBack: d1 === d0, current: P.current };
      res.errs = window.__e;
      return res;`);
    console.log(tag, JSON.stringify(out[tag]));
  } finally { await g.close(); }
}
const b = out.built, r = out.rbfail;
/* A starts from a boot state that never went through restore(): its mat.finish is null, and the restore road (the
   roll-back's road, by ruling) normalises that to 'lit' — the same picture (digest checked); nothing else may differ */
const onlyFinish = (d) => d.every(([k, x, y]) => k === 'presentation.mat.finish' && x === null && y === 'lit');
const passA = b.A.opened === false && b.A.current === null && b.A.dirty === false && (b.A.stateBack || onlyFinish(b.Adiff)) && b.A.digestBack && b.A.notebookKept && b.A.saveOverwrote === false;
const passB = b.B.opened === false && b.B.current === 'probe/good' && b.B.dirty === b.B.dirtyBefore && b.B.stateBack && b.B.digestBack && b.B.notebookKept && b.B.overwroteGood === false && b.B.overwroteBroken === false;
const passC = b.C.opened === false && b.C.dirtyBefore === true && b.C.dirty === true && b.C.stateBack && b.C.digestBack && b.C.current === 'probe/good';
const passR = r.B.opened === false && r.B.current === null && /could not be put back/.test(r.B.status) && r.B.saved === false && r.B.overwroteGood === false;
console.log('A', passA, ' B', passB, ' C', passC, ' R(roll-back fails)', passR, ' errors', b.errs.length);
console.log((passA && passB && passC && passR && b.errs.length === 0 ? 'GREEN' : 'RED') + ' M5b: a failed open leaves the instrument as it was (A, B, C); a failed roll-back leaves nothing current (R)');
process.exit(passA && passB && passC && passR && b.errs.length === 0 ? 0 : 1);
