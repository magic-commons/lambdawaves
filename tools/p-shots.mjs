/* p-shots.mjs — iteration 036 chain P's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/p-shots.mjs <scene> [out-dir]
 * Scenes: p1 (SPECTRUM's head BUTTONS · PAINT: real clicks toggle, a drag sweeps nothing, PAINT sweeps; a hand's preset keeps the view, rate
 * and window) · p2 (the dial labels) · p3 (NODES' bar) · p4 (ABOUT fitted on MIR, sized on λWAVES) · p5 (a demo's coloured clips) ·
 * p6 (ENV + PATTERN: the knob pulses four times a bar).  JPEGs into <out-dir> (default .tmp/P-shots). */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'p1', DIR = process.argv[3] || '.tmp/P-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`, { width: 1500, height: 950 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
/** real pointer input: a list of [x, y] stops pressed with `button` (0 left, 2 right) */
const stroke = (pts, button = 0) => { if (!pts.every((q) => q && q.every(Number.isFinite))) throw new Error('no point: ' + JSON.stringify(pts)); return drv.actions(g.s, [{ type: 'pointer', id: 'p' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button }] }]); };
const click = (x, y, button = 0) => stroke([[x, y]], button);
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  await new Promise((r) => setTimeout(r, 300)); const d = document.querySelector('.dev[data-id=${JSON.stringify(id)}]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); return 1;`);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/p-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1000: im = im.resize((1000, round(im.height * 1000 / im.width)))
im.save(sys.argv[2], quality=78)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -pad : pad))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; __LW.loadPreset('1s'); __LW.pause(); return 1;`);
  if (scene === 'p1') {
    await float('spectrum', 560, 10, 340); await wait(700);
    const chip = (lbl) => g.ev(`const b = [...document.querySelectorAll('.dev[data-id="spectrum"] .pk-c')].find((x) => x.textContent === ${JSON.stringify(lbl)}); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, +b.dataset.a];`);
    const pop = () => g.ev(`return __LW.reg.populated().length;`);
    out.mode0 = await g.ev(`return document.querySelector('.dev[data-id="spectrum"] .sp-stroke .seg-b.on').getAttribute('aria-label');`);
    /* the reader's view, rate and window, then a hand's preset (the stepper's ›, a real click; the picker still closed so it is on screen) */
    await g.ev(`__LW.clock.setRate(7.5); __LW.clock.window = 33; const d = document.querySelector('.dev[data-id="spectrum"]'), p = d.querySelector('.picker'); if (!p.hidden) [...d.querySelectorAll('.sp-head .trig')].find((b) => /MODE/.test(b.textContent)).click(); return 1;`); await wait(300);
    const before = await g.ev(`return { rate: __LW.clock.rate, window: __LW.clock.window, view: __LW.mat.view };`);
    const nx = await rectOf('.dev[data-id="spectrum"] .sp-preset [aria-label="next"]'); await click((nx[0] + nx[2]) / 2, (nx[1] + nx[3]) / 2); await wait(500);
    out.preset = { at: nx, before, after: await g.ev(`return { rate: __LW.clock.rate, window: __LW.clock.window, view: __LW.mat.view, labels: __LW.reg.populated().length };`) };
    await g.ev(`__LW.loadPreset('1s'); const d = document.querySelector('.dev[data-id="spectrum"]'), p = d.querySelector('.picker'); if (p.hidden) [...d.querySelectorAll('.sp-head .trig')].find((b) => /MODE/.test(b.textContent)).click(); return 1;`); await wait(500);
    const a = await chip('2s₀'), b = await chip('3s₀'), c = await chip('4s₀');
    const p0 = await pop(); await click(a[0], a[1]); await wait(250); const p1 = await pop(); await click(a[0], a[1]); await wait(250); const p2 = await pop();
    await stroke([[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]]); await wait(250); const p3 = await pop();
    await shot('036-P1-1-head-buttons', await rectOf('.dev[data-id="spectrum"] .sp-head'), 30);
    await click(b[0], b[1], 2); await wait(300); const menu = await g.ev(`const m = document.querySelector('.mir-ctx'); return !!m && m.textContent.slice(0, 60);`);
    await click(1300, 600); await wait(300);   // a press elsewhere closes the menu
    out.buttons = { p0, tapOn: p1, tapOff: p2, dragSweeps: p3 - p2, rightMenu: menu };
    const pb = await g.ev(`const b = document.querySelector('.dev[data-id="spectrum"] .sp-stroke .seg-b[aria-label="PAINT"]'); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];`);
    await click(pb[0], pb[1]); await wait(250);
    const q0 = await pop(); await stroke([[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]]); await wait(250); const q1 = await pop();
    await stroke([[a[0], a[1]], [c[0], c[1]]], 2); await wait(250); const q2 = await pop();
    out.paint = { stored: await g.ev(`return localStorage.getItem('lambdawaves.q0.stroke');`), sweepAdds: q1 - q0, rightSweepRemoves: q1 - q2 };
    await shot('036-P1-2-head-paint', await rectOf('.dev[data-id="spectrum"] .sp-head'), 30);
    await g.ev(`localStorage.removeItem('lambdawaves.q0.stroke'); return 1;`);
  } else if (scene === 'p2') {
    /* the dials beside the chips: 2p_x (2p₋₁ + 2p₁), 3d₊₂ and 7i₋₆ (₆: the digit Roboto lacks) */
    await float('spectrum', 560, 10, 360); await wait(700);
    out.names = await g.ev(`__LW.loadPreset('2px'); const d = document.querySelector('.dev[data-id="spectrum"]');
      for (const t of ['3d₂', '7i₋₆']) { const n = d.querySelector('.pk-n[data-n="7"]'); if (t[0] === '7' && n.classList.contains('folded')) n.querySelector('.pk-nl').click(); const b = [...d.querySelectorAll('.pk-c')].find((x) => x.textContent === t); __LW.api.toggleMode(+b.dataset.a); }
      __LW.api.settle(); const h = [...d.querySelectorAll('.sp-head .trig')].find((b) => /DIALS/.test(b.textContent)); if (h.getAttribute('aria-expanded') !== 'true') h.click();
      await new Promise((r) => setTimeout(r, 900));
      return [...d.querySelectorAll('.sp-row .sp-nl')].map((n) => [n.textContent, getComputedStyle(n).fontFamily.split(',')[0], getComputedStyle(n).fontSize]);`);
    await g.ev(`document.querySelector('.dev[data-id="spectrum"] .sp-rows').scrollIntoView({ block: 'start' }); return 1;`); await wait(300);
    const r = await rectOf('.dev[data-id="spectrum"] .sp-rows'), p = await rectOf('.dev[data-id="spectrum"] .picker');
    await shot('036-P2-labels', [r[0], r[1], r[2], Math.min(p ? p[1] + 160 : r[3], 860)]);
  } else if (scene === 'p3') {
    /* NODES' bar: ⏻ MUTE (a real click mutes the second node) · × REMOVE (a real click removes the third) */
    out.built = await g.ev(`const N = __LW.nodes; N.add('levels'); N.add('vignette'); N.add('posterize'); __LW.run('window.nodes.open'); await new Promise((r) => setTimeout(r, 900));
      return [...document.querySelectorAll('.nodes-card[data-node^="n"]')].map((c) => [c.dataset.node, c.querySelector('.nodes-x')?.getAttribute('aria-label'), c.querySelector('.nodes-x use, .nodes-x svg')?.outerHTML.length, c.querySelector('.nodes-rm')?.getAttribute('aria-label')]);`);
    const at = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];`);
    const m = await at('.nodes-card[data-node="n2"] .nodes-x'); await click(m[0], m[1]); await wait(400);
    const x = await at('.nodes-card[data-node="n3"] .nodes-rm'); await click(x[0], x[1]); await wait(400);
    out.after = await g.ev(`return __LW.nodes.nodes().map((q) => q.id + ':' + q.type + (q.bypass ? ':muted' : ''));`);
    await shot('036-P3-nodes-bar', await rectOf('.nodes-card[data-node="n1"]').then(async (a) => { const b = await rectOf('.nodes-card[data-node="n2"]'); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]; }), 16);
  } else if (scene === 'p4') {
    /* ABOUT: the reader sizes the λWAVES face (520 × 760, saved); ⓘ (a real click) → the MIR face fitted, nothing saved; a resize there is not
       saved either; ⓘ → back to 520 × 760 */
    const S = `JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}')`, R = `(() => { const r = __LW.layout.about.win.root.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })()`;
    out.lw = await g.ev(`__LW.layout.about.open('lw'); await new Promise((r) => setTimeout(r, 400)); __LW.layout.about.win.resize({ w: 520, h: 760 }); await new Promise((r) => setTimeout(r, 300)); const s = ${S}; return { rect: ${R}, saved: [s.abW, s.abH] };`);
    await shot('036-P4-1-about-lw-sized', await rectOf('.lw-about'), 12);
    const i = await g.ev(`const r = document.querySelector('.lw-about-i').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];`); await click(i[0], i[1]); await wait(700);
    out.mir = await g.ev(`const s = ${S}, b = __LW.layout.about.win.body; return { face: __LW.layout.about.face, rect: ${R}, page: document.querySelector('.lw-about-mir').scrollHeight, scrolls: b.scrollHeight > b.clientHeight + 1, saved: [s.abW, s.abH] };`);
    await shot('036-P4-2-about-mir-fitted', await rectOf('.lw-about'), 12);
    out.mirHand = await g.ev(`__LW.layout.about.win.resize({ w: 500, h: 380 }); await new Promise((r) => setTimeout(r, 300)); const s = ${S}; return { rect: ${R}, saved: [s.abW, s.abH] };`);
    const j = await g.ev(`const r = document.querySelector('.lw-about-i').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];`); await click(j[0], j[1]); await wait(600);
    out.back = await g.ev(`const s = ${S}; return { face: __LW.layout.about.face, rect: ${R}, saved: [s.abW, s.abH] };`);
  } else if (scene === 'p5') {
    /* STAR LOOP from DEMOS (the seeded copy refreshed by its new `saved`): the timeline's clips in their curves' colours */
    out.demo = await g.ev(`window.confirm = () => true; const P = __LW.projects, ok = await P.demo('star-loop'); await new Promise((r) => setTimeout(r, 1500)); await __LW.settle();
      __LW.timeline.open(); await new Promise((r) => setTimeout(r, 1500));
      const st = __LW.timeline.model.state(); return { ok, open: __LW.timeline.isOpen(), colours: [...new Set(st.curves.map((c) => c.color))].length, grey: st.curves.filter((c) => c.color === '#a7adb8').length, clips: st.clips.length };`);
    await shot('036-P5-star-loop-clips', await g.ev(`const r = __LW.timeline.root.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`), 4);
  } else if (scene === 'p6') {
    /* THE ENVELOPE TRIGGER: an ENV (a 5 ms attack, 250 ms decay, no sustain) bound to a macro routed over SOFT, its 16-step row lit on 1 · 5 · 9 · 13,
       PATT live; play two bars at 120 BPM and read SOFT every 10 ms — the pulses a bar are the rises past half the swing */
    out.setup = await g.ev(`const L = __LW.mod, M = L.model, P = __LW.layout.pattern; if (!P) return 'no PATTERN';
      __LW.layout.modulation.expand(); await new Promise((r) => setTimeout(r, 500));
      const env = L.addSource('env'); M.setSource(env, { a: 0.005, hold: 0, d: 0.25, s: 0, r: 0.05 }); const mac = L.addMacro(); L.bind(mac, env); L.route(mac, 'material.softness', 0, 1);
      for (const k of [0, 4, 8, 12]) P.model.setStep(env, k, 127); P.model.setLive(env, true); L.clock.setBpm(120); if (!L.armed) L.arm(true);
      __LW.layout.modulation.expand(); P.show(env); await new Promise((r) => setTimeout(r, 900));
      window.__env = env; return { env, row: P.model.steps(env).join(''), live: P.model.isLive(env), open: P.open, patt: !!document.querySelector('.m2dev[data-id="' + env + '"] [data-act="patt"], .m2dev[data-id="' + env + '"] .m2patt') };`);
    await shot('036-P6-pattern-window', await g.ev(`const a = __LW.layout.pattern.win.root.getBoundingClientRect(), d = document.querySelector('.m2dev[data-id="' + window.__env + '"]'), b = d ? d.getBoundingClientRect() : a;
      return [Math.min(a.left, b.left), Math.min(a.top, b.top), Math.max(a.right, b.right), Math.max(a.bottom, b.bottom)].map(Math.round);`), 14);
    /* SOFT read on every advance of the modulation clock (each tick's applied value), with the beat it stood on; rises past half the swing, per bar */
    out.run = await g.ev(`const L = __LW.mod, T = L.model.transport, xs = []; const off = L.host.clock.onAdvance(() => xs.push([T.beats, __LW.mat.softness]));
      L.play(); await new Promise((r) => setTimeout(r, 4300)); __LW.pause(); off();
      const lo = Math.min(...xs.map((x) => x[1])), hi = Math.max(...xs.map((x) => x[1])), mid = (lo + hi) / 2; let up = false; const at = [], bars = {};
      for (const [b, v] of xs) { if (!up && v > mid) { up = true; at.push(+b.toFixed(2)); const k = Math.floor(b / 4 + 1e-6); bars[k] = (bars[k] || 0) + 1; } else if (up && v < mid) up = false; }
      return { ticks: xs.length, lo: +lo.toFixed(3), hi: +hi.toFixed(3), risesAtBeat: at, perBar: bars, fires: L.model.sourceOf(window.__env).fires, beats: +T.beats.toFixed(2) };`);
    out.saved = await g.ev(`const S = __LW.serialize(); return S.presentation.pattern || null;`);
  } else if (scene === 'read') out.r = await g.ev(readFileSync(process.argv[4], 'utf8'));   // a probe's body from a file
  out.errors = (await g.errors()).errs;
} finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
