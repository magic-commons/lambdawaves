/* MIR · folders/save-blob.js — HAND A FILE TO THE PERSON: the one saveBlob (harvested from BASINS app/export.js, 2026-10-05).
 *
 *   saveBlob(blob, name) → 'share' | 'download'      prefersVideoDownload() → bool
 *
 * A Blob and an `<a download>` need no File System Access API, so it works in every browser the kit does.  On an iPad the
 * share sheet is preferred for files the browser accepts (it is how "Save Image" and "Save to Files" are reached), and the
 * call is made SYNCHRONOUSLY: it must be reached inside the tap that asked with NOTHING awaited before it, or the browser's
 * permission for the activation is already spent.  The share is not awaited (a person dismissing the sheet is a cancel, not
 * a failure).  A VIDEO on iPadOS is a download, never a share: handing a large in-memory movie to the native share sheet
 * has terminated the page at the save step, and a Blob-URL download lets Safari take the finished file without a second
 * in-page File wrapper; its URL is kept ten minutes.  Anything else keeps the URL a minute.
 * FOLDERS' EXPORT (.mir, picture, ZIP) and an app's own exports use it; `createFolders({ download })` swaps it. */
export function prefersVideoDownload() {
  return typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
}

export function saveBlob(blob, name) {
  const downloadVideo = prefersVideoDownload() && ((blob.type || '').startsWith('video/') || /\.mp4$/i.test(name));
  const file = !downloadVideo && typeof File === 'function' ? (() => { try { return new File([blob], name, { type: blob.type }); } catch (_) { return null; } })() : null;
  let shared = false;
  try {
    if (file && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => {});
      shared = true;
    }
  } catch (_) { shared = false; }
  if (!shared) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) { /* gone */ } a.remove(); }, downloadVideo ? 10 * 60 * 1000 : 60000);
  }
  return shared ? 'share' : 'download';
}
