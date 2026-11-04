#!/usr/bin/env node
/* tools/demo-colors.mjs — 036 P5 · THE DEMOS' COLOURS (Josh 2026-11-03: "for your own personal demo projects you made, update and choose more
 * random colorful colors … in the timeline clips instead of grey"): every curve of a demo's timeline (lab/demos/*.lambdawaves.json, the
 * folder DEMOS) gets one hue of the instrument's HSV wheel at s .85 v 1 (the kit's hsvWheel formula, mir/palette.js), in GOLDEN-ANGLE order
 * from a seed taken from the demo's name — ordered by the first lane the curve's clips sit on, so neighbouring lanes stand far apart; an AUDIO
 * curve keeps AUDIO_TINT.  The file's `saved` stamp moves to the run's time so every browser's seeded copy refreshes (project-store.js
 * starterOf: revision = saved + '·cover').  The covers are the stage, never the clips: tools/make-covers.mjs need not run.
 *   node tools/demo-colors.mjs [file …]   (default: every STARTER with a timeline; writes in place, each file's own trailing newline kept) */
import { readFileSync, writeFileSync } from 'node:fs';
import { STARTERS } from '../lab/project-store.js';
import { rgbToHex } from '../lab/mir/palette.js';
import { AUDIO_TINT } from '../lab/mir/timeline/audio-kind.js';

const files = process.argv.slice(2).length ? process.argv.slice(2) : STARTERS.map((s) => s.file);
const GOLD = (Math.sqrt(5) - 1) / 2;   // 0.618… of a turn = the golden angle (137.5°) taken the other way round
/** one hue h (0…1) of the kit's hsvWheel at s, v */
const hsv = (h, s = 0.85, v = 1) => [h * 6 % 6, (h * 6 + 4) % 6, (h * 6 + 2) % 6].map((x) => v * (1 - s + s * Math.min(1, Math.max(0, Math.abs(x - 3) - 1))));
const seed = (t) => { let h = 2166136261 >>> 0; for (const c of t) { h = (h ^ c.codePointAt(0)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return (h % 3600) / 3600; };
const stamp = new Date().toISOString();
for (const file of files) {
  const url = new URL(`../lab/demos/${file}.lambdawaves.json`, import.meta.url), text = readFileSync(url, 'utf8'), j = JSON.parse(text);
  const T = j.data && j.data.presentation && j.data.presentation.timeline;
  if (!T || !Array.isArray(T.curves) || !T.curves.length) { console.log(`${file}: no timeline — untouched`); continue; }
  const laneAt = new Map((T.lanes || []).map((l, i) => [l.id, i])), first = new Map();
  for (const c of T.clips || []) { const i = laneAt.has(c.laneId) ? laneAt.get(c.laneId) : 1e9; if (!first.has(c.curveId) || i < first.get(c.curveId)) first.set(c.curveId, i); }
  const plain = T.curves.map((c, k) => ({ c, k })).filter(({ c }) => c.kind !== 'audio').sort((a, b) => (first.get(a.c.id) ?? 1e9) - (first.get(b.c.id) ?? 1e9) || a.k - b.k);
  const h0 = seed(j.name || file);
  plain.forEach(({ c }, i) => { c.color = rgbToHex(hsv((h0 + i * GOLD) % 1)); });
  for (const c of T.curves) if (c.kind === 'audio') c.color = AUDIO_TINT;
  j.saved = stamp;
  writeFileSync(url, JSON.stringify(j, null, 1) + (text.endsWith('\n') ? '\n' : ''));
  console.log(`${file}: ${plain.length} curves coloured (${plain.map(({ c }) => c.color).join(' ')}), ${T.curves.length - plain.length} audio kept ${AUDIO_TINT}; saved ${stamp}`);
}
