// facade-names.mjs — for R5's brief: every name the facade piece (§26) reads, and where it lives at the tip —
// a slot some module registers (app.<ns>.x = … in a module file), a boot-kept fill (in rack.js), a literal value, or NO SLOT (boot-only const).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const W = process.argv[2] || new URL('../../../', import.meta.url).pathname;
const table = execFileSync('node', ['tools/rack-deps.mjs', '--classes', '--verbose'], { cwd: W, encoding: 'utf8', maxBuffer: 1 << 26 });
const block = table.split(/^facade · /m)[1]; if (!block) throw new Error('no facade block in --verbose');
const line = (label) => (block.match(new RegExp('^  ' + label + ' (.*)$', 'm')) || [, ''])[1].trim();
const names = (s) => (s === '—' || !s) ? [] : s.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
const backward = names(line('backward')), forward = names(line('forward'));
const stateLine = line('app\\.state \\(another\'s\\)');
const files = ['lab/rack.js', ...['lab/shell', 'lab/windows'].flatMap((d) => fs.readdirSync(path.join(W, d)).filter((f) => f.endsWith('.js')).map((f) => d + '/' + f))];
const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(W, f), 'utf8')]));
const rack = src['lab/rack.js'].split('\n');
const litStart = rack.findIndex((l) => /^ {2}const app = \{/.test(l)); let litEnd = litStart; while (!/^ {2}\};/.test(rack[litEnd])) litEnd++;
const literal = rack.slice(litStart, litEnd + 1).join('\n');
const nsOf = (name) => { const m = literal.match(new RegExp('(hooks|state|loop|host|w|ctl|sh): \\{[\\s\\S]*?(?=\\n {4}(?:hooks|state|loop|host|w|ctl|sh): \\{|\\n {2}\\};)', 'g')) || []; for (const seg of m) if (new RegExp('[{,]\\s*' + name + '(?=:|,|\\s*\\})').test(seg)) return seg.match(/^(\w+):/)[1]; return null; };
const rows = [];
for (const n of backward) {
  const reg = []; for (const f of files) for (const m of src[f].matchAll(new RegExp('app\\.(hooks|loop|host|w|ctl|sh)\\.' + n + '\\s*=(?!=)', 'g'))) reg.push(`${f}:${src[f].slice(0, m.index).split('\n').length} app.${m[1]}.${n}`);
  const headKeys = (literal.split('\n')[1] || '').includes(n + ',') || (literal.split('\n')[1] || '').includes(n + '\n');
  const ns = nsOf(n);
  const literalByValue = ns && new RegExp('[{,]\\s*' + n + '\\s*[,}]').test(literal);
  rows.push([n, headKeys ? 'app.' + n + ' (head const)' : reg.length ? reg.join('; ') : literalByValue ? `app.${ns}.${n} by value in the literal` : ns ? `app.${ns}.${n} NULL — no fill anywhere` : 'NO SLOT (boot-only name)']);
}
const groups = { registered: [], headConst: [], byValue: [], nullSlot: [], noSlot: [] };
for (const [n, where] of rows) {
  if (where.startsWith('app.') && where.includes('head const')) groups.headConst.push(n);
  else if (where.includes('by value')) groups.byValue.push(n);
  else if (where.includes('NULL')) groups.nullSlot.push(`${n} (${where.split(' ')[0]})`);
  else if (where.startsWith('NO SLOT')) groups.noSlot.push(n);
  else groups.registered.push(`${n} ← ${where}`);
}
console.log(`facade backward ${backward.length} · forward ${forward.join(', ') || '—'} · app.state ${stateLine}`);
for (const [k, v] of Object.entries(groups)) { console.log(`\n## ${k} (${v.length})`); for (const x of v) console.log('  ' + x); }
