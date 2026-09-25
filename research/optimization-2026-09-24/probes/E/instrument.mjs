// Instrument a COPY of lab/ (probes/E/lab-inst/) with boot-section timing marks. lab/ itself is never touched.
//   node research/optimization-2026-09-24/probes/E/instrument.mjs
// Each mark is inserted BEFORE (or AFTER, with '>') the first line containing its anchor string.
import fs from 'node:fs';
const DIR = 'research/optimization-2026-09-24/probes/E/lab-inst/';
function patch(file, marks, head) {
  let src = fs.readFileSync(DIR + file, 'utf8');
  const lines = src.split('\n');
  for (const [name, anchor, after] of marks) {
    const i = lines.findIndex((l) => l.includes(anchor));
    if (i < 0) throw new Error(file + ': anchor not found: ' + anchor);
    const stmt = `  window.__LWBOOT && window.__LWBOOT.m(${JSON.stringify(name)});`;
    if (after) lines.splice(i + 1, 0, stmt); else lines.splice(i, 0, stmt);
  }
  src = lines.join('\n');
  if (head) src = src.replace(head[0], head[0] + head[1]);
  fs.writeFileSync(DIR + file, src);
}
const BOOTHEAD = `\n  window.__LWBOOT = { t0: performance.now(), marks: [], m(n) { this.marks.push([n, +(performance.now() - this.t0).toFixed(2)]); } };`;
patch('rack.js', [
  ['  orbit', "const orbit = createOrbit(wOrb.body"],
  ['  kepler', "const kepler = createKepler(dom.kepler);"],
  ['  vortex', "const vortex = createVortex(wVor.body"],
  ['  particles', "const particles = createParticles(dom.particles, {});"],
  ['  dynamics', "const dynamics = createDynamics(wDyn.body, {"],
  ['  slice', "const slice = createSliceView(wSlice.body, {"],
  ['  qcd', "const qcd = createQCD(wQCD.body"],
  ['  moPanel (legacy)', "moPanel = createMOPanel(wMol.body"],
  ['  helium', "const helium = createHelium(wHe.body"],
  ['  h2', "const h2 = createH2(wH2.body"],
  ['  chem', "chem = createChem(wChem.body"],
  ['  register', "register = createRegister(wOrbs.body"],
  ['  swClient', "const swClient = {"],
  ['  bow fns', "let bow = null, bowPrevView = null;"],
  ['  gas', "const gas = createGas(HAMILTONIANS.well.radius);"],
  ['  layout obj', "const layout = {"],
  ['  wTr', "const wTr = device({ id: 'transport'"],
  ['AS: setTheme', "if (__LW_hooks.setTheme) __LW_hooks.setTheme(s.theme || 'light');"],
  ['AS: setFrost', "setFrost(s.frost === true ? 'always'"],
  ['AS: disc/card/blur/accent/auto/gov/perf/camera', "setDisconnected(s.disc !== false, { quiet: true });"],
  ['AS: MOD.hz + modView.sync()', "MOD.hz = s.modCadence === 120 ? 120 : 60; if (modView) modView.sync();"],
  ['AS: modArm..axisInk', "if (s.modArm === false) setModArm(false, { quiet: true });"],
  ['AS: closed + camMode + p3', "if (Array.isArray(s.closed)) for (const d of document.querySelectorAll('.dev'))"],
  ['AS: gamut', "const wantP3 = s.gamut ? s.gamut === 'p3' : appleDevice();"],
  ['AS: end', "settingsLoaded = true;"],
  ['field created', "if (field.ok) gamutCss = (rgb) =>"],
  ['workers made', "const chemW = makeWorker('chem', 300000);", true],
  ['windows: WAVE/PALETTE/CAMERA/CLIP/SETTINGS start', "const wObs = device({ id: 'observer'"],
  ['windows: STATE start', "const wState = device({ id: 'state'"],
  ['windows: SPECTRUM start', "const wSpec = device({ id: 'spectrum'"],
  ['windows: SHADOW start', "const wSh = device({ id: 'shadow'"],
  ['windows: ORBIT..QCD start', "const wOrb = device({ id: 'orbit'"],
  ['windows: legacy MOLECULE start', "const wMol = device({ id: 'molecule'"],
  ['windows: legacy MOLECULE end', "pulsePanel = createPulse(wMol.body", true],
  ['windows: HELIUM/H2/CHEM/REGISTER start', "const wHe = device({ id: 'helium'"],
  ['windows: CALCULUS/METERS/LADDER start', "const wCalc = device({ id: 'calculus'"],
  ['modulation: start', "const sameCycle = (a, b, L) =>"],
  ['modulation: createModulation start', "modView = createModulation(document.getElementById('floats')"],
  ['modulation: end', "modView.restore(readSettings().modwin);", true],
  ['windows: ATOMS..RADIATION start', "const wAtoms = device({ id: 'atoms'"],
  ['transport start', "const transport = (() => {"],
  ['badges/sw/bow/layout start', "const badges = (() => {"],
  ['menubar start', "const title = document.getElementById('title');"],
  ['keymap start', "const km = el('div', '', document.getElementById('lab')); km.id = 'keymap';"],
  ['LEAN+KIND passes start', "const LEAN_KEY = 'lw.lean.v1';"],
  ['LEAN+KIND passes end', "document.addEventListener('devclose', () => saveSettings());", true],
  ['notebook start', "const nb = document.getElementById('notebook');"],
  ['drags start', "let drag = null;"],
  ['phone start', "const phone = { on: false"],
  ['keys/serialize/history start', "const keyState = { axis: 'z', which: 'both' };"],
  ['history window start', "const wHist = device({ id: 'history'"],
  ['LW object start', "const LW = {"],
  ['go: loadPreset', "loadPreset(q.get('preset') && PRESET_BY_ID.has"],
  ['go: moveToRack+picker', "layout.moveToRack('spectrum', 'L'); spectrum.openPicker(true);"],
  ['go: applySettings', "  applySettings();"],
  ['go: openLink', "const linkAtBoot = openLink();"],
  ['go: reworkNative start', "reworkNative({ ui, mat, repaint:"],
  ['go: reworkNative end', "reworkNative({ ui, mat, repaint:", true],
  ['go: ready', "LW.ready = true;"],
], ['export async function boot(dom) {', BOOTHEAD]);
patch('native-ui.js', [
  ['rework: settings pages start', "const oldGroups=[...settings.children];"],
  ['rework: transport panel start', "const tr=document.getElementById('transport');"],
  ['rework: consolidateWindowHelp start', "  consolidateWindowHelp();"],
  ['rework: installControlHelp start', "  installControlHelp();"],
  ['rework: end', "  installControlHelp();", true],
]);
// multi-line anchors above were written with \n; findIndex works per line, so fix those two:
console.log('instrumented');
