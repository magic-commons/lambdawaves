/* tools/perf/app-shape.mjs (0.5.2 U5) — DOES `app` STAY FAST?  G-A says every namespace of boot()'s context is one literal with all its
 * keys, never extended, never Object.assign-ed into, never deleted, because V8 turns an object so treated into a DICTIONARY and every
 * property read on it costs ~10–20 ns instead of ~1 (≈ 0.2–0.7 ms/s at 60–120 Hz — under what the ms/s pair can resolve).  This reads
 * the engine's own answer: headless Chromium with `--js-flags=--allow-natives-syntax`, the page booted (the main-thread instrument's
 * warm-up navigation first), then `app` is found WITHOUT touching the facade — a facade method's [[Scopes]] hold boot()'s closure,
 * whose `app` binding the DevTools protocol hands back by reference — and `%HasFastProperties` is asked of it and of each namespace,
 * at LW.ready and again after S seconds of play (the loop writes app.state every frame).  A tree without `app` (the base) answers for
 * `ui` and `__LW_hooks`, the bags it had.
 *   python3 tools/gate/server.py "$PWD" 9043 &   LW_PORT=9043 node tools/perf/app-shape.mjs [--secs 6] [--json out.json]
 * One browser at a time on the shared GPU (tools/perf/wait-gpu.mjs first). */
import { launch, sleep } from './cdp.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = process.env.LW_PORT || '9043';
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
if (!process.env.CHROMIUM && fs.existsSync(PW)) process.env.CHROMIUM = PW;
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SECS = Number(opt('--secs', 6)), JSON_OUT = opt('--json', null);
const URL_ = `https://127.0.0.1:${PORT}/lab/?sw=0&warn=0&starter=home`;   // a CDP tool skips the title screen (CLAUDE.md, THE START)
const b = await launch({ width: 1600, height: 1000, gpu: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan',
  '--enable-webgpu-developer-features', '--js-flags=--allow-natives-syntax'] });
const out = { port: PORT, url: URL_, secs: SECS };
try {
  /* the notice holds LW.ready under a CDP browser (navigator.webdriver is false, so ?warn=0 is not honoured): put it down as main-thread.mjs does */
  const ready = async () => { for (let i = 0; i < 600; i++) { if (await b.eval('(window.__LW && __LW.warning && __LW.warning.open && __LW.warning.dismiss(), !!(window.__LW && __LW.ready))').catch(() => false)) return true; await sleep(100); } return false; };
  await b.goto(URL_, 1500); await ready();                    // the warm-up navigation (main-thread.mjs: a fresh browser loses its first device)
  await b.goto(URL_, 1500); out.ready = await ready();
  out.flag = await b.eval('(() => { try { return new Function("return %IsSmi(1)")() === true; } catch (e) { return String(e.message); } })()');
  out.field = await b.eval('!!(__LW.field && __LW.field.ok)');
  /* boot()'s closure, by reference: a facade method's [[Scopes]] */
  const fn = await b.send('Runtime.evaluate', { expression: '__LW.settle' });
  const props = async (objectId) => (await b.send('Runtime.getProperties', { objectId, ownProperties: true })).result;
  const scopes = (await props(fn.result.result.objectId)).internalProperties.find((p) => p.name === '[[Scopes]]');
  const list = (await props(scopes.value.objectId)).result.filter((p) => /^\d+$/.test(p.name));
  let closure = null;
  for (const s of list) { const vars = (await props(s.value.objectId)).result; if (vars.some((v) => v.name === 'app' || v.name === 'ui')) { closure = vars; break; } }
  if (!closure) throw new Error('boot()\'s closure was not found through __LW.settle\'s [[Scopes]]');
  const ref = (name) => (closure.find((v) => v.name === name) || {}).value;
  const ask = async (tag) => {
    const app = ref('app'), ui = ref('ui'), hooks = ref('__LW_hooks');
    const fast = async (o, body) => o && o.objectId ? (await b.send('Runtime.callFunctionOn', { objectId: o.objectId, functionDeclaration: body, returnByValue: true })).result.result.value : null;
    return { tag,
      app: await fast(app, `function () { const ns = {}; for (const k of Object.keys(this)) if (this[k] && typeof this[k] === 'object' && !Array.isArray(this[k]) && !(this[k] instanceof Map) && Object.getPrototypeOf(this[k]) === Object.prototype) ns[k] = { fast: %HasFastProperties(this[k]), keys: Object.keys(this[k]).length };
        return { fast: %HasFastProperties(this), keys: Object.keys(this).length, ns }; }`),
      ui: await fast(ui, 'function () { return { fast: %HasFastProperties(this), keys: Object.keys(this).length }; }'),
      __LW_hooks: await fast(hooks, 'function () { return { fast: %HasFastProperties(this), keys: Object.keys(this).length }; }') };
  };
  out.atReady = await ask('LW.ready');
  await b.eval(`(async () => { __LW.play(); await new Promise((r) => setTimeout(r, ${SECS * 1000})); __LW.pause(); await __LW.settle(); return __LW.stats.frames; })()`);
  out.afterPlay = await ask(`after ${SECS} s of play`);
} catch (e) { out.error = String(e && e.message || e); }
finally { await b.close(); }
console.log(JSON.stringify(out, null, 1));
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
