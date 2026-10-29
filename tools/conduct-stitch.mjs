#!/usr/bin/env node
/* tools/conduct-stitch.mjs — 026 A4: films joined into one reel.
 *   node tools/conduct-stitch.mjs OUT.mp4 a.mp4[::"TITLE"] b.mp4 … [--size 1920x1080] [--fps 30]
 * Every segment is brought to ONE size (scaled to fit, letterboxed on black) and ONE fps (default the first segment's), libx264 crf 16 yuv420p;
 * the sound is AAC 48 kHz where a segment has it and a silent track where it has none (only when some segment has sound).  A segment's
 * `::TITLE` is a lower third for its first seconds, burnt in with ffmpeg's ass filter (this build has no drawtext) in lab/fonts' UI face
 * (Roboto, read-only; libass falls back to the system's sans if it cannot read it).  The facts of the reel are ffprobe's, printed at the end. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), BIN = process.env.HOME + '/bin/';
const FFMPEG = process.env.FFMPEG || BIN + 'ffmpeg', FFPROBE = process.env.FFPROBE || BIN + 'ffprobe';
const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const sizeArg = opt('--size'), fpsArg = opt('--fps'), [out, ...segs] = argv;
if (!out || !segs.length) { console.error('usage: node tools/conduct-stitch.mjs OUT.mp4 a.mp4[::"TITLE"] b.mp4 … [--size WxH] [--fps N]'); process.exit(2); }
const probe = (f) => JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', f], { encoding: 'utf8' }));
const parts = segs.map((s) => { const [file, ...t] = s.split('::'), p = probe(file), v = p.streams.find((x) => x.codec_type === 'video');
  if (!v) throw new Error(file + ' has no video'); const [a, b] = v.r_frame_rate.split('/').map(Number);
  return { file, title: t.join('::').replace(/^"|"$/g, '').trim(), w: v.width, h: v.height, fps: a / (b || 1), dur: +p.format.duration, audio: p.streams.some((x) => x.codec_type === 'audio') }; });
const [W, H] = sizeArg ? sizeArg.split('x').map(Number) : [parts[0].w, parts[0].h], FPS = fpsArg ? +fpsArg : parts[0].fps, sound = parts.some((p) => p.audio);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'conduct-stitch-')), fonts = path.join(ROOT, 'lab/fonts');
const ts = (s) => { const m = Math.floor(s / 60), x = s - m * 60; return '0:' + String(m).padStart(2, '0') + ':' + x.toFixed(2).padStart(5, '0'); };
const esc = (t) => t.replace(/[{}\\]/g, '').replace(/\n/g, '\\N');
const chains = [], ins = [];
parts.forEach((p, i) => {
  ins.push('-i', p.file);
  let v = `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=${FPS},format=yuv420p`;
  if (p.title) {
    const ass = path.join(tmp, 't' + i + '.ass');
    fs.writeFileSync(ass, ['[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`, '', '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV',
      `Style: Title,Roboto,${Math.round(H / 18)},&H00FFFFFF,&H00000000,&H64000000,1,0,3,${Math.round(H / 90)},0,1,${Math.round(W / 20)},${Math.round(W / 20)},${Math.round(H / 9)}`, '',
      '[Events]', 'Format: Layer, Start, End, Style, Text', `Dialogue: 0,${ts(0.3)},${ts(Math.max(0.8, Math.min(4, p.dur - 0.2)))},Title,{\\fad(250,250)}${esc(p.title)}`].join('\n'));
    v += `,ass=${ass}:fontsdir=${fonts}`;
  }
  chains.push(v + `[v${i}]`);
  chains.push(sound ? (p.audio ? `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad,atrim=0:${p.dur}[a${i}]`
    : `anullsrc=r=48000:cl=stereo,atrim=0:${p.dur}[a${i}]`) : '');
});
const graph = [...chains.filter(Boolean), parts.map((_, i) => `[v${i}]` + (sound ? `[a${i}]` : '')).join('') + `concat=n=${parts.length}:v=1:a=${sound ? 1 : 0}[v]` + (sound ? '[a]' : '')].join(';');
try {
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...ins, '-filter_complex', graph, '-map', '[v]', ...(sound ? ['-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : []),
    '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', out], { stdio: 'inherit' });
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
const f = probe(out), v = f.streams.find((x) => x.codec_type === 'video');
console.log(`REEL ${out} · ${parts.length} segment(s) · ${v.width}×${v.height} @ ${v.r_frame_rate} · ${(+f.format.duration).toFixed(3)} s · ${f.streams.some((x) => x.codec_type === 'audio') ? 'AAC 48 kHz' : 'silent'} · ${fs.statSync(out).size} B`);
