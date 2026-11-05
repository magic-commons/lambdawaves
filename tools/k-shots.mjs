/* k-shots.mjs — iteration 036 chain K's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9697 GD_PORT=5697 node tools/k-shots.mjs <scene> [out-dir]
 * Scenes: k1 (STROKE 0 and 1 over MIR OPTIONS, INFORMATIONAL, the FINDER and the CSB, dark · light · FROST) · k2 (UI SCALE 75 % and
 * 150 %: a knob's travel, a window's move and clamp, the menubar's list, a hint, the CSB, the tempo editor, the stage's backing store,
 * a route drag) · k3 (the CSB's tempo editor) · k4 (FOLLOW PLAYHEAD, AUTO-COLOR) · k5 (FOLDERS' placeholders).
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9697}/lab/?starter=home`, { width: W, height: H });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pid = 0;
/** real pointer input: [x, y] stops pressed with `button` (0 left, 2 right); `hold` ms between down and the first move */
const stroke = (pts, button = 0, step = 60) => drv.actions(g.s, [{ type: 'pointer', id: 'k' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button }, { type: 'pause', duration: 30 },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: step, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button }] }]);
const click = (x, y, button = 0) => stroke([[x, y]], button);
const hover = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'k' + (++pid), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/k-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=80)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, v + (i < 2 ? -pad : pad)))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const look = (o) => g.ev(`__LW.look.set(${JSON.stringify(o)}); await new Promise((r) => setTimeout(r, 250)); return 1;`);
const skin = (id, theme) => g.ev(`const th = __LW.look.presetList.find((p) => p.id === ${JSON.stringify(id)}); __LW.look.set({ ...th.values, ...th.tones[0].values }); __LW.look.set({ theme: ${JSON.stringify(theme)} }); await new Promise((r) => setTimeout(r, 300)); return 1;`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('2p'); __LW.pause(); return 1;`);
  if (scene === 'k1') {
    /* MIR OPTIONS (knobs, segs, switches, the STROKE knob) beside INFORMATIONAL (Josh's shot 5) */
    await g.ev(`__LW.run('gui'); __LW.layout.reopen('informational'); __LW.layout.raise('informational'); __LW.layout.popOut('informational', { x: 1040, y: 60, w: 300 }); await new Promise((r) => setTimeout(r, 600)); return 1;`);
    const gui = await rectOf('.gui-options'); out.gui = gui;
    const ring = () => g.ev(`const pick = (s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return { b: c.borderTopColor, sh: c.boxShadow.slice(0, 90) }; };
      return { stroke: getComputedStyle(document.documentElement).getPropertyValue('--ctl-stroke').trim(), sw: pick('.dev[data-id="informational"] .sw'), seg: pick('.gui-options .seg'), on: pick('.dev[data-id="informational"] .sw.on') };`);
    for (const [sk, th] of [['lambdawaves', 'dark'], ['lambdawaves', 'light'], ['frost', 'dark'], ['frost', 'light']]) {
      await skin(sk, th);
      for (const st of [0, 1]) {
        await look({ stroke: st }); out[`${sk}-${th}-${st}`] = await ring();
        out['shot ' + sk + th + st] = await shot(`036-K1-${sk}-${th}-stroke${st}`, [Math.max(0, (gui?.[0] ?? 300) - 10), 40, W - 20, Math.min(H - 40, 760)]);
      }
    }
  }
  if (scene === 'k2look') {
    const field = () => g.ev(`const f = document.getElementById('field'); return [f.width, f.height];`);
    await g.ev(`__LW.layout.reopen('wave'); __LW.layout.raise('wave'); __LW.layout.popOut('wave', { x: 520, y: 120, w: 320 }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    out.field1 = await field();
    for (const z of [1.5, 0.75]) {
      await look({ scale: z }); await wait(800);
      out['field' + z] = await field();
      out['zoom' + z] = await g.ev(`return ['rack', 'floats', 'transport', 'menubar'].map((id) => { const e = document.getElementById(id); return id + ':' + (e ? e.currentCSSZoom : '-'); }).join(' ') + ' field:' + document.getElementById('field').currentCSSZoom;`);
      out['shot' + z] = await shot(`036-K2-look-${Math.round(z * 100)}`, null);
    }
    await look({ scale: 1 });
  }
  if (scene === 'k2') {
    const field = () => g.ev(`const f = document.getElementById('field'); return [f.width, f.height];`);
    const f0 = await field(); out.field100 = f0;
    const c = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
    const esc = () => drv.actions(g.s, [{ type: 'key', id: 'kk' + (++pid), actions: [{ type: 'keyDown', value: '' }, { type: 'keyUp', value: '' }] }]);
    for (const z of (process.env.K_SCALES || '0.75,1.5').split(',').map(Number)) {
      const P = {}; out['scale' + z] = P;
      await look({ scale: z, menuBar: 'always' }); await wait(700);
      P.field = await field(); P.fieldSame = P.field.join() === f0.join();
      P.zoom = await g.ev(`return ['rack', 'floats', 'transport'].map((id) => { const e = document.getElementById(id); return id + ':' + (e ? e.currentCSSZoom : '-'); }).join(' ');`);
      /* a floating window moves exactly with the hand, then clamps (120 px stay on screen) */
      await g.ev(`__LW.layout.reopen('observer'); __LW.layout.raise('observer'); __LW.layout.popOut('observer', { x: 420, y: 140, w: 320 }); await new Promise((r) => setTimeout(r, 600)); const d = document.querySelector('.dev[data-id="observer"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); return 1;`);
      await wait(400);
      const w0 = await rectOf('.dev[data-id="observer"]'), h0 = await rectOf('.dev[data-id="observer"] .dev-head');
      const hx = h0[0] + 70, hy = (h0[1] + h0[3]) / 2;
      await stroke([[hx, hy], [hx + 40, hy + 20], [hx + 120, hy + 60]], 0, 80); await wait(300);
      const w1 = await rectOf('.dev[data-id="observer"]');
      P.move = { dx: w1[0] - w0[0], dy: w1[1] - w0[1], want: [120, 60], width: w1[2] - w1[0] };
      await stroke([[hx + 120, hy + 60], [hx + 600, hy + 80], [W - 5, hy + 80]], 0, 80); await wait(300);
      const w2 = await rectOf('.dev[data-id="observer"]');
      P.clamp = { left: w2[0], onScreen: W - w2[0], want: 120 };
      const h2 = await rectOf('.dev[data-id="observer"] .dev-head');
      await stroke([[h2[0] + 30, (h2[1] + h2[3]) / 2], [h2[0] - 200, (h2[1] + h2[3]) / 2], [560, 360]], 0, 80); await wait(300);
      /* a kit window (MIR OPTIONS) moves exactly with the hand by its title bar */
      await g.ev(`__LW.run('gui'); await new Promise((r) => setTimeout(r, 700)); return 1;`);
      const g0 = await rectOf('[data-mir-window="gui"]'), t0 = await rectOf('[data-mir-window="gui"] .mir-win-title, [data-mir-window="gui"] .mir-win-head');
      if (g0 && t0) { const tx = t0[0] + 200, ty = (t0[1] + t0[3]) / 2; await stroke([[tx, ty], [tx + 30, ty + 10], [tx + 80, ty + 40]], 0, 80); await wait(300);
        const g1 = await rectOf('[data-mir-window="gui"]'); P.kitWindow = { dx: Math.round(g1[0] - g0[0]), dy: Math.round(g1[1] - g0[1]), want: [80, 40], width: Math.round(g1[2] - g1[0]) }; }
      else P.kitWindow = { g0, t0 };
      await g.ev(`__LW.run('gui'); return 1;`); await wait(300);
      /* a knob drags its full travel (220 px of hand; 330 here) */
      const kn = await g.ev(`const k = document.querySelector('.dev[data-id="observer"] .k[role="slider"]'); if (!k) return null; const r = k.querySelector('.k-dial').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, min: +k.getAttribute('aria-valuemin'), max: +k.getAttribute('aria-valuemax'), v0: +k.getAttribute('aria-valuenow'), lbl: k.getAttribute('aria-label') };`);
      if (kn) {
        const now = () => g.ev(`return +document.querySelector('.dev[data-id="observer"] .k[role="slider"]').getAttribute('aria-valuenow');`);
        const dn = Math.min(H - 4 - kn.y, 240), up = Math.min(kn.y - 4, 240);   // a full scale is 220 px of hand: two strokes where the screen is short
        for (let i = 0; i < 2; i++) await stroke([[kn.x, kn.y], [kn.x, kn.y + 30], [kn.x, kn.y + dn]], 0, 120); await wait(200); const lo = await now();
        for (let i = 0; i < 2; i++) await stroke([[kn.x, kn.y], [kn.x, kn.y - 30], [kn.x, kn.y - up]], 0, 120); await wait(200); const hi = await now();
        P.knob = { lbl: kn.lbl, min: kn.min, max: kn.max, down: lo, up: hi, strokes: [dn, up].map(Math.round), full: Math.abs(lo - kn.min) < 1e-6 && Math.abs(hi - kn.max) < 1e-6 };
        await g.ev(`for (let i = 0; i < 4; i++) __LW.undo && __LW.undo(); return 1;`);
      }
      /* the menubar's EDIT list opens under its word */
      const word = await g.ev(`const b = [...document.querySelectorAll('#menubar [data-menu]')].find((x) => x.dataset.menu === 'EDIT'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom];`);
      if (word) {
        await click(...c(word)); await wait(350);
        const list = await g.ev(`const l = [...document.querySelectorAll('#menubar .mb-list')].find((x) => !x.hidden && x.getClientRects().length); if (!l) return null; const r = l.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom];`);
        P.menubar = { word: word.map(Math.round), list: list && list.map(Math.round), dxLeft: list && Math.round(list[0] - word[0]), gapTop: list && Math.round(list[1] - word[3]) };
        out['shotMenu' + z] = await shot(`036-K2-menubar-${Math.round(z * 100)}`, [Math.max(0, word[0] - 60), 0, Math.min(W, word[0] + 460), Math.min(H, (list ? list[3] : word[3]) + 20)]);
        await esc(); await wait(200);
      }
      /* a hint sits by its control */
      const ctl = await g.ev(`const k = [...document.querySelectorAll('.dev[data-id="observer"] [data-help]')].find((n) => n.getClientRects().length && n.getBoundingClientRect().width > 20); const r = k.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom];`);
      await hover(...c(ctl)); await wait(1500);
      const tip = await g.ev(`const t = document.getElementById('controlHelp'); if (!t || t.hidden || !t.getClientRects().length) return null; const r = t.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom];`);
      P.hint = { ctl: ctl.map(Math.round), tip: tip && tip.map(Math.round), dxCentre: tip && Math.round((tip[0] + tip[2]) / 2 - (ctl[0] + ctl[2]) / 2), gap: tip && Math.round(tip[1] >= ctl[3] ? tip[1] - ctl[3] : ctl[1] - tip[3]) };
      out['shotWin' + z] = await shot(`036-K2-window-hint-${Math.round(z * 100)}`, null);
      await hover(W / 2, H / 2); await wait(200);
      /* the CSB in its seat; the tempo editor on the pill */
      P.csb = await g.ev(`const t = document.getElementById('transport'), r = t.getBoundingClientRect(); return { rect: [r.left, r.top, r.right, r.bottom].map(Math.round), inside: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && r.top >= 0, centred: Math.round((r.left + r.right) / 2 - innerWidth / 2) };`);
      const pill = await rectOf('#transport .tempo-expand');
      if (pill) {
        await click(pill[0] + 14, (pill[1] + pill[3]) / 2); await wait(300);
        const inp = await g.ev(`const i = document.querySelector('#transport .transport-tempo-input'); if (!i || i.hidden) return null; const r = i.getBoundingClientRect(); return { r: [r.left, r.top, r.right, r.bottom].map(Math.round), value: i.value, font: getComputedStyle(i).fontSize };`);
        P.tempo = { pill, input: inp && inp.r, value: inp && inp.value, font: inp && inp.font };
        out['shotTempo' + z] = await shot(`036-K2-csb-tempo-${Math.round(z * 100)}`, [Math.max(0, pill[0] - 140), Math.max(0, pill[1] - 60), Math.min(W, pill[2] + 340), Math.min(H, pill[3] + 70)]);
        await esc(); await wait(200);
      }
      /* a route dragged from MACRO 1's grip lands on a knob */
      { const hh = await rectOf('.dev[data-id="observer"] .dev-head'); await stroke([[hh[0] + 30, (hh[1] + hh[3]) / 2], [hh[0] - 100, 500], [60, 520]], 0, 80); await wait(300); }
      await g.ev(`__LW.layout.modulation.expand(); await new Promise((r) => setTimeout(r, 900)); return 1;`);
      const rt = await g.ev(`const grip = document.querySelector('[data-mir-window="modulation"] .m2slot .m2grip'); const k = [...document.querySelectorAll('.dev:not(.closed) .k[data-param]')].find((x) => { const r = x.querySelector('.k-dial').getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return h && x.contains(h); });
        if (!grip || !k) return { grip: !!grip, k: !!k }; const a = grip.getBoundingClientRect(), b = k.querySelector('.k-dial').getBoundingClientRect(); return { from: [a.left + a.width / 2, a.top + a.height / 2], to: [b.left + b.width / 2, b.top + b.height / 2], param: k.dataset.param, before: __LW.mod.model.routeList().length };`);
      if (rt.from) {
        await stroke([rt.from, [rt.from[0] + 10, rt.from[1] - 10], [(rt.from[0] + rt.to[0]) / 2, (rt.from[1] + rt.to[1]) / 2], rt.to, rt.to], 0, 150); await wait(400);
        P.route = await g.ev(`const l = __LW.mod.model.routeList(); return { before: ${rt.before}, after: l.length, onTarget: l.some((r) => r.targetId === ${JSON.stringify(rt.param)}), target: ${JSON.stringify(rt.param)} };`);
        out['shotRoute' + z] = await shot(`036-K2-route-${Math.round(z * 100)}`, null);
        await g.ev(`for (const r of __LW.mod.model.routeList()) __LW.mod.model.removeRoute(r.id); return __LW.mod.model.routeList().length;`);
      } else { P.route = rt; out["shotRoute" + z] = await shot(`036-K2-route-${Math.round(z * 100)}`, null); }
      await g.ev(`__LW.layout.modulation.close ? __LW.layout.modulation.close() : 0; return 1;`);
    }
    await look({ scale: 1, menuBar: 'hover' });
  }
  if (scene === 'k3') {
    const esc = () => drv.actions(g.s, [{ type: 'key', id: 'kk' + (++pid), actions: [{ type: 'keyDown', value: '' }, { type: 'keyUp', value: '' }] }]);
    for (const z of [1, 1.5]) {
      await look({ scale: z }); await wait(600);
      const pill = await rectOf('#transport .tempo-expand');
      const bar0 = await rectOf('#transport');
      await click(pill[0] + 14, (pill[1] + pill[3]) / 2); await wait(300);
      const inp = await g.ev(`const i = document.querySelector('#transport .transport-tempo-input'); if (!i || i.hidden) return null; const r = i.getBoundingClientRect(); return { r: [r.left, r.top, r.right, r.bottom].map(Math.round), value: i.value, font: getComputedStyle(i).fontSize };`);
      const bar1 = await rectOf('#transport');
      out['k3-' + z] = { pill: pill.map(Math.round), input: inp && inp.r, value: inp && inp.value, font: inp && inp.font, barHeld: JSON.stringify(bar0.map(Math.round)) === JSON.stringify(bar1.map(Math.round)) };
      out['shot' + z] = await shot(`036-K3-tempo-editor-${Math.round(z * 100)}`, [Math.max(0, pill[0] - 120), Math.max(0, pill[1] - 50), pill[2] + 300, pill[3] + 50]);
      await esc(); await wait(200);
    }
    await look({ scale: 1 });
  }
  if (scene === 'k4') {
    out.demo = await g.ev(`window.confirm = () => true; const ok = await __LW.projects.demo('star-loop'); await new Promise((r) => setTimeout(r, 1500)); await __LW.settle();
      __LW.timeline.open(); await new Promise((r) => setTimeout(r, 1200)); const st = __LW.timeline.model.state(); return { ok, open: __LW.timeline.isOpen(), clips: st.clips.length, curves: st.curves.length };`);
    const more = async () => { const r = await rectOf('[data-mir-window="timeline"] [data-mode="more"]'); await click((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); await wait(300); };
    const row = (id) => rectOf(`.tl-pop[data-pop="more"] [data-row="${id}"]`);
    const head = () => g.ev(`const v = __LW.timeline.editor.view.viewport, ph = document.querySelector('[data-mir-window="timeline"] .tl-playhead'); const r = ph.getBoundingClientRect(), vr = v.getBoundingClientRect(); return { x: Math.round(r.left - vr.left), scroll: Math.round(v.scrollLeft), beat: +__LW.timeline.controller.state().beat.toFixed(2) };`);
    /* the menu's rows; FOLLOW chosen; play: the head stays, the lanes move */
    out.zoomed = await g.ev(`const e = __LW.timeline.editor, z = (e.act && e.act.zoomStep) ? (n) => e.act.zoomStep(n) : e.zoomStep ? (n) => e.zoomStep(n) : null; if (z) for (let i = 0; i < 4; i++) z(1); await new Promise((r) => setTimeout(r, 300)); const v = e.view.viewport; return { px: e.px(), scrollW: v.scrollWidth, w: v.clientWidth, how: !!z };`);
    await more(); out.menuRows = await g.ev(`return [...document.querySelectorAll('.tl-pop[data-pop="more"] > *')].map((n) => n.classList.contains('tl-pop-sep') ? '—' : (n.dataset.row || n.className)).join(' · ');`);
    out.shotMenu = await shot('036-K4-more-menu', await rectOf('.tl-pop[data-pop="more"]'), 12);
    await drv.actions(g.s, [{ type: 'key', id: 'kk' + (++pid), actions: [{ type: 'keyDown', value: '\uE00C' }, { type: 'keyUp', value: '\uE00C' }] }]); await wait(200);
    await g.ev(`__LW.timeline.controller.seek ? __LW.timeline.controller.seek(4) : 0; __LW.play(); await new Promise((r) => setTimeout(r, 400)); return 1;`);
    await more(); const f = await row('follow-playhead'); await click((f[0] + f[2]) / 2, (f[1] + f[3]) / 2); await wait(300);
    const a = await head(); await wait(2500); const b = await head();
    out.follow = { at: a, later: b, headStill: Math.abs(a.x - b.x) <= 1, lanesMoved: b.scroll !== a.scroll, on: await g.ev(`return 1;`) };
    /* a press on a button (the work bar's rewind? the ⋯ itself) keeps it; a press on the lanes ends it */
    await more(); out.chosenInMenu = await g.ev(`const b = document.querySelector('.tl-pop[data-pop="more"] [data-row="follow-playhead"]'); return b && b.getAttribute('aria-pressed');`);
    await drv.actions(g.s, [{ type: 'key', id: 'kk' + (++pid), actions: [{ type: 'keyDown', value: '\uE00C' }, { type: 'keyUp', value: '\uE00C' }] }]); await wait(200);
    { const r = await rectOf('[data-mir-window="timeline"] .tl-action[data-tool], [data-mir-window="timeline"] .tl-toolbar button'); out.buttonPressed = r; await click((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); await wait(200); }
    const c1 = await head(); await wait(1200); const c2 = await head();
    out.afterButton = { stillFollowing: Math.abs(c1.x - c2.x) <= 1 && c2.scroll !== c1.scroll };
    const lanes = await rectOf('[data-mir-window="timeline"] .tl-viewport');
    await click(lanes[0] + 40, lanes[3] - 12); await wait(300);
    const d1 = await head(); await wait(1200); const d2 = await head();
    out.afterLanes = { ended: d2.scroll === d1.scroll, headMoves: d2.x !== d1.x };
    await g.ev(`__LW.pause(); return 1;`);
    /* AUTO-COLOR: the curves from the active palette (PALETTE on), then HSV (PALETTE off); one undo row each */
    const colours = () => g.ev(`const st = __LW.timeline.model.state(); return st.curves.filter((c) => c.kind !== 'audio').map((c) => c.color);`);
    const c0 = await colours();
    await more(); const ac = await row('auto-color'); await click((ac[0] + ac[2]) / 2, (ac[1] + ac[3]) / 2); await wait(400);
    const cP = await colours();
    out.autoPalette = { on: await g.ev(`return !!(__LW.state ? 0 : 0) || !!document.querySelector('.dev[data-id="palette"] .dev-power[aria-pressed="true"]');`), before: c0.slice(0, 6), after: cP.slice(0, 6), changed: cP.filter((x, i) => x !== c0[i]).length, distinct: new Set(cP).size, n: cP.length };
    out.shotPalette = await shot('036-K4-auto-color-palette', await rectOf('[data-mir-window="timeline"]'), 4);
    await g.ev(`__LW.run('palette'); await new Promise((r) => setTimeout(r, 300)); return 1;`);
    await more(); const ac2 = await row('auto-color'); await click((ac2[0] + ac2[2]) / 2, (ac2[1] + ac2[3]) / 2); await wait(400);
    const cH = await colours();
    out.autoHsv = { after: cH.slice(0, 6), distinct: new Set(cH).size, n: cH.length };
    out.shotHsv = await shot('036-K4-auto-color-hsv', await rectOf('[data-mir-window="timeline"]'), 4);
    out.undo = await g.ev(`__LW.timeline.model.undo ? __LW.timeline.model.undo() : 0; const st = __LW.timeline.model.state(); return st.curves.filter((c) => c.kind !== 'audio').map((c) => c.color).slice(0, 6);`);
    out.undoIsPalette = JSON.stringify(out.undo) === JSON.stringify(cP.slice(0, 6));
  }
  if (scene === 'k5') {
    const fields = () => g.ev(`const n = document.querySelector('.sv-name-input'), f = document.querySelector('.sv-to-input'); const G = __LW.projects.folders.gallery; return { folder: G.state().folder, name: n.value, namePh: n.placeholder, nameHint: n.title || n.dataset.help || '', to: f.value, toPh: f.placeholder };`);
    await g.ev(`__LW.projects.show(); await new Promise((r) => setTimeout(r, 900)); return 1;`);
    out.atOpen = await fields();
    out.shotOpen = await shot('036-K5-folders-demos', await rectOf('[data-mir-window="folders"], .mir-folders'), 6);
    /* a save into a folder of one's own: SAVE TO names it there */
    const nm = await rectOf('.sv-name-input'), to = await rectOf('.sv-to-input');
    const type = async (r, text) => { await click(r[0] + 20, (r[1] + r[3]) / 2); await drv.actions(g.s, [{ type: 'key', id: 'kk' + (++pid), actions: [...text].flatMap((ch) => [{ type: 'keyDown', value: ch }, { type: 'keyUp', value: ch }]) }]); };
    await type(to, 'MINE'); await type(nm, 'K FIVE');
    await drv.actions(g.s, [{ type: 'key', id: 'kk' + (++pid), actions: [{ type: 'keyDown', value: '' }, { type: 'keyUp', value: '' }] }]); await wait(1500);
    out.saved = await g.ev(`const e = __LW.projects.folders.files ? null : null; const es = __LW.projects.store && __LW.projects.store.entries ? __LW.projects.store.entries() : []; const hit = es.find((x) => x.name === 'K FIVE'); if (hit) __LW.projects.folders.gallery.select(hit.id); await new Promise((r) => setTimeout(r, 400)); return hit ? { folder: hit.folder, name: hit.name } : { count: es.length };`);
    out.inMine = await fields();
    out.shotMine = await shot('036-K5-folders-mine', await rectOf('[data-mir-window="folders"], .mir-folders'), 6);
  }
} catch (e) { out.error = String(e && e.stack || e); }
console.log(JSON.stringify(out, null, 1));
await g.close();
