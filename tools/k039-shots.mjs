/* k039-shots.mjs — iteration 039 chain K's one check per door and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9627 GD_PORT=5627 node tools/k039-shots.mjs <scene> [out-dir]
 * Scenes: k1 (THE STEPPED CLOCK LOOPS: PLAYBACK LOCK on, a 2-bar ACTIVE range, 20 s of play — the head wraps; a 3-bar film over the 2-bar
 * loop renders 3 bars).
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9627}/lab/?starter=home&warn=0&sw=0`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
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
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready && __LW.timeline', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  if (scene === 'k1') {
    /* the check: PLAYBACK LOCK at 60 Hz, 120 BPM, an ACTIVE range of 2 bars (8 beats) from 1.1; play 20 s (40 beats) sampling the head every 250 ms —
       it never reaches 8 and comes back past 1.1 (the loops counter moves); then a 6-s RECORD (3 bars at 120 BPM) from beat 0 with MOD armed: the
       film's frame log runs 0 → 12 beats unlooped (the recorder's step passes nothing) */
    out.setup = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();
      __LW.fieldRate.lock = true; __LW.fieldRate.hz = 60; __LW.mod.clock.setBpm(120); __LW.mod.arm(true);
      const tl = __LW.timeline; tl.editor.setActiveRange({ start: 0, end: 8 }); tl.controller.seek(0); await __LW.settle();
      return { lock: __LW.fieldRate.lock, hz: __LW.fieldRate.hz, bpm: __LW.mod.model.transport.bpm, loop: __LW.mod.clock.loop(), loops0: __LW.mod.clock.stats().loops };`);
    out.play = await g.ev(`__LW.play(); const T0 = performance.now(), seen = []; let max = 0, wraps = 0, prev = -1;
      while (performance.now() - T0 < 20000) { await new Promise((r) => setTimeout(r, 250)); const b = __LW.mod.model.transport.beats; seen.push(+b.toFixed(2)); if (b > max) max = b; if (b < prev - 1) wraps++; prev = b; }
      const loops = __LW.mod.clock.stats().loops, steps = __LW.mod.clock.stats().steps; __LW.pause(); await __LW.settle();
      return { max: +max.toFixed(3), wraps, loops, steps, first: seen.slice(0, 6), last: seen.slice(-6), n: seen.length };`);
    out.film = await g.ev(`const F = __LW.captureUI.exact; F.save = () => true; __LW.timeline.controller.seek(0); await __LW.settle();
      const r = await __LW.captureUI.record(); const fr = (r && r.manifest && r.manifest.frames) || [], beats = fr.map((x) => x.beat).filter(Number.isFinite);
      let mono = true; for (let i = 1; i < beats.length; i++) if (!(beats[i] > beats[i - 1])) mono = false;
      return { ok: r && r.ok, frames: r && r.frames, error: r && r.error, first: beats[0], last: beats.at(-1), mono, n: beats.length };`);
    out.verdict = { headWraps: out.play.max < 8 && out.play.wraps >= 2 && out.play.loops > out.setup.loops0, filmThreeBars: !!out.film.ok && out.film.mono && out.film.first < 0.1 && out.film.last > 11.8 };
  }
  out.errs = (await g.errors()).errs;
} catch (e) { out.E = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
