/* laps-agg.mjs — wave 127: the median of each lap over several laps.expr.js outputs.   node laps-agg.mjs a.json b.json … */
import fs from 'node:fs';
const runs = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8'))).filter((o) => o && o.laps);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] : 0; };
const keys = [...new Set(runs.flatMap((o) => Object.keys(o.laps)))];
console.log('runs', runs.length, 'syncMs', runs.map((o) => o.syncMs).join(' / '), '→ median', med(runs.map((o) => o.syncMs)), '· style+layout after', med(runs.map((o) => o.afterStyleLayoutMs)));
const rows = keys.map((k) => [k, med(runs.map((o) => o.laps[k] || 0)), runs.map((o) => o.laps[k] || 0)]).filter((r) => r[1] >= Number(process.env.MIN || 0.3));
for (const [k, m, all] of rows) console.log(String(m.toFixed(2)).padStart(7), k.padEnd(26), all.map((x) => x.toFixed(1)).join(' '));
