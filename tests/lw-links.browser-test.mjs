// 0.5.1 D8 · `lw:` LINKS in the notebook's VIEW, in the real page, pressed by a real pointer: `[density](lw:view=density)` changes the
// observable, `[water](lw:molecule=h2o)` picks WATER (MOLECULES on) and its head shows once, `[lumo](lw:molecule=nh3&orbital=lumo)`
// picks NH₃ and shows its LUMO — each press exactly ONE history row and exactly ONE fade (a molecule's fade is its head), the ring
// never cleared, `window.open` never called and no tab opened; `[x](lw:s=abc)` (a whole state, refused) does nothing and the foot
// says so; a plain https link still opens its new tab.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import http from 'node:http';
import { open } from '../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8701;
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 120000 });
/* the driver's own window list (WebDriver), to see a tab open or not */
const wd = (method, path, body) => new Promise((res, rej) => {
  const data = body ? JSON.stringify(body) : null;
  const r = http.request({ host: '127.0.0.1', port: Number(process.env.GD_PORT || 4444), path: '/session/' + g.s + path, method,
    headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (x) => {
    let b = ''; x.on('data', (d) => { b += d; }); x.on('end', () => { try { res(JSON.parse(b).value); } catch (e) { rej(e); } });
  });
  r.on('error', rej); if (data) r.write(data); r.end();
});
const handles = () => wd('GET', '/window/handles');
let failed = false;
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
const link = (href) => `#notebook .nb-view a[href="${href}"]`;
/** one press of a link, by a real pointer, and what it did: the ring's rows, the fades, the opens, the tabs */
async function press(href, settle = 900) {
  const before = await ev(`return { rows: __LW.history.cursor, n: __LW.history.entries().length, ann: __LW.stageText.stats.announced, heads: __LW.head.shown };`);
  const h0 = await handles();
  assert.deepEqual(await g.tap(link(href)), { ok: 1 }, 'the link cannot be pressed: ' + href);
  const after = await ev(`await __w(${settle}); __LW.history.flush(); await __w(50);
    const E = __LW.history.entries();
    return { rows: __LW.history.cursor, n: E.length, last: E[E.length - 1].label, labels: E.slice(-4).map((e) => e.label), bottom: E[0].label, ann: __LW.stageText.stats.announced, heads: __LW.head.shown, banner: __LW.stageText.banner,
      opens: window.__opens, href: location.href, foot: document.querySelector('#notebook .nb-count').textContent, mode: __LW.notebook.mode };`);
  const h1 = await handles();
  return { ...after, before, rows: after.rows - before.rows, fades: after.ann - before.ann, heads: after.heads - before.heads, tabs: h1.length - h0.length };
}
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);
  /* the notes, typed into the notebook, then its ◐ pressed to the view */
  const md = ['[density](lw:view=density)', '[water](lw:molecule=h2o)', '[lumo](lw:molecule=nh3&orbital=lumo)', '[x](lw:s=abc)', `[here](https://127.0.0.1:${PORT}/lab/manifest.webmanifest)`].join('\n\n');
  /* iteration 007 I: THE FADE and THE HEAD are INFORMATIONAL › ANNOUNCE kinds, off on a first run; switched on in the record first */
  const t0 = await ev(`__LW.stageText.prefs.set({ sayPreset: true, sayHead: true }); window.__w = (n) => new Promise((r) => setTimeout(r, n));
    window.__opens = 0; window.open = () => { window.__opens++; return null; };
    __LW.layout.notebook.open('notes'); await __w(200);
    const ta = document.querySelector('#notebook .nb-text'); ta.focus(); ta.value = ${JSON.stringify(md)}; ta.dispatchEvent(new Event('input', { bubbles: true }));
    __LW.setView('density'); const D = __LW.mat.view; __LW.setView('phase'); const P = __LW.mat.view;
    await __w(500); __LW.history.flush(); await __w(500); __LW.history.flush();
    return { D, P, rows: __LW.history.cursor, n: __LW.history.entries().length, bottom: (__LW.history.entries()[0] || {}).label || null };`);
  assert.deepEqual(await g.tap('#notebook .nb-mode'), { ok: 1 });
  const v = await ev(`await __w(300); const a = [...document.querySelectorAll('#notebook .nb-view a')];
    return { mode: __LW.notebook.mode, links: a.map((x) => [x.getAttribute('href'), x.getAttribute('target')]) };`);
  assert.equal(v.mode, 'view');
  assert.deepEqual(v.links.map((l) => l[0]), ['lw:view=density', 'lw:molecule=h2o', 'lw:molecule=nh3&orbital=lumo', 'lw:s=abc', `https://127.0.0.1:${PORT}/lab/manifest.webmanifest`],
    'the renderer did not keep the lw: hrefs as written: ' + JSON.stringify(v.links));
  assert.ok(v.links.every((l) => l[1] === '_blank'), 'the sanitiser no longer sends links to a new tab (the capture press is what stops it): ' + JSON.stringify(v.links));

  /* ── 1 · [density]: the observable changes; one row, one fade, no open, no tab ── */
  const d = await press('lw:view=density');
  const dv = await ev(`return __LW.mat.view;`);
  assert.equal(dv, t0.D, 'the view did not change to density: ' + JSON.stringify({ dv, t0 }));
  assert.deepEqual([d.rows, d.fades, d.heads, d.opens, d.tabs], [1, 1, 0, 0, 0], 'density: ' + JSON.stringify(d));
  assert.ok(/^LINK · density$/.test(d.last) && d.bottom === 'boot' && /\/lab\/\?preset=1s%2B2pz$/.test(d.href), 'density: ' + JSON.stringify(d));
  pass(`[density](lw:view=density): the observable phase → density, one ring row ("${d.last}"), one fade ("VIEW · density"), window.open 0, no tab, the page stayed`);

  /* ── 2 · [water]: WATER picked, MOLECULES on, its head once — and that head is the press's one fade ── */
  const w = await press('lw:molecule=h2o', 1500);
  const wc = await ev(`return { preset: __LW.chem.preset(), on: __LW.chem.on, head: __LW.head.md };`);
  assert.deepEqual([w.rows, w.fades, w.heads, w.opens, w.tabs], [1, 1, 1, 0, 0], 'water: ' + JSON.stringify(w));
  assert.ok(wc.preset === 'H2O' && wc.on && /water/.test(wc.head) && w.banner === wc.head, 'water: ' + JSON.stringify({ w, wc }));
  pass(`[water](lw:molecule=h2o): WATER picked and MOLECULES on, its head shown once and it is the press's one fade; one ring row ("${w.last}"); no open, no tab`);

  /* ── 3 · [lumo]: NH₃ picked and its LUMO on the field (VIEW orbital) when its solve lands — still one row, one fade ── */
  const l = await press('lw:molecule=nh3&orbital=lumo', 1500);
  const lc = await ev(`const s = __LW.chem.state(); return { preset: s.preset, view: s.view, orbital: s.orbital, nocc: s.nocc, name: s.orbitalName };`);
  assert.deepEqual([l.rows, l.fades, l.heads, l.opens, l.tabs], [1, 1, 1, 0, 0], 'lumo: ' + JSON.stringify(l));
  assert.ok(lc.preset === 'NH3' && lc.view === 'orbital' && lc.orbital === lc.nocc + 1 && /LUMO/.test(lc.name), 'lumo: ' + JSON.stringify(lc));
  pass(`[lumo](lw:molecule=nh3&orbital=lumo): NH₃ picked, ${lc.name} (orbital ${lc.orbital}) on the field once its solve landed — one row, one fade (the head)`);

  /* ── 4 · [x](lw:s=abc): a whole state is not a verb — nothing happens, and the foot says so ── */
  const x = await press('lw:s=abc', 300);
  assert.deepEqual([x.rows, x.fades, x.heads, x.opens, x.tabs], [0, 0, 0, 0, 0], 'lw:s: ' + JSON.stringify(x));
  assert.equal(x.foot, 'ignored: s', 'the foot did not say the key was ignored: ' + JSON.stringify(x));
  pass(`[x](lw:s=abc): nothing changed (0 rows, 0 fades, no open, no tab) and the foot says "${x.foot}"`);

  /* ── 5 · a plain https link still opens its new tab (the press is the browser's, not window.open) ── */
  const h0 = await handles();
  const p = await press(`https://127.0.0.1:${PORT}/lab/manifest.webmanifest`, 1200);
  const h1 = await handles();
  assert.ok(p.tabs === 1 && p.opens === 0 && p.rows === 0, 'the https link: ' + JSON.stringify(p));
  const extra = h1.filter((h) => !h0.includes(h));
  for (const h of extra) { await wd('POST', '/window', { handle: h }); await wd('DELETE', '/window'); }
  await wd('POST', '/window', { handle: h0[0] });
  const ring = await ev(`return { bottom: __LW.history.entries()[0].label, rows: __LW.history.cursor, errs: (window.__e || []).slice() };`);
  assert.equal(ring.bottom, 'boot', 'a link press cleared the ring');
  assert.equal(ring.rows, t0.rows + 3, 'the ring did not grow by exactly the three verb presses: ' + JSON.stringify({ ring, t0 }));
  assert.deepEqual(ring.errs, []);
  pass(`a plain https link opened its tab (handles ${h0.length} → ${h1.length}, window.open 0) and was closed; the ring's bottom row is still "${ring.bottom}" and it grew by exactly 3`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED lw-links' : 'GREEN lw-links');
process.exit(failed ? 1 : 0);
