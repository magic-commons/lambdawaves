"""fetch_who_eml.py — SOURCE 5b, THE WHO MODEL LIST OF ESSENTIAL MEDICINES, as its English Wikipedia article lists it (the
24th list, 2025, item by item).  Only the medicine NAMES are taken — facts, each resolved later through PubChem — from the
article's bulleted items (both halves of a combination, "[[a]] + [[b]]").  Writes cache/who-eml.json."""
import json, os, re, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import CACHE, fetch_json, write_json

API = 'https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'parse', 'page': 'WHO Model List of Essential Medicines',
                                                                     'prop': 'wikitext|revid', 'format': 'json', 'formatversion': 2})
st, d = fetch_json(API)
text, revid = d['parse']['wikitext'], d['parse'].get('revid')
body = re.split(r'\n==\s*(Notes|References|See also|External links)\s*==', text)[0]
names, section = {}, None
for line in body.split('\n'):
    h = re.match(r'^(=+)\s*(.*?)\s*\1\s*$', line)
    if h: section = h.group(2); continue
    if not line.startswith('*'): continue
    line = re.sub(r'<ref[^>]*/>|<ref[^>]*>.*?</ref>', '', line)
    for target, label in re.findall(r'\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]', line):
        t = target.strip()
        if t.startswith(('File:', 'ATC code', 'Category:')): continue
        names.setdefault(t, {'name': t, 'label': (label or t).strip(), 'sections': []})
        if section and section not in names[t]['sections']: names[t]['sections'].append(section)
write_json(os.path.join(CACHE, 'who-eml.json'), {'source': f'English Wikipedia "WHO Model List of Essential Medicines", revision {revid}',
                                                 'licence': 'names only (facts); article text CC BY-SA 4.0 not reproduced', 'items': list(names.values())})
print(f'WHO EML: {len(names)} linked names from revision {revid}')
