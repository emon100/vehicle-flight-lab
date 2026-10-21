import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadEngine} from '../simulation_v4/browser-runtime.mjs';
import {createDrivingSimulation,MAP} from '../sandbox/driving-core.mjs';
import {PARKED_VEHICLES,JUMP_LANE,vehicleHull,parkedVehiclesXML} from '../sandbox/driving-obstacles.mjs';
import {pedalFor} from './driving-test-driver.mjs';
const root=new URL('../simulation_v4/',import.meta.url),cfg=JSON.parse(fs.readFileSync(new URL('config.json',root))),params=JSON.parse(fs.readFileSync(new URL('manifest.json',root))).final,xml=fs.readFileSync(new URL('world.xml',root),'utf8'),engine=await loadEngine(),report={vehicles:PARKED_VEHICLES.map(({id,label,x,y,height})=>({id,label,x,y,height})),trials:[]};
assert.equal(PARKED_VEHICLES.length,3);assert(JUMP_LANE.start>-MAP.halfX+30&&JUMP_LANE.end<MAP.halfX-30);
for(const car of PARKED_VEHICLES)for(const hull of car.hulls){const {vertices,faces}=vehicleHull(hull),edges=new Map();for(let i=0;i<faces.length;i+=3)for(let j=0;j<3;j++){const e=[faces[i+j],faces[i+(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(e,(edges.get(e)||0)+1);}assert([...edges.values()].every(n=>n===2),'Collision/render hull must be closed');assert(vertices.every(Number.isFinite));}
assert(parkedVehiclesXML().geoms.includes('parked_high_target_0'));
for(const {kickEnabled,kmh} of [{kickEnabled:false,kmh:80},{kickEnabled:true,kmh:80},{kickEnabled:true,kmh:100}]){
 const sim=await createDrivingSimulation(cfg,params,{engine,xml,assist:true});let f=sim.reset({pos:[-80,JUMP_LANE.y,.5],vel:[kmh/3.6,0,0]}),launched=null,contact=null,passed=0,low=Infinity,frames=[];
 for(let i=0;i<700;i++){
  const kick=kickEnabled&&launched===null&&f.pos[0]>=JUMP_LANE.takeoff&&f.canKick;
  if(kick)launched={x:f.pos[0],t:f.t,speed:f.speed};f=await sim.step({throttle:launched===null?pedalFor(f,kmh/3.6):0,kick});
  assert.equal(f.resetSerial,1,'The jump corridor must not cause a boundary reset');
  if(i%5===0)frames.push({t:f.t,x:f.pos[0],z:f.pos[2],up:f.R[2][2],minZ:f.geometryClearance,body:f.contact.bodyContact,road:f.contact.onRamp});
  if(f.contact.bodyContact||f.contact.onRamp){contact??={t:f.t,pos:f.pos,body:f.contact.bodyContact};if(!kickEnabled)break;}
  for(const car of PARKED_VEHICLES)if(f.pos[0]>car.x+car.width/2+2.1)passed=Math.max(passed,PARKED_VEHICLES.indexOf(car)+1);
  if(Math.abs(f.pos[0]-PARKED_VEHICLES.find(c=>c.id==='high_target').x)<3.5)low=Math.min(low,f.geometryClearance);
  if(launched&&f.lastAction)break;
 }
 const trial={kmh,kickEnabled,launched,contact,passed,lowestOverHighTarget:low,landing:f.lastAction?.status,finalPos:f.pos,runout:MAP.halfX-MAP.edgeMargin-f.pos[0]};report.trials.push(trial);console.log(trial);
 if(!kickEnabled)assert(contact?.body,'The parked cars must physically stop a ground-level approach');
 else{assert(launched);assert.equal(contact,null,'The marked 80 km/h jump must clear all parked cars');assert.equal(passed,3);assert(f.lastAction?.success,'The marked jump must land');assert(trial.runout>150,'Leave a long clear runout after landing');}
 fs.writeFileSync(new URL(`./qa-jump-${kickEnabled?'flight':'collision'}-${kmh}-20261022.json`,import.meta.url),JSON.stringify(frames));sim.dispose();
}
fs.writeFileSync(new URL('./qa-driving-jump-cars-20261022.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
