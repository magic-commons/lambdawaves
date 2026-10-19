/* lab/shell/links.js — §25 SHAREABLE LINKS (0.5.2 R3a; moved verbatim out of lab/rack.js boot()).  createLinks(app) runs at its seat;
 * serialize / restore are persist's, read as app.sh.x at use; §29's openLink() call stays in boot().  esc (the HISTORY list's) and
 * copyLink (STATE's) are registered on app.sh. */
import { linkFor, readLink, LinkError, LINK_CHAR_CEILING } from '../statelink.js';   // wave 56: every state of this lab is a LINK
export function createLinks(app) {
  const { ui, reg, PAL_DEF } = app; const { wState } = app.w;
  /* ── WAVE 56 · SHAREABLE LINKS (board #55) ────────────────────────────────────────────────
   * lab/statelink.js is a CODEC on serialize()'s OWN object — not a second serialisation — so a link is
   * the project file, minus what format v1 has no room for, in about three hundred characters of FRAGMENT
   * (never a query: a fragment is not sent to a server, and a link carries somebody's work).
   * TWO THINGS ARE LAWS HERE, and neither is decoration:
   *   SAY WHAT IS NOT CARRIED.  encodeState() returns `notCarried`, and v1 does not carry the MOLECULE
   *     panel or the MODULATION rack.  A link that silently dropped a reader's modulators would be a lie,
   *     so the mint puts the COUNT in the status line and NAMES them in a note that stays on the card —
   *     never in a hover, and never only in the console (ANTI-PATTERNS 4).
   *   A LINK IS THE BOTTOM OF THE STACK.  Exactly as `?preset=` is: opening one clears the undo ring,
   *     because there is nothing behind it to undo back to.
   * The two keys serialize() gained above are applied HERE and nowhere else: restore() is the project
   * road and does not read them, so a link opening is the one place where somebody else's palette choice
   * and somebody else's DRAG γ land in this browser. */
  const NOT_CARRIED_NAME = { mo: 'the MOLECULE panel', modulation: 'the MODULATION rack', rotationRates: 'the rotation and deflection rates',
    kepler: 'KEPLER ORBIT', vortex: 'VORTEX', particles: 'PARTICLES', dials: 'the DIALS' };   // iteration 007 (MIR check, files B2): the overlays, named when on
  const notCarriedWords = (keys) => keys.map((k) => NOT_CARRIED_NAME[k] || k).join(' · ');
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
  app.state.linkLast = null;

  /** what the interface says about a link, in the two places it can be read: the STATE card's status line
   *  (short, and its hover hint carries the whole of it) and a note on the card that does not disappear. */
  function linkSay(msg, cls, detail) {
    wState.setStatus(msg, cls || 'live');
    if (ui.linkNote) { ui.linkNote.innerHTML = detail || ''; ui.linkNote.hidden = !detail; }
    return msg;
  }

  /** the href for the state as it stands, with everything encodeState measured about it */
  function mintLink() { app.state.linkLast = linkFor(app.sh.serialize(), { paletteId: app.state.palette ? app.state.palette.id : PAL_DEF, orbitalKey: app.state.chem.on ? app.state.chem.orbitalKey() : null }); return app.state.linkLast; }   // S2: the molecule's orbital rides by its S1 name

  /** MINT and copy.  Reports `chars`, and when something is not carried it SAYS SO. */
  async function copyLink() {
    let enc;
    try { enc = mintLink(); }
    catch (e) { linkSay('link failed', 'warn', '<b>THE LINK COULD NOT BE BUILT.</b> ' + esc(e && e.message || e)); return null; }
    let copied = false;
    try { await navigator.clipboard.writeText(enc.href); copied = true; } catch (_) {}
    const say = [];
    if (enc.notCarried.length) say.push('<b>THIS LINK DOES NOT CARRY:</b> ' + notCarriedWords(enc.notCarried)
      + '. Link format v1 does not carry those settings — everything else in this window is in it: the register and its mask, the clock, the operator and its scale, the camera, the material, the palette and the label rates.');
    if (enc.dropped) say.push('<b>' + enc.dropped + ' coefficient' + (enc.dropped === 1 ? '' : 's') + ' fell below the link\'s 16-bit floor</b> and — at under 2.3e-10 of the peak population — travelled as zero.');
    if (!enc.fits) say.push('<b>' + enc.chars + ' CHARACTERS.</b> That is past the ' + LINK_CHAR_CEILING
      + '-character length a URL can be relied on to survive in a chat app or a mail client. It opens here; it may be cut in transit.');
    if (!copied) say.push('<b>THE CLIPBOARD REFUSED</b> (this browser only hands it to a trusted gesture). The link is here, to copy by hand:<br><code>' + esc(enc.href) + '</code>');
    linkSay((copied ? 'link copied · ' : 'link NOT copied · ') + enc.chars + ' chars'
      + (enc.notCarried.length ? ' · ' + enc.notCarried.length + ' not carried' : ''),
      copied && enc.fits ? 'live' : 'warn', say.join(' '));   // what v1 cannot carry is TRUE OF EVERY LINK, so it is information and not an alarm: the count is in the words, the colour is kept for a link that did not copy or will not survive a paste
    enc.copied = copied;
    return enc;
  }

  /** OPEN a link.  `null` from readLink() means the href simply carries no state, which is a plain visit and
   *  not an error; a LinkError means one it cannot read, and that is shown — never a console-only failure. */
  function openLink(href) {
    let got;
    try { got = readLink(href === undefined ? location.href : href); }
    catch (e) {
      const code = e instanceof LinkError ? e.code : 'error';
      linkSay('link not read', 'warn', '<b>THIS LINK DID NOT OPEN.</b> ' + esc(e && e.message || e) + ' <i>Nothing in the lab was changed.</i>');
      return { ok: false, opened: false, code, message: String(e && e.message || e) };
    }
    if (!got) return { ok: true, opened: false, code: null, message: null };
    /* THE PALETTE IS NAMED BEFORE THE STATE IS RESTORED, never after: select() re-reads the catalogue's own
       stops, so doing it second would throw away an EDITED palette that the link had carried in full. */
    if (got.paletteId && app.state.palette && got.paletteId !== app.state.palette.id) app.state.palette.select(got.paletteId);   // S1 (D2): the palette is the link's, never written into this browser's settings
    const ok = app.sh.restore(got.state);
    const d = +(got.state.experiment && got.state.experiment.damping);
    if (Number.isFinite(d) && d !== reg.damping) { reg.setDamping(d); if (ui.dragKnob) ui.dragKnob.set(d); }
    if (app.state.history) app.state.history.clear('link');                 // a link is the BOTTOM of the stack, exactly as ?preset= is
    const say = [];
    for (const w of got.warnings || []) say.push('<b>NOTE.</b> ' + esc(w) + '.');
    if ((got.unknownSections || []).length) say.push('<b>' + got.unknownSections.length + ' part' + (got.unknownSections.length === 1 ? '' : 's')
      + ' of this link were written by a newer build</b> and this one skipped them; everything it does know was applied.');
    linkSay(ok ? 'opened from a link' : 'link read, restore failed', ok && !say.length ? 'live' : 'warn', say.join(' '));
    return { ok, opened: true, code: null, message: null, warnings: got.warnings, unknownSections: got.unknownSections };
  }
  app.sh.esc = esc; app.sh.copyLink = copyLink; app.sh.notCarriedWords = notCarriedWords; app.sh.mintLink = mintLink; app.sh.openLink = openLink;
  return { notCarriedWords, mintLink, copyLink, openLink };
}
