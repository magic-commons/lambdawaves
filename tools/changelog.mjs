#!/usr/bin/env node
/* tools/changelog.mjs — generate CHANGELOG.md from the git tags and REPORT.md's wave headings.
 *   node tools/changelog.mjs            write CHANGELOG.md at the repo root
 *   node tools/changelog.mjs --check    write nothing; exit 1 if the file on disk is out of date
 *   node tools/changelog.mjs --stdout   print the document to stdout, write nothing
 *
 * STDOUT CARRIES THE DOCUMENT AND NOTHING ELSE — under `--check`, which prints no document, it carries
 * the one-line verdict and nothing else.  The run summary and every warning go to STDERR, so
 * `node tools/changelog.mjs --stdout > FILE` produces a file BYTE-IDENTICAL to the CHANGELOG.md a plain
 * run writes — while the summary is still on the terminal where it is useful.  It used to be written to
 * stdout beside the document, so the obvious `--stdout > CHANGELOG.md` minted a file with eight stray
 * lines in it that then failed `--check` for ever.  Advice is not product; it does not share the pipe.
 *
 * WHY THIS EXISTS.  REPORT.md is the LAB NOTEBOOK: laws, constants, measured numbers, named proofs, written
 * for whoever builds next.  It is not release notes and it is not for users.  CHANGELOG.md is the other half
 * — keyed to GIT TAGS, short enough for a human, saying what changed between releases.  This tool derives the
 * second from the first plus git, so the two can never drift and nobody has to keep a list by hand.
 *
 * WHICH WAVES BELONG TO WHICH RELEASE — derived, never declared.  For each tag, oldest first, REPORT.md is read
 * AS IT STOOD AT THAT TAG (`git show <tag>:REPORT.md`).  A wave belongs to the first release whose REPORT.md
 * contains it.  Waves in the working tree that no tag has ever seen are UNRELEASED.  Nothing is parsed out of
 * commit messages, so a freeze message that miscounts its own waves cannot mislead this file.
 *
 * THE SHAPE A WAVE HEADING MUST HAVE:
 *
 *     ### wave <NN>: <the one line of what it was>
 *     ### wave <NN> (<aside>): <the one line of what it was>          <- the aside is optional
 *
 * The line after the colon is copied VERBATIM.  This tool never summarises, never rewrites, and never reads a
 * word of the body underneath a heading — that body is notebook material and stays in the notebook.
 *
 * FAILING LOUDLY.  Any line that starts `### wave` but does not match the shape above is a PARSE FAILURE, and
 * the two cases are treated differently on purpose:
 *   - in the WORKING TREE's REPORT.md — the file you can still fix — the run ABORTS, writes nothing, and exits
 *     1, because a changelog that silently drops a wave is worse than no changelog.
 *   - in a TAGGED REPORT.md — history, which cannot be edited — the heading is reported on stderr and carried
 *     into the document verbatim, marked `(heading not in the expected shape)`.  A permanent abort on immutable
 *     history is exactly how a tool like this rots into something nobody runs.
 * A gap or a duplicate in the wave numbering is reported the same loud way (a gap is what a dropped wave looks
 * like), but does not abort — the numbering genuinely starts at wave 2, wave 1 being the original QWAVE-0 core.
 *
 * DETERMINISM, which is the other thing that stops it rotting.  Two runs with no repo change produce a
 * byte-identical file: there is no generation timestamp, no locale-dependent formatting, no hash of anything
 * that moves.  Every date is the tagged COMMIT's own date in the timezone the commit recorded (`--date=short`,
 * not `short-local`), every list is sorted by a total order, every line ends in \n.
 *
 * AND THE STRONGER RULE THE ABOVE IS ONLY HALF OF: the generated file depends on the TAGS, the COMMITS and the
 * WAVE HEADINGS, and on nothing else.  In particular it does NOT record how dirty the working tree is.  A count
 * of changed files moves on every save of every unrelated file, so a `--check` gate wired to a document
 * containing one would be red permanently, and a check that is always red is one people learn to ignore.  Those
 * counts are printed to stderr as advice instead, where they are useful and cost nothing.  The consequence is
 * the property that makes `--check` worth wiring up: it is GREEN in a dirty working tree whose waves, tags and
 * commits have not changed, and RED the moment any of those three do — including a wave heading edited in an
 * uncommitted REPORT.md, which is release content and is read from the working tree on purpose.
 *
 * NO DEPENDENCIES — node's standard library and `git`, matching the charter of the rest of the project.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REPORT = 'REPORT.md';
const OUT = join(ROOT, 'CHANGELOG.md');

const ARGS = new Set(process.argv.slice(2));
const CHECK = ARGS.has('--check');
const TO_STDOUT = ARGS.has('--stdout');
for (const a of ARGS) if (!['--check', '--stdout'].includes(a)) die(`unknown argument: ${a}\nusage: node tools/changelog.mjs [--check|--stdout]`);

function die(msg) { process.stderr.write(`\n  CHANGELOG: ${msg}\n\n`); process.exit(1); }
function git(...args) {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { die(`git ${args.join(' ')} failed:\n  ${String(e.stderr || e.message).trim()}`); }
}

/* ── the parser ──────────────────────────────────────────────────────────────────────────────────────────── */

const WAVE_LINE = /^###[ \t]+wave\b/i;                       // it CLAIMS to be a wave heading …
const WAVE_SHAPE = /^### wave (\d{1,3})(?: \(([^()]*)\))?: (\S.*?)[ \t]*$/;   // … and this is the shape it must have

/* Returns { waves: Map<number, {n, aside, text, line}>, bad: [{line, raw}], claimed: number }.
 * `text` is everything after the colon, verbatim, right-trimmed only. */
function parseWaves(source, whence) {
  const waves = new Map();
  const bad = [];
  const dupes = [];
  let claimed = 0;
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!WAVE_LINE.test(raw)) continue;
    claimed++;
    const m = WAVE_SHAPE.exec(raw);
    if (!m) { bad.push({ line: i + 1, raw: raw.trimEnd() }); continue; }
    const n = Number(m[1]);
    const wave = { n, aside: m[2] || null, text: m[3], line: i + 1, whence };
    if (waves.has(n)) dupes.push({ n, first: waves.get(n).line, again: i + 1 });
    else waves.set(n, wave);
  }
  return { waves, bad, dupes, claimed };
}

/* ── the git side ────────────────────────────────────────────────────────────────────────────────────────── */

/* Tags oldest first.  creatordate is the tag's date for an annotated tag and the commit's for a lightweight
 * one; the tag name breaks a tie, so the order is total and stable. */
function tagsOldestFirst() {
  const out = git('for-each-ref', '--format=%(refname:short)%09%(creatordate:unix)', 'refs/tags').trim();
  if (!out) return [];
  return out.split('\n').map(l => { const [name, when] = l.split('\t'); return { name, when: Number(when) }; })
    .sort((a, b) => a.when - b.when || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

function commitOf(ref) { return git('rev-list', '-n', '1', ref).trim(); }

function commitMeta(sha) {
  const [short, date, subject] = git('show', '-s', '--date=short', '--format=%h%x09%cd%x09%s', sha).trim().split('\t');
  return { sha, short, date, subject };
}

/* The commits in `range`, oldest first, one line each. */
function commitsIn(range) {
  const out = git('log', '--reverse', '--date=short', '--format=%h%x09%cd%x09%s', range).trim();
  return out ? out.split('\n').map(l => { const [short, date, subject] = l.split('\t'); return { short, date, subject }; }) : [];
}

/* REPORT.md as it stood at `ref`, or null if the path did not exist there. */
function reportAt(ref) {
  try { return execFileSync('git', ['show', `${ref}:${REPORT}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch { return null; }
}

/* A commit subject, cut to something a changelog line can hold.  Deterministic: the first em-dash clause if
 * there is one and it is long enough to stand alone, else a hard cut on a word boundary. */
function trimSubject(s) {
  const dash = s.indexOf(' — ');
  if (dash >= 12 && dash <= 72) return s.slice(0, dash);
  if (s.length <= 96) return s;
  const cut = s.lastIndexOf(' ', 96);
  return s.slice(0, cut > 48 ? cut : 96) + '…';
}

/* ── gather ──────────────────────────────────────────────────────────────────────────────────────────────── */

if (!existsSync(join(ROOT, REPORT))) die(`${REPORT} not found at ${ROOT}`);
const workingReport = readFileSync(join(ROOT, REPORT), 'utf8');
const working = parseWaves(workingReport, 'working tree');

const warnings = [];

/* The working tree is the file that can still be fixed, so a bad heading there is fatal. */
if (working.bad.length) {
  const lines = working.bad.map(b => `    ${REPORT}:${b.line}  ${b.raw}`).join('\n');
  die(`${working.bad.length} wave heading${working.bad.length === 1 ? '' : 's'} in the working ${REPORT} `
    + `do${working.bad.length === 1 ? 'es' : ''} not match the expected shape, so ${working.bad.length} wave`
    + `${working.bad.length === 1 ? '' : 's'} would be dropped.  Nothing was written.\n\n${lines}\n\n`
    + `  the shape is:  ### wave NN: one line of what it was\n`
    + `           or:   ### wave NN (aside): one line of what it was`);
}
for (const d of working.dupes) warnings.push(`${REPORT}:${d.again} — wave ${d.n} is declared twice (first at line ${d.first}); the second was ignored`);

const tags = tagsOldestFirst();
const releases = [];
const seen = new Set();       // wave numbers already released
let previousCommit = null;

for (const tag of tags) {
  const sha = commitOf(tag.name);
  const meta = commitMeta(sha);
  const src = reportAt(tag.name);
  let parsed = { waves: new Map(), bad: [], dupes: [], claimed: 0 };
  if (src === null) warnings.push(`${tag.name} — ${REPORT} did not exist at this tag; the release lists no waves`);
  else {
    parsed = parseWaves(src, tag.name);
    for (const b of parsed.bad) warnings.push(`${tag.name}:${REPORT}:${b.line} — heading not in the expected shape, carried through verbatim: ${b.raw}`);
    for (const d of parsed.dupes) warnings.push(`${tag.name}:${REPORT}:${d.again} — wave ${d.n} declared twice`);
  }
  const fresh = [...parsed.waves.values()].filter(w => !seen.has(w.n)).sort((a, b) => a.n - b.n);
  for (const w of fresh) seen.add(w.n);
  releases.push({
    kind: 'tag', tag: tag.name, meta, waves: fresh, unparsed: parsed.bad,
    commits: commitsIn(previousCommit ? `${previousCommit}..${sha}` : sha),
  });
  previousCommit = sha;
}

/* Anything in the working tree no tag has seen. */
const head = commitMeta(commitOf('HEAD'));
const unreleasedWaves = [...working.waves.values()].filter(w => !seen.has(w.n)).sort((a, b) => a.n - b.n);
const unreleasedCommits = previousCommit ? commitsIn(`${previousCommit}..HEAD`) : (tags.length ? [] : commitsIn('HEAD'));
/* CHANGELOG.md is EXCLUDED from this count, and that exclusion is what makes the tool idempotent: the file
 * this run writes is itself a change to the working tree, so counting it would make every second run differ
 * from the first.  Anything the tool generates must be invisible to the tool. */
const porcelain = git('status', '--porcelain=v1', '--', '.', ':(exclude)CHANGELOG.md').trim();
const dirtyLines = porcelain ? porcelain.split('\n') : [];
const modified = dirtyLines.filter(l => !l.startsWith('??')).length;
const untracked = dirtyLines.filter(l => l.startsWith('??')).length;
/* NOTE the absence of `dirtyLines` here, and see the header: whether the tree is dirty is advice for stdout,
 * never a fact in the document.  An UNRELEASED section exists when there is unreleased RELEASE CONTENT. */
const hasUnreleased = unreleasedWaves.length > 0 || unreleasedCommits.length > 0;

/* A wave that a tag once had and the working tree no longer does — the other way a wave goes missing. */
const vanished = [...seen].filter(n => !working.waves.has(n)).sort((a, b) => a - b);
for (const n of vanished) warnings.push(`wave ${n} was in a released ${REPORT} and is not in the working one`);

/* Gaps in the numbering.  Wave 1 is the original QWAVE-0 core and was never given a heading, so a run that
 * starts at 2 is normal; a hole in the middle is not. */
const numbers = [...working.waves.keys()].sort((a, b) => a - b);
const gaps = [];
for (let i = 1; i < numbers.length; i++) for (let n = numbers[i - 1] + 1; n < numbers[i]; n++) gaps.push(n);
for (const n of gaps) warnings.push(`wave ${n} is missing from the numbering (waves ${numbers[0]}–${numbers[numbers.length - 1]} otherwise run unbroken)`);

/* ── render ──────────────────────────────────────────────────────────────────────────────────────────────── */

function waveLine(w) {
  return `- **wave ${w.n}**${w.aside ? ` (${w.aside})` : ''}: ${w.text}`;
}

const doc = [];
const put = s => doc.push(s);

put('# λWAVES — CHANGELOG');
put('');
put('What changed between releases, newest first.  A release is a **git tag**; the work inside one is counted in');
put('**waves**, one line each, in the words the wave gave itself.');
put('');
put('This file is GENERATED — `node tools/changelog.mjs` — from the git tags and the wave headings in `REPORT.md`.');
put('Do not edit it by hand; edit the heading in `REPORT.md` and run the tool again.');
put('');
put('`REPORT.md` is the other document and it is not this one: it is the lab notebook — the laws, the constants, the');
put('measured numbers and the named proofs, for whoever builds next.  It is not release notes; it ships beside the application as the engineering record.');
put('');

if (hasUnreleased) {
  put('---');
  put('');
  put('## UNRELEASED — not frozen');
  put('');
  const since = tags.length ? `\`${tags[tags.length - 1].name}\`` : 'the start of the repository';
  const bits = [];
  if (unreleasedWaves.length) bits.push(`${unreleasedWaves.length} wave${unreleasedWaves.length === 1 ? '' : 's'}`);
  bits.push(`${unreleasedCommits.length} commit${unreleasedCommits.length === 1 ? '' : 's'}`);
  put(`Work since ${since} — ${bits.join(', ')}.  **Nothing here is frozen**: no tag points at it, the numbers may`);
  put('still move, and it may be amended or dropped before a release carries it.  How dirty the working tree is on');
  put('any given afternoon is deliberately not recorded here — it changes on every save, and this file has to stay');
  put('stable enough to gate on.');
  put('');
  if (unreleasedWaves.length) {
    for (const w of unreleasedWaves) put(waveLine(w));
    put('');
  } else {
    put('_No new waves — changes to work already released._');
    put('');
  }
  if (unreleasedCommits.length) {
    put('<details><summary>commits</summary>');
    put('');
    for (const c of unreleasedCommits) put(`- \`${c.short}\` ${c.date} — ${trimSubject(c.subject)}`);
    put('');
    put('</details>');
    put('');
  }
}

for (const r of [...releases].reverse()) {
  put('---');
  put('');
  put(`## \`${r.tag}\` — ${r.meta.date}`);
  put('');
  const waveRange = r.waves.length
    ? (r.waves.length === 1 ? `wave ${r.waves[0].n}` : `waves ${r.waves[0].n}–${r.waves[r.waves.length - 1].n}`)
    : 'no new waves';
  put(`Commit \`${r.meta.short}\` · ${waveRange} · ${r.commits.length} commit${r.commits.length === 1 ? '' : 's'}.`);
  put('');
  if (r.waves.length) {
    for (const w of r.waves) put(waveLine(w));
    put('');
    /* Purely factual, and only where the numbering itself raises the question: the first wave heading in
     * REPORT.md is not wave 1, so an outsider counting from 1 is owed the reason the list starts where it does. */
    if (numbers.length && r.waves[0].n === numbers[0] && numbers[0] > 1) {
      put(`_The numbering starts at wave ${numbers[0]}: \`${REPORT}\` carries no heading for wave `
        + `${numbers[0] === 2 ? '1' : `1–${numbers[0] - 1}`}, the work before the waves were numbered — it is in the commits below._`);
      put('');
    }
  }
  else { put('_No wave headings appeared for the first time in this release._'); put(''); }
  for (const b of r.unparsed) put(`- _(heading not in the expected shape, carried through verbatim)_ ${b.raw.replace(/^###\s*/, '')}`);
  if (r.unparsed.length) put('');
  if (r.commits.length) {
    put('<details><summary>commits</summary>');
    put('');
    for (const c of r.commits) put(`- \`${c.short}\` ${c.date} — ${trimSubject(c.subject)}`);
    put('');
    put('</details>');
    put('');
  }
}

const text = doc.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n');

/* ── land it ─────────────────────────────────────────────────────────────────────────────────────────────── */

const wavesReleased = releases.reduce((n, r) => n + r.waves.length, 0);
const unparsedInHistory = releases.reduce((n, r) => n + r.unparsed.length, 0);

if (TO_STDOUT) { process.stdout.write(text); }
else if (CHECK) {
  const on_disk = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  if (on_disk === text) process.stdout.write('CHANGELOG.md is up to date.\n');
  else die(`CHANGELOG.md is ${on_disk === null ? 'missing' : 'out of date'}.  Run: node tools/changelog.mjs`);
} else {
  writeFileSync(OUT, text, 'utf8');
}

const w = process.stderr;
if (warnings.length) {
  w.write(`\n  ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:\n`);
  for (const line of warnings) w.write(`    ${line}\n`);
}
/* The summary is ADVICE ABOUT THE RUN, not the document, so it goes to stderr beside the warnings —
   in one stream, in order, and never in the pipe that `--stdout` is filling. */
const out = process.stderr;
out.write('\n');
out.write(`  ${REPORT}      ${working.claimed} wave heading${working.claimed === 1 ? '' : 's'} claimed, `
  + `${working.waves.size} parsed, ${working.bad.length} unparsable   (waves ${numbers[0]}–${numbers[numbers.length - 1]})\n`);
out.write(`  releases       ${releases.length} tag${releases.length === 1 ? '' : 's'}`
  + `${hasUnreleased ? ' + UNRELEASED' : ''}, ${wavesReleased} wave${wavesReleased === 1 ? '' : 's'} released, `
  + `${unreleasedWaves.length} not yet frozen\n`);
for (const r of releases) {
  const range = r.waves.length ? (r.waves.length === 1 ? `wave ${r.waves[0].n}` : `waves ${r.waves[0].n}–${r.waves[r.waves.length - 1].n}`) : '—';
  out.write(`    ${r.tag.padEnd(13)}${r.meta.date}  ${r.meta.short}  ${range} (${r.waves.length})\n`);
}
if (hasUnreleased) {
  const range = unreleasedWaves.length ? (unreleasedWaves.length === 1 ? `wave ${unreleasedWaves[0].n}` : `waves ${unreleasedWaves[0].n}–${unreleasedWaves[unreleasedWaves.length - 1].n}`) : '—';
  out.write(`    ${'UNRELEASED'.padEnd(13)}${head.date}  ${head.short}  ${range} (${unreleasedWaves.length}), ${unreleasedCommits.length} commit${unreleasedCommits.length === 1 ? '' : 's'}\n`);
}
/* Advice, not content — this is the number that must never reach the file. */
out.write(`  working tree   ${modified} tracked file${modified === 1 ? '' : 's'} changed, ${untracked} untracked `
  + `(not recorded in CHANGELOG.md, so --check stays green through a dirty tree)\n`);
if (unparsedInHistory) out.write(`  history        ${unparsedInHistory} heading${unparsedInHistory === 1 ? '' : 's'} in a tagged ${REPORT} were not in the expected shape (carried through verbatim)\n`);
if (!TO_STDOUT && !CHECK) out.write(`  CHANGELOG.md   written, ${text.split('\n').length - 1} lines, ${Buffer.byteLength(text)} bytes\n`);
out.write('\n');

