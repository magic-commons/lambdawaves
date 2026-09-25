// debug helper: the exact SHIM of frame-inventory.mjs, then play and watch the loop
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('./frame-inventory.mjs', import.meta.url), 'utf8');
const SHIM = src.slice(src.indexOf('String.raw`') + 11, src.indexOf('return { wrapFail: B.wrapFail };`') + 'return { wrapFail: B.wrapFail };'.length);
const g = await open('https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0', { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  console.log('shim', JSON.stringify(await g.ev(SHIM)));
  console.log('watch', JSON.stringify(await g.ev(`const out=[]; __B.reset(); const f0=__LW.stats.frames; __LW.play(); for(let i=0;i<8;i++){ await new Promise(r=>setTimeout(r,100)); out.push([__LW.stats.frames-f0, __B.rafReq, __B.rafRun, __B.log.length]); } __LW.pause(); return {out, e:window.__e, berr:__B.err};`)));
} catch (e) { console.log('ERR', e.message); } finally { await g.close(); }
