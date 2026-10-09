// R10, THE FORMATS, WHERE THE STORE IS LIVE (0.5.0 C6; the node half is tests/project-formats.test.mjs).  One fresh Firefox profile:
//   1 · AN INVALID COLLECTION IS READ-ONLY IN THE PAGE: a damaged lambdawaves.q0.projects survives a reload, the boot seeds nothing
//       over it, the facade and FOLDERS' own SAVE AS refuse with the reason, the line says so, and no .refused- copy is made;
//   2 · THE DOOR: FOLDERS' intake (a drop, OPEN FILE, IMPORT) refuses a project file over 8 MiB before reading it — a
//       .lambdawaves.json and a 10 MiB λWAVES .mir the kit's own 24 MiB check would take — and another app's .mir by name; a small
//       .lambdawaves.json comes in and opens;
//   3 · R-I3, THE PAGES TRAVEL WITH THE PROJECT: a save's FOLDERS entry, its .mir export, its .json export and a .mir brought back in
//       all carry the notebook (page 0), and the .mir re-opened puts it back on the live notebook;
//   4 · A 1.4 NOTEBOOK IS PAGE 0: a browser holding only the 0.4 notebook keys boots onto them, a save carries them into the ONE
//       part, and the kit's pageFromNotebook reads that as the project's first page.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { go } from '../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
  window.__keys = () => { const o = []; for (let i = 0; i < localStorage.length; i++) o.push(localStorage.key(i)); return o.sort(); };
  /* EXPORT hands a file to the person (folders/save-blob.js): an <a download> click.  Here the click is caught and the blob kept */
  window.__blobs = []; const cu = URL.createObjectURL.bind(URL); URL.createObjectURL = (b) => { __blobs.push(b); return cu(b); };
  HTMLAnchorElement.prototype.click = function () {};
  return 1;`;
const g = await open(LAB, { width: 1500, height: 1000, script: 120000 });
let failed = false, n = 0;
const pass = (line) => { n++; console.log('PASS ' + line); };
const ready = async () => { assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1); await g.armErrors(); await g.ev(HELP); };
try {
  await ready();
  /* ── 1 · AN INVALID COLLECTION IS READ-ONLY IN THE PAGE ── */
  const RAW = '{"items":{"kept":{"path":"kept","data":{},"notebook":{},"saved":4}},"recent":["kept"]}';
  await g.ev(`localStorage.setItem('lambdawaves.q0.projects', ${JSON.stringify(RAW)}); localStorage.removeItem('lambdawaves.q0.projects.seeded'); return 1;`);
  await go(g.s, LAB); await ready();
  const ro = await g.ev(`const P = __LW.projects, F = P.folders, boot = { status: P.status, entries: F.files.entries().length, list: P.list().length };
    const saved = P.save('must-not-land'), statusAfter = P.status;
    const sa = await F.saveAs({ name: 'nor-this', folder: '' });
    let imported; try { P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'x/y', data: {}, notebook: {} })); imported = 'went in'; } catch (e) { imported = e.message; }
    await __w(200);
    return { boot, saved, statusAfter, saveAs: { ok: sa.ok, why: sa.why || '' }, imported, stored: localStorage.getItem('lambdawaves.q0.projects'), keys: __keys(), errs: __e.slice() };`);
  assert.match(ro.boot.status, /^projects unavailable — invalid saved project metadata\. Stored data was left untouched\.$/, JSON.stringify(ro.boot));
  assert.deepEqual([ro.boot.entries, ro.boot.list, ro.saved], [0, 0, false]);
  assert.match(ro.statusAfter, /left untouched/);
  assert.equal(ro.saveAs.ok, false); assert.match(ro.saveAs.why, /could not be read .*left untouched/);
  assert.match(ro.imported, /collection is invalid/);
  assert.equal(ro.stored, RAW, 'the damaged collection was rewritten');
  assert.deepEqual(ro.keys.filter((k) => k.startsWith('lambdawaves.q0.projects.refused-')), [], 'a .refused- copy was made');
  assert.equal(ro.keys.includes('lambdawaves.q0.projects.seeded'), false, 'the boot seeded over a damaged collection');
  assert.deepEqual(ro.errs, []);
  pass('an invalid collection is read-only in the page: through a reload the boot seeds nothing, FOLDERS shows an empty library, P.save, FOLDERS\' SAVE AS and P.importText refuse with the reason ("' + ro.boot.status + '"), the stored text is byte-identical and no .refused- copy is made');
  await g.ev(`localStorage.removeItem('lambdawaves.q0.projects'); return 1;`);
  await go(g.s, LAB); await ready();

  /* ── 2 · THE DOOR: 8 MiB before reading; another app by name; a small file comes in ── */
  const door = await g.ev(`const P = __LW.projects, F = P.folders, MiB = 1 << 20, before = localStorage.getItem('lambdawaves.q0.projects');
    const env = (app, data) => JSON.stringify({ mir: 1, kind: 'project', kit: '1.5.0', app, name: 'P', made: new Date().toISOString(), data });
    const out = {};
    out.json = await F.intake.ingest(new File(['{"lambdawaves":"project","path":"big","data":{"b":"' + 'x'.repeat(8 * MiB) + '"}}'], 'big.lambdawaves.json', { type: 'application/json' }), { source: 'drop' });
    out.jsonStatus = P.status;
    out.mir = await F.intake.ingest(new File([env('lambdawaves', { parts: { lambdawaves: { data: { b: 'y'.repeat(10 * MiB) }, notebook: {} } } })], 'big.mir'), { source: 'picker' });
    out.mirStatus = P.status;
    out.theirs = await F.intake.ingest(new File([env('basins', { parts: { fractal: { z: 1 } } })], 'theirs.mir'), { source: 'picker' });
    out.same = localStorage.getItem('lambdawaves.q0.projects') === before;
    const data = JSON.parse(JSON.stringify(__LW.serialize()));
    out.small = await F.intake.ingest(new File([JSON.stringify({ lambdawaves: 'project', version: 1, path: 'door/small', data, notebook: { title: 'small', subtitle: '', text: 'through the door' } })], 'small.lambdawaves.json', { type: 'application/json' }), { source: 'drop' });
    await __w(400);
    return { json: { ok: out.json.ok, why: out.json.why }, jsonStatus: out.jsonStatus, mir: { ok: out.mir.ok, why: out.mir.why }, mirStatus: out.mirStatus,
      theirs: { ok: out.theirs.ok, why: (out.theirs.errors && out.theirs.errors[0] && out.theirs.errors[0].why) || '' }, same: out.same,
      small: { ok: !!(out.small && out.small.ok) }, current: P.current, text: __LW.notebook.text, errs: __e.slice() };`);
  assert.deepEqual(door.json, { ok: false, why: 'project file exceeds 8 MiB' }); assert.equal(door.jsonStatus, 'import failed: project file exceeds 8 MiB');
  assert.deepEqual(door.mir, { ok: false, why: 'project file exceeds 8 MiB' }, 'a 10 MiB .mir got past the door');
  assert.equal(door.theirs.ok, false); assert.match(door.theirs.why, /this project is basins's; this is lambdawaves/);
  assert.equal(door.same, true, 'a refused file moved the store');
  assert.deepEqual([door.small.ok, door.current, door.text], [true, 'door/small', 'through the door']);
  assert.deepEqual(door.errs, []);
  pass('FOLDERS\' door: an 8 MiB + .lambdawaves.json and a 10 MiB λWAVES .mir (inside the kit\'s 24 MiB) are refused before they are read ("' + door.jsonStatus + '"), a BASINS .mir is refused by name, none of them moves the store; a small .lambdawaves.json comes in and opens as door/small with its notebook');

  /* ── 3 · R-I3: THE PAGES TRAVEL WITH THE PROJECT ── */
  const rI3 = await g.ev(`const P = __LW.projects, F = P.folders, N = __LW.notebook;
    N.text = '# travels\\n\\nwith the project'; N.title = 'R-I3'; N.subtitle = 'page 0'; await __w(350);
    const saved = P.save('pages/travel'), e = F.files.entries().find((x) => x.folder === 'pages' && x.name === 'travel');
    await __w(100);                                                  /* FOLDERS is told (its current, its selection) a few microtasks on */
    const entryNb = e && e.payload.parts.lambdawaves.notebook;
    const json = JSON.parse(P.exportText('pages/travel'));
    __blobs.length = 0; const blob = await F.exportProject('mir'); const mir = JSON.parse(await blob.text());
    N.text = 'something else'; N.title = 'other'; N.subtitle = ''; await __w(350);
    P.markClean(); F.gallery.go('pages');                           /* clean, so the kit's open does not stop to ask; into the folder it came from */
    const back = await F.intake.ingest(new File([JSON.stringify(mir)], 'travel.mir'), { source: 'picker' }); await __w(800);
    return { saved, entryNb, jsonNb: json.notebook, mirName: mir.name, mirApp: mir.app, mirNb: mir.data.parts.lambdawaves.notebook, back: !!(back && back.ok),
      live: { text: N.text, title: N.title, subtitle: N.subtitle }, current: P.current, errs: __e.slice() };`);
  const NB = { title: 'R-I3', subtitle: 'page 0', text: '# travels\n\nwith the project' };
  assert.equal(rI3.saved, true);
  assert.deepEqual(rI3.entryNb, NB, 'the FOLDERS entry lost the notebook'); assert.deepEqual(rI3.jsonNb, NB, 'the .json export lost it');
  assert.equal(rI3.mirApp, 'lambdawaves'); assert.equal(rI3.mirName, 'travel', 'the .mir is not the open project'); assert.deepEqual(rI3.mirNb, NB, 'the .mir export lost it');
  assert.equal(rI3.back, true); assert.deepEqual(rI3.live, NB, 'the .mir brought back did not put the notebook back');
  assert.equal(rI3.current, 'pages/travel 2', 'the .mir brought back is a new entry beside the first (the kit never overwrites on an import)');
  assert.deepEqual(rI3.errs, []);
  pass('R-I3, the pages travel with the project: the notebook (page 0: title, subtitle, text) rides in the FOLDERS entry, the .json export and the .mir export; the .mir brought back through the door opens as "pages/travel 2" and puts it back on the live notebook');

  /* ── 4 · A 1.4 NOTEBOOK IS PAGE 0 ── */
  const NB14 = { text: '## a 1.4 notebook\n\nwritten before FOLDERS', title: 'OLD NOTES', subtitle: 'from 0.4' };
  await g.ev(`localStorage.setItem('lambdawaves.q0.notebook', ${JSON.stringify(NB14.text)}); localStorage.setItem('lambdawaves.q0.notebook.title', ${JSON.stringify(NB14.title)});
    localStorage.setItem('lambdawaves.q0.notebook.subtitle', ${JSON.stringify(NB14.subtitle)}); localStorage.removeItem('lambdawaves.q0.session'); return 1;`);
  await go(g.s, LAB); await ready();
  const p0 = await g.ev(`const P = __LW.projects, N = __LW.notebook, live = { text: N.text, title: N.title, subtitle: N.subtitle };
    const saved = P.save('legacy/notes'), it = JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items['legacy/notes'];
    const e = P.folders.files.entries().find((x) => x.folder === 'legacy' && x.name === 'notes');
    const { pageFromNotebook } = await import('./mir/shell/pages.js');
    return { live, saved, stored: it && it.notebook, part: e && e.payload.parts.lambdawaves.notebook, page: pageFromNotebook(e.payload.parts.lambdawaves.notebook), errs: __e.slice() };`);
  assert.deepEqual(p0.live, NB14, 'the boot did not land on the 1.4 notebook');
  assert.equal(p0.saved, true); assert.deepEqual(p0.stored, NB14); assert.deepEqual(p0.part, NB14);
  assert.deepEqual(p0.page, { title: 'OLD NOTES', md: '*from 0.4*\n\n## a 1.4 notebook\n\nwritten before FOLDERS' });
  assert.deepEqual(p0.errs, []);
  pass('a 1.4 notebook is page 0: a browser holding only the 0.4 notebook keys boots onto them, a save carries them into the ONE part (the stored item and the FOLDERS entry), and the kit\'s pageFromNotebook reads them as the first page ("OLD NOTES", the subtitle in italics)');
} catch (e) {
  failed = true; console.error(e);
} finally {
  try { await Promise.race([g.close(), new Promise((_, reject) => setTimeout(() => reject(new Error('driver cleanup exceeded 10 seconds')), 10000))]); }
  catch (error) { failed = true; console.error('INFRASTRUCTURE:', error.message); }
  console.log((failed ? 'RED' : 'GREEN') + ' project-formats.browser-test — ' + n + ' of 4');
  process.exit(failed ? 1 : 0);
}
