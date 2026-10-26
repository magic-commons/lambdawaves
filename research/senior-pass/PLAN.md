# THE SENIOR PASS — λWAVES before 1.0 (Claude Yan, 2026-10-25; Josh: "let's do it")

The brief is Sol's note of 10-25 (the senior-engineer stack: Serena · Chrome DevTools · Context7 · Playwright · knip · dependency-cruiser · ast-grep ·
Semgrep) read against this repo. The ruling: NO massive refactor this close to 1.0 — λWAVES had its big one (0.5.2 Rack Dissolution; 21 measured modules,
`tools/rack-deps.mjs --classes` G-G). The pass is SIX BOUNDED ROWS, each with its own proof, measured before anything moves. Josh's dial stands: keep the
builds tight, no verification machinery in lab/, one verifier round per stage, Opus builders, THE LOCK 843/0 · 987/0 before and after every row.

## R0 — THE TOOLS (Josh's hand; this job cannot write the user config)
- Serena, user scope: `uvx -p 3.13 --from serena-agent serena init` then
  `claude mcp add --scope user serena -- uvx -p 3.13 --from serena-agent serena start-mcp-server --context claude-code`.
- Context7: the installed plugin's login (`/mcp` → context7 → authenticate).
- Chrome DevTools MCP only when a profiling row comes: `claude mcp add --scope user chrome-devtools -- npx chrome-devtools-mcp@latest -e ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`.
- Plugins worth adding from the directory (`/plugin` → browse): Research Desk (reference checks for Papers 3–4), claude-security (one pass before 1.0).
- knip · dependency-cruiser · ast-grep · Semgrep run as CLIs through npx / uvx; no MCP, no dev-dependency added.

## R1 — MEASURE (this row; read-only) → `AUDIT.md`
dependency-cruiser over lab · tests · tools (cycles, orphans, kit→app edges, fan-in/out), knip (unused files and exports, an INVESTIGATION QUEUE, never a
delete list — static HTML entries, workers, sw.js DATA, the adopted kit and the tools all fool static analysis), a duplicate-helper census across lab/,
the hidden doors, the test coverage per module, the laws' size. Output: one ranked list for Josh. No edits.

## R2 — KIT DAY
alpha.25 … 27 live only here while NEBULA · AUTOMATA · BASINS sit on alpha.24. Copy the kit home to `~/Documents/MIR` (branch worktree-mir-1.5), the
FOR-MIR lines become the kit's changelog, the manifest re-hashed; the three apps adopt through `adopt.mjs` then `--check`. Proof: `tests/mir-manifest.test.mjs`,
the kit's parity tools, each app's node suite.

## R3 — THE INSTRUCTIONS
CLAUDE.md is 16,466 words loaded whole by every agent. Split by subject into `docs/laws/*.md` (the stage words, the register, the volumes, the picker, the
film, the shell, the lock …) with a CLAUDE.md of at most two pages: the standing constraints, the gates to run, and the index. Nothing is lost: a
sentence-level diff proves every law landed somewhere. Laws a gate already enforces are cited, not restated.

## R4 — THE DOUBLES
The two bond rules (`elements.js bondsOf` by length for the sticks; `skeleton.js bondsOf` with orders, rings, ionic and H-bonds) become one; the census's
repeated helpers merge where byte-identical behaviour is provable. Proof: `bash test.sh node`, THE LOCK at both fixtures, the browser tests of each touched
window, `tools/rack-deps.mjs --classes` G-G.

## R5 — THE DEAD DOORS (Josh's yes / no per door; never deleted by default)
The hidden Gemma road (`ASK_ENABLED`), the hidden home button (`#lwHome`), the built-and-unmounted scrub (`ui.scrub`), the MIR logo button kept for a
function to come, the retired-window shims (these STAY: they open older files).

## R6 — RELEASE CHECKS → 1.0
claude-security once, Semgrep once (the PWA, imported project files, Markdown rendering, storage), `tests/pwa.test.mjs`, the facade pin, THE LOCK; then the cut.

## REFUSED
The shader and its appended style numbers; the three state scopes; the project and link byte formats; THE LOCK's capture paths; TypeScript or a bundler;
merging lab.css and skin.css or re-layering them; renaming shared bindings by sed (only `rack-deps --rename`).

## AFTER
The research-repo polish (OpenAI math-repo style) is its own project after 1.0.
