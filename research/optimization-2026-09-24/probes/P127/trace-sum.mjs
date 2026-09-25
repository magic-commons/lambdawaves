/* trace-sum.mjs — wave 127: the long events of a CDP trace around the 'lw127-open' mark, per process/thread.
 *   node trace-sum.mjs trace.json [windowMs=1500] [minMs=2] */
import fs from 'node:fs';
const [F, WIN = '1500', MIN = '2'] = process.argv.slice(2);
const ev = JSON.parse(fs.readFileSync(F, 'utf8'));
const pname = {}, tname = {};
for (const e of ev) if (e.ph === 'M') { if (e.name === 'process_name') pname[e.pid] = e.args.name; if (e.name === 'thread_name') tname[e.pid + ':' + e.tid] = e.args.name; }
const mark = ev.find((e) => e.name === 'lw127-open' && (e.ph === 'R' || e.ph === 'I' || e.ph === 'n' || e.ph === 'b' || e.ph === 'i' || e.cat && e.cat.includes('user_timing')));
if (!mark) { console.log('no mark; names:', [...new Set(ev.filter((e) => /lw127/.test(e.name)).map((e) => e.ph))]); process.exit(1); }
const t0 = mark.ts, t1 = t0 + WIN * 1000;
const rows = ev.filter((e) => e.ph === 'X' && e.ts >= t0 - 50000 && e.ts <= t1 && e.dur >= MIN * 1000);
const by = {};
for (const e of rows) { const k = (pname[e.pid] || e.pid) + ' / ' + (tname[e.pid + ':' + e.tid] || e.tid); (by[k] || (by[k] = [])).push(e); }
for (const [k, list] of Object.entries(by)) {
  console.log('\n## ' + k);
  list.sort((a, b) => a.ts - b.ts);
  for (const e of list.slice(0, Number(process.env.N || 60))) console.log(((e.ts - t0) / 1000).toFixed(1).padStart(8), (e.dur / 1000).toFixed(1).padStart(7), e.name, e.args && e.args.data ? JSON.stringify(e.args.data).slice(0, 100) : '');
}
