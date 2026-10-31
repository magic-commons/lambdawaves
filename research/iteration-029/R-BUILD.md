# 029 R — THE REPO FINALIZATION · BUILD

Builder: Opus, worktree `agent-a579ac39fa7c10d11`, branch `worktree-agent-a579ac39fa7c10d11`, cut from `main` and fast-forwarded to `yan-c` @
`81343d6a` (029: Q closed). Nothing pushed, tagged or merged; `lab/` untouched (no rehash needed); `lab/mir/**` untouched.

## The steps (one commit each)

| step | commit | what |
|---|---|---|
| R1 THE TABLE | `c199331c` | `R-REPO.md` (SHIPS 55 · MOVES 20 · DELETED 3 rows) and `tools/release/archive-research.sh` (dry run by default) |
| R2 ONE VOICE | `20acd2ea` | the public texts in an engineering register; AI_POLICY.md folded and deleted; one sentence atop CLAUDE.md |
| R3 THE LAYOUT | `12c0c299` | docs/release/, tools/serve*, and every file a gate reads out of `research/` with its readers |
| R4 THE STALE SUITE | `180d34b2` | `tests/molecular-names.browser-test.mjs` on the WINDOW submenus |
| R5 THE SWEEP | `2d28c1c5` | RELEASING's release-day list with today's numbers; `tools/knip.json` |
| close | this commit | the archive script refined after its rehearsal; changelog's release tags; this note |

## R2 — every document, before → after

- `README.md`: a "Who made this, honestly" section written in the first person for the author, an AI-disclosure list, iteration and research citations → lead · run · physics · tests and gates · limitations · PySCF (the generated table untouched, `pyscf-table --check` in step) · accessibility · privacy · documents · the AI disclosure in three third-person sentences (Claude Code and the Claude models, Codex and Gemini for parts; the author's direction; the physics, suites and pixel gates as the proof; LEGAL-PROVENANCE for the record).
- `AI_POLICY.md`: deleted; its rules (disclose a tool, the opener is accountable, the gate decides, kit changes go to MIR, assistants read NOTES) → CONTRIBUTING; the tools and where provenance is recorded → README and LEGAL-PROVENANCE §1a.
- `CONTRIBUTING.md`: "House rules", `~/Documents/MIR`, REPORT.md and research/ rows → "Rules of the tree", MIR by its public URL, the AI-contribution rules, a current where-things-live table.
- `CODE_OF_CONDUCT.md`: "read by one person, Joshua, who will answer" → "read and answered by the maintainer".
- `SECURITY.md`: "028 R-09" citation → "filed with the interface kit (`docs/FOR-MIR.md`)".
- `RELEASING.md`: Josh's rules, quotes, PLAN 028 citations, "Where the future is written" (research/beta, a Claude session) → branches, day to day, release-day checks, cutting, version numbers (1.0 stated without a plan citation), hotfix, when to release.
- `docs/SHIPPING-READINESS.md`: three status blocks and the September checkpoints with "Claude" as owner → one current status, the blockers table with neutral owners, the shipping rules, the rehearsal, references.
- `DEPLOY.md`: "Alpha", wave numbers, "Josh's steps", "(dossier §N)" parentheticals, a paragraph about its own rot, the REPORT link history → plain; the deliberate-differences section keeps the deployment dossier by name.
- `docs/ACCEPTANCE-MATRIX.md`: "Josh:" in the next column, "Fable's re-run", 028 row ids, research paths → "Maintainer:", "an independent re-run", plain headings; every measured value kept.
- `LEGAL-PROVENANCE.md`: "Drafted by Fable (Claude)", "Sol and Astra asked", "the fleet's wording", "Josh" throughout, 028 R-ids → the author / the maintainer; §1a "How the work was made" added from README's former disclosure (tools, what the author decided, attribution trailers, unaudited vendored code, PORT-NOTES); every fact of 028 F kept (commit identities, counts, rows, open items).
- `CHANGELOG.md` preamble (written by `tools/changelog.mjs`): "the words the wave gave itself", REPORT.md as "the lab notebook… for whoever builds next" → generated-from line naming the headings' file, "units of development", notes in git history.
- `docs/EXPORT.md`, `docs/GEMMA.md` (a quotation of the author removed, "Josh's userspace", "Odysseus"), `docs/LEGACY-WINDOWS.md` (D9/R5-L1 ids, the ruling quote), `docs/VOLUMES-HOSTING.md` ("Josh's road"), `docs/conductor/README.md` + `SCORE.md` (the vault path, "026", the skill path) → plain.
- `.gitignore`, `wrangler.jsonc` comments: "wave 68", "wave 106 (THE ARK)", "at Josh's request" → plain.
- `CLAUDE.md`: one sentence on line 2 (these files are the agents' instruction set; the laws' names are its index) — on line 2, replacing the blank line, so `CLAUDE.md:6` stays the kit sentence the laws cite.
- The ABOUT face and the hints: read, unchanged (the ABOUT is product copy and already third person; `hints-census --check`: 483 hints, 0 over 60, no agent register).
- Not touched (internal register kept): `docs/laws/`, `docs/NOTES-FOR-AGENTS.md` (two AI_POLICY sources and paths only), `docs/ui/`, `docs/FOR-MIR.md`; generated `docs/STATE-SCOPES.md`; `NOTICE` and `CITATION.cff` (already plain; CITATION's version stays `0.9.9-alpha` until the cut).

## R3 — the moves done

- `DEPLOY.md`, `RELEASING.md`, `LEGAL-PROVENANCE.md`, `docs/SHIPPING-READINESS.md`, `docs/ACCEPTANCE-MATRIX.md` → `docs/release/` (links in README, NOTES, the documents themselves, `wrangler.jsonc`, `tools/build-deploy.mjs` messages, `.gitignore`, `tools/snapshot-release.mjs`).
- `serve.sh`, `serve-lan.sh`, `serve-lan.py` → `tools/` (`package.json` `serve`; `serve-lan.py` serves the repository by its own path, takes the gate server's certificate directory instead of `~/mandelbrot/certs`, writes reports to `.tmp/device-reports/`; `device-report-summary.mjs` reads there; `snapshot-release.mjs` exports `serve.sh` or `tools/serve.sh`, whichever the tag has).
- Out of `research/`, with their readers (178 files): THE LOCK's two fixtures, `lw-facade.json`, `z2-fingerprint.json`, `reference-drive.json`, `oracle-pyscf.json`, `names-probe.json` → `tests/fixtures/`; `release-0.4.0/library-census/` (160) and `round2-sol-exact.json` → `tools/library/census/`; the eight PySCF fixture scripts → `tools/oracles/` (the fixtures' `written_by`, `tests/molecules.test.mjs`, `tests/fixtures/oracles/README.md`); two example scores → `docs/conductor/examples/`. The census data files and the lab's library records keep their bytes: `orbital-library.mjs` and `provenance.mjs` map the records' earlier census path to its new place; provenance's A9 paragraph is a constant now (PROVENANCE.md regenerated, in step).
- `tools/changelog.mjs` reads `docs/WAVES.md` when it exists and `REPORT.md` otherwise, at every tag too; at the close it counts release tags only (`v…`, `pre-alpha…`), because the rehearsal showed the archive tag would otherwise become a CHANGELOG release.

## The moves PREPARED (not applied) — `tools/release/archive-research.sh`

Dry run (today): MOVES `research` (3,227 tracked, 185 MB on disk) · `REPORT.md` · `docs/history` (9) · `docs/BROWSER-BASELINE-2026-09-08.md` ·
`docs/OPTIMIZATION-2026-09-24.md` · `docs/REVIEW-2026-09-15.md` · `docs/MIR-1.5-CANARY.md` · `docs/mir-matrix-patch.json` · `store` (34) ·
`.claude/handoffs` (2), each to `~/Documents/DATABASE/CLAUDE/APPS/LAMBDAWAVES/RESEARCH/<same path>`; DELETED `research/DISK.md`, `tools/disk.mjs`.
`--apply` refuses without the tag `research-archive-2026-10-30` holding every path, a clean tree, and empty destinations; it copies the
working tree's copy (ignored files included), verifies every tracked file byte for byte, writes `docs/WAVES.md` (the 184 wave headings),
`git rm`s the paths, drops `/REPORT.md` from the deploy, redirects rack-deps' summary to `.tmp/rack-deps/`, rewrites CLAUDE.md's two
iteration-note pointers to the vault and appends the archive line (CLAUDE.md line 2, NOTES-FOR-AGENTS), replaces the `research/` lines of
`.gitignore` with `/research/`, regenerates CHANGELOG, runs the gates and stages (never commits); it removes itself.

**Rehearsed** in a throwaway clone (a bundle of this branch with its tags, in `.tmp/`, deleted after) with a local tag and a test vault:
apply rc 0, 3,288 paths changed; `./test.sh node` EXIT 0, build-deploy rc 0, changelog --check rc 0 (no archive-tag release), provenance
--check rc 0, rack-deps --classes rc 0. Separately, in this worktree with `research/` moved aside: `./test.sh node` EXIT 0 and the same four.

## The gates' numbers

- `./test.sh node`: EXIT 0 after R2 and after R3 (116 suites; with `research/` absent too); `state-scopes --check` 32 rows; `hints-census --check` 483 · 0 over 60.
- `node tools/build-deploy.mjs --quiet`: rc 0 — 1,740 files, 29.59 MiB. `node tools/changelog.mjs --check`: rc 0. `node tools/provenance.mjs --check`: in step (54,661 B, 180 rows). `node tools/pyscf-table.mjs --check`: in step.
- `node tools/rack-deps.mjs --classes --no-write`: HOLDS. dependency-cruiser over `lab`: 0 app-side circular edges (37 inside `lab/mir`, the kit's).
- knip 6.43.0 (`tools/knip.json`): 14 unused app exports, the senior pass's deliberate keeps; 0 unused app files (the 18 it lists are kit files).
- `npm audit`: 0. `tools/platform/electron`: **0 high, 5 moderate** (glob, minimatch under `@electron/packager` 20.3.0 — new since 028; the only fix offered is `--force` → 18.4.4).
- `node tools/orbital-library.mjs --check --only C60,uracil`: in step (C₆₀ built from the relocated census; 38 records). The full `--check` re-solves every record and runs past ten minutes; it was stopped at the timeout after 22 records solved without a failure (its in-step verdict prints only at the end).
- Browser, own gate server 9837 / geckodriver 5837, `nice -n 10`, pid stopped: `molecular-names` (6 PASS), `menubar` (9), `start` (4), `lw-facade` (2, the moved fixture) green; THE LOCK **843 · 0** and **987 · 0** on the moved fixtures.

## Left for Josh

1. CALL 4: read `R-REPO.md`, then cut the tag `research-archive-2026-10-30` on the commit before the move and run `tools/release/archive-research.sh --apply` (or say "go" to the integrator). The script refuses without the tag.
2. After the move, iteration notes are written in the vault (`RESEARCH/research/iteration-0NN/`); the conductor skill (`~/.claude/skills/lambdawaves-conductor/SKILL.md`) still names `research/iteration-NNN/scores/` as where a score is written — that keeps working (an ignored local folder), and the skill is outside the repo.
3. GitHub (nothing set): the description, ten topics and the website in `R-REPO.md` §7 with the one `gh repo edit` line; the repository is public, and its side branches (`release-0.3.x`, `release-0.4.0`, `sos-s0`, `claude/youthful-shannon-y0pdx5`) carry agent-handoff commit subjects — whether they stay is Josh's call.
4. The beta's tag (CALL 2) and CITATION.cff/BUILD_LINE's version with it; the Electron packager's five moderate advisories.
5. Optional, outside the script: `tests/legacy/` and the per-row screenshot tools.
6. Not done here: the code comments in `lab/` and `tools/` keep their working register and their `research/…` citations (the archive line resolves them); `docs/release/LEGAL-PROVENANCE.md` row 1 still lists `research/` as part of the tree until the move; `LANDING PAGE VIDEOS/` and the main checkout's untracked `AGENTS.md` are outside git.
