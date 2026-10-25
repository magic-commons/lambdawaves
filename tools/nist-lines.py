#!/usr/bin/env python3
"""tools/nist-lines.py — THE MEASURED LINES (iteration 016 E3): the NIST Atomic Spectra Database's neutral spectra, H I … Og I,
as lab/vendor/nist/lines.json, the table EMISSION SPECTRA draws under the ATOM system.

    ~/.local/share/lw-volumes/venv/bin/python tools/nist-lines.py [--out lab/vendor/nist/lines.json] [--cache DIR] [--z 1-118]

One GET per element to the ASD lines form (tab-delimited, vacuum wavelengths at every λ — show_av=3 — in nm, lines with a
transition probability only — line_out=1), one second apart.  Kept: A_ki known, both configurations given, and the strong
half — relative intensity at or above the element's median where intensities are given, else A_ki at or above its median —
at most CAP lines per element, strongest first.  Nothing is invented: an element the ASD has no A_ki lines for writes none.

Row: [Z, λ_vac_nm, A_ki (s⁻¹), rel_int (0 when not given), lower_conf, lower_term, upper_conf, upper_term].

NIST ASD is a work of the U.S. Government (public domain).  Cite: A. Kramida, Yu. Ralchenko, J. Reader and the NIST ASD Team,
NIST Atomic Spectra Database (ver. 5.x), https://physics.nist.gov/asd, National Institute of Standards and Technology.
"""
import argparse, json, os, re, statistics, sys, time, urllib.parse, urllib.request

SYM = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh '
       'Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra '
       'Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split()
URL = 'https://physics.nist.gov/cgi-bin/ASD/lines1.pl'
CAP = 160
PARAMS = dict(output_type=0, low_w='', upp_w='', unit=1, submit='Retrieve Data', de=0, plot_out=0, I_scale_type=1, format=3,
              line_out=1, en_unit=1, output=0, page_size=15, show_obs_wl=1, show_calc_wl=1, unc_out=1, order_out=0,
              max_low_enrg='', show_av=3, max_upp_enrg='', tsb_value=0, min_str='', A_out=0, intens_out='on', max_str='',
              allowed_out=1, min_accur='', min_intens='', conf_out='on', term_out='on', enrg_out='on', J_out='on')


def url_for(sym):
    return URL + '?' + urllib.parse.urlencode(dict(PARAMS, spectra=sym + ' I'))


def fetch(sym, cache):
    path = os.path.join(cache, sym + '.tsv') if cache else None
    if path and os.path.exists(path):
        return open(path, encoding='utf-8').read()
    req = urllib.request.Request(url_for(sym), headers={'User-Agent': 'lambdawaves-nist-lines/1 (research; one request per element)'})
    with urllib.request.urlopen(req, timeout=180) as r:
        text = r.read().decode('utf-8', 'replace')
    if path:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
    time.sleep(1.0)
    return text


def num(s):
    m = re.match(r'\s*[\(\[]?\s*([0-9]+(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?)', s or '')
    return float(m.group(1)) if m else None


def clean(s):
    return (s or '').strip().strip('"').strip()


def parse(text):
    first = text.split('\n', 1)[0]
    if 'obs_wl' not in first and 'ritz_wl' not in first:
        return None   # an HTML page: no lines, or an error the ASD wrote
    lines = text.rstrip('\n').split('\n')
    head = [clean(h) for h in lines[0].split('\t')]
    col = {h: i for i, h in enumerate(head)}
    out = []
    for raw in lines[1:]:
        f = [clean(x) for x in raw.split('\t')]
        g = lambda k: f[col[k]] if k in col and col[k] < len(f) else ''
        lam = num(g('obs_wl_vac(nm)')) or num(g('ritz_wl_vac(nm)'))
        A = num(g('Aki(s^-1)'))
        ci, ck = g('conf_i'), g('conf_k')
        if not lam or not A or not ci or not ck:
            continue
        out.append(dict(lam=lam, A=A, I=num(g('intens')) or 0.0, ci=ci, ti=g('term_i'), ck=ck, tk=g('term_k')))
    return out


def keep(rows):
    withI = [r for r in rows if r['I'] > 0]
    if len(withI) >= 4:
        med = statistics.median(r['I'] for r in withI)
        kept = sorted([r for r in withI if r['I'] >= med], key=lambda r: (-r['I'], -r['A']))
    else:
        med = statistics.median(r['A'] for r in rows) if rows else 0
        kept = sorted([r for r in rows if r['A'] >= med], key=lambda r: -r['A'])
    return kept[:CAP]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'lab', 'vendor', 'nist', 'lines.json'))
    ap.add_argument('--cache', default='')
    ap.add_argument('--z', default='1-118')
    a = ap.parse_args()
    lo, hi = (int(x) for x in a.z.split('-')) if '-' in a.z else (int(a.z), int(a.z))
    if a.cache:
        os.makedirs(a.cache, exist_ok=True)
    table, got, none = [], [], []
    for Z in range(lo, hi + 1):
        sym = SYM[Z - 1]
        try:
            rows = parse(fetch(sym, a.cache))
        except Exception as e:   # the network or the ASD refused: said, never filled in
            print(f'{sym} I: refused ({e})', file=sys.stderr)
            none.append(sym)
            continue
        if not rows:
            none.append(sym)
            print(f'{sym} I: no A_ki lines', file=sys.stderr)
            continue
        k = keep(rows)
        for r in sorted(k, key=lambda r: r['lam']):
            table.append([Z, round(r['lam'], 6), float(f"{r['A']:.4g}"), r['I'], r['ci'], r['ti'], r['ck'], r['tk']])
        got.append(sym)
        print(f'{sym} I: {len(rows)} lines with A_ki, {len(k)} kept', file=sys.stderr)
    doc = {'source': 'NIST Atomic Spectra Database (A. Kramida, Yu. Ralchenko, J. Reader and the NIST ASD Team), https://physics.nist.gov/asd — U.S. Government work, public domain',
           'query': URL + ' · spectra=<El> I · line_out=1 · show_av=3 (vacuum, all wavelengths) · unit=1 (nm) · format=3 (tab)',
           'fetched': time.strftime('%Y-%m-%d'),
           'keep': f'A_ki known, both configurations, rel. intensity >= the element median (else A_ki >= its median), <= {CAP} per element',
           'columns': ['Z', 'lambda_vac_nm', 'A_ki', 'rel_int', 'lower_conf', 'lower_term', 'upper_conf', 'upper_term'],
           'elements': got, 'none': none, 'lines': table}
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(table)} lines from {len(got)} spectra -> {a.out}; none for {len(none)}', file=sys.stderr)


if __name__ == '__main__':
    main()
