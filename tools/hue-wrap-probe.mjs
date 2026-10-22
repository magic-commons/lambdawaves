/* hue-wrap-probe.mjs — iteration 014 D2's probe (a diagnostic, not a gate).
 *   LW_PORT=9571 GD_PORT=5271 node tools/hue-wrap-probe.mjs
 * Opens the Picker on MOLECULAR, sets THE HUE to 350°, then turns it +10° twice (350 → 0 → 10) and samples a molecule picture's
 * computed filter every frame of the glide.  Each sample's angle, taken mod 360 and seen from 0°, must stay within 20° of the wrap:
 * a glide the long way round (350 → 175 → 0) is the flash Josh saw. */
import { open } from './gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9571}/lab/?menu=1`, { width: 1400, height: 900 });
try {
  if (!(await g.waitFor('window.__LW?.ready && document.querySelector("#lwMenu .mm-hue") && document.querySelector("#lwMenu .mm-mol .mm-pic")', 400, 100)).ok) throw new Error('no Picker');
  const r = await g.ev(`const hue = document.querySelector('#lwMenu .mm-hue'), pic = document.querySelector('#lwMenu .mm-mol .mm-pic');
    const key = (k) => hue.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    key('Home'); key('ArrowDown'); await new Promise((r) => setTimeout(r, 700));
    const deg = () => { const m = /hue-rotate\\((-?[\\d.]+)deg\\)/.exec(getComputedStyle(pic).filter); return m ? +m[1] : null; };
    const samples = [deg()]; key('ArrowUp'); key('ArrowUp');
    const t0 = performance.now(); while (performance.now() - t0 < 600) { await new Promise((r) => requestAnimationFrame(r)); samples.push(deg()); }
    const off = samples.map((d) => { const m = ((d % 360) + 360) % 360; return Math.min(m, 360 - m); });
    return { samples: samples.map((d) => Math.round(d * 10) / 10), worst: Math.max(...off), cssVar: getComputedStyle(document.documentElement).getPropertyValue('--mol-hue').trim() };`);
  console.log(JSON.stringify(r));
  console.log(r.worst <= 20 ? 'PASS · the glide stays within ' + r.worst.toFixed(1) + '° of the wrap' : 'FAIL · the glide went ' + r.worst.toFixed(1) + '° from the wrap (the long way round)');
} finally { await g.close(); }
