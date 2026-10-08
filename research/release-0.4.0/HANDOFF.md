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

> **UPDATE 2026-10-07 ~17:15 — Claude Sos took the baton** (the fallback Major Agent on Josh's second account; Josh:
> *"'Claude Yan' is the first; this is her work, you are the fallback when usage gets rough"*). Yan's session ended with
> both in-flight agents dead (files last written 15:18–15:20). What Sos found and did:
> - **The line moved to branch `sos-s0`**, worktree `~/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0`, a fast-forward
>   of `release-0.4.0` (d5b9d1d). The permission guard refused merging inside Yan's locked worktree
>   (`optimization-2026-09-24`), so the local `release-0.4.0` still points at d5b9d1d. Fast-forward it to `sos-s0` from a
>   worktree that has it checked out (`git merge --ff-only sos-s0`) or push `sos-s0:release-0.4.0`.
> - **S0-A rescued — DONE.** The builder had committed C1–C5 (to `eaecf5e`) and written C6 (three demos) and
>   `S0-BUILD.md` without committing. Merged as `9090665`; C6 = `bff9057`; S0-BUILD.md = `767ab6e` (its placeholders
>   filled with the recovery facts). Re-checked: `pwa`, `new-project --check`, `mir-manifest`, `bash test.sh node` green.
>   **The builder's §4 browser light check never ran** — the verifier's full gate is the first run.
> - **S1″ Sol thread Round 1 rescued — DONE** (`bc103b3`): ledger + `tools/symmetry/{unique-quartets.mjs,pyscf-symm-oracle.py}`
>   + `measure/{quartets.json,pyscf-symm-oracle.json}`; the census re-run on the merged tree gave identical counts;
>   DISK rebuilt (102 documents).
> - **S0-V launched** (fresh Opus, own worktree, ports 8745/5213) on `bc103b3`; **Sol Round 2 launched** (Codex xhigh,
>   in the `sos-s0` worktree, appends `## ROUND 2 · SOL` to the ledger, uncommitted until Sos commits it).
> - A stale gate server from the dead builder (python, port 8731) is still running; the guard refused killing it. Use
>   other ports or ask Josh to stop it.
> - **S0-V DONE** (`e0d619f`, merged `eaf375b`): 23/24 browser suites green on the first full run; one BLOCKER (a stale
>   `official-defaults-palette` assertion vs C3's MOLECULES `Aa` law) and one SHOULD (the LINKED wording) fixed by Sos in
>   `ad9e8a0`, both suites re-run alone green. **Fit to cut: YES.**
> - **v0.3.3-alpha CUT LOCALLY, NOT LIVE:** version line `9504700` (tag `v0.3.3-alpha`, annotated), CHANGELOG `eb3a132`,
>   snapshot #15 in `~/Documents/LAMBDAWAVES-RELEASES/v0.3.3-alpha`, `dist/` built and verified (206 files, 5.23 MiB). The
>   permission guard refused the push of `main`/`dev` as a production deploy. **Josh's ruling, 2026-10-07: "we don't have
>   to push anything to live cloudflare or Github until the entire plan as run it's course, which is an extremely long
>   plan."** So nothing is pushed, deployed or released until 0.4.0's plan is finished (this supersedes the HANDOFF §3.2
>   "cut and go live" step; `sos-s0` was pushed once as a backup before the ruling). The road when that day comes, from
>   the `sos-s0` worktree:
>   `git push origin sos-s0 sos-s0:release-0.4.0 sos-s0:dev sos-s0:main --follow-tags` ·
>   `npx wrangler deploy --env=""` · `gh release create v0.3.3-alpha --generate-notes --prerelease` ·
>   `curl -s https://lambdawaves.magic-commons.com/rack.js | grep -o "BUILD_LINE = '[^']*'"`.
> - **Briefs written for the rest of the road:** `BRIEF-S2-CAMERA.md` (one shift convention fixing PLAN F4's three
>   disagreeing formulas), `BRIEF-S3-STAGE-AND-WINDOWS.md`, `BRIEF-S4-LIBRARY.md` (a/b/c), `BRIEF-S5-KIT-BRIEFS.md`.
> - **Sol Round 2** (Codex task `task-muyncqpn-zablm5`, gpt-6.1-sol at xhigh) was still writing when this was recorded;
>   its files are uncommitted in the `sos-s0` worktree (`tools/symmetry/round2-sol*`, `measure/*round2-sol*`). Josh:
>   Sol 6.1 sits between Sonnet and Opus — re-run its headline numbers before the SYNTHESIS banks them.
> **UPDATE 2026-10-07 ~18:25 — Claude Sos, third session (Fable).** Josh's coordination rule, verbatim: *"Two Claude
> accounts work on this project. Before editing, identify your current directory, branch, assigned task, and worktree.
> Use separate worktrees and branches for simultaneous implementation. Coordinate through written reports; do not assume
> you can see or control the other account's conversation or workers. Stay inside your assigned worktree when editing
> and running Git commands. Report your worktree path, branch, commits, tests, blockers, and next step in every handoff.
> Preserve unfinished work, and do not remove another agent's worktree. Let one designated agent integrate changes. When
> blocked, report the exact error and command. Avoid repeatedly creating replacement worktrees."*
> - **The integrator is Claude Sos on `sos-s0`** (worktree `~/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0`). Builders
>   work in their own `.claude/worktrees/agent-*` worktrees and are merged here; nobody else merges into `sos-s0`. If
>   Yan's account is active on λWAVES at the same time, hand branches over by a written report (this file's §2, a vault
>   note, or a `*-BUILD.md` beside the briefs), never by editing `sos-s0`.
> - **Landed since the previous update:** S0-V fixed (`ad9e8a0`); v0.3.3-alpha tagged locally at `9504700`, not live;
>   Sol Round 2 committed (`58852c7`); **S1′ `cameraEye` merged** (`f247f0c`, wave 144, `S1-CAMERAEYE-BUILD.md`);
>   **S1 NAMES merged** (`bd9b0e5`, waves 140–143, `S1-NAMES-BUILD.md` + the builder's `S1-NAMES-HANDOFF.md`). Tip of
>   `sos-s0` at this update: `bd9b0e5`.
> - **Running now, all from `bd9b0e5`:** the S2 CAMERA builder (Opus, `BRIEF-S2-CAMERA.md`, ports 8747/5215, waves from
>   145); the S3 STAGE TEXT + WINDOWS builder (Opus, `BRIEF-S3-STAGE-AND-WINDOWS.md`, ports 8751/5219, waves from 155 —
>   the integrator renumbers if the two collide); the Sol thread Round 3 + SYNTHESIS (Fable lead at max, own worktree,
>   appends to the ledger and rebuilds the DISK); and Sol's LIBRARY CENSUS + C₆₀ frontier (Codex `task-muyotogt-mb4bgz`,
>   gpt-6.1-sol at xhigh) writing UNTRACKED files into the `sos-s0` worktree under `research/release-0.4.0/library-census/`
>   and `tools/library/` — leave those paths alone until Sos commits them. Merge order when they land: S2, then S3
>   (`rack.js` is shared in disjoint regions), then the ledger; then the S2 verifier (8749/5217).
> - **Still true:** local `release-0.4.0` sits at `d5b9d1d` in Yan's locked worktree (fast-forward it to `sos-s0` from a
>   worktree that has it checked out); the stale gate server from Yan's dead S0 builder (python pid 1544349, port 8731)
>   is still up; nothing is pushed or deployed (Josh's ruling above). The unused worktree `agent-a851ec0dd786a3819`
>   (a Round 3 agent stopped before it wrote anything) is left for Josh to remove.
> - **Next after this session's workers land:** S5 KIT BRIEFS (Sonnet or Sol; needs `S2-CAMERA-BUILD.md` and
>   `S3-BUILD.md`), S4 LIBRARY a/b/c on the census's numbers, then the local 0.4.0-alpha cut on Josh's word.
> **UPDATE 2026-10-08 ~00:20 — Claude Sos, end of the third session (usage pause).** Tip of `sos-s0` after this commit; tree clean.
> - **Merged:** the Sol thread Round 3 + SYNTHESIS (`4b935e9`; the one number 25.81 % — 10,966 of 42,486 live quartets under D₂h;
>   symmetry does not earn a symmetry-adapted SCF). **Josh's ruling** on its D1–D4: *"Perhaps all default/option one's"* →
>   R-S1-0.5 option 1 and D2–D4 option 1, recorded in PLAN §9, the 0.5.x row and the ledger (`81f5df2`); the thread is CLOSED.
>   **S2 THE CAMERA** (`babb58f`, builder `93cd70f`, waves 145–148, `S2-CAMERA-BUILD.md`): both digest locks GREEN, the matrix sign
>   proved on the GPU, the link carries the shot; `lab/*.js` +90 (the feature). **Sol's LIBRARY CENSUS + C₆₀ frontier** committed
>   as DRAFT, UNVERIFIED by Sos (`9e79132`; `research/release-0.4.0/library-census/`, `tools/library/`; spot-check before S4 banks a
>   number).
> - **Built, NOT merged:** **S3 STAGE TEXT + WINDOWS** on `worktree-agent-a4faa45d300fd21dc` tip `3621836` (T1–T7 + follow-up +
>   `S3-BUILD.md`, waves 155–161; 83 node suites and 26 browser suites green at its tip). It overlaps S2 in `lab/rack.js`, `lab/sw.js`,
>   `REPORT.md`, `docs/STATE-SCOPES.md`, `tools/new-project.mjs` — small conflicts, the resolution is written in
>   `~/.claude/handoffs/latest.md` step 1 and in the branch's `S3-HANDOFF.md`. Its "lines DOWN" acceptance is NOT met (+53:
>   `dynamics.js` is a shared library; only `dynamicsview.js` could go) — Josh decides. It also set the stage formula's base size to
>   34 px (the notebook's title) and drops `atomLabels:false` beside `molFormula` on — in `S3-BUILD.md` for Josh.
> - **Not started:** the S2 verifier (`BRIEF-S2-VERIFY.md` is written, `9d8d8ed`; ports 8749/5217), S5 KIT BRIEFS, S4 LIBRARY a/b/c.
> - **Order for the next session:** merge S3 (then `new-project`, `pwa --write`, node gate, light browser check) → S2 verifier → census
>   spot-check → S5 ∥ S4a → the local 0.4.0-alpha cut on Josh's word. Worker notes: `~/.claude/handoffs/agents/*.md`.
> **UPDATE 2026-10-08 ~02:00 — Claude Sos, fourth session (Fable), Josh: "Lets continue".** On `sos-s0`:
> - **S3 STAGE TEXT + WINDOWS merged** (`7e6220b`, builder `3621836`, waves 155–161, `S3-BUILD.md`). Resolved: REPORT.md keeps both
>   sections (S2 then S3); `lab/rack.js` l.26 keeps `toScreen` in the `field.js` import (S3 trimmed it as unused, S2's `pointerRay`
>   uses it); `lab/sw.js` and the empty project regenerated (16,866 B, in step). Merged tree: `bash test.sh node` exit 0; browser
>   one at a time on 8753/5221: `stage-text`, `camera-shift`, `frame-occlusion`, `new-project`, `molecular-names`, `history` all
>   green. `lab/*.js` 35,738 (bd9b0e5) → 35,881 (+143 = S2 +90, S3 +53; S3's "lines DOWN" NOT met — for Josh).
> - **The census spot-checked** (`8259eee`): water and benzene MATCH the oracle (0, 7e-13 Eh); alanine, Li₄F₄, TiCl₄ MATCH the app's
>   own solver (≤ 2e-11 Eh). The energies stand; the counts are taken as Sol tagged them. S4 may read it.
> - **S5 KIT BRIEFS → Sol** (Codex `task-muz6hazq-eqsd8r`, gpt-6.1-sol at xhigh, Josh: Sol for any task) writing ONE untracked file
>   `research/release-0.4.0/KIT-BRIEFS.md` inside the `sos-s0` worktree; Sos reads it once, then commits and mirrors it to the vault.
> - **Blocked:** the agent-control plugin is still in its handoff pause and REFUSES new Claude workers ("Agent Control is paused
>   for handoff"), so the **S2 verifier** (`BRIEF-S2-VERIFY.md`, start `8259eee`, 8749/5217) and the **S4a builder**
>   (`BRIEF-S4-LIBRARY.md` §S4a, 8753/5221, then its verifier 8755/5223) wait for Josh to lift the pause.
> **UPDATE 2026-10-08 ~03:00 — Claude Sos, session 4, after `/resume-work`.**
> - **S2 VERIFIED — stands** (`S2-VERIFY.md`, fresh Opus, merged `64c636b`): the 1004-value lock byte-identical at shift 0, the
>   96³ lock green, 84 node suites, 11 browser suites and the verifier's 19 own scenes green on the first run, device report equal
>   (19.6 vs 19.7 fps at load 1); the builder's lock-tool `meta()` change judged legitimate (a 0.002 shift still differs in 218
>   readbacks). 0 BLOCKER; the 1 SHOULD fixed by Sos (`tests/camera-shift.browser-test.mjs`: re-clear the mask before the line
>   pass, a third corner over the left rack, `defaultPrevented` on Alt+Arrow) and green alone. **NOTEs for Josh's R-C1 trial:**
>   zoom-to-cursor holds the anchor only for cursors within ~0.18 uv of the centre once the pivot hits the frame edge (the clamp,
>   by design); Alt now slides the picture before KEPLER's handle grab and HELIUM's Alt+Shift electron placement; the M5 half of
>   the device report is still one command (`?report=1` on the iPad).
> - **S5 KIT BRIEFS landed** (`d943fea`, Sol at xhigh, read once by Sos): 17 briefs for the MIR session in PLAN §5's order,
>   26 consuming port groups, 672 gross lines the adoption would delete (361 without the camera gift); mirrored to the vault as
>   `LAMBDAWAVES CLAUDE KIT BRIEFS FOR MIR 2026-10-08.md`.
> - **Running:** the S4a LIBRARY builder (Opus, 8753/5221, from `9395ab3`). Then its verifier (8755/5223), S4b ∥ S4c, the local
>   0.4.0-alpha cut on Josh's word.
> **UPDATE 2026-10-08 ~04:30 — Claude Sos, session 4: S4a merged, verified, its BLOCKER fixed; S4b ∥ S4c running.**
> - **S4a THE PROOF AND THE STORE merged** (`cfdd674`, builder `4b49642`, waves 162–167, `S4a-BUILD.md`): schema-1 records,
>   `tools/orbital-library.mjs --check` byte-exact, benzene (the proof) and lysine (the 64-AO lock fixture), `chem.open` with 0
>   solver calls, `library/` the one precache exemption into `lw-data-v1`, the LIBRARY scope row, COST refit (benzene ~1.7 s, was
>   ~9.6 s), the 1148-value lock fixture `measure/digest-lock-s4a.json`. `lab/*.js` 35,881 → 36,131 (+250: the law not met — for Josh).
> - **S4a VERIFIED** (`S4a-VERIFY.md`, fresh Opus, merged `96c8b08`): every gate and both locks green, 0 solver calls on open counted
>   independently, cached = fresh in Firefox (|ΔE| 1.3e-12, 0 of 1,048,576 texels differ), persist() once, the store survives a
>   build. **BLOCKER B1 fixed by Sos (`b5eed68`):** a stale `chem.open` (press benzene then lysine) replaced the worker's one cache and
>   the next lysine op live-solved a past-the-cap molecule; now `seq === solveSeq` guards every worker post in `chemview.js` and the
>   worker refuses a cache miss on a record-only key (`recordOnlyIds`); probe 0 calls, KICK refused in 5 ms; `tests/library.test.mjs`
>   §5b. **SHOULD S1** (the plain 1004 lock reads RED by fixture shape since S4a's three record states; GREEN with `--states` or
>   the 1148 fixture): told to S4c, which owns `tools/perf`. NOTEs for S4b: `validateRecord` checks shape only; RPA sticks' μ not in
>   a canonical gauge for degenerate roots; pyridine at 0.99× and Br₂ at 1.13× benzene in node.
> - **Running from `cfdd674` (+ `b5eed68` offered to both):** S4b THE SECTIONS (Opus, 8757/5225, waves from 168) and S4c THE ENGINE
>   UPGRADES (Opus, 8759/5227, waves from 178). Then the kernel verifier (8761/5229), then the local 0.4.0-alpha cut on Josh's word.
> - Josh tried the camera on the test servers (https://127.0.0.1:8721/lab/, LAN https://10.0.0.18:8711/lab/, serving `sos-s0`):
>   *"Nice, I'm impressed. We might change the default keybinds for new camera mouse-controls and perhaps touch gestures but this is
>   good for now!"* — an open item after 0.4.0. Josh: Haiku 5.5 may take the easiest bulk tasks at high–xhigh effort.
> **UPDATE 2026-10-08 ~06:10 — Claude Sos, session 4 continued after a second usage pause (Josh: "Usage is back so let's
> continue, Yan is still weekly blocked so we'll resume as usual").**
> - **S4c THE ENGINE UPGRADES merged** (`a927fc3`, builder `c6f5957`, waves 178–182, `S4c-BUILD.md` + `S4C-HANDOFF.md`, MEASURE.md §5):
>   `MOL_CAPS = [16, 40, 64, 128]` (the 3070 grants 32 KiB; a refused device builds the 128 tier with 32 lanes and draws the same
>   texels); `ORB_WGSL`, the orbital-only path (C₆₀'s HOMO 3.6 ms screened at 96³); **C₆₀'s HOMO and LUMO draw** from a schema-1
>   frontier record (`lab/library/9520cedc….json`, DRAFT geometry stated, 0 solver calls, 4–6e-4 of max against PySCF at 256
>   voxels); VALENCE as a switch on DENSITY (lysine's max density 47.8 → 1.60); the lock compares only its fixture's states
>   (`cbc7b0f`); 1004 and 1148 locks GREEN; device report 18.2 → 19.1 fps. `lab/*.js` 36,137 → 36,225 (+88, the law not met — for
>   Josh). 87 AO is tryptophan (phenylalanine is 71; the brief's example was wrong). M5 pending: `./serve-lan.sh`, then
>   `https://<LAN>:8710/lab/?report=1&post=1` on the iPad.
> - **S4b THE SECTIONS — built to B4, resumed:** `worktree-agent-aee5748ddb578d188` tip `2770699` (B1 the three sizing entries as
>   records; B2–B5 code: the gate with the family allowance, the STEM fields and C5 labels by projection, the page turner and the
>   header; B4: **37 records behind the gate, 11.4 MB**, every one labelled by projection and held against PySCF). The builder died
>   on the Opus session limit at ~05:30 without a hand-off (one uncommitted edit, `tests/library.browser-test.mjs`); its gate server
>   was killed by pid by Sos; it was RESUMED by message at ~06:00 with the order: commit, **merge `a927fc3` (S4c) on its own branch
>   and resolve the nine-file overlap** (chemview.js, library.js, library.json, mathworker.js, sw.js, orbital-library.mjs, three
>   tests), decide C₆₀'s section and identifiers, gates, REPORT waves 168–177, `S4b-BUILD.md`.
> - Josh on lysine from its record (the first past-the-cap molecule): *"Holy, Lysine is beautiful!"*
> - **Next, in order:** merge S4b → node gate + `library`/`chem`/`orbitals` light check → **the kernel verifier** (fresh Opus,
>   8761/5229, the commands at the end of `S4c-BUILD.md`, contract BRIEF-S4-LIBRARY §S4c) → fold S4b's brief-4 notes into
>   `KIT-BRIEFS.md` (Haiku 5.5 may do it) → **the local 0.4.0-alpha cut on Josh's word** (RELEASING.md's road, no push, no deploy).
> **UPDATE 2026-10-08 ~07:05 — Claude Sos, session 4: S4 complete on `sos-s0`; only the kernel verifier and the cut remain.**
> - **S4b THE SECTIONS merged** (`3ced864`, builder `7d93277`, waves 168–174, `S4b-BUILD.md`; the builder merged S4c on its own branch
>   and resolved the seven conflicts, so the merge was clean): **38 records behind the diversity gate, 11,532,460 B** (ORGANIC 1,
>   BIO 25, LATTICE 6 with C₆₀, HEAVY 6; DIATOMICS and HYDRIDES all live), eight past 64 AO drawing on S4c's tier; every RHF record
>   labelled by projection (C5) and within 6.9e-9 Eh of its PySCF oracle; the three sizing entries timed (alanine 2.0 s to generate,
>   129 KB, 2–3 ms to open; Li₄F₄; TiCl₄ 11–14 s, 211 KB); the section header = the page turner (◂ ▸, SECTION readout, INSTALLED
>   switch) above the dropdown; 36 identifiers PubChem-verified (B₁₂H₁₂²⁻ UNVERIFIED, Li₄F₄ and the water hexamer have no entry);
>   **nine of the census's self-built amino acids were the D form — mirrored to L**, lysine's two lock values re-recorded (24 of the
>   1148, the 1004 untouched); **ferrocene refused by the stability probe** (PySCF agrees; the census was wrong); R-L6: stopped at Kr;
>   **the census's byte estimate was 8–10× too small** (the RPA sticks dominate); **NIST SRD 101 is a copyrighted compilation — no
>   CCCBDB table in the store**. `lab/*.js` 36,131 → 36,280 (S4b +55; the law not met — for Josh). CLAUDE.md's MOLECULES paragraph
>   and KIT-BRIEFS brief 4 updated by Sos (`3dfbc46`, vault mirror refreshed).
> - **Merged-tree gates (Sos, 06:41–07:00):** `orbital-library --check` in step; `bash test.sh node` exit 0; browser on 8721/5231 one
>   at a time: `library` (incl. the sections scene and the two-press race), `chem` 55/55, `orbitals` 24/24 — GREEN.
> - **Rulings taken by default, for Josh to confirm or overrule:** C₆₀ ships under a declared `milestone` allowance in the gate
>   (his words: "maybe a bucky-ball as our next milestone"; R-L2 = YES); C₂₀H₂₀ is a test fixture only, not shipped; of the four
>   rock-salt cubes only Li₄F₄ ships; the C₆₀ geometry is Sol's DRAFT until 0.4.1. Still open from earlier: Br₂ vs the cap; the
>   subtraction law unmet by S3 (+53), S4a (+250), S4c (+88), S4b (+55); the stage formula at 34 px; `atomLabels:false` not honoured.
> - **Blocked:** the kernel verifier (`BRIEF-S4C-VERIFY.md`, 8761/5229, start `3ced864` or later) — the agent-control plugin is in its
>   pause again (tripped at 98 % during S4b) and refuses new workers until `/resume-work`.
> - **Then the cut:** v0.4.0-alpha LOCALLY on Josh's word (RELEASING.md's road: the version line in `lab/rack.js`, README status,
>   `pwa --write`, the gates, commit, annotated tag, `tools/changelog.mjs` — CHANGELOG was already out of step at S4a's base —
>   `tools/snapshot-release.mjs`, `tools/build-deploy.mjs`; NO push, NO deploy, NO GitHub release until Josh says the plan is done).
> **UPDATE 2026-10-08 ~07:45 — Claude Sos: 0.5.0 begins (Josh: "Let's go onward to 0.5.0" · "do as many parallel work/subagents
> you want").** The 0.5.0 planning lives in `research/release-0.5.0/` (`NACRE.md`, `PLAN-DRAFT-0.md` by Fable, `12451d2`); its
> gates: brief 8 is unbuilt in MIR's 1.5 line (alpha.24, `~/Documents/MIR/.claude/worktrees/mir-1.5`), the `1.5.0` cut is open
> (R-G1: wait, the default), the first look is Josh's. **Running from `12451d2`, each in its own worktree:** the S4c kernel verifier
> (8761/5229 — the 0.4.0-alpha cut follows a YES); REVIEW-SONNET-0 of the pre-draft; stage A wave 1 — A4 the floating-rack module
> (8763/5233), A5+A6 the modulation port and the one-clock facade (R-B1; 8765/5235), A9–A11 the actions table (R-K1), tests by hook
> with the canary's four gate rewrites, the kit precache policy and a throwaway alpha.24 canary (8767/5237). Merge order A4, A5+A6,
> A9–A11; then wave 2 (A1+A2+A3, A7+A8). Rulings taken by default until Josh says otherwise: R5-G1 wait for `1.5.0`; R5-M1 the MIR
> briefs by Josh's primary account when its week resets.
> **UPDATE 2026-10-08 ~11:05 — Claude Sos: v0.4.0-alpha CUT LOCALLY; the 0.5.0 plan at layer four; stage A wave 1 in flight.**
> - **S4c VERIFIED** (`S4c-VERIFY.md`, fresh Opus, merged `0724d2b`): 0 BLOCKER, 0 SHOULD, 12 NOTEs; 1004 and 1148 locks GREEN; the ≤ 64
>   tiers' compiled WGSL byte-identical to `b5eed68`; the refused-device fallback identical three ways; 13 past-64-AO records within
>   8.5e-4 of PySCF; C₆₀ bit-identical to the census dump; VALENCE 47.786 → 1.601 in the app and in PySCF. Three NOTEs fixed by Sos
>   (`c913fca`): the STATES press on a record-only molecule keeps the worker's refusal sentence; "same texels" across browsers
>   reworded (each browser is self-consistent); C₆₀'s record is `a8166591…` (145 KB) since S4b regenerated it.
> - **v0.4.0-alpha CUT, LOCAL ONLY:** version line `8193016` (`BUILD_LINE = '0.4.0-alpha · the library · 2026-10-08'`, README
>   "Status: 0.4.0 alpha."), annotated tag `v0.4.0-alpha`, CHANGELOG `32bf806` (waves 140–182, 34 waves; the numbering has gaps at
>   149–154 and 175–177 from the parallel builders — cosmetic), snapshot #16 at `~/Documents/LAMBDAWAVES-RELEASES/v0.4.0-alpha` (17 MB)
>   + the vault index note, `dist/` built and verified (247 files, 16.51 MiB, the 11.5 MB library inside). Node gate exit 0 at the cut.
>   **Nothing pushed, deployed or released** (Josh's ruling). The road when that day comes is the one in the Sos update above, with
>   `v0.4.0-alpha` in place of `v0.3.3-alpha`. Josh's test servers (8721 / LAN 8711) now serve the 0.4.0-alpha tree.
> - **0.5.0 planning (NACRE) in `research/release-0.5.0/`:** `PLAN-DRAFT-0` (Fable) → `REVIEW-SONNET-0` (`636c044`) → `PLAN-DRAFT-1`
>   (`7d10a63`) → `AUDIT-OPUS-1` (`87f5bd6`) → **`PLAN-DRAFT-2` (`2c6cbe2`)** → REVIEW-SONNET-2 (running) → DRAFT 3 (the one Josh reads)
>   → `PLAN.md`. The plan's spine: the release is judged by `lab/*.js` falling (0.4.0 added +1,559 against its law); stage A THE SEAMS
>   capped at +150 with A2/A3/A4/A12 struck and the `__LW` law (1,507 uses of 96 members: no renamed member without its test); A6 a
>   facade holding `demand('app.play')` under `modArm && clockLink` (LINKED retires at C4); R5-G1 default = pin alpha.24, re-adopt once
>   at the first kit carrying brief 8; C0 the bare adopt + cascade with seven stylehash classes as Josh's rulings; the one lock at C7;
>   CDP `TaskDuration` ms/s with a measured floor; 28.2–29.6k ESTIMATE; D on a net-≤-0 ledger with D9 (the legacy five, 1,469 lines)
>   first. **Rulings for Josh first:** R5-G1, R5-W1 (the kit-file wiring law), R5-A3 (one project part), R5-L1 (the legacy five); then
>   his Q1–Q3 (camera bindings; the 0.5.0 minimum + who builds the MIR briefs; MIR OPTIONS / LANGUAGE / KEYBOARD skin).
> - **Stage A wave 1 (from `12451d2`, each in its own worktree, NOT merged yet):** A5 DONE on `worktree-agent-ac7efdcc9d1fca69a`
>   (`f9b47dd`: `lab/mod-port.js`, rack.js −163, −44 net) with A6 (the facade) being built by the same builder; A9 DONE and A10 half on
>   `worktree-agent-a951ee2405b1383e6` (hand-off `b6dfda6`), A11 next, builder resumed; A0 (the baseline, stylehash with modwindow +
>   notebook open, the INFORMATIONAL spike by five rules) running on Sonnet; **A4 PARKED** on `worktree-agent-a42dc49a851951ba4`
>   (`4bd0bbc`, lab/windows.js, green, +38) — struck as a stage by the audit, kept as C3's reference, never merged. Wave 2 after wave 1
>   merges: A1+A8 ∥ A7. Merge order: A9–A11, then A5+A6 (A5 may merge alone if A6 lags).
> - **Still Josh's:** the M5 numbers (persist, `limits.html`, `?report=1&post=1`); the camera bindings; the carried rulings (Br₂, C₆₀'s
>   allowance, C₂₀H₂₀, one rock-salt cube, the subtraction law unmet four times).
> **UPDATE 2026-10-08 ~12:10 — Claude Sos: the 0.5.0 plan is at DRAFT 3 for Josh; A5+A6 merged; wave 2 building.**
> - **PLAN-DRAFT-3** (`371c100`; vault mirror `LAMBDAWAVES CLAUDE 0.5.0 PLAN DRAFT 3 2026-10-08.md`) closes the NACRE rounds: Fable
>   pre-draft → Sonnet review → DRAFT 1 → Opus audit → DRAFT 2 → Sonnet review 2 → DRAFT 3. Josh reads it; his rulings go into a §9 and it
>   becomes `research/release-0.5.0/PLAN.md` (+ the vault `LAMBDAWAVES CLAUDE 0.5.0 PLAN <date>.md`). Its §3 asks him four things first:
>   the glass (seven stylehash classes at C0, each a screenshot ruling), the camera bindings (Q1), R5-G1 (pin alpha.24, re-adopt when
>   brief 8 lands), R5-L1 (the legacy five, deletable ceiling 1,139 — they pay for the INFORMATIONAL); then Q2 (the 0.5.0 minimum without
>   C8; who builds the MIR briefs) and Q3 (MIR OPTIONS / LANGUAGE / KEYBOARD skin — defaults hidden, hidden, λWAVES'). Defaults taken
>   unless he objects: R5-W1, R5-A3 and the rest of §3's list.
> - **A5+A6 merged** (`b5b6d7d`, builder `8fee157`, waves 188–189): `lab/mod-port.js` the port `createModulation(port)` takes; `onePlay`
>   in `lab/clock.js`; the facade holds the kit's `demand('app.play')` while MOD is armed and LINKED — S0's refusal closed; the LINKED
>   retry and re-arm deleted. `lab/*.js` 36,280 → **36,234 (−46): the first seam of 0.5.0 subtracts.** Merged-tree gate: node exit 0;
>   `take-in-bugs` 4/4, `history` 39, `mir-controls`, `routed-knob` green. CLAUDE.md's modulation paragraph carries it (`994c4e1`).
> - **Building from `b5b6d7d`:** A1+A8 (the settings adapter + the camera port with the bindings as a data table; 8763/5233) ∥ A7 (the
>   occlusion providers; 8773/5243); A9–A11 (A9 done; A10's four gate rewrites with the manifest pin kept; A11 = the skip list; the
>   throwaway alpha.24 canary) on 8767/5237; A0 (the baseline, stylehash with the window open, the INFORMATIONAL spike by five rules).
>   **A4 parked** (`4bd0bbc`), never merged. Next after wave 2: **A-M**, the ms/s instrument (`tools/perf/main-thread.mjs`, CDP
>   `TaskDuration`) and the pre-C baseline. The standing merge conflict between A branches is the generated `lab/sw.js` (take either side,
>   `pwa --write`).
> **UPDATE 2026-10-08 ~12:50 — Claude Sos, fourth usage pause: stage A wave 1 all merged; A0's row in; wave 2 parked with designs.**
> - **Merged on `sos-s0`:** A5+A6 (`b5b6d7d`), **A9–A11** (`611474b` + follow-up `9443c2d`: the ACTIONS table on the kit's ids with
>   FOLDERS on O and `Ctrl` explicit; eleven suites by hook; the canary's four gate rewrites with the manifest's sha pin kept; the
>   driver-port settle in `tools/gate/drv.mjs`; `sw.js` §1b `SKIP = ['mir/locales/*.json', 'mir/tokens.json']` — the adopted alpha.24
>   copy 9.46 → 7.33 MiB; the canary's node reds 78 → 81 of 85, the four left are the kit's: `mir-manifest` (C0's pin), `new-project`
>   (C0's bpm regeneration), `wiring` (R5-W1), `pwa`'s three hidden kit deltas), and **CANARY-A0 PARTIAL** (`ff17874`). `lab/*.js`
>   36,280 → **36,198 (−82)**. Merged-tree gate running at this writing (node + keyboard-window, menubar, history, offer, take-in-bugs,
>   frame-occlusion; log in the job tmp). Still to write for A9–A11: REPORT waves 193– and `A9-A11-BUILD.md` from its hand-off
>   `15b4d5e` (a Haiku 5.5 task), including the R5-W1 proposal and the drafted CLAUDE.md keyboard paragraph.
> - **A0's decisive number:** the kit's label layer over the stage costs **+90 % main-thread ms/s at 8 bare labels** (45.1 → 85.9;
>   style recalc scales with labels; `viewChanged` itself is 0.09 ms/s) against the plan's +10 % rule → **by the rule, D1 (the
>   INFORMATIONAL window) waits for brief 7's coalesced layer and is 0.5.1**, unless pass 2 or a kit fix changes the number. Stylehash
>   with the modulation window open shows R13 as a DOM change (34 elements swapped; `#modwin` gains a backdrop-filter). Not measured:
>   legibility (headless Chromium screenshots the WebGPU canvas blank — use the gate Firefox), the under-a-rack count, the sanitiser.
> - **A-M merged after all** (`d7edc99`, Sonnet `ed05ca3`): `tools/perf/main-thread.mjs` + `cdp.mjs` `metrics()`; the floor on `02dce23`
>   median **13.879 ms/s, spread 0.536, MAD 0.158** (5 runs, load < 2.3) → C-V's gate is the 2 ms/s minimum. UNVERIFIED: presents stayed 0
>   (check `__LW.field.ok` under the same flags). §6 landed in 0.4.0's MEASURE.md; move to `research/release-0.5.0/measure/MEASURE.md` §1.
>   The pre-C baseline = the tool re-run after A1+A8 and A7 merge.
> - **Parked with designs, no code:** A1+A8 (`worktree-agent-a93d670fd213115b8`, `df081b1`, `A1-A8-HANDOFF.md`: the store's API and
>   the 7+1 sites on `b5b6d7d`; the camera port's members; the bindings table; the Alt+Arrow conflict with A9's rows and its
>   resolution), A7 (`worktree-agent-a45dd079234049e48`, `89452ae`, `A7-HANDOFF.md`: the registry design, +25 lines, `modDodge` still
>   in `rack.js`). **Resume both from the tip after `d7edc99`**, not from `b5b6d7d`.
> - **Josh's reading:** `PLAN-DRAFT-3` (`371c100`) — the glass (seven classes), the camera bindings, R5-G1, R5-L1; Q2, Q3. D1's new
>   number belongs in his read: the plan's rule has already fired once.
> The bullets below are Yan's text as she left it.

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
