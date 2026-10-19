/* KEPT AS THE RECORD (iteration 009 DEMOS): the shipped WAVE DANCER PROTOTYPE file → open (the DEMOS press) → projects.save + exportText → the same bytes
   (the envelope's stamps put back and quality / camera dropped, as the re-save did) */
import { open } from '../../tools/gate/gatekit.mjs';
import { readFileSync } from 'node:fs';
const file = readFileSync(new URL('../../lab/demos/wave-dancer.lambdawaves.json', import.meta.url), 'utf8'), F = JSON.parse(file);
const g = await open(`https://127.0.0.1:9321/lab/?sw=0&warn=0&starter=home`, { width: 1500, height: 1100, script: 30000 });
let code = 1;
try {
  await g.waitFor('window.__LW&&__LW.ready', 150, 100);
  const r = await g.ev(`const w=n=>new Promise(r=>setTimeout(r,n));window.confirm=()=>true;
    await __LW.projects.demo('wave-dancer'); await w(1500);
    const P = __LW.layout.projects, status = P.status, knee = __LW.mat.knee, ok = P.save('RT/again');
    return { status, knee, ok, text: P.exportText('RT/again'), errs: __e.slice() }`);
  if (r.E) throw new Error(r.E);
  const o = JSON.parse(r.text);
  delete o.data.presentation.quality; delete o.data.presentation.camera;
  const at = o.data.presentation.layout.at; o.data.presentation.layout.at = F.data.presentation.layout.at;   // the layout capture's clock stamp
  console.log('layout.at (a capture clock stamp) ' + at + ' put back to the file\'s ' + F.data.presentation.layout.at);
  Object.assign(o, { path: F.path, folder: F.folder, name: F.name, saved: F.saved, opened: F.opened });
  const again = JSON.stringify(o, null, 1);
  console.log(JSON.stringify({ status: r.status, knee: r.knee, ok: r.ok, errs: r.errs, bytes: [file.length, again.length], same: again === file }));
  if (again !== file) { for (let i = 0; i < file.length; i++) if (file[i] !== again[i]) { console.log('first difference at', i, JSON.stringify(file.slice(i - 80, i + 80)), '\n vs', JSON.stringify(again.slice(i - 80, i + 80))); break; } }
  else code = 0;
} finally { await g.close(); }
process.exit(code);
