#!/usr/bin/env python
"""Screen named connectivity against saved final coordinates; no solves or lab writes."""
import ast,json,math,re,sys
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/release-0.4.0/library-census'
tree=ast.parse((ROOT/'tools/library/prepare.py').read_text())
parser=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='smiles_graph')
exec(compile(ast.Module(body=[parser],type_ignores=[]),'checked-smiles-parser','exec'))
Z={'H':1,'B':5,'C':6,'N':7,'O':8,'F':9,'Si':14,'P':15,'S':16,'Cl':17}
radii={1:.31,5:.84,6:.76,7:.71,8:.66,9:.57,14:1.11,15:1.07,16:1.05,17:1.02}
if '--rows' in sys.argv:
    inputs=json.loads((OUT/'census-input.json').read_text())['rows']
    def checkpoint(r):
        for suffix in ['-geometry-refined','-refined','']:
            p=OUT/'rows'/(r['id']+suffix+'.json')
            if p.exists():return json.loads(p.read_text())
    rows=[checkpoint(r) for r in inputs if (OUT/'rows'/(r['id']+'.json')).exists()]
else:rows=json.loads((OUT/'census.json').read_text())['rows']
checks=[]
for r in rows:
    if not(r['optimise'] and r.get('smiles')):continue
    atoms,bonds=smiles_graph(r['smiles']);geo=np.array(r['geometry']['atomsAngstrom'])
    assert [Z[a['symbol']] for a in atoms]==geo[:,0].tolist(),r['id']+' atom order'
    ratios=[];flags=[]
    for i,j,order in bonds:
        d=float(np.linalg.norm(geo[i,1:]-geo[j,1:]));ratio=d/(radii[int(geo[i,0])]+radii[int(geo[j,0])]);ratios.append(ratio)
        if ratio>1.5 or ratio<.65:flags.append({'atoms':[i,j],'distanceAngstrom':d,'covalentRadiusSumRatio':ratio})
    checks.append({'id':r['id'],'status':'DERIVED from MEASURED final coordinates','expectedBondCount':len(bonds),'maxExpectedBondRadiusRatio':max(ratios),'flaggedBonds':flags,'screenPass':not flags})
pair=next((r for r in rows if r['id']=='G-C'),None);contacts=[]
if pair:
    geo=np.array(pair['geometry']['atomsAngstrom']);ng=16
    for donor,acceptor,label in [(ng,9,'C N4-H to G O6'),(10,ng+7,'G N1-H to C N3'),(0,ng+6,'G N2-H to C O2')]:
        hs=[i for i,a in enumerate(geo) if a[0]==1 and np.linalg.norm(a[1:]-geo[donor,1:])<1.3]
        if hs:
            h=min(hs,key=lambda i:np.linalg.norm(geo[i,1:]-geo[acceptor,1:]));u=geo[donor,1:]-geo[h,1:];v=geo[acceptor,1:]-geo[h,1:]
            angle=math.degrees(math.acos(np.clip(u@v/(np.linalg.norm(u)*np.linalg.norm(v)),-1,1)))
            contacts.append({'label':label,'donorIndex':donor,'hydrogenIndex':h,'acceptorIndex':acceptor,'donorAcceptorAngstrom':float(np.linalg.norm(geo[donor,1:]-geo[acceptor,1:])),'hydrogenAcceptorAngstrom':float(np.linalg.norm(v)),'donorHydrogenAcceptorDegrees':angle})
result={'status':'DERIVED','numericStatus':'Counts, indices, distances, ratios and angles DERIVED from saved MEASURED coordinates. Thresholds and covalent radii are UNVERIFIED heuristics for a broad screen, not experimental validations.','scope':'Named built SMILES connectivity only; references/cages/clusters excluded. No chemical, conformer, stereochemical, vibrational or experimental certification.','thresholds':{'status':'UNVERIFIED','ratioRange':[.65,1.5],'why':'Broad bond-distance heuristic; a flag requires review, and a pass is not a bond-order or tautomer proof.'},'checkedRows':len(checks),'flaggedRows':[c['id'] for c in checks if not c['screenPass']],'checks':checks,'GCContactStatus':'UNVERIFIED Watson-Crick validation; geometric contact metrics are DERIVED observations only','GCContacts':contacts}
if '--rows' in sys.argv:print(json.dumps(result))
else:
    with (OUT/'geometry-audit.json').open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({'status':'DERIVED','checkedRows':len(checks),'flaggedRows':result['flaggedRows'],'GCContacts':contacts}))
