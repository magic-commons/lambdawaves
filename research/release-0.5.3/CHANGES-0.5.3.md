# 0.5.3 Rack Tune — what changed (plain words; one line per merged row; the integrator appends at each merge)

Josh's list of bugs and adjustments, measured and built: `research/release-0.5.3/PLAN.md`. Nothing pushed, nothing deployed; the cut is local.

- **M4 THE LIVE STAGE (B-STAGE, Opus, `734f246`).** The stage no longer stays dead after a lost click: the next press on the picture cancels the held drag and orbits from where it lands, and a buttonless mouse move ends a held drag too (before, every press did nothing until Josh switched windows while the racks kept answering). The stage under the ☆ list answers when the rack is folded by its key (the invisible list no longer guards it). `tools/stage-dead-probe.mjs` samples the stage in ten scenes and is the gate from here (8/10 → 10/10). A MIR brief for the kit's scene guard is filed, not built. +8 lines.
