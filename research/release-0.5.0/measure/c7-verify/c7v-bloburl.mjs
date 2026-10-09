/* research/release-0.5.0/measure/c7-verify/c7v-bloburl.mjs — does a Blob URL of a finished film still read after the app's discard (the 2-minute timer)?
 * saveBlob keeps an iPad video's URL ten minutes; render-exact.js discards the OPFS file under it after two. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8853';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 600000,
  prefs: { 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
let out = null;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  out = await g.ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    __LW.pause(); __LW.scrub(0); await __LW.settle();
    const F = __LW.captureUI.exact;
    const P = F.plan({ frames: 24, fps: 24, width: 320 });
    const r = await F.render({ schedule: P.schedule, width: 320, format: 'mp4' }).done;
    const res = { ok: r.ok, message: r.message, bytes: r.bytes, file: r.files[0] && r.files[0].name, blobType: r.blob && r.blob.constructor.name };
    const url = URL.createObjectURL(r.blob);
    const read = async () => { try { const b = await (await fetch(url)).arrayBuffer(); return { ok: true, bytes: b.byteLength }; } catch (e) { return { ok: false, E: String(e && e.name) + ': ' + String(e && e.message) }; } };
    res.beforeDiscard = await read();
    res.fileBefore = await (async () => { try { return (await r.blob.arrayBuffer()).byteLength; } catch (e) { return String(e.name + ': ' + e.message); } })();
    await F.discard(r);
    res.afterDiscard = await read();
    res.fileAfter = await (async () => { try { return (await r.blob.arrayBuffer()).byteLength; } catch (e) { return String(e.name + ': ' + e.message); } })();
    return res;`);
  console.log(JSON.stringify(out));
} catch (e) { console.log('FATAL', String(e && e.stack || e)); }
finally { await g.close(); }
fs.writeFileSync('.tmp/c7v-bloburl.json', JSON.stringify(out, null, 1));
