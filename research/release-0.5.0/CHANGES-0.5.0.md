# λWAVES 0.5.0 — what changed, in plain words

Josh's ruling (PLAN §9, 2026-10-09): "I definitely need a changelog of just the major feature changes after the release of 0.5.0 or 0.5.5." This
file collects the user-facing feature changes of 0.5.0 as each row merges; it is finished and mirrored to the vault at the cut, and it is separate
from the tag-generated `CHANGELOG.md`. One line per feature, no code names; the row that brought it in brackets. The integrator adds each merged
row's line; the rows merged before this file existed are summarised at the cut from their BUILD files (C0 the adoption's visible changes, C1 the
camera panel, C4 the one clock and the kit's modulation window, C7 the film, D9/D9b the retired legacy windows, C2 the look, C3 the rack, menubar,
keys and keyboard window, C6 FOLDERS).

- Every control now wears MIR 1.5's glass: a press shrinks a hair while held, cards and value tips cast one soft light from above, an ON label
  glows in the accent, a window's power is just a lit ⏻ with no button face, and a knob turns by dragging up or down (sideways does nothing).
  NEW now starts at 30 BPM, not 60. (C0)

- The CAMERA card is MIR's camera panel: a direction sphere for yaw and pitch (each with a dial of its own now), a pan pad, ZOOM, FOV and the
  hand's DRAG, FRICTION, FLING, AUTO-ROTATE and SPIN (read in degrees per second), and turning one pan axis no longer disturbs a modulated other
  one. The phase palette is edited in MIR's RAMP panel (colour stops on a bar, a preset stepper), and the old CAMERA MOTION rows and palette
  editor are gone. (C1)

- Play is one thing everywhere: the play button, Space and the modulation start and stop together on one clock, so LINKED / SEPARATE is gone,
  and the MOD button and the modulation window's power switch only bypass the routes, never starting or stopping time. The modulation window is
  MIR 1.5's own, with a tempo grid of eight tiles in two rows of four. (C4)

- Films are rendered frame by frame, exactly: the same project gives the same frames every time, as an MP4 (it was a real-time WebM) or as
  lossless PNG frames in a zip. A render is slower than playing (about 37 seconds for a 6-second clip), the frame rates are 24, 30, 48 and 60
  (15 is gone), and the page ignores input while a film renders until Escape or CANCEL stops it. (C7)

- The five hidden legacy windows, QCD, H₂⁺, HELIUM, H₂ and ELECTROSTATICS, are retired: a file that used one still opens, never with an error,
  on the closest window left (H₂⁺ and H₂ as MOLECULES · H₂, HELIUM as SPECTRUM's ATOM at He 1s, QCD as QUARKONIUM with its parameters,
  ELECTROSTATICS as its own state with nothing drawn) and one line of notice says what changed. H₂ σu and HELIUM are now demos you can open.
  (D9, D9b)

- Your look (theme, card style, frost, DISCONNECTED, glass blur, the two accents, VIVID, status tags, control hints and help) now lives in MIR
  1.5's own preference store: a first run looks exactly as before (light, refractive glass, frost always, VIVID 50 %) and a returning browser
  keeps its look, carried over once. A fractional accent, VIVID or blur value snaps to whole steps (1°, 1 %, 1 px), and FORGET now forgets the
  HELP choice too. (C2)

- The rack, the menubar and the keys are MIR 1.5's: cards fold and grow with a short glide, the + list opens a window into the rack it came
  from, and one key table tells ⌘ from the Control key on a Mac. The KEYBOARD window is the kit's too, in the same charcoal-blue look, with a
  rail in place of its header bar and a Ctrl badge that reads "Ctrl" where it drew ⌃. (C3)

- Projects live in MIR 1.5's FOLDERS: ▤ in the notebook, the O key and FILE › SAVE AS / OPEN open a gallery of picture tiles and folders (SAVE,
  SAVE AS, NEW, OPEN FILE, EXPORT) in place of the notebook's PROJECTS face, the six demos are read-only tiles in DEMOS (a SAVE over one makes
  your own copy), and every project you saved before is still there. Project messages now appear as a toast at the foot of the stage. (C6)

- A press, tap, double-click or wheel turn that lands in a window's gap, even the space between a floated card's head and body, no longer
  reaches the stage, so it no longer orbits, resets or zooms the camera behind; a drag that starts on the stage still carries on over the
  windows. (C9)

- λWAVES opens on a title screen now: the photosensitivity notice first (once per browser), then the six demos as covers, NEW, and RESUME, which
  brings back exactly what you were working on. (C6b)

- The film is the kit's now: a RENDER card (pictures, films, previews, recovery of interrupted renders) and a TIMELINE window
  (automation clips on any dial, ONE PERIOD as a clip you can render). (C7b)
