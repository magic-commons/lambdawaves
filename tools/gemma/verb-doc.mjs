/* tools/gemma/verb-doc.mjs — THE VERB TABLE AS PROMPT LINES (0.6.6 G3).  The broker builds Gemma's system prompt from this at start,
 * so the prompt and the page's table never drift: whatever `lab/verbs.js` exports is what she is told she may emit.
 *
 *   node tools/gemma/verb-doc.mjs [module]               the table, one line per verb: id {args with types} — doc
 *   node tools/gemma/verb-doc.mjs [module] --json        { ids, schema, args }: the verb enum, the reply JSON schema the broker hands
 *                                                        Ollama, and each verb's parsed args (the broker checks enums and required args)
 *   node tools/gemma/verb-doc.mjs [module] --catalogue   the ids she may name: molecules, presets, windows, views, switches, bases
 *
 * [module] defaults to lab/verbs.js (G1's table, importable in node without a DOM); while it is absent the stub beside this file
 * (tools/gemma/verbs.stub.mjs, the BUILD-PLAN's table) is read instead and a warning goes to stderr — stdout stays the payload. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const given = argv.find((a) => !a.startsWith('--'));

let path = resolve(ROOT, given || 'lab/verbs.js');
if (!existsSync(path)) {
  const stub = join(HERE, 'verbs.stub.mjs');
  process.stderr.write(`verb-doc: ${relative(ROOT, path)} is not here — reading the stub ${relative(ROOT, stub)} (the plan's table) instead\n`);
  path = stub;
}
const mod = await import(pathToFileURL(path).href);
const VERBS = mod.VERBS;
if (!Array.isArray(VERBS) || !VERBS.length) { process.stderr.write(`verb-doc: ${relative(ROOT, path)} exports no VERBS table\n`); process.exit(2); }

/** 'string' · 'number' · 'boolean' · 'enum a|b|c', each optionally led by '?' (optional) */
const parseArg = (spec) => {
  const s = String(spec).trim(), optional = s.startsWith('?'), body = optional ? s.slice(1).trim() : s;
  const m = /^enum\s+(.+)$/.exec(body);
  return { optional, type: m ? 'enum' : body, values: m ? m[1].split('|').map((x) => x.trim()).filter(Boolean) : null };
};
const line = (v) => {
  const args = Object.entries(v.args || {}).map(([k, spec]) => { const a = parseArg(spec);
    return `${k}${a.optional ? '?' : ''}: ${a.values ? a.values.join('|') : a.type}`; });
  return `- ${v.id} {${args.join(', ')}} — ${v.doc || ''}`.replace(/ \{\} — /, ' {} — ');
};

if (flag('--json')) {
  const ids = VERBS.map((v) => v.id);
  const schema = { type: 'object', properties: {
    say: { type: 'string' },
    verbs: { type: 'array', items: { type: 'object', properties: { verb: { type: 'string', enum: ids }, args: { type: 'object' } }, required: ['verb'] } },
    notebook: { type: 'string' } }, required: ['say', 'verbs'] };
  const args = Object.fromEntries(VERBS.map((v) => [v.id, Object.fromEntries(Object.entries(v.args || {}).map(([k, spec]) => [k, parseArg(spec)]))]));
  process.stdout.write(JSON.stringify({ ids, schema, args, source: relative(ROOT, path) }) + '\n');
} else if (flag('--catalogue')) {
  process.stdout.write((await catalogue()).join('\n') + '\n');
} else {
  process.stdout.write(VERBS.map(line).join('\n') + '\n');
}

/* ── THE CATALOGUE: every id she may name, read from the tree at broker start ── */
async function catalogue() {
  const out = [];
  const plain = (f) => String(f || '').replace(/<\/?m>/g, '');
  const { MOLECULES, RECORD_ONLY, SECTIONS } = await import(pathToFileURL(join(ROOT, 'lab/molecules.js')).href);
  out.push('MOLECULES (id = formula, name; by section — use the id exactly as written):');
  const all = [...MOLECULES, ...(RECORD_ONLY || [])];
  for (const sec of SECTIONS) {
    const rows = all.filter((m) => m.section === sec);
    if (rows.length) out.push(`  ${sec}: ` + rows.map((m) => `${m.id} = ${plain(m.formula)}, ${m.name}${m.disabled ? ' (cannot be solved here)' : ''}`).join('; '));
  }
  const loose = all.filter((m) => !SECTIONS.includes(m.section));
  if (loose.length) out.push('  OTHER: ' + loose.map((m) => `${m.id} = ${plain(m.formula)}, ${m.name}`).join('; '));

  /* lab/state.js imports in node (no DOM at module scope): its PRESETS are read as data */
  const { PRESETS } = await import(pathToFileURL(join(ROOT, 'lab/state.js')).href);
  out.push('PRESETS (hydrogen states for the preset verb; id = what it is): ' + PRESETS.filter((p) => !/^debug-/.test(p.id)).map((p) => `${p.id} = ${p.label.replace(/\s+/g, ' ').trim()}`).join('; '));

  out.push('WINDOWS (id = the name on its title bar, for the window verb): ' + windows().map(([id, name]) => (name && name.toLowerCase() !== id ? `${id} = ${name}` : id)).join(', '));

  const { VIEW } = await import(pathToFileURL(join(ROOT, 'lab/field.js')).href);
  const enumOf = (verb, arg) => { const v = VERBS.find((x) => x.id === verb); const a = v && v.args && v.args[arg] ? parseArg(v.args[arg]) : null; return a && a.values; };
  out.push('VIEWS for the view verb (the stage observable): ' + Object.keys(VIEW).join(', '));
  const molViews = enumOf('molecule', 'view');
  if (molViews) out.push('VIEWS for a molecule (molecule verb, view arg): ' + molViews.join(', '));
  const bases = enumOf('molecule', 'basis');
  if (bases) out.push('BASES (molecule verb, basis arg): ' + bases.join(', '));
  const sw = Array.isArray(mod.SWITCHES) ? mod.SWITCHES : enumOf('switch', 'id');
  if (sw) out.push('SWITCHES (ids for the switch verb): ' + sw.join(', '));
  return out;
}

/* the window ids: G1's own list when its module exports WINDOWS, else every device()/register() id under lab/ (never lab/mir/,
 * the kit's) plus the kit windows λWAVES opens by id (TIMELINE, KEYBOARD) — a regex over the source, because the cards register
 * themselves at boot inside the page and cannot be imported in node */
function windows() {
  if (Array.isArray(mod.WINDOWS) && mod.WINDOWS.length) return mod.WINDOWS.map((w) => (typeof w === 'string' ? [w, ''] : [w.id, w.name || w.title || '']));
  const ids = new Map();
  const walk = (dir) => { for (const n of readdirSync(dir)) { const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== 'mir' && n !== 'vendor') walk(p); }
    else if (n.endsWith('.js')) for (const m of readFileSync(p, 'utf8').matchAll(/(?:device|register)\(\{\s*id:\s*'([a-z0-9-]+)'([^}]{0,200})/g)) {
      const name = (/eyebrow:\s*'([^']+)'/.exec(m[2]) || /title:\s*'([A-Z][A-Z0-9 -]+)'/.exec(m[2]) || [])[1];
      if (!ids.has(m[1]) || name) ids.set(m[1], name || ids.get(m[1]) || ''); } } };
  walk(join(ROOT, 'lab'));
  for (const [k, n] of [['timeline', 'TIMELINE'], ['keyboard', 'KEYBOARD']]) ids.set(k, n);
  return [...ids].sort((a, b) => a[0].localeCompare(b[0]));
}
