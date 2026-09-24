#!/usr/bin/env node
// package.mjs — build dist/ at the repo root, package linux-x64 + win32-x64 around it, write out/build-identity.json.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
import { distHash } from './dist-hash.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../..'), OUT = path.join(HERE, 'out'), DIST = path.join(REPO, 'dist');
execFileSync(process.execPath, ['tools/build-deploy.mjs', '--quiet'], { cwd: REPO, stdio: 'inherit' }); // throws, and so stops, on failure
const ver = (m) => JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules', m, 'package.json'), 'utf8')).version;
const paths = await packager({ dir: HERE, out: OUT, platform: ['linux', 'win32'], arch: 'x64', asar: true, overwrite: true, extraResource: [DIST],
  ignore: [/^\/(out|node_modules)(\/|$)/, /^\/(package|smoke-run|dist-hash)\.mjs$/] });
const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); } catch { return null; } };
const id = { gitSha: git('rev-parse', 'HEAD'), gitTag: git('describe', '--tags', '--always'), ...distHash(DIST), electron: ver('electron'), packager: ver('@electron/packager'), builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, 'build-identity.json'), JSON.stringify(id, null, 1) + '\n');
console.log(paths.join('\n') + '\n' + JSON.stringify(id));
