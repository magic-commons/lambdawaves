import { renderNotebookMath } from './notebook-math.js';

// Imported notebook HTML is untrusted. Sanitize a parsed, inert tree before
// inserting KaTeX output, whose generated styles must survive the allowlist.
const NB_TAG = new Set(['P', 'BR', 'HR', 'STRONG', 'EM', 'B', 'I', 'U', 'DEL', 'S', 'MARK', 'SMALL', 'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'BLOCKQUOTE',
  'UL', 'OL', 'LI', 'DL', 'DT', 'DD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'IMG', 'SPAN', 'DIV', 'SUP', 'SUB',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'INPUT']);
const NB_ATTR = { A: ['href', 'title'], IMG: ['src', 'alt', 'title'], INPUT: ['type', 'checked', 'disabled'],
  TH: ['align', 'colspan', 'rowspan'], TD: ['align', 'colspan', 'rowspan'], OL: ['start'], CODE: ['class'], PRE: ['class'], SPAN: ['class'] };
const nbSafeURL = (u) => !/^(?:javascript|data|vbscript|file|blob):/i.test(String(u).replace(/[\u0000-\u0020]/g, '').toLowerCase());
function cleanNotebook(html, restoreMathText) {
  const t = document.createElement('template');
  t.innerHTML = html;                                       // INERT: no load, no execution, no navigation
  const walk = (node) => {
    for (const el of [...node.children]) {
      if (!NB_TAG.has(el.tagName)) { el.remove(); continue; }
      const allow = NB_ATTR[el.tagName] || [];
      for (const a of [...el.attributes]) {
        const n = a.name.toLowerCase();
        a.value = restoreMathText(a.value);
        if (allow.indexOf(n) < 0) { el.removeAttribute(a.name); continue; }
        if ((n === 'href' || n === 'src') && !nbSafeURL(a.value)) el.removeAttribute(a.name);
      }
      /* a link in a note goes OUT, and it goes out without a handle on this window */
      if (el.tagName === 'A' && el.getAttribute('href')) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
      if (el.tagName === 'INPUT') el.setAttribute('disabled', '');   // marked's task-list checkbox is a picture of state, not a control
      walk(el);
    }
  };
  walk(t.content);
  return t;
}

export function renderNotebook(src, { marked = window.marked, katex = window.katex } = {}) {
  if (!marked) return src.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const math = [];
  const keep = (tex, display) => { math.push({ tex, display }); return '\uE000MATH' + (math.length - 1) + '\uE001'; };
  const token = /\uE000MATH(\d+)\uE001/g;
  const source = src.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => keep(tex, true))
    .replace(/(^|[^\\$])\$([^$\n]+?)\$/g, (m, pre, tex) => pre + keep(tex, false));
  const restoreMathText = value => value.replace(token, (match, index) => {
    const q = math[+index];
    const delimiter = q?.display ? '$$' : '$';
    return q ? delimiter + q.tex + delimiter : match;
  });
  const tree = cleanNotebook(marked.parse(source, { breaks: true, gfm: true }), restoreMathText);
  // Expand formulas only in text nodes. String substitution over serialized HTML
  // can insert generated markup inside an attribute and bypass sanitization.
  const walker = document.createTreeWalker(tree.content, 4); // SHOW_TEXT
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of node.data.matchAll(token)) {
      const q = math[+match[1]];
      if (!q) continue;
      fragment.append(document.createTextNode(node.data.slice(offset, match.index)));
      const rendered = document.createElement('template');
      rendered.innerHTML = renderNotebookMath(q.tex, q.display, katex);
      fragment.append(rendered.content);
      offset = match.index + match[0].length;
    }
    if (offset) {
      fragment.append(document.createTextNode(node.data.slice(offset)));
      node.replaceWith(fragment);
    }
  }
  return tree.innerHTML;
}
