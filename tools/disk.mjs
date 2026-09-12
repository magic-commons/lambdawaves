#!/usr/bin/env node
/* tools/disk.mjs — write THE DISK: one markdown holding every research document of this project, in full, in order,
 * so another model reads one file instead of a folder.  `node tools/disk.mjs [research-dir] [out.md]`.
 * Order: the date in the file name or path (YYYY-MM-DD) ascending, then path; undated files first by path.
 * Every .md is inlined verbatim under its own heading with path, date, size; everything else (scripts, JSON,
 * images, logs) is listed in an index with its size — a DISK is prose and mathematics, not a zip. */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = process.argv[2] || 'research', out = process.argv[3] || join(root, 'DISK.md');
const walk = (d, acc = []) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p, acc); else acc.push(p); } return acc; };
const files = walk(root).filter((p) => relative(root, p) !== relative(root, out)).sort();
const dateOf = (p) => { const m = p.match(/(20\d\d-\d\d-\d\d)/); return m ? m[1] : (statSync(p).mtime.toISOString().slice(0, 10)); };
const docs = files.filter((p) => extname(p) === '.md').sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || a.localeCompare(b));
const rest = files.filter((p) => extname(p) !== '.md');
const title = relative(process.cwd(), root).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim() || 'RESEARCH';
let md = `# THE DISK · ${title}\n\nBuilt ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by tools/disk.mjs from \`${root}/\`: ${docs.length} documents inlined in full (${(docs.reduce((s, p) => s + statSync(p).size, 0) / 1e6).toFixed(2)} MB), ${rest.length} artefacts indexed by path. Read it top to bottom; each document begins with a heading naming its path and date, and its own headings are demoted one level so the DISK's outline is the folder's outline.\n\n## CONTENTS\n\n`;
docs.forEach((p, i) => { md += `${i + 1}. [${relative(root, p)}](#doc-${i + 1}) · ${dateOf(p)} · ${(statSync(p).size / 1024).toFixed(0)} kB\n`; });
md += `\n## ARTEFACTS (not inlined)\n\n| path | bytes |\n|---|---|\n` + rest.map((p) => `| ${relative(root, p)} | ${statSync(p).size} |`).join('\n') + '\n';
docs.forEach((p, i) => {
  const body = readFileSync(p, 'utf8').replace(/^(#{1,5}) /gm, (m, h) => '#' + h + ' ');   // demote headings under the document heading
  md += `\n\n---\n\n## <a id="doc-${i + 1}"></a>DOC ${i + 1} · ${relative(root, p)} · ${dateOf(p)}\n\n${body}\n`;
});
writeFileSync(out, md);
console.log(`DISK: ${out} — ${docs.length} documents, ${rest.length} artefacts, ${(md.length / 1e6).toFixed(2)} MB`);
