#!/usr/bin/env bash
# tools/release/archive-research.sh — move the repository's research record out of the tree (research/iteration-029/R-REPO.md, its MOVES rows).
#
#   tools/release/archive-research.sh             dry run (the default): print the plan, change nothing
#   tools/release/archive-research.sh --apply     copy each path to the vault, verify the copy byte for byte, git rm it,
#                                                 rewrite the citations, regenerate CHANGELOG.md, run the gates; stage, never commit
#
#   VAULT=/elsewhere tools/release/archive-research.sh …   (default ~/Documents/DATABASE/CLAUDE/APPS/LAMBDAWAVES/RESEARCH)
#
# --apply refuses unless the tag research-archive-2026-10-30 exists and still holds every path (the integrator cuts it on the commit
# before the move), the working tree is clean, and no destination exists in the vault. One use: --apply removes this script too.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"
VAULT=${VAULT:-$HOME/Documents/DATABASE/CLAUDE/APPS/LAMBDAWAVES/RESEARCH}
TAG=research-archive-2026-10-30
APPLY=0
case "${1:-}" in --apply) APPLY=1 ;; '' | --dry-run) ;; *) echo "usage: $0 [--apply]" >&2; exit 2 ;; esac

MOVES=(research REPORT.md docs/history docs/BROWSER-BASELINE-2026-09-08.md docs/OPTIMIZATION-2026-09-24.md docs/REVIEW-2026-09-15.md
  docs/MIR-1.5-CANARY.md docs/mir-matrix-patch.json store .claude/handoffs)
DELETES=(research/DISK.md tools/disk.mjs)
VAULT_NOTES="~/Documents/DATABASE/CLAUDE/APPS/LAMBDAWAVES/RESEARCH"
LEGEND="A \`research/…\` path, \`REPORT.md\` or \`docs/history/…\` cited in these files is archived: the tag \`$TAG\` holds it, and so does the vault copy at \`$VAULT_NOTES/<the same path>\`."

say() { printf '%s\n' "$*"; }
die() { printf 'archive-research: %s\n' "$*" >&2; exit 1; }
# rep FILE FROM TO — replace one literal occurrence; fail when FROM is absent (the tree moved since this script was written)
rep() {
  node -e 'const fs=require("fs"),[f,a,b]=process.argv.slice(1),t=fs.readFileSync(f,"utf8");
    if(!t.includes(a)){console.error("archive-research: not found in "+f+": "+a);process.exit(1)}fs.writeFileSync(f,t.replace(a,()=>b))' "$1" "$2" "$3"
}
# dropline FILE PREFIX — delete the one line that starts with PREFIX
dropline() {
  node -e 'const fs=require("fs"),[f,p]=process.argv.slice(1),L=fs.readFileSync(f,"utf8").split("\n"),i=L.findIndex((x)=>x.startsWith(p));
    if(i<0){console.error("archive-research: no line starting "+JSON.stringify(p)+" in "+f);process.exit(1)}L.splice(i,1);fs.writeFileSync(f,L.join("\n"))' "$1" "$2"
}
# after FILE PREFIX LINE — insert LINE after the first line that starts with PREFIX
after() {
  node -e 'const fs=require("fs"),[f,p,l]=process.argv.slice(1),L=fs.readFileSync(f,"utf8").split("\n"),i=L.findIndex((x)=>x.startsWith(p));
    if(i<0){console.error("archive-research: no line starting "+JSON.stringify(p)+" in "+f);process.exit(1)}L.splice(i+1,0,l);fs.writeFileSync(f,L.join("\n"))' "$1" "$2" "$3"
}

say "λWAVES · archive the research record — $([ $APPLY = 1 ] && echo APPLY || echo 'DRY RUN (nothing changes; --apply does it)')"
say "vault: $VAULT"
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  say "tag:   $TAG → $(git rev-parse --short "$TAG^{commit}")"
else
  say "tag:   $TAG — NOT CUT (--apply refuses until it exists)"
fi
say ""
say "MOVES (copied to the vault at the same repo-relative path, then git rm):"
for p in "${MOVES[@]}"; do
  [ -e "$p" ] || die "$p is not in the tree"
  n=$(git ls-files -- "$p" | wc -l)
  sz=$(du -sh -- "$p" | cut -f1)
  dest="$VAULT/$p"; [ -e "$dest" ] && flag=' (DESTINATION EXISTS: --apply refuses)' || flag=''
  say "  $p  ·  $n tracked files · $sz on disk  →  $dest$flag"
done
say ""
say "DELETED (git rm; not copied):"
for p in "${DELETES[@]}"; do say "  $p"; done
say ""
say "KEPT IN THE TREE (relocated at 029 R3 — this script asserts no reader still points under research/):"
say "  tests/fixtures/{digest-lock-base,digest-lock-s4a,lw-facade,z2-fingerprint,reference-drive,oracle-pyscf,names-probe}.json"
say "  tools/library/census/ · tools/oracles/*.py"
say ""
say "REWRITES:"
say "  REPORT.md → docs/WAVES.md: its '### wave' headings alone (tools/changelog.mjs reads docs/WAVES.md first, REPORT.md at older tags)"
say "  tools/build-deploy.mjs: /REPORT.md no longer ships (its DOCS row and the site-root check)"
say "  tools/rack-deps.mjs: the summary is written to .tmp/rack-deps/ instead of research/release-0.5.2/"
say "  CLAUDE.md + docs/NOTES-FOR-AGENTS.md: the archive line; CLAUDE.md's two research/iteration-0NN pointers → the vault"
say "  .gitignore: the research/papers lines → /research/ (a local folder for the tools' shots and scores)"
say "  .github/workflows/verify.yml: the fetch-depth comment"
say "  CHANGELOG.md regenerated (its preamble names docs/WAVES.md)"
say ""
say "GATES after the rewrite: ./test.sh node · node tools/build-deploy.mjs --quiet · node tools/changelog.mjs --check ·"
say "  node tools/provenance.mjs --check · node tools/rack-deps.mjs --classes --no-write"
say ""
say "Citations that stay as prose (resolved by the archive line), files citing research/ by area:"
for a in docs/laws docs lab tools tests; do
  say "  $a: $(grep -rlF --exclude-dir=mir 'research/' "$a" 2>/dev/null | wc -l)"
done
[ $APPLY = 1 ] || { say ""; say "dry run: nothing changed."; exit 0; }

# ── APPLY ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
git rev-parse -q --verify "refs/tags/$TAG" >/dev/null || die "cut the tag first: git tag -a $TAG -m 'the last tree that holds research/' (on this commit)"
for p in "${MOVES[@]}"; do git cat-file -e "$TAG:$p" 2>/dev/null || die "the tag $TAG does not hold $p"; done
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "the working tree has changes: commit or set them aside first"
for p in "${MOVES[@]}"; do [ ! -e "$VAULT/$p" ] || die "$VAULT/$p exists: refusing to overwrite"; done
if grep -rnE "['\"\`](\.\./)*research/[^'\"\`]*\.(json|py|md)['\"\`]" tests --include='*.mjs' | grep -E 'readFileSync|new URL|FIXTURE' >/dev/null; then
  die "a test still reads a file under research/ (relocate it first; see R-REPO.md §3)"
fi

for p in "${DELETES[@]}"; do git rm -q -- "$p"; done
mkdir -p "$VAULT"
for p in "${MOVES[@]}"; do
  mkdir -p "$(dirname "$VAULT/$p")"
  cp -a -- "$p" "$VAULT/$p"                                   # the working tree's copy: ignored files (papers' PDFs, .npz) go too
  bad=$(git ls-files -z -- "$p" | xargs -0 -I{} sh -c 'cmp -s "$1" "$2/$1" || echo "$1"' _ {} "$VAULT" | head -5)
  [ -z "$bad" ] || die "the vault copy differs for: $bad"
  say "copied  $p → $VAULT/$p (verified)"
done

# REPORT.md's wave headings, for tools/changelog.mjs
{ printf '# λWAVES — the wave headings\n\n'
  printf 'One line per wave, the input of `node tools/changelog.mjs` (CHANGELOG.md). The engineering notes behind each wave are in git history\n'
  printf '(tag `%s`).\n\n' "$TAG"
  grep -E '^### wave' REPORT.md; } > docs/WAVES.md
git add docs/WAVES.md

for p in "${MOVES[@]}"; do git rm -r -q -- "$p"; rm -rf -- "$p"; done

dropline tools/build-deploy.mjs "  ['REPORT.md',"
rep tools/build-deploy.mjs "for (const f of ['LICENSE', 'NOTICE', 'REPORT.md', 'CHANGELOG.md'])" "for (const f of ['LICENSE', 'NOTICE', 'CHANGELOG.md'])"
rep tools/rack-deps.mjs "path.join(ROOT, 'research', 'release-0.5.2')" "path.join(ROOT, '.tmp', 'rack-deps')"
rep tools/rack-deps.mjs "wrote research/release-0.5.2/RACK-DEPS.md and research/release-0.5.2/rack-deps.json" "wrote .tmp/rack-deps/RACK-DEPS.md and .tmp/rack-deps/rack-deps.json"
rep CLAUDE.md "\`research/iteration-0NN/\` each iteration's PLAN and BUILD notes" "the iteration notes in the vault (\`$VAULT_NOTES/research/iteration-0NN/\`)"
rep CLAUDE.md "\`research/iteration-0NN/PLAN.md\` (the iteration in flight" "\`$VAULT_NOTES/research/iteration-0NN/PLAN.md\` (the iteration in flight"
rep CLAUDE.md "\`REPORT.md\` (the history)" "\`docs/WAVES.md\` and the tag \`$TAG\` (the history)"
after CLAUDE.md "These files are the agents' instruction set" "$LEGEND"
after docs/NOTES-FOR-AGENTS.md "# " "
$LEGEND"
rep .gitignore "# papers 2026-10-24:" "# The research record is archived (tag $TAG); research/ is a local folder for the tools' shots and scores.
/research/
# (was) papers 2026-10-24:"
rep .github/workflows/verify.yml "reads the tags and REPORT.md at each one" "reads the tags and the wave headings at each one"
git rm -q -- tools/release/archive-research.sh

node tools/changelog.mjs >/dev/null
git add -A -- CLAUDE.md docs/NOTES-FOR-AGENTS.md .gitignore .github tools CHANGELOG.md docs/WAVES.md

say ""
say "gates:"
./test.sh node >/tmp/archive-research-node.log 2>&1 && say "  ./test.sh node: EXIT 0" || die "./test.sh node red (log /tmp/archive-research-node.log)"
node tools/build-deploy.mjs --quiet >/dev/null && say "  build-deploy: rc 0" || die "build-deploy red"
node tools/changelog.mjs --check && say "  changelog --check: rc 0" || die "changelog --check red"
node tools/provenance.mjs --check && say "  provenance --check: rc 0" || die "provenance --check red"
node tools/rack-deps.mjs --classes --no-write >/dev/null && say "  rack-deps --classes: rc 0" || die "rack-deps red"
say ""
say "staged. Review with 'git status' and 'git diff --cached --stat', then commit."
