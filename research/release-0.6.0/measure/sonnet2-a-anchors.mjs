// sonnet2-a: are the anchors for DRAFT 2's "equalizer = COMPUTE_WGSL with the space switch pinned to 0 and the accumulate/store replaced" UNIQUE in COMPUTE_WGSL (field.js:27-140)?
// Also: does a derived text (global P.space -> 0u, accumulate -> shell sums, store -> signed root) stay brace-balanced; how many lines does the substitution itself take.
import fs from 'node:fs';
const ROOT = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0';
const src = fs.readFileSync(ROOT + '/lab/field.js', 'utf8');
const a = src.indexOf('const COMPUTE_WGSL = /* wgsl */`'); const s0 = src.indexOf('`', a) + 1;
// the closing backtick: the first '`;' at line start after s0 (the template has no inner backticks: check)
const e0 = src.indexOf('}`;', s0) + 1; const W = src.slice(s0, e0);
const innerTicks = (W.match(/`/g) || []).length;
const startLine = src.slice(0, a).split('\n').length;
const cnt = (needle) => { let n = 0, i = -1; while ((i = W.indexOf(needle, i + 1)) >= 0) n++; return n; };
const anchors = {
  'P.space (every use)': 'P.space',
  'space-0 branch head: if (P.space == 0u || P.space == 5u) {': 'if (P.space == 0u || P.space == 5u) {',
  'branch chain tail: } else {\\n        /* MOMENTUM': '      } else {\n        /* MOMENTUM',
  'MOMENTUM comment': '/* MOMENTUM',
  'accumulate: if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }': 'if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }',
  'accumulate (short): psi += f * ce;': 'psi += f * ce;',
  'space-5 fold: if (P.space == 5u) { psi = vec2<f32>(sqrt(': 'if (P.space == 5u) { psi = vec2<f32>(sqrt(',
  'store: textureStore(outTex': 'textureStore(outTex',
  'store line (full)': 'textureStore(outTex, vec3<i32>(gid), vec4<f32>(psi.x, psi.y, 0.0, 0.0));',
  'dens = dot(psi, psi);': 'dens = dot(psi, psi);',
  'declaration: var psi = vec2<f32>(0.0, 0.0);': 'var psi = vec2<f32>(0.0, 0.0);',
  'var psiB': 'var psiB',
  'n = M.nlm.x (the shell index source)': 'let n = M.nlm.x;',
  'the shell-sum insertion point: let ce = vec2<f32>(': 'let ce = vec2<f32>(',
  'workgroup atomics tail: atomicMax(&wmax': 'atomicMax(&wmax',
  'for (var a = 0u; a < P.count; a++) {': 'for (var a = 0u; a < P.count; a++) {',
};
const res = {}; for (const [k, v] of Object.entries(anchors)) res[k] = cnt(v);
// derivation A (global pin): P.space -> 0u ; accumulate + store replaced
const once = (t, from, to) => { const i = t.indexOf(from); if (i < 0 || t.indexOf(from, i + 1) >= 0) throw new Error('anchor not unique/missing: ' + from.slice(0, 50)); return t.slice(0, i) + to + t.slice(i + from.length); };
let D1 = W, err = null;
try {
  D1 = once(D1, 'if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }', 'S[u32(n) - 1u] += f * ce;');
  D1 = once(D1, 'if (P.space == 5u) { psi = vec2<f32>(sqrt(dot(psi, psi) + dot(psiB, psiB)), 0.0); }', 'psi = SIXBYSIX(S);');
  D1 = once(D1, 'vec4<f32>(psi.x, psi.y, 0.0, 0.0)', 'vec4<f32>(psi.x, 0.0, 0.0, 0.0)');
  D1 = D1.split('P.space').join('0u');
} catch (e) { err = String(e); }
const bal = (t) => ({ braces: (t.match(/{/g) || []).length - (t.match(/}/g) || []).length, parens: (t.match(/\(/g) || []).length - (t.match(/\)/g) || []).length });
// derivation B (cut the dead branches): slice from the space-0 branch head to the end of the MOMENTUM else block
const iHead = W.indexOf('if (P.space == 0u || P.space == 5u) {'), iTail = W.indexOf('f = M.c.z * ipow(q, l) * L / pow(1.0 + t, M.c.w) * ipow(st, am) * D;');
const iTailEnd = W.indexOf('\n      }', iTail) + '\n      }'.length;
const chainLines = W.slice(iHead, iTailEnd).split('\n').length;
const out = {
  tag: 'MEASURED (node, text of lab/field.js)', COMPUTE_WGSL: { startLine, lines: W.split('\n').length, chars: W.length, innerBackticks: innerTicks },
  occurrences: res,
  derivationA_globalPin: { error: err, substitutions: 4, nUnique: 3, spaceRefsPinned: res['P.space (every use)'], balanced: bal(D1), note: 'P.space -> 0u leaves the dead branches for the WGSL compiler to fold; no multi-line anchor needed' },
  derivationB_cutDeadChain: { chainStartsAtOffset: iHead, chainLines, note: 'needs a slice-between-two-anchors helper (specRenderWGSL has only a cut-to-end-of-line helper `cut`, field.js:555-557); the chain is ' + chainLines + ' lines, so it cannot be a literal `from` string without copying the text it is meant not to copy' },
  helperInTree: { once: 'field.js:553 (exact-once substitution; throws on missing or duplicate)', cut: 'field.js:555-557 (anchor to end of its line)', between: 'absent' },
};
fs.writeFileSync(new URL('./sonnet2-a-anchors.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
