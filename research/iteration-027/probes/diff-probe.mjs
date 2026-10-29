import { open } from '../../../tools/gate/gatekit.mjs';
const f = process.argv[2];
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?sw=0`, { width: 1280, height: 800, script: 300000 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const file = await (await fetch('./demos/${f}.lambdawaves.json', { cache: 'no-cache' })).json();
    const ok = await __LW.projects.demo(${JSON.stringify(f)}); await new Promise((r) => setTimeout(r, 4000)); await __LW.settle();
    const live = __LW.serialize(); const out = { ok, dirty: __LW.projects.dirty, diffs: [] };
    const walk = (a, b, p) => { if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) { if (JSON.stringify(a) !== JSON.stringify(b)) out.diffs.push(p + ': ' + String(JSON.stringify(a)).slice(0, 60) + ' → ' + String(JSON.stringify(b)).slice(0, 60)); return; }
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (out.diffs.length < 14) walk(a[k], b[k], p + '.' + k); };
    walk(file.data.presentation, live.presentation || live.data?.presentation || {}, 'presentation'); walk(file.data.experiment, live.experiment || live.data?.experiment || {}, 'experiment');
    out.liveKeys = Object.keys(live).slice(0, 8); return out;`);
  console.log(f, JSON.stringify(r, null, 0).slice(0, 1800));
} finally { await g.close(); }
