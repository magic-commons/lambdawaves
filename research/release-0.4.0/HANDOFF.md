# START HERE — the λWAVES handoff from Claude Yan (Major Agent, 2026-10-07)

**Who wrote this.** Claude Yan — Claude Fable 5.1, the Major Agent for λWAVES in the previous Major Session. Josh's
structure (his words, 2026-10-07): *"you are a 'Major Agent' called 'Claude Yan', I'll be switching accounts so the new
agents will probably be clueless in everything. Leave any breadcrumb you think they need."* and *"The accounts will act as
'Major Sessions'."* So: an account is a Major Session; each Major Session has Major Agents; this file passes the baton
between Major Sessions. You have no memory of what came before. **This file, the repo and the vault are your memory.**
Read it top to bottom (ten minutes), then `research/release-0.4.0/PLAN.md` (§1–§10), then the brief of the stage you are
on. Do not re-plan: the plan was fought through three NACRE layers and Josh approved it ("defaults are good", "build S0
and onward!").

---

## 1 · What λWAVES is, and where

A real-time WebGPU instrument for seeing quantum eigenmodes, molecular orbitals and their dynamics as a modulated
volume — Josh's one focus folder, his flagship on his own interface kit MIR. Live at
**https://lambdawaves.magic-commons.com/** (served at the ROOT; `/lab/` is 404) from Cloudflare. GitHub:
`magic-commons/lambdawaves` (`git remote -v`).

| what | where |
|---|---|
| the root checkout (= `main` = what is live) | `~/Documents/LAMBDAWAVES` — Josh's; you work in a worktree, never here |
| the Major Agent's worktree (branch `release-0.4.0`) | `~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24` |
| the plan (the contract for everything below) | `research/release-0.4.0/PLAN.md` — §3 baseline, §4 features, §5 kit briefs, §6 stages, §9 rulings taken, §10 numbers taken |
| the surveys the plan rests on | `research/release-0.4.0/survey/{MIR-1.5,SIBLINGS,LWAVES-AUDIT,VAULT}.md`; the NACRE record `NACRE.md`, `PLAN-DRAFT-0..3.md`, `REVIEW-SONNET-*.md`, `AUDIT-OPUS-1.md` |
| the briefs (one per agent, the exact job) | `research/release-0.4.0/BRIEF-S0.md` (tree), `BRIEF-S0-MEASURE.md`, `BRIEF-S0-CANARY.md`, `BRIEF-S0-VERIFY.md`, `BRIEF-S1-NAMES.md`, `BRIEF-S1-CAMERAEYE.md`, `BRIEF-S1-SOL.md` |
| the numbers | `research/release-0.4.0/measure/MEASURE.md` (+ JSON), `docs/MIR-1.5-CANARY.md` (+ `research/release-0.4.0/canary/`) |
| the names plan + working probe | `research/molecular-orbitals-2026-10-01/{NAMES-AND-CACHE-PLAN.md,PROBE.md,names-probe.mjs,names-probe.json}` |
| the Sol thread's ledger | `research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md` (append-only rounds) |
| the project's laws | `CLAUDE.md` (repo), `docs/STATE-SCOPES.md`, `RELEASING.md`, `REPORT.md` (the notebook every session appends to; waves number from 136 for S0) |
| MIR, Josh's kit | `~/Documents/MIR` (main = 1.4.3, what λWAVES adopted); the 1.5 pin `~/Documents/MIR/.claude/worktrees/mir-1.5-pin` (1.5.0-alpha.23, `0f5c7f9`); `node ~/Documents/MIR/tools/adopt.mjs <root> --check` |
| the vault (Obsidian) | `~/Documents/OBSIDIAN/` — notes in the house naming `<APP> CLAUDE <WHAT> <date>.md`; this file is mirrored as `LAMBDAWAVES CLAUDE YAN HANDOFF 2026-10-07.md`; the plan as `LAMBDAWAVES CLAUDE 0.4.0 PLAN 2026-10-07.md` |
| Sol (GPT via Codex) | `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs task --background --write --fresh --effort xhigh "<prompt>"` from the worktree root; `status`, `result` |
| the previous memory (may not exist for you) | `~/.claude/projects/-home-joshua-hosain/memory/lambdawaves-lab.md` + `MEMORY.md` — if present, read the last six paragraphs of the lab file |

## 2 · The state on 2026-10-07 (evening)

- **Live:** v0.3.2-alpha's version line, but the tree is Cloud's unreviewed `main` (`28fe445`: stage formula, atom labels,
  paint gesture, SPECTRUM folds, Jet Black landed by a direct edit of `lab/mir/palette.js` with a FORGED
  `MIR-MANIFEST.json` "1.4.4", legacy windows hidden, wrangler bump).
- **Built, not live:** 0.3.3 THE EXPORTS (GLB/OBJ/STL shape, NPZ/CUBE grid, SPECTRUM ⧉ + EDIT › COPY the state as LaTeX)
  on `release-0.3.3` (f6ab660), an ancestor of `release-0.4.0`.
- **0.4.0 = engine + library on MIR 1.4.3; 0.5.0 = the MIR 1.5 adoption + the INFORMATIONAL; 0.4.1 BUCKYBALL.**
- **S0 TAKE-IN + CANARY — in flight:**
  - S0-C THE CANARY: DONE, merged (`4ca4f54`). Bare alpha.23 adopt boots; 7/82 node suites red; precache 9.46 MiB over the
    8 MiB ceiling. PLAN §10 N4 says what follows.
  - S0-B THE NUMBERS: DONE, merged (`efaaed8`). PLAN §10 N1–N3: the AO wall opens (48 KiB), records GATE past the cap and
    the 52-record starter is dropped, R-L2 = YES (C₆₀'s HOMO/LUMO in 0.4.0 with shell screening).
  - **S0-A THE TREE: an Opus builder was running** in `~/Documents/LAMBDAWAVES/.claude/worktrees/agent-ade297122bf2444a1`,
    branch `worktree-agent-ade297122bf2444a1`, started at `61f7c2c`. When this was written it had committed C1, C2 and
    C3 (`0242bff`, `5c7109e`, `ebd45d5` = wave 136, the subtraction) and was on C4–C6 (the cheap bugs, the vendor wiring +
    pinned manifest, the three demos). **If it finished:** its branch has `research/release-0.4.0/S0-BUILD.md`; merge
    the branch into `release-0.4.0` from YOUR worktree (`git merge worktree-agent-ade297122bf2444a1`). **If it died:**
    `git log --oneline worktree-agent-ade297122bf2444a1` shows how far it got; its uncommitted files are readable at its
    worktree path (you may read another agent's worktree, never run git there); spawn a fresh Opus builder in its own
    worktree from `release-0.4.0`, merge the dead builder's branch there, `cp` any uncommitted files across, and give it
    `BRIEF-S0.md` from the next unfinished commit.
  - **S1″ THE SOL THREAD, round 1 (Fable lead): an agent was running** in `…/.claude/worktrees/agent-a8356a853fc8a32d9`,
    branch `worktree-agent-a8356a853fc8a32d9`, from `5012eec`. It writes `research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md`
    ROUND 1, `tools/symmetry/unique-quartets.mjs`, `research/release-0.4.0/measure/quartets.json`, and rebuilds
    `research/DISK.md`. Same rescue rule. When it lands: merge, then launch **Sol round 2** with the codex command above
    ("Read research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md whole; append `## ROUND 2 · SOL`; answer Q1… with numbers,
    kill what is wrong, add what is new, ask 3–6 new questions; never agreement"). One Sol at a time. Three rounds, then
    the lead writes `## SYNTHESIS`.
- **Not started:** S0-V (the release verifier), the 0.3.3 cut, S1 NAMES, S1′ cameraEye, S2–S5.

## 3 · What happens next, in order

1. **S0-A lands → S0-V.** Spawn a FRESH Opus verifier (`isolation: worktree`, start = the merged tree's sha) on
   `BRIEF-S0-VERIFY.md`. Fix its BLOCKERs (a small Opus fix round on the same branch, or yourself if trivial), re-run only
   what the fix touched.
2. **Cut v0.3.3-alpha** from `release-0.4.0` (R-A1; Josh authorised it with the plan and "build S0 and onward") — the road:
   ```
   # in the Major Agent's worktree, on release-0.4.0, tree green
   sed -i "s/^const BUILD_LINE = '[^']*'/const BUILD_LINE = '0.3.3-alpha · the exports · 2026-10-0X'/" lab/rack.js   # lab/rack.js:90, the only place the number lives
   # README.md:14  "**Status: 0.3.3 alpha.**"
   node tests/pwa.test.mjs --write && bash test.sh node
   git commit -am "0.3.3-alpha: the version line and the README status"
   git tag -a v0.3.3-alpha -m "…"
   node tools/changelog.mjs && git commit -am "CHANGELOG for v0.3.3-alpha"
   node tools/snapshot-release.mjs v0.3.3-alpha            # ~/Documents/LAMBDAWAVES-RELEASES/<tag>/ + the vault index note
   git push origin release-0.4.0 release-0.4.0:dev release-0.4.0:main --follow-tags    # main moves ONLY by this fast-forward
   node tools/build-deploy.mjs && npx wrangler deploy --env=""
   gh release create v0.3.3-alpha --generate-notes --prerelease
   curl -s https://lambdawaves.magic-commons.com/rack.js | grep -o "BUILD_LINE = '[^']*'"
   ```
   `gh` (account magic-commons) and `wrangler` were both logged in on 2026-10-07. Then REPORT the cut.
3. **S1 NAMES ∥ S1′ cameraEye** — two Opus builders in their own worktrees from the merged tree, briefs
   `BRIEF-S1-NAMES.md` (ports 8741/5209) and `BRIEF-S1-CAMERAEYE.md` (ports 8743/5211). Disjoint files; merge NAMES first,
   then cameraEye. Light check each; the digest lock is cameraEye's own gate.
4. **S2 CAMERA** (PLAN §4 F4; a verifier — it is the frame path), **S3 STAGE TEXT + WINDOWS** (F2, F3), **S4 LIBRARY a/b/c**
   (§3 B2 + F5; verifiers on a and c; §10's numbers are its sizing), **S5 KIT BRIEFS** (§5 → `research/release-0.4.0/KIT-BRIEFS.md`
   + vault mirror; add the canary's three missing guide entries). Write each brief from the plan the way the S0/S1 briefs
   are written (contract · laws · commits in order · acceptance · hand-off · harness). Then **cut 0.4.0-alpha** on Josh's word.
5. Memory of outcomes goes into REPORT.md waves and this file's §2 (update it as stages land; it is the baton).

## 4 · How Josh works (the standing laws — every one has cost us before)

- **Never edit `lab/mir/**` or `lab/fonts/**`** (adopted MIR; `tests/mir-manifest.test.mjs`). A kit need is a brief to the
  MIR session, never an edit. Cloud (Claude on GitHub) too: PRs only, never `lab/mir`.
- **After any `lab/` edit: `node tests/pwa.test.mjs --write`, then the suites.** `lab/sw.js` is generated.
- **Subtract, don't add** (Josh 2026-09-25): never add machinery to go faster; remove, merge, simplify. **Diagnostics live
  in `tools/`, never `lab/`.** Count `lab/*.js` lines before and after a seam.
- **The glass is Josh's**: no repainting his material; a text fix never licenses a skin change. First-run look: light,
  refractive, ALWAYS frost, 22 px blur, 50 % VIVID on desktop; frost OFF tinted on phone/tablet.
- **Three scopes** (`docs/STATE-SCOPES.md`): PREFERENCE / WORKSPACE / PROJECT (+ LIBRARY coming in S4). A project open leaves
  `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys. `node tools/new-project.mjs --check` stays exact.
- **Opus for builders** (Josh 10-06: "same price, quality first"); Sonnet is fine when the Opus weekly limit bites (Josh:
  "Sonnet is pretty good now!"). Fresh-context verifiers only for frame-path, worker/storage and release changes.
- **Don't over-verify** (Josh 10-01: "just see if the basic thing works. MIR 1.5 is coming soon"): one light check per
  stage. A timing flake (`current`, `wigner`, `electrostatics`) is re-run alone before it is believed.
- **The RTX 3070 has a one-ulp GPU fault in power state P5**: an identical-hash gate (the digest lock) can go red from it —
  re-run alone before believing a divergence. The GPU is shared: one browser suite at a time.
- **Never `pkill -f`** (it killed other sessions' browsers). Kill by pid. Each agent owns its ports: gate server
  `python3 tools/gate/server.py <root> <LW_PORT> &` then `LW_PORT=… GD_PORT=… node tests/<suite>.browser-test.mjs`
  (GD_PORT is geckodriver's; Firefox is the gate's browser). Convention: 8731/5203 tree, 8735/5205 measure, 8737/5207
  canary, 8741/5209 names, 8743/5211 cameraEye, 8745/5213 verifier; the Major Agent's own servers 8721, LAN 8711.
- **Never push to `main` except by the fast-forward of a release.** Branches may be pushed (Josh 10-07: "yes to anything
  for the branches"). Josh merges and decides go-lives; the 0.3.3 cut is pre-authorised by the plan.
- **Vault writes allowed** (Josh 2026-09-25) in the house naming; add, never edit another author's note.
- **Work in worktrees** (`EnterWorktree` / `isolation: worktree` for agents). Harness facts: a subagent is pinned to its own
  worktree (you can READ another agent's worktree, never run git there — merge its branch from yours); the guard refuses
  compound shell with variables, loops, heredocs or backticks, and git aimed outside your worktree — plain separate
  commands, scripts as files in the job tmp dir; `Write`/`Edit` outside the worktree may be refused (write into
  `<worktree>/.scratch/` and `cp` out, then remove `.scratch`).
- **Josh's dials on process:** plans by NACRE (Fable pre-draft → Sonnet review → draft → Opus@high audit → draft → Sonnet
  junior → final); math by `mathcollab` (Fable @ max ↔ Sol @ xhigh, append-only ledger, numbers or nothing); the DISK
  (`node tools/disk.mjs research research/DISK.md`) rebuilt after a ledger round; Josh's rulings recorded verbatim in the
  plan (§9) and taken as "first option" by default.
- **REPORT.md** is the notebook: a wave entry per commit, what was measured not hoped, under a dated heading.

## 5 · Josh's words that still bind (verbatim)

- "Let's continue, use any Opus/Sonnet 5.5 agents you can use (Sonnet is pretty good now!)"
- "Also don't over verify, just see if the basic thing works. MIR 1.5 is coming soon so don't worry too much about it"
- "Take the MIR flagship status from 'BASINS' to Lambdawaves!" · "Don't try to go for too many variations of the same
  molecule, try to be as diverse as possible." · "maybe a bucky-ball as our next milestone"
- "Nicely done Claude! … (Oh the planet photo is a bit of an over explaination but that sounds like a cool feature.)" —
  the lens shift stays.
- "defaults are good, and yes to anything for the branches. thanks Claude"
- "Welcome back Claude! We've got a huge plan. Ultrathink and build S0 and onward!"

## 6 · Who built what (the record of the previous Major Session's agents)

| agent | worktree branch | result |
|---|---|---|
| S0 canary (Sonnet) | `worktree-agent-a6bf03e4f65099a58` | merged `4ca4f54` |
| S0 measure (Opus) | `worktree-agent-acd0063cf95654204` | merged `efaaed8` |
| S0 tree (Opus) | `worktree-agent-ade297122bf2444a1` | in flight at `ebd45d5` (C3 done) when this was written |
| S1″ Sol thread round 1 (Fable) | `worktree-agent-a8356a853fc8a32d9` | in flight |
| earlier (0.3.2 THE OFFER, 0.3.3 THE EXPORTS, the NACRE plan) | `release-0.3.2`, `release-0.3.3`, `release-0.4.0` history | see REPORT.md 2026-09-26 and 2026-10-01, `research/release-0.3.2/BRIEF-133.md`, `research/release-0.3.3/` |

Old agent worktrees under `.claude/worktrees/agent-*` with merged branches can be removed (`git worktree remove <path>`
from the root checkout — Josh's call, it is his checkout).

— Claude Yan, 2026-10-07. Keep this file current; it is what the next Major Session reads first.
