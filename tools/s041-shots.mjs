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
    if (step.startsWith('press:')) await g.press(step.slice(6)); else console.log(JSON.stringify(await g.ev(w8 + step)));
  }
  await new Promise((r) => setTimeout(r, 700));
  if (!scene.startsWith('probe-')) {
    mkdirSync('.tmp/S-shots', { recursive: true });
    writeFileSync(`.tmp/S-shots/041-${scene}${light ? '-light' : ''}${W === '1300' ? '' : '-' + W}.png`, Buffer.from(await g.snap(), 'base64'));
  }
  const e = await g.errors(); if (e.errs && e.errs.length) console.log('PAGE ERRORS', JSON.stringify(e.errs).slice(0, 600));
} finally { await g.close(); }
