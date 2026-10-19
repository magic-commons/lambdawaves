/* KEPT AS THE RECORD (iteration 009 DEMOS; run once, from the repo root, gate server on 9321): re-save WAVE DANCER as WAVE DANCER PROTOTYPE at KNEE 3 by the app's own road —
   ?starter=home, the DEMOS press, the notebook's title, a double-click on the KNEE dial (the kit knob's reset to its
   default, KNEE_DEFAULT = 3: the hand's onInput), projects.save + exportText; quality and camera dropped (W129-1). */
import { open } from '../../tools/gate/gatekit.mjs';
import { writeFileSync } from 'node:fs';
const NAME = 'WAVE DANCER PROTOTYPE', PATH = 'DEMOS/' + NAME;
const g = await open(`https://127.0.0.1:9321/lab/?sw=0&warn=0&starter=home`, { width: 1500, height: 1100, script: 30000 });
try {
  await g.waitFor('window.__LW&&__LW.ready', 150, 100);
  const r = await g.ev(`const w=n=>new Promise(r=>setTimeout(r,n));window.confirm=()=>true;
    await __LW.projects.demo('wave-dancer'); await w(1500);
    const before = __LW.serialize().presentation.mat.knee;
    __LW.layout.notebook.title = ${JSON.stringify(NAME)};
    const k = [...document.querySelectorAll('.k')].find((n) => (n.querySelector('.k-lbl')||{}).textContent === 'KNEE');
    k.querySelector('.k-dial').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    await w(400);
    const after = __LW.serialize().presentation.mat.knee, P = __LW.layout.projects;
    const ok = P.save(${JSON.stringify(PATH)});
    return { before, after, ok, current: P.current, title: __LW.layout.notebook.title, text: P.exportText(${JSON.stringify(PATH)}), errs: __e.slice() }`);
  if (r.E) throw new Error(r.E);
  const { text, ...rest } = r; console.log(JSON.stringify(rest));
  const o = JSON.parse(text);
  delete o.data.presentation.quality; delete o.data.presentation.camera;
  o.opened = o.saved;
  const out = JSON.stringify(o, null, 1);
  writeFileSync(new URL('../../lab/demos/wave-dancer.lambdawaves.json', import.meta.url), out);
  console.log('wrote', out.length, 'chars; path', o.path, 'name', o.name, 'saved', o.saved, 'knee', o.data.presentation.mat.knee, 'title', o.notebook.title);
} finally { await g.close(); }
