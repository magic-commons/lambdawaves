# Parked macro tools — 2026-09-08

At the user's request, macro side dragging and the modulation matrix launcher are
hidden and disabled. Their implementation is retained in lab/modwindow.js:
`sideGrip`, `setMacroSide`, `matrixButton`, `renderMatrix`, and `closeMatrix`.
The styling lives in lab/modhost.css (`m2-side-grip`, `mod-matrix`).

Do not re-enable these without a new user request. Routing through existing controls
still works. Saved macro-side preferences remain readable. Future work should cover
keyboard and pointer placement, matrix route editing, and moving/restoring preset
and tempo bars without changing their dimensions or leaving detached controls.

The macro minimize behavior was clarified by the user: it must become narrow,
retaining each macro's actual value knob and routing grip. The compact rail is
112px wide with two 44px columns. Hide metadata and the expanded fader face, never
the knob's number seat. The earlier header-only collapse is superseded.
