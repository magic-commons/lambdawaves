/* w129-demo.mjs — W129-1's gate: a bundled demo carries no look and no quality.  For every file under lab/demos/, in a fresh
 * headless Firefox whose settings key already holds a device's own choices (so they are STORED, not defaults):
 *   own     a device that chose light / tinted (said) / frost OFF / connected cards / its own accent / a stiff camera:
 *           the look and the camera feel before the open, after it, and what the settings key holds after a save;
 *   matched a device whose choices equal the demo's old ui/camera block: the FULL serialize bytes of the opened demo
 *           (layout.at and AUTO SCALE's notch normalised) — identical on the base and the built tree means the demo lost
 *           nothing but what the device already said;
 *   masked  the opened demo's serialize bytes with the device's keys (ui.theme/card/frost/disc/accent, camera, and
 *           captureLayout's copies: layout.cam's feel, layout.look's accA/accB) removed —
 *           the physics, register, modulation, layout, pose and notebook, compared base vs after.
 *   LW_PORT=8744 GD_PORT=5255 node research/optimization-2026-09-24/probes/W129/w129-demo.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import { go } from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8744', TAG = process.argv[2] || 'run';
const url = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`;
const KEY = 'lambdawaves.q0.settings';
const DEMOS = fs.readdirSync(new URL('../../../../lab/demos/', import.meta.url)).filter((f) => f.endsWith('.lambdawaves.json')).sort();
const FNV = `const fnv=(s)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h=(h^s.charCodeAt(i))>>>0;h=Math.imul(h,16777619)>>>0;}return h.toString(16)+':'+s.length;};`;
const DEVICE = {
  own: { theme: 'light', card: 'tinted', cardSet: true, frost: 'off', disc: false, accent: [40, 250, 0.5], friction: 0.8, spin: 0.6, dragGain: 1.4, fling: 0.7, warned: true },
  matched: { theme: 'dark', card: 'refractive', cardSet: true, frost: 'always', disc: true, accent: [30, 300, 0.1], friction: 0, spin: 0.25, dragGain: 1, fling: 1, warned: true },
};
const READ = `const LW = __LW, C = LW.camera; LW.saveSettings(); const S = LW.settings;
  return { live: { theme: LW.themeChoice, card: LW.cardStyle, frost: LW.frost, disc: LW.disconnected, accent: [LW.accent.a, LW.accent.b],
      friction: C.friction, speed: C.speed, dragGain: C.dragGain, fling: C.flingGain, autoRotate: !!C.autoRotate, quality: { ...LW.quality, autoScale: 1 } },
    stored: { theme: S.theme, card: S.card, cardSet: S.cardSet, frost: S.frost, disc: S.disc, accent: S.accent, friction: S.friction, spin: S.spin, dragGain: S.dragGain, fling: S.fling, auto: S.auto } };`;
const R = { demos: DEMOS };
for (const file of DEMOS) for (const dev of Object.keys(DEVICE)) {
  const g = await open(url, { width: 1600, height: 1000, script: 600000 });
  const k = file + ' · ' + dev;
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    await g.ev(`localStorage.setItem('${KEY}', ${JSON.stringify(JSON.stringify(DEVICE[dev]))}); return 1;`);
    await go(g.s, url);
    await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
    const before = await g.ev(`__LW.pause(); await __LW.settle(); ${READ}`);
    const opened = await g.ev(`${FNV}
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), LW = __LW, P = LW.projects;
      const text = await (await fetch('demos/${file}', { cache: 'no-cache' })).text();
      const p = P.importText(text); const ok = P.open(p); await LW.settle(); await sleep(700);
      const o = LW.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; if (o.presentation.quality) o.presentation.quality.autoScale = 1;
      const full = JSON.stringify(o); const ui = o.presentation.ui, cam = o.presentation.camera;
      const m = JSON.parse(full); for (const q of ['theme', 'card', 'frost', 'disc', 'accent']) delete m.presentation.ui[q]; delete m.presentation.camera;
      for (const q of ['friction', 'spin', 'autoRotate', 'dragGain', 'fling']) delete m.presentation.layout.cam[q]; delete m.presentation.layout.look.accA; delete m.presentation.layout.look.accB;   /* captureLayout's record of the live feel and accent */
      const file = JSON.parse(text).data.presentation;
      return { ok, full: fnv(full), masked: fnv(JSON.stringify(m)), ui: { ...ui, stage: undefined }, camera: cam,
        fileCarries: { ui: Object.keys(file.ui || {}), camera: !!file.camera, quality: !!file.quality, camFeel: Object.keys((file.layout && file.layout.cam) || {}).filter((q) => !['yaw', 'pitch', 'dist', 'fov', 'mode', 'quat'].includes(q)) },
        errs: (window.__e || []).map(String).slice(0, 5) };`);
    const after = await g.ev(READ);
    R[k] = { before, after, opened, stands: JSON.stringify(before) === JSON.stringify(after) };
  } catch (e) { R[k] = { E: String(e && e.stack || e) }; }
  finally { await g.close(); }
}
fs.writeFileSync(new URL(`./w129-demo.${TAG}.json`, import.meta.url), JSON.stringify(R, null, 1));
console.log(JSON.stringify(R, null, 1));
