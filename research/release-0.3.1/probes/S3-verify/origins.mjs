// VERIFY item 6: the bottom row names its origin (boot, open · WAVE DANCER, new project, link — a link opened in-page and a link in the
// URL at boot), and a FAILED open leaves the ring alone (the new-project fetch refused; a file whose restore throws half-way, M5b).
import { lab, LAB } from './kit.mjs';
let g = await lab();
const out = {};
try {
  out.boot = await g.run(`return { rows: __rows(), first: __LW.history.entries()[0].label, depth: __LW.history.depth };`);
  out.dancer = await g.run(`const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true; __LW.setStage(0.33); __LW.history.flush();
    const before = __rows(); const f = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); window.__dancer = P.importText(await f.text());
    const ok = P.open(window.__dancer); window.confirm = c0; const now = { rows: __rows(), depth: __LW.history.depth }; await __w(1500);
    return { before, ok, now, later: { rows: __rows(), depth: __LW.history.depth, canUndo: __LW.history.canUndo } };`);
  out.fresh = await g.run(`__LW.setStage(0.44); __LW.history.flush(); const before = __rows(); const c0 = window.confirm; window.confirm = () => true;
    const ok = await __LW.layout.projects.fresh(); window.confirm = c0; const now = { rows: __rows(), depth: __LW.history.depth }; await __w(1500);
    return { before, ok, now, later: { rows: __rows(), depth: __LW.history.depth, canUndo: __LW.history.canUndo } };`);
  out.linkInPage = await g.run(`__LW.setStage(0.55); __LW.history.flush(); const href = __LW.link.mint().href; __LW.setStage(0.66); __LW.history.flush(); const before = __rows();
    const r = __LW.link.open(href); return { href: href.slice(0, 80) + '…', opened: r && r.opened, ok: r && r.ok, rows: __rows(), depth: __LW.history.depth };`);
  /* A FAILED OPEN: (a) the new-project file unreachable, (b) a file whose restore throws half-way (the palette breaker) */
  out.failed = await g.run(`const H = __LW.history, P = __LW.layout.projects, f0 = window.fetch; __LW.setStage(0.71); H.flush(); __LW.setStage(0.72); H.flush();
    const r0 = __rows(), s0 = __ser();
    window.fetch = (u, o) => /new-project/.test(String(u)) ? Promise.resolve(new Response('gone', { status: 404 })) : f0(u, o);
    const a = { ok: await P.fresh() }; await __w(700); H.flush(); Object.assign(a, { rows: __rows(), same: __ser() === s0, sameRows: JSON.stringify(__rows()) === JSON.stringify(r0) });
    const bad = await (await f0('./new-project.lambdawaves.json', { cache: 'no-cache' })).json(); bad.data.presentation.palette.stops = [5];
    window.fetch = (u, o) => /new-project/.test(String(u)) ? Promise.resolve(new Response(JSON.stringify(bad), { status: 200 })) : f0(u, o);
    const b = { ok: await P.fresh() }; await __w(700); const pendingDirty = H.canUndo && H.depth > H.cursor; H.flush();
    Object.assign(b, { rows: __rows(), same: __ser() === s0, sameRows: JSON.stringify(__rows()) === JSON.stringify(r0), diff: __ser() === s0 ? [] : __diff(JSON.parse(s0), JSON.parse(__ser())).slice(0, 5), pendingDirty });
    window.fetch = f0;
    /* (c) a stored project whose data throws half-way, opened from the collection */
    const good = JSON.parse(P.exportText(window.__dancer)); good.data.presentation.palette.stops = [5]; good.name = 'BROKEN'; good.path = 'probe/BROKEN'; good.folder = 'probe';
    const path = P.importText(JSON.stringify(good)); const r1 = __rows(), s1 = __ser(); const c = { ok: P.open(path) }; await __w(700); H.flush();
    Object.assign(c, { path, rows: __rows(), sameRows: JSON.stringify(__rows()) === JSON.stringify(r1), same: __ser() === s1 });
    const undo = { ok: H.undo(), mix: __LW.serialize({ scope: 'edit' }).presentation.ui.stage.mix };
    return { r0, a, b, c, undo, errs: __e.slice() };`);
  out.bootHref = await g.run(`__LW.mat.exposure = 2.25; return __LW.link.mint().href;`);
  await g.close(); g = null;
  g = await lab(out.bootHref);
  out.bootLink = await g.run(`return { rows: __rows(), depth: __LW.history.depth, carried: Math.abs(__LW.mat.exposure - 2.25) < 1e-3, hash: location.hash.slice(0, 20), errs: __e.slice() };`);
  await g.close(); g = null;
  /* a hash that does not decode: not a link open — the bottom row must not claim 'link' */
  g = await lab(LAB + '#s=AAAA-garbage');
  out.badLink = await g.run(`return { rows: __rows(), depth: __LW.history.depth, errs: __e.slice() };`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { if (g) await g.close(); }
console.log(JSON.stringify(out, null, 1));
