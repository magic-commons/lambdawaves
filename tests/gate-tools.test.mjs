import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const fixture = mkdtempSync(path.join(tmpdir(), 'lw-gate-'));
const listen = server => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const close = server => new Promise(resolve => server.close(resolve));
const run = (mode, env = {}) => spawnSync('bash', ['test.sh', mode], {
  cwd: fixture, encoding: 'utf8', timeout: 20000,
  env: { ...process.env, LW_CERTS: path.join(fixture, '.certs'), ...env },
});
try {
  mkdirSync(path.join(fixture, 'tests'));
  mkdirSync(path.join(fixture, 'tools/gate'), { recursive: true });
  copyFileSync(path.join(repo, 'test.sh'), path.join(fixture, 'test.sh'));
  copyFileSync(path.join(repo, 'tools/gate/server.py'), path.join(fixture, 'tools/gate/server.py'));
  writeFileSync(path.join(fixture, 'tests/added.test.mjs'), "console.log('DISCOVERED'); process.exit(1);\n");
  writeFileSync(path.join(fixture, 'tests/pwa.test.mjs'), "console.log('PWA_LAST');\n");
  writeFileSync(path.join(fixture, 'tests/boot.browser-test.mjs'), "console.log('BROWSER_ONLY');\n");
  const node = run('node');
  assert.equal(node.status, 1, node.stderr);
  assert.match(node.stdout, /DISCOVERED[\s\S]*PWA_LAST/);
  assert.doesNotMatch(node.stdout, /BROWSER_ONLY/);
  assert.equal(run('typo').status, 2);

  const occupied = net.createServer();
  const port = await listen(occupied);
  try {
    const blocked = run('browser', { LW_PORT: String(port) });
    assert.equal(blocked.status, 1, blocked.stderr);
    assert.match(blocked.stderr, /Browser gate server failed to start/);
    assert.doesNotMatch(blocked.stdout, /BROWSER_ONLY|DISCOVERED/);
    const driver = spawnSync(process.execPath, ['--input-type=module', '-e',
      `import { startDriver } from ${JSON.stringify(new URL('../tools/gate/drv.mjs', import.meta.url).href)}; await startDriver();`],
    { encoding: 'utf8', timeout: 5000, env: { ...process.env, GD_PORT: String(port) } });
    assert.equal(driver.status, 1);
    assert.match(driver.stderr, /EADDRINUSE/);
  } finally { await close(occupied); }

  const browser = run('browser', { LW_PORT: String(port) });
  assert.equal(browser.status, 0, browser.stderr);
  assert.match(browser.stdout, /BROWSER_ONLY/);
  assert.doesNotMatch(browser.stdout, /DISCOVERED|PWA_LAST/);
  // The shell's EXIT trap must release its HTTPS server after the browser exits.
  const released = net.createServer();
  await new Promise((resolve, reject) => {
    released.once('error', reject);
    released.listen(port, '127.0.0.1', resolve);
  });
  await close(released);

  // R-10: a percent-encoded dot is still a dot segment — the server judges the path it will serve, not the raw one.
  for (const [d, f] of [['.claude', 'x.txt'], ['.tmp', 'y.txt'], ['lab', 'ok.txt']]) {
    mkdirSync(path.join(fixture, d), { recursive: true }); writeFileSync(path.join(fixture, d, f), 'x');
  }
  const srv = spawn('python3', [path.join(fixture, 'tools/gate/server.py'), fixture, String(port)],
    { env: { ...process.env, LW_CERTS: path.join(fixture, '.certs') }, stdio: ['ignore', 'pipe', 'inherit'] });
  try {
    await new Promise((resolve, reject) => { srv.stdout.on('data', (b) => /gate server on/.test(b) && resolve()); srv.once('exit', reject); });
    const status = (p) => new Promise((resolve, reject) => https.get({ host: '127.0.0.1', port, path: p, rejectUnauthorized: false },
      (r) => { r.resume(); resolve(r.statusCode); }).on('error', reject));
    assert.equal(await status('/lab/ok.txt'), 200);
    assert.equal(await status('/%2Eclaude/x.txt'), 404);
    assert.equal(await status('/lab/%2E%2E/%2Etmp/y.txt'), 404);
  } finally { srv.kill(); }
  console.log('GREEN gate-tools: suite discovery, failure propagation, mode isolation, port ownership, server cleanup and encoded dot segments');
} finally { rmSync(fixture, { recursive: true, force: true }); }
