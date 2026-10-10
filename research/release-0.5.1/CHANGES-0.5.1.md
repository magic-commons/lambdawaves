# λWAVES 0.5.1 Informational Update — what changed, in plain words

Josh's ruling (0.5.0 PLAN §9, 2026-10-09): a changelog of just the major feature changes at each release, separate from the tag-generated
`CHANGELOG.md`. This file collects the user-facing changes of 0.5.1 as each row merges; it is finished and mirrored to the vault at the cut. One line
per feature, no code names; the row that brought it in brackets.

- A modulated brightness control can no longer flash the picture: an LFO on EXPOSURE, GAMMA, KNEE or the STAGE ground that would swing the
  picture by a tenth or more faster than three times a second is held to three swings a second, the dial shows the held value, and METERS says
  so (`FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`) until it calms. A slow or shallow sweep and every other control are never touched, and your
  own hand on a dial nothing modulates passes straight through; a hand sweeping faster than three times a second on a dial an LFO is also driving
  is held like the LFO, because the picture it makes is the same flash. The line clears by itself a second after the LFO stops moving. This guard
  sees only those four controls; a fast sweep of the register, a kick or the camera is not judged yet. (D10-19)

- On a phone every control is now a real finger target: the transport's buttons and tempo chip are 44 px tall, the small segments and triggers in
  OBSERVER, CAMERA, RENDER, SPECTRUM and SETTINGS are 44 px, and stacked dials have a little more air so two rings never overlap. Desktop and iPad are
  unchanged. The STATE card's momentum kick is called IMPULSE again (the group, its readout `LAST IMPULSE`, the knobs' hints); the trigger still says
  RELEASE. (D10-F)

- The words on the stage, the molecule's formula or the playing states, are now written by MIR's own INFORMATIONAL layer: ink with a soft shade in
  the kit's serif face, sitting still at the top of the free stage between the racks, never under the transport or the TIMELINE; a hand's preset
  still announces itself over them for a moment and fades back. Holding I keeps the words still. The element letters on each nucleus are as they were.
  The old renderer is gone, and the picture costs nothing more while the camera turns. (D1)

- A CURVES card, in + and WINDOW and closed until you open it: Photoshop-style curves (MASTER, R, G, B; presets LINEAR, LIFT, S, LOG, GAMMA, INVERT;
  an AMOUNT) that grade what you see on the screen at once. Pictures, films and frame exports are untouched, and the card says so. The grade is
  remembered on this device across reloads and project opens, and FORGET clears it. A graded screen costs some frame rate; the neutral curve costs
  nothing. (D10-24)

- Pick a molecule and its head appears on the stage for a moment: its formula and name, the method and basis with the total energy, how many
  orbitals are filled out of how many, its point group, the name of its highest filled orbital and the gap to the lowest empty one — every
  number from the molecule's own library record or from the solve you just ran, never typed in by hand. Escape, or a click on the picture
  after a couple of seconds, puts it away; opening a project, a link or a demo, or undoing, never shows it. (D2)

- Links in your notes can drive the lab: in the notebook's preview a link written `lw:molecule=h2o`, `lw:view=density`, `lw:preset=…` or
  `lw:orbital=homo` picks that molecule, view, preset or orbital as if you had pressed it — one undo step and one announcement each. A link can
  never replace your whole state, an unknown one is named on the notebook's foot, and every other link still opens in a new tab. (D8)
