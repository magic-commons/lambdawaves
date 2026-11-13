#!/usr/bin/env node
// package.mjs — build dist/ at the repo root, package it for linux-x64 and win32-x64 (`--platform linux` or `--platform win32` builds one;
// arguments after `--` go to build-deploy, e.g. `-- --shelf <volumes.json> --ship vol-1`), write out/build-identity.json, and put in each
// package's root what a GPL binary owes (LEGAL-PROVENANCE §3/§6, 028 R-29): SOURCE.md (tag, commit, repository), COPYING (λWAVES' LICENSE,
// GPL-3.0 — Electron's own LICENSE keeps its name beside it) and NOTICE. The folders are what SteamPipe uploads (docs/release/STEAM.md):
// out/lambdawaves-linux-x64 (launch `lambdawaves`) and out/lambdawaves-win32-x64 (launch `lambdawaves.exe`).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
import { distHash } from './dist-hash.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../..'), OUT = path.join(HERE, 'out'), DIST = path.join(REPO, 'dist');
const argv = process.argv.slice(2), cut = argv.indexOf('--'), own = cut < 0 ? argv : argv.slice(0, cut);
execFileSync(process.execPath, ['tools/build-deploy.mjs', '--quiet', '--desktop', ...(cut < 0 ? [] : argv.slice(cut + 1))], { cwd: REPO, stdio: 'inherit' }); // throws, and so stops, on failure
// 028 R-28: the binary's version is BUILD_LINE's leading token (the one place the number lives); package.json's version is 0.0.0, not a seat.
const appVersion = (fs.readFileSync(path.join(REPO, 'lab/build-line.js'), 'utf8').match(/BUILD_LINE = '([^ ']+)/) || [])[1];
if (!appVersion) throw new Error('package.mjs: no BUILD_LINE in lab/build-line.js');
const MAKER = 'MAGIC COMMONS';   // 044 S2 · S6 (Josh 11-12): the company the Windows program names, and its copyright line ("Change that too")
const copyright = 'Copyright ' + fs.readFileSync(path.join(REPO, 'NOTICE'), 'utf8').split('\n')[1].match(/\d{4}/)[0] + ' ' + MAKER;   // the year is NOTICE's; NOTICE itself, copied into the package, keeps its own line
const ver = (m) => JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules', m, 'package.json'), 'utf8')).version;
const at = own.indexOf('--platform'), platform = (at < 0 ? 'linux,win32' : own[at + 1]).split(',').sort();
// lambdawaves.ico is lab/img/icon-512.png at 16–256 px (PIL: Image.save(sizes=…)); the exe and the taskbar wear it, Linux takes the PNG at run time
const paths = await packager({ dir: HERE, out: OUT, platform, arch: 'x64', asar: true, overwrite: true, extraResource: [DIST], appVersion,
  name: 'lambdawaves', executableName: 'lambdawaves', icon: path.join(HERE, 'lambdawaves.ico'), appCopyright: copyright,
  win32metadata: { CompanyName: MAKER, FileDescription: 'λWAVES', ProductName: 'λWAVES', InternalName: 'lambdawaves', OriginalFilename: 'lambdawaves.exe' },
  ignore: [/^\/(out|node_modules)(\/|$)/, /^\/(package|smoke-run|dist-hash)\.mjs$/, /^\/package-lock\.json$/, /\.ico$/] });
// 044 S1 (Josh 11-12: "steam version does not show logo"): the MAIN MENU's credits strip is not built on the desktop (lab/picker.js, lab/loader.js
// read window.lwavesDesktop), and its files — three companies' marks, Google Sans Flex, and OpenAI Sans, which has no licence in the tree
// (LEGAL-PROVENANCE row 18) — are not in the package at all. The site's dist/ keeps them; the identity below hashes what the package holds.
const AI_MARKS = ['img/ai', 'img/menu/ai', 'img/menu/tip-qr.svg'], inner = (p) => path.join(p, 'resources/dist');   // 044 S7: and the tip jar's QR (no ko-fi card on the desktop)
for (const p of paths) for (const d of AI_MARKS) fs.rmSync(path.join(inner(p), d), { recursive: true, force: true });
const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); } catch { return null; } };
const id = { appVersion, gitSha: git('rev-parse', 'HEAD'), gitTag: git('describe', '--tags', '--always'), ...distHash(inner(paths[0])), electron: ver('electron'), packager: ver('@electron/packager'), builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, 'build-identity.json'), JSON.stringify(id, null, 1) + '\n');
const source = `# λWAVES desktop — corresponding source\n\nThis binary was built from https://github.com/magic-commons/lambdawaves at tag \`${id.gitTag}\`, commit \`${id.gitSha}\`.\n` +
  `The source archive is attached to the matching GitHub Release. dist/ sha256 ${id.distSha256} (${id.fileCount} files), Electron ${id.electron}.\n` +
  `λWAVES is GPL-3.0-only: COPYING is its licence, NOTICE its third-party notices; LICENSE and LICENSES.chromium.html are Electron's.\n`;   // no clock in it: the same commit packs the same bytes
fs.writeFileSync(path.join(OUT, 'SOURCE.md'), source);
for (const p of paths) {
  fs.writeFileSync(path.join(p, 'SOURCE.md'), source);
  fs.copyFileSync(path.join(REPO, 'LICENSE'), path.join(p, 'COPYING'));
  fs.copyFileSync(path.join(REPO, 'NOTICE'), path.join(p, 'NOTICE'));
}
console.log(paths.join('\n') + '\n' + JSON.stringify(id));
