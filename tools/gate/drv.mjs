// Minimal WebDriver client for geckodriver (Node 22; node:http transport --
// global fetch caps at undici's 300 s headersTimeout, see req() below).
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import { existsSync } from 'node:fs';

const PORT = Number(process.env.GD_PORT || 4444);
const BASE = `http://127.0.0.1:${PORT}`;

export async function startDriver() {
  // Refuse an occupied port before spawning: /status can belong to another run.
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(PORT, '127.0.0.1', () => probe.close(resolve));
  });
  /* Ubuntu's /snap/bin/geckodriver is a launcher. It asks snapd to create the real
     process and then exits, so the ChildProcess returned by spawn() no longer owns
     the listener: p.kill() succeeds against the dead launcher while geckodriver and
     its Firefox can remain for hours. Spawn the bundled executable itself when it
     exists, keeping the ordinary PATH fallback for non-Snap installations. */
  const snapBinary = '/snap/firefox/current/usr/lib/firefox/geckodriver';
  const binary = process.env.GECKODRIVER || (existsSync(snapBinary) ? snapBinary : 'geckodriver');
  const p = spawn(binary,
    ['--port', String(PORT), '--host', '127.0.0.1', '--allow-hosts', '127.0.0.1', 'localhost'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let startupError;
  p.once('error', error => { startupError = error; });
  p.stdout.on('data', () => {});
  p.stderr.on('data', (d) => { if (process.env.GD_VERBOSE) process.stderr.write(d); });
  try {
    for (let i = 0; i < 100; i++) {
      if (startupError) throw startupError;
      if (p.exitCode !== null || p.signalCode !== null) throw new Error('geckodriver exited during startup');
      try {
        const r = await fetch(BASE + '/status', { signal: AbortSignal.timeout(500) });
        const status = r.ok ? await r.json() : null;
        if (status?.value?.ready && p.exitCode === null && !startupError) return p;
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('geckodriver did not come up');
  } catch (error) {
    if (p.pid && p.exitCode === null && p.signalCode === null) p.kill();
    throw error;
  }
}

/* node:http, NOT global fetch.  FOUND BY A FAILURE, not by reading: Node 22's
   undici sets headersTimeout to 300 000 ms, so ANY execute/async that takes
   longer than five minutes comes back as a bare "TypeError: fetch failed" with
   the browser still happily running — which is exactly what a Batch-2b phase
   does (a scripted orbit is minutes of real wall-clock time by construction).
   The WebDriver script timeout is the one that should govern, so the transport
   is given none at all. */
function req(method, path, body) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const r = http.request(BASE + path, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        payload === undefined ? {} : { 'Content-Length': Buffer.byteLength(payload) })
    }, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { buf += d; });
      res.on('end', () => {
        let j = {};
        try { j = JSON.parse(buf); } catch (_) {}
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(method + ' ' + path + ' -> ' + res.statusCode + ' ' +
                           JSON.stringify(j).slice(0, 800)));
          return;
        }
        resolve(j.value);
      });
    });
    r.setTimeout(0);
    r.on('error', reject);
    if (payload !== undefined) r.write(payload);
    r.end();
  });
}

export async function newSession(opts = {}) {
  const args = opts.headless === false ? [] : ['-headless'];
  if (opts.width) args.push('-width', String(opts.width), '-height', String(opts.height || 900));
  const caps = {
    capabilities: {
      alwaysMatch: {
        acceptInsecureCerts: true,
        'moz:firefoxOptions': {
          ...(process.env.FIREFOX_BINARY ? { binary: process.env.FIREFOX_BINARY } :
            existsSync('/snap/firefox/current/usr/lib/firefox/firefox') ?
              { binary: '/snap/firefox/current/usr/lib/firefox/firefox' } : {}),
          args,
          /* S2-LAG: `opts.prefs` is ADDITIVE and defaults to nothing, so every
             harness written before it gets exactly the profile it always got.
             (s2lag* passes privacy.reduceTimerPrecision:false — performance.now()
             is 1 ms-quantised by default, which is coarser than the per-frame
             costs this wave has to separate.) */
          prefs: Object.assign({
            'dom.webgpu.enabled': true,
            'gfx.webgpu.force-enabled': true,
            'dom.webgpu.workers.enabled': true,
            'browser.shell.checkDefaultBrowser': false,
            'datareporting.policy.dataSubmissionEnabled': false,
            'toolkit.telemetry.enabled': false,
            'devtools.console.stdout.content': true
          }, opts.prefs || {})
        }
      }
    }
  };
  const v = await req('POST', '/session', caps);
  return v.sessionId;
}

export const go     = (s, url)     => req('POST', `/session/${s}/url`, { url });
export const quit   = (s)          => req('DELETE', `/session/${s}`);
export const setTO  = (s, t)       => req('POST', `/session/${s}/timeouts`, t);
export const evalA  = (s, src, a=[]) => req('POST', `/session/${s}/execute/async`, { script: src, args: a });
export const evalS  = (s, src, a=[]) => req('POST', `/session/${s}/execute/sync`,  { script: src, args: a });

/* ⟡ WAVE-FIX2: THE ACTIONS ENDPOINT.  Every gate before this one drove the app
   with `new PointerEvent(...)` dispatched from page script.  A synthetic event
   is not a pointer: it never enters the browser's own pointer-capture state
   machine, so implicit touch capture, capture transfer and the
   `lostpointercapture` notification simply do not happen for it.  That is the
   blind spot this wave was called in to fix — WebDriver Actions produce a REAL
   pointer, including a real `pointerType: "touch"` one. */
export const actions    = (s, a) => req('POST',   `/session/${s}/actions`, { actions: a });
export const relActions = (s)    => req('DELETE', `/session/${s}/actions`);
