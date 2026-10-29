/* decohere-shots.mjs — iteration 024 chain S's pictures and frame cost (a diagnostic, not a gate); 027 N: any SHADER type.
 *   LW_PORT=9687 GD_PORT=5687 [NODE=decohere|feedback|refract|flow] [JPG=1] node tools/decohere-shots.mjs <outdir> <scene> name:k=v,k=v …
 * Scenes: h (the hydrogen default) · mol=<id>[/style][/palette] (MOLECULES on, the molecule picked, the draw style, a palette on).
 * One NODE (DECOHERE by default) is added; each shot sets its knobs from home and writes <outdir>/<name>.png — or, with JPG=1, a 960-px <name>.jpg.
 * `perf` as a shot name prints presents/s over 4 s without the node and with it (home knobs). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const [OUT = '.tmp/dec', scene = 'h', ...shots] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9687}/lab/?starter=home`, { width: +(process.env.W || 1280), height: +(process.env.H || 800) });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rate = async () => { const a = await g.ev('return [__LW.field.stats.presents, performance.now()];'); await wait(4000);
  const b = await g.ev('return [__LW.field.stats.presents, performance.now()];'); return +((b[0] - a[0]) / ((b[1] - a[1]) / 1000)).toFixed(1); };
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await g.ev(`__LW.setTheme('dark'); __LW.play(); if (${!!process.env.GOV_OFF}) { __LW.governor.on = false; __LW.quality.auto = false; __LW.quality.scale = 1; __LW.quality.autoScale = 1; } return 1;`); await wait(1500);
  if (scene.startsWith('mol=')) {
    const [mol, style, pal] = scene.slice(4).split('/');
    await g.ev(`__LW.chem.setOn(true); await __LW.chem.pick(${JSON.stringify(mol)}); return 1;`); await wait(6000);
    await g.ev(`${style ? `__LW.setStyle(${JSON.stringify(style)});` : ''} ${pal ? `__LW.setPalette(${JSON.stringify(pal)}); __LW.mat.paletteOn = true; __LW.setStyle(${JSON.stringify(style || 'cloud')});` : ''} return 1;`);
    await wait(1500);
  }
  const info = { scene, canvas: await g.ev('const c = document.querySelector("#stage canvas"); return [c.width, c.height];') };
  if (shots.includes('perf')) { await wait(4000); info.before = await rate(); }
  const id = await g.ev(`return __LW.nodes.add(${JSON.stringify(process.env.NODE || 'decohere')});`); await wait(1500);
  if (shots.includes('perf')) info.with = await rate();
  for (const s of shots.filter((x) => x !== 'perf')) {
    const [name, kv = ''] = s.split(':'), set = Object.fromEntries(kv.split(',').filter(Boolean).map((p) => p.split('=')).map(([k, v]) => [k, isNaN(+v) ? v : +v]));
    await g.ev(`const id = ${JSON.stringify(id)}; __LW.nodes.reset(id); for (const [k, v] of Object.entries(${JSON.stringify(set)})) __LW.nodes.set(id, k, v); return 1;`);
    await wait(+(process.env.WAIT || 1200));
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(await g.snap(), 'base64'));
    if (process.env.JPG) execFileSync('python3', ['-I', '-c', 'import sys, os\nfrom PIL import Image\nim = Image.open(sys.argv[1]).convert("RGB"); im.thumbnail((960, 960)); im.save(sys.argv[2], quality=80); os.remove(sys.argv[1])',
      `${OUT}/${name}.png`, `${OUT}/${name}.jpg`]);
  }
  info.layers = await g.ev('return [...document.querySelectorAll("#nodeLayers > *")].map((e) => e.tagName + ":" + e.width + "x" + e.height);');
  info.errors = (await g.errors()).errs;
  console.log(JSON.stringify(info));
} finally { await g.close(); }
