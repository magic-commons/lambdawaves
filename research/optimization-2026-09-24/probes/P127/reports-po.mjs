/* reports-po.mjs — wave 127: the PROJECT OPEN scene of every device report under research/device-reports/ (the iPad's numbers).
 *   node research/optimization-2026-09-24/probes/P127/reports-po.mjs */
import fs from 'node:fs'; import path from 'node:path';
const D = 'research/device-reports';
for (const f of fs.readdirSync(D).filter((x) => x.endsWith('.json')).sort()) {
  let o; try { o = JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')); } catch { continue; }
  const s = (o.scenes || []).find((x) => /^project open/.test(x.label || ''));
  if (!s) continue;
  if (s.skipped) { console.log(f, 'SKIPPED', s.skipped); continue; }
  const po = s.projectOpen || {}, op = po.open || {}, rs = po.restore || {};
  const fr = (r) => r && r.rebuildFrame ? [r.rebuildFrame.firstFrame, r.rebuildFrame.secondFrame].map((x) => x ? x.afterMs + '→' + x.gpuDoneMs : '—').join(' ') : '—';
  console.log(f, o.device, '| open', op.syncMs, 'sl', op.styleLayoutMs, 'frames', fr(op), 'maxGap', op.window && op.window.maxGapMs, '| restore', rs.syncMs, 'sl', rs.styleLayoutMs, 'frames', fr(rs), 'maxGap', rs.window && rs.window.maxGapMs);
  if (po.breakdown) for (const k of ['open', 'restore']) console.log('   ', k, (po.breakdown[k] || []).slice(0, 8).map((x) => x.label + ' ' + x.selfMs + '/' + x.ms + '×' + x.n).join(' · '));
}
