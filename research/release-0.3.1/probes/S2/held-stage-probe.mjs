/* held-stage-probe.mjs — 0.3.1 · S2 follow-up: does a project open land the file's stage mix while the previous project's
 * modulation holds the stage?  WAVE DANCER's "Stage" macro routes material.stage.  Three roads, each after the demo plays
 * ≥ 1.2 s: (a) NEW while playing, (b) a stored project saved at mix 0.2 opened while playing, (c) NEW after a play with the
 * modulation window folded, then a pause.  Written beside this file as held-stage-probe.<tag>.json (tag = argv[2]).
 *   LW_PORT=8735 GD_PORT=5235 node research/release-0.3.1/probes/S2/held-stage-probe.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || '8735'}/lab/?sw=0`, { width: 1500, height: 1000, script: 120000 });
const R = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.out = await g.ev(`const P = __LW.layout.projects, M = __LW.mod.registry, w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
    const mix = () => __LW.serialize().presentation.ui.stage.mix;
    const demo = P.importText(await (await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' })).text());
    const playDemo = async () => { P.open(demo); await __LW.settle(); __LW.play(); await w(1200); return { held: M.isModulated('material.stage'), playing: __LW.mod.playing, mixPlaying: mix() }; };
    const out = {};
    await P.fresh(); await __LW.settle(); __LW.setStage(0.2); P.save('probe/stage02');
    out.a = await playDemo(); await P.fresh(); await __LW.settle(); await w(300); out.a.after = mix(); out.a.want = 0.04;
    out.b = await playDemo(); P.open('probe/stage02'); await __LW.settle(); await w(300); out.b.after = mix(); out.b.want = 0.2;
    /* (b2) the same 0.2 project as a file from another build: data without the modulationBases table (serialize()'s own form) */
    const d2 = JSON.parse(JSON.stringify(__LW.serialize())); d2.presentation.ui.stage.mix = 0.2;
    const imp = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/stage02-nobases', data: d2, notebook: { title: 'x', text: '' } }));
    out.b2 = await playDemo(); P.open(imp); await __LW.settle(); await w(300); out.b2.after = mix(); out.b2.want = 0.2; out.b2.bases = 'modulationBases' in d2.presentation;
    /* (c2) the window OPEN during the play, then a pause, then NEW */
    P.open(demo); await __LW.settle(); __LW.layout.modulation.expand(); await w(300); __LW.play(); await w(1200);
    out.c2 = { held: M.isModulated('material.stage'), open: __LW.mod.expanded, mixPlaying: mix() }; __LW.pause(); await w(300);
    await P.fresh(); await __LW.settle(); await w(300); out.c2.after = mix(); out.c2.want = 0.04; __LW.layout.modulation.collapse();
    P.open(demo); await __LW.settle(); __LW.layout.modulation.expand(); await w(300); __LW.layout.modulation.collapse();
    __LW.play(); await w(1200); out.c = { held: M.isModulated('material.stage'), folded: !__LW.mod.expanded, mixPlaying: mix() }; __LW.pause(); await w(300);
    await P.fresh(); await __LW.settle(); await w(300); out.c.after = mix(); out.c.want = 0.04;
    for (const k of ['a', 'b', 'b2', 'c2', 'c']) out[k].ok = out[k].after === out[k].want;
    __LW.pause(); out.errs = (window.__e || []).slice(0, 5); return out;`);
} catch (e) { R.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
const me = path.basename(new URL(import.meta.url).pathname, '.mjs');
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), `${me}.${process.argv[2] || 'run'}.json`), JSON.stringify(R, null, 1));
