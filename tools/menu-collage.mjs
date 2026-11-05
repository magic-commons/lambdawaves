#!/usr/bin/env node
/* tools/menu-collage.mjs — 035 THE COLLAGE (Josh 11-03: "a collage of videos … each row, alternating, slides past each other"): the pool of
 * clean 2-second clips and the two ATLASES the main menu's face draws (ONE VIDEO, MANY TILES — lab/picker-collage.js, docs/laws/picker.md).
 *
 *   python3 tools/menu-collage-scan.py ~/Videos    1 THE SCOUT: every video's clean 2.4-s windows (never across a cut, never a still), the
 *                                                    centre-square thumbs and the contact sheets → .tmp/collage/candidates.json, thumbs/, sheets/
 *   python3 tools/menu-collage-scan.py --rescore   1b THE STUTTER MEASURE (036): each window at its native rate; `stutter.call` stuttery is refused
 *   (a cheap model reads the sheets)                2 THE EYE → .tmp/collage/verdicts.jsonl, a line a candidate:
 *                                                    { id, material: 'lw'|'other', ui: 0|1|2, info: 0|1|2, theme: 'dark'|'light', grade: 0..3, note }
 *                                                    — a second look appends a line: the last line for an id is its verdict
 *   node tools/menu-collage.mjs cut [--in .tmp/collage]     3 THE POOL: λWAVES material of grade ≥ 2 with no UI and no informational (an
 *        atom's letters on its balls are the molecule's own picture: an info-1 whose note says atom/letter/glyph/symbol counts as 0), never a
 *        window the measure called stuttery; a theme under 48 clips admits info 1 (a formula on the stage), then ui 1 (a sliver), only up to
 *        48 (the best grade first, one family at a time), and says so (036: a floor of 72 put a caption on a sixth of the light wall).
 *        Each kept window → pool/<theme>/<id>.mp4 (2.5 s from t, the centre square, 160 × 160, 30 fps — a 60-fps source keeps every second
 *        frame by count, never by its jittered clock; 30 keeps all; another rate goes through fps=30 — H.264 CRF 23, no sound) and
 *        pool/pool.json; prints the counts per theme and family
 *   node tools/menu-collage.mjs atlas [--in .tmp/collage]   4 THE ATLAS: per theme lab/img/menu/collage/<theme>.mp4 — 12 × 7 SLOTS of 160 px
 *        (1920 × 1120), 24 s = 12 BEATS of 2 s, 30 fps (720 frames, a keyframe every 240 so the loop's seek to 0 lands on one), H.264 high
 *        veryslow, CRF 31 (32 while a file passes 14.5 MB; a soft psy-rd and the dark-biased aq-mode 3 — a background under a veil keeps no
 *        grain), faststart, no sound, a seamless loop — its poster <theme>.webp (the first frame, 960 × 560) and collage.json (the slots'
 *        offsets and per family its source, look group and mean luma: the page's map)
 *   node tests/pwa.test.mjs --write                  5 img/menu/ is a DATA root (sw.js §1b): deployed, never precached
 *
 * THE DEAL: slot k's twelve clips come round-robin over the families (a family = one source video; a family leaves the round once its clips
 * have each been dealt twice the pool's mean, so a one-clip video cannot paper the wall), never one clip twice in a slot, never one family
 * twice running in a slot (the loop's wrap included), at no instant more than 4 slots on one family, and no LOOK GROUP (the source's folder,
 * and the name before a date when the file is a dated recording, case folded: one session's recordings and its edit are one look) over 25 %
 * of a theme's plays; a seeded PRNG, so it reproduces.  THE CAPS (036, Josh 11-03), never relaxed and spread evenly over the twelve beats:
 * the look 'black molecules' (the folder and BLACK MOLECULES.mp4) ≤ 8 % of a theme's plays; in LIGHT a dark-ground window (lum < 100) ≤ 12 %;
 * THE VANILLA RULE — a recording dated 2026-10-27 or later (NODES landed that day; the name's date, else the file's) ≤ 10 % in both themes.
 * THE STAGGER AND THE SEAM: slot k's offset is 0.5 × (k mod 4) s and clips[j] plays over [off + 2j, off + 2j + 2) modulo 24 — the strip
 * opens with clip 11's last `off` seconds and closes with its first 2 − off, so its cuts fall at off + 2m and the loop point runs on inside
 * clip 11 with no cut.  Each strip is a 24-s 160 × 160 intermediate (concat of trimmed pool clips, CRF 18), then one xstack of 84.
 * Needs ffmpeg (libx264, libwebp) at tool time only; the pool and the scout's work stay in .tmp/ (gitignored).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'lab/img/menu/collage');
const args = process.argv.slice(2), cmd = args[0], at = args.indexOf('--in');
const IN = resolve(ROOT, at >= 0 ? args[at + 1] : '.tmp/collage'), POOL = join(IN, 'pool');
const THEMES = ['dark', 'light'], FLOOR = 48, TILE = 160, COLS = 12, ROWS = 7, SLOTS = COLS * ROWS, BEATS = 12, BEAT = 2, FPS = 30, DUR = BEATS * BEAT, GROUP_CAP = 0.25;
const BLACK = 'black molecules', BLACK_CAP = 0.08, DARK_LUM = 100, DARK_CAP = 0.12, NODES_DAY = '2026-10-27', LATE_CAP = 0.10, BUDGET = 14.5 * 1048576;
const fail = (m) => { console.error('menu-collage: ' + m); process.exit(1); };
const run = promisify(execFile);
const ff = (a) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...a], { maxBuffer: 1 << 24 });
/** n jobs at a time */
async function jobs(list, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; await fn(list[k], k); } })); }
const mb = (f) => (statSync(f).size / 1048576).toFixed(2) + ' MB';

async function cut() {
  const cand = JSON.parse(readFileSync(join(IN, 'candidates.json'), 'utf8')), byId = new Map(cand.items.map((c) => [c.id, c]));
  const last = new Map(readFileSync(join(IN, 'verdicts.jsonl'), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)).map((v) => [v.id, v]));   // a later line amends
  const verdicts = [...last.values()].filter((v) => byId.has(v.id));
  const info = (v) => (v.info === 1 && /atom|letter|glyph|symbol/i.test(v.note || '') ? 0 : v.info);   // a molecule's atom letters are its picture
  const stuttery = (v) => (byId.get(v.id).stutter || {}).call === 'stuttery';   // the measure's call (menu-collage-scan.py --rescore)
  const pad = (n) => String(n).padStart(2, '0'), dayOf = (src) => { const m = src.match(/\d{4}-\d{2}-\d{2}/); if (m) return m[0];
    const d = statSync(join(cand.root, src)).mtime; return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };   // the name's date, else the file's
  const pool = { fps: FPS }, work = [], was = existsSync(join(POOL, 'pool.json')) ? JSON.parse(readFileSync(join(POOL, 'pool.json'), 'utf8')) : null;
  if (was && was.fps !== FPS) for (const th of THEMES) rmSync(join(POOL, th), { recursive: true, force: true });   // a new frame rate cuts the pool again
  if (!cand.items.some((c) => c.stutter)) console.log('menu-collage: no stutter measure in candidates.json — run `python3 tools/menu-collage-scan.py --rescore` first');
  for (const th of THEMES) {
    const mine = verdicts.filter((v) => v.theme === th), lw = mine.filter((v) => v.material === 'lw' && v.grade >= 2), good = lw.filter((v) => !stuttery(v));
    const ladder = [['clean', good.filter((v) => v.ui === 0 && info(v) === 0)], ['info-1', good.filter((v) => v.ui === 0 && info(v) === 1)], ['ui-1', good.filter((v) => v.ui === 1 && info(v) <= 1)]];
    const kept = [], said = { clean: 0, 'info-1': 0, 'ui-1': 0 };
    for (let [tier, rows] of ladder) {
      if (tier !== 'clean' && kept.length >= FLOOR) break;
      if (tier !== 'clean') {   // a lower tier fills the floor and no more (036): the best grade first, one family at a time
        const fams = new Map(); for (const v of [...rows].sort((a, b) => b.grade - a.grade || (a.id < b.id ? -1 : 1))) { const s = byId.get(v.id).src; if (!fams.has(s)) fams.set(s, []); fams.get(s).push(v); }
        const lists = [...fams.values()], out = []; for (let i = 0; out.length < FLOOR - kept.length && lists.some((l) => l.length); i = (i + 1) % lists.length) if (lists[i].length) out.push(lists[i].shift());
        console.log(`menu-collage: ${th} holds ${kept.length} clips (< ${FLOOR}): admitting ${out.length} of the ${rows.length} ${tier === 'info-1' ? 'with a formula on the stage (info 1)' : 'with a sliver of UI (ui 1)'}`);
        rows = out;
      }
      for (const v of rows) { const c = byId.get(v.id); kept.push({ id: v.id, src: c.src, t: c.t, tier, lum: c.lum, rate: (c.stutter || {}).rate || 0, day: dayOf(c.src) }); }
      said[tier] = rows.length;
    }
    kept.sort((a, b) => (a.id < b.id ? -1 : 1));
    pool[th] = kept;
    const fam = new Map(); for (const c of kept) fam.set(c.src, (fam.get(c.src) || 0) + 1);
    console.log(`menu-collage: ${th} — kept ${kept.length} (clean ${said.clean} · admitted info-1 ${said['info-1']} · admitted ui-1 ${said['ui-1']}) · refused as stuttery ${lw.length - good.length} · rejected ${mine.length - kept.length} of ${mine.length} · ${fam.size} families`);
    console.log('  ' + [...fam].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([f, n]) => `${f.replace(/\.(mp4|mkv|webm|mov)$/i, '')} ${n}`).join(' · '));
    const dir = join(POOL, th); mkdirSync(dir, { recursive: true });
    const want = new Set(kept.map((c) => c.id + '.mp4')), tWas = new Map(((was && was[th]) || []).map((c) => [c.id, c.t]));
    for (const f of readdirSync(dir)) if (!want.has(f)) rmSync(join(dir, f));   // the pool is exactly the kept set
    for (const c of kept) if (!existsSync(join(dir, c.id + '.mp4')) || tWas.get(c.id) !== c.t) work.push([c, join(dir, c.id + '.mp4')]);   // a rescued window moved: cut it again
  }
  const t0 = Date.now();
  /* 30 fps by frame count: a 60-fps recording's mkv clock steps 16 and 17 ms, and fps=30 would pick by that jitter (a held or a skipped frame) */
  const rateTo30 = (r) => { const k = Math.round(r / FPS); return k >= 1 && Math.abs(r / k - FPS) < 1.5 ? `${k > 1 ? `select='not(mod(n,${k}))',` : ''}setpts=N/${FPS}/TB,` : `fps=${FPS},`; };
  await jobs(work, 6, ([c, out]) => ff(['-ss', String(c.t), '-i', join(cand.root, c.src), '-t', '2.5', '-an', '-sn', '-dn',
    '-vf', `${rateTo30(c.rate)}crop='min(iw,ih)':'min(iw,ih)',scale=${TILE}:${TILE}:flags=lanczos,setsar=1`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-r', String(FPS), '-pix_fmt', 'yuv420p', out]));
  writeFileSync(join(POOL, 'pool.json'), JSON.stringify(pool, null, 1) + '\n');
  console.log(`menu-collage: ${work.length} clips cut in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${POOL}/<theme>/; next: node tools/menu-collage.mjs atlas`);
}

/** mulberry32 — the deal's seeded PRNG */
const prng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** a LOOK GROUP (the head): the source's folder, and the name before a date when the file is a dated recording, case folded */
const groupOf = (src) => { const i = src.lastIndexOf('/'), dir = src.slice(0, Math.max(0, i)), stem = src.slice(i + 1).replace(/\.[^.]+$/, ''), m = stem.match(/^(.*?)\d{4}-\d{2}-\d{2}/);
  return [dir, (m ? m[1] : stem).replace(/[\s_-]+$/, '')].filter(Boolean).join('/').toLowerCase(); };

/** THE DEAL (the head): slots[k] = { off, clips: [{ f, id }] × 12 } */
function deal(clips, families, seed, light) {
  const rnd = prng(seed), F = families.length, Q = DUR * 2, N = SLOTS * BEATS;   // Q: the half-second instants of the loop; N: the plays
  const groups = [...new Set(families.map(groupOf))], grp = families.map((f) => groups.indexOf(groupOf(f))), gUsed = new Array(groups.length).fill(0);
  const byFam = families.map((f) => shuffle(clips.filter((c) => c.src === f), rnd)), ptr = new Array(F).fill(0), used = new Array(F).fill(0);
  const late = byFam.map((l) => l[0].day >= NODES_DAY), black = grp.map((g) => groups[g] === BLACK);
  const cap = Math.ceil((2 * N) / clips.length), quota = byFam.map((l) => l.length * cap);
  const by = (share, j) => Math.ceil((share * N * (j + 1)) / BEATS);   // a cap spread over the beats: by the end of beat j, j + 1 twelfths of it
  const order = shuffle([...families.keys()], rnd), cnt = Array.from({ length: Q }, () => new Int16Array(F));
  const slots = Array.from({ length: SLOTS }, (_, k) => ({ off: 0.5 * (k % 4), clips: [] }));
  let rr = 0, relaxed = 0, lateUsed = 0, darkUsed = 0;
  for (let j = 0; j < BEATS; j++) for (const k of shuffle([...slots.keys()], rnd)) {
    const S = slots[k], prev = j ? S.clips[j - 1].f : -1, first = j === BEATS - 1 ? S.clips[0].f : -1;
    const qs = [0, 1, 2, 3].map((i) => (S.off * 2 + 4 * j + i) % Q), ids = new Set(S.clips.map((c) => c.id)), darkFull = light && darkUsed >= by(DARK_CAP, j);
    let pick = null;
    for (let pass = 0; pass < 3 && !pick; pass++) for (let n = 0; n < F && !pick; n++) {
      const f = order[(rr + n) % F];
      if (f === prev || f === first || (black[f] && gUsed[grp[f]] >= by(BLACK_CAP, j)) || (late[f] && lateUsed >= by(LATE_CAP, j))) continue;   // the caps: never relaxed
      if ((pass < 1 && used[f] >= quota[f]) || (pass < 2 && (gUsed[grp[f]] >= by(GROUP_CAP, j) || qs.some((q) => cnt[q][f] >= 4)))) continue;
      const L = byFam[f];
      for (let m = 0; m < L.length; m++) { const c = L[(ptr[f] + m) % L.length]; if (!ids.has(c.id) && !(darkFull && c.lum < DARK_LUM)) { pick = c; ptr[f] = (ptr[f] + m + 1) % L.length; break; } }
      if (pick) {
        rr = (rr + n + 1) % F; used[f]++; gUsed[grp[f]]++; for (const q of qs) cnt[q][f]++; S.clips.push({ f, id: pick.id }); if (pass === 2) relaxed++;
        if (late[f]) lateUsed++; if (light && pick.lum < DARK_LUM) darkUsed++;
      }
    }
    if (!pick) fail(`the deal ran dry at slot ${k}, beat ${j}: the pool is too thin for the family rules and the caps`);
  }
  let most = 0; for (const row of cnt) for (const n of row) most = Math.max(most, n);
  const shares = groups.map((g, i) => [g, gUsed[i] / N]).sort((a, b) => b[1] - a[1]);
  return { slots, used, cap, most, relaxed, shares, late: lateUsed / N, dark: light ? darkUsed / N : null };
}

async function atlas() {
  const poolFile = join(POOL, 'pool.json'); if (!existsSync(poolFile)) fail('no pool: run `node tools/menu-collage.mjs cut` first');
  const pool = JSON.parse(readFileSync(poolFile, 'utf8')); if (pool.fps !== FPS) fail(`the pool was cut at ${pool.fps || 30} fps, the atlas wants ${FPS}: run cut again`);
  const work = join(IN, 'slots'), manifest = { tile: TILE, cols: COLS, rows: ROWS, fps: FPS, dur: DUR, beat: BEAT, themes: {} };   // (strips/ is the measure's filmstrips)
  mkdirSync(OUT, { recursive: true }); mkdirSync(work, { recursive: true });
  const offF = (off) => Math.round(off * FPS), A = Math.round(0.2 * FPS), B = A + BEAT * FPS;   // a clip's 2 s are its pool file's [0.2, 2.2) — the middle of the scout's window
  for (const [ti, th] of THEMES.entries()) {
    const clips = pool[th] || []; if (clips.length < 12) fail(`${th}: ${clips.length} clips — a slot needs twelve`);
    const families = [...new Set(clips.map((c) => c.src))].sort();
    const { slots, used, cap, most, relaxed, shares, late, dark } = deal(clips, families, 35 + ti, th === 'light');
    console.log(`menu-collage: ${th} — ${clips.length} clips · ${families.length} families · a clip dealt at most ${cap}× · the most slots on one family at an instant ${most}${relaxed ? ` (${relaxed} placements past the 4-slot rule)` : ''} · placements per family ${Math.min(...used)}–${Math.max(...used)}`);
    console.log(`  the caps: ${BLACK} ${(100 * ((shares.find(([g]) => g === BLACK) || [0, 0])[1])).toFixed(1)} % (≤ ${BLACK_CAP * 100}) · dated ${NODES_DAY} on ${(100 * late).toFixed(1)} % (≤ ${LATE_CAP * 100})${dark === null ? '' : ` · a dark ground (lum < ${DARK_LUM}) ${(100 * dark).toFixed(1)} % (≤ ${DARK_CAP * 100})`}`);
    const t0 = Date.now();
    await jobs(slots, 8, async (S, k) => {
      const ids = [...new Set(S.clips.map((c) => c.id))], o = offF(S.off), segs = [];
      const seg = (id, a, b) => { if (b > a) segs.push([ids.indexOf(id), a, b]); };
      seg(S.clips[BEATS - 1].id, B - o, B);                                  // clip 11's last `off` seconds open the strip…
      for (let j = 0; j < BEATS - 1; j++) seg(S.clips[j].id, A, B);
      seg(S.clips[BEATS - 1].id, A, B - o);                                  // …and its first 2 − off close it: the loop point runs on inside it
      const graph = segs.map(([i, a, b], n) => `[${i}:v]trim=start_frame=${a}:end_frame=${b},setpts=PTS-STARTPTS[s${n}]`).join(';') + ';' + segs.map((_, n) => `[s${n}]`).join('') + `concat=n=${segs.length}:v=1:a=0[v]`;
      await ff([...ids.flatMap((id) => ['-i', join(POOL, th, id + '.mp4')]), '-filter_complex', graph, '-map', '[v]', '-frames:v', String(DUR * FPS), '-r', String(FPS),
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', join(work, `${th}-${k}.mp4`)]);
    });
    const t1 = Date.now(), mp4 = join(OUT, th + '.mp4'), layout = slots.map((_, k) => `${(k % COLS) * TILE}_${Math.floor(k / COLS) * TILE}`).join('|');
    const stack = (crf) => ff([...slots.flatMap((_, k) => ['-i', join(work, `${th}-${k}.mp4`)]), '-filter_complex', `xstack=inputs=${SLOTS}:layout=${layout}[v]`, '-map', '[v]',
      '-frames:v', String(DUR * FPS), '-r', String(FPS), '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(crf), '-g', '240', '-keyint_min', '240',
      '-x264-params', 'psy-rd=0.4,0:aq-mode=3', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    console.log(`  look groups (${shares.length}, at most ${GROUP_CAP * 100} % each): ` + shares.map(([g, x]) => `${g} ${(100 * x).toFixed(1)} %`).join(' · '));
    let crf = 31, steps = []; await stack(crf);
    while (statSync(mp4).size > BUDGET && crf < 32) { steps.push(`CRF ${crf} ${mb(mp4)}`); crf++; await stack(crf); }
    if (steps.length) console.log(`menu-collage: ${th} passed ${BUDGET / 1048576} MB at ${steps.join(', ')}`);
    const t2 = Date.now();
    await ff(['-i', mp4, '-frames:v', '1', '-vf', `scale=${(COLS * TILE) / 2}:${(ROWS * TILE) / 2}:flags=lanczos`, '-c:v', 'libwebp', '-quality', '80', join(OUT, th + '.webp')]);
    for (let k = 0; k < SLOTS; k++) rmSync(join(work, `${th}-${k}.mp4`), { force: true });
    const lumOf = (f) => { const l = clips.filter((c) => c.src === f); return Math.round(l.reduce((a, c) => a + c.lum, 0) / l.length); };
    manifest.themes[th] = { slots: slots.map((S) => ({ off: S.off, clips: S.clips.map((c) => c.f) })), families: families.map((f) => ({ src: f, look: groupOf(f), lum: lumOf(f) })) };
    console.log(`menu-collage: ${th} → lab/img/menu/collage/${th}.mp4 ${mb(mp4)} (CRF ${crf}) + ${th}.webp ${mb(join(OUT, th + '.webp'))} · strips ${((t1 - t0) / 1000).toFixed(1)} s · atlas ${((t2 - t1) / 1000).toFixed(1)} s`);
  }
  rmSync(work, { recursive: true, force: true });
  writeFileSync(join(OUT, 'collage.json'), JSON.stringify(manifest) + '\n');
  console.log('menu-collage: lab/img/menu/collage/collage.json written. Next: node tests/pwa.test.mjs --write');
}

if (cmd === 'cut') await cut();
else if (cmd === 'atlas') await atlas();
else fail('usage: cut [--in .tmp/collage]  ·  atlas [--in .tmp/collage]   (the head of this file names the five steps)');
