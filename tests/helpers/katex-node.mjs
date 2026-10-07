/* tests/helpers/katex-node.mjs — the kit's vendored KaTeX, for a node test (0.4.0 S0 · wave 138).
 *
 * lab/index.html loads `lab/mir/shell/vendor/katex/katex.min.js`, the kit's copy; the byte-identical app duplicate under
 * lab/vendor/ is deleted.  That copy ships no CommonJS `package.json` (and the adopted tree may never get one), so
 * `createRequire` would read it as ESM under the repo's `"type": "module"`.  It is a UMD bundle: run it once in a `vm`
 * context with a `module` / `exports` shim and hand back what it exports.  Node-only; nothing in lab/ imports this.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = new URL('../../lab/mir/shell/vendor/katex/katex.min.js', import.meta.url);
let katex = null;
export function loadKatex() {
  if (katex) return katex;
  const module = { exports: {} };
  const sandbox = { module, exports: module.exports, console };
  sandbox.self = sandbox; sandbox.window = sandbox;
  vm.runInNewContext(readFileSync(SRC, 'utf8'), sandbox, { filename: SRC.pathname });
  katex = module.exports && typeof module.exports.renderToString === 'function' ? module.exports : sandbox.katex;
  if (!katex || typeof katex.renderToString !== 'function') throw new Error('katex-node: the kit bundle did not export katex');
  return katex;
}
