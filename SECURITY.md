# Security

λWAVES is a static site: no server code, no accounts, no analytics. Every response carries a Content-Security-Policy that lets
scripts, workers, fonts, the manifest and every fetch come from this origin alone (a note's own `https:` pictures are the one
outside source it allows). After the page loads it makes these requests, all to its own origin unless said:

- **The build check.** When the page is shown and 30 minutes have passed since the last check, the service worker asks for
  `sw.js` again and compares it byte for byte; a new build is offered, never forced.
- **What you ask for.** The library's orbital records, a molecule volume (≈ 5 GB whole) and the basis records its rungs use,
  the Picker's pictures, the demo files and their covers, and NIST's measured lines — each fetched when you open what needs
  it, and kept in Cache Storage so the next time works offline.
- **An imported notebook's images.** A note's `![](https://…)` is fetched from wherever it points, on every open of the
  project that carries it. That host learns your address and the time. The fix belongs to the interface kit and is filed
  there (`docs/FOR-MIR.md`); until it lands, treat a notebook from someone else as a page that can see you open it.
- **The ASK assistant** is switched off in this build (`lab/ask.js` `ASK_ENABLED`). Switched on by a developer, it posts
  your words to a broker on your own machine or network (`docs/GEMMA.md`).

The microphone is opened only when you add an AUDIO device; its signal never leaves the page, and it is released when the
last AUDIO device is removed. Web MIDI is asked for when you press CONNECT MIDI or LEARN; once a mapping is saved, the boot
reconnects only where the browser already grants MIDI, without a prompt.

What stays on your device: localStorage (projects, notes, settings), Cache Storage (the precached build in `lw-lab-<build>`, the
records above in `lw-data-v1` and `lw-vol-*`), IndexedDB `mir-assets` (audio you drop on the TIMELINE), and the files you
export. Cloudflare serves the files and keeps its own ordinary server logs; its responses also carry its `nel` and `report-to` headers
(network-error reports to Cloudflare), which this page does not control.

If you find a problem — an XSS through an imported project or notebook, a way to make the service worker serve stale
bytes, a leak of microphone audio, a request this page does not name — report it privately through GitHub's **Report a
vulnerability** (the repository's Security tab); a public issue is for everything else. Please include the project file or the steps.
