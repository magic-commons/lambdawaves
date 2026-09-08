# λWAVES — handoff

Updated 2026-09-07 after completing the remaining local Claude board work in wave 107.
Read [TASKS.md](TASKS.md) for task outcomes, [LANDSCAPE.md](LANDSCAPE.md) for the code map,
and REPORT.md wave 107 for implementation decisions and STALE LAW / REAL DEFECT verdicts.

Josh's latest instructions: **keep the resting hint hidden**; **do not over-verify — Josh will verify**.
The completed focused probes are described in REPORT.md. Do not restart the historical audits.

## Local state

- Work is on `dev`. The full node/browser gate is running; merge to `main` only after it passes.
- The `pre-alpha-1` and `pre-alpha-2` fallback tags remain untouched.
- `~/Documents/LAMBDAWAVES-ARK` is the clean verification clone, refreshed after the final commit.
- The local deploy payload is assembled by `node tools/build-deploy.mjs`; `dist/` is generated and ignored.
- No remote is configured. No branches have been pushed and nothing has been deployed.

## Delivered in this wave

- Signed SPIN rates for z, K_z and L², macro targets, destination-scale-aware restoration,
  a held history gesture and deferred expensive recurrence scans during a drive.
- Kepler SPIN/TILT/TURN controls using axes derived from the selected shell, with disabled-state reasons.
- A working keyboard manual: live key-table adapter, editor lifecycle, recording, focus return and valid pane color.
- Project dirty baseline, unsaved open/new/unload warnings and truthful failed-save status.
- CAPTURE · EXPORT FRAMES, connecting the existing deterministic renderer to ZIP download, progress and stop.
  This exports the present state's evolution with live modulation frozen during the run.
- CARD STYLE remains effective with FROST; plugin surfaces match the house pane in both themes.
- Free-camera no-op pitch restore preserves byte-identical link re-minting.
- Stale browser laws reconciled with later rulings. The frozen port bytes are unchanged.

The hidden `.m2add` and reorder arrows are deliberate later layout choices. ADD lives on the rail.
The resting hint stays hidden; temporary operation messages still use the existing status path.

## Remaining account boundary — task #37

`~/bin/gh auth status` reports no authenticated GitHub hosts. Josh must run:

```bash
gh auth login
```

Choose GitHub.com, the existing SSH key, and browser login. Once authenticated, the already authorized
repository setup can continue: create a private `lambdawaves` repository from this directory, add `origin`,
push `main` and `dev` plus tags, and make `main` the default branch. Do not publish it publicly by inference.

Cloudflare remains explicitly off limits to the agent. [DEPLOY.md](DEPLOY.md) contains the build,
account setup, deployment, DNS, acceptance and live rollback steps for Josh. A local build does not prove
a production deployment or an edge/client rollback. The requested working/development branches are
`main` and `dev`; the older dossier's `alpha` branch name is superseded by that ruling.

## Constraints that still apply

- After editing `lab/`, run `node tests/pwa.test.mjs --write` so returning clients get new bytes.
- `lab/mir/modwindow/*` is byte-frozen. Host behavior belongs in `lab/modwindow.js`, skin in `lab/modhost.css`.
- Follow `docs/ui/ANTI-PATTERNS.md` and `docs/ui/STYLE-LOCK.md`; numbers belong to their source constants.
- Never merge to `main` on a red browser gate. Never force-push or touch Cloudflare.
- Use ports 8700–8799 and 5200–5299. Do not touch 8443 or 8875.
- Do not write under `~/Documents/OBSIDIAN` or `~/Documents/LUX JSY LIBRARY`.
