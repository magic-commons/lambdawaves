/* n-probe.mjs — iteration 019 chain N's probes and pictures (a diagnostic, not a gate).
 *   LW_PORT=8819 GD_PORT=5819 node tools/n-probe.mjs <scene> [out.png]
 * Scenes: identity (N1: CURVES alone through the compiler vs 018's fixed pair — describe() and the filter's markup, byte for byte) ·
 * tables (N2: LEVELS · POSTERIZE · THRESHOLD · HUE · TINT added; the filter's children, the targets, a routed knob, the window floating) ·
 * Prints what the scene measured; a picture scene writes a PNG (the driver's composite). */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'identity', OUT = process.argv[3] || `.tmp/n-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8819}/lab/?warn=0`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  let info = null, shot = false;
  if (scene === 'identity') {
    info = await g.ev(`const N = __LW.nodes, f = N.filter, html = () => document.getElementById(f.id).outerHTML, w = (n) => new Promise((r) => setTimeout(r, n));
      const neutral = { ...f.describe(), html: html() };
      __LW.curves.preset('MASTER', 'S'); __LW.curves.preset('R', 'LIFT'); await w(300); f.flush();
      const chain = { ...f.describe(), html: html() };
      f.setChain([]); for (const ch of ['MASTER', 'R', 'G', 'B']) f.setTable(ch, ch === 'G' || ch === 'B' ? null : __LW.curves.table(ch)); f.flush();
      const pair = { ...f.describe(), html: html() };
      for (const ch of ['MASTER', 'R']) f.setTable(ch, null); f.setChain(N.compile().runs); f.flush();
      const back = { ...f.describe(), html: html() };
      __LW.curves.preset('MASTER', 'LINEAR'); __LW.curves.preset('R', 'LINEAR'); await w(300);
      const strip = (d) => ({ ...d, html: d.html.length + ' B' });
      return { neutral: strip(neutral), chain: strip(chain), pair: strip(pair), identical: chain.html === pair.html && JSON.stringify({ ...chain, html: 0 }) === JSON.stringify({ ...pair, html: 0 }),
        back: back.html === chain.html, after: f.describe().css, passes: N.passes() };`);
  }
  if (scene === 'tables') {
    info = await g.ev(`const N = __LW.nodes, f = N.filter, w = (n) => new Promise((r) => setTimeout(r, n));
      for (const t of ['levels', 'posterize', 'threshold', 'hue', 'tint']) N.add(t);
      N.set('n1', 'gamma', 1.6); N.set('n4', 'hue', 40); N.setBypass('n3', true); await w(300);
      const kids = () => [...document.getElementById(f.id).children].map((e) => e.localName + (e.getAttribute('result') ? '>' + e.getAttribute('result') : ''));
      const a = { kids: kids(), passes: N.passes() };
      N.setBypass('n3', false); await w(200); const b = { kids: kids(), passes: N.passes() };
      const T = __LW.mod.targets().filter((t) => t.id.startsWith('nodes.')).map((t) => t.id);
      const r = JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')); r.pan = { win: [95, -470] }; r.win = { x: 520, y: 20, w: 560, h: 860 }; localStorage.setItem('lambdawaves.q0.nodes', JSON.stringify(r));
      N.open(); await w(800);
      return { a, b, targets: T, stamped: document.querySelectorAll('[data-mir-window="nodes"] [data-param^="nodes."]').length, record: JSON.parse(localStorage.getItem('lambdawaves.q0.nodes')).list.map((q) => q.id + ':' + q.type) };`);
    shot = true;
  }
  if (scene === 'layers') {
    info = await g.ev(`const N = __LW.nodes, w = (n) => new Promise((r) => setTimeout(r, n));
      N.add('grain'); N.add('vignette'); N.set('n2', 'amount', 0.8); await w(400);
      const host = document.getElementById('nodeLayers'), cs = getComputedStyle(host), kids = [...host.children].map((d) => d.dataset.type + ':' + getComputedStyle(d).mixBlendMode + ':' + d.style.opacity);
      const r = host.getBoundingClientRect(), masked = (window.__LW.field.occlusionRects ? 'n/a' : 'n/a');
      N.add('scanlines'); await w(200); const three = host.children.length; N.setBypass('n3', true); await w(200);
      return { kids, z: cs.zIndex, pe: cs.pointerEvents, parent: host.parentElement.id, prev: host.previousElementSibling.id, three, afterBypass: host.children.length, passes: N.passes(),
        anim: getComputedStyle(host.children[0]).animationName, box: [r.width, r.height] };`);
    shot = true;
  }
  if (scene === 'prims') {
    info = await g.ev(`const N = __LW.nodes, f = N.filter, w = (n) => new Promise((r) => setTimeout(r, n));
      const kids = () => [...document.getElementById(f.id).children].map((e) => e.localName + (e.getAttribute('in') ? '<' + e.getAttribute('in') : '') + (e.getAttribute('result') ? '>' + e.getAttribute('result') : ''));
      N.add('posterize'); N.add('blur'); N.add('aberration'); N.add('invert'); await w(300); const a = { kids: kids(), passes: N.passes() };
      N.add('bloom'); N.add('displace'); N.add('sharpen'); await w(300); const b = { kids: kids(), passes: N.passes() };
      N.set('n2', 'radius', 0); await w(200); const c = { kids: kids().length, passes: N.passes() };
      return { a, b, c, css: getComputedStyle(document.getElementById('field')).filter };`);
    shot = true;
  }
  if (shot) writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ scene, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
