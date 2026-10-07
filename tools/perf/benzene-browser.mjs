/* benzene-browser.mjs — 0.4.0 S0 MEASURE §2 (browser half): the REAL worker path — the MOLECULES card's own solve(),
 * which posts `chem.ground` then `chem.spectrum` to the `chem` worker (lab/worker-pool.js) — ground and spectrum.
 *   python3 tools/gate/server.py "$PWD" 8735 &
 *   LW_PORT=8735 GD_PORT=5205 node tools/perf/benzene-browser.mjs [firefox] [chromium] [runs=5]
 * In the page: __LW.chem.solve(id) resolves when the roots are in; the GROUND landing is read by polling
 * __LW.chem.state() every 2 ms for the new molecule's nAO (the card publishes the ground state first), and the worker's
 * own timings come off the card's status line ("ground X ms (integrals Y of it) · rpa Z ms").  Molecules are cycled
 * (N₂ → C₆H₆ → H₂O → …) so the worker's one-solve cache never answers; run 0 is the cold first solve of each (worker
 * graph, basis fetch, JIT) and is kept apart.  C₂H₄ in 6-31+G* (the 46-AO cap) goes through the card's BASIS control.
 * Writes research/release-0.4.0/measure/benzene-browser.json. */
import { launch, sleep } from './cdp.mjs';
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = process.env.LW_PORT || '8735';
const URL_ = `https://127.0.0.1:${PORT}/lab/?sw=0`;
const OUT = 'research/release-0.4.0/measure/benzene-browser.json';
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const args = process.argv.slice(2);
const RUNS = +(args.find((a) => /^\d+$/.test(a)) || 5);
const pick = args.filter((a) => !/^\d+$/.test(a));

/* one timed solve, in the page: wall to the ground landing, wall to the roots, and the worker's own split */
const TIMED = `
  window.__timed = async (id, basis) => {
    const C = __LW.chem, before = C.state();
    const t0 = performance.now(); let tGround = null;
    const poll = setInterval(() => { if (tGround !== null) return; const s = C.state();
      if (s.preset === id && s.hash !== before.hash && s.nAO > 0 && s.stage !== 'none') tGround = performance.now() - t0; }, 2);
    const p = basis ? C.setBasis(basis) : C.solve(id);
    await p; const tFull = performance.now() - t0; clearInterval(poll);
    const s = C.state(), m = (re) => { const x = re.exec(s.status || ''); return x ? +x[1] : null; };
    return { id, basis: s.basis, nAO: s.nAO, energy: s.energy, roots: s.roots, local: s.local, groundWallMs: tGround === null ? null : +tGround.toFixed(1),
      fullWallMs: +tFull.toFixed(1), spectrumWallMs: tGround === null ? null : +(tFull - tGround).toFixed(1),
      workerGroundMs: m(/ground (\\d+) ms/), workerIntegralsMs: m(/integrals (\\d+)/), workerRpaMs: m(/rpa (\\d+) ms/), status: s.status };
  }; return 1;`;
const SEQ = (runs) => `
  __LW.layout.reopen('chem', 'R'); try { __LW.pause(); } catch (e) {}
  const out = { ua: navigator.userAgent, hc: navigator.hardwareConcurrency, runs: [] };
  for (let r = 0; r <= ${runs}; r++) {
    for (const id of ['N2', 'C6H6', 'H2O']) out.runs.push({ run: r, ...(await __timed(id)) });
    await __LW.chem.solve('C2H4');                                              // STO-3G first, so the basis switch is the timed solve
    out.runs.push({ run: r, ...(await __timed('C2H4', '6-31+g-star')) });
    await __LW.chem.setBasis('sto-3g');
  }
  out.errs = (window.__e || []).slice();
  return out;`;

async function firefox() {
  const g = await open(URL_, { width: 1500, height: 1100, script: 1800000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 600, 100);
    await g.ev(TIMED);
    return await g.ev(SEQ(RUNS));
  } finally { await g.close(); }
}
async function chromium() {
  process.env.CHROMIUM = PW; process.env.LW_CDP_TIMEOUT = '1800000';
  const b = await launch({ width: 1500, height: 1100, gpu: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan'] });
  try {
    await b.goto(URL_, 1000);
    for (let i = 0; i < 400; i++) { try { if (await b.eval('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
    await b.eval(`(()=>{ ${TIMED} })()`);
    return await b.eval(`(async()=>{ ${SEQ(RUNS)} })()`);
  } finally { await b.close(); }
}

const med = (a) => { const s = a.filter((x) => x !== null).sort((x, y) => x - y), k = s.length >> 1; return !s.length ? null : s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const stat = (rows, k) => { const v = rows.map((r) => r[k]).filter((x) => x !== null); return v.length ? { median: +med(v).toFixed(1), min: Math.min(...v), max: Math.max(...v), n: v.length } : null; };
let prev = {}; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
const res = prev.browsers || {};
for (const k of (pick.length ? pick : ['firefox', 'chromium'])) {
  const t0 = Date.now();
  try { res[k] = await (k === 'chromium' ? chromium() : firefox()); }
  catch (e) { res[k] = { error: String(e && e.stack || e) }; console.log(k, 'ERROR', res[k].error); continue; }
  res[k].wallSec = +((Date.now() - t0) / 1000).toFixed(1); res[k].at = new Date().toISOString();
  res[k].summary = {};
  for (const id of ['H2O', 'N2', 'C6H6', 'C2H4']) {
    const all = res[k].runs.filter((r) => r.id === id), warm = all.filter((r) => r.run > 0), cold = all.find((r) => r.run === 0);
    res[k].summary[id] = { basis: all[0] && all[0].basis, nAO: all[0] && all[0].nAO, cold: cold && { ground: cold.groundWallMs, full: cold.fullWallMs },
      groundWall: stat(warm, 'groundWallMs'), spectrumWall: stat(warm, 'spectrumWallMs'), fullWall: stat(warm, 'fullWallMs'),
      workerGround: stat(warm, 'workerGroundMs'), workerIntegrals: stat(warm, 'workerIntegralsMs'), workerRpa: stat(warm, 'workerRpaMs'), local: warm.some((r) => r.local) };
    const s = res[k].summary[id];
    console.log(`${k} ${id} [${s.basis}] ${s.nAO} AO: ground ${JSON.stringify(s.groundWall)} spectrum ${JSON.stringify(s.spectrumWall)} full ${JSON.stringify(s.fullWall)} · worker ground ${s.workerGround && s.workerGround.median} int ${s.workerIntegrals && s.workerIntegrals.median} rpa ${s.workerRpa && s.workerRpa.median} · cold ${JSON.stringify(s.cold)} local ${s.local}`);
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ host: os.hostname(), runs: RUNS, browsers: res }, null, 1));
console.log('wrote', OUT);
