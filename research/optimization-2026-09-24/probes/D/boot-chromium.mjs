/* boot-chromium.mjs — the same createField split in headless Chromium (real GPU), against probes/D/lab-i.
 *   LW_PORT=8721 node research/optimization-2026-09-24/probes/D/boot-chromium.mjs [runs] */
import { launch, sleep } from '../../../../tools/perf/cdp.mjs';
const PORT = process.env.LW_PORT || '8721';
const RUNS = +(process.argv[2] || 2);
for (let i = 0; i < RUNS; i++) {
  const b = await launch({ width: 1600, height: 900, gpu: true, args: ['--ignore-certificate-errors', '--enable-unsafe-webgpu'] });
  try {
    await b.goto(`https://127.0.0.1:${PORT}/research/optimization-2026-09-24/probes/D/lab-i/?preset=1s%2B2pz&sw=0`, 300);
    for (let k = 0; k < 300; k++) { if (await b.eval('!!(window.__LW && __LW.ready)')) break; await sleep(50); }
    const r = await b.eval(`(() => { const m = performance.getEntriesByType('mark').filter(e => /^f:|field-|boot-start|lw-ready|windows-start|go:start|html-start|dcl/.test(e.name)).map(e => [e.name, +e.startTime.toFixed(1)]); return { m, ok: window.__LW && __LW.field.ok, err: window.__LW && __LW.field.error, ua: navigator.userAgent }; })()`);
    console.log('run', i, r.ok, r.err || '', r.ua.slice(0, 60));
    let prev = 0; for (const [n, t] of r.m) { console.log(String(t).padStart(8), ('+' + (t - prev).toFixed(1)).padStart(8), n); prev = t; }
  } finally { await b.close(); }
}
