/* lab/widget-mol.js — THE MINI-VIEWER (037 W4; Josh, BRIEF.md WIDGETS: "a 'Mini-viewer' molecule, (which can be ball, ball and stick (the 2D
 * informational one, and new projective diagram for simpler view), stick … (similar to the mini-corner axes)"): the molecule MOLECULES plays —
 * its nuclei as drawn (chem.atomsNow, the atom labels' road) — turned by the camera's basis (field.js cameraBasis, the corner axes' road) and drawn
 * orthographic on its own canvas, far to near, the far side dimmed: BALLS (CPK spheres at the van der Waals radius), BALL AND STICK (the default:
 * INFORMATIONAL's flat disks at 0.3 of it, the bonds in the ink), STICKS (each bond in its two atoms' colours) or DIAGRAM (chain D's wedge-and-dash
 * img/menu/<id>.diagram.svg in the ink, picker-fx.js setPic; a molecule without one draws ball and stick).  The bonds are elements.js' one rule.
 * A paint only when the camera, the molecule, its pose, the box, the style or the theme moved; under hydrogen or an atom a quiet empty frame. */
import { el, seg } from './mir/kit.js'; import { cameraBasis, cameraKey } from './field.js'; import { CPK, bondsOf, vdwRadius } from './elements.js';
import { setPic } from './picker-fx.js'; import { registerKind } from './widgets.js'; import { motionPolicy } from './mir/core/motion.js';
export const STYLES = [{ id: 'balls', label: 'BALLS', title: 'Each atom its van der Waals sphere' }, { id: 'ballstick', label: 'BALL + STICK', title: 'Small disks and the bonds' },
  { id: 'sticks', label: 'STICKS', title: 'The bonds in their atoms’ colours' }, { id: 'diagram', label: 'DIAGRAM', title: 'The chemist’s wedge-and-dash drawing' }];
export const STYLE_GLYPH = { balls: 'balls', ballstick: 'sticks', sticks: 'bonds', diagram: 'wedge' };   // 038 S3: the bar's style chip wears the style shown
const RGB = (Z) => { const h = (CPK[Z] || '#ff1493').slice(1), f = h.length === 3 ? h.split('').map((c) => c + c) : h.match(/../g); return f.map((x) => parseInt(x, 16)); };
const rgb = (c, k = 1, a = 1) => `rgba(${c.map((v) => Math.round(Math.min(255, v * k))).join(',')},${a})`;
registerKind({ kind: 'mol', label: 'MINI-VIEWER', glyph: 'molecule', hint: 'The molecule, turning with the camera', size: { w: 0.16, h: 0.24 }, opts: { style: 'ballstick' },
  mount(host, api) {
    const cv = el('canvas', 'lw-w-mol', host), g = cv.getContext('2d'), pic = el('img', 'lw-w-pic', host); pic.alt = ''; pic.hidden = true;
    let key = '', bondsFor = '', bonds = [], none = '';
    pic.addEventListener('error', () => { none = pic.dataset.id; key = ''; paint(true); });   // no diagram for this molecule: ball and stick
    function paint(force) {
      const app = api.app, C = app.state.chem, A = C && C.on ? C.atomsNow() : null, id = A ? C.preset() : '', o = api.opts().style;
      const style = o === 'diagram' && (!id || none === id) ? 'ballstick' : STYLES.some((s) => s.id === o) ? o : 'ballstick', { w, h } = api.size(), dpr = devicePixelRatio || 1;
      const ak = A ? A.length + ':' + A.reduce((s, a, i) => s + (a.x * 1.3 + a.y * 1.7 + a.z * 1.9) * (i + 1), 0).toFixed(5) : '';
      const k = [id, ak, style === 'diagram' ? '' : cameraKey(app.obs), style, w, h, dpr, api.theme()].join('|');
      if (!force && k === key) return; key = k;
      pic.hidden = style !== 'diagram'; if (style === 'diagram' && pic.dataset.id !== id) { pic.dataset.id = id; setPic(pic, 'img/menu/' + id + '.diagram.svg'); }
      const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr)); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } else g.clearRect(0, 0, W, H);
      if (!A || !A.length || style === 'diagram') return;
      if (ak !== bondsFor) { bondsFor = ak; bonds = bondsOf(A); }
      const B = cameraBasis(app.obs), c = [0, 1, 2].map((j) => A.reduce((s, a) => s + [a.x, a.y, a.z][j], 0) / A.length), dot = (v, p) => v[0] * p[0] + v[1] * p[1] + v[2] * p[2];
      const rad = (Z) => (style === 'balls' ? 1 : style === 'ballstick' ? 0.3 : 0.08) * vdwRadius(Z);
      const P = A.map((a) => { const p = [a.x - c[0], a.y - c[1], a.z - c[2]]; return { u: dot(B.right, p), v: dot(B.up, p), d: dot(B.fwd, p), r: rad(a.Z), ext: Math.hypot(...p) + rad(a.Z), col: RGB(a.Z) }; });
      const s = Math.min(W, H) * 0.46 / Math.max(1e-6, ...P.map((p) => p.ext)), d0 = Math.min(...P.map((p) => p.d)), d1 = Math.max(...P.map((p) => p.d)), fade = (d) => 1 - 0.45 * (d1 > d0 ? (d - d0) / (d1 - d0) : 0);
      const X = (p) => W / 2 + p.u * s, Y = (p) => H / 2 - p.v * s, ink = api.ink(), light = api.theme() === 'light';
      const items = P.map((p, i) => ({ d: p.d, i })).concat(style === 'balls' ? [] : bonds.map(([i, j]) => ({ d: (P[i].d + P[j].d) / 2, i, j })));
      items.sort((a, b) => b.d - a.d); g.lineCap = 'round';
      for (const q of items) {   /* the far side dimmed in the colour (darker on a dark stage, paler on a light one), so a disk stays opaque */
        const f = fade(q.d), tone = (col) => (light ? col.map((v) => v + (255 - v) * (1 - f)) : col.map((v) => v * f));
        if (q.j !== undefined) {
          const a = P[q.i], b = P[q.j], mx = (X(a) + X(b)) / 2, my = (Y(a) + Y(b)) / 2;
          if (style === 'sticks') { g.lineWidth = Math.max(2 * dpr, 0.55 * s); for (const e of [a, b]) { g.strokeStyle = rgb(tone(e.col)); g.beginPath(); g.moveTo(X(e), Y(e)); g.lineTo(mx, my); g.stroke(); } }
          else { g.globalAlpha = f; g.lineWidth = Math.max(1.5 * dpr, 0.14 * s); g.strokeStyle = ink; g.beginPath(); g.moveTo(X(a), Y(a)); g.lineTo(X(b), Y(b)); g.stroke(); g.globalAlpha = 1; }
          continue;
        }
        const p = P[q.i], x = X(p), y = Y(p), r = Math.max(1.5 * dpr, p.r * s), col = tone(p.col);
        if (style === 'sticks') { g.fillStyle = rgb(col); g.beginPath(); g.arc(x, y, Math.max(dpr, 0.275 * s), 0, 7); g.fill(); continue; }
        if (style === 'balls') { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, rgb(col.map((v) => v + (255 - v) * 0.6))); gr.addColorStop(0.55, rgb(col)); gr.addColorStop(1, rgb(col, 0.55)); g.fillStyle = gr; }
        else g.fillStyle = rgb(col);
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        if (light && style === 'ballstick' && p.col.every((v) => v > 215)) { g.lineWidth = dpr; g.strokeStyle = ink; g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1; }   // a white disk keeps its edge on a light stage
      }
      g.globalAlpha = 1;
    }
    /* 038 S4: a new style comes up over 180 ms (a hand's press, the bar's cell, an undo), never under reduced motion */
    return { tick: (now, force) => paint(force), set: () => { paint(true); if (motionPolicy() === 'full' && host.clientWidth) host.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); } };
  },
  controls(bar, api) { bar.append(seg({ aria: 'Mini-viewer style', value: api.opts().style || 'ballstick', options: STYLES, onChange: (v) => api.set({ style: v }, 'WIDGET STYLE') }).root); } });
