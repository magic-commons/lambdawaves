import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { renderNotebookMath } from '../lab/mir/shell/notebook-math.js';

const attack = '</code><img src=x onerror="alert(1)"><script>bad()</script>&';
for (const renderer of [undefined, { renderToString() { throw new Error('renderer failure'); } }]) {
  const html = renderNotebookMath(attack, false, renderer);
  assert.equal(html, '<code>&lt;/code&gt;&lt;img src=x onerror="alert(1)"&gt;&lt;script&gt;bad()&lt;/script&gt;&amp;</code>');
  assert.doesNotMatch(html, /<img|<script/);
}
let called;
const rendered = renderNotebookMath('x^2', true, { renderToString(tex, options) {
  called = { tex, options };
  return '<span class="katex">rendered math</span>';
} });
assert.equal(rendered, '<span class="katex">rendered math</span>');
assert.equal(called.tex, 'x^2');
assert.deepEqual(called.options, { displayMode: true, throwOnError: false, output: 'html', trust: false });
const katex = createRequire(import.meta.url)('../lab/vendor/katex/katex.min.js');
assert.match(renderNotebookMath('x^2', false, katex), /class="katex"/);
assert.doesNotMatch(renderNotebookMath(attack, false, katex), /<img|<script/);
assert.doesNotMatch(renderNotebookMath(String.raw`\href{javascript:alert(1)}{click}`, false, katex), /href="javascript:/);
console.log('GREEN notebook-math: unavailable/throwing renderer escapes hostile TeX; successful math preserves output with trust disabled');
