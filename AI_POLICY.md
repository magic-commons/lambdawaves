# AI policy

λWAVES was built with AI coding agents, openly — the README says which and how. Contributions made
the same way are welcome on the same terms:

1. **Say so.** If a tool wrote or substantially shaped a change, say which tool in the pull request
   and add an `Assisted-by:` trailer to the commit. That is disclosure, not a mark against the work.
2. **You are the author.** Whoever opens the pull request is accountable for every line in it and
   has run it. "The agent said it works" is not a review.
3. **No drive-by.** A pull request must answer an open issue or say, in your own words, what was
   wrong and how you saw it. Changes that touch `lab/mir/` go to [MIR](https://github.com/magic-commons/mir).
4. **Prose too.** Issues and reports written by a tool must be checked by you before they are sent;
   a report that describes a bug the code cannot have is closed without discussion.
5. **The gate decides.** `./test.sh` green, and `node tests/pwa.test.mjs --write` after any edit under
   `lab/`, before a pull request is opened.
6. **Read the notes.** An assistant working here for a user or a contributor reads
   [`docs/NOTES-FOR-AGENTS.md`](docs/NOTES-FOR-AGENTS.md) first: the device caps, the gates, and where the
   proofs and the laws live.
