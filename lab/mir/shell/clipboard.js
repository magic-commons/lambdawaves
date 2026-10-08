/* MIR · shell/clipboard.js — COPY TEXT, with the fallback a tablet needs.
 *
 * Harvested from BASINS (app/shell.js copyText, app/debug.js copyDebugInfo): the clipboard API first, and when it is
 * missing or refuses (an older Safari, a denied permission, a page that is not focused), a hidden read-only textarea
 * selected whole and `document.execCommand('copy')`.  BASINS wrote it twice; the kit's share link and boot card each
 * had a third, clipboard-only copy.  This is the one.
 *
 * THE LAWS IT KEEPS
 *   · IT NEVER THROWS.  It resolves true when the text reached the clipboard, false when both ways failed — the caller
 *     says so (BASINS: "Copy failed — the dump is in the browser console.").
 *   · THE FALLBACK LEAVES NOTHING BEHIND: the textarea is 1 px, transparent, read-only, and removed in the same task.
 *
 * copyText(text) → Promise<boolean> */
export async function copyText(text) {
  const s = String(text ?? '');
  try {
    if (globalThis.navigator && navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(s); return true; }
  } catch (_) { /* refused: the textarea way below */ }
  if (typeof document === 'undefined' || !document.body) return false;
  const ta = document.createElement('textarea');
  ta.value = s; ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { ta.setSelectionRange(0, s.length); } catch (_) { /* a textarea always has one; a strange host may not */ }
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
  ta.remove();
  return ok;
}
