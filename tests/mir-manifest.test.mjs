// Prove the adopted bytes against the committed inventory without needing a
// sibling MIR checkout. The upstream adoption tool writes this manifest.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
/* THE PIN (0.4.0 S0 · wave 138).  The checks below hash the adopted files against THIS manifest, so a commit that edits a kit
   file AND rewrites the manifest ("1.4.4", 2026-10-05, a release MIR never cut) passed them.  Each accepted MIR version
   pins the sha-256 of the manifest's own bytes: a forged version fails here, in every checkout and every CI, and a real
   adoption is a visible TWO-file edit — MIR-MANIFEST.json (written by MIR's tools/adopt.mjs) and its row below. */
const ACCEPTED = {
  /* 021 K4 · KIT DAY: MIR 1.5.5, the first shipped 1.5 — the λWAVES lift (alpha.25–33 built here under the retired trickle-down rule,
     folded home and cut as kit commit a7fba3995839, tag v1.5.5), adopted by MIR's tools/adopt.mjs.  From here the kit sentence (CLAUDE.md:6):
     lab/mir is written by adopt.mjs alone, a λWAVES need is an additive door 1.5.6-alpha.N, and each adoption pins its row here. */
  /* 031 · THE KIT IS 1.5.5, LITERALLY (Josh 2026-10-31: "Call this version of MIR 1.5.5"): the twenty doors alpha.1–20 fold into the 1.5.5 cut
     of 2026-10-31 (kit commit 3051daf, tag v1.5.5; the 10-27 lift is tag v1.5.5-lift, its manifest sha f7c96a12a28cc07cf5c4e981e5f79903e9e8f62fe7aaaaec0f35004a4538ebb7).
     A new door continues from 1.5.6-alpha.21. */
  '1.5.5': 'e622ad104cd7832bd802c3f362490a8cdf21565017e0f2f0947f1ec672f1de9d',
  /* 032 TIMELINE REDUX · MIR 1.5.6-alpha.21 … 28 on the clone road (kit branch kit-032 @ 27dadc0, from the 1.5.5 cut): the arrangement's law (the highest lane
     wins, extent, stretch, a curve's steps), the event target (banded options), the timeline's hands (Shift selects and fines, Ctrl shapes), the loop,
     the work lane's face, the route from a clip, the send disarms, the card's × and the bare pop. The cut to a named number is Josh's. */
  '1.5.6-alpha.28': '01d16927392f7f8735d70545e34a4cae605f27057dcdf144b6159ebdb0b1cc11',
  /* 032 · MIR 1.5.6 CUT (Josh 2026-11-01, "Cut the kit as 1.5.6 and push it"): the eight doors as 1.5.6 — kit commit cdf20ae, tag v1.5.6, branch kit-1.5.6 on
     github.com/magic-commons/mir. A new door continues from 1.5.7-alpha.1. */
  '1.5.6': 'de0ac92dda7ab61901efb41c0e6aa4a81b972e60398d769c2ff780b3a344a6c3',
  /* 036 K1 · MIR 1.5.7-alpha.1 THE STROKE (the clone road from the 1.5.6 cut, kit-032 @ c986c99): --ctl-stroke multiplies every control ring's alpha; the relief's soft halo again */
  '1.5.7-alpha.1': '68fc7a6017fd9fbdab624ba86ca73ef7b325eece8c34dcb3705e05285e0998ff',
  /* 036 K2 · MIR 1.5.7-alpha.2 THE UI SCALE (kit-032 @ aee0bd6): --ui-zoom on the UI roots, core/zoom.js and the geometry pass; the stage untouched */
  '1.5.7-alpha.2': '42af8b05502d9164764111f1ad9e4e7741655e9c4d8de967b42e04ef19a9f1ee',
  /* 036 K3 · MIR 1.5.7-alpha.3 THE TEMPO EDITOR BOX (kit-032 @ 1d07748): the field is its button box, the pill format and size */
  '1.5.7-alpha.3': 'b7884739ef17bc5550b85f8f6776d93cd884ea554c8e2ecedcfc21e86d57a5f7',
  /* 036 K4 · MIR 1.5.7-alpha.4 THE MORE MENU APP ROWS (kit-032 @ 2ec7dbb): installTimeline({ moreRows }) */
  '1.5.7-alpha.4': '5e98e31a3b1e3bdf2e97e55d231b033f277895700d888ad39c14a97fd295d878',
  /* 036 K5 · MIR 1.5.7-alpha.5 THE FIELDS OWN WORDS (kit-032 @ a3dcb80): FOLDERS placeholders and proposeName false */
  '1.5.7-alpha.5': 'b3ca138d0e87bdf20bb30b46fd9c2a7a77e09a8718ba8012f7e18250b1d81f6a',
  /* 037 H2 · MIR 1.5.7-alpha.6 THE REVERSED DIAL (kit-037 @ fcc4789, from kit-032's a3dcb80): a descriptor's and a camera port range's reverse reach knob() */
  '1.5.7-alpha.6': 'ba2858e350806fd75f029e2a4e9108227ac7126fc7173023563c8569709bbae2',
  /* 037 H5 · MIR 1.5.7-alpha.7 THE SPHERE TAKES A PLANE (kit-037 @ e377982): directionSphere({ plane }) — CLIP's plane on the camera's sphere */
  '1.5.7-alpha.7': 'e96b2fd75c2366682928665e0e5662bc6d5c282c20cdd7c4622853804368fc89',
  /* 038 T1 · MIR 1.5.7-alpha.8 THE EMPTY TIMELINE RESTS (kit-038 @ 9dcbadb, from kit-037's e377982): no clip → the loop is bar 1; a play past the end comes home; → TL at the bar's start */
  '1.5.7-alpha.8': 'a8193b7fbc365360b622d12ca9c8a11c4a4109f3fb7afc0d55b316c7fd36ec97',
  /* 038 T3 · MIR 1.5.7-alpha.9 THE TIMELINE SCROLLS UNDER THE POINTER (kit-038 @ 7ebc9b0): a plain wheel scrolls time; a drag held at an edge scrolls it */
  '1.5.7-alpha.9': '3ba2319d7b80881dc304b1bea944053a48ac337ad10c0a8f4a28f72b43f8b763',
  /* 038 T4 · MIR 1.5.7-alpha.10 THE MEASURE IS THE LEAST LOOP (kit-038 @ 5cd7439): → TL sends an LFO faster than a bar as ⌈bar / period⌉ whole cycles */
  '1.5.7-alpha.10': '3a8b15fee08044b50f35605a1504b840d4a23ff7ad21028103341f4afbb1d56e',
  /* 038 T5 · MIR 1.5.7-alpha.11 THE SELECTION RESIZES TOGETHER (kit-038 @ 1f01c88): an edge on a selected clip trims every selected clip, or glues then stretches them */
  '1.5.7-alpha.11': '2bc556b4f46bf9bdac9c16bb022c6f137282f14468b76effebbb01c338642f4c',
  /* 038 T6 · MIR 1.5.7-alpha.12 THE RING FOLLOWS THE DIAL (kit-038 @ 8836838): a reversed knob wears k-rev and the route ring mirrors with its needle */
  '1.5.7-alpha.12': '360fb20beff92804d633d28927d9c858a77e431fc34805208c29690f3b404f06',
  /* 038 K3 · MIR 1.5.7-alpha.13 THE PAD WRAPS (kit-038 @ 25e0836, on chain T's alpha.8–12): xyPad({ wrap: 'plane' | 'sphere' }), createCameraView({ panWrap }) */
  '1.5.7-alpha.13': 'cf06ef67fd087b44be639585f6cab73f779e05717388625b64e0f8ac6c725333',
  /* 038 T8 · MIR 1.5.7-alpha.14 THE PUMP WAITS FOR A DRAG (kit-038 @ eeb8f7c, on chain K's alpha.13 25e0836 — this adoption carries THE PAD WRAPS' kit
     files too; K's own alpha.13 row and app side merge beside it): the edge pump waits for a real drag, a scrub's head stays in the lanes, → TL's hint, the loop's words */
  '1.5.7-alpha.14': '3e9e0561e665d8ff69be238223adc873467265499664ed409a60f25a0b512872',
  /* 038 P1 · MIR 1.5.7-alpha.15 THE ARC WEARS A GRADIENT (kit-038 @ d37162a, on T8's alpha.14 eeb8f7c): arcRing({ stops }) — a gradient track and a thumb;
     control({ stops }) on a finite range is an arc */
  '1.5.7-alpha.15': 'd6478e9112b46698c0eed1a244f346a376822cdd5ee9e7b7079d7259a9a4b8bf',
  /* 038 N8 · MIR 1.5.7-alpha.16 THE MENU PANE KEEPS ITS FLOOR (kit-038 @ eddd2b6, on chain P's alpha.15 d37162a — this adoption carries THE ARC WEARS A
     GRADIENT's kit files too; P's own alpha.15 row and app side merge beside it): the menu floor and the bar's list floor outweigh FROST's dark veil */
  '1.5.7-alpha.16': '084779bf81107c9968080e760926c30db62d29c0041a30c74d92c094ef1278d9',
  /* 039 K1 · MIR 1.5.7-alpha.17 THE STEPPED CLOCK LOOPS (kit-039 @ b415b77, from kit-038's eddd2b6): clock.step(dt, { loop: true }) wraps as the
     realtime pump does; the recorder keeps the unlooped step */
  '1.5.7-alpha.17': '8ff1ef8c8dcfa662d11b0a3281f7ac108afe7898a32e229974b22a2001682e6c',
  /* 039 K2 · MIR 1.5.7-alpha.18 THE ROOT WEARS THE HINT (kit-039 @ d8e5701): seg({ title }) and stepper({ title }) hint their root */
  '1.5.7-alpha.18': '094a93a051a31ea903d6fea7b13c8b049b19b359a7f51e9c03f85650a241eb0c',
  /* 039 K3 · MIR 1.5.7-alpha.19 THE FIT ROW KEEPS ITS CELLS (kit-039 @ b1942e8): row({ fit: true, seg: 1 }) — a seg takes one cell in that row */
  '1.5.7-alpha.19': '9da2d21097bac38a0ab50dda78801780077587ec82737c02a6700acf97ed7290',
  /* 039 K4 · MIR 1.5.7-alpha.20 THE POWER WORD PASSES THROUGH (kit-039 @ 8a4c2d5): installTimeline({ transport: { powerWord } }) → the work bar's power seat */
  '1.5.7-alpha.20': '32eb37eae01196c6bfd2c03531570fa1770159de66c696296429675842dce31c',
  /* 039 K6 · MIR 1.5.7-alpha.21 THE HINT CLEARS THE ROW (kit-039 @ 0104a0b): a window head's hint goes above the bar, else beside the bar (control-help.js
     hintSpot); the number planned for A TARGET HAS ONE AUTOMATION, which waits on a ruling (docs/FOR-MIR.md § 039) */
  '1.5.7-alpha.21': 'e7b50ad0353d4d000caf9f151fbd04373a9c0fe84adb6b12c9ef3c55a8387649',
  /* 039 K7 · MIR 1.5.7-alpha.22 THE CARD SAYS HOW IT OPENS (kit-039 @ 42e8d20): a card's hint says a second tap opens it; createFolders({ captions })
     names every card beneath its picture (λWAVES: lab/projects.js) */
  '1.5.7-alpha.22': 'eb64ebbc0393a86f33bed9e2daa63edad29fd6a67d37cea976228115cdb758f4',
  /* 039 K8 · MIR 1.5.7-alpha.23 THE EMPTY LANE SAYS HOW (kit-039 @ 247d5ec): an empty timeline's one line on how a clip arrives, an empty lane's
     hint says it (timeline/view.js); nothing app-side */
  '1.5.7-alpha.23': '95d138a95e3063d70266b73466f56ca6ce33c2abcf756610b79963c89595d500',
  /* 039 K9 · MIR 1.5.7-alpha.24 THE NAMED CARD KEEPS ITS HEIGHT (kit-039 @ e061205): with captions the card's picture is 16 : 10, so FOLDERS at
     1000 × 700 no longer scrolls; λWAVES: the MAIN MENU page's reserve reads --sv-shot-k (skin.css, picker.js) */
  '1.5.7-alpha.24': '0a2bbd180ecd8ca79e0c3ca952026d932f29133c432ad5d8e674c0523b877cdd',
  /* 039 F1 · MIR 1.5.7-alpha.25 THE EMPTY LINE SITS UNDER THE RULER (kit-039 @ 77ece05): the empty timeline's line at the lanes' top, off the bar's
     band at 1000 × 700 (timeline/timeline.css); nothing app-side */
  '1.5.7-alpha.25': 'e2f7c482914a4c983c113127827ae0845f114064b3c853d493e48cff59fd60af',
  /* 039 F1 · MIR 1.5.7-alpha.26 THE FOLDER ROW KEEPS ITS SEAT (kit-039 @ 3086c0b): a paged gallery draws its first page's folder row on every page
     (hidden seats), so the page buttons never move; λWAVES: the MAIN MENU page fits its rows to the chrome that is there (picker.js, skin.css) */
  '1.5.7-alpha.26': '017a7bafc19f3111cee3daa49f2db703abe1ec73c3ce65415fb65a31c0595cfa',
  /* 040 T + C · MIR 1.5.7-alpha.48 (kit-040 @ a0e32f5: T alpha.38–45 THE TIMELINE'S HANDS, C alpha.46–48 THE CONTROLS; Focus's 27–37 live on the kit's `focus` branch, not here) */
  '1.5.7-alpha.48': '65b230cf3401a28d7efe405fa398c68669d601d6e41e2318feddea8b34fb0f9b',
  /* 041 T + W · MIR 1.5.7-alpha.63 (kit-041: T alpha.49–51 THE TIMELINE'S MODES, W alpha.54–63 THE WINDOWS AND THE OPTIONS; 52 and 53 unused; Focus's 27–37 still on `focus`) */
  '1.5.7-alpha.63': '43da45d0a176b2797fcdd7ac1e475e977b1d8e8735c06f91af91d6bff68619d5',
  /* 041 K · MIR 1.5.7-alpha.67 (kit-041-sos @ 448e3ec: 64 THE SCALE REACHES TIMELINE, MODULATION AND PATTERN, 65 THE DOCK CHIP'S GLYPHS ARE THE APP'S TO NAME, 66 A LEAVING BLOCK TAKES NO SEAT, 67 THE FINDER HAS SECTIONS) */
  '1.5.7-alpha.67': '2d5030cfbda09940be3a5339f1f1546da02f6f48f6a2a895684172e655d2a4c7',
  /* 041 the fresh eyes' row · MIR 1.5.7-alpha.68 A SCALED WINDOW KEEPS TO THE SCREEN (kit-041-sos @ 24cd015: scaledRoom caps TIMELINE's height above 100 pct UI SCALE, a rail measures in own px, PATTERN's seat stays on the screen) */
  '1.5.7-alpha.68': '798a5a1490816a6a530df04b2a9e3bb27936b5dd1c7722eaeaea178fac84d678',
  /* 043 M · MIR 1.5.7-alpha.71 (kit-043-sos @ bf9cf2a: 69 THE RAMP'S HANDLES DIE WITH THEM, 70 A DROPPED RING TAKES ITS LISTENERS, 71 THE RACK'S MOTION DOES NOT CHASE ITS OWN BAR; the soak's three, no door) */
  '1.5.7-alpha.71': '6f2d3d4febb46e8a447b8e5e88fad2089287e42dccefa995f8aafc188c448c5e',
  /* 044 · MIR 1.6.0-alpha.1 MAIN IS LINE 1.6 (kit main @ 9cb3acc: the bytes of 1.5.7-alpha.71 under the new number; Josh 11-12: main numbers its own alpha series, Focus is its own line) */
  '1.6.0-alpha.1': 'b7d5b529f873785fd65b4f90276bdaed2fb4258c8d1297789eee3cbf06984432',
  /* 044 K1 · MIR 1.6.0-alpha.2 THE RING'S DOUBLE PRESS GOES HOME, THE RIGHT CLICK REMOVES (kit-044k @ 9276406: modulation/window.js wireRing; Josh 11-12) */
  '1.6.0-alpha.2': 'ce24d953348f8bd75eedc94565bd4733119774c6e605c98f20928a220713c054',
  /* 044 K2 · MIR 1.6.0-alpha.3 THE WHEEL WAITS FOR A CLICK (kit-044k @ b67aa3e: kit.js wheelTurn · WHEEL · wheelNotches; the knob, the fader, the range, the tempo field, AUDIO IN's range; Josh 11-12) */
  '1.6.0-alpha.3': 'b723800ebf5cdb47f276b8b098ab8597189c569b9f041a40d46b90cced29c7b1',
  /* 044 K3 · MIR 1.6.0-alpha.4 THE HOLD IS 550 (kit-044k @ 15f69ab: core/tap.js TAP.hold 550 · slop 8, read by the rack head, the rail, the bar, INFORMATIONAL, the XY corner, the route pop-over and the arc, the timeline's knob menu; lanes PEEK_MS 250; Josh 11-12) */
  '1.6.0-alpha.4': '10b1c4d103db9ec72d27dc5d9a95971f5633fee50990be9f05ce12da79aa494f',
  /* 044 K1 · MIR 1.6.0-alpha.7 THE SECURITY THREE (kit-044s @ c347c98: alpha.5 shell/notebook-render.js notebookImage — a note's IMG is this origin's or data:image/, no referrer, lazy; alpha.6 folders/files.js thumbOf · entryOk — a stored picture is data:image/ or ''; alpha.7 core/session.js resume() — an unreadable record is failed ['record'], kept as <key>.failed, unarmed; λWAVES 028 R-09 R-24 R-12) */
  '1.6.0-alpha.7': '51ef200732261cb92ce2426843063660083f74d837ba751e82b0a9d9f976a5c9',
  /* 044 K2 · MIR 1.6.0-alpha.13 THE KIT'S CSS AND TOKENS (kit-044c @ e58b378: alpha.8 --fs-mid 12px · --fs-large 14px, var(--touch, 44px) ×18; alpha.9 THE FINDER's --wp-row-r and four durations, primitives read bare; alpha.10 the plugins' equal motion names alias the house's; alpha.11 --z-top 10000, --z-rack and --z-toast read first; alpha.12 four raw focus rings read --state-focus; alpha.13 .pt-menu and twelve unread tokens gone; an EMPTY computed-style diff of the app before and after) */
  '1.6.0-alpha.13': '93f095b9ead7ea61e895005e108dd13ba9b3cfb57fa1767d62026f5d1efa0ec8',
  /* 044 R · MIR 1.6.0-alpha.17 JOSH'S RULINGS OF 11-13 (kit-044r @ 8a65610: alpha.14 ONE CONTROL MENU — shell/menubar.js controlMenu · CONTROL_MENU, COPY VALUE, a fader's value door; alpha.15 THE SHORTCUTS' COLUMN IS MIR'S — timeline/shortcuts.js and the ten packs; alpha.16 KATEX IS CURRENT — shell/vendor/katex 0.19.1, sha-512 verified against the registry and the GitHub release; alpha.17 MAGIC COMMONS EVERYWHERE — ABOUT's default credits line) */
  '1.6.0-alpha.17': '01e085540e5a79ae19de33555d7ac8a87864ab6aa0a21e38c6b91661e2697f8b',
  /* 044 R1 · MIR 1.6.0-alpha.18 THE FADER'S RIGHT BUTTON IS THE MENU'S (kit-044r @ 75d1fd6: kit.js fader — a drag begins on the primary button alone, so the right-click that opens the control menu leaves the value) */
  '1.6.0-alpha.18': '544bcb6e8bb9d1a09a303c4d26265fa7ee6452e6cb07b028a2d1778894b70853',
  /* 044 K3 + K4 · MIR 1.6.0-alpha.34 THE CONTROLS AND THE RACK (the kit's main @ 294ca0b, K3's and K4's branches joined: alpha.19 ONE DOUBLE PRESS, ONE HOME · alpha.20 THE KNOB AND THE FADER TAKE THE ABORT · alpha.21 THE KEYS AGREE · alpha.22 NO CONTROL KEEPS THE LAW AS A NUMBER · alpha.23 ONE SPELLING ON EVERY BUILDER · alpha.24 ARCS ARE COLOUR, AND SIX FIT IN TWO ROWS · alpha.25 THE CARD IS BORN CLOSED · alpha.26 ONE DOOR FOR A CARD'S OWN HEAD BUTTONS + THE VALUE DOOR; alpha.27 THE FLOOR IS THE RESIZER'S, EMPTY GLASS IS A HANDLE BY DEFAULT · alpha.28 A WINDOW OPENS CLEAR · alpha.29 THE POWER HAS A VERB AND AN EVENT · alpha.30 A CARD SAYS ITS KIND AND ITS FIRST FOLD · alpha.31 THE HEAD BUTTONS KEEP THEIR SEATS, A CARD DECLARES ITS WINDOW · alpha.32 ONE LAW TO MOVE A WINDOW BY KEYS, THE HEAD'S DOUBLE PRESS IS THE ONE TAP · alpha.33 A RAIL KEEPS ITS SIDE; and the fix row alpha.34 THE CURVES' PRESET STAYS A STEPPER, kit-044k4 @ c890656, one commit over that main: panels/curves.js `ordered: true`, found by this adoption's `curves` and `new-project` suites) */
  '1.6.0-alpha.34': '4364a358239a9bed21b41944cb6fb72ccb933f77963ca1e9720b5394fd0fc5a0',
  /* 044 KV1 + KV2 · MIR 1.6.0-alpha.56 (kit main: KV1 alpha.35–42 THE FACES — one head scale 38, the clean body, light headings, the small corner 6, one disabled fade, a press shrinks, one ring, the stronger ground; KV2 alpha.43–56 THE PANES AND THE LISTS — corners follow CORNERS, the accent scrollbar, the wash, menu rows, the popup row, keycaps, the fields, the FINDER's matcher and Escape, the walks, the Escape stack, one edge) */
  '1.6.0-alpha.56': 'eefb315f3dfe9ac6696d206227917b9ed512f21e52f73aa7b95ef99408d3672a',
  /* 044 K5 · MIR 1.6.0-alpha.63 MODULATION AND THE RAILS (kit main @ cb57891: alpha.57 THE KIT HOLDS NO APP'S CATALOGUE · 58 THE KIT'S NAMES ARE THE KIT'S · 59 THE WINDOW'S DIALS READ THE ONE KNOB LAW · 60 ONE RING AND ONE PRESS IN THE PLUGIN · 61 THE CURVE TAKES THE KEYS · 62 THE CHOOSERS ARE THE KIT'S LIST · 63 THE RAIL CHIP'S SIZE IS WRITTEN ONCE) */
  '1.6.0-alpha.63': '4fc94999790205614736790ad5b6ebc3cdca9b37c89c872009f70cdc58d1a0c1',
  /* 044 K6 · MIR 1.6.0-alpha.73 THE TIMELINE, THE BAR AND FOLDERS (kit main @ f113cd9: alpha.64 A LIST THAT FITS DOES NOT SCROLL · 65 THE CLIP'S DOUBLE PRESS IS TAP · 66 THE TIMELINE'S MENUS ARE THE KIT'S · 67 THE TIMELINE'S ESCAPE IS THE ONE STACK'S · 68 THE ONE SCROLLBAR · 69 THE CSB IS THE KIT'S · 70 FOLDERS · 71 HISTORY HAS A TITLE BAR · 72 THE POINTER GLOW IS STRONGER · 73 THE CAMERA'S DIALS ARE KNOBS) */
  '1.6.0-alpha.73': 'aa058eb6211609263b647f5b3322bc7481f95716dae156dad4696411a42e9b90',
  /* 021 R1 · the first door on the clone road: MIR 1.5.6-alpha.1 (kit commit 7f052d5bd1e2 — a failed resume never arms, core/session.js) */
  '1.5.6-alpha.1': '753de766e65104997d49e8f5f2e8b472f2e6943be81a01f592116b94e4799c82',
  /* 021 I2/I3 · MIR 1.5.6-alpha.2 on the clone road: the keyboard window's panels, MORE KEYS, media keys, RESERVED_BY_BROWSER, the event maps,
     the MIDI door (kit d798ebc + cbd721f), and I3's menubar submenus, checks, radios and glyphs (kit ace143d, dd7f48c, 92674bc) */
  '1.5.6-alpha.2': '4db1788a7fcc489668155216c9bc50fe1c2d75e3e5ce14d45550c43fcfcfacf9',
  /* 021 V1 · MIR 1.5.6-alpha.3 on the clone road (kit 67dcbfc + 7da3c09): registerGlyphs, windowGlyphs, glyph on createWindow / device / trig, windows() hidden,
     the tall-window clamp, fitFree places again, .k-lbl's ellipsis */
  '1.5.6-alpha.3': '17b45f4a38478e05b69998e209ed8d0a2eabc0bd6ed187b92b382e8fbe2b2bc7',
  /* 022 P1 · MIR 1.5.6-alpha.4 on the clone road (kit 4654cb8, 0d98cc8): contextMenu, holdTap / onContext (TAP.hold · TAP.slop), ONE KNOB MENU, --surface-menu-floor,
     the kit's popups on the menu surface, a list row's picture */
  '1.5.6-alpha.4': '2e2ddd2a07c4c6a4eed431c2d5e914a7ea35ff8c8ca550c1ffedd132b6393f39',   // 022 P3 re-pin (kit 0d98cc8: select's repick, a list row's picture)
  /* 022 S1 · MIR 1.5.6-alpha.5 on the clone road (kit 3e6f5cc): RELIEF IS TIGHT (a 1–2 px raise, a grey dark highlight, the shine a hairline,
     SHINE SOFT 0–6, the light lift ≤ 45 %) and THE MENU'S INK (--surface-menu-tint, --surface-menu-edge; the floor on the menubar lists and the hint) */
  '1.5.6-alpha.5': 'b208cdbf993e49fe208d768f7931bdc20d4bf5071de1a9e6031dab7333fe6592',
  /* 022 F1 · MIR 1.5.6-alpha.6 on the clone road (kit 19c89e3, 6a8cd78): THE FIT ROW (.row.fit, row(parent, { fit, cellMin, knob, cls })) and its tokens
     --cell-min --knob-min --knob --knob-max --row-gap */
  '1.5.6-alpha.6': 'f0189191f314c0429f942704403e4c07d1299c1370f3c426f93a688fcb83e4cc',   // 022 F2 re-pin (kit 6a8cd78: the cells stretch, a stretched switch centres its words)
  /* 022 C1 · MIR 1.5.6-alpha.7 on the clone road (kit eef6443): THE SURFACE PARTS (section · knobBank · meter · lamp), one meter in the modulation
     window, macroRail({ face: 'knob' }) · macroKnob, the well and section inner surfaces, --xport-well --xport-section --xport-grid --xport-led(-off) */
  '1.5.6-alpha.7': '59d60b70070060b8b476959944c9839e1c1a34ad5946260be92a5f872daaf38f',   // 022 C2 re-pin (kit a547da5: a face's span, the asked page, values at rest, the one-line foot)
  /* 022 E1 · MIR 1.5.6-alpha.8 on the clone road (kit d5d8149): EVERY DISABLED CONTROL KEEPS ITS HINT (a greyed knob, fader, switch or trigger takes
     the pointer on its root and refuses the press) and FROST is TEXT AUTO (call 14: black ink in light, white in dark as before) */
  '1.5.6-alpha.8': '47c7c8e4108589a1eb91085486ea6634c0f4b8ca0b2aed5ff106378c8ff35801',
  /* 023 D · MIR 1.5.6-alpha.9 on the clone road (kit e826ec2 · 1f094a5 · e4d00e4 · dfd71cb · 3c24473 · 3ce9bc2): BEHIND IS DOTTED (camera sphere and plane model),
     THE FACE TABS WEAR GLYPHS (a keyboard face's icon, the kit glyph keys), THE CHIPS' MOTION (the modulation rail), ONE NOTCH IS ONE BPM (wheelNotches) */
  '1.5.6-alpha.9': 'ee57f02e34595e6199c9b2c9583962537add9f31e0579b280f940d469eb6dc69',   // D4 re-pin (kit 3ce9bc2: the wheel is bindTempoField's, the modulation window's own tempo too)
  /* 023 B1 · MIR 1.5.6-alpha.10 on the clone road (kit 0272f11): THE PILLS ON CALL (createRackPills().show(), rack.showPills() — λWAVES' EXPAND ALL) */
  '1.5.6-alpha.10': '16b410f1039f9795ee18f2365aca0aa109743bc9e5c22241efda442dade055c8',
  /* 023 R7 · MIR 1.5.6-alpha.11 on the clone road (kit c18957a): THE WORDS LAND (viewChanged({ land: true }) — the stage words' re-seat lands at once) */
  '1.5.6-alpha.11': 'fe6f4b26077f40194675d7d6d0920d13a3f966507826d8b747c33b88b785c6ea',
  /* 025 A1 · MIR 1.5.6-alpha.12 on the clone road (kit 6b3c933): THE AUDIO TRACK IN THE MUXER (mp4Parts({ audio }): mp4a+esds or Opus+dOps, elst + roll, interleaved chunks) */
  '1.5.6-alpha.12': '0ba21c6108c34fdd540251567ec7c128c6dba7670a9c8552fc49df2eacf2df20',
  /* 025 A2 · MIR 1.5.6-alpha.13 on the clone road: THE MIXDOWN (render/audio-mix.js: mixPlan, mixdown at 48 kHz offline, wavBytes) */
  '1.5.6-alpha.13': 'a0d21aaa63bee654f8cdb359a679892c7f30776df0a7d77e128835ab52541222',
  /* 025 A3 · MIR 1.5.6-alpha.14 on the clone road: THE AUDIO ENCODE (AAC → Opus ladder, the priming measured, store.saveAudio, run({ audio }), PNG audio.wav) */
  '1.5.6-alpha.14': 'f612c7c9eda4ff9a19362cf69ae9b74683335862ccc77f4cf57f7ae6c677dc71',
  /* 025 A4 · MIR 1.5.6-alpha.15 on the clone road: THE AUDIO ROW (the render panel's AUDIO ON · OFF, the estimate names the clips and the codec, the live-microphone refusal said so) */
  '1.5.6-alpha.15': 'b0571eea857a7ef633cc7b9a204802a32cabd46352dd9b54e079f7f114d2a83f',
  /* 025 A5 · MIR 1.5.6-alpha.16 on the clone road: THE ALIGNMENT PROOF (selftest audioAlignment: clicks at beats 0·1·2 within one sample of their frames) */
  '1.5.6-alpha.16': '3908370e824e5a44eb68691c11f6460c907ea50e905d544bb9f1a7a2112f8800',
  /* 025 C3 · MIR 1.5.6-alpha.17 on the clone road: THE EVEN ROWS (the render panel's `even` · `ranges` · `controls.switches`) */
  '1.5.6-alpha.17': 'd4bc54b78ed65730c29f527040f077525e3b440745ee384740b33fb5b4027009',
  /* 029 M2 · M3 · M1 · MIR 1.5.6-alpha.18–.20 on the clone road: A TEXT WRITE KEEPS ITS NODE (setText → characterData), THE MODULATION WINDOW
     WRITES ONLY WHAT CHANGED, THE STAGE RE-INKS ONE MARK (accent.paintInk); adopted once, at .20 */
  '1.5.6-alpha.20': '3f1940761b40e84cf9d6afc19f5166a5469ae3d5d501cf7710b15f26101d78bf',
  '1.4.3': 'a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23',
  /* 0.5.0 C0 · R5-G1: λWAVES was PINNED to MIR 1.5.0-alpha.24 (kit commit 1b7ae99b9905, line 1.5), adopted by the 1.5 worktree's own
     tools/adopt.mjs */
  '1.5.0-alpha.24': '3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351' };
const manifestBytes = readFileSync(path.join(root, 'MIR-MANIFEST.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
assert.equal(manifest.kit, 'MIR');
/* 0.5.0 A10 · the canary's red 3: a 1.5 adoption names a pre-release ("1.5.0-alpha.24") and its LINE ("line": "1.5", MIR
   docs/LINES.md).  The shape widens; the pin below does not — a version is accepted only with its manifest's sha-256 in ACCEPTED. */
assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?$/);
if (Object.hasOwn(manifest, 'line')) assert.equal(manifest.line, manifest.version.split('.').slice(0, 2).join('.'), 'MIR-MANIFEST.json: "line" must be its own version\'s major.minor');
const manifestSha = createHash('sha256').update(manifestBytes).digest('hex');
assert.ok(Object.hasOwn(ACCEPTED, manifest.version), 'MIR-MANIFEST.json names MIR ' + manifest.version + ', which is not an accepted adoption (accepted: ' + Object.keys(ACCEPTED).join(', ') + '). A real adoption is a two-file edit: the manifest MIR\'s tools/adopt.mjs writes, and its sha-256 pinned in ACCEPTED in tests/mir-manifest.test.mjs.');
assert.equal(manifestSha, ACCEPTED[manifest.version], 'MIR-MANIFEST.json for MIR ' + manifest.version + ' has sha-256 ' + manifestSha + ', not the pinned ' + ACCEPTED[manifest.version] + '. The manifest was edited without re-adoption; a real adoption is a two-file edit: the manifest MIR\'s tools/adopt.mjs writes, and its pin in ACCEPTED.');
assert.ok(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files));
/* 021 K4: the kit has one version — the adopted tokens.json names the same kit the manifest does (MIR tests/version.node.mjs holds it at home) */
assert.equal(JSON.parse(readFileSync(path.join(root, 'lab/mir/tokens.json'), 'utf8')).kit, manifest.version, 'lab/mir/tokens.json "kit" is not the adopted MIR version');

function inventory(relative) {
  return readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap(entry => {
    const name = relative + '/' + entry.name;
    if (entry.isDirectory()) return inventory(name);
    assert.ok(entry.isFile(), 'adopted assets must be regular files: ' + name);
    return [name];
  });
}
const files = ['lab/mir', 'lab/fonts'].flatMap(inventory).sort();
assert.deepEqual(Object.keys(manifest.files).sort(), files,
  'MIR inventory must cover every adopted file, with no missing or stale entries');
for (const file of files) {
  assert.match(manifest.files[file], /^[a-f0-9]{16}$/, 'invalid content hash: ' + file);
  const actual = createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex').slice(0, 16);
  assert.equal(actual, manifest.files[file], 'MIR bytes changed without re-adoption: ' + file);
}
console.log(`PASS MIR ${manifest.version}: all ${files.length} adopted files match the committed manifest, and the manifest is the pinned one (sha-256 ${manifestSha.slice(0, 12)}…)`);
