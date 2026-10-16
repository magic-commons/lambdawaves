# Steam store assets: λWAVES

## What Valve requires (read 2026-09-24)

Sources:
- [A] https://partner.steamgames.com/doc/store/assets/standard
- [B] https://partner.steamgames.com/doc/store/assets/libraryassets
- [C] https://partner.steamgames.com/doc/store/assets (the overview)
- [D] https://partner.steamgames.com/doc/store/trailer
- [E] https://partner.steamgames.com/doc/store/review_process

None of these pages carries a "last updated" date, so re-read them the day you upload.

| Asset | Size (px) | Required | Rule worth remembering | This kit |
|---|---|---|---|---|
| Header capsule [A] | 920 × 430 | yes | logo legible; "No quotes or text beyond game title" | **DRAFT** `capsules/header-capsule-920x430-DRAFT.png` |
| Small capsule [A] | 462 × 174 | yes | "logo should nearly fill the small capsule" | needs art |
| Main capsule [A] | 1232 × 706 | yes | logo legible, title only | needs art |
| Vertical capsule [A] | 748 × 896 | yes | seasonal sales, title only | needs art |
| Screenshots [A] | ≥ 1920 × 1080, 16:9 | yes, ≥ 5 | "should exclusively show the gameplay"; no concept art, marketing copy or awards; ≥ 4 "suitable for all ages" | **5 real** `screenshots/01…05` |
| Page background [A] | 1438 × 810 | optional | "ambient"; made automatically from the last screenshot if absent | none (leave to Steam, or use `capsules/src-field-reconnection-dark.png`) |
| Library capsule [B] | 600 × 900 | yes | PNG/JPG, "graphically-centric", title only | **DRAFT** `capsules/library-capsule-600x900-DRAFT.png` |
| Library header [B] | 920 × 430 | yes | product branding, title only | reuse the header capsule draft |
| Library hero [B] | 3840 × 1240 (safe area 860 × 380) | yes | "no text permitted" | needs art (source: `capsules/src-field-*.png`, 3840 × 2160, field only) |
| Library logo [B] | 1280 wide and/or 720 tall | yes | PNG, transparent background, logotype only | needs art (the λ + WAVES lockup in `store/capsules.py` `wordmark()` is a starting point) |
| Shortcut icon [C] | 256 × 256 (.ico or .png) | yes | the desktop icon | needs art (M3 also needs the .exe icon) |
| App icon [C] | 184 × 184 (.jpg) | yes | "Small game logo or representative icon" | needs art (`lab/img/icon-512.png` downscaled is enough) |
| Event cover [C] | 800 × 450 | yes, for events | announcements | later |
| Event header [C] | 1920 × 622 | optional | announcements | later |
| Trailer [D] | up to 1920 × 1080, 16:9, .mp4/.mov/.wmv, H.264 + AAC, 30 or 60 fps, "5,000+ Kbps" | not listed as required | first trailer "primarily gameplay"; Steam makes 6-second looping microtrailers from it | **DRAFT** `trailer-draft.mp4` (on disk only) |

Review rules [E]: "Your capsule images will need to include a readable product title or logo"; "Your screenshots must only contain gameplay."

Also on disk: `LANDING PAGE VIDEOS/STEAM LOGO.png` in the main checkout (untracked, 1920 × 1080). It is a dark-theme capture of the app, not a logo. Treat it as a sixth screenshot or as capsule source.

## The five screenshots

These are real frames of the **packaged** Electron build (`tools/platform/electron/out/lambdawaves-desktop-linux-x64`, the `91c90bc` payload), made by `node store/shots.mjs` on 2026-09-24:

- RTX 3070 adapter (`nvidia/ampere`, not a fallback), 1920 × 1080 CSS px at scale 1, RGB PNG with no alpha.
- `Page.captureScreenshot` over CDP after `__LW.ready` and `__LW.settle()`.
- Each state boots with fresh local storage on a throwaway profile (`LW_SMOKE_DIR`), and the photosensitivity notice is dismissed by clicking its button.
- Pure UI. Nothing is painted over the frames.
- Chromium ran with `--no-sandbox`, because `chrome-sandbox` on this box is not root:4755 (the sudo line in `docs/ACCEPTANCE-MATRIX.md`). The shipped app never runs that way.

| File | What it shows | How it was reached |
|---|---|---|
| `01-hydrogen-field-and-rack.png` | The shipped first-run state: the 1s + 2p_z dipole beat in phase colour, playing, with the default rack (SHADOW, SPECTRUM, SETTINGS, STATE, PALETTE, WAVE) and the transport | `?play=1` |
| `02-spectrum-state-superposition.png` | A three-mode superposition (3d₊₂ + 4p₊₁ + 5s, "reconnection") played in phase view. SPECTRUM lights the three modes and SHADOW shows their phasors. STATE is open on top with A/B, bow and static-field controls | `?preset=recon&view=phase&play=1`, then STATE reopened and unfolded |
| `03-wave-dancer-demo.png` | The bundled WAVE DANCER performance: dark theme, a four-state A/B transition playing, and the modulation window with MACROS, an LFO and AUDIO (input not switched on) | PROJECTS ▸ DEMOS ▸ WAVE DANCER, notebook closed, play |
| `04-molecules-benzene.png` | MOLECULES ON: the benzene (C₆H₆, 36 AOs, STO-3G) ground-state density in the field, with the card's basis, view, kick and spectrum | MOLECULES reopened, `chem.solve('C6H6')`, `setOn(true)`, `?view=density` |
| `05-notebook-and-projects.png` | The notebook in preview on a saved project, "lessons/radial-breathing": a Markdown note with typeset maths (the 1s/2s beat period T = 2π/(E₂−E₁) = 16.755 a.u.) over the 1s + 2s density | `?preset=1s%2B2s&view=density&play=1`, `projects.save`, notebook text set, preview mode |

Steam asks for at least four "suitable for all ages". All five are.

## Capsule drafts

`python3 store/capsules.py` composes the drafts from `capsules/src-field-wave-dancer.png`. That file is a UI-hidden (H key) frame of WAVE DANCER at 3840 × 2160, made by `node store/shots.mjs --art`. The script adds the λ and dot keyed out of `lab/img/icon-512.png` and "WAVES" set in the app's own LW Title face (`lab/fonts/LWTitle-title.woff2`, OFL). There is no text beyond the name. They are drafts so the Steamworks page can be filled and reviewed. Josh or Gemini replace them, along with every row marked "needs art" above.

## Trailer

**Status: DRAFT built.** `store/steam/trailer-draft.mp4` (on disk only):

- 43.2 s, 1920 × 1080, 30 fps, H.264 High at ≈ 11.7 Mb/s, AAC-LC stereo 48 kHz **silent**, `+faststart`, 63,070,760 B. sha256 begins `88f6669f729d7b04`.
- It is gitignored by `store/.gitignore` (`*.mp4`, over 20 MB). It exists only in this worktree.

Cut list, all hard cuts, no title card:

1. HERO2 0–7.3 s. The first frame is the moving field.
2. HERO4 0–10.4 s.
3. HERO1 2.0–11.95 s. It skips HERO1's quiet opening sphere.
4. HERO3 0–6.2 s.
5. HERO5 0–7.5 s.
6. A 2 s end card: `lab/img/icon-512.png` centred on its own navy (#07111e).

The sources are the owner's screen recordings in `LANDING PAGE VIDEOS/` (probed 2026-09-24: HERO1–6 are 1920 × 1080, 60 fps H.264, with Opus stereo 48 kHz audio, 6.2–12.0 s). Their audio is **not** used. It is real sound (mean −17.8 to −34.7 dB), and `LEGAL-PROVENANCE.md` §5 item 2 has Josh still to confirm it carries no third-party music. After he confirms, he can swap the silent track for music he owns.

```sh
V="$HOME/Documents/LAMBDAWAVES/LANDING PAGE VIDEOS"; ICON=lab/img/icon-512.png; OUT=store/steam/trailer-draft.mp4   # run from the repo root
N='scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1,settb=AVTB'
ffmpeg -nostdin -y \
  -i "$V/HERO2.mkv" -i "$V/HERO4.mkv" -i "$V/HERO1.mkv" -i "$V/HERO3.mkv" -i "$V/HERO5.mkv" \
  -f lavfi -i "color=c=0x07111e:s=1920x1080:r=30:d=2" -loop 1 -t 2 -i "$ICON" \
  -f lavfi -t 43.422 -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
  -filter_complex "[0:v]trim=0:7.317,setpts=PTS-STARTPTS,$N[a];[1:v]trim=0:10.4,setpts=PTS-STARTPTS,$N[b];[2:v]trim=2:11.954,setpts=PTS-STARTPTS,$N[c];[3:v]trim=0:6.217,setpts=PTS-STARTPTS,$N[d];[4:v]trim=0:7.534,setpts=PTS-STARTPTS,$N[e];[5:v][6:v]overlay=(W-w)/2:(H-h)/2:shortest=1,$N[f];[a][b][c][d][e][f]concat=n=6:v=1:a=0[v]" \
  -map "[v]" -map 7:a -c:v libx264 -preset slow -profile:v high -b:v 12M -maxrate 20M -bufsize 24M -g 60 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest -movflags +faststart "$OUT"
```

To use the recordings' own audio once cleared: drop the `anullsrc` input, add `[0:a]atrim=0:7.317,asetpts=PTS-STARTPTS[a0]` and the same for each cut (HERO1 from 2 s), concat with `a=1`, and map that result in place of `7:a`.

## Still Josh's (or Gemini's)

The small, main and vertical capsules; the library hero and logo; the shortcut and app icons; final header and library art; the music decision for the trailer; and which of the five screenshots leads.
