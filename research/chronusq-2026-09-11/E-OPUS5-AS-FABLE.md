# Making a Claude Opus 5 subagent (`claude-opus-5`) behave like Claude Fable 5.1 (`claude-fable-5-1`)

Research date: 2026-09-11. Scope: documented (official) guidance first, practitioner reports second, all grounding a draft skill block. Nothing below is quoted unless the page was actually opened; anything found only as a search-result title is marked UNVERIFIED and not quoted.

---

## (a) Documented differences, Opus 5 vs Fable 5.1

| Axis | Claude Opus 5 (`claude-opus-5`) | Claude Fable 5.1 (`claude-fable-5-1`) | Source |
|---|---|---|---|
| Positioning | "For complex agentic coding and enterprise work"; "start with Claude Opus 5 for most workloads" | "For demanding reasoning and long-horizon agentic work," used "when your evals on Claude Opus 5 at higher effort still fall short" | [Models overview](https://platform.claude.com/docs/en/models/overview) |
| Price / MTok | $5 in / $25 out | $10 in / $50 out (2x) | [Models overview](https://platform.claude.com/docs/en/models/overview) |
| Latency (relative) | Moderate | Slower | [Models overview](https://platform.claude.com/docs/en/models/overview) |
| Thinking default | Adaptive, on by default, but **disableable only at effort `high` or below** | Adaptive, **always on**, cannot be disabled at all | [Opus 5 overview](https://platform.claude.com/docs/en/models/opus-5/overview); [Fable 5.1 whats-new](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1) |
| Default user-facing response length | "Claude Opus 5 is an exception on verbosity: its default user-facing responses run longer than prior models', and raising or lowering effort does not reliably change visible response length." | Opposite tendency: "writes fewer user-facing updates between tool calls" | [Prompting best practices §Communication style and verbosity](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) |
| Agentic narration | "narrates readily during agentic work: it tends to announce what it is about to do, and its per-message output in agentic sessions is often longer than prior models'" | "Fewer progress updates during long tool runs... writes less user-facing text between tool calls, especially at higher effort" | [Prompting Claude Opus 5 §User-facing progress updates](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5); [Fable 5.1 whats-new §Changed from Fable 5](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1) |
| Written deliverables | "files that Claude Opus 5 writes to disk (reports, Markdown documents, summaries) are often longer than on prior models" | Not flagged as a problem in either direction | [Prompting Claude Opus 5 §Written deliverable length](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) |
| Self-verification | "verifies its own work without being told to... verification instructions... cause over-verification"; also narrates its own corrections more than prior models | No equivalent over-verification note in the Fable 5.1 guide | [Prompting Claude Opus 5 §Task scope and over-verification, §Self-correction](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) |
| Task scope | "can also expand the scope of a task, adding steps that weren't requested or applying its own judgment about what the task should be" | Also documented (adds unrequested fixes/tests) but with an explicit fix prompt | [Prompting Claude Opus 5 §Task scope](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5); [Prompting Fable 5.1 §Keep changes and tests to what the task asks for](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) |
| Subagent delegation | "delegates to subagents more readily than prior models" — enough that Claude Code's `claude_code` system-prompt preset adds a damping line **specifically for Opus 5** | Also delegates readily, with its own tuning ("let the lead agent keep working while subagents run") | [Prompting Claude Opus 5 §Controlling subagent spawning](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5); [Agent SDK subagents §Run Opus 5 with subagents](https://code.claude.com/docs/en/agent-sdk/subagents) |
| Formatting density | Not specifically flagged (general-model note: "less verbose... may skip detailed summaries") | "leans the other way [from earlier models]: it uses bold less and is less likely to reach for headers, lists, or quotation marks"; denser, longer-sentence prose in places | [Prompting best practices §Control the format of responses](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); [Prompting Fable 5.1 §Writing density, §Formatting in chat](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) |
| Effort → visible length | Effort "controls thinking volume, not visible response length: on Claude Opus 5, changing effort does not reliably shorten responses" | Effort is the primary lever for cost/latency/quality trade-off generally | [Effort §Recommended effort levels for Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/effort) |
| Release / cutoff | Released 2026-07-24, knowledge cutoff May 2026 | Released 2026-09-01, knowledge cutoff Jun 2026 (successor generation) | [Models overview](https://platform.claude.com/docs/en/models/overview) |
| Anthropic's own framing (marketing page) | "comes close to the frontier intelligence of Claude Fable 5 at half the price"; customer quote: "writes clean, tight diffs with no dead code," "checks its own work the way a real frontend developer would" | Fable page: "avoids easy-seeming shortcuts, fixes the root causes of problems"; customer quote: Fable 5.1 "remains readable over long, multi-step tasks" and "communicates more effectively... with updates that are more concise and easier to follow" | [Opus 5 announcement](https://www.anthropic.com/news/claude-opus-5); [anthropic.com/claude/fable](https://www.anthropic.com/claude/fable) |
| Third-party benchmark framing (practitioner, not Anthropic) | — | officechai.com, citing Every's CEO: Fable 5.1 is "roughly twice as fast as Opus 5 while using about half the tokens"; Jane Street: "solved more of its internal coding benchmarks than Fable 5 or Opus 5, while staying easier to follow over long multi-step tasks" | [officechai.com/ai/fable-5-1-benchmarks](https://officechai.com/ai/fable-5-1-benchmarks/) — secondary source, quotes attributed to named companies, not independently verified here |

**Note on naming**: Fable 5.1 and Mythos 5.1 are the *same* underlying capability tier — Mythos 5.1 is the Project Glasswing-only release of the same model as Fable 5.1 ([Fable 5.1 overview](https://platform.claude.com/docs/en/models/fable-5-1/overview)) — so "Mythos-class" and "Fable-class" are the same target behavior for this exercise.

---

## (b) Official prompting directives — exact quotes

**Preamble / directness** ([prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)):
> "Prefills like `Here is the requested summary:\n` were used to skip introductory text. **Migration:** Use direct instructions in the system prompt: 'Respond directly without preamble. Do not start with phrases like "Here is...", "Based on...", etc.'"

**Positive over negative framing** (same page, §Control the format of responses):
> "1. Tell Claude what to do instead of what not to do — Instead of: 'Do not use markdown in your response.' Try: 'Your response should be composed of smoothly flowing prose paragraphs.'"

**Explain why** (§Add context to improve performance):
> "Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can help Claude better understand your goals... Claude is smart enough to generalize from the explanation." Example given: instead of "NEVER use ellipses," say "Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them."

**Length/verbosity is not effort-controlled on Opus 5** ([Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)):
> "Claude Opus 5's default user-facing responses run longer than prior Opus models'. The effort parameter controls how much the model thinks rather than how much it says: lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly."
> Sample instruction given: *"Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested."*

**Narration / progress updates** (same page):
> "Claude Opus 5 narrates readily during agentic work: it tends to announce what it is about to do... It benefits from explicit guidance on how to communicate with the user during a task."
> Sample instruction: *"Before your first tool call, say in one sentence what you're about to do. While working, give a brief update only when you find something important or change direction. When you finish, lead with the outcome: your first sentence should answer 'what happened' or 'what did you find,' with supporting detail after it for readers who want it."*

**Written deliverable length** (same page):
> *"Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate."*

**Over-verification / decisiveness** (same page):
> "Claude Opus 5 verifies its own work without being told to. If your prompt contains explicit verification instructions... remove them: instructions like these cause over-verification on Claude Opus 5, and removing them reduces wasted tokens with no loss in quality."
> Scope instruction given: *"Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work... Finish the whole task, and stop short of actions that are clearly beyond what was asked."*

**Self-correction narration** (same page):
> *"Only correct an earlier statement when the error would change the user's code, conclusions, or decisions. State corrections plainly and briefly, then continue the task. For slips that change nothing for the user, make the fix and move on without noting it."*

**Subagent spawning control** (same page):
> "Claude Opus 5 delegates to subagents more readily than prior models... If your harness supports subagents, give explicit guidance on which scenarios warrant delegation." Sample: *"Delegate to a subagent only for large tasks that are genuinely independent and parallelizable... Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work."*
> Corroborated by [Agent SDK docs](https://code.claude.com/docs/en/agent-sdk/subagents): "when the model is Opus 5, Claude Code adds a line to its system prompt telling Claude not to call the Agent tool unless it's asked to" — but **only** under the `claude_code` system-prompt preset; a custom/omitted system prompt (which is what a `.claude/agents/*.md` subagent effectively is) does not get that line automatically.

**Overengineering / minimal changes** ([prompting best practices §Overeagerness](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)):
> *"Avoid over-engineering. Only make changes that are directly requested or clearly necessary... Don't add docstrings, comments, or type annotations to code you didn't change... The right amount of complexity is the minimum needed for the current task."*

**No decorative markdown / no essay formatting** (same page, §Control the format of responses, the `<avoid_excessive_markdown_and_bullet_points>` block):
> *"When writing reports, documents, technical explanations, analyses, or any long-form content, write in clear, flowing prose... DO NOT use ordered lists (1. ...) or unordered lists (*) unless... NEVER output a series of overly short bullet points."*
> (Note: the same page warns this specific block is tuned for earlier models and *suppresses structure Fable 5.1 needs* — it is Opus-appropriate, not universal.)

**Grounded, non-speculative claims / mechanism over guesswork** (§Minimizing hallucinations in agentic coding):
> *"Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering... Never make any claims about code before investigating unless you are certain of the correct answer — give grounded and hallucination-free answers."*

**Effort as the lever for terseness** ([Effort §Effort with tool use](https://platform.claude.com/docs/en/build-with-claude/effort)):
> "Lower effort levels tend to: Combine multiple operations into fewer tool calls; Make fewer tool calls; **Proceed directly to action without preamble**; Use terse confirmation messages after completion. Higher effort levels may: Make more tool calls; Explain the plan before taking action; Provide detailed summaries of changes; Include more comprehensive code comments."
> And: "Recommended effort levels for Claude Opus 5... use `low` and `medium` liberally as your primary control for token cost and response time wherever your evals show quality holds," with `low` explicitly recommended for "subagents" in the general effort-level table.

**Subagent config supports a per-agent effort field directly** ([Claude Code subagent file format](https://code.claude.com/docs/en/sub-agents) and [Agent SDK `AgentDefinition`](https://code.claude.com/docs/en/agent-sdk/subagents)): the `.claude/agents/*.md` frontmatter accepts `effort: low | medium | high | xhigh | max` as a first-class field, alongside `model: opus | sonnet | haiku | fable | <full-id> | inherit`, `tools`, `disallowedTools`, `maxTurns`, `background`, `permissionMode`.

---

## (c) Practitioner directives — who reports them

**Confirmed by opening the source:**

- **Hacker News thread "Why I prefer Opus 5 to Fable 5"** ([news.ycombinator.com/item?id=49081970](https://news.ycombinator.com/item?id=49081970), 2026-07-28). Original poster, on Opus 5 vs Fable 5: *"It reports back — it seems to pause at natural phase gates and give an update on what it produced and why. There's a rhythm to it that keeps you the user involved."* Commenter `ocd`, directly on the verbosity gap: *"I found that Fable didn't have as much of an annoying verbosity problem as Opus either. Anything it did say was genuinely relevant and without filler."* Commenter `hardrave` pushes back (task-dependent): *"Fable managed to build a pretty advanced low-level systems project for me end to end, while Opus kept getting stuck on the overall architecture."* — i.e. practitioner reports are not unanimous that decisiveness is free of cost; treat "make Opus terser" as separate from "make Opus finish long tasks unsupervised," which the docs and this thread both suggest is still a Fable-favoring axis.
- **officechai.com, "Anthropic Releases Fable 5.1 And Mythos 5.1, Beats Opus 5 On Most..."** ([officechai.com/ai/fable-5-1-benchmarks](https://officechai.com/ai/fable-5-1-benchmarks/)) — quotes attributed to Every's CEO and a Jane Street team on token efficiency and legibility over long tool-call chains (quoted in section (a) above). Secondary tech-news aggregation, not a primary benchmark writeup.

**Found via search (titles/snippets only) — could NOT open the page, so NOT quoted, marked UNVERIFIED:**

- "Taming Opus 5" (every.to) — site fetched, but its search/listing did not surface this specific article; exact URL not recovered.
- "How to prompt Claude Opus 5 (and the four habits to delete)" — title only, source domain unknown.
- "Claude Opus 5 Prompting Guide: Verbosity, Scope, Subagents" — title only; may be a third-party mirror of Anthropic's own `prompting-claude-opus-5` doc rather than independent practitioner content.
- "Make Opus 5 less verbose with an output style and a hook" — title only. (Plausible mechanism given Claude Code's `--output-style` and hook system, but the specific hook implementation was not retrievable.)
- "20 Claude Opus 5 Prompts Tested (Copy-Paste Templates)" — title only, listicle, low confidence source even if it were open.
- "Developers Are So Done With Claude's Word Salad" (TerminalBlog) — title only.
- `prompting-claude-opus-5.md` and `claude-dev-toolkit/claude-code-ref/prompting-opus5.md` on GitHub — titles only; several repos named `claude-dev-toolkit` exist and the specific one could not be disambiguated without GitHub code search (requires auth in this environment).
- Reddit r/ClaudeCode: "Claude Code has a hardcoded instruction telling Opus 5 not to use subagents" — WebFetch is blocked from reddit.com/old.reddit.com in this environment; corroborated independently, however, by the **official** Agent SDK doc quote above ("Claude Code adds a line to its system prompt telling Claude not to call the Agent tool unless it's asked to" for Opus 5 specifically), so treat the official statement as the citable version of this claim.
- Tweet "We removed over 80% of Claude Code's system prompt for Opus 5 and Fable 5" (@trq212) — found via Hacker News indexing, but both the tweet and its xcancel.com mirror returned bot-check walls, not content. UNVERIFIED, not quoted.
- Simon Willison's blog (simonwillison.net) was reachable and searched directly: his Opus 5 posts ("Introducing Claude Opus 5," "Claude Opus 5 System Prompt," "Breaking Claude Code Opus 5 Auto Mode") were opened but **do not** contain a direct verbosity-vs-Fable comparison or a concise-prompting recipe — noted here so this gap isn't silently assumed filled.

**Search-engine access note**: WebSearch was capped at 200/200 calls for this session before this task began (not consumed by this research). DuckDuckGo (html and lite), Bing, Google, and Startpage all returned bot-detection challenges to direct `curl`/WebFetch access after the first one or two queries; Reddit and X/Twitter (including the xcancel mirror) were unreachable outright. The Hacker News Algolia API (`hn.algolia.com/api/v1/search`) was the one search channel that stayed open throughout and is the source for every HN citation above.

---

## (d) DRAFT skill block

```
## If you're an Opus 5 agent

- State the finding first, in one sentence. No "Here is...", "Based on...", "I will now...". ← claude-prompting-best-practices §Eliminating preambles
- Do not recap the task you were given — the caller already knows it. Answer, then support it. ← claude-prompting-best-practices §Be clear and direct (golden rule)
- Say what you're about to do in one line, then use the tools. Don't narrate step-by-step or announce each action. ← prompting-claude-opus-5 §User-facing progress updates
- Give one recommendation, not a menu. Note a close second only if one genuinely exists, in a clause, not a section. ← effort §Effort with tool use ("proceed directly to action without preamble" vs "explain the plan")
- Make routine judgment calls yourself; check in only when readings of the task would produce materially different work. ← prompting-claude-opus-5 §Task scope and over-verification
- Don't add your own verification step or narrate a self-check — you already verify; just do it silently. ← prompting-claude-opus-5 §Task scope and over-verification, §Self-correction
- Only flag a correction to earlier output if it would change the reader's decision; otherwise fix it and say nothing. ← prompting-claude-opus-5 §Self-correction
- Report the mechanism (what broke, why, the fix) — not a chronological log of what you tried. ← claude-prompting-best-practices §Minimizing hallucinations ("grounded... not speculation")
- Tag anything you did not verify UNVERIFIED. Never state a guess as a finding. ← claude-prompting-best-practices §Minimizing hallucinations
- Don't spawn a subagent to double-check yourself, or for anything you can finish in a handful of tool calls. ← prompting-claude-opus-5 §Controlling subagent spawning; agent-sdk/subagents §Run Opus 5 with subagents
- No new files, abstractions, or defensive code beyond what's asked. Minimum complexity for the task at hand. ← claude-prompting-best-practices §Overeagerness
- Reports and code: plain prose and real structure only, no filler bullets, no bold-everything, no padding sections. ← claude-prompting-best-practices §Control the format of responses; prompting-claude-opus-5 §Written deliverable length
- Phrase your own rules to yourself as what to do, not what to avoid, and act on the reason, not the letter. ← claude-prompting-best-practices §Add context to improve performance, §Control the format of responses
- Default this agent's `effort` to `low` or `medium` in frontmatter; reserve `high`+ for the one hard step. ← effort §Recommended effort levels for Claude Opus 5; effort §Effort levels ("low... subagents")
```

14 lines of content (plus the `## If you're an Opus 5 agent` header) = 15 lines, under the 25-line cap.

---

## Sources index

- https://platform.claude.com/docs/en/models/overview
- https://platform.claude.com/docs/en/models/opus-5/overview
- https://platform.claude.com/docs/en/models/opus-5/whats-new-opus-5
- https://platform.claude.com/docs/en/models/fable-5-1/overview
- https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
- https://platform.claude.com/docs/en/build-with-claude/effort
- https://code.claude.com/docs/en/agent-sdk/subagents
- https://code.claude.com/docs/en/sub-agents
- https://www.anthropic.com/claude/fable
- https://www.anthropic.com/news/claude-opus-5
- https://officechai.com/ai/fable-5-1-benchmarks/ (secondary; quotes attributed, not independently verified)
- https://news.ycombinator.com/item?id=49081970
- https://simonwillison.net/2026/Jul/24/introducing-claude-opus-5/ (opened; no verbosity-vs-Fable content found)
- https://simonwillison.net/2026/Aug/9/claude-opus-5-system-prompt/ (opened; export-control content only, not relevant to verbosity)
