/* PACE · P3's put-back gate: the two ways the iPad runs came back DIFFERENT, reproduced in headless Firefox.
 *   (1) the modulation window remembers a row for a source that no longer exists (the settings key's modwin.modes, as on the
 *       iPad: `s3`) — its first open, in the report's "modulation window open" scene, pruned it;
 *   (2) the camera moved while the report ran (a hand's fling 5 s in) — the pose, and `tablet-motion` while it turned.
 *   LW_PORT=8734 GD_PORT=5250 node research/optimization-2026-09-24/probes/PACE/report-putback.mjs [tag]
 * Pass: restored.* all identical (camera "put back"), serialize (layout.at / quality.autoScale masked) and body classes equal. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import { save } from '../LA/lib.mjs';
const PORT = process.env.LW_PORT || '8734';
const URL0 = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`;
const g = await open(URL0, { width: 1600, height: 1000, script: 900000, prefs: { 'privacy.reduceTimerPrecision': false } });
const SNAP = `const snap = () => { const o = __LW.serialize(); delete o.presentation.layout.at; delete o.presentation.quality.autoScale;
  return { ser: JSON.stringify(o), modes: JSON.stringify(o.presentation.modwin && o.presentation.modwin.modes), obs: JSON.stringify(o.presentation.obs), cls: document.body.className }; };`;
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  /* a returning user whose modulation window has a place, and whose settings remember a row for a source that is gone */
  out.setup = await g.ev(`try { __LW.warning.dismiss(); } catch (_) {}
    __LW.mod.expand(); await __LW.settle(); __LW.mod.collapse(); await __LW.settle(); await new Promise(r => setTimeout(r, 800));
    const s = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); s.modwin = s.modwin || {}; s.modwin.modes = Object.assign({}, s.modwin.modes, { s9: 'C' });
    localStorage.setItem('lambdawaves.q0.settings', JSON.stringify(s)); return { modwin: s.modwin };`);
  await g.ev(`location.reload(); return 1;`).catch(() => null);
  await new Promise((r) => setTimeout(r, 2500));
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out.before = await g.ev(`try { __LW.warning.dismiss(); } catch (_) {} __LW.pause(); __LW.scrub(0); await __LW.settle(); await new Promise(r => setTimeout(r, 1500)); ${SNAP} return snap();`);
  out.report = await g.ev(`setTimeout(() => { try { __LW.camera.fling(3, 0.4); } catch (_) {} }, 5000);   /* a hand on the glass, 5 s in */
    const R = await __LW.report(); return { restored: R.restored, errors: R.errors, pace: R.pace, long: (R.scenes || []).filter(s => /^long play/.test(s.label)).map(s => ({ label: s.label, rafFps: s.rafFps, presents: s.presents, skipped: s.skipped, inFlightMax: s.inFlightMax, queueMsMax: s.queueMsMax, gaps100: s.gaps100, paced: s.paced, bins: (s.bins || []).length })) };`);
  out.after = await g.ev(`${SNAP} return snap();`);
  out.same = Object.fromEntries(Object.keys(out.before).map((k) => [k, out.before[k] === out.after[k]]));
  out.errs = await g.ev('return (window.__e || []).map(String).slice(0, 20)');
} catch (e) { out.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify({ same: out.same, restored: out.report && out.report.restored, long: out.report && out.report.long, pace: out.report && out.report.pace && { paced: out.report.pace.paced }, modesBefore: out.before && out.before.modes, modesAfter: out.after && out.after.modes, errs: out.errs, error: out.error }, null, 1));
console.log('wrote', save(import.meta.url, out));
