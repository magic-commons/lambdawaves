// sonnet2-g: every double-quoted span in PLAN-DRAFT-2 (>= 10 chars) split at "…", normalised, looked up verbatim in NACRE.md, CHAT-AND-ASKS.md, the SPEC lines it cites, and the two vault DRAFT-3 files.
import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/research';
const VAULT = '/home/joshua-hosain/Documents/OBSIDIAN/LAMB of WAVES/for CLAUDE/';
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const norm = (s) => s.replace(/[*`_]/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/\\\*/g, '*').trim().toLowerCase();
const corpusFiles = [ROOT + '/release-0.6.0/NACRE.md', ROOT + '/release-0.5.4/survey/CHAT-AND-ASKS.md', ROOT + '/release-0.6.0/census/SYSTEMS.md', ROOT + '/release-0.6.0/census/REPRESENTATIONS.md',
  VAULT + 'CLAUDE YAN — NACRE RESEARCH ROUND 2 — 2026-10-10/DRAFT-3.md', VAULT + 'CLAUDE YAN — NACRE RESEARCH 0.6.0 — 2026-10-10/DRAFT-3.md', VAULT + 'CLAUDE YAN — NACRE RESEARCH ROUND 2 — 2026-10-10/NACRE.md'];
const corpus = corpusFiles.map((f) => ({ f: path.basename(path.dirname(f)).slice(0, 30) + '/' + path.basename(f), t: norm(read(f)) }));
const plan = read(ROOT + '/release-0.6.0/PLAN-DRAFT-2.md');
const spans = []; const re = /"([^"\n]{10,}?)"/g; let m;
while ((m = re.exec(plan))) spans.push({ raw: m[1], line: plan.slice(0, m.index).split('\n').length });
// also blockquote lines (H)
plan.split('\n').forEach((l, i) => { if (l.startsWith('> ')) spans.push({ raw: l.slice(2), line: i + 1, block: true }); });
const out = spans.map((s) => {
  const frags = s.raw.split(/…|\.\.\./).map((x) => x.trim()).filter((x) => x.length >= 8);
  const hits = frags.map((fr) => { const n = norm(fr); const w = corpus.find((c) => c.t.includes(n)); return { fr: fr.slice(0, 70), where: w ? w.f : null }; });
  return { line: s.line, raw: s.raw.slice(0, 140), frags: hits, verbatim: hits.length > 0 && hits.every((h) => h.where) };
});
const josh = out; // classify later by hand
fs.writeFileSync(new URL('./sonnet2-g-quotes.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('spans', out.length, 'verbatim-found', out.filter((o) => o.verbatim).length, 'not found', out.filter((o) => !o.verbatim).length);
for (const o of out.filter((o) => !o.verbatim)) console.log(o.line, '|', o.raw, '|', o.frags.filter((f) => !f.where).map((f) => f.fr).join(' ¦ '));
