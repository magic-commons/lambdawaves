/* tools/volume-thumbs.mjs — THE VOLUMES' FIELD LOOKS (037 D5, Josh 11-05: "populate it with not just p, but with arg, im, balls, sticks, and
 * ESP"): a volume's molecules drawn BY THE APP in headless Firefox in each look and packed ONE WebP SPRITE SHEET PER LOOK PER PAGE — never a
 * file per molecule (the site ships 15,674 of its §V7 20,000-file budget).
 *
 *   python3 tools/gate/server.py . 9697 &                 (the page serves the volume through the dev link lab/volumes → <shelf>/dist)
 *   GD_PORT=5697 LW_PORT=9697 node tools/volume-thumbs.mjs --volume vol-3 [--page N | --all] [--looks phase,im,balls,sticks,esp] [--q 0.64]
 *
 * THE PAGES are tools/diagrams' (<shelf>/dist/<vol>/t/pages.json `pages`, each page's ids in the index's order: run tools/diagrams/dump.mjs
 *   --volume and draw.py for the volume first).  No --page and no --all: the first page not yet done.
 * A MOLECULE is opened ONCE by the card's road (__LW.chem.openVolume: its lowest rung, its record, no solve) at the boot's HOME pose and drawn
 *   in every look as tools/menu-thumbs.mjs draws the catalogue's variants — phase: arg ψ of HOMO + i·LUMO on the HSV wheel; im: the HOMO
 *   SIGNED on RE; balls · sticks: the structure; esp: THE POTENTIAL MAP on the SES — over two grounds (the matte gives the alpha exactly),
 *   cropped square about its alpha box (8 %), at 2 × 160 px.  THE PACE: a look is shot 250 ms after it is set and each ground after ONE present
 *   (paused, a schedule presents once): on 10 of 10 picks (two molecules × five looks) the pixels were identical to a shot 1.2 s later.
 * A SHEET: python3 + PIL scales each tile to 160 px and packs the page's tiles `cols` a row (cell n = the molecule's place in the page) into
 *   <shelf>/dist/<vol>/t/<look>-<page>.webp (lossy colour and alpha), then t/pages.json `sheets[look][page]` = { v: the sheet's sha-256
 *   (8 hex; the app asks ?v=, so a kept copy is never stale), rows, missing: the ids it could not draw (their cells stay empty and the app
 *   shows the plain picture) }.  RESUMABLE: a look whose sheet exists (file and row) is not drawn again; --all walks every page.
 * One browser on a shared GPU: run it alone.  Prints the seconds per molecule. */
import { open } from './gate/gatekit.mjs';
import { writeFileSync, readFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const VOL = arg('volume', null); if (!VOL) { console.error('--volume vol-N'); process.exit(2); }
const LOOKS = arg('looks', 'phase,im,balls,sticks,esp').split(',').filter((l) => ['density', 'phase', 'im', 'balls', 'sticks', 'esp'].includes(l));
const Q = +arg('q', 0.64), AQ = +arg('aq', 50), ISO = 0.03, TILE = 160, RENDER = +arg('render', 640);
const T = (process.env.LW_VOLUMES || homedir() + '/Documents/LAMBDAWAVES-VOLUMES') + '/dist/' + VOL + '/t/', MAN = T + 'pages.json';
if (!existsSync(MAN)) { console.error(`${MAN} is missing: run tools/diagrams/dump.mjs --volume ${VOL} and draw.py first (they write the pages)`); process.exit(2); }
const readMan = () => JSON.parse(readFileSync(MAN, 'utf8'));
const atomic = (file, bytes) => { const tmp = T + '.tmp-' + process.pid; writeFileSync(tmp, bytes); renameSync(tmp, file); };
const done = (man, look, p) => !!(man.sheets && man.sheets[look] && man.sheets[look][p]) && existsSync(T + `${look}-${p}.webp`);
const man0 = readMan(), N = man0.pages.length, cols = man0.cols || 10;
const pages = process.argv.includes('--all') ? [...Array(N).keys()] : arg('page', null) != null ? [+arg('page')] : [[...Array(N).keys()].find((p) => LOOKS.some((l) => !done(man0, l, p)))].filter((p) => p != null);
if (!pages.length) { console.log(`${VOL}: every page carries ${LOOKS.join(' · ')}`); process.exit(0); }

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9697}/lab/?menu=0`, { width: 1200, height: 900, script: 240000 });
if (!(await g.waitFor('window.__LW&&__LW.ready', 900, 100)).ok) { console.error('the lab did not come up', await g.errors()); await g.close(); process.exit(1); }
/* the look once, and the shot (tools/menu-thumbs.mjs's, the labels overlay left out) */
await g.ev(`const LW = __LW; LW.pause(); LW.setFrame(false); LW.setAxis(false); LW.setDither(0); LW.mat.gamma = 1;
  LW.palette.select('wheel'); LW.palette.setOn(true); if (LW.camMode !== 'turntable') LW.setCamMode('turntable', true);
  LW.governor.on = false; LW.quality.res = 128; LW.quality.steps = 240; LW.quality.scale = 1; LW.schedule(LW.TIER.REBUILD);
  window.__home = { yaw: LW.obs.yaw, pitch: LW.obs.pitch };
  window.__thumb = async (size) => {
    const settle = async () => { const p = LW.stats.presents; for (let i = 0; i < 150 && LW.stats.presents < p + 1; i++) await new Promise((r) => setTimeout(r, 20)); };   // paused, a schedule presents ONCE: menu-thumbs.mjs waited for two and timed out at 3 s every grab
    const grab = async (bg) => { LW.mat.bg = bg; LW.schedule(LW.TIER.PRESENT); await settle();
      const p = await LW.capture.picture({ width: ${RENDER}, height: ${RENDER}, caption: false }); if (!p.ok) throw new Error(p.error);
      const bm = await createImageBitmap(p.blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height), x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const keep = LW.mat.bg.slice(), A = await grab([0, 0, 0]), B = await grab([0.78, 0.78, 0.78]); LW.mat.bg = keep; LW.schedule(LW.TIER.PRESENT);
    const W = A.width, H = A.height, out = new ImageData(W, H); let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      let gy = 1; for (let x = 0; x < W; x++) { const k = 4 * (y * W + x); gy = Math.max(gy, B.data[k] - A.data[k], B.data[k + 1] - A.data[k + 1], B.data[k + 2] - A.data[k + 2]); }
      for (let x = 0; x < W; x++) { const k = 4 * (y * W + x); let a = 0;
        for (let ch = 0; ch < 3; ch++) a += 1 - (B.data[k + ch] - A.data[k + ch]) / gy;
        a = Math.min(1, Math.max(0, a / 3)); if (a < 0.012) a = 0;
        for (let ch = 0; ch < 3; ch++) out.data[k + ch] = a ? Math.min(255, Math.round(A.data[k + ch] / a)) : 0;
        out.data[k + 3] = Math.round(a * 255);
        if (a > 0.04) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    }
    if (x1 < 0) return { empty: true };
    const full = new OffscreenCanvas(W, H); full.getContext('2d').putImageData(out, 0, 0);
    const side = Math.max(x1 - x0, y1 - y0) * 1.08 + 4, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const c = new OffscreenCanvas(size, size), cg = c.getContext('2d'); cg.imageSmoothingQuality = 'high';
    cg.drawImage(full, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size);
    const buf = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { b64: btoa(s) };
  };
  return true;`);
/* every look starts with no structure: BALLS and STICKS are GLASS plus mat.atomSize / mat.stickR (field.js liftAtomStyle), which outlive the
   style — left set, the next molecule's arg ψ and Im ψ came out as ball-and-stick, and STICKS as balls too (absent = none; ESP keeps its sticks) */
const molLook = (v) => 'delete LW.mat.atomSize; delete LW.mat.stickR; ' + (v === 'im' ? `await LW.chem.setView('orbital'); LW.setView('real'); LW.setStyle('signed'); LW.mat.iso = ${ISO};`
  : v === 'phase' ? `{ const o = LW.orbitals.state(); LW.orbitals.clear(); LW.orbitals.select(o.homo, 1, 0); LW.orbitals.select(o.lumo, 1, Math.PI / 2); await LW.chem.setView('registry'); } LW.setView('phase'); LW.setStyle('signed'); LW.mat.iso = ${ISO};`
  : v === 'density' ? `await LW.chem.setView('density'); LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO};`
  : `await LW.chem.setView('density'); LW.setView('density'); LW.setStyle('${v}'); LW.mat.espSurf = 'ses';`);
const PACK = 'import sys,json\nfrom PIL import Image\ns=json.load(open(sys.argv[1]));S=s["tile"];im=Image.new("RGBA",(s["cols"]*S,s["rows"]*S),(0,0,0,0))\nfor n,p in s["tiles"].items():\n  n=int(n);t=Image.open(p).convert("RGBA").resize((S,S),Image.LANCZOS);im.paste(t,((n%s["cols"])*S,(n//s["cols"])*S))\nim.save(s["out"],"WEBP",quality=s["q"],alpha_quality=s["aq"],method=6)';

const TMP = tmpdir() + '/lw-volume-thumbs-' + process.pid + '/';
let mols = 0, t0 = Date.now(), files = 0, bytes = 0;
for (const p of pages) {
  const ids = readMan().pages[p], todo = LOOKS.filter((l) => !done(readMan(), l, p)); if (!todo.length) { console.log(`page ${p}: done`); continue; }
  const rows = Math.ceil(ids.length / cols), tiles = Object.fromEntries(todo.map((l) => [l, {}])), tp = Date.now();
  for (const l of todo) mkdirSync(TMP + l, { recursive: true });
  for (const [n, id] of ids.entries()) {
    const r = await g.ev(`const LW = __LW; if (!(await LW.chem.openVolume(${JSON.stringify(VOL)}, ${JSON.stringify(id)}))) return { E: LW.chem.state().status };
      for (let i = 0; i < 900; i++) { const c = LW.chem.state(), m = LW.molsession.state().molecule; if (m && m.nAO === c.nAO) break; await new Promise((r) => setTimeout(r, 100)); }
      LW.obs.yaw = __home.yaw; LW.obs.pitch = __home.pitch; LW.schedule(LW.TIER.PRESENT); return true;`);
    for (const l of todo) {
      const s = r && r.E ? r : await g.ev(`const LW = __LW; ${molLook(l)} LW.palette.setOn(${l === 'phase' || l === 'im' || l === 'density'});
        await new Promise((r) => setTimeout(r, 250)); return await __thumb(${2 * TILE});`);
      if (s && s.b64) { writeFileSync(TMP + l + '/' + n + '.png', Buffer.from(s.b64, 'base64')); tiles[l][n] = TMP + l + '/' + n + '.png'; }
      else console.log('  ✗', id, l, s && (s.E || (s.empty ? 'empty' : 'no picture')));
    }
    mols++;
  }
  for (const l of todo) {
    const file = T + `${l}-${p}.webp`, spec = TMP + l + '.json', out = TMP + l + '.webp';
    writeFileSync(spec, JSON.stringify({ tile: TILE, cols, rows, q: Math.round(Q * 100), aq: AQ, out, tiles: tiles[l] }));
    const py = spawnSync('python3', ['-I', '-c', PACK, spec], { encoding: 'utf8' }); if (py.status) { console.error(py.stderr); process.exit(1); }
    const b = readFileSync(out); atomic(file, b); files++; bytes += b.length;
    const man = readMan(); man.sheets = man.sheets || {}; man.sheets[l] = man.sheets[l] || {};
    man.sheets[l][p] = { v: createHash('sha256').update(b).digest('hex').slice(0, 8), rows, missing: ids.filter((_, n) => !tiles[l][n]) };
    atomic(MAN, JSON.stringify(man) + '\n');
    console.log(`  ${l}-${p}.webp  ${(b.length / 1024).toFixed(1)} kB  ${Object.keys(tiles[l]).length}/${ids.length} tiles`);
  }
  console.log(`page ${p}: ${ids.length} molecules × ${todo.length} looks in ${((Date.now() - tp) / 1000).toFixed(0)} s = ${((Date.now() - tp) / 1000 / ids.length).toFixed(2)} s a molecule`);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`${VOL}: ${mols} molecules, ${files} sheets, ${(bytes / 1048576).toFixed(2)} MB, ${((Date.now() - t0) / 1000 / Math.max(1, mols)).toFixed(2)} s a molecule`, JSON.stringify((await g.errors()).errs.filter((e) => !/ResizeObserver/.test(e))));
await g.close(); process.exit(0);
