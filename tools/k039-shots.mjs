/* k039-shots.mjs — iteration 039 chain K's one check per door and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9627 GD_PORT=5627 node tools/k039-shots.mjs <scene> [out-dir]
 * Scenes: k1 (THE STEPPED CLOCK LOOPS: PLAYBACK LOCK on, a 2-bar ACTIVE range, 20 s of play — the head wraps; a 3-bar film over the 2-bar
 * loop renders 3 bars).
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9627}/lab/?starter=home&warn=0&sw=0`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const nap = (ms) => g.ev(`await new Promise((r) => setTimeout(r, ${ms})); return 1;`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/k-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': x0, y0, x1, y1 = (int(v) for v in b.split(',')); im = im.crop((x0, y0, min(x1, im.width), min(y1, im.height)))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=84)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, v + (i < 2 ? -pad : pad)))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready && __LW.timeline', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  if (scene === 'k1') {
    /* the check: PLAYBACK LOCK at 60 Hz, 120 BPM, an ACTIVE range of 2 bars (8 beats) from 1.1; play 20 s (40 beats) sampling the head every 250 ms —
       it never reaches 8 and comes back past 1.1 (the loops counter moves); then a 6-s RECORD (3 bars at 120 BPM) from beat 0 with MOD armed: the
       film's frame log runs 0 → 12 beats unlooped (the recorder's step passes nothing) */
    out.setup = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();
      __LW.fieldRate.lock = true; __LW.fieldRate.hz = 60; __LW.mod.clock.setBpm(120); __LW.mod.arm(true);
      const tl = __LW.timeline; tl.editor.setActiveRange({ start: 0, end: 8 }); tl.controller.seek(0); await __LW.settle();
      return { lock: __LW.fieldRate.lock, hz: __LW.fieldRate.hz, bpm: __LW.mod.model.transport.bpm, loop: __LW.mod.clock.loop(), loops0: __LW.mod.clock.stats().loops };`);
    out.play = await g.ev(`__LW.play(); const T0 = performance.now(), seen = []; let max = 0, wraps = 0, prev = -1;
      while (performance.now() - T0 < 20000) { await new Promise((r) => setTimeout(r, 250)); const b = __LW.mod.model.transport.beats; seen.push(+b.toFixed(2)); if (b > max) max = b; if (b < prev - 1) wraps++; prev = b; }
      const loops = __LW.mod.clock.stats().loops, steps = __LW.mod.clock.stats().steps; __LW.pause(); await __LW.settle();
      return { max: +max.toFixed(3), wraps, loops, steps, first: seen.slice(0, 6), last: seen.slice(-6), n: seen.length };`);
    out.film = await g.ev(`const F = __LW.captureUI.exact; F.save = () => true; __LW.timeline.controller.seek(0); await __LW.settle();
      const r = await __LW.captureUI.record(); const fr = (r && r.manifest && r.manifest.frames) || [], beats = fr.map((x) => x.beat).filter(Number.isFinite);
      let mono = true; for (let i = 1; i < beats.length; i++) if (!(beats[i] > beats[i - 1])) mono = false;
      return { ok: r && r.ok, frames: r && r.frames, error: r && r.error, first: beats[0], last: beats.at(-1), mono, n: beats.length };`);
    out.verdict = { headWraps: out.play.max < 8 && out.play.wraps >= 2 && out.play.loops > out.setup.loops0, filmThreeBars: !!out.film.ok && out.film.mono && out.film.first < 0.1 && out.film.last > 11.8 };
  }
  if (scene === 'k2') {
    /* the count: every seg and stepper root in the page (hydrogen, then a molecule), and how many wear a hint on the root itself */
    const count = () => g.ev(`await __LW.settle(); const R = [...document.querySelectorAll('.segw, .mir-step')], tip = (r) => r.dataset.helpEn || r.title || '', hinted = R.filter(tip);
      const where = (r) => (r.closest('.dev') && r.closest('.dev').dataset.id) || (r.closest('[data-mir-window]') && r.closest('[data-mir-window]').dataset.mirWindow) || r.parentElement.className.split(' ')[0];
      return { roots: R.length, hinted: hinted.length, long: hinted.filter((r) => tip(r).length > 60).map(tip), list: hinted.map((r) => where(r) + ': ' + tip(r)) };`);
    out.hydrogen = await count();
    await g.ev(`__LW.run('mode', { id: 'molecules' }); await new Promise((r) => setTimeout(r, 2500)); return 1;`);
    out.molecules = await count();
    /* the node faces: LEVELS and ABERRATION with their feet open (MASK, TARGET and ABERRATION's mode are segs) — the root hint is the kit's now */
    await g.ev(`const N = __LW.nodes; N.open(); await new Promise((r) => setTimeout(r, 600)); N.win.place({ x: 600, y: 40, w: 520, h: 760 }); N.add('levels'); N.add('aberration');
      await new Promise((r) => setTimeout(r, 600)); for (const f of document.querySelectorAll('[data-mir-window="nodes"] .nodes-foot-fold, [data-mir-window="nodes"] [data-fold]')) f.click(); await new Promise((r) => setTimeout(r, 400)); return 1;`);
    out.nodes = await count();
  }
  if (scene === 'k3m' || scene === 'k3') {
    /* every seg in a fit row (hydrogen, a molecule, three nodes with their feet open): its cells now, the room it needs, one cell's width — so the
       one-cell default can be judged row by row; k3 also takes the nodes' full cards (FILM GRAIN's KIND · BLEND, ABERRATION's MODE, the feet) */
    const measure = () => g.ev(`await __LW.settle(); const rows = [...document.querySelectorAll('.row.fit')], out = [];
      for (const r of rows) { const cols = getComputedStyle(r).gridTemplateColumns.split(' ').filter((x) => /px$/.test(x)).map(parseFloat);
        for (const s of r.querySelectorAll(':scope > .segw, :scope > .seg')) { const bs = [...s.querySelectorAll('.seg-b')], need = bs.reduce((n, b) => n + b.scrollWidth, 0);
          const where = (s.closest('.dev') && s.closest('.dev').dataset.id) || (s.closest('[data-mir-window]') && s.closest('[data-mir-window]').dataset.mirWindow) || '?';
          out.push({ shown: !!r.offsetParent, where, opts: bs.map((b) => b.textContent.trim()).join('|'), span: getComputedStyle(s).gridColumnStart + '/' + getComputedStyle(s).gridColumnEnd, w: Math.round(s.getBoundingClientRect().width), need: Math.round(need), cell: Math.round(cols[0] || 0), cols: cols.length, cls: s.className }); } }
      return out;`);
    out.hydrogen = await measure();
    await g.ev(`__LW.run('mode', { id: 'molecules' }); await new Promise((r) => setTimeout(r, 2500)); return 1;`);
    out.molecules = await measure();
    await g.ev(`const N = __LW.nodes; N.open(); await new Promise((r) => setTimeout(r, 600)); N.win.place({ x: 560, y: 30, w: 560, h: 880 }); N.add('grain'); N.add('aberration'); N.add('levels');
      await new Promise((r) => setTimeout(r, 800)); for (const f of document.querySelectorAll('[data-mir-window="nodes"] .nodes-foot-fold, [data-mir-window="nodes"] [data-fold]')) f.click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    out.nodes = (await measure()).filter((x) => x.where === 'nodes');
    if (scene === 'k3') {
      const tag = process.argv[4] || 'after';
      for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
        const box = await g.ev(`const w = document.querySelector('[data-mir-window="nodes"]'); const r = w.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
        out['shot-' + t] = await shot(`039-K3-nodes-${tag}-${t}`, box); }
    }
  }
  if (scene === 'k4') {
    /* the timeline's work-bar power seat is built with the word face: MOD, the kit's own label (data-t), with no relabel in the app; a press arms / disarms */
    await g.ev(`__LW.timeline.open(); await new Promise((r) => setTimeout(r, 1200)); return 1;`);
    const seat = () => g.ev(`const p = __LW.timeline.root.querySelector('.tl-transport .mir-mod-power'); return p && { face: p.dataset.face, text: p.textContent.trim(), key: p.dataset.t || null, on: p.classList.contains('on'), svg: !!p.querySelector('svg'), armed: __LW.mod.armed };`);
    out.seat = await seat();
    await g.tap('.tl-transport .mir-mod-power'); await nap(300); out.pressed = await seat();
    await g.tap('.tl-transport .mir-mod-power'); await nap(300); out.back = await seat();
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      const box = await g.ev(`const r = __LW.timeline.root.querySelector('.tl-transport').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
      out['shot-' + t] = await shot(`039-K4-work-bar-${t}`, box, 12); }
  }
  if (scene === 'k6') {
    /* a real hover on MOLECULES' fold button (unfolded, at the left rack's top) and on SPECTRUM's: the hint's rect against the card's head and its
       first row below the head — the hint must not cover the first row; pictures dark and light (argv[4] tags them before / after) */
    const tag = process.argv[4] || 'after';
    await g.ev(`__LW.run('mode', { id: 'molecules' }); await new Promise((r) => setTimeout(r, 2500)); for (const id of ['chem', 'spectrum']) { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); } await new Promise((r) => setTimeout(r, 800)); return 1;`);
    const hover = async (id) => {
      const c = await g.ev(`__LW.layout.raise('${id}'); await new Promise((r) => setTimeout(r, 600)); const rk = document.querySelector('.dev[data-id="${id}"]').closest('#rackL, #rackR, .rack'); if (rk) rk.scrollTop = 0; await new Promise((r) => setTimeout(r, 300)); const b = document.querySelector('.dev[data-id="${id}"] .dev-head .dev-fold'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2].map(Math.round);`);
      if (!c) return { missing: id };
      await drv.actions(g.s, [{ type: 'pointer', id: 'h' + id, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 5, y: 600 }, { type: 'pointerMove', duration: 120, origin: 'viewport', x: c[0], y: c[1] }] }]);
      await nap(1100);
      return g.ev(`const d = document.querySelector('.dev[data-id="${id}"]'), head = d.querySelector('.dev-head').getBoundingClientRect(), tip = document.getElementById('controlHelp');
        const kids = [...d.children].filter((k) => k !== d.querySelector('.dev-head') && k.getBoundingClientRect().height > 0), first = kids.length ? kids[0].getBoundingClientRect() : null, t = tip.getBoundingClientRect();
        const R = (q) => q && [q.left, q.top, q.right, q.bottom].map(Math.round);
        return { shown: !tip.hidden, text: tip.textContent, tip: R(t), head: R(head), first: R(first), overFirst: !!first && !tip.hidden && t.bottom > first.top + 1 && t.top < first.bottom && t.right > first.left && t.left < first.right, card: R(d.getBoundingClientRect()) };`);
    };
    for (const t of ['dark', 'light']) {
      await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      for (const id of ['chem', 'spectrum']) {
        const o = out[id + '-' + t] = await hover(id);
        if (o && o.card) { const b = [Math.min(o.card[0], o.tip[0]), Math.min(o.head[1], o.tip[1]) - 4, Math.max(o.card[2], o.tip[2]), Math.max(o.head[3] + 90, o.tip[3])]; o.shot = await shot(`039-K6-${id}-fold-hint-${tag}-${t}`, b, 10); }
      }
    }
  }
  out.errs = (await g.errors()).errs;
} catch (e) { out.E = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
