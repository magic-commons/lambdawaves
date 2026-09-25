# The cross-refutation round · 2026-09-24

Each auditor now reads the OTHER FIVE audits (`AUDIT-A.md` … `AUDIT-F.md` under `research/optimization-2026-09-24/`)
and writes `REFUTE-<LANE>.md` (bash heredoc; ≤ 200 lines). The point is adversarial: the best refutation is one that
shows a proposed change would alter pixels, physics, saved bytes or a control, or that its measured gain is not there.

For every finding in the other audits that touches your lane's files or your lane's expertise, one of:

- **REFUTED** — the finding is wrong; the evidence (file:line, a measurement you ran, a test that reads the thing).
- **NARROWED** — right in part; what survives and what does not, with evidence.
- **CONFIRMED (+)** — right, and here is a stronger mechanism / a cheaper change / a better check.
- **RISK** — right, but the change breaks X unless Y (name the gate that would catch it, or write the probe).
- **MERGE** — two findings are one change; say which owns it.

Then:

- **Ranking**: your top 10 across ALL six audits by measured gain ÷ risk, one line each.
- **Missing**: anything nobody found (one line each, with the file:line).
- **Not now**: items you would postpone past this run (architecture changes, look changes for Josh, kit changes for MIR).

Same rules as the audit: READ-ONLY on `lab/` and `tests/`; probes under your `probes/<lane>/`; your own GD_PORT;
measure before you assert; never `pkill -f`.
