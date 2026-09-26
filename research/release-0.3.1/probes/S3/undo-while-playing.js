/* S3 · WHY AN UNDO SKIPS AN UNCHANGED HEAVY SECTION (BRIEF-S3 §4's fallback, taken on this measurement).
 * WAVE DANCER playing (LFO routes on exposure, softness, iso, fov, stage), the modulation window open: change the STYLE (not a
 * modulation key), flush, undo.  Before the skip (every section re-applied): the undo took 77.4 ms, rebuilt the window once, STOPPED
 * the modulation transport under a playing field (playing true → false, and it stayed false 1.4 s later), put the LFO macro back to
 * phase 0 (0.9986 → 0) and made the routed exposure jump 0.4473 → 1.3654 (its base).  After (modulation, palette, instruments and
 * overlays re-applied only when their JSON moved): 11.8 ms, no rebuild, the transport still playing and the LFO continuous.
 * Output: undo-while-playing.json.
 *   LW_PORT=8737 GD_PORT=5237 node research/release-0.3.1/probes/S3/ev.mjs research/release-0.3.1/probes/S3/undo-while-playing.js */
const w = (n) => new Promise((r) => setTimeout(r, n));
const L = __LW, H = L.history, M = L.mod.model, out = {};
const P = L.layout.projects; const c0 = window.confirm; window.confirm = () => true;
const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await r.text()); P.open(path); window.confirm = c0;
await w(1000);
out.routes = M.routeList().map((x) => x.targetId); out.sources = M.sourceList ? M.sourceList().map((s) => s.kind) : null;
L.layout.modulation.expand(); await w(400);
const run = document.querySelector('#modwin .m2run');
let removed = 0; const mo = new MutationObserver((recs) => { for (const x of recs) for (const n of x.removedNodes) if (n.classList && n.classList.contains('m2dev')) removed++; });
mo.observe(run, { childList: true, subtree: true });
const ndev = run.querySelectorAll('.m2dev').length;
L.play(); await w(1500);
const snapMod = () => ({ playing: L.mod.playing, running: L.mod.running, macros: M.macroList().map((m) => +m.value.toFixed(4)), exposure: +L.mat.exposure.toFixed(4), t: +L.clock.t.toFixed(3), fieldPlaying: L.clock.playing });
out.beforeEdit = snapMod();
L.setStyle(L.mat.style === 1 ? 'cloud' : 'solid'); H.note(); H.flush();
out.afterEdit = snapMod();
const dev0 = run.querySelector('.m2dev'); removed = 0;
const t0 = performance.now(); H.undo(); out.undoMs = performance.now() - t0;
out.afterUndo = snapMod();
await new Promise((res) => requestAnimationFrame(res));
out.rebuilds = removed / ndev; out.sameDevNode = dev0 === run.querySelector('.m2dev');
await w(400);
out.later = snapMod();
await w(1000);
out.later2 = snapMod();
L.pause(); mo.disconnect();
out.rows = H.entries().map((e) => e.label + ':' + e.state);
out.errs = __e.slice();
return out;
