/* governor.js — LANE A probe body: what GOVERNOR + AUTO SCALE actually do on the heaviest state, as a time series.
 * The AXIAL GAS at 128³, UI hidden (so headless Firefox's software compositor is not what is judged), both switches ON,
 * playing for __A_SECS s; every 250 ms: grid, stepCap, drop, autoScale, canvas size, fps, and every grid change counted.
 * PRE: globalThis.__A_GSCEN = 'gas' | 'default';  __A_SECS; __A_UI = true to leave the UI shown. */
const LW = __LW, F = LW.field;
const SC = globalThis.__A_GSCEN || 'gas', SECS = globalThis.__A_SECS || 40;
if (SC === 'gas') { LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); }
else { LW.setHamiltonian('hydrogen'); LW.setGasBasis('reg'); LW.loadPreset('sim-ladder'); }
LW.pause();
LW.quality.res = 128; LW.quality.steps = 240; LW.quality.scale = 1; LW.schedule(4); await LW.settle();
LW.governor.on = true; LW.quality.auto = true; LW.quality.autoScale = 1;
if (!globalThis.__A_UI && !LW.uiHidden) LW.keys.toggleUI();
await LW.settle();
const canvas = document.getElementById('field');
const series = []; let lastRes = F.resolution, resChanges = 0, lastScale = 1, scaleChanges = 0;
const t0 = performance.now(); LW.play();
while (performance.now() - t0 < SECS * 1000) {
  await new Promise((r) => setTimeout(r, 250));
  const res = F.resolution; if (res !== lastRes) { resChanges++; lastRes = res; }
  const sc = LW.quality.autoScale; if (sc !== lastScale) { scaleChanges++; lastScale = sc; }
  series.push({ t: +((performance.now() - t0) / 1000).toFixed(2), res, stepCap: F.stepCap === Infinity ? 'inf' : F.stepCap, steps: LW.mat.steps, drop: LW.governor.drop, median: +LW.governor.median.toFixed(1), autoScale: sc, cw: canvas.width, fps: +LW.stats.fps.toFixed(1), recon: +LW.stats.reconPerSec.toFixed(1) });
}
LW.pause(); await LW.settle();
const after = { res: F.resolution, stepCap: F.stepCap === Infinity ? 'inf' : F.stepCap, autoScale: LW.quality.autoScale, cw: canvas.width };
if (LW.uiHidden) LW.keys.toggleUI();
/* compact: keep only rows where something changed */
const rows = series.filter((r, i) => i === 0 || ['res', 'stepCap', 'drop', 'autoScale'].some((k) => r[k] !== series[i - 1][k]));
return { scen: SC, secs: SECS, uiHidden: !globalThis.__A_UI, resChanges, scaleChanges, governorChanges: LW.governor.changes, rows, last: series[series.length - 1], afterPause: after, budgetMode: LW.perf.mode };
