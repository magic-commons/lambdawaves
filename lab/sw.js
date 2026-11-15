/* sw.js — λWAVES OFFLINE.  The whole lab is local, so the whole lab is precached and the network is never
 * needed again.  Registered by index.html at ./sw.js, so the scope is WHEREVER THE LAB IS SERVED FROM —
 * /lab/ on ./serve.sh, and THE WHOLE ORIGIN at lambdawaves.magic-commons.com, which is the address this
 * app now ships at.  That sentence used to end "so the scope is /lab/ and nothing above it is ours", and
 * §5 enforced it with `startsWith(SCOPE)` — a refusal that refuses NOTHING when SCOPE is "/".  See §5.
 *
 * ── THE ONE LAW ────────────────────────────────────────────────────────────────────────────────────────
 * A NEW BUILD IS NEVER SWAPPED IN UNDER A RUNNING SESSION.  This lab holds unsaved state — a prepared
 * superposition, a notebook page, a layout — and half of an old build talking to half of a new one is the
 * worst failure a cache can cause.  So: no skipWaiting() on install, no clients.claim() ever.  A new worker
 * precaches itself and then WAITS; the old worker keeps serving every byte of the build the session started
 * on until the last tab of that session closes.  The UI is told a build is ready (§5); an untouched session
 * takes it (main.js, rack.js `untouched`), and any other session's USER decides.  skipWaiting() re-points EVERY
 * window in scope, not only the one that asked, so every take counts the windows and, with a second one open,
 * is refused until the user presses UPDATE ALL — consent given for all of them (§6).
 * The price is honest and small: the very first visit runs uncontrolled, so offline works from the SECOND
 * launch onward.  We pay it rather than swap assets under a page that is already running.
 *
 * ── ANTI-PATTERN 6 (docs/ui/ANTI-PATTERNS.md: "a hand-written version in the UI") ──────────────────────
 * There is NO version number here.  §1 is a generated list of [url, content hash]; §2 derives the cache
 * name from those hashes alone.  Change one byte of one file and the hash changes, the cache name changes,
 * and the old cache is collected.  Change nothing and the name is bit-identical — no churn, no stale
 * constant to forget.  A hand-edited `const VERSION` would have gone stale on the first wave that forgot it.
 *
 * ── REGENERATING §1 ────────────────────────────────────────────────────────────────────────────────────
 * `node tests/pwa.test.mjs` walks lab/ itself, re-hashes every file, and FAILS if §1 has a missing entry, a
 * stale entry, or a wrong hash.  `node tests/pwa.test.mjs --write` REWRITES §1 from the directory and then
 * proves the result, so the whole refresh procedure after a wave that touched lab/ is that one command.
 * Without --write it only prints the corrected block, so a gate still fails instead of silently repairing.
 */
'use strict';

/* ── 1. THE PRECACHE — every file under lab/ that the running lab actually loads ────────────────────────
 * [url relative to this worker, first 12 hex of the file's sha-256].  GENERATED — see the header. */
const PRECACHE = [
  ['./ab-patch.js',                                                 '978460b97609'],
  ['./absorb.js',                                                   '3b0857195bfa'],
  ['./actions.js',                                                  '8d9b5afdf582'],
  ['./angular-nodes.js',                                            'a4c221d5dc48'],
  ['./atoms.js',                                                    'f994c1f42c5f'],
  ['./atomsview.js',                                                '3325dedbc43a'],
  ['./badges.js',                                                   'e7aa00f85caf'],
  ['./bessel.js',                                                   '0689408ac984'],
  ['./bloch-model.js',                                              'cd6fb3613241'],
  ['./bloch.js',                                                    '595fcca1e97a'],
  ['./build-id.js',                                                 '7e32c2ec84b2'],
  ['./build-line.js',                                               '065c5ca6e747'],
  ['./busy-mark.js',                                                '7a654bb48c65'],
  ['./calculus.js',                                                 '253e73518bcd'],
  ['./calculusview.js',                                             'c6f568009770'],
  ['./camera-law.js',                                               '959fe2d3152a'],
  ['./canon-gauge.js',                                              'caa967fd356c'],
  ['./capture.js',                                                  'e6d52e116331'],
  ['./catalogue.js',                                                '2318a16ded86'],
  ['./central.js',                                                  '1999f0b64e96'],
  ['./chemview.js',                                                 'd487bb1c3564'],
  ['./chord-audio.js',                                              'caf12e589643'],
  ['./clock.js',                                                    '35e6b0ac22aa'],
  ['./context-menus.js',                                            'a150dfb61e95'],
  ['./cornell.js',                                                  '6df7a2fdd2a1'],
  ['./csb-favs.js',                                                 'a1738c485338'],
  ['./csb-search.js',                                               '98b2e1dbceab'],
  ['./csb.css',                                                     '0706867347b2'],
  ['./density.js',                                                  '5f3c24eafbc5'],
  ['./dft-grid.js',                                                 '50babea01290'],
  ['./dynamics.js',                                                 '63ab56a5f232'],
  ['./edit-domain.js',                                              'f67311da8412'],
  ['./elements.js',                                                 '3fad3eb4c9ff'],
  ['./emission-map.js',                                             'd9673a588e16'],
  ['./emissionview.js',                                             '475572c006fb'],
  ['./eq-audio.js',                                                 '686716c5b301'],
  ['./equalizer.js',                                                'dd4a442671a6'],
  ['./export3d.js',                                                 'e239066523c5'],
  ['./field.js',                                                    'b266af080c9b'],
  ['./film-bake.js',                                                '41d5039ed9a8'],
  ['./film-card.js',                                                '1455a4345f5c'],
  ['./first-run.js',                                                '1ab99c66da0b'],
  ['./flash-law.js',                                                '8f23407a1752'],
  ['./flow-balance.js',                                             '796658f0227d'],
  ['./fold.js',                                                     '805f4beea243'],
  ['./fonts/LWTitle-title.woff2',                                   '8069abf19624'],
  ['./fonts/Roboto-OFL.txt',                                        '061402327a96'],
  ['./fonts/Roboto-ui.woff2',                                       '5cd6c496e9eb'],
  ['./fonts/STIXTwoMath-OFL.txt',                                   '0c8825913b60'],
  ['./fonts/STIXTwoMath-subset.woff2',                              'ace34bc7ff28'],
  ['./fonts/Spinwerad-OFL.txt',                                     '0c31d0af7f9a'],
  ['./fonts/info/AlegreyaSC-400-latin-ext.woff2',                   '1a7035f212b7'],
  ['./fonts/info/AlegreyaSC-400-latin.woff2',                       'dbdc9b83a7a5'],
  ['./fonts/info/AlegreyaSC-OFL.txt',                               'f6f60d5d4cf4'],
  ['./fonts/info/PlayfairDisplay-700-latin-ext.woff2',              'edb9f5d879b3'],
  ['./fonts/info/PlayfairDisplay-700-latin.woff2',                  '28453852ea16'],
  ['./fonts/info/PlayfairDisplay-700i-latin-ext.woff2',             '8af70f52c55b'],
  ['./fonts/info/PlayfairDisplay-700i-latin.woff2',                 'de2f4041e7ef'],
  ['./fonts/info/PlayfairDisplay-OFL.txt',                          '566be814f8e9'],
  ['./fonts/info/Spectral-400-latin-ext.woff2',                     'fc4b2566ccd9'],
  ['./fonts/info/Spectral-400-latin.woff2',                         'cf8daee3b83c'],
  ['./fonts/info/Spectral-400i-latin-ext.woff2',                    'f554218b51a0'],
  ['./fonts/info/Spectral-400i-latin.woff2',                        'db397149a9f7'],
  ['./fonts/info/Spectral-600-latin-ext.woff2',                     'dea6bd9ca650'],
  ['./fonts/info/Spectral-600-latin.woff2',                         '33faca8b5795'],
  ['./fonts/info/Spectral-600i-latin-ext.woff2',                    '4e3dee09ce15'],
  ['./fonts/info/Spectral-600i-latin.woff2',                        '2a3ef8cf75b8'],
  ['./fonts/info/Spectral-OFL.txt',                                 '501d6ceca8e5'],
  ['./frame-budget.js',                                             'd609c4fc6278'],
  ['./frame-coalescer.js',                                          '2488500d8bc5'],
  ['./frame-settle.js',                                             'a3b2724d2033'],
  ['./frontier.js',                                                 'c8eae401325f'],
  ['./gas.js',                                                      '8c1647b5c762'],
  ['./gpu-boot.js',                                                 '4378ba80ae70'],
  ['./h2ci.js',                                                     'ff3d789794a3'],
  ['./h2curve.js',                                                  '553be2126763'],
  ['./hamiltonian.js',                                              'fc00efe9610c'],
  ['./hydrogen.js',                                                 '4d5eb41a3a4d'],
  ['./icons.js',                                                    '2abccd86d6aa'],
  ['./img/ai/GoogleSansFlex-OFL.txt',                               '831b6e041705'],
  ['./img/ai/claude-mark.svg',                                      '9207cb2a421a'],
  ['./img/ai/claude-word-dark.svg',                                 '798f9a38dfae'],
  ['./img/ai/claude-word-light.svg',                                'e8b243a689c8'],
  ['./img/ai/gemini.svg',                                           'f56df33f86dc'],
  ['./img/ai/openai-blossom.svg',                                   '7ff26020109a'],
  ['./img/icon-192.png',                                            '7f335219b4d1'],
  ['./img/icon-512.png',                                            '6524e4958e20'],
  ['./img/icon-apple-180.png',                                      '50a76e1103a7'],
  ['./img/icon-maskable-192.png',                                   'c82a55f4af4f'],
  ['./img/icon-maskable-512.png',                                   '4e88ce96e33f'],
  ['./img/icon-maskable.svg',                                       '5695511bc1f4'],
  ['./img/icon.svg',                                                'e59093ac4a71'],
  ['./img/lambdawaves-logo.svg',                                    'fc49b1e62e10'],
  ['./img/mir-logo-dark.svg',                                       '7c8dfe83d50f'],
  ['./img/mir-logo-light.svg',                                      'f9d485d59c63'],
  ['./img/warning-sign.webp',                                       '65d3a6dd47a8'],
  ['./index.html',                                                  '2b8b8062fb6c'],
  ['./informational.js',                                            'e8f37af785f0'],
  ['./kepler.js',                                                   'f8fb43706f76'],
  ['./keplerview.js',                                               'b74b49489628'],
  ['./key-table.js',                                                '1770ba47beea'],
  ['./keymap.css',                                                  'e8e55e4e3b54'],
  ['./kick.js',                                                     '7b198422493f'],
  ['./lab.css',                                                     '0b535e44a929'],
  ['./ladder-model.js',                                             '69199febdca1'],
  ['./ladder.js',                                                   '95b2d7288202'],
  ['./latex-state.js',                                              '54219ca69abb'],
  ['./lattice-model.js',                                            '6d03af1255ca'],
  ['./lattice.js',                                                  '05477223675e'],
  ['./lebedev-302.js',                                              '11bef5009731'],
  ['./library.js',                                                  '66aefc46d61a'],
  ['./library.json',                                                '0a3531a7c866'],
  ['./light-window.js',                                             '9274ca431084'],
  ['./linalg.js',                                                   'da2367cdcb97'],
  ['./loader.js',                                                   '329e73f99df0'],
  ['./look.js',                                                     '04071bf4c60c'],
  ['./main.js',                                                     '0b1e15e078e4'],
  ['./manifest.webmanifest',                                        '3c7086f9dfa8'],
  ['./mapping.js',                                                  'fd92c71a6d69'],
  ['./mathworker.js',                                               '74eeb363a9be'],
  ['./md.js',                                                       '4a437fa3e8c0'],
  ['./meters.js',                                                   '6b5e2293fd6d'],
  ['./mir-gui.js',                                                  'c4891079941a'],
  ['./mir/control-help.js',                                         '45e0909a9166'],
  ['./mir/controls/arc.js',                                         '54aabe7886a3'],
  ['./mir/controls/colour-controls.css',                            '0a4ff19724bb'],
  ['./mir/controls/controls.css',                                   '214b8e420ee0'],
  ['./mir/controls/factory.js',                                     'bd06a7ea68b3'],
  ['./mir/controls/gesture.js',                                     '660287dbe42c'],
  ['./mir/controls/lane.js',                                        '5dfa91cc4fce'],
  ['./mir/controls/list.js',                                        'fbf2027372a2'],
  ['./mir/controls/number.js',                                      'ce8c6e0d796b'],
  ['./mir/controls/range.js',                                       '16afc4de9333'],
  ['./mir/controls/select.js',                                      'ca683f89b67a'],
  ['./mir/controls/stepper.js',                                     'bd31ee18c134'],
  ['./mir/controls/swatch.js',                                      '532acb8711f8'],
  ['./mir/controls/xy.js',                                          '29a6b88d62a8'],
  ['./mir/core/assets.js',                                          '35c233a29819'],
  ['./mir/core/core.css',                                           'fe920035d5b4'],
  ['./mir/core/describe.js',                                        'd9fdc1480365'],
  ['./mir/core/envelope.js',                                        'dc107c4b2901'],
  ['./mir/core/frame.js',                                           'cefb154de28e'],
  ['./mir/core/i18n.js',                                            'b125452dd71d'],
  ['./mir/core/intake.js',                                          '96139deffc33'],
  ['./mir/core/kbm.js',                                             '97f7ac5f4ff0'],
  ['./mir/core/look.js',                                            '77240d0c8e5c'],
  ['./mir/core/motion.js',                                          '9a5616b07bb7'],
  ['./mir/core/perf.js',                                            'ce3012692b21'],
  ['./mir/core/png.js',                                             '9e58e798b1a5'],
  ['./mir/core/pointer.js',                                         '903b29573313'],
  ['./mir/core/prefs.js',                                           '6c87ef54c41b'],
  ['./mir/core/project.js',                                         '7598a3e62edc'],
  ['./mir/core/proximity.js',                                       '2bcdbd691c69'],
  ['./mir/core/session.js',                                         'e3b6c504e6d7'],
  ['./mir/core/tap.js',                                             '210791d96244'],
  ['./mir/core/wakelock.js',                                        '460826e7310c'],
  ['./mir/core/zip.js',                                             '14a6b76c144c'],
  ['./mir/core/zoom.js',                                            '2f67c108f815'],
  ['./mir/css/base.css',                                            '0e3e8d9ea8e9'],
  ['./mir/css/skin.css',                                            'b1c9e5318e08'],
  ['./mir/css/tokens.css',                                          '9140c7dcd4d3'],
  ['./mir/folders/files.js',                                        '6b63d5d8a5d0'],
  ['./mir/folders/folders.css',                                     '4f9c6e17d831'],
  ['./mir/folders/folders.js',                                      'acdae84ca33c'],
  ['./mir/folders/gallery.js',                                      '246101634ba9'],
  ['./mir/folders/project.js',                                      'd10ebd3cc79f'],
  ['./mir/folders/save-blob.js',                                    'd9449adac322'],
  ['./mir/folders/seed.js',                                         '14d216632eaf'],
  ['./mir/folders/zip.js',                                          '3fdf0fc07223'],
  ['./mir/fx/fx.css',                                               '99a310fd819e'],
  ['./mir/fx/parallax.js',                                          '917181043f58'],
  ['./mir/fx/pointer-light.js',                                     'd374c3b49d82'],
  ['./mir/glyph.js',                                                'c3db68e0230f'],
  ['./mir/history/domains.js',                                      '20e80acd0cb2'],
  ['./mir/history/history.css',                                     'abfe9af6e771'],
  ['./mir/history/history.js',                                      '4ec5b905aa9f'],
  ['./mir/info/bodies.js',                                          'ed90b7735c5c'],
  ['./mir/info/faces.css',                                          'cd6a39e8a606'],
  ['./mir/info/info.css',                                           'eed45c8ec632'],
  ['./mir/info/layer.js',                                           '66761c3b5377'],
  ['./mir/info/leader.js',                                          'f37ce255f05c'],
  ['./mir/info/seats.js',                                           'b0f0ecdbd8f6'],
  ['./mir/keyboard/keyboard.css',                                   '24ba6d01308f'],
  ['./mir/keyboard/keyboard.js',                                    '9da2f570e5b5'],
  ['./mir/kit.js',                                                  '2334fcfc57b4'],
  ['./mir/locales/locales.css',                                     'cd2925eb7e5a'],
  ['./mir/locales/pseudo.js',                                       '152dbb0290ec'],
  ['./mir/mir.css',                                                 'ba4542bd7f58'],
  ['./mir/modulation/audio-capture.js',                             '5960299735f0'],
  ['./mir/modulation/bind.js',                                      'b13a5b0cc6b8'],
  ['./mir/modulation/curve-gesture.js',                             '6e28c520bb89'],
  ['./mir/modulation/curve.js',                                     'f5ccc9c84f11'],
  ['./mir/modulation/host.js',                                      '486cd1d51956'],
  ['./mir/modulation/layout-motion.js',                             '598ebe051632'],
  ['./mir/modulation/mod-cursor.js',                                '4984041d0263'],
  ['./mir/modulation/mod.js',                                       '8c7a02ad2c33'],
  ['./mir/modulation/modhost.css',                                  '5a79608c0a95'],
  ['./mir/modulation/modwindow/modwindow.css',                      '9dcd652b9198'],
  ['./mir/modulation/modwindow/modwindow.js',                       '11980fef3cc0'],
  ['./mir/modulation/project.js',                                   '39e2c203e3ed'],
  ['./mir/modulation/registry.js',                                  '21afa29220c1'],
  ['./mir/modulation/window.js',                                    '707b6b6ef02c'],
  ['./mir/notes/notes.css',                                         'ce8d11f50092'],
  ['./mir/notes/shelf.js',                                          '9c3d2bc9f67c'],
  ['./mir/palette.js',                                              '36dfda19e93d'],
  ['./mir/panels/camera-rig.js',                                    '6ab352e32434'],
  ['./mir/panels/camera.css',                                       '171273043ccd'],
  ['./mir/panels/camera.js',                                        'a1f013c2ba82'],
  ['./mir/panels/curves.css',                                       '22c3d24fb552'],
  ['./mir/panels/curves.js',                                        '6598263fe032'],
  ['./mir/panels/grade.css',                                        'da0334f1bdf9'],
  ['./mir/panels/lanes.css',                                        'f039f68d9930'],
  ['./mir/panels/picture-filter.js',                                'cbb24dae2c65'],
  ['./mir/panels/ramp.css',                                         '9dff67db7447'],
  ['./mir/panels/ramp.js',                                          '2c0cab7366af'],
  ['./mir/panels/xy.css',                                           '4b3f5226b680'],
  ['./mir/pattern/model.js',                                        'c3abd54fdd37'],
  ['./mir/pattern/pattern.css',                                     '79899a3a8549'],
  ['./mir/pattern/sequencer.js',                                    'fa438a588c02'],
  ['./mir/pattern/window.js',                                       '37763210bab6'],
  ['./mir/plane-model.js',                                          '6cddd5451649'],
  ['./mir/render/audio-mix.js',                                     'f097e98f7b11'],
  ['./mir/render/clock.js',                                         '523f12e590b1'],
  ['./mir/render/encoder.js',                                       'ff517f12abf3'],
  ['./mir/render/mp4.js',                                           '784f9a61e601'],
  ['./mir/render/panel.js',                                         '6ac5e67d4516'],
  ['./mir/render/plan.js',                                          'e1af78564bb3'],
  ['./mir/render/recorder.js',                                      'b43c2395ae7f'],
  ['./mir/render/render.css',                                       'f8120e60b227'],
  ['./mir/render/selftest.js',                                      '8802d166b548'],
  ['./mir/render/store-worker.js',                                  '2aa00d1055d0'],
  ['./mir/render/store.js',                                         'eb5e61beaeef'],
  ['./mir/shell/about.js',                                          '5de92bc46bb7'],
  ['./mir/shell/accent.js',                                         'e53189d403bd'],
  ['./mir/shell/assets/mir-dark.svg',                               '7c8dfe83d50f'],
  ['./mir/shell/assets/mir-light.svg',                              'f9d485d59c63'],
  ['./mir/shell/banner.css',                                        '570b1bc5e080'],
  ['./mir/shell/banner.js',                                         'fc41f10262dc'],
  ['./mir/shell/boot.js',                                           '66caee269095'],
  ['./mir/shell/busy.js',                                           '37c73f3b2c24'],
  ['./mir/shell/clipboard.js',                                      '85235a0f7f22'],
  ['./mir/shell/dialog.js',                                         'ccd3d4652f25'],
  ['./mir/shell/flash-guard.js',                                    'eb3facf99ecd'],
  ['./mir/shell/gui.css',                                           'dd8dc851b21e'],
  ['./mir/shell/gui.js',                                            '3224f6cf9991'],
  ['./mir/shell/keys.js',                                           '83f23ccf5a4a'],
  ['./mir/shell/menubar.js',                                        '4600ce2ab1e3'],
  ['./mir/shell/midi.js',                                           '668a2981eba1'],
  ['./mir/shell/notebook-math.js',                                  'fa1312541d4c'],
  ['./mir/shell/notebook-render.js',                                '2e4c9cbd4b80'],
  ['./mir/shell/notebook.js',                                       'ef2b9c03193e'],
  ['./mir/shell/notice.js',                                         '78be30f5ce23'],
  ['./mir/shell/opener.css',                                        '913e786e8ff5'],
  ['./mir/shell/pages.css',                                         '164525a125c7'],
  ['./mir/shell/pages.js',                                          'f7e821b4455a'],
  ['./mir/shell/parts.css',                                         '5187ae2a1fc8'],
  ['./mir/shell/rack-scrollbar.js',                                 '6b4949cea403'],
  ['./mir/shell/rack.css',                                          'bb94cb84263a'],
  ['./mir/shell/rack.js',                                           'ce3a3d6e4aed'],
  ['./mir/shell/scene-guard.js',                                    '0c41641e90c5'],
  ['./mir/shell/shell.css',                                         '57af4fa47da4'],
  ['./mir/shell/stage.css',                                         'db4a83037ab9'],
  ['./mir/shell/themes.js',                                         'f66ff91866a0'],
  ['./mir/shell/transport.css',                                     '1139e9998363'],
  ['./mir/shell/transport.js',                                      '030f9c2cd5c4'],
  ['./mir/shell/vendor/katex/LICENSE',                              '766ccc1f306c'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_AMS-Regular.woff2',        '0cdd387c9590'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',   'de7701e42cf1'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2','5d53e70ad607'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',       '74444efd593c'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',    '51814d270d06'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-Bold.woff2',          '0f60d1b89793'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',    '99cd42a3c072'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-Italic.woff2',        '97479ca6cce9'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-Regular.woff2',       'c2342cd8b869'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',    'dc47344dbb6c'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Math-Italic.woff2',        '7af58c5ec8f1'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',     'e99ae51144bf'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',   '00b26ac825e2'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',  '68e8c73ef42a'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Script-Regular.woff2',     '036d4e95149b'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size1-Regular.woff2',      '6b47c40166b6'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size2-Regular.woff2',      'd04c54219f9e'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size3-Regular.woff2',      '73d591271b16'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size4-Regular.woff2',      'a4af7d414440'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2', '71d517d67827'],
  ['./mir/shell/vendor/katex/fonts/OFL.txt',                        'fda55663cd51'],
  ['./mir/shell/vendor/marked-LICENSE.md',                          '8e3a3f82f59a'],
  ['./mir/shell/window-picker.css',                                 '4f4857bb231e'],
  ['./mir/shell/window-picker.js',                                  '092178b1caf9'],
  ['./mir/shell/wordmark.js',                                       'f47ed2744692'],
  ['./mir/slider-keys.js',                                          '7cadb3bbca48'],
  ['./mir/timeline/audio-analysis.js',                              '38fd4dc085d3'],
  ['./mir/timeline/audio-drop.js',                                  '66ddea74c440'],
  ['./mir/timeline/audio-kind.js',                                  '71ea92197244'],
  ['./mir/timeline/audio-playback.js',                              '81c9e930fe20'],
  ['./mir/timeline/bind.js',                                        '645b8d0930cd'],
  ['./mir/timeline/controller.js',                                  '7e57c530ef59'],
  ['./mir/timeline/cursor.js',                                      '2c4a4bd2063b'],
  ['./mir/timeline/curve-view.js',                                  '8432d7c7a10d'],
  ['./mir/timeline/draw.js',                                        'b6997dd5222f'],
  ['./mir/timeline/editor.js',                                      '5a364c336d7f'],
  ['./mir/timeline/geometry.js',                                    'f8794d8a36ec'],
  ['./mir/timeline/history.js',                                     '5f23e118ee32'],
  ['./mir/timeline/kinds.js',                                       'aec89844d05a'],
  ['./mir/timeline/knobs.js',                                       '8bd74104f4a0'],
  ['./mir/timeline/model.js',                                       '788e0848e3fb'],
  ['./mir/timeline/pattern-kind.js',                                '3b1f2f328c3f'],
  ['./mir/timeline/playhead.js',                                    'b918e4f78f01'],
  ['./mir/timeline/project.js',                                     '5333447c0b76'],
  ['./mir/timeline/readout.js',                                     '9e7c495c4555'],
  ['./mir/timeline/selection.js',                                   '12ffcdb73b0f'],
  ['./mir/timeline/shortcuts.js',                                   'f08a185a4247'],
  ['./mir/timeline/slice.js',                                       '54c15da61852'],
  ['./mir/timeline/source.js',                                      '1399ce6fe2ab'],
  ['./mir/timeline/time-format.js',                                 'bace74d4a020'],
  ['./mir/timeline/timeline.css',                                   'a57bdc02030b'],
  ['./mir/timeline/view.js',                                        'a8b9bddcdec5'],
  ['./mir/timeline/window.js',                                      'dcc1fdbba420'],
  ['./mir/version.js',                                              'a052ffde267d'],
  ['./mir/window-activity.js',                                      '8eb6cefdf972'],
  ['./mir/window/dock.js',                                          '6b678fe06223'],
  ['./mir/window/rail.js',                                          '9f52cd12884d'],
  ['./mir/window/window.css',                                       'cfb2269acf56'],
  ['./mir/window/window.js',                                        'da060244acf5'],
  ['./mir/window/workspaces.js',                                    'ccbc08107b95'],
  ['./mod-port.js',                                                 '71693e70d699'],
  ['./modrive.js',                                                  '89b99a6568d1'],
  ['./molecular-field.js',                                          'caa6acc2bd92'],
  ['./molecular-flow.js',                                           '217febb4fa90'],
  ['./molecular-register.js',                                       'c274a236d6ef'],
  ['./molecular-session.js',                                        '5b34a3a1f27a'],
  ['./molecule-state.js',                                           'b6884ee2026f'],
  ['./molecule.js',                                                 'a4fa89092923'],
  ['./molecules.js',                                                '8e3bf56f01a5'],
  ['./momentum.js',                                                 '76d7ead56f01'],
  ['./motion-pref.js',                                              '34329c802c8b'],
  ['./names.js',                                                    'bab9a526b038'],
  ['./native-ui.js',                                                'f20eb8cd7474'],
  ['./new-project.lambdawaves.json',                                '4af1707b3f7e'],
  ['./node-focus.js',                                               '604ea6bdf31f'],
  ['./node-layers.js',                                              'bf8fa92da50f'],
  ['./node-prims.js',                                               'fc0e69b21e23'],
  ['./node-shader.js',                                              '000a3a701c3e'],
  ['./node-types.js',                                               '0275d6f1d32a'],
  ['./nodes-compile.js',                                            'c7827a74a989'],
  ['./nodes-undo.js',                                               'db77f12dd9ab'],
  ['./nodes-view.js',                                               '5fa071a77d2f'],
  ['./nodes.css',                                                   '341cb0e9fffa'],
  ['./nodes.js',                                                    'e07368e1d97a'],
  ['./occlusion.js',                                                'a9cc0db1a71e'],
  ['./orbit.js',                                                    '62464e93c466'],
  ['./orbitalsview.js',                                             '1f47d98d1ed9'],
  ['./pager.js',                                                    'd5c21618ed29'],
  ['./paint-stroke.js',                                             '33052586d45e'],
  ['./palette-app.js',                                              '849fb1751c19'],
  ['./particles.js',                                                '31e2ef4555ce'],
  ['./period.js',                                                   'f95fecca589e'],
  ['./picker-collage.js',                                           'cb632f4e21cc'],
  ['./picker-fx.js',                                                '09e363bc3a8b'],
  ['./picker.js',                                                   '3dadca554b6a'],
  ['./project-store.js',                                            '22a3b1177f0c'],
  ['./projects.js',                                                 'fc6079a4df73'],
  ['./qho.js',                                                      'c0dfa6e21c94'],
  ['./rack.js',                                                     'cbad8d5a19ca'],
  ['./radiation.js',                                                '29532160e051'],
  ['./radiationview.js',                                            'af4dcd350ad5'],
  ['./register-morph.js',                                           'aa32fdb7e99e'],
  ['./registerview.js',                                             'cffe54a1f3fe'],
  ['./render-exact.js',                                             '285453feb271'],
  ['./response-fit.js',                                             'fe7942d74051'],
  ['./rhf-molecule.js',                                             '84e664213495'],
  ['./rotor4.js',                                                   'd4990108825f'],
  ['./rpa-inspector.js',                                            'baf1eaa062e7'],
  ['./scf.js',                                                      '11ea1277c0f2'],
  ['./search-index.js',                                             '3fd392aa7486'],
  ['./separable.js',                                                '407e097d3128'],
  ['./settings-store.js',                                           'c7a8e2917cee'],
  ['./shadowview.js',                                               '7f4443ed1cf6'],
  ['./shell/controller.js',                                         '319b5d3ca8d8'],
  ['./shell/facade.js',                                             '12ecae841593'],
  ['./shell/history.js',                                            'b166d1dd1c91'],
  ['./shell/ink.js',                                                'c774112dcbe8'],
  ['./shell/keys.js',                                               'a9be62b5cdb6'],
  ['./shell/links.js',                                              'a2d16449fc3c'],
  ['./shell/modulation.js',                                         'af788c33b3f2'],
  ['./shell/notebook.js',                                           'd09be4e67de7'],
  ['./shell/persist.js',                                            '2468b175cd63'],
  ['./shell/rack-wiring.js',                                        '8c62b2ea8ae4'],
  ['./shell/settings.js',                                           'd8db793fef7f'],
  ['./shell/stage-words.js',                                        'd42d732cb243'],
  ['./shell/transport.js',                                          '5f3a20aaca19'],
  ['./skeleton.js',                                                 '521904b4e851'],
  ['./skin.css',                                                    '851f023df10e'],
  ['./slice.js',                                                    'b8c3914b510c'],
  ['./sliceview.js',                                                'd6cc630d3a03'],
  ['./spectrum.js',                                                 '4cd6a0de2366'],
  ['./stage-gestures.js',                                           '944915573ca3'],
  ['./stage-window.js',                                             '090405aadab9'],
  ['./stark.js',                                                    'b44c06a9ef38'],
  ['./state.js',                                                    '5b2b470e9196'],
  ['./statelink.js',                                                'cdec8e548fd1'],
  ['./statesview.js',                                               '60d8f64705d7'],
  ['./status.js',                                                   'da2e112c115c'],
  ['./sturmian.js',                                                 '9865f0c8c247'],
  ['./sturmianreg.js',                                              'e9f1d20c0ec0'],
  ['./summon.js',                                                   '406ab317b470'],
  ['./sw-client.js',                                                'a970d5fc7d66'],
  ['./tier.js',                                                     '8a0b625a5b35'],
  ['./timeline-follow.js',                                          'eaa967822814'],
  ['./user-presets.js',                                             '06ba4985c100'],
  ['./valence.js',                                                  '3b4e39e5b9b0'],
  ['./vendor/bse/6-31+g-star-v1.json',                              'b38353af756b'],
  ['./vendor/bse/index.json',                                       'fc50107750ef'],
  ['./vendor/bse/sto-3g-v1.json',                                   '22ce59b9ec99'],
  ['./verbs.js',                                                    '332b7a7d06f5'],
  ['./volumes-format.js',                                           '55958d91da88'],
  ['./volumes.js',                                                  '6d59ac88da7a'],
  ['./vortex.js',                                                   '2375657cf3a4'],
  ['./well.js',                                                     '82f249acd7df'],
  ['./widget-clock.js',                                             '03195e8e1aab'],
  ['./widget-mol.js',                                               'ed5f46171514'],
  ['./widget-text.js',                                              'bbf72eef2dcd'],
  ['./widget-views.js',                                             '79dfa27f65eb'],
  ['./widgets-window.js',                                           'ff0e6b702b73'],
  ['./widgets.js',                                                  'ea007529f5f8'],
  ['./wigner.js',                                                   '668d13ce809c'],
  ['./wignerview.js',                                               '13617c6f04db'],
  ['./window-chrome.js',                                            'c96fc05e9489'],
  ['./windows/equalizer.js',                                        '94e48aca8c83'],
  ['./windows/film.js',                                             'aa8b1aeed381'],
  ['./windows/folders.js',                                          '73fdb73670ae'],
  ['./windows/gas.js',                                              'ace1b9300dbb'],
  ['./windows/kepler.js',                                           '70e405399241'],
  ['./windows/material.js',                                         'e8e4c80c2f7b'],
  ['./windows/molecules.js',                                        'ca726df79ed6'],
  ['./windows/readouts.js',                                         '41e7557011da'],
  ['./windows/settings-card.js',                                    'e2fceb595e64'],
  ['./windows/spectrum.js',                                         '052da99bffdc'],
  ['./windows/static-field.js',                                     '4f28aecf36e1'],
  ['./windows/transition.js',                                       'e3da90bba613'],
  ['./worker-pool.js',                                              '2a50d7f93218'],
];

/* ── 1b. DATA — THE ONE PRECACHE EXEMPTION (0.4.0 S4a · PLAN B2) ──────────────────────────────────────────────────
 * A file under a DATA root is CONTENT-ADDRESSED DEVICE CONTENT: deployed, NEVER precached, fetched when the lab asks for it and
 * kept by the page in DATA_CACHE, a name no build changes — so a new build never clears an installed record (§4 collects only
 * PREFIX caches, and from DATA_CACHE only SWEEP: the three roots whose names carry no hash).  lab/library/<sha-256>.json are the orbital records; lab/library.json, the catalogue that reaches them, is
 * an ordinary precached file.  tests/pwa.test.mjs and tools/build-deploy.mjs READ this list: it is the one rule, and the 0.5.0
 * kit-file policy extends it rather than adding a second:
 * SKIP (0.5.0 A11) — kit data an adoption brings and the lab reads lazily or never: DEPLOYED, NEVER PRECACHED, and nothing more
 * (no cache of its own, no handler: §4 sends it to the network like any URL outside §1).  MIR 1.5's language packs (twelve
 * mir/locales/*.json, 2.24 MB with the token sheet; a pack the network cannot give leaves the words English, which is the kit's
 * own fallback) and mir/tokens.json (the token schema, read by tools, never by a page) took an adopted install from 4.6 to
 * 9.5 MiB, over the 8 MiB ceiling; without them it is 7.3.  `*` is one path segment.  On a 1.4 tree neither exists.
 * THE VOLUMES (iteration 004 V1) are DATA by the same rule: volumes/ (the shelf volumes.json, each volume's index.json and its
 * m/<id>.lwm molecules; in a checkout lab/volumes is the git-ignored dev link to ~/Documents/LAMBDAWAVES-VOLUMES/dist, which no
 * walk follows) and the four basis records only a volume rung needs (STO-6G, 3-21G, 6-31G, 6-31G*: 675 KB the live card never
 * asks for) — fetched with the volume that names them, kept by the page in DATA_CACHE beside it.
 * THE PICTURES (iteration 005 A) are DATA by the same rule: img/menu/ (the Picker's thumbnails, 720 KB) and the demo covers — deployed,
 * never precached, kept by the page in DATA_CACHE after their first good answer (library.js keepData), so an installed app shows them
 * offline from its second run; a picture not yet held is the tile's own placeholder.  Their names carry no hash and a re-render keeps
 * the name, so the covers are kept for ONE BUILD: every new build's activate (§4) sweeps demos/covers/ out of DATA_CACHE, and the next
 * view keeps the deployed bytes (iteration 028 R-08).  img/menu/ left the sweep in 036 G7: THE LOADING SCREEN (lab/loader.js) keeps the
 * menu's films and pictures whole and, on the first open of a new build, compares each kept one with the deployed file (a HEAD's ETag or
 * length and date) and fetches only what changed; the other kept menu pictures it drops, as the sweep did.  The records, the basis records
 * and the volumes are named by what they hold or kept by a press, and stay.
 * THE DEMOS (iteration 026) are DATA whole: demos/ (the four demo files, 270 KB, and their covers) — deployed, never precached; a demo
 * file is read by the boot's seed (FOLDERS' DEMOS store it, and a DEMOS press opens that copy offline) and is never kept here, so a
 * changed demo still reaches every browser (its `saved` stamp is the DEMOS refresh revision).
 * THE MEASURED LINES (iteration 016 E3) are DATA by the same rule: vendor/nist/ (NIST ASD's neutral lines, 330 KB, tools/nist-lines.py) — read when
 * EMISSION SPECTRA first meets the ATOM, kept by the page after that answer and swept with the pictures; HYDROGEN's lines are computed
 * and never need it.
 * THE PARSERS (038 Z3) are DATA by the same rule: the notebook's marked and KaTeX and KaTeX's sheet (mir/shell/vendor/, 327 KiB every install
 * carried) — index.html loads them as before, and the page keeps what loaded once the worker is registered (main.js), so an installed app sets
 * maths offline from its second open.  KaTeX's twenty faces stay precached (each is a @font-face's first source).
 * 038 Z6 · THE KEPT PARSERS SURVIVE AN UPDATE: Z3 swept them at every activate, so an app reopened OFFLINE after a background update set its
 * maths as raw TeX until the next online open.  KEPT is this build's bytes of each (sha-256's first 12 hex, stamped by tests/pwa.test.mjs
 * --write as §1 is); the activate digests a kept copy and deletes it only when it differs — a kit adoption that changed it — and the next
 * open keeps the new bytes. */
const DATA = ['library/', 'volumes/', 'vendor/bse/sto-6g-v1.json', 'vendor/bse/3-21g-v1.json', 'vendor/bse/6-31g-v1.json', 'vendor/bse/6-31g-star-v1.json', 'img/menu/', 'demos/', 'vendor/nist/', 'mir/shell/vendor/marked.min.js', 'mir/shell/vendor/katex/katex.min.js', 'mir/shell/vendor/katex/katex.min.css'];
const KEPT = [['mir/shell/vendor/katex/katex.min.css', '00e0b094171b'], ['mir/shell/vendor/katex/katex.min.js', 'fa140498b8cf'], ['mir/shell/vendor/marked.min.js', '15fabce5b658']];
const DATA_CACHE = 'lw-data-v1';
const SWEEP = ['demos/covers/', 'vendor/nist/'];   // the DATA kept by a first view under a name no hash is in: one build's keep (§4); img/menu/ left it in 036 G7 — the page's loader validates what it keeps; the parsers are KEPT's
const SKIP = ['mir/locales/*.json', 'mir/tokens.json'];

/* WHAT IS DELIBERATELY *NOT* IN §1, and why.  The test asserts this list is exactly what the walk skips. */
const NEVER_PRECACHE = [
  ['sw.js',                'a worker that caches itself can never be updated: the browser fetches sw.js through its own byte-comparison path, and a Cache API copy in front of that is the classic way to strand a build forever.'],
  ['smoke.html',           'a bench page for the browser proof, not part of the lab; caching it would put a dev harness on the home screen.'],
  ['*.md, *.txt EXCEPT a LICENCE text',
                           'shipped documents (skin-notes, PORT-NOTES, the *-SOURCE.txt build records) are served, never loaded by the running lab — precaching them would make every prose edit a new build. THE LICENCES ARE THE EXCEPTION and they ARE precached (wave 59): the font binaries they cover are in this list, and OFL section 2 says each copy must CONTAIN the licence — an offline install that holds twenty-three fonts and cannot reach one licence is not that copy. It costs 22 KB and licence texts change approximately never.'],
  ['vendor/katex/LICENSE', 'NO LONGER SKIPPED, for the same reason: it is the MIT text for KaTeX\'s code and it is precached with vendor/katex/fonts/OFL.txt beside it.'],
  ['a DATA root (§1b: library/, volumes/, the ladder\'s four basis records, img/menu/, demos/, vendor/nist/, the notebook\'s parsers)', 'an orbital record is content-addressed device content — installed on a press or by the open that names it, kept in lw-data-v1 across builds, and never a byte of every visitor\'s install; a volume (≈5 GB) and the bases only its rungs use are the same kind of content, and so are the Picker\'s pictures, the demo covers, the measured lines and the notebook\'s parsers, kept as the page first shows or loads them — the covers and lines until the next build sweeps them (their names carry no hash), a parser while its bytes are the build\'s (KEPT) — and the demo files FOLDERS seeds from.'],
  ['a SKIP path (§1b: mir/locales/*.json, mir/tokens.json)', 'kit data an adoption brings that the running lab fetches only when a language is chosen, or never: deployed, never precached, never cached (offline, a language other than English stays English).'],
  ['a module STAGED in tests/wiring.test.mjs ALLOWLIST', 'OPTIMIZATION 2026-09-24 · M10: wiring proves no root reaches it, so no install should fetch it; tests/pwa.test.mjs and tools/build-deploy.mjs READ the set from that list, so a module rejoins this precache the day it is wired and its entry is forced out.'],
  ['an adopted kit module no root reaches (R5-W1)', '0.5.0 C0: MIR is adopted whole, so lab/mir/ holds modules for consumers λWAVES has not reached yet. tests/wiring.test.mjs walks the roots and names them (--unreached-kit); tests/pwa.test.mjs and tools/build-deploy.mjs READ that set, so a kit module joins this precache the day a consumer imports it. Deployed, never precached, never failed (PLAN §9).'],
];

/* AND WHAT THE FETCH HANDLER REFUSES TO CACHE AT RUNTIME (§4), each with its reason. */
const NEVER_CACHE_AT_RUNTIME = [
  ['any method but GET',        'a POST/PUT is a write; replaying one from a cache is a lie about what the server did.'],
  ['a Range request',           'the answer is a 206 with a slice of the body. A partial response stored under a whole-file key is a poisoned entry that fails silently later. Nothing is ever stored for one; since 036 G7 a Range on a DATA path the page has KEPT WHOLE is answered with the 206 sliced from that body (a <video> plays from the device), and every other Range goes to the network.'],
  ['a cross-origin request',    'lab/ has none (the test proves it), and an opaque response has status 0 and an unreadable body — it cannot be validated, so it is never kept.'],
  ['any navigation that is not the app entry', '/REPORT.md, /LICENSE, /NOTICE and the eight licence texts ABOUT opens in a new tab are DOCUMENTS, not the lab. They change every wave; a cached build log is a lie. This used to be enforced by a path prefix ("above /lab/"), which silently became a no-op the day the lab moved to its own origin and SCOPE became "/" — every navigation on the hostname was then answered with the lab\'s own index.html, and the nine document links in ABOUT each opened a second copy of the lab. Only the ENTRY set is served: everything else is the network\'s, which is also what restores the real 404 wrangler.jsonc\'s not_found_handling asks for. Offline a document fails, which is honest — it is not the lab.'],
  ['anything not already in §1', 'this worker NEVER grows a runtime cache. The precache is the whole app; a URL that is not in it is a URL the lab does not need, so it goes to the network and nothing is stored.'],
  ['a DATA path (§1b) the page has not installed', 'it is answered from lw-data-v1 when the page has stored it and from the network otherwise — and the worker writes nothing there: the page stores a record only after its bytes match its name (lab/library.js).'],
];

/* ── 2. THE BUILD NAME — a pure function of §1's contents, computed here, written nowhere ───────────────
 * Two interleaved 32-bit mixes over "url@hash" lines; base-36 concatenated. Not cryptographic and does not
 * need to be — it names a cache, and it only has to change when the bytes change and not otherwise. */
function digest(s) {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    a = Math.imul(a ^ ch, 0x01000193) >>> 0;
    b = Math.imul(b + ch, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13)) >>> 0;
  }
  return a.toString(36) + b.toString(36);
}
/** a body's revision as §1 and KEPT record it: sha-256's first 12 hex (tests/pwa.test.mjs revOf) */
async function rev12(body) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', body))].slice(0, 6).map((b) => b.toString(16).padStart(2, '0')).join(''); }
const PREFIX = 'lw-lab-';
const BUILD  = digest(PRECACHE.map(([u, h]) => u + '@' + h).join('\n'));
const CACHE  = PREFIX + BUILD;
/* 033 THE UPDATER · THE PAGE KNOWS ITS BUILD: the same digest WITHOUT ./build-id.js, which lab/build-id.js carries as BUILD_ID (written by
   `pwa --write`).  Answered in every message below, so a page can compare the build it was loaded from with the build its controller serves. */
const PAGE_BUILD = digest(PRECACHE.filter(([u]) => u !== './build-id.js').map(([u, h]) => u + '@' + h).join('\n'));

const BASE  = self.location.href;                              // …/lab/sw.js — or …/sw.js at an origin root
const SCOPE = new URL('./', BASE).pathname;                    // '/lab/' on the dev server, '/' deployed
const INDEX = new URL('./index.html', BASE).pathname;
/* THE APP ENTRY — the only two paths a navigation may be answered from the precache with (§5).  It is a
   SET of paths and not a prefix on purpose: a prefix is what stopped working when the prefix became '/'. */
const ENTRY = new Set([SCOPE, INDEX]);
/* pathname → the request we stored it under.  Query and hash never take part: the precache fetches with a
   ?__rev= buster (§3) but PUTS under the clean URL, so a plain request finds it. */
const BY_PATH = new Map(PRECACHE.map(([u]) => [new URL(u, BASE).pathname, new URL(u, BASE).href]));
const BYTES_HINT = PRECACHE.length;

/* ── 3. INSTALL — fill the cache, then WAIT.  No skipWaiting(). ─────────────────────────────────────────
 * BUSTED BY CONTENT AND VERIFIED BY CONTENT.  Each file is fetched with `cache: 'reload'` AND a ?__rev=<content
 * hash>, and the buster alone guarantees nothing: Workers Static Assets ignores the query when it matches, and a
 * deploy swaps the files at once, so an install that straddles a deploy is answered with the NEXT build's bytes
 * (or a sign-in page from an access front) under this build's names.  So the body is digested, and a file whose
 * sha-256 does not begin with its recorded 12 hex, or that arrived by a redirect, rejects the install; what is
 * PUT under the clean URL is a fresh Response of exactly the verified bytes.  If a single file fails, the whole
 * install rejects and the browser throws the new worker away — the old one keeps serving, and the next sw.js
 * the browser fetches installs again — which is exactly the outcome we want from a half-uploaded deploy. */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const already = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    /* 033 · A FAILURE SAYS WHY: the first entry that rejects the install is announced to every window (the page shows the sentence,
       COPY DIAGNOSTICS carries it) before the throw that makes this worker redundant.  For a day of 032 the badge said UPDATE FAILED and nothing else. */
    try { await Promise.all(PRECACHE.map(async ([url, rev]) => {
      const href = new URL(url, BASE).href;
      if (already.has(new URL(href).pathname)) return;          // a re-install of the same build is free
      /* 032 (Sos, 2026-11-02): THE WIRE'S FORM OF A NAME.  Workers Static Assets answers a path with a literal `+` (vendor/bse/6-31+g-star-v1.json)
         with a 307 to its percent-encoded form, and a redirected body rejects the install below — so every build since the 032 deploy failed to
         install (UPDATE FAILED · TRY AGAIN) while the old worker kept serving.  The install asks for the encoded name; the cache key stays `href`,
         the plain name the page requests (§5 serve() matches it by pathname).  tools/release/live-check.mjs now sweeps every entry this way. */
      const wire = href.replace(/\+/g, '%2B');
      const res = await fetch(new Request(wire + (wire.includes('?') ? '&' : '?') + '__rev=' + rev, { cache: 'reload' }));
      if (!res || !res.ok || res.redirected) throw new Error('precache ' + url + ' → ' + (res && (res.redirected ? 'redirected' : res.status)));
      const body = await res.arrayBuffer();
      const got = await rev12(body);
      if (got !== rev) throw new Error('precache ' + url + ' → bytes ' + got + ', recorded ' + rev);
      await cache.put(new Request(href), new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }));
    })); } catch (e) { await announce({ type: 'LW_SW_INSTALL_FAILED', build: BUILD, page: PAGE_BUILD, why: String(e && e.message || e) }); throw e; }
    /* THE SIGNAL (§5): if a worker is already live, this install is an UPDATE and the sessions running on
       the old build are told — while they keep running on it. A first install announces nothing. */
    if (self.registration && self.registration.active) await announce({ type: 'LW_SW_WAITING', build: BUILD, page: PAGE_BUILD, files: PRECACHE.length });
  })());
});

/* ── 4. ACTIVATE — collect the caches no worker will ever read again, and SWEEP's stale pictures.  No clients.claim(). ──
 * Because §3 never calls skipWaiting(), activate can only run when the previous worker has been released —
 * i.e. when no page is left on the old build. So this sweep can never delete the cache a live session is
 * reading. The one exception is §6's UPDATE ALL, pressed with other windows open: their old cache is collected under
 * them, and a lazy import there is answered by the NEW build's cache (a mixed build) or, for a path the deploy
 * dropped, a 404.  That is why §6 refuses any take while a second window is open unless the user said UPDATE ALL,
 * and why the page tells each other window at once (sw-client.js: one holding no work reloads, one holding work
 * is told RELOAD NOW).
 * THE SWEEP (iteration 028 R-08): the covers and the measured lines are kept under names a re-render does not change, so a kept copy
 * would answer for the deployed one forever; each new build deletes them from DATA_CACHE and the page keeps the new bytes on their next
 * view (img/menu/ is the loader's, 036 G7).  A kept parser (038 Z6) goes only when its bytes are not KEPT's.  library/<sha>.json, the
 * basis records and lw-vol-* are untouched. */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith(PREFIX) && n !== CACHE).map((n) => caches.delete(n)));
    if (names.includes(DATA_CACHE)) {
      const dc = await caches.open(DATA_CACHE), kept = new Map(KEPT.map(([f, rev]) => [SCOPE + f, rev]));
      await Promise.all((await dc.keys()).map(async (r) => { const p = new URL(r.url).pathname;
        if (SWEEP.some((d) => p.startsWith(SCOPE + d))) return dc.delete(r);
        if (kept.has(p)) { const hit = await dc.match(r); if (!hit || (await rev12(await hit.arrayBuffer())) !== kept.get(p)) return dc.delete(r); }
      }));
    }
    await announce({ type: 'LW_SW_ACTIVE', build: BUILD, page: PAGE_BUILD, files: PRECACHE.length });
  })());
});

/* ── 5. FETCH — cache-first over §1, and nothing else is ever stored ────────────────────────────────────
 * The refusals above, in order, then: a navigation TO THE APP ENTRY gets index.html, and a precached URL
 * gets its stored copy. A miss inside the precache cannot happen in a healthy install, but if storage was
 * evicted we go to the network rather than fail.
 *
 * ── WAVE 68 · THE NAVIGATION RULE, AND THE RULE THAT REPLACED A COINCIDENCE ────────────────────────────
 * This arm used to be "any navigation in scope gets index.html", refused above it by
 * `startsWith(SCOPE)`. At /lab/ that refusal did the work; at the origin root SCOPE is '/' and
 * `startsWith('/')` refuses NOTHING, so from the second launch onward EVERY navigation on the hostname —
 * /LICENSE, /NOTICE, /REPORT.md, a typo — was answered from the cache with the lab. Measured in real
 * Firefox against `wrangler dev`. The nine document links in the ABOUT face each opened a second copy of
 * λWAVES, which is a GPL-3.0 §4 and OFL §2 REACHABILITY problem and not a cosmetic one, and
 * `not_found_handling: "404-page"` was defeated for every controlled visitor.
 * THE RULE IS NOW ON THE PATH ITSELF: a navigation is answered from the precache only when it names the
 * app entry (SCOPE or SCOPE + 'index.html'). The app has NO path routing at all — state travels in the
 * fragment (statelink.js) — so nothing is lost, and every other URL reaches the network exactly as this
 * file's own §NEVER_CACHE_AT_RUNTIME prose has always said it should. The scope check stays: it is still
 * the right refusal at /lab/, and it costs nothing at the root.
 * The general shape, and it is the second time this tree has met it: A RULE ENFORCED BY A COINCIDENCE OF
 * THE ADDRESS STOPS BEING A RULE WHEN THE ADDRESS CHANGES, silently and with the comment still standing.
 * tests/pwa.test.mjs now runs its whole fetch matrix AT BOTH MOUNTS, which is what closes the class. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                                     // never a write
  const range = req.headers && req.headers.get ? req.headers.get('range') : null;   // never a 206 stored; one answered only from a kept DATA body (below)
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;                      // never cross-origin / opaque
  if (!url.pathname.startsWith(SCOPE)) return;                          // never above the mount (a no-op at an origin root — see above)
  if (req.mode === 'navigate') { if (!ENTRY.has(url.pathname)) return; event.respondWith(serve(INDEX, req)); return; }   // the APP ENTRY only; a document is the network's
  if (DATA.some((d) => url.pathname.startsWith(SCOPE + d))) {           // §1b: a record — the device's copy, else the network; stored by the page only
    event.respondWith(caches.open(DATA_CACHE).then((c) => c.match(url.origin + url.pathname)).then((hit) => (hit ? (range ? slice(hit, range) : hit) : fetch(req)))); return;
  }
  if (range) return;                                                    // a Range outside a kept DATA body: the network's
  if (!BY_PATH.has(url.pathname)) return;                               // not ours: network, and store nothing
  event.respondWith(serve(url.pathname, req));
});

/* 036 G7 · THE RANGE ANSWER: a media element asks for its file in byte ranges, and a Range used to pass every worker by, so the wall and the
   heroes streamed from the network on every open.  For a DATA path the page has kept whole (the loader keeps the menu's films) the answer
   is a 206 sliced from the kept body — `bytes=a-b`, `a-` or `-n`; an unsatisfiable range is a 416; anything else (several ranges) gets the
   whole body, as a server may answer.  Nothing is written. */
async function slice(hit, range) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
  if (!m || (m[1] === '' && m[2] === '')) return hit;
  const blob = await hit.clone().blob(), n = blob.size;
  let a = m[1] === '' ? Math.max(0, n - Number(m[2])) : Number(m[1]), b = m[1] === '' || m[2] === '' ? n - 1 : Math.min(Number(m[2]), n - 1);
  if (a >= n || a > b) return new Response(null, { status: 416, statusText: 'Range Not Satisfiable', headers: { 'Content-Range': 'bytes */' + n } });
  const h = new Headers(hit.headers); h.delete('content-encoding');
  h.set('Content-Range', 'bytes ' + a + '-' + b + '/' + n); h.set('Content-Length', String(b - a + 1)); h.set('Accept-Ranges', 'bytes');
  return new Response(blob.slice(a, b + 1), { status: 206, statusText: 'Partial Content', headers: h });
}

async function serve(pathname, req) {
  const href = BY_PATH.get(pathname);
  if (href) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(new Request(href));
    if (hit) return hit;
  }
  return fetch(req);
}

/* ── 6. THE UI CHANNEL — how the lab asks, and how the USER (never the worker) takes an update ──────────
 *   page → worker  { type: 'LW_SW_HELLO' }         → replies { type:'LW_SW_BUILD', build, files, cache }
 *   page → worker  { type: 'LW_SW_SKIP_WAITING' }  → a PRESS (or, with `alone: true`, wave 133's QUIET TAKE for an
 *                                                    untouched session — the page's word; counted the same): this
 *                                                    waiting worker takes over only while ONE window is in scope;
 *                                                    the page reloads on 'controllerchange'.  Else refused with:
 *   worker → page  { type: 'LW_SW_BUSY', windows }  → the take was refused; the page offers it (after a press, as
 *                                                    "n other windows are open … UPDATE ALL").
 *   page → worker  { type: 'LW_SW_SKIP_WAITING', force: true }
 *                                                  → UPDATE ALL: the user said yes for every window; taken at once.
 *   worker → page  { type: 'LW_SW_WAITING', build } → a new build finished installing and is waiting (§3).
 *   worker → page  { type: 'LW_SW_ACTIVE',  build } → a build took over (first install, or after a skip).
 * SKIP_WAITING is the ONLY thing in this file that can end a session's build, and only the interface can
 * send it — the worker never sends it to itself, and no timer sends it either. */
self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'LW_SW_SKIP_WAITING') { const p = takeover(event, d); if (event.waitUntil) event.waitUntil(p); return; }
  if (d.type === 'LW_SW_HELLO') {
    const msg = { type: 'LW_SW_BUILD', build: BUILD, page: PAGE_BUILD, files: PRECACHE.length, cache: CACHE };
    const port = event.ports && event.ports[0];
    if (port) port.postMessage(msg);
    else if (event.source && event.source.postMessage) event.source.postMessage(msg);
  }
});

/* EVERY TAKE COUNTS THE WINDOWS (iteration 028 R-03; wave 133 counted only the quiet take): skipWaiting() re-points every client
   in scope, and a window that did not ask may hold work and would lazy-load from a build it did not boot on.  With a second window
   open the asking page is told LW_SW_BUSY and offers UPDATE ALL, which asks again with `force: true` — the user's yes for every
   window.  The forced path reaches skipWaiting() without an await, so it is taken in the same turn as the message. */
async function takeover(event, d) {
  if (!d.force) {
    const windows = (await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })).length;
    if (windows > 1) { if (event.source && event.source.postMessage) event.source.postMessage({ type: 'LW_SW_BUSY', windows }); return; }
  }
  self.skipWaiting();
}

async function announce(msg) {
  if (!self.clients || !self.clients.matchAll) return;
  const list = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of list) c.postMessage(msg);
}

/* Read by tests/pwa.test.mjs, which loads this file for real and drives the handlers above. */
self.LW_SW = { PREFIX, BUILD, PAGE_BUILD, CACHE, PRECACHE, NEVER_PRECACHE, NEVER_CACHE_AT_RUNTIME, SCOPE, INDEX, ENTRY, BY_PATH, DATA, KEPT, DATA_CACHE, digest };
