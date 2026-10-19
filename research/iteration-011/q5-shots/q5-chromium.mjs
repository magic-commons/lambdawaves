// Q5 · the PROOF a WebDriver screenshot cannot give: Firefox's WebDriver screenshot (headless AND headed) never renders a
// backdrop-filter (measured: the law on vs off gave 0 differing pixels), so the before/after pictures and the compositor's
// cost are taken in a HEADED Chromium on the session display (the real GPU compositor; Page.captureScreenshot composites
// backdrop-filter), on a fresh profile = the first-run material.  BEFORE and AFTER are the same page, the same paused frame:
// AFTER is the build, BEFORE is the build with the Q5 rule deleted from skin.css through the CSSOM (it is the row's only change).
//   DISPLAY=:0 LW_PORT=9441 [LW_DSF=2] [LW_UNCAPPED=1] node research/iteration-011/q5-shots/q5-chromium.mjs [light|dark] [desktop|phone] [--perf] [--no-shots]
// CHROME=… overrides the binary (default: Playwright's chromium-1243).
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const theme = args[0] || 'light', device = args[1] || 'desktop', PERF = process.argv.includes('--perf');
const phone = device === 'phone';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-q5-'));
const cdpPort = 9900 + Math.floor(Math.random() * 90);
const W = phone ? 390 : 1500, H = phone ? 844 : 950;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--user-data-dir=${PROFILE}`, `--remote-debugging-port=${cdpPort}`, '--ignore-certificate-errors',
  '--enable-unsafe-webgpu', '--enable-features=Vulkan', ...(process.env.LW_SANDBOX ? [] : ['--no-sandbox']),   /* this box: no unprivileged userns (AppArmor) — as tools/perf/bench-chromium.mjs; only our own gate server is loaded */
   '--no-first-run', '--no-default-browser-check',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  ...(process.env.LW_UNCAPPED ? ['--disable-gpu-vsync', '--disable-frame-rate-limit'] : []),   // LW_UNCAPPED=1: no vsync cap, so a frame's cost shows as fps above the display's rate
  `--window-size=${W + 16},${H + 120}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
const R = { theme, device, at: new Date().toISOString(), shots: [], perf: [] };
let ws;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page'); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: +(process.env.LW_DSF || 1), mobile: phone });
  if (phone) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: `https://127.0.0.1:${process.env.LW_PORT || 9441}/lab/?sw=0&warn=0` });
  console.log('navigated');
  let up = false; for (let i = 0; i < 600 && !up; i++) { try { up = await ev('try { if (__LW.warning.open) __LW.warning.dismiss(); } catch (_) {} return !!(window.__LW && __LW.ready && __LW.timeline)'); } catch {} if (!up) await sleep(100); }
  console.log('ready', up, JSON.stringify(await ev(`return { href: location.href, warn: !!(window.__LW && __LW.warning && __LW.warning.open), field: window.__LW && __LW.field && { ok: __LW.field.ok, err: String(__LW.field.error || '') } }`).catch((e) => String(e))));
  R.boot = await ev(`try { if (__LW.warning.open) __LW.warning.dismiss(); } catch (_) {}
    window.__w = (ms) => new Promise((r) => setTimeout(r, ms));
    window.__closeAll = () => { try { __LW.timeline.close(); } catch (_) {} try { __LW.layout.modulation.collapse(); } catch (_) {}
      try { __LW.layout.notebook.close(); } catch (_) {} try { __LW.layout.menu.close(); } catch (_) {}
      try { const p = document.getElementById('lwMenu'); if (p && !p.hidden) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', bubbles: true })); } catch (_) {}
      try { if (__LW.keymap && __LW.keymap.isOpen) __LW.keymap.close(); } catch (_) {}
      document.querySelectorAll('.mb-list').forEach((l) => { l.hidden = true; }); };
    if (${JSON.stringify(theme)} === 'dark') __LW.setTheme('dark');
    const sh = [...document.styleSheets].find((s) => (s.href || '').endsWith('/skin.css'));
    const i = [...sh.cssRules].findIndex((r) => r.selectorText && r.selectorText.includes(':not(:where(.tl-toolbar'));
    window.__q5 = { sh, i, text: i >= 0 ? sh.cssRules[i].cssText : null,
      off() { if (this.sh.cssRules[this.i] && this.sh.cssRules[this.i].cssText === this.text) this.sh.deleteRule(this.i); },
      on() { if (!this.sh.cssRules[this.i] || this.sh.cssRules[this.i].cssText !== this.text) this.sh.insertRule(this.text, this.i); } };
    await __w(2500); __closeAll(); await __w(300);
    await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __w(1500);
    return { ok: __LW.field.ok, adapter: __LW.field.adapterInfo, ua: navigator.userAgent, w: innerWidth, h: innerHeight, phone: document.body.classList.contains('phone'),
      body: document.body.className, card: document.body.dataset.card, frostLive: __LW.frostLive, rule: i };`);
  console.log('boot', JSON.stringify(R.boot));
  if (R.boot.rule < 0) throw new Error('the Q5 rule is not in skin.css');
  const census = (tag) => ev(`const { census } = await import('./mir/shell/gui.js'); return census();`);
  const snap = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(HERE, name), Buffer.from(r.result.data, 'base64')); };

  if (PERF && !phone) {
    /* the compositor's cost: the timeline open over benzene, PLAYING (the field repaints under the glass every frame), 120 frames a read,
       the law ON and OFF interleaved three times each, the same page */
    await ev(`__closeAll(); __LW.timeline.open(); await __w(1200); __LW.play(); await __w(2000); return 1;`);
    for (let k = 0; k < 10; k++) {
      const mode = k % 2 ? 'before' : 'after';
      const r = await ev(`__q5.${mode === 'before' ? 'off' : 'on'}(); await __w(600); __LW.perf.resetRing(); const iv = []; let last = performance.now();
        await new Promise((done) => { const step = (t) => { iv.push(t - last); last = t; if (iv.length < 121) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
        iv.shift(); const s = iv.slice().sort((a, b) => a - b), q = (p) => +s[Math.floor(p * (s.length - 1))].toFixed(2);
        const mean = iv.reduce((a, b) => a + b, 0) / iv.length; const { census } = await import('./mir/shell/gui.js');
        return { frames: iv.length, fps: +(1000 / mean).toFixed(1), medianMs: q(.5), p90Ms: q(.9), loopMedianMs: +(__LW.perf.median || 0).toFixed(3), blurred: census().blur };`);
      r.mode = mode; R.perf.push(r); console.log('perf', mode, JSON.stringify(r));
    }
    await ev(`__q5.on(); __LW.pause(); __closeAll(); await __w(500); return 1;`);
  }

  const SCENES = {
    josh: `__LW.chem.setView('orbital'); __LW.setStyle('solid'); __LW.camera.setDist(${phone ? 3.4 : 2.2}); __LW.timeline.open()`,
    timeline: `__LW.chem.setView('density'); __LW.setStyle('cloud'); __LW.camera.reset(); __LW.timeline.open()`,
    rack: `for (const id of ['chem', 'settings', 'camera']) { const d = document.querySelector('.dev[data-id="' + id + '"]');
      if (d && d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); }`,
    menu: `__LW.layout.menu.open(); const bar = document.getElementById('menubar');
      const btn = bar && [...bar.querySelectorAll('.mb-btn')].find((b) => b.dataset.menu === 'WINDOW'); if (btn) btn.click()`,
    picker: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', bubbles: true }))`,
    modwin: `__LW.layout.modulation.expand()`,
    keyboard: `if (__LW.keymap && __LW.keymap.open) __LW.keymap.open()`,
    notebook: `__LW.layout.notebook.open()`,
  };
  for (const [scene, setup] of Object.entries(process.argv.includes('--no-shots') ? {} : SCENES)) {
    await ev(`__q5.on(); __closeAll(); ${setup}; await __w(1500); __LW.pause && __LW.pause(); await __w(400); return 1;`);
    for (const mode of ['after', 'before']) {
      const n = await ev(`__q5.${mode === 'before' ? 'off' : 'on'}(); await __w(400); const out = [];
        for (const e of document.body.querySelectorAll('*')) { if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
          for (const p of [null, '::before', '::after']) { const cs = getComputedStyle(e, p); if (p && (cs.content === 'none' || cs.content === 'normal')) continue;
            if (cs.backdropFilter && cs.backdropFilter !== 'none') out.push((e.id ? '#' + e.id : e.tagName.toLowerCase()) + '.' + [...e.classList].slice(0, 3).join('.') + (p || '')); } }
        return out;`);
      const name = `${mode}-${theme}-${device}-${scene}.png`; await snap(name);
      R.shots.push({ scene, mode, name, blurred: n });
    }
    console.log(scene.padEnd(9), R.shots.slice(-2).map((s) => s.mode + ' ' + s.blurred.length).join(' · '), '| after:', [...new Set(R.shots.slice(-2)[0].blurred)].join(' '));
  }
  await ev(`__q5.on(); return 1;`);
  R.errs = await ev(`return window.__e || []`);
} catch (e) { console.error('ERROR', e); R.error = String(e && e.stack || e); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch {} proc.kill(); await sleep(500); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
fs.writeFileSync(path.join(HERE, `chromium-${theme}-${device}${process.argv.includes('--no-shots') ? '-perf' : ''}${process.env.LW_DSF ? '-dsf' + process.env.LW_DSF : ''}${process.env.LW_UNCAPPED ? '-uncapped' : ''}.json`), JSON.stringify(R, null, 1));
