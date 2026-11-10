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
  console.log(JSON.stringify(await g.ev(w8 + SCENES[scene])));
  await new Promise((r) => setTimeout(r, 700));
  if (!scene.startsWith('probe-')) {
    mkdirSync('.tmp/S-shots', { recursive: true });
    writeFileSync(`.tmp/S-shots/041-${scene}${light ? '-light' : ''}${W === '1300' ? '' : '-' + W}.png`, Buffer.from(await g.snap(), 'base64'));
  }
  const e = await g.errors(); if (e.errs && e.errs.length) console.log('PAGE ERRORS', JSON.stringify(e.errs).slice(0, 600));
} finally { await g.close(); }
