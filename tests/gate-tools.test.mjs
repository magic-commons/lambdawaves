import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
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
  console.log('GREEN gate-tools: suite discovery, failure propagation, mode isolation, port ownership and server cleanup');
} finally { rmSync(fixture, { recursive: true, force: true }); }
