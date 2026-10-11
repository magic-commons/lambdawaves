/* tools/status-probe.mjs — 0.5.4 P4's two page-side proofs of THE STATUS LINE (lab/status.js), in the gate's real headless Firefox.
 *   python3 tools/gate/server.py "$PWD" 9033 &        (stop it by pid afterwards)
 *   LW_PORT=9033 GD_PORT=5503 node tools/status-probe.mjs [--part frames|hit|all] [--eye research/release-0.5.4/eye] [--json .tmp/status-probe.json]
 * 1 THE NO-FRAME-CALL PROBE (THE STUTTER LAW, a gate): lab/status.js' own witness `statusCalls()` (read through the page's module map — an injected
 *   module script, the same URL, so the same instance the app imported; the boot's first write proves it counts) and a counting wrapper on __LW.chem.capability.  Water solved, MOLECULES on; across 3 s of PLAYBACK — the
 *   transport playing AND the molecule's RUN pumping the worker every frame — both counts move by 0 while the frame counter and the real-time steps
 *   move; across ONE VIEW change statusOf is called exactly once and the STATUS row reads the new VIEW's line.  Beside it, for the record: a FLOW
 *   toggle, a landing, the owner handed back to hydrogen (1 each), hydrogen's own VIEW change and 3 s of hydrogen playback (0 each).
 * 2 THE HIT-PROBE of the STATUS row at PHONE width (500 × 930: Firefox's headless floor, the phone breakpoint) and TABLET width (an iPad UA at
 *   1366 × 1024): INFORMATIONAL opened and raised (an OTHER window starts folded), water's DENSITY line on the row, the row the topmost thing at its own centre (gatekit's tap law), a real
 *   pointer tap opens the MODEL sheet; the row's text measured against its two-line lane; a PNG of each (the pair) under --eye.
 * Exit 0 only when every clause holds.  Writes nothing under lab/. */
import fs from 'node:fs'; import path from 'node:path';
import { open } from './gate/gatekit.mjs';

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const PART = opt('--part', 'all'), EYE = opt('--eye', 'research/release-0.5.4/eye'), OUT = opt('--json', '.tmp/status-probe.json');
const LAB = `https://127.0.0.1:${process.env.LW_PORT || 9033}/lab/?warn=0`;
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ROW = '.dev[data-id="informational"] .ro';
const out = {}; let red = 0;
const judge = (ok, what, detail) => { console.log((ok ? 'PASS ' : 'RED  ') + what + (detail === undefined ? '' : '  ' + JSON.stringify(detail).slice(0, 700))); if (!ok) red++; };
const HELPERS = `window.__w = (n) => new Promise((r) => setTimeout(r, n));
  /* the PAGE's module map: an injected module script, because a driver script's own import() lands in its sandbox's map — another instance, another count */
  if (!window.__S) { const m = document.createElement('script'); m.type = 'module'; m.textContent = "import * as S from './status.js'; window.__S = S;"; document.head.append(m); for (let i = 0; i < 200 && !window.__S; i++) await __w(20); }
  if (!window.__capN) { const c = __LW.chem, f = c.capability.bind(c); window.__capN = 0; c.capability = (...a) => { window.__capN++; return f(...a); }; }
  window.__n = () => ({ status: __S.statusCalls(), capability: __capN });
  window.__row = () => { const r = document.querySelector('${ROW}'); return r ? { line: r.querySelector('.ro-val').textContent, sub: (r.querySelector('.ro-sub') || {}).textContent || '' } : null; };
  return 1;`;
const page = async (o) => { const g = await open(LAB, { script: 240000, ...o }); if ((await g.waitFor('window.__LW && __LW.ready', 300, 100)).ok !== 1) throw new Error('the lab never reached LW.ready'); await g.ev(HELPERS); return g; };
const ev = async (g, body) => { const r = await g.ev(body); if (r && r.E) throw new Error('page threw: ' + r.E); return r; };

if (PART !== 'hit') {
  const g = await page({ width: 1500, height: 1000 });
  try {
    const f = await ev(g, `const d = (a, b) => ({ status: b.status - a.status, capability: b.capability - a.capability });
      const boot = { ...__n(), row: __row() };
      await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle(); await __w(400);
      const water = __row();
      /* 3 s of PLAYBACK: the transport and the molecule's RUN, both started BEFORE the window opens */
      __LW.play(); __LW.chem.setRun(true); await __w(500);
      const p0 = __n(), fr0 = __LW.perf.counts.frames, st0 = __LW.chem.state().steps; await __w(3000);
      const p1 = __n(), fr1 = __LW.perf.counts.frames, st1 = __LW.chem.state().steps;
      __LW.chem.setRun(false); __LW.pause(); await __w(300);
      /* ONE VIEW change */
      const v0 = __n(); __LW.chem.setView('orbital'); await __w(200); const v1 = __n(), orbital = __row();
      const fl0 = __n(); __LW.chem.setFlow(true); await __w(200); const fl1 = __n(), flow = __row(); __LW.chem.setFlow(false); await __w(100);
      __LW.chem.setView('density'); await __w(100);
      const l0 = __n(); await __LW.chem.solve('C6H6'); await __LW.settle(); await __w(300); const l1 = __n(), benzene = __row();
      const c0 = __n(), cap = __LW.chem.capability(), sol = __LW.chem.solution(), capSelf = __n().capability - c0.capability;
      const capOk = !!cap && cap.status === __LW.chem.said && cap.identity === sol.identity && cap.derivatives === 'UNKNOWN'
        && JSON.stringify(cap.limits) === JSON.stringify({ lmax: 2, Z: 36, densityAO: 128, orbitalAO: 768 }) && cap.precision.law === __S.FIELD_LAW;
      const o0 = __n(); __LW.chem.setOn(false); await __LW.settle(); await __w(300); const o1 = __n(), hydrogen = __row();
      const h0 = __n(); __LW.setView('phase'); await __w(200); __LW.setView('density'); await __w(200); const h1 = __n();
      __LW.play(); await __w(300); const hp0 = __n(), hf0 = __LW.perf.counts.frames; await __w(3000); const hp1 = __n(), hf1 = __LW.perf.counts.frames; __LW.pause();
      return { boot, water, playback: { ...d(p0, p1), frames: fr1 - fr0, rtSteps: st1 - st0 }, view: d(v0, v1), orbital, flowToggle: d(fl0, fl1), flow,
        landing: d(l0, l1), benzene, capOk: capOk && capSelf === 1, cap: cap && { limits: cap.limits, derivatives: cap.derivatives, caps: cap.caps, observables: cap.observables, word: cap.status && cap.status.word },
        owner: d(o0, o1), hydrogen, hydrogenView: d(h0, h1), hydrogenPlayback: { ...d(hp0, hp1), frames: hf1 - hf0 }, errs: (window.__e || []).slice() };`);
    out.frames = f;
    judge(f.boot.status >= 1 && f.boot.row.line === 'HYDROGEN · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)', 'the witness counts: the boot wrote hydrogen\'s row through statusOf', f.boot);
    judge(f.playback.status === 0 && f.playback.capability === 0 && f.playback.frames > 30 && f.playback.rtSteps > 0,
      'THE STUTTER LAW: 3 s of playback (transport + RUN) call statusOf 0 times and capability 0 times', f.playback);
    judge(f.view.status === 1 && f.view.capability === 0 && /^ORBITAL · NUMERICAL · sign and phase are arbitrary$/.test(f.orbital.line),
      'one VIEW change calls statusOf exactly once and the row follows it', { view: f.view, row: f.orbital });
    judge(/^DENSITY · NUMERICAL · energy agrees with PySCF to \de-\d+ Eh · picture good to 0\.2 % of ρmax$/.test(f.water.line), 'water\'s DENSITY line on the row', f.water);
    judge(f.flowToggle.status === 1 && /^FLOW · NUMERICAL · direction exact, size qualitative$/.test(f.flow.line), 'a FLOW toggle: one call, the FLOW line', { n: f.flowToggle, row: f.flow });
    judge(f.landing.status === 1 && /^DENSITY · NUMERICAL · energy agrees with PySCF to \de-\d+ Eh · picture good to 0\.2 % of ρmax$/.test(f.benzene.line), 'a landing (benzene, its catalogue row): one call', { n: f.landing, row: f.benzene });
    judge(f.capOk, 'chem.capability() (the wrapper counted the probe\'s own call): the kept status, the solve\'s identity, derivatives UNKNOWN, the engine\'s limits, the field law', f.cap);
    judge(f.owner.status === 1 && f.hydrogen.line === 'HYDROGEN · EXACT · picture good to 3e-6 RMS (worst voxel 2e-4)' && f.hydrogen.sub === '', 'MOLECULES off: one call, hydrogen\'s line', { n: f.owner, row: f.hydrogen });
    judge(f.hydrogenView.status === 0 && f.hydrogenPlayback.status === 0 && f.hydrogenPlayback.frames > 30, 'hydrogen: a VIEW change and 3 s of playback call nothing', { view: f.hydrogenView, playback: f.hydrogenPlayback });
    judge(f.errs.length === 0, 'no page error', f.errs);
  } finally { await g.close(); }
}

if (PART !== 'frames') {
  fs.mkdirSync(EYE, { recursive: true });
  out.hit = {};
  for (const [name, o] of [['phone', { width: 500, height: 930 }], ['tablet', { width: 1366, height: 1024, prefs: { 'general.useragent.override': IPAD } }]]) {
    const g = await page(o);
    try {
      const pre = await ev(g, `await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle();
        if (document.body.classList.contains('rack-hidden')) __LW.layout.toggleRack();
        __LW.layout.reopen('informational'); __LW.layout.raise('informational'); await __w(600);   /* OTHER windows start folded (window-chrome.js): raise() unfolds */
        const d = document.querySelector('.dev[data-id="informational"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await __w(600);
        const r = document.querySelector('${ROW}'); r.scrollIntoView({ block: 'center' }); await __w(600);
        const v = r.querySelector('.ro-val'), b = r.getBoundingClientRect(), lh = parseFloat(getComputedStyle(v).lineHeight);
        return { phone: __LW.layout.phone.on, tablet: __LW.layout.tablet.on, row: __row(), box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
          lines: Math.round(v.scrollHeight / lh), fits: v.scrollHeight <= v.clientHeight + 1 && v.scrollWidth <= v.clientWidth + 1, ellipsis: getComputedStyle(v).whiteSpace === 'nowrap', sheet: !document.getElementById('sheet').hidden };`);
      fs.writeFileSync(path.join(EYE, `status-row-${name}.png`), Buffer.from(await g.snap(), 'base64'));
      const tap = await g.tap(ROW);
      const post = await ev(g, `await __w(300); const s = document.getElementById('sheet'); return { sheet: !s.hidden, words: /EXACT.*NUMERICAL.*UNCHECKED/.test(s.textContent), errs: (window.__e || []).slice() };`);
      out.hit[name] = { ...pre, tap, ...post };
      judge(pre[name] === true, `${name}: the lab says it is a ${name}`, { phone: pre.phone, tablet: pre.tablet });
      judge(tap && tap.ok === 1 && !pre.sheet && post.sheet && post.words, `${name}: the STATUS row is the topmost thing at its centre and a real tap opens the MODEL sheet, which defines the three words`, { tap, box: pre.box, before: pre.sheet, after: post.sheet });
      judge(/^DENSITY · NUMERICAL/.test(pre.row.line) && pre.fits && !pre.ellipsis && pre.lines >= 1, `${name}: water's line fits its lane (${pre.lines} line${pre.lines > 1 ? 's' : ''})`, { row: pre.row, lines: pre.lines, fits: pre.fits, ellipsis: pre.ellipsis });
      judge(post.errs.length === 0, `${name}: no page error`, post.errs);
    } finally { await g.close(); }
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log((red ? 'RED' : 'GREEN') + ` status-probe — ${red} failing (${OUT})`);
process.exit(red ? 1 : 0);
