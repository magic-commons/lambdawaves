#!/usr/bin/env node
// package.mjs — build dist/ at the repo root, package linux-x64 + win32-x64 around it, write out/build-identity.json, and put in each
// package's root what a GPL binary owes (LEGAL-PROVENANCE §3/§6, 028 R-29): SOURCE.md (tag, commit, repository), COPYING (λWAVES' LICENSE,
// GPL-3.0 — Electron's own LICENSE keeps its name beside it) and NOTICE.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
import { distHash } from './dist-hash.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../..'), OUT = path.join(HERE, 'out'), DIST = path.join(REPO, 'dist');
execFileSync(process.execPath, ['tools/build-deploy.mjs', '--quiet'], { cwd: REPO, stdio: 'inherit' }); // throws, and so stops, on failure
// 028 R-28: the binary's version is BUILD_LINE's leading token (the one place the number lives); package.json's version is 0.0.0, not a seat.
const appVersion = (fs.readFileSync(path.join(REPO, 'lab/build-line.js'), 'utf8').match(/BUILD_LINE = '([^ ']+)/) || [])[1];
if (!appVersion) throw new Error('package.mjs: no BUILD_LINE in lab/build-line.js');
const ver = (m) => JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules', m, 'package.json'), 'utf8')).version;
const paths = await packager({ dir: HERE, out: OUT, platform: ['linux', 'win32'], arch: 'x64', asar: true, overwrite: true, extraResource: [DIST], appVersion,
  ignore: [/^\/(out|node_modules)(\/|$)/, /^\/(package|smoke-run|dist-hash)\.mjs$/] });
const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); } catch { return null; } };
const id = { appVersion, gitSha: git('rev-parse', 'HEAD'), gitTag: git('describe', '--tags', '--always'), ...distHash(DIST), electron: ver('electron'), packager: ver('@electron/packager'), builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, 'build-identity.json'), JSON.stringify(id, null, 1) + '\n');
const source = `# λWAVES desktop — corresponding source\n\nThis binary was built from https://github.com/magic-commons/lambdawaves at tag \`${id.gitTag}\`, commit \`${id.gitSha}\`.\n` +
  `The source archive is attached to the matching GitHub Release. dist/ sha256 ${id.distSha256} (${id.fileCount} files), Electron ${id.electron}, built ${id.builtAt}.\n` +
  `λWAVES is GPL-3.0-only: COPYING is its licence, NOTICE its third-party notices; LICENSE and LICENSES.chromium.html are Electron's.\n`;
fs.writeFileSync(path.join(OUT, 'SOURCE.md'), source);
for (const p of paths) {
  fs.writeFileSync(path.join(p, 'SOURCE.md'), source);
  fs.copyFileSync(path.join(REPO, 'LICENSE'), path.join(p, 'COPYING'));
  fs.copyFileSync(path.join(REPO, 'NOTICE'), path.join(p, 'NOTICE'));
}
console.log(paths.join('\n') + '\n' + JSON.stringify(id));
