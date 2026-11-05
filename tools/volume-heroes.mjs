#!/usr/bin/env node
/* tools/volume-heroes.mjs — 032 THE PORTRAIT SHELF's pictures: a volume card's hero (the animation a hover plays) and its still, per theme.
 *
 *   node tools/volume-heroes.mjs <vol-id> <dark|light> <clip>   the clip (any video ffmpeg reads) → lab/img/menu/vol/<id>.<theme>.mp4 —
 *        9:16, cover-cropped to 720 × 1280, 30 fps, H.264 yuv420p, no sound, faststart — and its first frame → <id>.<theme>.webp (540 × 960),
 *        then HEROES in lab/picker.js names the theme for the volume
 *   … [--at <seconds>]   036 C5 (Josh 11-03: "for the Volume I front cover, use the second clip in the dark mode hero and the 3rd clip in the
 *        light"): the still from that time instead of frame 0 (a hero that fades in opens on black); with no <clip> the still alone is re-cut
 *        from the hero already made (the mp4 untouched).  037 M3 (Josh 11-05: "the thumbnail doesn't have to be the start point, it's just the
 *        cover, let the video play as is"): the time is the STILL's alone — HEROES names the themes, never a start, and the hero plays from 0
 *   node tools/volume-heroes.mjs --drop <vol-id>                 the volume's heroes leave (files and HEROES): its card wears the palette again
 *
 * Needs ffmpeg (libx264, libwebp) at tool time only. img/menu/ is a DATA root (sw.js §1b): deployed, never precached; the page fetches a
 * still with the card and a hero on its first hover (a Range request goes past the worker to the network). Then: node tests/pwa.test.mjs --write
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), DIR = join(ROOT, 'lab/img/menu/vol'), PICKER = join(ROOT, 'lab/picker.js');
const args = process.argv.slice(2), ID = /^vol-\d+$/;
const fail = (m) => { console.error('volume-heroes: ' + m); process.exit(1); };

/* the HEROES line: `export const HEROES = { … };` and whatever comment trails it (037 M3: the export and the comment kept — since 036 G7 the
   line is exported for lab/loader.js and the old `^const …;$` pattern found nothing) */
const src = readFileSync(PICKER, 'utf8'), line = /^(export )?const HEROES = (\{[^\n]*?\});([^\n]*)$/m, m = src.match(line);
if (!m) fail("lab/picker.js has no `export const HEROES = { … };` line");
const heroes = Function('return ' + m[2])();   // a volume's themes, 'dark light' (an older `dark@9.1` token is read as its theme and written plain)
const themes = (id) => new Set((heroes[id] || '').split(' ').filter(Boolean).map((s) => s.split('@')[0]));
const write = () => {
  const body = Object.keys(heroes).sort().map((k) => `'${k}': '${['dark', 'light'].filter((th) => themes(k).has(th)).join(' ')}'`).join(', ');
  writeFileSync(PICKER, src.replace(line, `${m[1] || ''}const HEROES = {${body ? ' ' + body + ' ' : ''}};${m[3]}`));
};

if (args[0] === '--drop') {
  const id = args[1]; if (!ID.test(id || '')) fail('usage: --drop <vol-id>');
  for (const t of ['dark', 'light']) for (const x of ['mp4', 'webp']) rmSync(join(DIR, `${id}.${t}.${x}`), { force: true });
  delete heroes[id]; write(); console.log(`volume-heroes: ${id} has no hero now. Next: node tests/pwa.test.mjs --write`);
  process.exit(0);
}
const atI = args.indexOf('--at'), at = atI >= 0 ? Number(args.splice(atI, 2)[1]) : 0;
const [id, theme, clip] = args;
if (!ID.test(id || '') || !['dark', 'light'].includes(theme) || (!clip && atI < 0) || !(at >= 0)) fail('usage: <vol-id> <dark|light> <clip> [--at <s>]  ·  <vol-id> <dark|light> --at <s>  ·  --drop <vol-id>');
if (clip && !existsSync(clip)) fail('no such clip: ' + clip);
mkdirSync(DIR, { recursive: true });
const mp4 = join(DIR, `${id}.${theme}.mp4`), webp = join(DIR, `${id}.${theme}.webp`), crop = 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1';
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
if (clip) ff(['-i', clip, '-an', '-vf', crop + ',fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
else if (!existsSync(mp4)) fail(`no hero to take a still from: ${mp4}`);
ff([...(at ? ['-ss', String(at)] : []), '-i', mp4, '-frames:v', '1', '-vf', 'scale=540:960', '-c:v', 'libwebp', '-quality', '82', webp]);
{ const t = themes(id); t.add(theme); heroes[id] = ['dark', 'light'].filter((th) => t.has(th)).join(' '); write(); }   // the still's time is never written: the hero plays from its start
const kb = (f) => Math.round(statSync(f).size / 1024);
if (!clip) { console.log(`volume-heroes: ${id} ${theme} → the still at ${at} s (${kb(webp)} KB), the hero untouched. Next: node tests/pwa.test.mjs --write`); process.exit(0); }
console.log(`volume-heroes: ${id} ${theme} → lab/img/menu/vol/${id}.${theme}.mp4 (${kb(mp4)} KB) + .webp (${kb(webp)} KB); HEROES['${id}'] = '${heroes[id]}'.`
  + (kb(mp4) > 4096 ? ' The hero is over 4 MB: a shorter loop or a calmer picture fetches faster on a hover.' : '') + ' Next: node tests/pwa.test.mjs --write');
