/* h041-shots.mjs — iteration 041 chain H's pictures and its one light check per row (a diagnostic, not a gate).
 *   LW_PORT=9751 GD_PORT=5751 [W=1300 H=1500] node tools/h041-shots.mjs <row> [out-dir]
 * Rows: h1 (the stroke's two homes) · h2 (a hand's edit ends the transition) · h3 (no state words under OSCILLATOR and BOX) ·
 * h4 (the rooms, the rule, the grids, an older project that names the three windows) · h5 (ATOMS as the preset picker).
 * JPEGs into <out-dir> (default .tmp/H-shots) as 041-<ROW>-<what>.jpg; the readings are printed as JSON. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const row = process.argv[2] || 'h4', DIR = process.argv[3] || '.tmp/H-shots';
mkdirSync(DIR, { recursive: true });
const W = +(process.env.W || 1300), H = +(process.env.H || 1500);
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9751}/lab/?preset=1s%2B2pz&warn=0&menu=0&sw=0${process.env.THEME ? '&theme=' + process.env.THEME : ''}`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
async function shot(name) {
  const png = `${DIR}/.shot.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
if im.width > 1300: im = im.resize((1300, round(im.height * 1300 / im.width)))
im.save(sys.argv[2], quality=72)`, png, `${DIR}/041-${row.toUpperCase()}-${name}.jpg`]);
}
const wait = `await new Promise((r) => setTimeout(r, 1200));`;
const SP = `document.querySelector('.dev[data-id="spectrum"]')`;
const pre = `const d = ${SP}; if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); const f = d.querySelector('.sp-ham .lw-fold'); if (f.getAttribute('aria-expanded') !== 'true') f.click();
  document.querySelector('.dev[data-id="informational"] .dev-close').click(); __LW.layout.popOut('spectrum', { x: 20, y: 10, w: 300 }); __LW.pause(); ${wait}`;
const state = `({ H: __LW.hamiltonian, Z: __LW.atomZ, sys: ${SP}.querySelector('.sp-ham-sys .mir-step-text').textContent,
  rows: [...${SP}.querySelectorAll('.picker .pk-n')].map((r) => r.querySelector('.pk-nl').textContent + ':' + r.querySelectorAll('.pk-c').length + (r.classList.contains('folded') ? 'f' : '')).join(' '),
  on: [...${SP}.querySelectorAll('.picker .pk-c.on')].map((b) => b.textContent).join(' '),
  rooms: [...${SP}.querySelectorAll('.sp-room')].map((r) => r.dataset.room + (r.hidden ? '-' : '+')).join(' '),
  wins: [...document.querySelectorAll('.dev')].filter((x) => !x.hidden && !x.classList.contains('closed')).map((x) => x.dataset.id).join(' '),
  retired: ['central', 'separable', 'lattice'].map((id) => !!document.querySelector('.dev[data-id="' + id + '"]')).join(), status: ${SP}.querySelector('.dev-stat') ? ${SP}.querySelector('.dev-stat').textContent : '' })`;
const sys = (name) => `${SP}.querySelector('.sp-ham-sys .mir-step-name').click(); await new Promise((r) => setTimeout(r, 300));
  const list = [...document.querySelectorAll('.mir-pick > *')].map((x) => (x.classList.contains('mb-sep') ? '—' : x.textContent)).join(' | ');
  [...document.querySelectorAll('.mir-pick-i')].find((x) => x.textContent.trim() === ${JSON.stringify(name)}).click(); ${wait} return Object.assign(${state}, { list });`;
const picker = (v) => `__LW.spectrum.openPicker(${v}); await new Promise((r) => setTimeout(r, 300)); return 1;`;
const SCENES = {
  h1: [['seats', `const q = (id) => [...document.querySelectorAll('.dev[data-id="' + id + '"] .sp-stroke')].map((b) => b.dataset.state).join(' '), out = { fresh: [q('spectrum'), q('chem')] };
    document.querySelector('.dev[data-id="spectrum"] .sp-stroke').click(); out.spectrumPressed = [q('spectrum'), q('chem')];
    document.querySelector('.dev[data-id="chem"] .sp-stroke').click(); out.molPressed = [q('spectrum'), q('chem')]; out.stored = localStorage.getItem('lambdawaves.q0.stroke'); return out;`]],
  h2: [['transition', `${pre} __LW.spectrum.openPicker(true); const lab = () => __LW.reg.populated().map((a) => ${SP}.querySelector('.pk-c[data-a="' + a + '"]').textContent).join(' '), out = {};
    __LW.loadPreset('1s'); __LW.ab.storeA(); __LW.api.paintModes([2], true); __LW.api.paintModes([0], false); __LW.ab.storeB(); out.B = lab(); __LW.ab.set(true); ${wait} out.playing = __LW.ab.on;
    [...${SP}.querySelectorAll('.pk-c')].find((b) => b.textContent === '3s₀').click(); ${wait} out.afterEdit = { on: __LW.ab.on, labels: lab() }; return out;`]],
  h3: [['hydrogen', `${wait} return __LW.hamiltonian;`], ['oscillator', `__LW.setHamiltonian('qho'); ${wait} return __LW.hamiltonian;`], ['box', `__LW.setHamiltonian('well'); ${wait} return __LW.hamiltonian;`]],
  h4: [['hydrogen', `${pre} __LW.spectrum.openPicker(true); ${wait} return ${state};`], ['oscillator', sys('OSCILLATOR')], ['box', sys('BOX')], ['atom', sys('ATOM')], ['-', picker(false)],
    ['central', sys('CENTRAL')], ['quarkonium', sys('CENTRAL › QUARKONIUM')], ['separable', sys('SEPARABLE')], ['-', picker(true)], ['separable-grid', `return ${state};`], ['-', picker(false)], ['lattice', sys('LATTICE')],
    ['older-project', `const o = JSON.parse(JSON.stringify(__LW.serialize())), P = o.presentation;
      P.hamiltonian = { ...(P.hamiltonian || {}), id: 'central' }; P.instruments = { ...(P.instruments || {}), central: { preset: 'yukawa', params: { lam: 10 } }, separable: { form: 'aniso', wx: 1, wy: 1.5, wz: 2.25, L: 12 }, lattice: { preset: 'ssh', N: 24 } };
      P.layout.cards = P.layout.cards.filter((c) => c.id !== 'spectrum'); P.layout.cards.unshift({ id: 'central', side: 'L', closed: false }, { id: 'lattice', side: 'R', closed: false }, { id: 'separable', side: 'R', closed: true });
      const ok = await __LW.restore(o); ${wait} ${wait} return Object.assign(${state}, { ok, central: document.querySelector('.sp-room[data-room="central"] .mir-step-text').textContent, lattice: document.querySelector('.sp-room[data-room="lattice"] .mir-step-text').textContent });`]],
  h5: [['-', `${pre} __LW.spectrum.openPicker(true); __LW.layout.reopen('atoms'); const a = document.querySelector('.dev[data-id="atoms"]'); if (a.classList.contains('folded')) a.querySelector('.dev-fold').click(); ${wait} return ${state};`],
    ...['Fe', 'Na', 'Au', 'H'].map((el) => [el, `[...document.querySelectorAll('.dev[data-id="atoms"] .pk-c')].find((b) => b.textContent === ${JSON.stringify(el)}).click(); ${wait} ${wait}
      return Object.assign(${state}, { selected: __LW.spectrum.selected >= 0 ? ${SP}.querySelector('.pk-c[data-a="' + __LW.spectrum.selected + '"]').textContent : null, lit: [...document.querySelectorAll('.dev[data-id="atoms"] .pk-c.on')].map((b) => b.textContent).join() });`]),
    ['valence', `[...document.querySelectorAll('.dev[data-id="atoms"] .trig')].find((b) => /LOAD/.test(b.textContent)).click(); ${wait} return ${state};`],
    ['closed', `document.querySelector('.dev[data-id="atoms"] .dev-close').click(); ${wait} return ${state};`]],
};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  for (const [name, js] of SCENES[row]) { console.log(name, JSON.stringify(await g.ev(js))); if (name !== '-') await shot(name); }
  console.log('errors', JSON.stringify((await g.errors()).errs).slice(0, 2000));
} finally { await g.close(); }
