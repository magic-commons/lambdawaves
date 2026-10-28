// 021 D2 · THE LAWS DIFF — run once, not a gate: proves the CLAUDE.md split lost no law.
// It splits the OLD CLAUDE.md (git show <rev>:CLAUDE.md) and the NEW set (CLAUDE.md + docs/laws/*.md) into sentences
// (paragraphs first — a blank line, a heading, a line ending in ')' — then a break after '. ' or '; ', whitespace normalised) and prints
// every old sentence that appears in no new file.
//   node tools/laws-diff.mjs <rev>        e.g. node tools/laws-diff.mjs 2031041
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const rev = process.argv[2];
if (!rev) { console.error('usage: node tools/laws-diff.mjs <rev>'); process.exit(2); }
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const sentences = (s) => s.split(/\n\s*\n|\n(?=#)|(?<=\))\n/).flatMap((p) => norm(p).split(/(?<=\.) |(?<=;) /)).map((x) => x.trim()).filter((x) => x.length > 2);

const old = execFileSync('git', ['show', `${rev}:CLAUDE.md`], { encoding: 'utf8' });
const files = ['CLAUDE.md', ...readdirSync('docs/laws').filter((f) => f.endsWith('.md')).sort().map((f) => `docs/laws/${f}`)];
const NEW = files.map((f) => norm(readFileSync(f, 'utf8'))).join(' \u0000 ');

const all = sentences(old), lost = all.filter((s) => !NEW.includes(s));
const words = (t) => t.split(/\s+/).filter(Boolean).length;
console.log(`old CLAUDE.md @ ${rev}: ${all.length} sentences, ${words(old)} words`);
for (const f of files) console.log(`  ${f}: ${words(readFileSync(f, 'utf8'))} words`);
console.log(`old sentences found in no new file: ${lost.length}`);
for (const s of lost) console.log('  LOST · ' + (s.length > 220 ? s.slice(0, 220) + ' …' : s));
