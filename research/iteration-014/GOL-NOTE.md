# THE GOL NOTE — FL Studio's picker, its vector GUI, and a brief for λWAVES' icons (iteration 014 chain E, 2026-10-22)

Research only. Nothing under `lab/` changes in E. The icon redraw is a later iteration. A7, the window picker, takes §4's motion.

## 1 · What is public (sourced; "not found" means I searched and found nothing)

**Gol.** Didier "Gol" Dambrin wrote FruityLoops (1.0.0, 18 Dec 1997) and became FL Studio's chief software architect. Image-Line's founder
tells the story: they hired him at 19, after he won the game prize and the overall prize at IBM's Da Vinci contest. He came from games:
*Private Investigator*, *Eat This*, and the step sequencer he built while making *Eat This*. The founder says Gol wanted "to approach music
creation from a gaming perspective" ([zplane interview, 2023](https://products.zplane.de/blog/jean-marie-cannie-interview-image-line);
[Wikipedia](https://en.wikipedia.org/wiki/FL_Studio)). His only on-camera interview, for Genius in 2019, is about music, not graphics: "it
was not designed for musicians"
([MusicTech](https://musictech.com/news/gear/fruityloops-was-not-designed-for-musicians-didier-dambin)). FL Studio is written in Delphi
and assembly.
- **His own code: not found.** I found no repository, talk, blog or write-up by Gol on the GUI engine. What he has said is in short
  forum posts on forum.image-line.com, and logged-out visitors see only previews of them.
- **In 2011 he argued against a vector GUI.** The thread is "FL Studio in vector graphics. What's stopping you gol?"
  ([t=70211](https://forum.image-line.com/viewtopic.php?t=70211)). His visible reasons, from the previews: no good SDK ("Direct2D is
  Vista only…"); vector UIs he had seen looked worse than good bitmaps ("show me quality vectorial GUI's out there"); and on 3-D: "they're
  all triangles as it's 3D-accelerated". Four years later FL 12 shipped vector throughout, so the engine is his answer to his own
  objection.
- **FL 12 (2015) went "100 % vectorial".** Image-Line's release text says it holds "pin-sharp fidelity" on 4K, 5K and 8K screens
  ([MusicRadar review](https://www.musicradar.com/reviews/tech/image-line-fl-studio-12-624510)). The plugins followed over later
  versions: 3xOSC, Edison, the controllers, then Sytrus, and more in 20.5
  ([AlternativeTo, 20.5](https://alternativeto.net/news/2019/7/fl-studio-20-5-released)).
- **The icons are a font.** Asked where FL 12's vector icons live, Gol answered
  `(program files)\image-line\shared\artwork\fonts…` ([t=139371, 27 Mar 2015](https://forum.image-line.com/viewtopic.php?t=139371)).
  Users later found `IL Glyphs.ttf` there, plus an `ILGlyphsEx.ttf`, and used the glyphs as button captions in Control Creator
  ([2021 thread](https://forum.image-line.com/viewtopic.php?p=1616704)). **This is the main secret of the scaling.** Icons drawn as font
  glyphs pick up hinting, subpixel placement, one colour from the text colour, and any size for free. Text and icons share one renderer.
- **GENERAL SETTINGS says how the motion is governed**
  ([manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings_general.htm)):
  - ANIMATIONS is a slider from "Don't distract me" (all off) to "Entertain me". It covers menus, mouse effects, overlays and pop-ups.
    The manual adds: "Animations generally don't increase CPU load, sometimes higher animation levels use less CPU".
  - SMOOTHING is a "GUI/control motion smoothing factor": controls ease toward their value, they do not jump.
  - ANIMATION REFRESH RATE is ¼ or ½ of the monitor's rate, or the full rate ("Ultrasmooth").
  - FORCE REFRESHES "may reduce 'ghosting' on fast moving animations".
  - Scaling is per surface: main, pop-ups, toolbars, cursors, plugins. A separate "Thick lines" option applies at 200 % and above.
- **The Plugin Picker** opens with F8 ([manual, VIEW menu](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/menu_view.htm)).
  - It is a full-window array of plugin icons, effects on the left and instruments on the right.
  - Press and drag an icon: "the picker list will close" the moment the drag starts, and you drop the plugin where it goes.
  - Categories date from FL 9. FL 2024's notes add search that "matches items containing any of the typed letters", with the default item
    set to the first match ([24.1.1 notes](https://forum.image-line.com/viewtopic.php?p=1960887)).
  - A 2024 lesson describes hovering a category: it filters to its plugins "avec une petite animation conviviale" (with a small, friendly
    animation), and the matches are highlighted as you type
    ([Elephorm](https://www.elephorm.com/formation/fl-studio-24-les-nouveaux-outils-et-instruments/nouveautes-de-fl-studio-plugin-picker-et-recherche-avancee)).
- **The faux motion blur: no write-up found.** No source names it. §4's technique is a reconstruction from how it looks (a moving
  element trails a stretched, faint copy of itself), not Gol's code.

## 2 · The secrets, as far as they can be read
1. **One renderer for words and marks.** The glyphs are a TTF, so an icon is a character, sized and coloured like text. MIR already draws
   its glyphs as currentColor SVG and λWAVES' as CSS masks; the equivalent is to keep every mark on the type grid (24-unit boxes, sizes in
   the text's steps).
2. **Vector everywhere, scaled per surface.** There is no bitmap anywhere. Each surface has its own scale and a thick-lines switch above
   200 %. For an MIR 2.0 resizable GUI, the analogue is one `--ui-scale` per layer (rack, menus, pop-ups), with px derived from it.
3. **Motion is a budget, not a decoration.** There is one slider (off … entertain), a refresh rate tied to the monitor, and smoothing on
   every control. Animations replace redraw work rather than adding it, which is why higher levels can cost less CPU.
4. **Brisk comes from closing on intent.** The picker shuts the instant a drag starts, and search lands on the first match by default. The
   delight is in the transitions, never in a wait.
- **Call 1 for Josh.** "Copy exactly" needs FL's own outlines. They live in `IL Glyphs.ttf` on an FL install, and that font is
  Image-Line's property. Shipping copies of it in λWAVES is a licence question for Josh. Group A on the sheet is Gemini's drawing *after*
  FL's glyphs, not a copy.

## 3 · The icon brief (the redraw iteration starts here)
- **Grid:** viewBox 24, live area 2…22. Circles overshoot squares by 1 unit, so they read the same size.
- **Form:** filled first. Lines are 2 units, round caps and joins. Corners rx 2.5 (small parts 1.5). Triangles are softened by a 1.5 round
  join.
- **Two tones only:** the figure in `currentColor`, and a soft tone in the same colour at 0.35, used for the back plate, an inner face or
  the secondary part. Because nothing but currentColor is used, the icon follows the ink, the accent and both themes.
- **Group A** (FL has the icon; copy it): play · pause · stop · record · folder · save · settings · zoom · snap · search · undo · loop.
- **Group B** (λWAVES alone; reinterpret in the same language): orbitals · hydrogen · molecule · spectrum ladder · palette ring · lattice ·
  field box · modulation · timeline · render · curves · library.
- **The sample:** 24 SVGs by Antigravity (`agy -p … --model gemini-4-argon-medium`, one call from a git-ignored scratch dir, the brief
  above), cleaned as in 012 I1 (no script, href, url, style or text; currentColor only), in `gol-icons/`. The sheet is `GOL-ICONS.html`
  (16 · 24 · 32 · 48 px, light / dark / accent, and a live demo of §4). Shot: `e-shots/E-gol-icons.jpg`.
- **What is weak in the sample** (fix in the redraw): settings is a spiky sun, not FL's toothed gear; orbitals' lobes are thin at 16 px;
  timeline's playhead crowds the bars; library's spines merge at 16 px. Play, stop, record, folder, save, zoom, snap, molecule, palette,
  lattice and field box read well.
- **The road in the app:** these files replace `lab/img/icons/*` one for one. Two tones survive the CSS-mask road only if the mask is
  split into two layers, or by inlining the SVG. Inline currentColor SVG through a kit `registerGlyph(name, svg)` (FOR-MIR 012) is the
  clean road.

## 4 · The picker's motion (A7 builds this)
- **Spring open:** the panel scales from (0.94, 0.6) to 1 over 320 ms on `cubic-bezier(.2, 1.4, .4, 1)`, a small overshoot, its origin
  at the anchor.
- **Stagger:** the rows enter 30 ms apart (translateY 14 px → 0 and opacity, 420 ms, the same overshoot), starting 60 ms after the open.
  The stagger is capped by the visible rows, so a long list is never slow.
- **Faux motion blur:** each moving row carries a stretched duplicate. It is its own `::after`, `scaleY(1.9)` at 10 % alpha, collapsing
  into the row over 220 ms. That is one composited layer per row, with no filter and no extra paint, so it costs what the move costs.
- **Close:** fast, 120 ms, no spring. Brisk beats pretty on the way out.
- **Reduced motion:** none of it; the end state at once.
- **Search:** typing filters live, and the first match is the default (Enter opens it), FL 2024's rule. Unopenable rows are greyed, never
  hidden.
