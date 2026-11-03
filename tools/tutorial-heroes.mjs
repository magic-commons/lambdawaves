#!/usr/bin/env node
/* tools/tutorial-heroes.mjs — 034 M3 THE TUTORIAL DECK's pictures: a card's hero (the loop a hover or a focus plays) and its still.
 *
 *   node tools/tutorial-heroes.mjs <id> <clip> [--theme dark|light] [--title "WORDS"] [--caption "WORDS"] [--x 0…1]
 *        the clip (any video ffmpeg reads) → lab/img/menu/tut/<id>.<theme>.mp4 — 720 × 1280, 30 fps, H.264 yuv420p, no sound, faststart,
 *        the volume heroes' recipe (tools/volume-heroes.mjs) — and the mp4's own first frame → <id>.<theme>.webp (540 × 960), so the still is
 *        exactly the hero's crop and its first picture; then the card's row in TUTORIAL (lab/picker.js): a new id is appended, its title the
 *        clip's file name (HERO1 → HERO 1) unless --title; an id already there keeps its place, its title and its caption unless they are given.
 *        THE CROP: the clip is COVER-CROPPED to 9:16 — scaled to 1280 high and cut to a 720-wide strip at --x (0 the left edge … 1 the right,
 *        0.5 the centre, the default).  A 16:9 screen recording keeps its middle 32 % (the field; the racks at its sides are lost), so a
 *        portrait recording is the honest source; a 9:16 clip keeps everything.
 *        THE THEME is the one the clip was recorded in: --theme, else measured (the whole first frame's mean luma over half → light).  A card shows
 *        its one clip in both themes until the other theme's comes (the row's `themes` names the files that exist).
 *   node tools/tutorial-heroes.mjs --caption <id> "WORDS"   the caption alone (Josh's words, as they come)
 *   node tools/tutorial-heroes.mjs --drop <id>               the card leaves: its files and its row
 * id: tut-<slug> (a–z, 0–9, hyphens).  Needs ffmpeg (libx264, libwebp) at tool time only.  img/menu/ is a DATA root (sw.js §1b): deployed,
 * never precached; a still is fetched with its card, a hero on its first play.  Then: node tests/pwa.test.mjs --write
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), DIR = join(ROOT, 'lab/img/menu/tut'), PICKER = join(ROOT, 'lab/picker.js');
const ID = /^tut-[a-z0-9]+(-[a-z0-9]+)*$/, THEMES = ['dark', 'light'];
const fail = (m) => { console.error('tutorial-heroes: ' + m); process.exit(1); };
const argv = process.argv.slice(2), flag = (k) => { const i = argv.indexOf(k); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); if (v === undefined) fail(k + ' wants a value'); return v; };

/* the TUTORIAL table: `const TUTORIAL = [` … `];`, one row a line */
const src = readFileSync(PICKER, 'utf8'), block = /^const TUTORIAL = \[\n([\s\S]*?)^\];$/m, m = src.match(block);
if (!m) fail('lab/picker.js has no `const TUTORIAL = [` … `];` block');
const rows = Function('return [' + m[1] + ']')();
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ') + "'";
const write = () => writeFileSync(PICKER, src.replace(block, 'const TUTORIAL = [\n' + rows.map((r) =>
  `  { id: ${q(r.id)}, title: ${q(r.title)}, caption: ${q(r.caption || '')}, themes: ${q(THEMES.filter((t) => String(r.themes).split(' ').includes(t)).join(' '))} },\n`).join('') + '];'));
const next = 'Next: node tests/pwa.test.mjs --write';

if (argv[0] === '--drop' || argv[0] === '--caption') {
  const [cmd, id, words] = argv, r = rows.find((x) => x.id === id);
  if (!r) fail(`no TUTORIAL row ${id || ''}`);
  if (cmd === '--drop') { for (const t of THEMES) for (const x of ['mp4', 'webp']) rmSync(join(DIR, `${id}.${t}.${x}`), { force: true }); rows.splice(rows.indexOf(r), 1); }
  else { if (words === undefined) fail('usage: --caption <id> "WORDS"'); r.caption = words; }
  write(); console.log(`tutorial-heroes: ${id} ${cmd === '--drop' ? 'left the deck' : 'has its caption'}. ${next}`);
  process.exit(0);
}
const title = flag('--title'), caption = flag('--caption'), x = flag('--x'), themeArg = flag('--theme'), [id, clip] = argv;
if (!ID.test(id || '') || !clip) fail('usage: <tut-id> <clip> [--theme dark|light] [--title …] [--caption …] [--x 0…1]  ·  --caption <id> "…"  ·  --drop <id>');
if (!existsSync(clip)) fail('no such clip: ' + clip);
if (themeArg && !THEMES.includes(themeArg)) fail('--theme is dark or light');
const fx = x === undefined ? 0.5 : Number(x); if (!(fx >= 0 && fx <= 1)) fail('--x is 0…1');

mkdirSync(DIR, { recursive: true });
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const tmp = join(DIR, `.${id}.tmp.mp4`);
const crop = `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280:(in_w-720)*${fx}:(in_h-1280)/2,setsar=1`;
ff(['-i', clip, '-an', '-vf', crop + ',fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp]);
let theme = themeArg, luma = null;
if (!theme) {   // the WHOLE first frame's mean luma (signalstats YAVG, 0–255; the crop's would read a bright orbital as a light room): over half is light
  const out = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', clip, '-frames:v', '1', '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  const y = out.match(/YAVG=([\d.]+)/); luma = y ? Number(y[1]) : null; theme = luma != null && luma > 127.5 ? 'light' : 'dark';
}
const mp4 = join(DIR, `${id}.${theme}.mp4`), webp = join(DIR, `${id}.${theme}.webp`);
renameSync(tmp, mp4);
ff(['-i', mp4, '-frames:v', '1', '-vf', 'scale=540:960', '-c:v', 'libwebp', '-quality', '82', webp]);

const named = basename(clip, extname(clip)).toUpperCase().replace(/([A-Z])(\d)/g, '$1 $2').replace(/\s+/g, ' ').trim();
let r = rows.find((y) => y.id === id);
if (!r) rows.push(r = { id, title: title || named, caption: caption || '', themes: theme });
else { if (title) r.title = title; if (caption !== undefined) r.caption = caption; r.themes = [...new Set([...String(r.themes).split(' ').filter(Boolean), theme])].join(' '); }
write();
const kb = (f) => Math.round(statSync(f).size / 1024);
console.log(`tutorial-heroes: ${id} ${theme}${luma != null ? ` (measured, luma ${luma.toFixed(0)})` : ''} → lab/img/menu/tut/${id}.${theme}.mp4 (${kb(mp4)} KB) + .webp (${kb(webp)} KB), the crop at x ${fx}; `
  + `TUTORIAL row ${rows.indexOf(r) + 1}: ${r.title} · ${r.themes}.` + (kb(mp4) > 4096 ? ' The hero is over 4 MB: a shorter loop fetches faster on a hover.' : '') + ' ' + next);
