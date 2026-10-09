/* tools/make-covers.mjs — THE OPENER'S SIX COVERS (0.5.0 C6b): each demo opened by its own start (`?starter=<file>`, the title
 * screen's road), on the dark theme, its molecule solved and the clock paused, then the app's own picture at 9 : 16
 * (capture.picture({ width: 540, height: 960, caption: '' }): a real render at that size, no caption) re-encoded as a JPEG into
 * lab/demos/covers/<file>.jpg.  Run it after a demo changes, then `node tests/pwa.test.mjs --write`.
 *   python3 tools/gate/server.py <root> <LW_PORT>   (stop it by pid)
 *   LW_PORT=… GD_PORT=… node tools/make-covers.mjs [file …]   (default: the six STARTERS) */
import fs from 'node:fs';
import { open } from './gate/gatekit.mjs';
import { STARTERS } from '../lab/project-store.js';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const files = process.argv.slice(2).length ? process.argv.slice(2) : STARTERS.map((s) => s.file);
for (const file of files) {
  const g = await open(LAB + '?starter=' + file, { width: 1200, height: 900 });
  try {
    if (!(await g.waitFor('window.__LW && __LW.ready', 900, 100)).ok) throw new Error(file + ': no ready');
    const b64 = await g.ev(`
      const w = (n) => new Promise((r) => setTimeout(r, n));
      __LW.setTheme('dark'); __LW.pause();
      for (let i = 0, st = __LW.chem.state(); i < 600 && st.on && !(st.fieldOwner && st.nocc); i++, st = __LW.chem.state()) await w(100);
      await __LW.settle(); await w(400); await __LW.settle();
      const r = await __LW.captureUI.capture.picture({ width: 540, height: 960, caption: '' });
      if (!r.ok) return { E: r.error };
      const bm = await createImageBitmap(r.blob), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
      c.getContext('2d').drawImage(bm, 0, 0);
      const jpg = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
      const url = await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(jpg); });
      return url.slice(url.indexOf(',') + 1);`);
    if (typeof b64 !== 'string') throw new Error(file + ': ' + JSON.stringify(b64));
    const out = new URL('../lab/demos/covers/' + file + '.jpg', import.meta.url);
    fs.mkdirSync(new URL('.', out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log('wrote lab/demos/covers/' + file + '.jpg', Buffer.from(b64, 'base64').length, 'B');
  } finally { await g.close(); }
}
