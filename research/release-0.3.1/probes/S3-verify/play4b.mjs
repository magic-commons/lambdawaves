// VERIFY item 4 with the MOVING macro: WAVE DANCER playing (LINKED), every routed target sampled across an unrelated undo; then a route
// from the LFO-driven macro onto KNEE, undone while it plays (knee back at its base exactly), redone (routed again on that base).
import { lab } from './kit.mjs';
const g = await lab();
try {
  const r = await g.run(`const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true;
    const f = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await f.text()); P.open(path); window.confirm = c0; await __w(1200);
    const H = __LW.history, M = __LW.mod.model, R = __LW.mod.registry;
    const routes = M.routeList().map((x) => ({ t: x.targetId, m: x.macroId }));
    const liveOf = (id) => { const s = R.state ? R.state(id) : null; return s && Number.isFinite(s.value) ? +s.value.toFixed(5) : (s && Number.isFinite(s.live) ? +s.live.toFixed(5) : JSON.stringify(s)); };
    __LW.play(); await __w(1500); await __settle();
    const sample = () => ({ t: +performance.now().toFixed(1), playing: __LW.mod.playing, macros: M.macroList().map((m) => +(+m.value).toFixed(4)), live: Object.fromEntries(routes.map((x) => [x.t, liveOf(x.t)])), exposure: +__LW.mat.exposure.toFixed(4), stage: +__LW.serialize().presentation.ui.stage.mix.toFixed(4) });
    const series = []; for (let i = 0; i < 5; i++) { series.push(sample()); await __w(40); }
    const seg = __segb('STYLE', __LW.mat.style === 1 ? 'CLOUD' : 'SOLID', 'observer'); __show(seg); await __spress(seg); await __w(500); H.flush();
    const pre = sample(); H.undo(); const post = sample(); const post2 = []; for (let i = 0; i < 5; i++) { await __w(40); post2.push(sample()); }
    /* the moving macro */
    const a = M.macroList().map((m) => m.value); await __w(250); const b = M.macroList().map((m) => m.value);
    const mi = a.findIndex((v, i) => v !== b[i]), mid = M.macroList()[mi].id;
    await __settle(); const base0 = R.baseOf('material.knee'), knee0 = __LW.mat.knee;
    __LW.mod.route(mid, 'material.knee', 0, 1); await __w(700); H.flush();
    const routed = []; for (let i = 0; i < 4; i++) { routed.push({ knee: +__LW.mat.knee.toFixed(4), base: R.baseOf('material.knee'), mod: R.isModulated('material.knee') }); await __w(60); }
    H.undo(); const u0 = { knee: __LW.mat.knee, base: R.baseOf('material.knee'), mod: R.isModulated('material.knee'), playing: __LW.mod.playing };
    await __w(400); const u1 = { knee: __LW.mat.knee, base: R.baseOf('material.knee'), mod: R.isModulated('material.knee'), playing: __LW.mod.playing, knob: __knob('KNEE') ? __knob('KNEE').querySelector('.k-val') && __knob('KNEE').querySelector('.k-val').textContent : null };
    H.redo(); await __w(500); const r1 = []; for (let i = 0; i < 4; i++) { r1.push({ knee: +__LW.mat.knee.toFixed(4), base: R.baseOf('material.knee'), mod: R.isModulated('material.knee'), playing: __LW.mod.playing }); await __w(60); }
    __LW.pause(); await __w(200);
    return { routes, series, pre, post, post2, movingMacro: mi, base0, knee0, routed, undone0: u0, undone: u1, redone: r1, errs: __e.slice() };`);
  console.log(JSON.stringify(r, null, 1));
} finally { await g.close(); }
