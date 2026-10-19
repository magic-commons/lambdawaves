// Q5 · the compositor's cost of the blur: the timeline open over benzene, PLAYING, first-run material (light, refractive,
// ALWAYS frost, 22 px), in a HEADED Firefox on the session display (Gecko's real compositor: WebRender renders backdrop-filter;
// a headless run does not pay for it).  120 frames per read, the Q5 law ON (after) and OFF (before: the rule deleted from
// skin.css through the CSSOM, the row's only change) interleaved four times each in the same page, and the kit's census.
//   DISPLAY=:0 LW_PORT=9441 GD_PORT=5441 node research/iteration-011/q5-shots/q5-perf.mjs [tag]
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open } from '../../../tools/gate/gatekit.mjs';

const tag = process.argv[2] || 'perf';
const HERE = dirname(fileURLToPath(import.meta.url));
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9441}/lab/?warn=0&sw=0`,
  { width: 1500, height: 950, headless: false, prefs: { 'privacy.reduceTimerPrecision': false } });
const ev = async (body) => { const r = await g.ev(body); if (r && r.E) throw new Error('page threw: ' + r.E); return r; };
const R = { tag, at: new Date().toISOString(), reads: [] };
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.timeline', 3000, 20);
  R.boot = await ev(`try { __LW.warning.dismiss(); } catch (_) {} window.__w = (ms) => new Promise((r) => setTimeout(r, ms));
    try { const p = document.getElementById('lwMenu'); if (p && !p.hidden) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', bubbles: true })); } catch (_) {}
    await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); __LW.timeline.open(); await __LW.settle(); await __w(800);
    const { census } = await import('./mir/shell/gui.js');
    const sh = [...document.styleSheets].find((s) => (s.href || '').endsWith('/skin.css'));
    const i = [...sh.cssRules].findIndex((r) => r.selectorText && r.selectorText.includes(':not(:where(.tl-toolbar'));
    window.__q5 = { sh, i, text: sh.cssRules[i].cssText,
      off() { if (this.sh.cssRules[this.i] && this.sh.cssRules[this.i].cssText === this.text) this.sh.deleteRule(this.i); },
      on() { if (!this.sh.cssRules[this.i] || this.sh.cssRules[this.i].cssText !== this.text) this.sh.insertRule(this.text, this.i); } };
    return { fieldOk: __LW.field.ok, rule: i, adapter: __LW.field.adapterInfo, dpr: devicePixelRatio, w: innerWidth, h: innerHeight, card: document.body.dataset.card,
      theme: __LW.theme, frostLive: __LW.frostLive, census: census() };`);
  console.log('boot', JSON.stringify(R.boot));
  await ev(`__LW.play(); await __w(2000); return 1;`);
  for (let i = 0; i < 8; i++) {
    const mode = i % 2 ? 'before' : 'after';
    const r = await ev(`__q5.${mode === 'before' ? 'off' : 'on'}(); await __w(800); __LW.perf.resetRing(); const iv = []; let last = performance.now();
      await new Promise((done) => { const step = (t) => { iv.push(t - last); last = t; if (iv.length < 121) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
      iv.shift(); const s = iv.slice().sort((a, b) => a - b), q = (p) => +s[Math.floor(p * (s.length - 1))].toFixed(2);
      const mean = iv.reduce((a, b) => a + b, 0) / iv.length;
      return { frames: iv.length, fps: +(1000 / mean).toFixed(1), medianMs: q(.5), p90Ms: q(.9), p99Ms: q(.99), loopMedianMs: +(__LW.perf.median || 0).toFixed(3), frostLive: __LW.frostLive, blurred: (await import('./mir/shell/gui.js')).census().blur, fieldOk: __LW.field.ok };`);
    r.mode = mode; R.reads.push(r); console.log('read', i, mode, JSON.stringify(r));
  }
  await ev(`__LW.pause(); return 1;`);
  R.errs = await ev('return window.__e');
} finally { await g.close(); }
writeFileSync(join(HERE, `${tag}.json`), JSON.stringify(R, null, 1));
