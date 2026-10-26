"""build_edition.py — export the canonical Markdown manuscripts of the review edition to white-on-black two-column LaTeX and compile them with the existing Tectonic.
Adapted from pass06's build_reading_editions.py (same preamble, masthead artwork and credits). Run: python3 -I build_edition.py [--no-compile]
Markdown conventions (all plain Markdown, readable in Obsidian):
  # Title / by SOL-6.1 and Sonnet 5.5 / series line, then the OPENING figure, then ## Abstract ...
  ## References (bullet list = bibliography) then ## Credits (### People / ### With Thanks / ### Credits & Licenses; the line <!-- ai-logos --> marks the model-logo row) close each paper, each on its own page; the two papers' Credits blocks must be identical.
  ![wide](figures/x.png){0.46}        one or more image lines, then the caption as a blockquote:
  > **Figure N — Title.** Caption text.
  **Table N — Title.** Caption.  followed by a pipe table; an HTML comment line  <!-- cols: .3 .7 -->  or  <!-- wide cols: ... -->  before it sets widths
  $$ ... \\tag{n} $$ displayed equations, numbered in order;  > **Proposition 1.** ...  indented statement blocks;  - lists;  ## References bullet list = bibliography."""
from pathlib import Path
import re, json, hashlib, subprocess, sys, shutil, time
ROOT = Path(__file__).resolve().parent.parent
PAPERS = [('01-PLAYABLE-QUANTUM-FIELD', '01'), ('02-MOLECULAR-CURRENT', '02'), ('03-LEAK-AND-REPAIR', '03'), ('04-KNOTTED-ZEROS', '04')]
ONLY = [a for a in sys.argv[1:] if a.isdigit()]           # 'build_edition.py 03' builds one paper (its own edition)
PAPERS = [(f, n) for f, n in PAPERS if (ROOT / f / 'MANUSCRIPT.md').exists() and (not ONLY or n in ONLY)]
EDITIONS = {'01': 'Draft 08', '02': 'Draft 08', '03': 'Draft 01', '04': 'Draft 01'}
DATE = '24 October 2026'
BYLINES = {'01': 'SOL-6.1 and Sonnet 5.5', '02': 'SOL-6.1 and Sonnet 5.5', '03': 'Fable 5.1', '04': 'Fable 5.1'}
SHORT = {'01': 'A Playable Quantum Field', '02': 'From Molecular Orbitals to Electronic Current', '03': 'The Leak and the Repair', '04': 'Knotted Zeros in Seven Levels'}   # running-head titles
PREAMBLE = r'''\documentclass[10pt,twocolumn]{article}
\usepackage[letterpaper,margin=0.72in,columnsep=0.26in]{geometry}
\usepackage[T1]{fontenc}
\usepackage{iftex}\ifPDFTeX\usepackage[utf8]{inputenc}\fi
\usepackage[type1]{libertine}
\usepackage{amsmath}
\usepackage[libertine]{newtxmath}
\usepackage{xcolor,graphicx,caption,sectsty,fancyhdr,hyperref,multicol}
\graphicspath{{../assets/pdf/}{../figures/}{figures/}}
\hypersetup{colorlinks=true,allcolors=white,pdfauthor={BYLINE},pdftitle={TITLE}}
\allsectionsfont{\sffamily\bfseries\raggedright\hyphenpenalty=10000 }   % no hyphenated headings
\captionsetup{font={small,sf},labelfont=bf}
% running head: the Magic Commons wordmark at top left, the paper's short title at top right; foot: byline, the lambdaWAVES logo at the centre, draft number and page number
\newcommand{\RunHead}{\fancyhead[L]{\raisebox{-0.1ex}{\includegraphics[height=0.125in]{magic-commons-dark.pdf}}}\fancyhead[R]{\small\sffamily SHORT}}
\newcommand{\RunFoot}{\fancyfoot[L]{\footnotesize\sffamily by BYLINE}\fancyfoot[C]{\raisebox{-0.5ex}{\includegraphics[height=0.2in]{lambdawaves-dark.pdf}}}\fancyfoot[R]{\footnotesize\sffamily EDITION \textbullet{} \thepage}}
\pagestyle{fancy}\fancyhf{}\RunHead\RunFoot
\fancypagestyle{plain}{\fancyhf{}\RunFoot\renewcommand{\headrulewidth}{0pt}}   % page 1: the masthead replaces the running head
\renewcommand{\headrulewidth}{0pt}
\setlength{\headheight}{16pt}\setlength{\headsep}{14pt}\setlength{\parskip}{2pt}
\makeatletter\setlength{\@dblfptop}{0pt}\setlength{\@dblfpsep}{12pt plus 1fil}\setlength{\@dblfpbot}{0pt plus 1fil}\setlength{\@fptop}{0pt}\setlength{\@fpsep}{10pt plus 1fil}\setlength{\@fpbot}{0pt plus 1fil}\makeatother   % float pages pack at the top; the white space falls below
\makeatletter   % bibliography list without its own heading, so the heading can span both columns
\newenvironment{lwbib}[1]{\list{\@biblabel{\@arabic\c@enumiv}}{\settowidth\labelwidth{\@biblabel{#1}}\leftmargin\labelwidth\advance\leftmargin\labelsep\usecounter{enumiv}\let\p@enumiv\@empty\renewcommand\theenumiv{\@arabic\c@enumiv}\setlength{\itemsep}{5pt}\setlength{\parsep}{0pt}}\sloppy\clubpenalty4000\@clubpenalty\clubpenalty\widowpenalty4000\sfcode`\.\@m}{\def\@noitemerr{\@latex@error{Empty lwbib environment}\@ehc}\endlist}
\makeatother
\setlength{\textfloatsep}{11pt plus 2pt minus 2pt}\setlength{\floatsep}{9pt plus 2pt minus 2pt}\setlength{\dbltextfloatsep}{11pt plus 2pt minus 2pt}\setlength{\intextsep}{9pt plus 2pt minus 2pt}
\raggedbottom\setlength{\parindent}{1em}\setlength{\emergencystretch}{1.5em}
\renewcommand{\topfraction}{0.9}\renewcommand{\dbltopfraction}{0.9}\renewcommand{\textfraction}{0.08}\renewcommand{\floatpagefraction}{0.8}\renewcommand{\dblfloatpagefraction}{0.8}
\renewcommand{\labelitemi}{\raisebox{.2ex}{\scriptsize$\bullet$}}
\renewcommand{\texttt}[1]{{\ttfamily\fontsize{8.4}{10}\selectfont #1}}   % monospace sits level with the Libertine x-height
\newcommand{\LW}{\ensuremath{\lambda}\textsc{waves}}
\newcommand{\Tr}{T_{\rho}}\newcommand{\Tp}{T_{\psi}}
\begin{document}\special{pdf:minorversion 7}\pagecolor{black}\color{white}\makeatletter\global\let\default@color\current@color\makeatother
'''
def plain(s):
    esc = {'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '#': r'\#', '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}', '^': r'\textasciicircum{}', '$': r'\$'}
    r = ''.join(esc.get(ch, ch) for ch in s)
    r = r.replace('λWAVES', r'\LW{}').replace('λ', r'\ensuremath{\lambda}').replace('H₂O', r'H\textsubscript{2}O').replace('–', '--').replace('—', '---').replace('·', r'\textbullet{} ').replace('“', '``').replace('”', "''").replace('’', "'").replace('×', r'$\times$').replace('→', r'$\rightarrow$').replace('…', r'\ldots{}').replace('§', r'\S{}').replace('\u00a0', '~')
    r = re.sub(r'Equations \((\d+)\) and \((\d+)\)', lambda m: r'Equations~\eqref{eq:' + m[1] + r'} and~\eqref{eq:' + m[2] + r'}', r)
    r = re.sub(r'Equations \((\d+)\)--\((\d+)\)', lambda m: r'Equations~\eqref{eq:' + m[1] + r'}--\eqref{eq:' + m[2] + r'}', r)
    r = re.sub(r'Equation \((\d+)\)', lambda m: r'Equation~\eqref{eq:' + m[1] + r'}', r)
    r = re.sub(r'Figures (\d+) and (\d+)', lambda m: r'Figures~\ref{fig:' + m[1] + r'} and~\ref{fig:' + m[2] + r'}', r)
    r = re.sub(r'Figure (\d+)', lambda m: r'Figure~\ref{fig:' + m[1] + r'}', r)
    r = re.sub(r'Table (\d+)', lambda m: r'Table~\ref{tab:' + m[1] + r'}', r)
    r = re.sub(r'Section (\d+)', lambda m: r'Section~\ref{sec:' + m[1] + r'}', r)
    r = re.sub(r' ?\[(\d+(?:,\s*\d+)*)\]', lambda m: r'~\cite{' + ','.join('ref' + x.strip() for x in m[1].split(',')) + '}', r)
    return r
BIB_MAP = {}
def inline(s, with_cite=True):
    pats = re.compile(r'(\$[^$\n]+\$|`[^`]+`|\[[^\]]+\]\(https?://[^)]+\)|\*\*[^*]+\*\*|(?<![\w*])\*[^*\s][^*]*[^*\s]\*(?![\w*])|(?<![\w*])\*[^*\s]\*(?![\w*]))')
    parts = []; start = 0
    for m in pats.finditer(s):
        parts.append(plain(s[start:m.start()])); token = m.group()
        if token.startswith('$'): parts.append(token)
        elif token.startswith('`'):
            lit = token[1:-1]
            parts.append(r'\texttt{' + (r'\allowbreak{}'.join(lit[k:k + 8] for k in range(0, len(lit), 8)) if re.fullmatch(r'[0-9a-f]{32,64}', lit) else plain(lit)) + r'}')
        elif token.startswith('**'): parts.append(r'\textbf{' + inline(token[2:-2], with_cite) + r'}')
        elif token.startswith('*'): parts.append(r'\emph{' + inline(token[1:-1], with_cite) + r'}')
        else:
            k = re.fullmatch(r'\[([^\]]+)\]\(([^)]+)\)', token)
            label = inline(k[1], False)
            if re.match(r'(doi:|arXiv:|[a-z.]+\.(com|org|edu|gov)/)', k[1]): label = label.replace('/', r'/\allowbreak{}')   # printed identifiers may break at slashes
            rendered = r'\href{' + k[2].replace('%', r'\%').replace('#', r'\#') + r'}{' + label + r'}'
            if with_cite and k[2] in BIB_MAP: rendered += r'~\cite{' + BIB_MAP[k[2]] + r'}'
            parts.append(rendered)
        start = m.end()
    parts.append(plain(s[start:])); return ''.join(parts)

def graphics(imgs, wide):
    """imgs: [(path, fraction)] -> includegraphics side by side"""
    out = []
    unit = r'\textwidth' if wide else r'\columnwidth'
    for k, (path, frac) in enumerate(imgs):
        if k: out.append(r'\hfill')
        out.append(r'\includegraphics[width=' + str(frac) + unit + ']{' + Path(path).name + '}')
    return ''.join(out)

def convert(folder, num):
    global BIB_MAP
    md = (ROOT / folder / 'MANUSCRIPT.md'); src = md.read_text(); lines = src.splitlines()
    title = lines[0][2:]
    refs = [l[2:] for l in src.split('## References\n', 1)[1].splitlines() if l.startswith('- ')]
    BIB_MAP = {url: 'ref' + str(k) for k, l in enumerate(refs, 1) for url in re.findall(r'\]\((https?://[^)]+)\)', l)}
    BYLINE = BYLINES[num]; EDITION = EDITIONS[num]
    assert lines[2] == 'by ' + BYLINE, ('byline line must read: by ' + BYLINE, lines[2])
    assert lines[4].startswith('Magic Commons · AI-generated technical paper · ' + EDITION + ' · ' + DATE), ('series line must start with the constants', lines[4])
    tex = PREAMBLE.replace('TITLE', plain(title.replace('λWAVES', 'lambdaWAVES'))).replace('BYLINE', BYLINE).replace('SHORT', plain(SHORT[num])).replace('EDITION', EDITION)
    # --- opening block: masthead + first figure
    idx = 6; first_imgs = []
    while lines[idx].startswith('!['):
        m = re.fullmatch(r'!\[(\w+)\]\(([^)]+)\)(?:\{([\d.]+)\})?', lines[idx]); first_imgs.append((m[2], m[3] or '1.0')); idx += 1
    cap = re.fullmatch(r'> \*\*Figure 1 — (.+?)\.\*\* (.+)', lines[idx]); assert cap, ('first figure caption', lines[idx])
    tex += r'\twocolumn[{\begin{@twocolumnfalse}' + '\n'
    tex += r'\noindent\includegraphics[height=0.22in]{magic-commons-dark.pdf}\par\vspace{8pt}' + '\n'
    tex += r'\noindent\includegraphics[height=0.52in]{lambdawaves-dark.pdf}\par\vspace{7pt}' + '\n'
    tex += r'\noindent\includegraphics[width=0.92\textwidth]{paper-' + num + r'.pdf}\par' + '\n' + r'\vspace{8pt}{\sffamily\large\textbf{by ' + BYLINE + r'}\par}' + '\n'
    tex += r'\vspace{2pt}{\small\sffamily \LW{} application created by Joshua~Hosain\par}' + '\n'
    tex += r'\vspace{3pt}{\small\sffamily Magic Commons \textbullet{} AI-generated technical paper \textbullet{} ' + EDITION + r' \textbullet{} ' + DATE + r'\par}' + '\n'
    tex += r'\vspace{9pt}\noindent\centering ' + graphics(first_imgs, True) + r'\par\vspace{2pt}' + '\n'
    tex += r'\captionof{figure}{\textbf{' + inline(cap[1]) + r'.} ' + inline(cap[2]) + r'}\label{fig:1}' + '\n' + r'\vspace{6pt}\end{@twocolumnfalse}}]\thispagestyle{plain}' + '\n'
    inmath = inlist = inabstract = inbib = incredits = False; bibnum = eqnum = table_count = secnum = 0; tablecap = None; tablecols = None; tablewide = False; pending = []; credit_lines = []
    it = iter(lines[idx + 1:])
    for line in it:
        if incredits: credit_lines.append(line); continue
        if line.startswith('!['):
            m = re.fullmatch(r'!\[(\w+)\]\(([^)]+)\)(?:\{([\d.]+)\})?', line); assert m, ('image line', line)
            pending.append((m[1], m[2], m[3] or '1.0')); continue
        if line.startswith('<!-- '):
            cm = re.fullmatch(r'<!-- (wide )?cols: ([\d. ]+) -->', line)
            if cm: tablewide = bool(cm[1]); tablecols = [float(x) for x in cm[2].split()]
            continue
        if line.startswith('**Table '):
            tablecap = re.fullmatch(r'\*\*Table (\d+) — (.+?)\.\*\* (.+)', line); assert tablecap, ('Table caption', line); continue
        if line.startswith('|') and not inmath:
            assert tablecap, ('table without caption', line)
            rows = [line]
            for nl in it:
                if nl.startswith('|'): rows.append(nl)
                else: assert nl == '', ('table must end at a blank line', nl); break
            cells = [[c.strip() for c in row.strip('|').split('|')] for row in rows]; nc = len(cells[0]); assert all(len(r) == nc for r in cells) and all(re.fullmatch(r':?-+:?', c) for c in cells[1])
            fr = tablecols or [1 / nc] * nc; assert len(fr) == nc, ('column widths', fr, nc)
            unit = r'\textwidth' if tablewide else r'\columnwidth'
            colspec = ''.join(r'p{\dimexpr' + str(f) + unit + r'-2\tabcolsep\relax}' for f in fr)
            env = 'table*' if tablewide else 'table'
            tex += r'\begin{' + env + r'}[!tb]\centering' + (r'\footnotesize' if tablecap[2].startswith('What supports what') else r'\small') + r'\setlength{\tabcolsep}{3pt}\renewcommand{\arraystretch}{1.12}' + '\n'
            tex += r'\caption{\textbf{' + inline(tablecap[2]) + r'.} ' + inline(tablecap[3]) + r'}\label{tab:' + tablecap[1] + r'}' + '\n'
            tex += r'\begin{tabular}{' + colspec + r'}\hline' + '\n' + ' & '.join(CELL + r'\textbf{' + inline(c) + '}' for c in cells[0]) + r'\\\hline' + '\n'
            for row in cells[2:]: tex += ' & '.join(CELL + inline(c) for c in row) + r'\\' + '\n'
            tex += r'\hline\end{tabular}\end{' + env + '}\n'; tablecap = None; tablecols = None; tablewide = False; table_count += 1; continue
        if line.startswith('> **Figure '):
            m = re.fullmatch(r'> \*\*Figure (\d+) — (.+?)\.\*\* (.+)', line); assert m, ('Figure caption', line); n = int(m[1]); assert pending, ('figure without image', line)
            wide = pending[0][0] == 'wide'; env = 'figure*' if wide else 'figure'
            tex += r'\begin{' + env + r'}[!tb]\centering' + graphics([(p, f) for _, p, f in pending], wide) + '\n' + r'\caption{\textbf{' + inline(m[2]) + r'.} ' + inline(m[3]) + r'}\label{fig:' + str(n) + r'}\end{' + env + '}\n'; pending = []; continue
        if line.startswith('> **') and not line.startswith('> **Figure'):
            tex += r'\begin{quote}\small ' + inline(line[2:]) + r'\end{quote}' + '\n'; continue
        if line == '$$':
            assert not inlist
            if inmath: tex += r'\end{equation}' + '\n'
            else: eqnum += 1; tex += r'\begin{equation}\label{eq:' + str(eqnum) + '}\n'
            inmath = not inmath; continue
        if inmath:
            tag = re.fullmatch(r'\s*\\tag\{(\d+)\}\s*', line)
            if tag: assert int(tag[1]) == eqnum, ('equation tag', tag[1], eqnum)
            else: tex += line + '\n'
            continue
        if line.startswith('### '):
            tex += r'\subsection{' + inline(re.sub(r'^\d+(?:\.\d+)*\.?\s*', '', line[4:])) + r'}' + '\n'; continue
        if line.startswith('## '):
            if inlist: tex += r'\end{itemize}' + '\n'; inlist = False
            if inabstract: tex += r'\end{abstract}' + '\n'; inabstract = False
            h = line[3:]
            if h == 'Abstract': tex += r'\begin{abstract}\noindent' + '\n'; inabstract = True
            elif h == 'References':   # own page; heading across both columns, entries balanced in two
                tex += r'\clearpage\onecolumn' + '\n' + r'\begin{multicols}{2}[\section*{References}\vspace{3pt}]' + '\n'
                tex += r'\normalsize\raggedright\begin{lwbib}{99}' + '\n'; inbib = True
            elif h == 'Credits':      # closing page, built from the Markdown by credits_tex()
                if inbib: tex += r'\end{lwbib}\end{multicols}' + '\n'; inbib = False
                incredits = True
            else: secnum += 1; tex += r'\section{' + inline(re.sub(r'^\d+\.\s*', '', h)) + r'}\label{sec:' + str(secnum) + r'}' + '\n'
        elif line.startswith('- '):
            if inbib: bibnum += 1; tex += r'\bibitem{ref' + str(bibnum) + r'} ' + inline(line[2:], False) + '\n'
            else:
                if not inlist: tex += r'\begin{itemize}\setlength{\itemsep}{3pt}' + '\n'; inlist = True
                tex += r'\item ' + inline(line[2:]) + '\n'
        else:
            if inlist and line == '': tex += r'\end{itemize}' + '\n'; inlist = False
            tex += inline(line) + '\n'
    assert not inmath and tablecap is None and not pending
    if inlist: tex += r'\end{itemize}' + '\n'
    if inabstract: tex += r'\end{abstract}' + '\n'
    if inbib: tex += r'\end{lwbib}\end{multicols}' + '\n'
    assert incredits, 'the manuscript must end with a ## Credits section'
    tex += credits_tex(credit_lines)
    tex += r'\end{document}' + '\n'
    (ROOT / folder / 'MANUSCRIPT.tex').write_text(tex)
    return dict(paper=folder, title=title, words=len(src.split()), equations=eqnum, tables=table_count, references=bibnum, tex_sha256=hashlib.sha256(tex.encode()).hexdigest(), md_sha256=hashlib.sha256(src.encode()).hexdigest(), credits='\n'.join(l for l in credit_lines if l.strip()))

CELL = r'\raggedright\let\\\tabularnewline '

# --- the closing credits page, one block per "### " heading of the manuscript's ## Credits section
CREDIT_ART = {'People': 'people.pdf', 'With Thanks': 'with-thanks.pdf', 'Credits & Licenses': 'credits-licenses.pdf'}
CREDIT_LARGE = {'People': 2, 'With Thanks': 1, 'Credits & Licenses': 0}   # how many leading paragraphs are set large
AI_LOGOS = (r'{\setlength{\tabcolsep}{20pt}\begin{tabular}{ccc}' + '\n'
    + r'\includegraphics[height=0.27in]{claude-dark.pdf} & \includegraphics[height=0.25in]{gemini.pdf}\,\includegraphics[height=0.26in]{gemini-word.pdf} & \includegraphics[height=0.31in]{openai-blossom-dark.pdf}\,\includegraphics[height=0.25in]{gpt-word.pdf}\\[5pt]' + '\n'
    + r'\small\sffamily Anthropic & \small\sffamily Google & \small\sffamily OpenAI\end{tabular}}')

def credits_tex(lines):
    blocks = []; cur = None
    for l in lines:
        if l.startswith('### '): cur = (l[4:].strip(), []); blocks.append(cur); continue
        if cur is None: assert not l.strip(), ('text before the first credits block', l); continue
        if l.strip(): cur[1].append(l.strip())
    assert [b[0] for b in blocks] == list(CREDIT_ART), ('credits blocks', [b[0] for b in blocks])
    out = r'\clearpage\onecolumn' + '\n' + r'\thispagestyle{fancy}\begin{center}\vspace*{\stretch{0.55}}' + '\n'
    for k, (name, paras) in enumerate(blocks):
        out += r'\includegraphics[height=0.42in]{' + CREDIT_ART[name] + r'}\par\vspace{11pt}' + '\n' + r'\begin{minipage}{0.74\textwidth}\centering\sffamily' + '\n'
        for j, p in enumerate(paras):
            out += (r'\large ' if j < CREDIT_LARGE[name] else r'\small ') if p != '<!-- ai-logos -->' else ''
            out += (AI_LOGOS + r'\par\vspace{9pt}' if p == '<!-- ai-logos -->' else inline(p, False) + r'\par\vspace{8pt}') + '\n'
        out += r'\end{minipage}\par' + '\n' + (r'\vspace{\stretch{1}}' if k < len(blocks) - 1 else r'\vspace{\stretch{0.7}}') + '\n'
    out += r'\includegraphics[height=0.2in]{magic-commons-dark.pdf}\par' + '\n' + r'\vspace*{\stretch{0.25}}\end{center}' + '\n'
    return out

def compile_one(folder):
    d = ROOT / folder; t0 = time.time()
    r = subprocess.run(['/home/joshua-hosain/bin/tectonic', '--only-cached', '--keep-logs', '--keep-intermediates', 'MANUSCRIPT.tex'], cwd=d, capture_output=True, text=True)
    if r.returncode != 0 and ('not loadable' in r.stderr or ".sty' not found" in r.stderr):   # an uncached standard font metric (e.g. Libertine italic) or package (e.g. multicol): let the compiler fetch it into its own cache once
        r = subprocess.run(['/home/joshua-hosain/bin/tectonic', '--keep-logs', '--keep-intermediates', 'MANUSCRIPT.tex'], cwd=d, capture_output=True, text=True)
    (ROOT / 'logs').mkdir(exist_ok=True); (ROOT / 'logs' / (folder[:2] + '-compile.txt')).write_text(r.stdout + '\n' + r.stderr)
    ok = r.returncode == 0 and (d / 'MANUSCRIPT.pdf').exists()
    return dict(paper=folder, exit_code=r.returncode, seconds=round(time.time() - t0, 1), ok=ok, stderr_tail=r.stderr[-600:])

if __name__ == '__main__':
    docs = [convert(f, n) for f, n in PAPERS]
    assert len({d['credits'] for d in docs}) == 1, 'the Credits blocks of the papers differ'   # one credits page for the whole edition
    for d in docs: d.pop('credits')
    print(json.dumps(docs, indent=1))
    if '--no-compile' not in sys.argv:
        res = [compile_one(f) for f, _ in PAPERS]; print(json.dumps(res, indent=1))
        (ROOT / 'output' / 'pdf').mkdir(parents=True, exist_ok=True)
        names = {'01': '01-Lambdawaves-A-Playable-Quantum-Field.pdf', '02': '02-From-Molecular-Orbitals-to-Electronic-Current.pdf', '03': '03-The-Leak-and-the-Repair.pdf', '04': '04-Knotted-Zeros-in-Seven-Levels.pdf'}
        for (f, n), r_ in zip(PAPERS, res):
            if r_['ok']: shutil.copyfile(ROOT / f / 'MANUSCRIPT.pdf', ROOT / 'output' / 'pdf' / names[n])
    (ROOT / 'logs' / 'build_summary.json').write_text(json.dumps({'documents': docs}, indent=1))
