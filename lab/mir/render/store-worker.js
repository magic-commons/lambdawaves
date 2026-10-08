/* render/store-worker.js — the OPFS fallback for browsers that expose synchronous access handles only in workers (Safari).
 * Harvested from BASINS app/render-store-worker.js; the one change is that the recordings directory is the message's `dir`
 * (BASINS' "basins-recordings" is an app's choice, not the kit's).  Messages: { id, op: 'open' | 'write' | 'close', dir, job,
 * name, bytes } → { id, ok } | { id, error }. */
let handle, position = 0;
self.onmessage = async ({ data: m }) => {
  try {
    if (m.op === 'open') {
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle(m.dir, { create: true });
      const job = await dir.getDirectoryHandle(m.job, { create: true });
      const file = await job.getFileHandle(m.name, { create: true });
      handle = await file.createSyncAccessHandle(); handle.truncate(0);
    } else if (m.op === 'write') {
      const bytes = new Uint8Array(m.bytes);
      let done = 0;
      while (done < bytes.length) {
        const n = handle.write(bytes.subarray(done), { at: position });
        if (!n) throw new Error('Temporary file write stalled');
        done += n; position += n;
      }
    } else if (m.op === 'close') { handle.flush(); handle.close(); handle = null; }
    self.postMessage({ id: m.id, ok: true });
  } catch (e) { self.postMessage({ id: m.id, error: String(e.message || e) }); }
};
