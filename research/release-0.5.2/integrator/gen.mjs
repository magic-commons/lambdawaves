// gen.mjs — fills BRIEF-R2c.tpl.md / BRIEF-R2d.tpl.md from the live tree: {{tok}} → a line number, a grep hit, a classes row, a count.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const W = new URL('../../../', import.meta.url).pathname;
const T = new URL('./', import.meta.url).pathname;
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: W, encoding: 'utf8', maxBuffer: 1 << 26 });
const rack = fs.readFileSync(W + 'lab/rack.js', 'utf8').split('\n');
const V = {};
V.tip = sh('git', ['rev-parse', '--short', 'HEAD']).trim();
V.rackLines = String(rack.length - (rack[rack.length - 1] === '' ? 1 : 0));
const labFiles = sh('bash', ['-c', 'ls lab/*.js lab/shell/*.js lab/windows/*.js']).trim().split('\n');
const labLines = labFiles.reduce((n, f) => n + fs.readFileSync(W + f, 'utf8').split('\n').length - 1, 0);
V.labLines = labLines.toLocaleString('en-US'); V.labLeft = String(27943 - labLines); V.labFiles = String(labFiles.length);
/* line anchors: the FIRST line matching, searched from `after` (a token name) when given */
const A = [
  ['win', /^ {2}\/\* ── windows ──/], ['camlaw', /^ {2}const \{ camera, camTravel, camLevel/], ['hostfill', /^ {2}app\.host\.camera = camera;/],
  ['wObs', /^ {2}const wObs = device\(/], ['wClip', /^ {2}const wClip = device\(/], ['capInit', /^ {2}app\.state\.capApi = null;/],
  ['camKnobsInit', /^ {2}app\.state\.camKnobs = \{\};/], ['exp3dInit', /^ {2}app\.state\.exporter3d = null;/],
  ['blockOpen', /^ {2}\{$/, 'wObs'], ['gSpace', /^ {4}const gSpace = group\(wObs\.body, 'SPACE'\)/], ['gDraw', /^ {4}const gDraw = group\(wObs\.body, 'DRAW'\)/],
  ['theme', /^ {4}\/\* ── THEME and SURFACE/], ['uiSet', /^ {4}ui\.set = device\(\{ id: 'settings'/], ['gi', /^ {4}const gi = group\(ui\.set\.body, 'INTERFACE'\)/],
  ['gt', /^ {4}const gt = group\(ui\.set\.body, 'THEME/], ['hookTheme', /^ {4}app\.hooks\.theme = /], ['hookRestage', /^ {4}app\.hooks\.restage = /],
  ['hookStageColour', /^ {4}app\.hooks\.setStageColour = /], ['hookStageFollow', /^ {4}app\.hooks\.setStageFollow = /], ['hookSetStage', /^ {4}app\.hooks\.setStage = /], ['hookGamut', /^ {4}app\.hooks\.setGamut = /],
  ['hookSetTheme', /^ {4}app\.hooks\.setTheme = /], ['gd', /^ {4}const gd = group\(gDraw, /], ['gs', /^ {4}const gs = group\(wClip\.body/],
  ['gp', /^ {4}const gp = group\(wPal\.body/], ['paletteFill', /^ {4}app\.state\.palette = \{/], ['gc', /^ {4}const gc = group\(wCam\.body/],
  ['camKnobsFill', /^ {4}app\.state\.camKnobs = Object\.fromEntries/], ['film', /^ {4}\/\* ── THE FILM \(0\.5\.0 C7/], ['filmLets', /^ {4}let exact = null, filmBefore = null/],
  ['filmHold', /^ {4}function filmHold\(on\) \{/], ['filmHoldEnd', /^ {4}\}$/, 'filmHold'], ['filmFn', /^ {4}const film = \(\) => exact \|\| /],
  ['captureFn', /^ {4}const capture = \(\) => cap \|\| /], ['capApiFill', /^ {4}app\.state\.capApi = \{ get exact\(\)/], ['capApiEnd', /get busy\(\) \{ return !!facadeRun/, 'capApiFill'],
  ['gq', /^ {4}const gq = group\(ui\.set\.body, 'FIELD QUALITY'\)/],
  ['blockClose', /^ {2}\}$/, 'gq'], ['stateSeat', /^ {2}\/\/ STATE — preparation/], ['loopLiteral', /^ {4}loop: \{ schedule, hold: /], ['hostLiteral', /^ {4}host: \{ camera: null/],
  ['LWconst', /^ {2}const LW = \{/], ['LWwin', /^ {2}window\.__LW = LW;/], ['persistSeat', /^ {2}const \{ modSeats, serialize, restoreModulation, save, copyJSON, restore \} = createPersist\(app\);/],
  ['goHead', /^ {2}\/\* ── go ──/],
  // R5 — the facade
  ['facadeHdr', /^ {2}\/\* ── the diagnostics surface/], ['LWend', /^ {2}\};$/, 'LWconst'], ['renderCard', /^ {2}\/\* ── 0\.5\.0 C7b · THE RENDER CARD/],
  ['LWcurves', /^ {2}LW\.curves = curves;/], ['LWboot', /^ {2}LW\.bootView = /], ['linkAtBoot', /^ {2}const linkAtBoot = openLink\(\);/],
  ['warningConst', /^ {2}const warning = dom\.start\.warning;/], ['hooksWarning', /^ {2}app\.hooks\.warning = warning;/], ['LWready', /^ {2}LW\.ready = true;/],
  ['LWreport', /^ {2}LW\.report = /],
  // R2d
  ['legacy', /^ {2}\/\* ── LEGACY WINDOWS/], ['specFolded', /^ {2}let specFoldedByMol/], ['chemHdr', /^ {2}\/\* CHEMISTRY — eight molecules/], ['chemPrev', /^ {2}let chemPrevView/],
  ['molSess', /^ {2}\/\* THE MOLECULAR SESSION/], ['wChem', /^ {2}const wChem = device\(/], ['setOn', /^ {4}setOn\(v\) \{ moleculeMode\(v\); stageTextTick\(\); \}/],
  ['stageText', /^ {2}\/\* THE STAGE TEXT \(Settings › Display;/], ['stageTextInit', /^ {2}app\.state\.stageText = null;/], ['stageCaption', /^ {2}function stageCaption\(\)/],
  ['stageTextTick', /^ {2}function stageTextTick\(\)/], ['stageTickFill', /^ {2}app\.w\.stageTextTick = stageTextTick;/], ['initStageText', /^ {2}function initStageText\(\)/],
  ['wChemChange', /^ {4}wChem\.root\.addEventListener\('change', stageTextTick\)/], ['orbitals', /^ {2}\/\* ORBITALS — the MOLECULAR REGISTER/], ['wOrbs', /^ {2}const wOrbs = device\(/],
  ['wChemFill', /^ {2}app\.w\.wChem = wChem; app\.w\.wOrbs = wOrbs;/], ['calc', /^ {2}\/\/ CALCULUS — the stats/],
  ['modSeam', /^ {2}\/\* ── WAVE 52 · W-MODWINDOW/], ['wave64', /^ {2}\/\* ── WAVE 64 · THERE IS NO MODULATION CARD/], ['camOut', /^ {4}const camOut = /],
  ['modInstall', /^ {4}app\.state\.modHost = mod\.install\(defs/], ['modViewFill', /^ {4}app\.state\.modView = createModulation\(/], ['atoms', /^ {2}\/\/ ATOMS — the periodic table/],
  ['floating', /^ {2}\/\* ── THE FLOATING RACK/], ['rackL', /^ {2}const rackL = document\.getElementById\('rackL'\)/], ['layoutSlots', /^ {2}const LAYOUT_SLOTS = 4/],
  ['floats', /^ {2}const floats = document\.getElementById\('floats'\)/], ['ink', /^ {2}\/\* ── INK STAYS UNDER GLASS/], ['noOcc', /^ {2}const NO_OCCLUSION = \[\]/],
  ['refreshOcc', /^ {2}function refreshOcclusion\(nowMs\)/],
  ['rackKit', /^ {2}\/\* ── 0\.5\.0 C3 · THE RACK IS THE KIT'S/], ['loopRefresh', /refreshOcclusion\(nowMs\)/], ['loopChem', /app\.state\.chem\.setActive\(canPresent\(wChem\)\)/],
  ['initCall', /^ {2}initStageText\(\); LW\.stageText/], ['readersTail', /^ {2}Object\.assign\(READERS, \{/], ['transportSeat', /^ {2}\/\* ── transport strip/], ['badges', /^ {2}\/\* ── badges/],
];
for (const [tok, re, after] of A) {
  const from = after ? Number(V[after]) : 0;
  const i = rack.findIndex((l, k) => k >= from && re.test(l));
  if (i < 0) { console.error('anchor not found (skipped — a PAIR 3 anchor no longer in rack.js, or a missing one a template will name): ' + tok); continue; }
  V[tok] = String(i + 1);
}
/* grep tokens: where a slot is filled across lab/, or "nowhere yet" */
const G = [['periodEnergiesReg', 'app.w.periodEnergies ='], ['stageCaptionReg', 'app.w.stageCaption ='], ['hostRackLFill', 'app.host.rackL ='], ['hostFloatsFill', 'app.host.floats ='],
  ['hostSlotsFill', 'app.host.LAYOUT_SLOTS ='], ['shDevByIdFill', 'app.sh.devById ='], ['shPopFaceFill', 'app.sh.popFace ='], ['shRackCardWidthFill', 'app.sh.rackCardWidth ='],
  ['shRefreshOccFill', 'app.sh.refreshOcclusion ='], ['shLayoutFill', 'app.sh.layout ='], ['shSetModArmFill', 'app.sh.setModArm ='], ['wCalcFill', 'app.w.wCalc ='], ['wLadFill', 'app.w.wLad ='],
  ['hostLWslot', 'LW: null']];
for (const [tok, needle] of G) {
  let out = '';
  try { out = sh('bash', ['-c', `grep -n -F ${JSON.stringify(needle)} lab/rack.js lab/shell/*.js lab/windows/*.js | cut -d: -f1,2 | tr '\\n' ' '`]).trim(); } catch (_) { out = ''; }
  V[tok] = out ? '`' + out.trim().split(/\s+/).join('`, `') + '`' : 'nowhere yet';
}
/* the facade's name audit (R5): where every backward name lives, and the null slots with their owners */
try { V.facadeAudit = sh('node', [T + 'facade-names.mjs', W.replace(/\/$/, '')]).trim().split('\n').map((l) => '  ' + l).join('\n'); } catch (e) { V.facadeAudit = '  (audit failed: ' + String(e.message).slice(0, 120) + ')'; }
V.LWlines = String(Number(V.LWend) - Number(V.LWconst) + 1);
V.LWgetters = String((rack.slice(Number(V.LWconst) - 1, Number(V.LWend)).join('\n').match(/\bget [A-Za-z_$][\w$]*\(\)/g) || []).length);
/* the classes table rows */
const table = sh('node', ['tools/rack-deps.mjs', '--classes']);
for (const m of ['material', 'settings-card', 'film', 'molecules', 'stage-words', 'modulation', 'ink', 'facade']) {
  const row = table.split('\n').find((l) => l.startsWith(`| ${m} |`));
  if (!row) throw new Error('no classes row for ' + m);
  const c = row.split('|').map((s) => s.trim());
  // | module | row → file | lines | backward | forward | shared (bare) | app.state (another's) | **fwd+shared** | bare writes | hinge |
  V['row.' + m] = `${c[3]} lines, backward ${c[4]}, forward ${c[5]}, another scope's \`app.state\` ${c[7]}, **fwd + shared ${c[8].replace(/\*/g, '')}**`;
}
V.hinge = (table.match(/THE HINGE \(G-G\): .*$/m) || ['?'])[0];
V.measured = (table.match(/module files measured \((\d+)\)/) || [, '?'])[1];
const fill = (name) => {
  let s = fs.readFileSync(T + name + '.tpl.md', 'utf8');
  s = s.replace(/\{\{([\w.-]+)(?::([+-]\d+))?\}\}/g, (_, k, off) => {
    if (!(k in V)) throw new Error('no value for {{' + k + '}} in ' + name);
    if (off) { if (!/^\d+$/.test(V[k])) throw new Error('arithmetic on a non-line token {{' + k + '}}'); return String(Number(V[k]) + Number(off)); }
    return V[k];
  });
  const left = s.match(/\{\{[^}]*\}\}/g); if (left) throw new Error('tokens left in ' + name + ': ' + left.join(' '));
  const outDir = process.argv[2] || (W + 'research/release-0.5.2/');
  fs.writeFileSync(outDir + name + '.md', s);
  console.log(name, s.split('\n').length, 'lines');
};
const only = process.argv[3] ? process.argv[3].split(',') : null;
for (const name of ['BRIEF-R2c', 'BRIEF-R2d', 'BRIEF-R5', 'BRIEF-R-V']) if (fs.existsSync(T + name + '.tpl.md') && (!only || only.includes(name))) fill(name);
fs.writeFileSync(T + 'values.json', JSON.stringify(V, null, 1));
console.log('tip', V.tip, 'rack', V.rackLines, 'lab', V.labLines, 'left', V.labLeft);
