"""fetch_wikidata.py — SOURCE 5a, WIKIDATA (CC0): every item with a PubChem CID (P662) and an English Wikipedia article,
with its sitelink count (how many Wikipedias carry it — the catalogue's RECOGNISABILITY measure) and its article title
(a common name as people say it), plus each item's 'has use' (P366) and 'instance of' (P31) labels for tags and screens.
Asked through the QLever SPARQL endpoint (qlever.dev, which answers the whole-graph join in seconds where
query.wikidata.org times out); answers cached by common.fetch."""
import csv, io, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import CACHE, fetch, write_json

EP = 'https://qlever.dev/api/wikidata'
PFX = '''PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
'''
def sparql(q):
    st, data = fetch(EP + '?' + urllib.parse.urlencode({'query': PFX + q}), accept='text/csv', timeout=300)
    if st != 200: raise SystemExit(f'QLever answered {st}: {data[:300]}')
    return list(csv.DictReader(io.StringIO(data.decode('utf-8'))))

ENWIKI = '?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?title .'
items = sparql(f'SELECT ?item ?cid ?n ?title WHERE {{ ?item wdt:P662 ?cid . ?item wikibase:sitelinks ?n . {ENWIKI} }}')
uses = sparql(f'SELECT ?item ?use ?label WHERE {{ ?item wdt:P662 ?cid ; wdt:P366 ?use . {ENWIKI} ?use rdfs:label ?label . FILTER(LANG(?label)="en") }}')
kinds = sparql(f'SELECT ?item ?kind ?label WHERE {{ ?item wdt:P662 ?cid ; wdt:P31 ?kind . {ENWIKI} ?kind rdfs:label ?label . FILTER(LANG(?label)="en") }}')
q = lambda u: u.rsplit('/', 1)[-1]
by_item = {}
for r in items:
    it = by_item.setdefault(q(r['item']), {'item': q(r['item']), 'cids': [], 'sitelinks': int(r['n']), 'title': r['title'], 'uses': [], 'kinds': []})
    if r['cid'].isdigit() and int(r['cid']) not in it['cids']: it['cids'].append(int(r['cid']))
for r in uses:
    it = by_item.get(q(r['item']))
    if it and r['label'] not in it['uses']: it['uses'].append(r['label'])
for r in kinds:
    it = by_item.get(q(r['item']))
    if it and r['label'] not in it['kinds']: it['kinds'].append(r['label'])
os.makedirs(os.path.join(CACHE, 'wikidata'), exist_ok=True)
write_json(os.path.join(CACHE, 'wikidata', 'enwiki-compounds.json'), {'source': 'Wikidata via QLever (qlever.dev/api/wikidata)', 'licence': 'CC0 1.0', 'items': list(by_item.values())})
print(f'wikidata: {len(by_item)} items with a CID and an English Wikipedia article; {sum(len(i["cids"]) for i in by_item.values())} CIDs; '
      f'{sum(1 for i in by_item.values() if i["uses"])} with a has-use')
