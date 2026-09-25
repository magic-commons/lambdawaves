/* final-agg.mjs — wave 127: medians of the device report's PROJECT OPEN scene, base vs new, from final-ab.sh's outputs.
 *   node research/optimization-2026-09-24/probes/P127/final-agg.mjs [n=3] [out.json] */
import fs from 'node:fs';
const N = +(process.argv[2] || 3), OUT = process.argv[3];
const med = (a) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] : null; };
const R = {};
for (const eng of ['ff', 'el']) for (const tag of ['base', 'new']) {
  const rows = [];
  for (let i = 1; i <= N; i++) { try { rows.push(JSON.parse(fs.readFileSync(`/tmp/lw127-F-${eng}-${tag}-${i}.json`, 'utf8'))); } catch {} }
  const po = (o) => { if (eng === 'ff') { const s = o.report && o.report.scenes && o.report.scenes.find((x) => /^project open/.test(x.label)); return s && s.projectOpen && { open: s.projectOpen.open, restore: s.projectOpen.restore, same: o.same, bd: s.projectOpen.breakdown }; }
    return { open: o.open && { syncMs: o.open.syncMs, styleLayoutMs: o.open.styleLayoutMs, rebuildFrame: { firstFrame: o.open.rebuild && o.open.rebuild.f1, secondFrame: o.open.rebuild && o.open.rebuild.f2 }, window: o.open.window },
      restore: o.restore && { syncMs: o.restore.syncMs, styleLayoutMs: o.restore.styleLayoutMs, rebuildFrame: { firstFrame: o.restore.rebuild && o.restore.rebuild.f1, secondFrame: o.restore.rebuild && o.restore.rebuild.f2 }, window: o.restore.window }, same: o.same, bd: o.breakdown }; };
  const P = rows.map(po).filter(Boolean);
  const pick = (k, f) => med(P.map((p) => { try { return f(p[k]); } catch { return NaN; } }));
  R[eng + ' ' + tag] = { runs: P.length, same: P.map((p) => JSON.stringify(p.same && (typeof p.same === 'object' ? Object.values(p.same).every(Boolean) : p.same))).join(','),
    openMs: pick('open', (x) => x.syncMs), openAll: P.map((p) => p.open && p.open.syncMs), openStyleLayoutMs: pick('open', (x) => x.styleLayoutMs),
    openF1gpu: pick('open', (x) => x.rebuildFrame.firstFrame.gpuDoneMs), openF2gpu: pick('open', (x) => x.rebuildFrame.secondFrame.gpuDoneMs), openMaxGap: pick('open', (x) => x.window.maxGapMs),
    restoreMs: pick('restore', (x) => x.syncMs), restoreAll: P.map((p) => p.restore && p.restore.syncMs), restoreF1gpu: pick('restore', (x) => x.rebuildFrame.firstFrame.gpuDoneMs), restoreMaxGap: pick('restore', (x) => x.window.maxGapMs) };
}
console.log(JSON.stringify(R, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
