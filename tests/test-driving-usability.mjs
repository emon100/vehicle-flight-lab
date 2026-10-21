import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadEngine} from '../simulation_v4/browser-runtime.mjs';
import {createDrivingSimulation,MAP,RAMPS,SPAWN,rampPose} from '../sandbox/driving-core.mjs';
const folder=new URL('../simulation_v4/',import.meta.url),cfg=JSON.parse(fs.readFileSync(new URL('config.json',folder))),params=JSON.parse(fs.readFileSync(new URL('manifest.json',folder))).final,xml=fs.readFileSync(new URL('world.xml',folder),'utf8'),engine=await loadEngine(),make=options=>createDrivingSimulation(cfg,params,{engine,xml,...options});
const ramp=RAMPS.find(r=>r.id==='ceiling');assert.equal(SPAWN[0],ramp.x-ramp.approach+5);assert.equal(SPAWN[1],ramp.y);
const report={cornering:[],resetReminder:{},spawn:SPAWN};
// Move this stress test outside obstacles and extend only its boundary, so respawning cannot hide a rollover.
const bounds=[MAP.halfX,MAP.halfY];MAP.halfX=MAP.halfY=12000;
try{
 for(const startKmh of [0,100])for(const downforce of [false,true])for(const steer of [-1,1]){
  const sim=await make({downforce,assist:false});let f=sim.reset({pos:[-6000,steer*6000,.5]}),started=null,maxTilt=0,minHeight=1,maxSpeed=0;
  for(let i=0;i<3500;i++){
   if(started===null&&f.speed>=startKmh)started=f.t;
   f=await sim.step({throttle:1,steer:started===null?0:steer});
   assert.equal(f.resetSerial,1,'No respawn may hide a failed corner');assert(Math.abs(f.pos[0])>200||Math.abs(f.pos[1])>200,'Stress route must stay outside all ramp footprints');assert(!f.contact.onRamp);assert(!f.contact.bodyContact,'Flat-ground cornering must not strike the body: '+JSON.stringify({startKmh,downforce,steer,t:f.t,pos:f.pos,speed:f.speed,up:f.R[2][2],omega:f.omega}));
   assert(f.R[2][2]>.94,'Sustained full steering must not lift the body toward a rollover');assert(!f.needsReset);assert(f.nozzleForces.every(v=>v===0),'No jets may mask steering stability');
   maxTilt=Math.max(maxTilt,Math.acos(Math.min(1,f.R[2][2]))*180/Math.PI);minHeight=Math.min(minHeight,f.pos[2]);maxSpeed=Math.max(maxSpeed,f.speed);
  }
  assert(started!==null&&f.t-started>60);report.cornering.push({startKmh,downforce,steer,seconds:f.t-started,maxTiltDeg:maxTilt,maxSpeedKmh:maxSpeed,minHeight});sim.dispose();
 }
}finally{[MAP.halfX,MAP.halfY]=bounds;}
const upside=await make({assist:false});let f=upside.reset({pos:[-110,25,2],quat:[0,1,0,0]});
for(let i=0;i<190;i++){f=await upside.step();assert(!f.needsReset,'Do not interrupt a brief flip');}
for(let i=0;i<60;i++)f=await upside.step();assert(f.needsReset);assert.equal(f.resetSerial,1,'The warning must not reset the pose');assert(f.R[2][2]<0);
f=upside.recenter();assert(!f.needsReset);assert.deepEqual(f.pos,SPAWN);report.resetReminder.overturnedAfter4Seconds=true;report.resetReminder.manualResetClears=true;upside.dispose();
const invertedRamp=await make({assist:false,downforce:true}),pose=rampPose(ramp,ramp.length-4);
f=invertedRamp.reset({pos:pose.surface.map((v,i)=>v+.5*pose.normal[i]),quat:pose.quat});
for(let i=0;i<300;i++){f=await invertedRamp.step();assert(!f.needsReset,'Supported inverted ramp travel is not an overturned car');}
assert(f.contact.onRamp&&f.R[2][2]<-.9);report.resetReminder.supported170DegreeRampIgnored=true;invertedRamp.dispose();
fs.writeFileSync(new URL('./qa-driving-usability-20261022.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
