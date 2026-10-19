// Q5 · THE BLUR, ONLY WHERE IT BELONGS — the probe behind research/iteration-011/Q5-BUILD.md.
// For each scene (the timeline open over a molecule, the rack cards, a menu, the Picker, the modulation window, the
// keyboard pane, the notebook) it lists every painted element (and ::before/::after) whose COMPUTED backdrop-filter is
// not `none`, and takes a screenshot.  First-run material (a fresh Firefox profile), light or dark, desktop or phone.
//   LW_PORT=9441 GD_PORT=5441 node research/iteration-011/q5-shots/q5-probe.mjs <tag> [light|dark] [desktop|phone] [--perf]
// Writes q5-shots/<tag>-<theme>-<device>-<scene>.png and q5-shots/<tag>-<theme>-<device>.json.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open } from '../../../tools/gate/gatekit.mjs';

const [tag = 'probe', theme = 'light', device = 'desktop'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PERF = process.argv.includes('--perf');
const HERE = dirname(fileURLToPath(import.meta.url));
const phone = device === 'phone';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9441}/lab/?warn=0&sw=0`,
  { width: phone ? 500 : 1500, height: phone ? 930 : 950, prefs: PERF ? { 'privacy.reduceTimerPrecision': false } : undefined });
const ev = async (body) => { const r = await g.ev(body); if (r && r.E) throw new Error('page threw: ' + r.E); return r; };
const out = { tag, theme, device, scenes: {} };

const INVENTORY = `
  const name = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id;
    const c = [...e.classList].slice(0, 4); if (c.length) s += '.' + c.join('.');
    const w = e.closest('[data-mir-window]'); if (w && w !== e) s = '[' + w.dataset.mirWindow + '] ' + s;
    else if (e.dataset && e.dataset.mirWindow) s += '[data-mir-window=' + e.dataset.mirWindow + ']';
    const d = e.closest('.dev[data-id]'); if (d && d !== e && !w) s = '.dev[' + d.dataset.id + '] ' + s;
    else if (e.classList.contains('dev') && e.dataset.id) s += '[' + e.dataset.id + ']';
    return s; };
  /* visibility is inherited and a child may override it (a disconnected .dev is visibility: hidden, its head and body are
     visible), so it is read on the element alone; display and opacity hide a whole subtree */
  const seen = (e) => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    if (getComputedStyle(e).visibility !== 'visible') return false;
    for (let p = e; p; p = p.parentElement) { const cs = getComputedStyle(p);
      if (cs.display === 'none' || +cs.opacity === 0) return false; } return true; };
  const rows = [];
  for (const e of document.querySelectorAll('body *')) {
    for (const pseudo of [null, '::before', '::after']) {
      const f = getComputedStyle(e, pseudo).backdropFilter;
      if (!f || f === 'none') continue;
      if (!seen(e)) continue;
      const r = e.getBoundingClientRect();
      rows.push({ el: name(e) + (pseudo || ''), filter: f, w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  return { body: document.body.className, card: document.body.dataset.card, theme: document.body.dataset.theme,
    frostLive: __LW.frostLive, rows };`;

const shot = async (scene) => {
  const b64 = await g.snap();
  writeFileSync(join(HERE, `${tag}-${theme}-${device}-${scene}.png`), Buffer.from(b64, 'base64'));
};
const scene = async (id, setup) => {
  await ev(setup + `; await new Promise(r => setTimeout(r, 900)); return 1;`);
  out.scenes[id] = await ev(INVENTORY);
  await shot(id);
  console.log(id.padEnd(10), out.scenes[id].rows.length, 'blurred surfaces');
};

try {
  if ((await g.waitFor('window.__LW && __LW.ready && __LW.timeline', 3000, 20)).ok !== 1) throw new Error('no boot');
  await ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    window.__w = (ms) => new Promise((r) => setTimeout(r, ms));
    window.__closeAll = () => { try { __LW.timeline.close(); } catch (_) {} try { __LW.layout.modulation.collapse(); } catch (_) {}
      try { __LW.layout.notebook.close(); } catch (_) {} try { __LW.layout.menu.close(); } catch (_) {}
      try { const p = document.getElementById('lwMenu'); if (p && !p.hidden) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', bubbles: true })); } catch (_) {}
      try { if (__LW.keymap && __LW.keymap.isOpen) __LW.keymap.close(); } catch (_) {}
      document.querySelectorAll('.mb-list').forEach((l) => { l.hidden = true; }); };
    if (${JSON.stringify(theme)} === 'dark') __LW.setTheme('dark');
    __closeAll(); await __w(300);
    await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __LW.settle(); await __w(600); return 1;`);

  await scene('timeline', `__closeAll(); __LW.timeline.open(); await __LW.settle()`);
  if (PERF) {
    /* the compositor's share: rAF intervals (what the screen got) and the loop's own ms (__LW.perf.median), 120 frames,
       PLAYING (t advances, the field repaints under the glass every frame — the case a backdrop blur pays for) */
    out.perf = await ev(`__LW.play && __LW.play(); await __w(1500); __LW.perf.resetRing();
      const iv = []; let last = performance.now();
      await new Promise((done) => { const step = (t) => { iv.push(t - last); last = t; if (iv.length < 121) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
      iv.shift(); const s = iv.slice().sort((a, b) => a - b), q = (p) => +s[Math.floor(p * (s.length - 1))].toFixed(2);
      return { frames: iv.length, rafMedianMs: q(.5), rafP90Ms: q(.9), rafMeanMs: +(iv.reduce((a, b) => a + b, 0) / iv.length).toFixed(2),
        loopMedianMs: +(__LW.perf.median || 0).toFixed(3), frostLive: __LW.frostLive };`);
    console.log('perf', JSON.stringify(out.perf));
    await ev(`__LW.pause && __LW.pause(); return 1;`);
  }
  /* Josh's scene: hard-edged lobes filling the stage behind the open timeline, so a blur (or its absence) reads */
  await scene('josh', `__closeAll(); __LW.chem.setView('orbital'); __LW.setStyle('solid'); __LW.camera.setDist(${phone ? 3.4 : 2.2}); __LW.timeline.open(); await __LW.settle()`);
  await ev(`__LW.chem.setView('density'); __LW.setStyle('cloud'); __LW.camera.reset(); await __LW.settle(); return 1;`);
  await scene('rack', `__closeAll(); for (const id of ['chem', 'settings', 'camera']) { const d = document.querySelector('.dev[data-id="' + id + '"]');
    if (d && d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); }`);
  await scene('menu', `__closeAll(); __LW.layout.menu.open(); const bar = document.getElementById('menubar');
    const btn = bar && [...bar.querySelectorAll('.mb-btn')].find((b) => b.dataset.menu === 'WINDOW'); if (btn) btn.click()`);
  await scene('picker', `__closeAll(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', bubbles: true }))`);
  await scene('modwin', `__closeAll(); __LW.layout.modulation.expand(); await __LW.settle()`);
  await scene('keyboard', `__closeAll(); if (__LW.keymap && __LW.keymap.open) __LW.keymap.open()`);
  await scene('notebook', `__closeAll(); __LW.layout.notebook.open()`);
  out.errors = await g.errors();
  writeFileSync(join(HERE, `${tag}-${theme}-${device}.json`), JSON.stringify(out, null, 1));
} finally { await g.close(); }
