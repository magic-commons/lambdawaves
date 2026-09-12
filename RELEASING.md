# Releasing λWAVES

Two branches, two addresses, one rule: **`main` is what is live, and it only moves when a release is cut.**

| Branch | Address | What it is |
|---|---|---|
| `main` | https://lambdawaves.magic-commons.com | The release. Frozen between releases; every commit on it is a tagged release or a hotfix. |
| `dev` | local only (`./serve.sh 8711` → https://127.0.0.1:8711/lab/) | The experimental copy. All iterative work — agents, prompts, screenshots, "no, like this" — lands here. It is NOT deployed anywhere public: the `dev.lambdawaves.magic-commons.com` worker was deleted on 2026-09-12 at Josh's request ("I'd rather it not, just the live one"). |

## Day to day (on `dev`)

```bash
git switch dev
# … the agent edits lab/ …
node tests/pwa.test.mjs --write && npm test        # rehash + the node gate
git commit -am "…" && git push                     # CI runs the node gate
./serve.sh 8711                                   # the experimental copy is played locally; NO public dev deploy (see the table)
```

Play the experimental copy on this machine (or on the LAN with LW_HOST). Nothing here touches the release. If a private dev URL is ever wanted for the iPad, put Cloudflare Access (Zero Trust, one-time-PIN policy on Josh's email) in front of the hostname BEFORE `npx wrangler deploy --env dev`; `wrangler.jsonc` keeps the env for that day.

## Cutting a release (dev → main)

When `dev` has been green for a while and has lived on the iPad and the desktop for a few days:

```bash
git switch main && git merge --ff-only dev         # main takes exactly what dev is; if this refuses, dev must be rebased on main first
./test.sh                                          # the whole gate, browser half included, on the release
git tag -a v0.2.0-alpha -m "…what changed…"        # semantic version + stage; the changelog is generated from tags
node tools/changelog.mjs && git commit -am "CHANGELOG for v0.2.0-alpha" && git push --follow-tags
node tools/build-deploy.mjs && npx wrangler deploy # the release goes live
gh release create v0.2.0-alpha --generate-notes    # the GitHub Release page
git switch dev
```

Version numbers: `0.x.0-alpha` while features are still being added and the file format may move;
`0.x.0-beta` once a project saved today is promised to open next month; `1.0.0` when the device
matrix, the installed-PWA update test and a screen-reader pass in `docs/SHIPPING-READINESS.md` are
closed. Bump the middle number for a release, the last for a hotfix.

## A hotfix (something broken on the live site)

```bash
git switch main && git switch -c hotfix/whatever  # from main, not dev
# … the smallest fix …
node tests/pwa.test.mjs --write && ./test.sh
git switch main && git merge --ff-only hotfix/whatever && git tag -a v0.1.1-alpha -m "…" && git push --follow-tags
node tools/build-deploy.mjs && npx wrangler deploy
git switch dev && git merge main                   # dev takes the fix too, so it is not lost at the next release
```

## When to release

- Not on a schedule. When the experimental copy is something you would show, and its gate is green.
- Never from `dev` directly to the release address, and never with a red gate.
- A demo you are about to give is a reason to release *before* the demo, not during it.

## Where the future is written

`research/beta/` holds the next era's dossier (Beta: causal atoms, flexible benzene) and its build
contracts; `docs/SHIPPING-READINESS.md` holds what still stands between an alpha and 1.0; `REPORT.md`
is the notebook every session appends to. A new Claude session starts by reading those three and
`git log --oneline -20` on `dev`.
