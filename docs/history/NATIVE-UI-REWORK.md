# Native window rework — 2026-09-08

The user's requested native-window redesign is implemented locally over the existing,
uncommitted Final II/audio work. The modulation plugin and its styling were not edited
in this pass. Existing unrelated working-tree changes were preserved.

- Wave: flat control rows, observables at the top, independent shape/finish, signed and
  solid glass combinations, compact dial groups, no nested SPACE/DRAW frames.
- Spectrum: live equations in a hover/focus/tap popover, dials initially hidden, fully expanded
  mode chooser, and a Hamiltonian section containing its operator-specific controls.
- State: aligned rotor controls and A/B actions; Bow pull gain, response curve and
  momentum limit drive the real stage gesture. Manual strength/axis/release remains.
- Palette: one previous/select/next row; aligned enable/reset and reverse/invert controls.
- Camera: centered motion and view controls; capture retains its existing functions.
- Slice/Clip and Slice: sphere/plane miniature with continuous drag and keyboard
  orientation. The clipping shader and guide use the same arbitrary normal. KS keeps
  its existing 4D gestures and disables the ordinary-space miniature.
- Settings: LOOK / DISPLAY / QUALITY pages sized to their contents, real frame/axis enums,
  and keyboard editing moved entirely to the standalone `?` keyboard window.
- Native transport: expandable shared BPM, Hz, tap, modulation play, sync, cadence,
  quarter-beat and whole-beat holds. Modulation's existing design stays untouched.
- Disconnected selected native headers tint with Accent A; rack-switch buttons removed.

New native material settings survive project save/load, undo and share links. The link
extension is optional; default settings preserve the old encoded bytes, and older
readers warn that they skipped the new section. The amended layout rulings are at the
end of `docs/ui/STYLE-LOCK.md`.

Validation: module syntax, native material round-trip/legacy compatibility, statelink
18/18, exact export 40/40, accessibility 11/11, rotor 16/16, import wiring, PWA hashes
and local deployment build. Browser samples exercise both themes, keyboard opening,
real Bow gain, arbitrary plane input, fixed Settings-tab height, live Spectrum info,
and native BPM changes. Final browser checks are recorded in `.tmp/native-accept.mjs`.
An initial headless run lost its WebGPU device. Subsequent runs initialized WebGPU,
compiled all pipelines, and rendered signed/glass and solid/glass with no GPU or page
errors. Spectrum's content height stayed 1030 px before/during its live math popover
and after playback. Settings stayed 593 px across tabs. The expanded floating transport
fit its 560 × 130 px box; the docked bar fit 256 × 349 px, both without horizontal overflow; shared holds latched and released. These are focused desktop
samples, not the full historical browser gate or full mobile acceptance. No deployment
or merge was performed.

Follow-up: restored sculpted kit buttons and inset exclusive-choice tracks across
native windows, with accent lamps for latched switches and matching dark tokens.
Removed internal list scrolling except History; all 91 Spectrum labels remain visible.
LOOK owns Reset Layout, Forget and Warning. DISPLAY uses a P3 switch that stays off
when the browser cannot provide P3; the redundant actual-gamut readout is removed.
Spectrum coefficient knobs no longer inherit horizontal row flex sizing inside their
vertical stack, and lane buttons fit their own grid columns. Touch sizing is preserved.
The earlier fixed Settings-height and bounded-picker decisions above are superseded.

Further compacting: Settings LOOK now has a remembered WINDOW INFO switch, off by
 default, covering native popovers and legacy header information buttons. Numeric
interaction labels remain available. Palette's seam readout is removed from the
window. Camera control mode and autorotate share one row; a right/down disclosure
beside EXPORT FRAMES starts closed and holds the export, picture and loop readouts.
The modulation tempo bar's shared native rate knob now centers independently of its
value tooltip, which is positioned outside normal layout like native rack labels.
