/* tools/perf/esp-probe.mjs (iteration 015 W0) — THE ESP STALL, measured.  A HEADED Chromium on the session display (the only road to the RTX for
 * WebGPU and compositing on this box, probe-chromium-headed.mjs) opens the lab, turns MOLECULES on, and for each molecule (benzene from the
 * catalogue, palmitic acid from VOL. I through the dev link lab/volumes) reads STICKS then ESP in the same minute, three readings each:
 *   rest  — paused, 3 s of rAF with a PRESENT asked every frame (what a still stage costs to repaint)
 *   drag  — paused, a scripted left-drag over the free stage (CDP mouse events, 60 per second for 3 s): the turn's frames
 *   play  — the clock playing, LIVE off, 3 s
 * Each reading: rAF fps, presents/s, the median and worst frame interval, field.stats' generation delta, espRuns delta and espMs.
 *   LW_PORT=9631 node tools/perf/esp-probe.mjs [out.json]
 * The GPU may be loaded (the volume solvers): a timing is a reading, never a gate; re-run a divergence alone. */
import { sleep } from './cdp.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '9631', OUT = process.argv[2] || null;
const MOLS = (process.env.ESP_MOLS || 'C6H6,vol-1/palmitic-acid').split(',');
const port = 9700 + Math.floor(Math.random() * 200);
const profile = `/home/joshua-hosain/snap/chromium/common/lw-esp-${port}`;
const proc = spawn('/snap/bin/chromium', ['--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1600,900', '--window-position=0,0',
  '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan', 'about:blank'], { stdio: 'ignore', env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' } });
const res = { when: new Date().toISOString(), rows: [] };
try {
  let ok = false; for (let i = 0; i < 80 && !ok; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ok = true; } catch { await sleep(250); } }
  if (!ok) throw new Error('no devtools port');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
  const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: type === 'mouseMoved' ? 0 : 1 });
  await send('Page.enable');
  await send('Page.navigate', { url: `https://127.0.0.1:${PORT}/lab/?menu=0&sw=0&starter=home` });
  for (let i = 0; i < 400; i++) { try { if (await ev('return !!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
  res.adapter = await ev(`try { __LW.warning && __LW.warning.dismiss && __LW.warning.dismiss(); } catch (_) {} return { ok: __LW.field.ok, adapter: __LW.field.adapterInfo, w: innerWidth, h: innerHeight };`);
  console.log(JSON.stringify(res.adapter));
  /* one reading: N ms of rAF; each frame asks a PRESENT (rest) or nothing (the drag and the clock ask their own) */
  const reading = (ms, ask) => ev(`const LW = __LW, F = LW.field, s0 = { ...F.stats }, g0 = LW.governor.changes, r0 = F.resolution; const dt = []; let last = performance.now(); const t0 = last;
    await new Promise((done) => { const f = (t) => { dt.push(t - last); last = t; ${ask ? 'LW.schedule(LW.TIER.PRESENT);' : ''} if (t - t0 < ${ms}) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
    const s1 = F.stats, secs = (performance.now() - t0) / 1000; dt.shift(); dt.sort((a, b) => a - b);
    return { fps: +(dt.length / secs).toFixed(1), presents: +((s1.presents - s0.presents) / secs).toFixed(1), medMs: +(dt[dt.length >> 1] || 0).toFixed(1), worstMs: +(dt[dt.length - 1] || 0).toFixed(1),
      gen: s1.generation - s0.generation, espRuns: s1.espRuns - s0.espRuns, espMs: +(s1.espMs || 0).toFixed(0), esp: F.espState ? F.espState() : null, res: r0 + '→' + F.resolution, gov: LW.governor.state, govSteps: LW.governor.changes - g0 };`);
  const drag = async (ms) => {
    const box = await ev(`const r = __LW.field.canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`);
    const y0 = await ev(`return __LW.obs.yaw;`);
    await mouse('mousePressed', box.x, box.y);
    const p = reading(ms, false);
    const t0 = Date.now(); let k = 0;
    while (Date.now() - t0 < ms) { k++; await mouse('mouseMoved', box.x + 120 * Math.sin(k / 15), box.y + 40 * Math.cos(k / 23)); await sleep(16); }
    await mouse('mouseReleased', box.x, box.y);
    const r = await p; r.yawMoved = +(await ev(`return __LW.obs.yaw;`) - y0).toFixed(3);
    const d0 = await ev(`return __LW.obs.dist || __LW.camera && __LW.camera.dist || 0;`);
    for (let i = 0; i < 5; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: box.x, y: box.y, deltaX: 0, deltaY: -100 }); await sleep(60); }
    await sleep(400); r.zoom = +((await ev(`return __LW.obs.dist || __LW.camera && __LW.camera.dist || 0;`)) / (d0 || 1)).toFixed(3);
    return r;
  };
  for (const m of MOLS) {
    const vol = m.includes('/') ? m.split('/') : null;
    const land = await ev(`const LW = __LW; LW.pause(); LW.chem.setOn(true);
      ${vol ? `const r = await LW.chem.openVolume(${JSON.stringify(vol[0])}, ${JSON.stringify(vol[1])}); if (!r) return { E: LW.chem.state().status };` : `await LW.chem.pick(${JSON.stringify(m)});`}
      for (let i = 0; i < 1200; i++) { const c = LW.chem.state(), s = LW.molsession.state().molecule; if (c.nAO && s && s.nAO === c.nAO) break; await new Promise((r) => setTimeout(r, 100)); }
      const c = LW.chem.state(); return { preset: c.preset, nAO: c.nAO, basis: c.basis, view: c.view };`);
    console.log(m, JSON.stringify(land));
    for (const style of ['sticks', 'esp']) {
      await ev(`__LW.pause(); __LW.setStyle(${JSON.stringify(style)}); __LW.schedule(__LW.TIER.PRESENT); await new Promise((r) => setTimeout(r, 2500)); return true;`);
      const row = { mol: m, style, land };
      row.rest = await reading(3000, true);
      row.drag = await drag(3000);
      await ev(`__LW.play(); return true;`);
      row.play = await reading(3000, false);
      await ev(`__LW.pause(); return true;`);
      if (style === 'esp' && !vol) {   /* a density that MOVES: KICK + RUN, then the clock — the case the 1 Hz re-solve fires in */
        await ev(`await __LW.chem.kick(); __LW.chem.setRun(true); __LW.play(); await new Promise((r) => setTimeout(r, 1500)); return true;`);
        row.kick = await reading(3000, false);
        await ev(`__LW.chem.setRun(false); __LW.pause(); return true;`);
      }
      console.log(JSON.stringify({ mol: m, style, rest: row.rest, drag: row.drag, play: row.play, kick: row.kick }));
      res.rows.push(row);
    }
  }
  res.errors = await ev(`return (window.__e || []).slice(0, 5);`);
} catch (e) { console.error('PROBE ERROR', e.message); res.error = e.message; }
finally { proc.kill(); await sleep(400); spawn('rm', ['-rf', profile]); }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
