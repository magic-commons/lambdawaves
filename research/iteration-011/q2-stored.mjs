// research/iteration-011/q2-stored.mjs — ROW Q2 · THE STORED CHOICE WINS.  One fresh Firefox profile, desktop size:
//   1 a first run: every inner fold closed (INFORMATIONAL's ANNOUNCE · CURSOR · MARKS was open on a desktop before Q2)
//   2 the reader opens two (INFORMATIONAL's and CAMERA's) and edits: the WORKSPACE record names them (`folds`)
//   3 a reload that RESUMES the session (the device's memory): both stay OPEN
//   4 a project whose record says nothing (`?starter=wave-dancer`, bytes untouched): the folds close — absent is the default
//   5 a record that names a fold (applyLayout of the step-2 record): it opens
//   LW_PORT=9411 GD_PORT=5411 node research/iteration-011/q2-stored.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { open, judge, done } from '../../tools/gate/gatekit.mjs';
import { go } from '../../tools/gate/drv.mjs';
const LAB = `https://127.0.0.1:${process.env.LW_PORT || 9411}/lab/`;
const DEMO = new URL('../../lab/demos/wave-dancer.lambdawaves.json', import.meta.url), sha = () => createHash('sha256').update(readFileSync(DEMO)).digest('hex');
const demo0 = sha();
const READ = `await __LW.settle(); await new Promise((r) => setTimeout(r, 800));
  const f = (id) => Object.fromEntries([...document.querySelectorAll('.dev[data-id="' + id + '"] .lw-fold[data-fold]')].map((b) => [b.dataset.fold, b.getAttribute('aria-expanded') === 'true']));
  const rec = __LW.layout.captureLayout().cards.filter((c) => c.folds).map((c) => ({ id: c.id, folds: c.folds }));
  return { informational: f('informational'), camera: f('camera'), rec };`;
const g = await open(LAB, { width: 1440, height: 900, script: 180000 });
const nav = async (u) => { for (let k = 0; k < 6; k++) { await new Promise((r) => setTimeout(r, 1200)); await go(g.s, 'about:blank'); await new Promise((r) => setTimeout(r, 400));
  await go(g.s, u); await g.waitFor('document.readyState !== "loading"', 100, 50);
  if (await g.ev(`return await Promise.race([new Promise((r) => requestAnimationFrame(() => r(1))), new Promise((r) => setTimeout(() => r(0), 2000))]);`)) return; } throw new Error('unpainted'); };
const log = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 600, 100);
  const s1 = log.firstRun = await g.ev(READ);
  judge('1 A FIRST RUN: INFORMATIONAL\'s and CAMERA\'s inner folds arrive closed, and the record names none', Object.values(s1.informational).concat(Object.values(s1.camera)).every((v) => v === false) && Object.keys(s1.informational).length === 1 && s1.rec.length === 0, s1);
  const s2 = log.opened = await g.ev(`for (const id of ['informational', 'camera']) document.querySelector('.dev[data-id="' + id + '"] .lw-fold[data-fold]').click();
    __LW.setStage(0.3); __LW.history.flush(); await new Promise((r) => setTimeout(r, 900)); __LW.session.flush(); window.__L2 = __LW.layout.captureLayout(); ${READ}`);
  judge('2 THE READER OPENS TWO: the WORKSPACE record names them (`folds`)', s2.rec.length === 2 && s2.rec.every((c) => c.folds.length === 1), s2.rec);
  const L2 = await g.ev(`return window.__L2;`);
  await nav(LAB + '?starter=resume'); await g.waitFor('window.__LW && __LW.ready', 600, 100);
  const s3 = log.resumed = await g.ev(READ);
  judge('3 A RELOAD THAT RESUMES THE SESSION: both folds stay OPEN (a stored choice wins over the first-run minimized default)', Object.values(s3.informational)[0] === true && Object.values(s3.camera)[0] === true, s3);
  writeFileSync(new URL('./q2-shots/stored-resumed-desktop.png', import.meta.url), Buffer.from(await g.snap(), 'base64'));
  await nav(LAB + '?starter=wave-dancer'); await g.waitFor('window.__LW && __LW.ready', 600, 100);
  const s4 = log.demo = await g.ev(READ);
  judge('4 THE DEMO (a record with no `folds`): every inner fold closes — absent is the default; the demo\'s bytes unchanged', Object.values(s4.informational).concat(Object.values(s4.camera)).every((v) => v === false) && sha() === demo0, { s4, sha: sha() });
  const s5 = log.applied = await g.ev(`__LW.layout.applyLayout(${JSON.stringify(L2)}); ${READ}`);
  judge('5 A RECORD THAT NAMES THEM (applyLayout of step 2\'s record): both open', Object.values(s5.informational)[0] === true && Object.values(s5.camera)[0] === true, s5);
} finally { await g.close(); }
writeFileSync(new URL('./q2-shots/stored.json', import.meta.url), JSON.stringify(log, null, 1));
process.exit(done('q2-stored') ? 1 : 0);
