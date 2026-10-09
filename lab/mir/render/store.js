/* render/store.js — THE RENDER STORE: encoded payloads live on disk, with recovery (harvested from BASINS app/render-store.js and
 * render-store-worker.js, 2026-10-05; the laws and the manifest are BASINS' unchanged, so a job BASINS left on disk is
 * recovered by the kit).  Only a bounded write queue (8 MB) and the sample index live in JS.  Checkpoints can recover a
 * completed prefix after a page reload.
 *
 * WHERE: the origin-private file system (navigator.storage.getDirectory), in one directory per app (`dir`, default
 * "mir-recordings"; BASINS passes "basins-recordings", which a browser already holds).  One sub-directory per run: `job.json`
 * (the manifest, version 1) and the payload parts (`payload.bin`, `payload-1.bin` …) or the PNG frame ZIPs.  A writer is
 * the handle's own createWritable() where the browser has it, or a module worker (store-worker.js) over a synchronous
 * access handle (Safari).  No OPFS (a private window, an insecure origin): create() returns null and the run keeps its
 * samples in memory, up to a limit it states.
 *
 *   await RenderStore.create(id, spec, estimatedBytes, { dir?, storage? }) → store | null
 *     throws when the quota cannot hold the run twice over (2.15× + 32 MB: the payload, then the finished file)
 *   store.append(bytes) · throttle() · drain() · checkpoint(info) · finish(info, name) → { name, blob, bytes, frames }
 *   store.savePart(name, blob, frames) → a PNG ZIP part, committed with a checkpoint
 *   store.finishParts() · finalize(name, { handler? }) → the MP4 of the completed frames, then the payload parts are removed
 *   store.resume() · interrupt() · discard()
 *   await RenderStore.recoveries({ dir?, storage? }) → [{ store, files, frames, spec }], newest first */
import { mp4Parts } from './mp4.js';

const MAX_PENDING = 8 * 1024 * 1024;
const BLOCK = 1024 * 1024;
export const DEFAULT_DIR = 'mir-recordings';
const storageOf = (o) => (o && o.storage) || (typeof navigator !== 'undefined' ? navigator.storage : null);

/** one writer on a file handle: createWritable where it exists, else the worker's synchronous access handle */
async function writerFor(handle, job, name, dir) {
  if (typeof handle.createWritable === 'function') {
    const stream = await handle.createWritable();
    return { write: (b) => stream.write(b), close: () => stream.close(), abort: () => stream.abort() };
  }
  const worker = new Worker(new URL('./store-worker.js', import.meta.url), { type: 'module' });
  let seq = 0;
  const pending = new Map();
  worker.onmessage = ({ data }) => {
    const p = pending.get(data.id); if (!p) return;
    pending.delete(data.id); data.error ? p.reject(new Error(data.error)) : p.resolve();
  };
  worker.onerror = (e) => { for (const p of pending.values()) p.reject(new Error(e.message || 'File writer failed')); pending.clear(); };
  const send = (op, bytes) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    worker.postMessage({ id, op, dir, job, name, bytes: bytes?.buffer }, bytes ? [bytes.buffer] : []);
  });
  try { await send('open'); } catch (e) { worker.terminate(); throw e; }
  return { write: (b) => send('write', new Uint8Array(b)),
    close: async () => { try { await send('close'); } finally { worker.terminate(); } },
    abort: async () => { worker.terminate(); } };
}

export class RenderStore {
  static async create(id, spec, estimatedBytes = 0, opts = {}) {
    const storage = storageOf(opts);
    if (!storage?.getDirectory) return null;
    const dirName = opts.dir || DEFAULT_DIR;
    const root = await storage.getDirectory();
    const recordings = await root.getDirectoryHandle(dirName, { create: true });
    const estimate = await storage.estimate?.();
    if (estimate?.quota && estimate.quota - (estimate.usage || 0) < estimatedBytes * 2.15 + 32e6)
      throw new Error('Not enough temporary storage for this render. Shorten the length or choose a smaller size.');
    const dir = await recordings.getDirectoryHandle(id, { create: true });
    const store = new RenderStore(id, recordings, dir, spec, { dirName, storage });
    try {
      if (spec.format !== 'png') {
        store.payloadHandle = await dir.getFileHandle('payload.bin', { create: true });
        store.writer = await writerFor(store.payloadHandle, id, 'payload.bin', dirName);
      }
      await store.saveManifest();
      return store;
    } catch (e) { await recordings.removeEntry(id, { recursive: true }).catch(() => {}); throw e; }
  }
  constructor(id, root, dir, spec, o = {}) {
    this.id = id; this.root = root; this.dir = dir; this.dirName = o.dirName || DEFAULT_DIR; this.storage = o.storage || null;
    this.manifest = { v: 1, id, at: Date.now(), state: 'rendering', spec, checkpoint: null, files: [] };
    this.queue = Promise.resolve(); this.pendingBytes = 0; this.bytes = 0; this.error = null;
  }
  writer_(handle, name) { return writerFor(handle, this.id, name, this.dirName); }
  append(bytes) {
    this.pendingBytes += bytes.length;
    this.queue = this.queue.then(async () => {
      try { if (!this.error) { await this.writer.write(bytes); this.bytes += bytes.length; } }
      catch (e) { this.error = e; }
      finally { this.pendingBytes -= bytes.length; }
    });
  }
  async drain() { await this.queue; if (this.error) throw this.error; }
  async throttle() { if (this.pendingBytes >= MAX_PENDING) await this.drain(); if (this.error) throw this.error; }
  async saveManifest() {
    const h = await this.dir.getFileHandle('job.json', { create: true });
    const w = await this.writer_(h, 'job.json');
    try { await w.write(new TextEncoder().encode(JSON.stringify(this.manifest))); await w.close(); }
    catch (e) { await w.abort().catch(() => {}); throw e; }
  }
  async savePart(name, blob, frames) {
    const h = await this.dir.getFileHandle(name, { create: true });
    const w = await this.writer_(h, name);
    try {
      for (let p = 0; p < blob.size; p += BLOCK) await w.write(new Uint8Array(await blob.slice(p, p + BLOCK).arrayBuffer()));
      await w.close();
    } catch (e) { await w.abort().catch(() => {}); throw e; }
    this.bytes += blob.size;
    this.manifest.files.push(name); this.manifest.checkpoint = { frames, bytes: this.bytes };
    await this.saveManifest();
    return { name, blob: await h.getFile(), bytes: blob.size };
  }
  async finishParts() { this.manifest.state = 'ready'; await this.saveManifest(); }
  async resume() {
    if (this.manifest.state === 'ready') throw new Error('This recording is already complete');
    this.bytes = this.manifest.checkpoint?.bytes || 0;
    const spec = this.manifest.spec, estimate = await this.storage?.estimate?.();
    const remaining = spec.format === 'png' ? spec.width * spec.height * 4 * (spec.frames - (this.manifest.checkpoint?.frames || 0))
      : spec.bitrate / 8 * (spec.frames - this.manifest.checkpoint.samples.length) / spec.fps;
    if (estimate?.quota && estimate.quota - (estimate.usage || 0) < remaining * 2.15 + this.bytes + 32e6)
      throw new Error('Not enough temporary storage to resume and finalize this render. Recover the completed frames instead.');
    if (this.manifest.spec.format === 'png') return;
    this.partNames = (this.manifest.parts || ['payload.bin']).slice();
    const name = 'payload-' + this.partNames.length + '.bin'; this.partNames.push(name);
    const h = await this.dir.getFileHandle(name, { create: true });
    this.writer = await this.writer_(h, name);
    this.manifest.parts = this.partNames.slice();
  }
  async checkpoint(info) {
    await this.drain();
    this.manifest.checkpoint = { ...info, bytes: this.bytes };
    /* Commit small payload parts rather than repeatedly copying the entire growing file through
       createWritable({ keepExistingData: true }). */
    await this.writer.close();
    await this.saveManifest();
    this.partNames ||= ['payload.bin'];
    const name = 'payload-' + this.partNames.length + '.bin'; this.partNames.push(name);
    const h = await this.dir.getFileHandle(name, { create: true });
    this.writer = await this.writer_(h, name);
    this.manifest.parts = this.partNames.slice();
  }
  async finish(info, name) {
    await this.drain(); await this.writer.close(); this.writer = null;
    this.manifest.checkpoint = { ...info, bytes: this.bytes };
    await this.saveManifest();
    return this.finalize(name);
  }
  async finalize(name, o = {}) {
    const info = this.manifest.checkpoint;
    if (!info?.samples?.length) throw new Error('No completed frames to recover');
    const samples = info.samples.map((s) => ({ ...s, data: { size: s.size } }));
    const headers = mp4Parts({ ...info, description: Uint8Array.from(info.description), samples, largeFile: true, headersOnly: true, handler: o.handler });
    const h = await this.dir.getFileHandle(name, { create: true });
    const w = await this.writer_(h, name);
    try {
      for (const b of headers) await w.write(b);
      let left = info.bytes;
      for (const part of this.manifest.parts || ['payload.bin']) {
        const file = await (await this.dir.getFileHandle(part)).getFile();
        for (let p = 0; p < file.size && left > 0; p += BLOCK) {
          const n = Math.min(BLOCK, file.size - p, left);
          await w.write(new Uint8Array(await file.slice(p, p + n).arrayBuffer())); left -= n;
        }
      }
      if (left) throw new Error('Temporary recording is incomplete');
      await w.close();
    } catch (e) { await w.abort().catch(() => {}); throw e; }
    this.manifest.state = 'ready'; this.manifest.files = [name]; await this.saveManifest();
    /* the final output is committed before the temporary sample payloads are removed */
    for (const part of this.manifest.parts || ['payload.bin']) await this.dir.removeEntry(part).catch(() => {});
    const file = await h.getFile();
    return { name, blob: file, bytes: file.size, frames: samples.length };
  }
  async discard() {
    await this.queue;
    if (this.writer) { await this.writer.abort().catch(() => {}); this.writer = null; }
    await this.root.removeEntry(this.id, { recursive: true });
  }
  async interrupt() {
    await this.queue;
    if (this.writer) { await this.writer.abort().catch(() => {}); this.writer = null; }
  }
  static async recoveries(opts = {}) {
    const storage = storageOf(opts);
    if (!storage?.getDirectory) return [];
    const dirName = opts.dir || DEFAULT_DIR;
    let root;
    try { root = await (await storage.getDirectory()).getDirectoryHandle(dirName); } catch (_) { return []; }
    const jobs = [];
    for await (const [id, dir] of root.entries()) {
      if (dir.kind !== 'directory') continue;
      try {
        const m = JSON.parse(await (await (await dir.getFileHandle('job.json')).getFile()).text());
        if (m.v !== 1 || (!m.files.length && !m.checkpoint?.samples?.length)) continue;
        const store = new RenderStore(id, root, dir, m.spec, { dirName, storage }); store.manifest = m;
        const files = [];
        for (const name of m.files) { const blob = await (await dir.getFileHandle(name)).getFile(); files.push({ name, blob, bytes: blob.size }); }
        jobs.push({ store, files, frames: m.checkpoint?.samples?.length || m.checkpoint?.frames || 0, spec: m.spec });
      } catch (_) { /* a damaged job is skipped, never thrown */ }
    }
    return jobs.sort((a, b) => b.store.manifest.at - a.store.manifest.at);
  }
}
