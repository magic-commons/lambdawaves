# 0.5.4 · PRE-MATH · NACRE PLANNING — the common file every planner reads first

Claude Sos (Fable 5.1), 2026-10-10. λWAVES 0.5.4 is planned by layers, Josh's way ("nacre", his vault notes `LAMBDAWAVES CACHING + INFORMATIONAL.md`
§NACRE PLANNING and `MORE MIR 1.5.X+ BRAINSTORM.md` §NACRE PLANNING, verbatim):

> - You, Fable 5.1, will ultrathink a plan as you would normally. This will be plan draft 1
>   - Before arriving at draft one, consult Sonnet 5.5 to review pre-draft, then also share ideas, missed spots, for you. Resynthesize and rethink and then
>     that's draft 1. You'll absorb Sonnet 5.5's beginner luck.
> - Then let Opus 5.5 @ High audit and edit the plan with it's own ultrathink and insight. Then review and synthesize on Opus's plan edits to create a plan
>   draft 2 (I don't see this btw, this is between ya'll)
> - Then Sonnet 5.5 @ High will look at draft 2, come up with it's 2 cents and essentially be the junior that has a 'beginner's luck charm' that can add a
>   couple of suggestions to the project. The plan edit goes back to you and you make plan draft 3. This will be how we synthesize plans.

So: Fable's pre-draft → Sonnet's review → DRAFT 1 → Opus (high) audits and edits → DRAFT 2 → Sonnet (high) adds a junior's two cents → DRAFT 3 → Josh
reads DRAFT 3 → `PLAN.md`. Josh (2026-10-10, `../release-0.5.3/ASK.md`): "feel free to do a round, but not like what the skill.md says but rather the
'nacre ultrathink planning' method with the Claude model family" — i.e. NOT `~/.claude/skills/mathcollab/SKILL.md` (the Fable ↔ Sol two-lab ledger);
the Claude family only. A pilot Opus 5.5 of another session is verifying Sol's mathematics and "will continue working on the math on our behalf":
this round plans what λWAVES must be BEFORE that mathematics can land — hence PRE-MATH. The mathematics itself is not this plan's to do or to judge.

## Josh's ask, verbatim (2026-10-10, pasted from his vault note "Planning for 0.5.3 minor update")

> # NEXT MAJOR TASK
> ## 0.5.4 PRE-MATH
> - A pilot Opus 5.5 started work on verifying GPT-6.1 Sol's work. She will continue working on the math on our behalf. However, feel free to do a round,
>   but not like what the skill.md says but rather the 'nacre ultrathink planning' method with the Claude model family (it was an old prompt somewhere).
> - The folder is called 'Lamb of Waves' in Documents > Obsidian

The folder is `~/Documents/OBSIDIAN/LAMB of WAVES/`: `SOL-6 LAMB of WAVES.md` (the chat, 5,558 lines), `for CODEX/` (Sol's 26 rounds: 339 .md, 425 .tex,
254 .lean, 190 .py, 130 .npz, 442 MB), `for CLAUDE/` (the pilot's `flow_containment/` and `round26_audit/`). Another author's folder: READ ONLY; nothing of
ours is written there; no script of theirs is run.

## Files (this folder)
- `survey/CODEX-ROUNDS.md`, `survey/ENGINE-VS-TREE.md`, `survey/PILOT-AUDIT.md`, `survey/CHAT-AND-ASKS.md` — the ground truth, read-only digests
  (2026-10-10). Read them before any draft. Where a draft contradicts a survey, the survey wins unless the draft says why. Where a survey contradicts the
  corpus, the corpus wins — and say so.
- `PLAN-DRAFT-0.md` (Fable's pre-draft) → `REVIEW-SONNET-0.md` → `PLAN-DRAFT-1.md` → `AUDIT-OPUS-1.md` (Opus's edited plan, full text, changes marked)
  → `PLAN-DRAFT-2.md` → `REVIEW-SONNET-2.md` → `PLAN-DRAFT-3.md` → (Josh) → `PLAN.md`.
- Each reviewer writes its file in full; the hand-back message is a ≤ 300-word summary. Nobody edits another's file.

## The laws every draft keeps (from `research/release-0.4.0/HANDOFF.md` §4–§5 and the 0.5.x record)
- Never edit `lab/mir/**` or `lab/fonts/**` (a kit need is a MIR brief). Subtract, don't add; diagnostics in `tools/`; the glass is Josh's.
- Three scopes (PREFERENCE / WORKSPACE / PROJECT, `docs/STATE-SCOPES.md`); `node tools/new-project.mjs --check` stays exact; the serialize bytes 11/11.
- THE LOCK (`tools/perf/digest-lock.mjs`: 860 + 1004 values · 0/0) is the engine's published contract: a moved digest is a defect, never a re-bake —
  unless a row changes the physics ON PURPOSE, and then the row re-bakes with the reason written and Josh's word.
- Nothing a hand or an eye meets moves without a row that says so; every row proves its claim with a measurement, not a hope.
- Opus for builders, Sonnet/Haiku for lighter rows (Josh 10-09); one fresh verifier for frame-path, worker/storage and release changes; don't over-verify.
- The line law of 0.5.2 (`lab/*.js` + shell + windows ≤ 27,943 at the cut, +1 % per release) is the standing shape; a PRE-MATH row that adds engine code
  states its lines and what it subtracts.
- Release names: one or two words, no "The" (Josh 10-09). The number and the name are Josh's; the folder is `research/release-0.5.4/` for now.
- Nothing is pushed, deployed or released until the whole plan has run (Josh 10-07); cuts are local.
- Plans record Josh's words verbatim (§9 RULINGS) and take his "defaults" as first options; the build starts on his word.

## What the pre-draft must answer (the NACRE question, Josh's words from the vault)
"In terms of the entire goal *you* think Josh is trying to achieve, how to make this user friendly (leverage the 'rack window'). How to execute this
cleanly. The infrastructure/baseline changes needed to pull this off, keeping optimizations and speed clean and smooth with no FPS stutters, and utilizing,
updating and upgrading already existing machinery in the UI."
