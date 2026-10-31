#!/usr/bin/env python
"""Query the requested interpreter's BSE package; never download or vendor a basis."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'tools/library/census'
r={'status':'MEASURED','pythonExecutable':sys.executable,'isolatedMode':bool(sys.flags.isolated),'numericTagging':'Atomic numbers DERIVED identifiers; package queries MEASURED. Null coverage is UNVERIFIED with the recorded reason.','atomicNumbers':[53,54],'basis':'STO-3G','importable':False,'coverage':None,'coverageStatus':'UNVERIFIED','vendoredAnything':False}
try:
    import basis_set_exchange as bse
    r['importable']=True;r['version']=bse.__version__;r['coverage']={};r['coverageStatus']='MEASURED'
    for z in r['atomicNumbers']:
        try:r['coverage'][str(z)]={'status':'MEASURED','covered':str(z) in bse.get_basis('STO-3G',elements=[z])['elements']}
        except Exception as ex:r['coverage'][str(z)]={'status':'UNVERIFIED','covered':None,'why':str(ex)}
except Exception as ex:r['why']=type(ex).__name__+': '+str(ex)
name='bse-coverage-isolated.json' if r['isolatedMode'] else 'bse-coverage-plain.json'
with (OUT/name).open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
print(json.dumps(r))
