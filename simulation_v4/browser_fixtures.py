from pathlib import Path
import json,copy
import numpy as np
import unified_controller as u
import train
HERE=Path(__file__).resolve().parent
rows=[];cfg=train.CFG;w=u.World(cfg)
policies=[('initial',u.INITIAL),('reference',u.REFERENCE)]
campaign=json.loads((HERE/'campaign/results.json').read_text())
if campaign['status']=='training_complete':policies.append(('final',campaign['selectedParameters']))
for i,case in enumerate(train.cases(2026111801,4)):
 for label,p in policies:
  steps=[];original=u.UnifiedPolicy.command
  def measured(self,state,contact):
   force,torque,fan=original(self,state,contact);steps.append({'state':copy.deepcopy(state),'contact':copy.deepcopy(contact),'force':force,'torque':torque,'fan':fan,'goal':copy.deepcopy(self.goal)});return force,torque,fan
  u.UnifiedPolicy.command=measured
  try:r=u.rollout(p,case,cfg,True,w)
  finally:u.UnifiedPolicy.command=original
  rows.append({'label':label,'parameters':np.asarray(p).tolist(),'steps':steps,'result':r});print(case['id'],label,r['status'],flush=True)
text=json.dumps({'config':cfg,'rows':rows},default=lambda x:x.tolist() if isinstance(x,np.ndarray) else x.item(),separators=(',',':'));(HERE/'browser-fixtures.json').write_text(text)
