#!/usr/bin/env node
/* tools/menu-check.mjs — THE PICTURES ARE WHOLE (iteration 017 S2, Josh: "Make sure metadata is consistent and all the thumbnails are available").
 *   node tools/menu-check.mjs [--volume vol-1]
 * Read-only.  THE MENU (lab/img/menu): every element `el-<Sym>.webp` (118), every hydrogen state `orb-<nl>_<m>.webp` with its `.density` and
 * `.phase` (140 × 3; the base IS Im ψ, tools/menu-thumbs.mjs `atoms: { view: 'imag' }`), every catalogue molecule `<id>.webp` with its
 * phase · im · balls · sticks · esp · labels (the looks THE LOOK DROP offers, picker.js LOOKS), and every id of lab/molecules.js MOLECULES among
 * them.  THE VOLUME (~/Documents/LAMBDAWAVES-VOLUMES/dist/<vol>): each index row's `thumb` against `t/<id>.webp`, each named `thumbs` variant
 * against `t/<id>.<style>.webp`.  Prints one screen; exits 1 when the menu is short (the volume's gaps are the next pack day's, reported only). */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), MENU = path.join(ROOT, 'lab', 'img', 'menu');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const MOL_LOOKS = ['phase', 'im', 'balls', 'sticks', 'esp', 'labels'], ORB_LOOKS = ['density', 'phase'];
const files = new Set(readdirSync(MENU).filter((f) => f.endsWith('.webp')));
const ids = { el: new Set(), orb: new Set(), mol: new Set() };
for (const f of files) {
  const base = f.slice(0, -5), dot = base.indexOf('.'), stem = dot > 0 ? base.slice(0, dot) : base;
  if (stem.startsWith('el-')) ids.el.add(stem); else if (stem.startsWith('orb-')) ids.orb.add(stem); else ids.mol.add(stem);
}
const missing = [];
const need = (stem, looks) => { if (!files.has(stem + '.webp')) missing.push(stem + '.webp'); for (const l of looks) if (!files.has(stem + '.' + l + '.webp')) missing.push(stem + '.' + l + '.webp'); };
for (const s of ids.el) need(s, []); for (const s of ids.orb) need(s, ORB_LOOKS); for (const s of ids.mol) need(s, MOL_LOOKS);
let molsNotDrawn = [];   // a disabled row (the heavy group, 011 Q4) is not drawn by tools/menu-thumbs.mjs either, so it is no gap
try { const { MOLECULES, RECORD_ONLY } = await import(path.join(ROOT, 'lab', 'molecules.js')); molsNotDrawn = [...MOLECULES, ...RECORD_ONLY].filter((m) => !m.disabled).map((m) => m.id).filter((id) => !ids.mol.has(id)); } catch (e) { molsNotDrawn = ['(lab/molecules.js did not load: ' + (e && e.message) + ')']; }
console.log(`MENU  ${files.size} files · elements ${ids.el.size} (118 expected) · hydrogen states ${ids.orb.size} (140 expected, each + ${ORB_LOOKS.join(' · ')}) · molecules ${ids.mol.size} (each + ${MOL_LOOKS.join(' · ')})`);
console.log(missing.length ? `  MISSING ${missing.length}: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}` : '  every picture present');
console.log(molsNotDrawn.length ? `  lab/molecules.js ids without a menu picture: ${molsNotDrawn.join(', ')}` : '  every lab/molecules.js id has its pictures');
const vol = arg('volume', 'vol-1'), VDIR = path.join(process.env.HOME, 'Documents', 'LAMBDAWAVES-VOLUMES', 'dist', vol);
if (existsSync(path.join(VDIR, 'index.json'))) {
  const idx = JSON.parse(readFileSync(path.join(VDIR, 'index.json'), 'utf8')), rows = idx.molecules || idx, T = new Set(readdirSync(path.join(VDIR, 't')));
  let saidHas = 0, hasFile = 0, saidNoFile = 0, fileNotSaid = 0, varSaid = 0, varMissing = 0;
  for (const r of rows) {
    const f = T.has(r.id + '.webp'); if (f) hasFile++;
    if (r.thumb) { saidHas++; if (!f) saidNoFile++; } else if (f) fileNotSaid++;
    for (const st of r.thumbs || []) { varSaid++; if (!T.has(r.id + '.' + st + '.webp')) varMissing++; }
  }
  console.log(`VOLUME ${vol}  ${rows.length} rows · ${hasFile} with a picture on disk · index names ${saidHas} · named but no file ${saidNoFile} · file but not named ${fileNotSaid} (the next pack takes them) · variants named ${varSaid}, missing ${varMissing}`);
} else console.log(`VOLUME ${vol}  not installed here (${VDIR})`);
process.exit(missing.length || molsNotDrawn.length ? 1 : 0);
