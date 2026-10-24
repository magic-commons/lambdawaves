# How the papers should sound — eight rules from the October argument

*Claude Yan (Fable 5.1), 24 October 2026. For Josh's own folder. Taken from §1 of `CLAUDE YAN — THE NEXT PAPERS — 2026-10-24.md` on the publication desk, where the sources are listed in full.*

In October 2026 OpenAI pushed 719 manuscripts in 372 families to a public repository and the mathematicians answered. Terence Tao's two posts, Sophie Huiberts' guest essay ("This is normal bad work"), the statement of the Association for Heterodox Mathematics and the Sienicki audit are useful to us not because of who is right about OpenAI but because the critics wrote down, under pressure, what a readable mathematical paper owes its reader. These are the eight things they asked for, turned into house rules for the λWAVES papers. None of this is cited in the papers themselves. The craft should show, not tell.

1. **Say on the first page which steps are new and which are known.** Huiberts: a prover must "explain what you did, including which steps required new ideas and which steps are already well-known." Draft 07 did this only in the status table at the end; Draft 08 does it in the introduction and again at each result.

2. **One idea per paper.** The release was faulted for "salami-slicing 372 results over 719 pdfs." Our collection went the other way on 12 October, three papers to two, and should stay there. A paper is a talk someone could give, not a ledger.

3. **The picture before the formula.** Tao's standing complaint about machine prose is that it "dwells at length on trivialities" and hurries past the step that matters. Draft 07 spent more words on binary16 rounding than on why two frames of equal density carry opposite currents. Draft 08 opens every section with the picture to hold in mind (a row of clock hands; a movie and its reverse; a basis that teleports probability) and demotes the device forensics to their evidential role.

4. **Keep the friction that teaches, cut the friction that does not.** Tao values the "natural friction" of a human author's difficulty because it makes the reader slow down where slowing down pays. The gcd proof of Proposition 1 is friction that teaches; the WGSL section numbers are not, and now sit in one paragraph a reader can skip.

5. **Ship the code and the data with the paper.** The release was faulted for promising code and not including it. Our edition already carries `verification/` with every control script and output and a work ledger of what changed and why. That ledger should be public with the papers; the Sienicki audit's main recommendation is a public correction record for both proofs and reviews.

6. **A human can give the talk.** Tao: authors should be able to "give a clear, expert-level talk on their results" before publication. Each of our papers names the scene in the instrument that the talk would open with, and asks the reader to go and make it. The ten Bosch paper, Josh's format reference, does exactly this with 4D Toys.

7. **Attribute, including to the machines and to the human.** Ideas in this corpus came from Josh, from Sol, from Codex's rounds and from Claude's reviews, and the retractions came from Codex. The bylines are Josh's call; the working records name the source of each idea.

8. **One at a time, read by a person first.** The AHM statement's complaint was bulk release without consultation. The right cadence is one paper, read by Josh and by one outside human, then the next.

## A ninth, learned the same evening

**Let the kill clause fire.** Every proposed paper in the plan carries a "how it dies" paragraph. The first one fired within hours: the lemma that promised the repaired water current would carry the dipole rate assumed a decay the minimal repair does not have, and the pilot showed the net flow leaving through the walls instead. The corrected lemma is better than the first, and the paper is better for having the failure in its record. Write the kill clause before the computation, and keep it when it fires.

## Sources

Tao, "Math 2.0" (6 October 2026) and "Proofs and prompts" (8 October), terrytao.wordpress.com; Tao's living summary at teorth.github.io/tao-web/ai-views.html; Tao's ICM 2026 remarks on AI prose; Huiberts, guest post "This is normal bad work" (12 October); the AHM statement (7 October); Sienicki, arXiv 2608.14673 (the audit and the public correction record); `overview.tex` of github.com/openai/math (372 families, 719 manuscripts). All read on 24 October 2026.
