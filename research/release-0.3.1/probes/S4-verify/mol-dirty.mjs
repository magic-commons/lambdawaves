// S4 VERIFY item 9 (the recorded limit's cost): after NEW, MOLECULES ON (real click) then Ctrl+Z (real key) — is the project
// marked unsaved, does NEW then ask, and which saved keys moved?  Also with the same undo by the API.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/mol-dirty.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const molClick = async () => { const xy = await g.run(`const s = __sw('MOLECULES ON'); __LW.layout.reopen('chem'); await __w(300); __show(s); await __w(250); let p = __at(s.querySelector('button') || s); if (!p) { if (__LW.layout.notebook.isOpen) __LW.layout.notebook.close(); await __w(300); __show(s); await __w(200); p = __at(s.querySelector('button') || s); } return p || { E: window.__coveredBy };`); if (!xy || xy.E) { console.log('MOLECULES covered by ' + (xy && xy.E) + ' — synthetic press instead'); await g.run(`const s = __sw('MOLECULES ON'); await __spress(s.querySelector('button') || s); return 1;`); return; } await g.click(xy[0], xy[1]); };
try {
  for (const road of ['key', 'api']) {
    await g.run(`const c0 = window.confirm; window.confirm = () => true; await __LW.layout.projects.fresh(); window.confirm = c0; await __w(900);
      const S = __LW.serialize(); window.__base = JSON.stringify({ e: S.experiment, p: S.presentation }); return 1;`);
    const d0 = await g.run(`return __LW.layout.projects.dirty;`);
    await molClick(); await g.run(`await __w(1300); return 1;`);
    if (road === 'key') { await blur(); await g.key('z', ['']); } else await g.run(`__LW.history.undo(); return 1;`);
    const r = await g.run(`const P = __LW.layout.projects, t = []; for (let i = 0; i < 6; i++) { await __w(500); t.push(P.dirty); }
      const S = __LW.serialize(), B = JSON.parse(__base), now = { e: S.experiment, p: S.presentation };
      const skip = /\\.(layout|modwin|camera|notebook|quality|obs)(\\.|$)|\\.mat\\.steps|\\.experiment\\.t$|^\\.e\\.t$/;
      const d = __diff(B, now).filter((x) => !skip.test(x.split(':')[0]));
      let asked = 0; const c0 = window.confirm; window.confirm = () => { asked++; return false; }; const ok = await P.requestFresh(); window.confirm = c0;
      return { chemOn: __LW.chem.on, dirtyOver3s: t, diff: d, requestFreshAsked: asked, requestFreshResult: ok };`);
    out[road] = { dirtyAfterNew: d0, ...r };
    console.log(road, JSON.stringify(out[road], null, 1));
  }
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
