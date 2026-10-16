# 0.9.1-alpha "Platform" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.17. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 04:10 while 0.8.0 built; base filled at the 0.9.0 cut — see "The light check"). ZERO `lab/` lines: a
wrapper never edits the engine. Two Opus builders in sequence: H1 `h1-homecoming`, then H2 `h2-rows` from H1's merge. Build notes: `H1-BUILD.md`, `H2-BUILD.md`.

## The shape
THE WRAPPERS ARE BROUGHT HOME, NOT REBUILT: `worktree-hosts-m0` (eight commits past the merge base `91c90bc`, v0.2.3-alpha.3 of 2026-09-24) merged onto `yan-c` with
every `lab/` difference resolved as `yan-c`'s; `shells/{electron,android,android-webview,ios}` → `tools/platform/`; the store kits and the legal files kept; the
acceptance matrix re-pathed. THE ROWS RE-MEASURED on the current cut with this machine's hosts: the Linux Electron package built, smoke-run, its payload sha and the
field-law line recorded; win32-x64 built not run; Android built if the SDK resolves, else UNBUILT with the reason; iOS "needs a Mac"; the September rows HISTORICAL in
place; paste lines for Josh's devices; the store listings read against README with every unbacked claim listed for him.

## H1 · THE HOMECOMING
(filled at H1's merge)

## H2 · THE ROWS RE-MEASURED
(filled at H2's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The iPad M5 and iPhone rows (WKWebView WebGPU — UNVERIFIED until Josh runs the shell and pastes the line); his Windows PC row; MIR mobile (unplanned); the store
listings' final words (his); the push/deploy decision for the whole 0.5.3 → 0.9.1 run; any store submission.
