/* tests/latex-state.test.mjs — THE COPY (0.3.3 · wave 135): lab/latex-state.js, exact strings.
 *   node tests/latex-state.test.mjs
 * The two WAVE DANCER sentences are Josh's own, read out of the shipped demo's notebook — not retyped here — and every
 * output is parsed by the vendored KaTeX with throwOnError and strict 'error', the renderer the notebook uses.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { stateLatex, stateTerms } from '../lab/latex-state.js';
import { BASIS, stateOf } from '../lab/hydrogen.js';
import { HAMILTONIANS } from '../lab/hamiltonian.js';

const katex = createRequire(import.meta.url)('../lab/vendor/katex/katex.min.js');
const H = HAMILTONIANS.hydrogen;
let failed = 0;
const all = [];
function check(name, fn) {
  try { fn(); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + String(e && e.message || e).split('\n').slice(0, 6).join('\n     ')); }
}
const st = (n, l, m, re, im = 0) => ({ n, l, m, re, im });
const copy = (states, h = H) => { const t = stateLatex({ states, H: h }); all.push(t); return t; };
const lines = (t) => t.split('\n');

/* Josh's sentence, from the demo file: "… running <A> in STATE-A and <B> in STATE-B" */
const demo = JSON.parse(readFileSync(new URL('../lab/demos/wave-dancer.lambdawaves.json', import.meta.url), 'utf8'));
const said = demo.notebook.text.match(/running (.+?) in STATE-A and (.+?) in STATE-B/);
assert.ok(said, 'the WAVE DANCER notebook still carries its STATE-A / STATE-B sentence');
const ab = demo.data.presentation.ab;
const setOf = (v) => v.re.map((re, a) => [a, re, v.im[a]]).filter(([, re, im]) => re || im).map(([a, re, im]) => st(BASIS[a].n, BASIS[a].l, BASIS[a].m, re, im));

check('1s alone: $1s_{0}$ / $\\psi = 1s_{0}$ (amplitude 1.00 dropped)', () => {
  assert.deepEqual(lines(copy([st(1, 0, 0, 1)])), ['$1s_{0}$', '$\\psi = 1s_{0}$']);
});
check(`WAVE DANCER's A set, equal real coefficients: line 1 is the notebook's own "${said[1]}"`, () => {
  const A = setOf(ab.a);
  assert.equal(A.length, 4);
  const t = copy(A);
  assert.equal(lines(t)[0], said[1]);
  assert.equal(lines(t)[0], '$2p_{-1}$, $2p_{1}$, $4p_{-1}$, and $4d_{2}$');
  assert.equal(lines(t)[1], '$\\psi = 0.50\\,2p_{-1} + 0.50\\,2p_{1} + 0.50\\,4p_{-1} + 0.50\\,4d_{2}$');
});
check(`WAVE DANCER's B set likewise: line 1 is "${said[2]}"`, () => {
  const t = copy(setOf(ab.b));
  assert.equal(lines(t)[0], said[2]);
  assert.equal(lines(t)[0], '$2s_{0}$, $2p_{0}$, $4p_{1}$, and $4d_{-2}$');
  assert.equal(lines(t)[1], '$\\psi = 0.50\\,2s_{0} + 0.50\\,2p_{0} + 0.50\\,4p_{1} + 0.50\\,4d_{-2}$');
});
check('the register order does not matter: the B set handed in reversed copies the same text', () => {
  assert.equal(copy(setOf(ab.b).reverse()), copy(setOf(ab.b)));
});
check('2p_{0} + i·2p_{1}: two names joined by "and", and e^{i\\pi/2} on the second', () => {
  assert.deepEqual(lines(copy([st(2, 1, 1, 0, 1), st(2, 1, 0, 1)])), ['$2p_{0}$ and $2p_{1}$', '$\\psi = 0.71\\,2p_{0} + 0.71\\,e^{i\\pi/2}\\,2p_{1}$']);
});
check('a relative phase of 0.37 rad → e^{0.37i}; of −0.37 → e^{-0.37i}', () => {
  const p = 0.37;
  assert.equal(lines(copy([st(1, 0, 0, 1), st(2, 0, 0, Math.cos(p), Math.sin(p))]))[1], '$\\psi = 0.71\\,1s_{0} + 0.71\\,e^{0.37i}\\,2s_{0}$');
  assert.equal(lines(copy([st(1, 0, 0, 1), st(2, 0, 0, Math.cos(p), -Math.sin(p))]))[1], '$\\psi = 0.71\\,1s_{0} + 0.71\\,e^{-0.37i}\\,2s_{0}$');
});
check('multiples of π: −3π/4, π (never −π), 2π/3; the global phase is removed (the first term carries 0)', () => {
  const g = 1.1, e = (a) => [Math.cos(a + g), Math.sin(a + g)];
  const t = copy([st(1, 0, 0, ...e(0)), st(2, 0, 0, ...e(-3 * Math.PI / 4)), st(3, 0, 0, ...e(Math.PI)), st(4, 0, 0, ...e(2 * Math.PI / 3))]);
  assert.equal(lines(t)[1], '$\\psi = 0.50\\,1s_{0} + 0.50\\,e^{-3i\\pi/4}\\,2s_{0} + 0.50\\,e^{i\\pi}\\,3s_{0} + 0.50\\,e^{2i\\pi/3}\\,4s_{0}$');
  assert.equal(lines(copy([st(1, 0, 0, 1), st(2, 0, 0, -1, -1e-9)]))[1], '$\\psi = 0.71\\,1s_{0} + 0.71\\,e^{i\\pi}\\,2s_{0}$');
  assert.equal(lines(copy([st(1, 0, 0, 1), st(2, 0, 0, Math.cos(0.004), Math.sin(0.004))]))[1], '$\\psi = 0.71\\,1s_{0} + 0.71\\,2s_{0}$');
});
check('3d_{0} + 4s_{0}: 4s comes FIRST (Madelung: n + l = 4 before 5)', () => {
  assert.equal(lines(copy([st(3, 2, 0, 1), st(4, 0, 0, 1)]))[0], '$4s_{0}$ and $3d_{0}$');
  const order = stateTerms({ states: [st(5, 0, 0, 1), st(4, 1, 0, 1), st(3, 2, 0, 1), st(4, 0, 0, 1), st(3, 1, 0, 1), st(3, 0, 0, 1)], H }).map((x) => x.name);
  assert.deepEqual(order, ['3s_{0}', '3p_{0}', '4s_{0}', '3d_{0}', '4p_{0}', '5s_{0}']);
});
check('inside a subshell m runs −1, 0, 1 (2p)', () => {
  assert.equal(lines(copy([st(2, 1, 1, 1), st(2, 1, -1, 1), st(2, 1, 0, 1)]))[0], '$2p_{-1}$, $2p_{0}$, and $2p_{1}$');
});
check('un-normalised input is normalised (3 : 4 → 0.60, 0.80)', () => {
  assert.equal(lines(copy([st(2, 1, 0, 30), st(1, 0, 0, 0, 40)]))[1], '$\\psi = 0.80\\,1s_{0} + 0.60\\,e^{-i\\pi/2}\\,2p_{0}$');
});
check('the empty register → \'\'; an all-zero one and a vanishing term are not terms', () => {
  assert.equal(stateLatex({ states: [], H }), '');
  assert.equal(stateLatex({ states: [st(1, 0, 0, 0)], H }), '');
  assert.equal(stateLatex({}), '');
  assert.equal(copy([st(1, 0, 0, 1), st(2, 0, 0, 1e-12)]), '$1s_{0}$\n$\\psi = 1s_{0}$');
});
check('an oscillator label → \\mathrm{…} with a legal subscript (the m bound to its word, spaces \\,)', () => {
  const t = copy([st(3, 2, 2, 1)], HAMILTONIANS.qho);
  assert.equal(t, '$\\mathrm{N2\\,n_r0\\,d_{+2}}$\n$\\psi = \\mathrm{N2\\,n_r0\\,d_{+2}}$');
});
check('BOX and QUARKONIUM labels, whose m follows a space, keep the subscript on the word (never after \\,)', () => {
  assert.equal(lines(copy([st(3, 0, 0, 1)], HAMILTONIANS.well))[0], '$\\mathrm{3s\\,well_{+0}}$');
  assert.equal(lines(copy([st(2, 1, -1, 1)], HAMILTONIANS.cornell))[0], '$\\mathrm{1P_{-1}}$');
});
check('ATOM names its shells as hydrogen does (the notebook spelling, chemistry order)', () => {
  assert.equal(lines(copy([st(3, 2, 0, 1), st(4, 0, 0, 1)], HAMILTONIANS.atom))[0], '$4s_{0}$ and $3d_{0}$');
});
check('all 91 labels at once: 91 names, Madelung-ordered, the whole list one line', () => {
  const t = copy(BASIS.map((s) => st(s.n, s.l, s.m, 1)));
  assert.equal(lines(t).length, 2);
  assert.equal((lines(t)[0].match(/\$/g) || []).length, 182);
  assert.ok(lines(t)[0].startsWith('$1s_{0}$, $2s_{0}$, $2p_{-1}$, $2p_{0}$, $2p_{1}$, $3s_{0}$, $3p_{-1}$'));
  assert.ok(lines(t)[0].endsWith(', and $6h_{5}$'));
  assert.ok(stateOf(6, 5, 5));
});
check(`every output (${all.length} copies) has balanced $ and braces and parses under KaTeX (throwOnError, strict 'error')`, () => {
  for (const t of all) {
    for (const line of lines(t)) {
      assert.equal((line.match(/\$/g) || []).length % 2, 0, line);
      let depth = 0; for (const ch of line) { if (ch === '{') depth++; else if (ch === '}') { depth--; assert.ok(depth >= 0, line); } }
      assert.equal(depth, 0, line);
      const parts = line.split('$'); assert.equal(parts.length % 2, 1, line);
      for (let i = 1; i < parts.length; i += 2) katex.renderToString(parts[i], { throwOnError: true, strict: 'error' });
    }
  }
});
console.log(failed ? `RED latex-state: ${failed} failed` : 'GREEN latex-state: the copy is the notebook\'s spelling in chemistry order, exact to the character, and every line parses under KaTeX');
process.exit(failed ? 1 : 0);
