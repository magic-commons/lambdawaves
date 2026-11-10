/* s041-shots.mjs — iteration 041 chain S's pictures and probes (a diagnostic, not a gate).
 *   node tools/s041-shots.mjs <scene> [width] [height] [light]     (LW_PORT / GD_PORT default to chain S's 9745 / 5745)
 * Opens the lab, runs the scene's body in the page, prints what it returned and writes the driver's composite to
 * .tmp/S-shots/041-<scene>[-light][-<width>].png (a scene named `probe-…` writes no picture). */
import { writeFileSync, mkdirSync } from 'node:fs';
process.env.LW_PORT = process.env.LW_PORT || '9745'; process.env.GD_PORT = process.env.GD_PORT || '5745';
const { open } = await import('./gate/gatekit.mjs');

const w8 = `const wait = (ms) => new Promise((r) => setTimeout(r, ms));`;
const SCENES = {
  's1-dots': `__LW.mat.frameMode = 'dots'; __LW.setFrame(true); await wait(600); return { msgs: __LW.field.shaderMessages };`,
  /* S3: KEEP IN HIDE pressed in STAGE, then H: the frame stays, the axes go; H again brings both back; the blob holds frameStay */
  's3-keep': [`__LW.layout.reopen('stage'); await wait(300); const sw = [...document.querySelectorAll('.dev[data-id="stage"] .sw')].find((b) => /KEEP IN HIDE/.test(b.textContent));
    __LW.mat.frameMode = 'lattice'; __LW.setFrame(true); const before = [__LW.mat.frame, __LW.mat.axis]; sw.click(); await wait(100);
    return { sw: !!sw, hint: sw && sw.title, before, saved: __LW.settings.frameStay };`, 'press:h',
    `await wait(400); return { hidden: [__LW.mat.frame, __LW.mat.axis, document.body.classList.contains('ui-hidden')] };`],
  /* S4: BRIGHTNESS at 400 % on the dots (the knob's row beside KEEP IN HIDE in STAGE, popped out for the picture) */
  's4-bright': `__LW.layout.reopen('stage'); __LW.layout.popOut('stage', { x: 20, y: 120, w: 300 }); await wait(400); const d = document.querySelector('.dev[data-id="stage"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    __LW.mat.frameMode = 'dots'; __LW.mat.frameGain = 4; __LW.setFrame(true); await wait(500);
    const r = d.querySelector('.stage-frame-more'); return { row: r && [...r.children].map((c) => c.textContent.trim().slice(0, 24) + ':' + c.offsetWidth), w: r && r.clientWidth };`,
  'probe-cam': `__LW.layout.reopen('camera'); await wait(300); const R = document.querySelector('.dev[data-id="camera"] .mir-camera');
    const tree = (n, d) => d > 3 ? '' : '<' + n.tagName.toLowerCase() + '.' + [...n.classList].join('.') + (n.children.length ? '' : ':' + n.textContent.trim().slice(0, 14)) + '>' + [...n.children].map((c) => tree(c, d + 1)).join('');
    return { pan: tree(R.querySelector('.cam-pan'), 0), hand: tree(R.querySelector('.cam-hand'), 2), padCls: R.querySelector('.cam-pan .mir-xy, .cam-pan [class*=pad]')?.className };`,
  /* S5: the expanded CAMERA has no CONTROLS and no PAN word; LOCK set, a real press on the PAN pad releases it.  S6: the boot is unlocked */
  's5-camera': [`__LW.layout.reopen('camera'); __LW.layout.popOut('camera', { x: 20, y: 60, w: 300 }); await wait(400); const d = document.querySelector('.dev[data-id="camera"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    const f = d.querySelector('.mir-camera .lw-fold'); if (f && f.getAttribute('aria-expanded') !== 'true') f.click(); await wait(400);
    const boot = __LW.camera.lock, words = [...d.querySelectorAll('.cam-more .cam-title, .cam-more .mir-xy > .k-lbl')].map((n) => n.textContent);
    __LW.camera.setLock(true); await wait(100); d.querySelector('.xy-pad').scrollIntoView({ block: 'center' }); await wait(200);
    return { boot, words, locked: __LW.camera.lock, padOff: d.querySelector('.mir-xy').classList.contains('disabled') };`, 'tap:.dev[data-id="camera"] .cam-pan',
    `await wait(300); const d = document.querySelector('.dev[data-id="camera"]'); return { lockAfterPress: __LW.camera.lock, padOff: d.querySelector('.mir-xy').classList.contains('disabled'), saved: __LW.settings.camLock };`],
  /* S7: STROBE at 1/4 beat and 120 BPM flashes 8 times a second (040's cap held it at 3): rising edges of the stage's mean light over 2 s */
  'probe-s7-strobe': `__LW.mod.clock.setBpm(120); __LW.mat.stage = { pulse: 0, position: 0, rate: 2, strobe: 1, strobeRate: 0.25, strobeDuty: 0.5, beam: 0, beamAngle: 0, beamWidth: 30 }; __LW.mod.play(); await wait(300);
    const L = []; const t0 = performance.now(); while (performance.now() - t0 < 2000) { L.push((await __LW.field.readPixels(__LW.obs, __LW.mat, 64, 48)).meanLum); await wait(12); }
    __LW.mod.stop(); const mid = (Math.min(...L) + Math.max(...L)) / 2; let rises = 0; for (let i = 1; i < L.length; i++) if (L[i - 1] < mid && L[i] >= mid) rises++;
    return { samples: L.length, rises, perSecond: rises / 2, bpm: __LW.mod.model.transport.bpm, lo: Math.min(...L).toFixed(1), hi: Math.max(...L).toFixed(1) };`,
  /* S8: a device the page destroyed (the only loss a headless run can make) puts RELOAD STAGE on the stage; no reload is taken by itself */
  's8-lost': `const href = location.href; __LW.field.device.destroy(); for (let i = 0; i < 60 && __LW.field.ok; i++) await wait(50); await wait(1500);
    const b = document.querySelector('#stage > .lw-stage-lost button'), r = b && b.getBoundingClientRect(), hit = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { ok: __LW.field.ok, button: b && b.textContent.trim(), onTop: !!(hit && b.contains(hit)), at: r && [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], reloaded: location.href !== href, flag: sessionStorage.getItem('lw.stage') };`,
  /* S9: SETTINGS › PERFORMANCE › FULL pressed by hand turns AUTO SCALE off.  S10: DISPLAY's INFO · WIDGETS row, each a half */
  's9-full': `__LW.layout.reopen('settings'); __LW.layout.popOut('settings', { x: 20, y: 60, w: 300 }); await wait(400); const d = document.querySelector('.dev[data-id="settings"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await wait(300);
    const auto0 = __LW.quality.auto, seg = [...d.querySelectorAll('.seg')].find((g) => /SMOOTH/.test(g.textContent)), full = [...seg.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === 'FULL'); full.scrollIntoView({ block: 'center' }); full.click(); await wait(200);
    const sw = [...d.querySelectorAll('.sw')].find((b) => /AUTO SCALE/.test(b.textContent)), row = d.querySelector('.lw-edit-more');
    if (row) row.scrollIntoView({ block: 'center' });
    return { auto0, auto: __LW.quality.auto, pressed: sw && sw.getAttribute('aria-pressed'), saved: [__LW.settings.auto, __LW.settings.perfTier], row: row && [...row.children].map((c) => c.textContent.trim() + ':' + Math.round(c.getBoundingClientRect().width)) };`,
  's2-lattice': `__LW.mat.frameMode = 'lattice'; __LW.setFrame(true); await wait(600); return { msgs: __LW.field.shaderMessages };`,
};
const [scene = 's1-dots', W = '1300', H = '850', light = ''] = process.argv.slice(2);
if (!SCENES[scene]) { console.error('scenes: ' + Object.keys(SCENES).join(' · ')); process.exit(2); }
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?preset=1s%2B2pz&warn=0&menu=0&sw=0`,
  { width: +W, height: +H, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
try {
  await g.armErrors();
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.errors()).slice(0, 900) + JSON.stringify(await g.ev(`return [document.title, document.body.innerText.slice(0, 300), window.__LW && __LW.field && __LW.field.shaderMessages];`)));
  if (light) await g.ev(`__LW.look.set({ theme: 'light' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
  for (const step of [].concat(SCENES[scene])) {   // a step is a body run in the page, or `press:<key>` (the driver's own key)
    if (step.startsWith('press:')) await g.press(step.slice(6)); else if (step.startsWith('tap:')) console.log(JSON.stringify(await g.tap(step.slice(4)))); else console.log(JSON.stringify(await g.ev(w8 + step)));
  }
  await new Promise((r) => setTimeout(r, 700));
  if (!scene.startsWith('probe-')) {
    mkdirSync('.tmp/S-shots', { recursive: true });
    writeFileSync(`.tmp/S-shots/041-${scene}${light ? '-light' : ''}${W === '1300' ? '' : '-' + W}.png`, Buffer.from(await g.snap(), 'base64'));
  }
  const e = await g.errors(); if (e.errs && e.errs.length) console.log('PAGE ERRORS', JSON.stringify(e.errs).slice(0, 600));
} finally { await g.close(); }
