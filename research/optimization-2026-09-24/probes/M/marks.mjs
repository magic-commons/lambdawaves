/* marks.mjs — lane M · M7 gate: the λ marks after boot, after a project open (WAVE DANCER, a palette + accent change),
 * after a malformed open and after an undo-style restore, BASE (lab-base-pm) vs built (lab-pm) — the paintMarks-counting
 * copies from mk-pm.py, fresh headless Firefox each.  Dump: __LW.logo.colours(), every mark rect's fill + class (all five
 * selectors, in document order), both λ colours, the #busyMark clone's markup, the lwTurn sheet, turn classes.
 * Counts: real paintMarks bodies and their ms at each step.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/marks.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const M = 'research/optimization-2026-09-24/probes/M/';
const out = {};
for (const [tag, p] of [['base', M + 'lab-base-pm/'], ['built', M + 'lab-pm/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`
      const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h; };
      const dump = () => { const rects = [...document.querySelectorAll('#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect, .dev-loading .mark rect')].map((r) => r.getAttribute('fill') + '|' + r.getAttribute('class'));
        const turn = document.getElementById('lwTurn');
        return { colours: __LW.logo.colours().join(','), nRects: rects.length, rects: H(rects.join(',')), lam: [...document.querySelectorAll('#title .lam, .nb-logo .lam')].map((e) => e.style.color).join(','),
          busy: H((document.getElementById('busyMark') || {}).innerHTML || ''), turnCss: H(turn ? turn.textContent : ''), titleMarkClass: document.querySelector('#title .mark').getAttribute('class') }; };
      /* cumulative page counters read as deltas: a write from this (sandboxed) script would not reach the page's global */
      let last = { n: 0, ms: 0 };
      const cnt = () => { const n = window.__pm || 0, ms = window.__pmMs || 0; const r = { n: n - last.n, ms: +(ms - last.ms).toFixed(2) }; last = { n, ms }; return r; };
      const res = { boot: { ...dump(), count: cnt() } };
      await new Promise((r) => setTimeout(r, 2300));  /* the boot's one turn ends (markTurn's 2200 ms timer) */
      res.bootLater = { ...dump(), count: cnt() };
      const P = __LW.layout.projects;
      const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await r.text());
      cnt(); P.open(path); res.demo = { ...dump(), count: cnt() };
      __LW.accent.set(200, 90); __LW.setStage(0.4); P.save('marks/one'); P.fresh(); cnt();
      P.open('marks/one'); res.reopen = { ...dump(), count: cnt() };
      const bad = JSON.parse(JSON.stringify(__LW.serialize())); bad.presentation.palette.stops = [5]; bad.presentation.ui.accent = { a: 10, b: 250, vivid: 0.2 };
      const bp = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'marks/bad', data: bad }));
      cnt(); res.badOpened = P.open(bp); res.bad = { ...dump(), count: cnt() };
      __LW.notebook.open('about'); res.about = { ...dump(), count: cnt() };
      res.errs = window.__e;
      return res;`);
    console.log(tag, JSON.stringify(out[tag]).slice(0, 1600));
  } finally { await g.close(); }
}
let same = true;
for (const k of ['boot', 'bootLater', 'demo', 'reopen', 'bad', 'about']) {
  const a = { ...out.base[k], count: undefined }, b = { ...out.built[k], count: undefined };
  const eq = JSON.stringify(a) === JSON.stringify(b); same = same && eq;
  console.log((eq ? 'SAME ' : 'DIFF ') + k.padEnd(9), 'paints base', JSON.stringify(out.base[k].count), '→ built', JSON.stringify(out.built[k].count), eq ? '' : JSON.stringify(a) + ' vs ' + JSON.stringify(b));
}
same = same && out.built.errs.length === 0;
console.log((same ? 'GREEN' : 'RED') + ' M7: every mark copy, both λ, the busy clone and the turn sheet identical after boot / open / re-open / malformed open / ABOUT');
process.exit(same ? 0 : 1);
