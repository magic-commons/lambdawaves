import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assertPublicTree } from '../tools/release-inputs.mjs';

const root = mkdtempSync(path.join(tmpdir(), 'lw-release-'));
try {
  writeFileSync(path.join(root, 'index.html'), '<!doctype html>');
  mkdirSync(path.join(root, 'vendor'));
  writeFileSync(path.join(root, 'vendor/LICENSE'), 'Public attribution');
  assert.doesNotThrow(() => assertPublicTree(root));
  for (const file of ['.env', '.env.production', 'tls.pem', 'key.p12', 'rack.js.bak', 'skin.css~']) {
    const target = path.join(root, 'vendor', file);
    writeFileSync(target, 'local');
    assert.throws(() => assertPublicTree(root), /Unsafe release input/);
    rmSync(target);
  }
  for (const name of ['.git', 'node_modules']) {
    const target = path.join(root, name);
    mkdirSync(target);
    assert.throws(() => assertPublicTree(root), /Unsafe release input/);
    rmSync(target, { recursive: true });
  }
  // Both a file link outside the tree and a recursive directory link must fail.
  for (const target of [path.join(root, 'index.html'), root]) {
    const link = path.join(root, 'alias');
    symlinkSync(target, link);
    assert.throws(() => assertPublicTree(root), /link or special file/);
    rmSync(link);
  }
  const disguised = path.join(root, 'asset.txt');
  writeFileSync(disguised, '-----BEGIN RSA PRIVATE KEY-----\nDO-NOT-PRINT-ME');
  assert.throws(() => assertPublicTree(root), error =>
    /private key material/.test(error.message) && !error.message.includes('DO-NOT-PRINT-ME'));
  rmSync(disguised);
  assert.doesNotThrow(() => assertPublicTree(root));
  console.log('GREEN release-inputs: public files accepted; local files, links and private keys rejected');
} finally { rmSync(root, { recursive: true, force: true }); }
