// Math placeholders are restored after notebook HTML sanitization. Every fallback
// must therefore escape the original TeX before it enters an HTML text node.
export function renderNotebookMath(tex, display, katex) {
  const fallback = () => '<code>' + String(tex).replace(/[&<>]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</code>';
  if (!katex) return fallback();
  try {
    return katex.renderToString(tex, {
      displayMode: display, throwOnError: false, output: 'html', trust: false,
    });
  } catch (_) { return fallback(); }
}
