import { open } from '../../../tools/gate/gatekit.mjs';
const f = process.argv[2];
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?sw=0`, { width: 1280, height: 800, script: 300000 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const ok = await __LW.projects.demo(${JSON.stringify(f)}); const w = (ms) => new Promise((r) => setTimeout(r, ms));
    await w(500); const d0 = __LW.projects.dirty; const s0 = JSON.stringify(__LW.serialize()); await w(4000); const d1 = __LW.projects.dirty; const s1 = JSON.stringify(__LW.serialize()); await w(6000); const s2 = JSON.stringify(__LW.serialize());
    const F = __LW.projects.folders; const info = F && F.dirty ? F.dirty() : null;
    const diff = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b), out = []; const walk = (x, y, p) => { if (typeof x !== 'object' || x === null || typeof y !== 'object' || y === null) { if (JSON.stringify(x) !== JSON.stringify(y)) out.push(p + ': ' + String(JSON.stringify(x)).slice(0, 50) + ' → ' + String(JSON.stringify(y)).slice(0, 50)); return; } for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (out.length < 10) walk(x[k], y[k], p + '.' + k); }; walk(A, B, ''); return out; };
    return { ok, d0, d1, drift0to4: diff(s0, s1), drift4to10: diff(s1, s2), info: info && Object.keys(info), infoStr: JSON.stringify(info).slice(0, 300), armed: __LW.mod.armed, playing: __LW.clock.playing };`);
  console.log(f, JSON.stringify(r).slice(0, 1600));
} finally { await g.close(); }
