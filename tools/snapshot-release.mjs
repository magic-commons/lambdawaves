#!/usr/bin/env node
/* tools/snapshot-release.mjs — a PLAYABLE SNAPSHOT of every release, outside the repository.
 *
 *   node tools/snapshot-release.mjs v0.3.0-alpha          one tag
 *   node tools/snapshot-release.mjs --all                 every v* tag that has no snapshot yet
 *   node tools/snapshot-release.mjs --all --force         re-export every v* tag
 *   LW_SNAPSHOTS=/somewhere node tools/snapshot-release.mjs …   (default: ~/Documents/LAMBDAWAVES-RELEASES)
 *
 * Josh's rule (2026-09-25): "snapshots made for every release". A git tag is the record; this is the COPY YOU CAN PLAY
 * when the tree has moved on — the tag's `lab/`, `serve.sh` and the vendored HTTPS server, with the release's README,
 * CHANGELOG, LICENSE and NOTICE for provenance, exported with `git archive` (so nothing uncommitted can leak in) into
 * `<dest>/<tag>/`, plus a PLAY.md that says how to run it. The vault note `LAMBDAWAVES RELEASES — INDEX.md` in
 * ~/Documents/OBSIDIAN is rewritten from the snapshots on disk each time, so it never drifts from what exists.
 * Exit 1 if the tag does not exist or a snapshot cannot be written. Never touches the repository's own tree. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const ALL = args.includes('--all'), FORCE = args.includes('--force');
const tags = args.filter((a) => !a.startsWith('--'));
const DEST = process.env.LW_SNAPSHOTS || path.join(os.homedir(), 'Documents', 'LAMBDAWAVES-RELEASES');
const VAULT_NOTE = process.env.LW_SNAPSHOT_INDEX || path.join(os.homedir(), 'Documents', 'OBSIDIAN', 'LAMBDAWAVES RELEASES — INDEX.md');
const PARTS = ['lab', 'serve.sh', 'tools/gate/server.py', 'README.md', 'CHANGELOG.md', 'LICENSE', 'NOTICE', 'CITATION.cff'];

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const allTags = () => git('tag', '--list', 'v*', '--sort=version:refname').split('\n').filter(Boolean);
const tagInfo = (t) => {
  const date = git('log', '-1', '--format=%cs', t);
  const commit = git('rev-parse', '--short', t);
  let message = '';
  try { message = git('tag', '-l', '--format=%(contents:subject)', t); } catch (_) {}
  return { tag: t, date, commit, message: message || git('log', '-1', '--format=%s', t) };
};
const present = (t) => { try { return git('cat-file', '-e', `${t}^{commit}`) === ''; } catch (_) { return false; } };

function snapshot(t) {
  if (!present(t)) { console.error(`snapshot: no such tag ${t}`); return false; }
  const dir = path.join(DEST, t);
  if (fs.existsSync(dir) && !FORCE) { console.log(`snapshot: ${t} exists at ${dir} (use --force to re-export)`); return true; }
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const parts = PARTS.filter((p) => { try { git('cat-file', '-e', `${t}:${p}`); return true; } catch (_) { return false; } });
  const tar = execFileSync('git', ['archive', '--format=tar', t, ...parts], { maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  const info = tagInfo(t);
  const play = `# λWAVES ${t} — a playable snapshot\n\n` +
    `Exported from the git tag \`${t}\` (commit \`${info.commit}\`, ${info.date}) by \`tools/snapshot-release.mjs\`.\n` +
    `Release note: ${info.message}\n\n` +
    `## Play it\n\n\`\`\`\ncd "${dir}"\n./serve.sh 8790\n\`\`\`\n\n` +
    `then open https://127.0.0.1:8790/lab/ — the server is the vendored \`tools/gate/server.py\` (self-signed, it makes\n` +
    `its own certificate in \`.certs/\` on first run; accept it once). Add \`?sw=0\` to the address to play without the\n` +
    `service worker (no offline install, nothing cached). Each snapshot is its own origin by port, so its saved projects\n` +
    `and settings live apart from the live app's.\n\n` +
    `## What is here\n\n${parts.map((p) => `- \`${p}\``).join('\n')}\n\n` +
    `The tests, the research folder and the deploy tooling are not part of a snapshot: the tag has them.\n`;
  fs.writeFileSync(path.join(dir, 'PLAY.md'), play);
  fs.writeFileSync(path.join(dir, 'SNAPSHOT.json'), JSON.stringify({ ...info, exported: new Date().toISOString(), parts }, null, 1));
  console.log(`snapshot: ${t} → ${dir} (${info.commit}, ${info.date})`);
  return true;
}

function writeIndex() {
  if (!fs.existsSync(DEST)) return;
  const rows = fs.readdirSync(DEST).filter((d) => fs.existsSync(path.join(DEST, d, 'SNAPSHOT.json')))
    .map((d) => JSON.parse(fs.readFileSync(path.join(DEST, d, 'SNAPSHOT.json'), 'utf8')))
    .sort((a, b) => a.date.localeCompare(b.date) || a.tag.localeCompare(b.tag));
  const table = rows.map((r) => `| **${r.tag}** | ${r.date} | \`${r.commit}\` | ${r.message.replace(/\|/g, '\\|')} | \`${path.join(DEST, r.tag)}\` |`).join('\n');
  const note = `---\ntitle: LAMBDAWAVES RELEASES — index\ncreated: 2026-09-25\ntags:\n  - lambdawaves\n  - releases\n  - index\n---\n\n` +
    `# λWAVES releases — the playable snapshots\n\n` +
    `Every tagged release of λWAVES, exported as a copy you can play after the tree has moved on. Made by\n` +
    `\`node tools/snapshot-release.mjs <tag>\` in the repository (RELEASING.md names it as a release step); the copies live\n` +
    `in \`${DEST}\`, one folder per tag, each with a PLAY.md. This note is rewritten from what is on disk.\n\n` +
    `To play one: \`cd "${DEST}/<tag>" && ./serve.sh 8790\`, then https://127.0.0.1:8790/lab/ (accept the self-signed\n` +
    `certificate once). The git tag is the record; the snapshot is the copy.\n\n` +
    `| Release | Date | Commit | What it was | Folder |\n|---|---|---|---|---|\n${table}\n\n` +
    `The pre-release freezes (\`pre-alpha-1\`, \`pre-alpha-2\`) exist as tags only.\n`;
  fs.mkdirSync(path.dirname(VAULT_NOTE), { recursive: true });
  fs.writeFileSync(VAULT_NOTE, note);
  console.log(`index: ${VAULT_NOTE} (${rows.length} snapshots)`);
}

const wanted = ALL ? allTags() : tags;
if (!wanted.length) { console.error('usage: node tools/snapshot-release.mjs <tag> | --all [--force]'); process.exit(2); }
let ok = true;
for (const t of wanted) ok = snapshot(t) && ok;
writeIndex();
process.exit(ok ? 0 : 1);
