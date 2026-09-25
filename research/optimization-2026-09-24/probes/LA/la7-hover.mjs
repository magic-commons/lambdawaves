/* la7-hover.mjs — LA7's gate: hovering the CAPTURE group must not run a synchronous period scan, and the plan it
 * paints once the scan lands must equal the FORCED plan (the PLAN button's) — the object planLoop returns (W included)
 * and the painted face — on {1s+2pz, BOX density, BOX phase, Stark, 2p+ phase, Sturmian}.
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la7-hover.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = { states: {} };
const SETUP = {
  '1s+2pz': `__LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.setView('phase');`,
  'box-density': `__LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.3, 0.7, 0.2], [1.1, 0.1, 0], 1.3); __LW.setView('density');`,
  'box-phase': `__LW.setHamiltonian('well'); __LW.setGasBasis('reg'); __LW.launchPacket([-3.1, 0.6, 0.3], [1.0, 0.2, 0], 1.2); __LW.setView('phase');`,
  'stark': `__LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.reg.setField({ Fz: 0.002 }); __LW.setView('phase');`,
  '2p+-phase': `__LW.setHamiltonian('hydrogen'); __LW.loadPreset('2p+'); __LW.setView('phase');`,
  'sturmian': `__LW.setHamiltonian('hydrogen'); __LW.loadPreset('1s+2pz'); __LW.sturmian.set(true); __LW.sturmian.setLambda(1.37); __LW.setView('phase');`,
};
try {
  await g.ev(`window.__plans = []; const cap = __LW.capture; const orig = cap.planLoop;
    cap.planLoop = function (o) { const r = orig.call(this, o); __plans.push({ soft: !!(o && o.period), r: JSON.parse(JSON.stringify(r)) }); return r; };
    window.__face = () => { const ro = [...document.querySelectorAll('.ro')].find((e) => { const l = e.querySelector('.ro-lbl'); return l && l.textContent === 'THE LOOP PLAN'; });
      const b = __LW.captureUI; const btn = [...document.querySelectorAll('.trig')].find((t) => (t.textContent || '').trim().startsWith('ONE PERIOD'));
      return ro ? { val: ro.querySelector('.ro-val').textContent, cls: ro.className, sub: ro.querySelector('.ro-sub').textContent, onePeriodDisabled: btn ? !!btn.disabled : null } : null; };
    window.__gcap = () => { const l = [...document.querySelectorAll('.grp-lbl')].find((e) => e.textContent === 'CAPTURE'); return l ? l.parentElement : null; };
    return !!__gcap();`).then((ok) => { R.found = ok; });
  for (const [name, setup] of Object.entries(SETUP)) {
    R.states[name] = await g.ev(`__LW.pause(); __LW.sturmian.set(false); __LW.reg.setField({ Bz: 0, Fz: 0 }); ${setup} __LW.pause(); __plans.length = 0;
      /* THE HOVER, in the same task as the state change: nothing has scanned this state yet */
      const t0 = performance.now(); __gcap().dispatchEvent(new PointerEvent('pointerenter', { bubbles: false })); const hoverMs = +(performance.now() - t0).toFixed(2);
      const faceAtHover = __face();
      /* wait for the face to leave its waiting state (≤ 60 s) */
      const t1 = performance.now(); let landedMs = null;
      while (performance.now() - t1 < 60000) { await __LW.settle(); const f = __face(); if (f && f.val !== '…') { landedMs = +(performance.now() - t1).toFixed(0); break; } await new Promise((r) => setTimeout(r, 100)); }
      const hoverFace = __face(), hoverPlan = __plans.length ? __plans[__plans.length - 1] : null;
      /* capApi.plan(false) right after a hover: a caller must get the plan today's code would hand it */
      const n0 = __plans.length; const viaApi = __LW.captureUI.plan(false); const apiRecomputed = __plans.length > n0 && !__plans[__plans.length - 1].soft;
      /* THE FORCED PLAN, the PLAN button's road */
      __LW.captureUI.plan(true); const forcedFace = __face(), forcedPlan = __plans[__plans.length - 1];
      const a = hoverPlan ? hoverPlan.r : null, b = forcedPlan.r, diff = [];
      if (a) for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diff.push(k);
      return { hoverMs, faceAtHover: faceAtHover && faceAtHover.val, landedMs, hoverWasSoft: hoverPlan ? hoverPlan.soft : null, plansDiffer: diff, planDiffDetail: diff.map((k) => [k, a && a[k], b[k]]).slice(0, 4),
        W: { hover: a && { usedPeriod: a.usedPeriod, T: a.T, laps: a.laps, pixelExact: a.pixelExact, Twave: a.Twave }, forced: { usedPeriod: b.usedPeriod, T: b.T, laps: b.laps, pixelExact: b.pixelExact, Twave: b.Twave } },
        facesEqual: JSON.stringify(hoverFace) === JSON.stringify(forcedFace), apiPlanFalseEqualsForced: JSON.stringify(viaApi) === JSON.stringify(b), apiRecomputed, hoverFace, forcedFace: forcedFace && forcedFace.val, kind: b.kind, label: b.label };`);
    console.log(name, JSON.stringify({ hoverMs: R.states[name].hoverMs, landedMs: R.states[name].landedMs, soft: R.states[name].hoverWasSoft, differ: R.states[name].plansDiffer, facesEqual: R.states[name].facesEqual, api: R.states[name].apiPlanFalseEqualsForced, kind: R.states[name].kind, W: R.states[name].W }));
  }
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify({ found: R.found, errs: R.errs, error: R.error }));
save(import.meta.url, R);
