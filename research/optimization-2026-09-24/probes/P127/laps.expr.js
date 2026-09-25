/* laps.expr.js — wave 127: the project open split by the LAP statements of probes/P127/lab-i (instrument.py).  Playing, as the
 * device report does; WAVE DANCER through the button's own road (importText → open); window.__N127 opens (each on a fresh
 * pre-open state: the first is the one that matters, later ones re-open over the demo itself). */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW;
  LW.pause(); await LW.settle(); await sleep(1500);
  const text = await (await fetch('demos/wave-dancer.lambdawaves.json')).text();
  const path = LW.projects.importText(text);
  LW.play(); await sleep(1500);
  const t0 = performance.now();
  const ok = LW.projects.open(path);
  const t1 = performance.now();
  const L = [['t0', t0], ...(window.__LAPS || []).filter((x) => x[1] >= t0 && x[1] <= t1)];
  const t2 = performance.now(); void document.body.offsetHeight; const sl = performance.now() - t2;
  const laps = {};
  for (let i = 1; i < L.length; i++) { const k = L[i][0]; laps[k] = +((laps[k] || 0) + L[i][1] - L[i - 1][1]).toFixed(2); }
  laps['(tail)'] = +(t1 - L[L.length - 1][1]).toFixed(2);
  await sleep(500);
  return { ok, syncMs: +(t1 - t0).toFixed(1), afterStyleLayoutMs: +sl.toFixed(1), laps, seq: L.slice(1).map((x, i) => x[0] + ' ' + (x[1] - L[i][1]).toFixed(2)) };
})()
