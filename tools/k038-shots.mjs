/* k038-shots.mjs — iteration 038 chain K's one check per row and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9703 GD_PORT=5703 node tools/k038-shots.mjs <scene> [out-dir]
 * Scenes: k1 (A STYLE REMEMBERS ITS KNOBS: real presses on STYLE and real drags on the knobs; a routed and a clipped knob stay; one undo row a switch) ·
 * k2 (LIGHTING's one row and the two reload glyphs: the verbs row at 262 and 300 px, both themes) · k3 (THE PAD WRAPS: a drag past the sun pad's top edge,
 * the light going round; the PAN pad past its right edge; the arrows) · k4 (AUTO-ROTATE in the stage's menu) · k5 (THE FINISH's pictures).
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9703}/lab/?starter=home&warn=0&sw=0`, { width: W, height: H,
  prefs: scene === 'k4' ? {} : { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });   // k4: headless Firefox under the pointer prefs hit-tests <html> over the stage, so its right-click finds no stage
let pid = 0;
const drag = (pts, ms = 40) => drv.actions(g.s, [{ type: 'pointer', id: 'd' + (++pid), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button: 0 },
  ...pts.slice(1).map(([x, y]) => ({ type: 'pointerMove', duration: ms, origin: 'viewport', x: Math.round(x), y: Math.round(y) })), { type: 'pointerUp', button: 0 }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
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
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); if (__LW.layout.isFloating(${JSON.stringify(id)})) __LW.layout.dockWindow(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  const d = document.querySelector('.dev[data-id="${id}"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
const theme = (t) => g.ev(`__LW.look.set({ theme: ${JSON.stringify(t)} }); await new Promise((r) => setTimeout(r, 400)); return 1;`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle(); return 1;`);
  if (scene === 'k1') {
    /* the check: a real press on SHELL ±, two real drags (EXPOSURE down, KNEE up), SIGNED (no memory: the knobs stay), EXPOSURE up there, then back:
       SHELL ± wears its own numbers again and SIGNED its own; a macro on EXPOSURE and a timeline clip on KNEE stand still through a switch while ISO is
       recalled; each switch is one undo row and the undo brings the style and its knobs back together */
    await float('observer', 560, 40, 420);
    const S = (v) => `[data-event="material.style"] .seg-b[data-v="${v}"]`, K = (id) => `.dev[data-id="observer"] .k[data-param="${id}"]`;
    const read = () => g.ev(`const m = __LW.mat; return { style: m.style, exposure: +m.exposure.toFixed(4), knee: +m.knee.toFixed(4), iso: +m.iso.toFixed(4), mem: m.styleMem ? JSON.parse(JSON.stringify(m.styleMem)) : null, rows: __LW.history.entries().length };`);
    const turn = async (id, dy) => { const c = mid(await rectOf(K(id))); await drag([c, [c[0], c[1] - dy / 2], [c[0], c[1] - dy]]); await nap(500); };
    const press = async (v) => { await g.tap(S(v)); await nap(700); };
    out.home = await read();
    /* the lane's road (the STYLE target's set, as an EVENT clip writes it) starts no memory: SIGNED and back leave styleMem absent */
    out.lane = await g.ev(`const R = __LW.mod.registry; R.write('material.style', 3); await new Promise((r) => setTimeout(r, 200)); const s1 = __LW.mat.style; R.write('material.style', 0); await new Promise((r) => setTimeout(r, 200)); return { s1, s2: __LW.mat.style, mem: __LW.mat.styleMem || null };`);
    await press(8); out.shellPM0 = await read();
    await turn('material.exposure', -50); await turn('material.knee', 50); await turn('material.iso', 30); out.shellPM = await read();
    await press(3); out.signed0 = await read();
    await turn('material.exposure', 70); await turn('material.iso', -40); await turn('material.knee', -40); out.signed = await read();
    await press(8); out.shellPM1 = await read();
    await press(3); out.signed1 = await read();
    out.undo = await g.ev(`const before = __LW.mat.style; __LW.history.undo(); await new Promise((r) => setTimeout(r, 300)); const m = __LW.mat; return { before, style: m.style, exposure: +m.exposure.toFixed(4), knee: +m.knee.toFixed(4) };`);
    out.redo = await g.ev(`__LW.history.redo(); await new Promise((r) => setTimeout(r, 300)); const m = __LW.mat; return { style: m.style, exposure: +m.exposure.toFixed(4) };`);
    /* the tethers: a macro route on EXPOSURE (its base the hand's), a timeline clip on KNEE; then C's road (the action) to SHELL ± */
    out.tether = await g.ev(`const L = __LW, mc = L.mod.addMacro(), rid = L.mod.route(mc, 'material.exposure', 0, 0.3); const clip = L.timeline.editor.createClip('material.knee');
      await new Promise((r) => setTimeout(r, 400)); return { rid, clip: !!clip };`);
    const pre = await read();
    await g.ev(`__LW.run('style', { id: 'glassSigned' }); await new Promise((r) => setTimeout(r, 400)); return 1;`); out.tethered = { pre, post: await read() };
    out.ok = out.lane.s1 === 3 && out.lane.s2 === 0 && out.lane.mem === null && out.shellPM0.exposure === out.home.exposure && out.signed0.exposure === out.shellPM.exposure && out.signed0.knee === out.shellPM.knee
      && out.shellPM1.exposure === out.shellPM.exposure && out.shellPM1.knee === out.shellPM.knee && out.shellPM1.iso === out.shellPM.iso
      && out.signed1.exposure === out.signed.exposure && out.signed1.iso === out.signed.iso && out.signed1.rows === out.shellPM1.rows + 1
      && out.undo.style === 8 && out.undo.exposure === out.shellPM.exposure && out.redo.style === 3 && out.redo.exposure === out.signed.exposure
      && out.tethered.post.style === 8 && out.tethered.post.knee === out.tethered.pre.knee && out.tethered.post.iso === out.shellPM.iso
      && out.tethered.post.exposure === out.tethered.pre.exposure && +out.tethered.post.mem.signed.exposure.toFixed(4) === out.signed.exposure && out.signed.knee !== out.shellPM.knee;
    await shot('038-K1-wave-styles', await rectOf('.dev[data-id="observer"]'));
  }
  if (scene === 'k2') {
    /* the check: LIGHTING's verbs row (FRAME · RESET · MORE's chevron) is ONE line at 262 and 300 px — every child's top within 2 px, each of the seg's
       buttons one text line — and both resets wear the `reload` glyph, named and hinted; the pictures in both themes */
    const row = () => g.ev(`const v = document.querySelector('.dev[data-id="light"] .lw-light-verbs'), R = (e) => e.getBoundingClientRect();
      const kids = [...v.children].filter((e) => R(e).width > 0), tops = kids.map((e) => Math.round(R(e).top)), bs = [...v.querySelectorAll('.lw-light-frame .seg-b')];
      const reset = v.querySelector('.lw-light-reset'), pal = document.querySelector('.dev[data-id="palette"] .mir-ramp-reset');
      return { w: Math.round(R(v.closest('.dev')).width), h: Math.round(R(v).height), tops, kids: kids.map((e) => e.className.split(' ')[0] + ':' + Math.round(R(e).width)),
        btnH: bs.map((b) => Math.round(R(b).height)), lines: bs.map((b) => { const q = document.createRange(); q.selectNodeContents(b); return new Set([...q.getClientRects()].filter((c) => c.width > 0).map((c) => Math.round(c.top))).size; }), words: bs.map((b) => b.textContent),
        reset: reset && { gly: reset.dataset.gly || null, aria: reset.getAttribute('aria-label'), hint: reset.dataset.help || reset.title || '', text: reset.textContent.trim(), w: Math.round(R(reset).width), h: Math.round(R(reset).height) },
        pal: pal && { gly: pal.dataset.gly || null, aria: pal.getAttribute('aria-label'), hint: pal.dataset.help || pal.title || '', w: Math.round(R(pal).width), h: Math.round(R(pal).height) } };`);
    await float('palette', 1000, 40, 300);
    for (const t of ['light', 'dark']) {
      await theme(t);
      for (const w of [262, 300]) {
        await float('light', 600, 40, w); out[t + w] = await row();
        await shot(`038-K2-lighting-${w}-${t}`, await rectOf('.dev[data-id="light"]'));
      }
      await shot(`038-K2-palette-${t}`, await rectOf('.dev[data-id="palette"] .palette-enable'));
    }
    const one = (r) => Math.max(...r.tops) - Math.min(...r.tops) <= 2 && r.lines.every((n) => n === 1) && r.reset && r.reset.gly === 'reload' && !r.reset.text && r.reset.hint;
    out.ok = ['light262', 'light300', 'dark262', 'dark300'].every((k) => one(out[k])) && out.light300.pal.gly === 'reload';
  }
  if (scene === 'k3') {
    /* the check: (a) a real drag from the sun straight up past the pad's top edge does not stop at the rim — the point comes in from the far side and
       climbs on (its landing within 0.03 of padWrap's own walk); (b) ArrowUp walks the light over the back and round (el down to ≈ −90, then up again),
       the sun never outside the disc; (c) three stage frames on that walk (SOLID: the light going round); (d) the PAN pad, unlocked: ArrowRight past the
       edge and a drag past it bring the pivot in at the other side (pacman), and ±1 is the frame's edge */
    await float('light', 40, 40, 300);
    await g.ev(`__LW.setStyle('solid'); for (let i = 0; i < 6; i++) __LW.run('dollyIn'); await __LW.settle(); return 1;`);
    const SUN = '.dev[data-id="light"] .lw-sun .xy-pad', at = () => g.ev(`const p = document.querySelector(${JSON.stringify(SUN)}), d = p.querySelector('.xy-dot').style, L = __LW.mat.light || {};
      const x = +d.getPropertyValue('--x'), y = +d.getPropertyValue('--y'); return { x, y, r: +Math.hypot(2 * x - 1, 2 * y - 1).toFixed(4), az: +(L.az ?? 57.5).toFixed(1), el: +(L.el ?? 57).toFixed(1) };`);
    const pad = await rectOf(SUN), H = pad[3] - pad[1], s0 = await at();
    const dot = mid(await rectOf(SUN + ' .xy-dot')), pts = [dot]; for (let i = 1; i <= 40; i++) pts.push([dot[0], dot[1] - 1.25 * H * i / 40]);
    await drag(pts, 15); await nap(300); out.drag = { from: s0, to: await at() };
    { let u = s0.x, v = s0.y; for (let i = 0; i < 1250; i++) { const cx = 2 * u - 1, cy = 2 * (v + 0.001) - 1, r = Math.hypot(cx, cy); if (r <= 1) { v += 0.001; continue; } const sm = r % 2, k = (sm <= 1 ? sm : sm - 2) / r; u = (1 + cx * k) / 2; v = (1 + cy * k) / 2; }
      out.drag.want = { x: +u.toFixed(4), y: +v.toFixed(4) }; }
    /* (b) the arrows from the light's home, read every 10 presses; (c) a frame at three points of the walk */
    const UP = '', RIGHT = '';
    await g.ev(`document.querySelector('.dev[data-id="light"] .lw-light-reset').click(); await new Promise((r) => setTimeout(r, 200)); document.querySelector(${JSON.stringify(SUN)}).focus(); return 1;`);
    const walk = [await at()], stage = await rectOf('#stage'), box = [stage[0] + (stage[2] - stage[0]) * 0.3, stage[1] + (stage[3] - stage[1]) * 0.18, stage[0] + (stage[2] - stage[0]) * 0.7, stage[1] + (stage[3] - stage[1]) * 0.82];
    const frames = { 10: 'a-front', 40: 'b-behind', 70: 'c-round' };
    for (let i = 1; i <= 110; i++) { await g.press(UP); if (i % 10 === 0 || frames[i]) walk.push({ i, ...(await at()) });
      if (frames[i]) { await g.ev(`await __LW.settle(); return 1;`); await shot(`038-K3-light-round-${frames[i]}`, box, 0); await shot(`038-K3-sun-${frames[i]}`, await rectOf('.dev[data-id="light"] .lw-light-key'), 16); } }
    out.walk = walk;
    const els = walk.map((w) => w.el), lo = els.indexOf(Math.min(...els));
    out.walkOk = Math.min(...els) < -80 && Math.max(...els.slice(lo)) > 60 && walk.every((w) => w.r <= 1.0001);   // over the back (el ≈ −90) and round to the front again, never off the disc
    /* (d) the PAN pad: unlock, CONTROL's chevron open (the fold `pan and hand`), ArrowRight × 55 from the centre, then PAN HOME and a drag from the
       centre 0.75 of the pad past the right edge: u 1.25 → 0.25, the pivot at −0.5 */
    await float('camera', 1000, 40, 300);
    out.panOpen = await g.ev(`if (__LW.actions.get('camera.lock').get()) __LW.run('camera.lock'); const R = document.querySelector('.dev[data-id="camera"] .mir-camera'), b = R.querySelector('button.lw-fold[data-fold="pan and hand"]');
      if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); await new Promise((r) => setTimeout(r, 400)); return { lock: __LW.actions.get('camera.lock').get(), open: b && b.getAttribute('aria-expanded') };`);
    const PAN = '.dev[data-id="camera"] .cam-pan .xy-pad';
    out.pan = { from: await g.ev(`const p = document.querySelector(${JSON.stringify(PAN)}); p.focus(); return [...__LW.obs.shift];`) };
    for (let i = 0; i < 55; i++) await g.press(RIGHT);
    out.pan.keys = await g.ev(`return [...__LW.obs.shift].map((v) => +v.toFixed(3));`);
    await g.ev(`__LW.run('camera.panHome'); await new Promise((r) => setTimeout(r, 200)); return 1;`);
    const pp = await rectOf(PAN), c = mid(pp), Wd = pp[2] - pp[0], q = [c]; for (let i = 1; i <= 30; i++) q.push([c[0] + 0.75 * Wd * i / 30, c[1]]);
    await drag(q, 15); await nap(300);
    out.pan.drag = await g.ev(`return [...__LW.obs.shift].map((v) => +v.toFixed(3));`);
    await shot('038-K3-pan-wrapped', await rectOf('.dev[data-id="camera"] .cam-pan'));
    out.ok = Math.abs(out.drag.to.x - out.drag.want.x) < 0.03 && Math.abs(out.drag.to.y - out.drag.want.y) < 0.03 && out.drag.to.y < 0.9 && out.walkOk
      && out.pan.keys[0] < -0.8 && Math.abs(out.pan.drag[0] + 0.5) < 0.06;
  }
  if (scene === 'k4') {
    /* the check: a real right-click on the free stage opens nine rows, AUTO-ROTATE (✓, on from the boot) directly after LOCK; its press turns it off and
       the next menu shows it off; the menu stays on the screen at the stage's corners; pictures light (top-left) and dark (bottom-right) */
    const ESC = '';
    const menu = () => g.ev(`const p = document.querySelector('.mir-ctx-pane'); if (!p) return null; const R = p.getBoundingClientRect();
      return { rows: [...p.querySelectorAll(':scope > .mb-item')].map((b) => ({ lbl: (b.querySelector('.mb-lbl') || b).textContent.trim(), checked: b.getAttribute('aria-checked'), hint: b.title || b.dataset.help || '' })),
        box: [R.left, R.top, R.right, R.bottom].map(Math.round), vw: innerWidth, vh: innerHeight };`);
    const free = (fx, fy) => g.ev(`const S = document.querySelector('#stage').getBoundingClientRect();
      for (let k = 0; k < 60; k++) { const x = S.left + S.width * (${fx} + (0.5 - ${fx}) * k / 60), y = S.top + S.height * (${fy} + (0.5 - ${fy}) * k / 60), h = document.elementFromPoint(x, y);
        if (h && h.matches('#stage, #stage > canvas')) return [Math.round(x), Math.round(y)]; } return [Math.round(S.left + S.width / 2), Math.round(S.top + S.height / 2)];`);   // headless Firefox under the pointer prefs answers elementFromPoint with <html> over the stage: the centre then
    /* headless Firefox delivers a driver's button-2 press as a contextmenu on <html> (the base's too), so the press is the canvas's own contextmenu event */
    const right = async (p) => { if (!Array.isArray(p)) throw new Error('no stage point: ' + JSON.stringify(p));
      await g.ev(`document.querySelector('#field').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: ${p[0]}, clientY: ${p[1]} })); return 1;`); await nap(400); return menu(); };
    const auto = () => g.ev(`return __LW.actions.get('camera.autoRotate').get();`);
    const c = await free(0.5, 0.5); out.centre = await right(c);
    const L = out.centre.rows.map((r) => r.lbl), iLock = L.findIndex((l) => l.startsWith('LOCK')), iAuto = L.findIndex((l) => l.startsWith('AUTO-ROTATE'));
    out.order = { L, iLock, iAuto, auto0: await auto() };
    await g.tap('.mir-ctx-pane > .mb-item:nth-of-type(' + (iAuto + 1) + ')').catch(() => 0);
    await nap(300); out.order.afterPress = await auto(); const again = await right(c); out.order.shownOff = again && again.rows[iAuto].checked; await g.press(ESC); await nap(200);
    await g.ev(`if (!__LW.actions.get('camera.autoRotate').get()) __LW.run('camera.autoRotate'); return 1;`);
    const shots = {};
    for (const [t, fx, fy] of [['light', 0, 0], ['dark', 1, 1]]) {
      await theme(t); const p = await free(fx, fy); const m = await right(p); shots[t] = { at: p, box: m && m.box, on: m && m.box[0] >= 0 && m.box[1] >= 0 && m.box[2] <= m.vw && m.box[3] <= m.vh };
      if (m) await shot(`038-K4-stage-menu-${t}`, [Math.min(p[0], m.box[0]) - 20, Math.min(p[1], m.box[1]) - 20, Math.max(p[0], m.box[2]) + 20, Math.max(p[1], m.box[3]) + 20]);
      await g.press(ESC); await nap(200);
    }
    out.shots = shots;
    out.ok = L.length === 9 && iAuto === iLock + 1 && out.centre.rows[iAuto].checked === 'true' && out.order.auto0 === true && out.order.afterPress === false && out.order.shownOff === 'false'
      && shots.light.on && shots.dark.on && /fling/i.test(out.centre.rows[iAuto].hint);
  }
  if (scene === 'k5') {
    /* THE FINISH: (a) WAVE through every style twice with EXPOSURE routed (a macro) and HUE free — HUE comes back per style, EXPOSURE stays the route's;
       pictures docked at the rack's width and floated, light and dark; (b) no window scrolls (WAVE, LIGHTING, PALETTE, CAMERA, hydrogen and benzene);
       (c) LIGHTING by the keyboard: the Tab order from FRAME, Enter on RESET; (d) Escape closes the stage's menu */
    const S = (v) => `[data-event="material.style"] .seg-b[data-v="${v}"]`, K = (id) => `.dev[data-id="observer"] .k[data-param="${id}"]`;
    const styles = async () => g.ev(`return [...document.querySelectorAll('[data-event="material.style"] .seg-b')].filter((b) => !b.hidden).map((b) => +b.dataset.v);`);
    const turn = async (id, dy) => { const c = mid(await rectOf(K(id))); await drag([c, [c[0], c[1] - dy / 2], [c[0], c[1] - dy]]); await nap(350); };
    const noScroll = () => g.ev(`return [...document.querySelectorAll('.dev[data-id="observer"], .dev[data-id="light"], .dev[data-id="palette"], .dev[data-id="camera"]')].filter((d) => d.offsetHeight)
      .map((d) => { const b = d.querySelector('.dev-body') || d; return { id: d.dataset.id, h: Math.round(d.getBoundingClientRect().height), scrolls: b.scrollHeight > b.clientHeight + 1 }; });`);
    await float('light', 40, 40, 262); await float('palette', 1020, 520, 300); await float('camera', 1020, 40, 300);
    out.dockedWave = await rectOf('.dev[data-id="observer"]');
    if (out.dockedWave) await shot('038-K5-wave-docked-light', out.dockedWave);
    await float('observer', 560, 40, 420);
    out.route = await g.ev(`const mc = __LW.mod.addMacro(); return __LW.mod.route(mc, 'material.exposure', 0, 0.5);`); await nap(400);
    const list = await styles(), first = {}, second = {};
    for (let i = 0; i < list.length; i++) { await g.tap(S(list[i])); await nap(450); await turn('material.hue', 12 + 9 * i); first[list[i]] = await g.ev(`return { hue: +__LW.mat.hueShift.toFixed(4), exp: +__LW.mat.exposure.toFixed(4) };`); }
    for (const v of list) { await g.tap(S(v)); await nap(450); second[v] = await g.ev(`return { hue: +__LW.mat.hueShift.toFixed(4), exp: +__LW.mat.exposure.toFixed(4) };`); }
    out.styles = { list, first, second };
    out.recallOk = list.every((v) => second[v].hue === first[v].hue) && new Set(list.map((v) => second[v].exp)).size === 1 && new Set(list.map((v) => first[v].hue)).size === list.length;
    await shot('038-K5-wave-float-light', await rectOf('.dev[data-id="observer"]'));
    await theme('dark'); await g.tap(S(8)); await nap(400); await shot('038-K5-wave-float-dark', await rectOf('.dev[data-id="observer"]'));
    await shot('038-K5-light-262-dark', await rectOf('.dev[data-id="light"]'));
    out.scrollHydrogen = await noScroll();
    /* (b) benzene: the molecule rows show; nothing scrolls */
    await g.ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: 'C6H6' } }], { who: 'SHOTS' }); return 1;`);
    await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 900, 200); await g.ev(`await __LW.settle(); return 1;`);
    out.scrollBenzene = await noScroll();
    await shot('038-K5-wave-benzene-dark', await rectOf('.dev[data-id="observer"]'));
    /* (c) LIGHTING's keys: Tab from FRAME's first button; a dial moved, then Enter on RESET empties the record */
    out.tab = await g.ev(`const b = document.querySelector('.dev[data-id="light"] .lw-light-frame .seg-b'); b.focus(); return document.activeElement.textContent.trim();`);
    const order = [];
    for (let i = 0; i < 5; i++) { await g.press(''); order.push(await g.ev(`const a = document.activeElement; return (a.getAttribute('aria-label') || a.dataset.fold || a.textContent.trim().slice(0, 16) || a.className.split(' ')[0]) + ' · ' + (a.closest('.dev') || {}).dataset?.id;`)); }
    out.tabOrder = order;
    await g.ev(`const k = document.querySelector('.dev[data-id="light"] .lw-light-surf .k'); k.focus(); return 1;`); for (let i = 0; i < 4; i++) await g.press('');
    out.dialMoved = await g.ev(`return __LW.mat.light ? { ...__LW.mat.light } : null;`);
    await g.ev(`document.querySelector('.dev[data-id="light"] .lw-light-reset').focus(); return 1;`); await g.press(''); await nap(200);
    out.afterEnter = await g.ev(`return __LW.mat.light || null;`);
    /* (d) Escape closes the stage's menu */
    await g.ev(`document.querySelector('#field').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 760, clientY: 600 })); return 1;`); await nap(300);
    const opened = await g.ev(`return !!document.querySelector('.mir-ctx');`); await g.press(''); await nap(300);
    out.escape = { opened, closed: await g.ev(`return !document.querySelector('.mir-ctx');`) };
    const flat = [...out.scrollHydrogen, ...out.scrollBenzene];
    out.ok = out.recallOk && flat.every((w) => !w.scrolls) && !!out.dialMoved && out.afterEnter === null && out.escape.opened && out.escape.closed;
  }
  if (scene === 'k5m') {
    /* THE FINISH, full: benzene (the molecule rows shown) — WAVE floated and no window scrolls; a style switch with SIZE raised keeps SIZE (not a
       style's knob) and recalls the knobs it should; pictures light and dark */
    await g.ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: 'C6H6' } }], { who: 'SHOTS' }); return 1;`);
    out.mol = await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 900, 200); await g.ev(`await __LW.settle(); await __LW.settle(); return 1;`);
    await float('observer', 560, 40, 420);
    const S = (v) => `[data-event="material.style"] .seg-b[data-v="${v}"]`;
    out.rows = await g.ev(`const d = document.querySelector('.dev[data-id="observer"]'), b = d.querySelector('.dev-body'); return { h: Math.round(d.getBoundingClientRect().height), scrolls: b.scrollHeight > b.clientHeight + 1,
      size: !d.querySelector('.k[data-param], .k') || !!document.querySelector('.dev[data-id="observer"] .k:not([hidden])'), esp: !document.querySelector(${JSON.stringify(S(11))}).hidden };`);
    await g.ev(`__LW.mat.atomSize = 0.35; return 1;`);
    await g.tap(S(6)); await nap(400); await g.tap(S(3)); await nap(400); await g.tap(S(6)); await nap(400);
    out.size = await g.ev(`return { size: __LW.mat.atomSize, mem: JSON.parse(JSON.stringify(__LW.mat.styleMem || {})) };`);
    for (const t of ['light', 'dark']) { await theme(t); await shot(`038-K5-wave-benzene-${t}`, await rectOf('.dev[data-id="observer"]')); }
    out.ok = out.mol.ok && !out.rows.scrolls && out.rows.esp && out.size.size === 0.35 && !Object.values(out.size.mem).some((m) => 'atomSize' in m);
  }
} catch (e) { out.error = String(e && e.stack || e); }
finally { out.errors = (await g.errors()).errs; await g.close(); }
console.log(JSON.stringify(out, null, 1));
