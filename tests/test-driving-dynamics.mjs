import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadEngine} from '../simulation_v4/browser-runtime.mjs';
import {createDrivingSimulation,RAMPS} from '../sandbox/driving-core.mjs';
import {wheelDrive,DRIVE} from '../sandbox/driving-powertrain.mjs';
import {pedalFor} from './driving-test-driver.mjs';
const root=new URL('../simulation_v4/',import.meta.url),cfg=JSON.parse(fs.readFileSync(new URL('config.json',root))),params=JSON.parse(fs.readFileSync(new URL('manifest.json',root))).final,xml=fs.readFileSync(new URL('world.xml',root),'utf8'),engine=await loadEngine(),results={assumptions:DRIVE};
const make=options=>createDrivingSimulation(cfg,params,{engine,xml,assist:false,...options});
const state=v=>({vel:[v,0,0],R:[[1,0,0],[0,1,0],[0,0,1]],mass:2000,omega:[0,0,0],wheelRates:Array(4).fill(v/.32),wheelSteering:[0,0,0,0]});
const contact={averageWheelLoads:[5000,5000,5000,5000]},low=wheelDrive(state(20),contact,{pedal:1},cfg),high=wheelDrive(state(60),contact,{pedal:1},cfg);
assert(high.motorPower<=DRIVE.peakPower+1e-6);assert(high.torques.reduce((a,b)=>a+b,0)<low.torques.reduce((a,b)=>a+b,0),'Power limit must reduce high-speed torque');
assert.deepEqual(wheelDrive(state(20),{averageWheelLoads:[0,0,0,0]},{pedal:1},cfg).torques,[0,0,0,0],'Unloaded wheels get no invented tire grip');
assert(wheelDrive(state(20),contact,{pedal:1,brake:true},cfg).torques.every(x=>x<0),'Brake must override full accelerator');
const accel=await make();accel.reset({pos:[-110,-25,.5]});let f=accel.snapshot(),times={},samples=[];
for(let i=0;i<300;i++){f=await accel.step({throttle:1});assert.equal(f.resetSerial,1);assert(f.powertrain.motorPower<=DRIVE.peakPower+1e-6);for(const speed of [30,60,100])if(f.speed>=speed&&!times[speed])times[speed]=f.t;if(i%50===49)samples.push({seconds:f.t,kmh:f.speed});if(times[100])break;}
assert(times[100]>3&&times[100]<4.5,'Hypothetical unboosted electric drive must reach 100 km/h, without the old 83 km/h servo cap');results.acceleration={times,samples};accel.dispose();
for(const brake of [false,true]){const sim=await make();sim.reset({pos:[-110,-25,.5]});f=sim.snapshot();while(f.speed<60)f=await sim.step({throttle:1});const start=f;let recovered=false;
 for(let i=0;i<600;i++){f=await sim.step({brake});assert.equal(f.resetSerial,1,'Stop measurement must never include boundary teleportation');recovered||=f.powertrain.regenPower>1000;assert(f.powertrain.regenPower<=DRIVE.regenPower+1e-6);if(Math.abs(f.longitudinalSpeed)<.1)break;}
 assert(Math.abs(f.longitudinalSpeed)<.1);if(!brake)assert(recovered,'Lifting must request regenerative braking');const stopped=[...f.pos];for(let i=0;i<100;i++)f=await sim.step();assert(Math.hypot(...f.pos.map((v,k)=>v-stopped[k]))<.05,'Hold must stop low-speed creeping');results[brake?'brake60':'lift60']={fromKmh:start.speed,stopSeconds:f.t-start.t-2,meters:stopped[0]-start.pos[0]};sim.dispose();}
assert(results.brake60.meters<results.lift60.meters*.65);assert(results.lift60.stopSeconds<9);
for(const id of ['vertical','ceiling']){const sim=await make({downforce:true}),r=RAMPS.find(x=>x.id===id);sim.reset({pos:[r.x-3,r.y,.5]});f=sim.snapshot();let last=[0,0],maxAngle=0,maxStep=0,reached=false;
 for(let i=0;i<1800;i++){f=await sim.step({throttle:pedalFor(f)});const angles=f.wheelSteering.slice(2);maxAngle=Math.max(maxAngle,...angles.map(Math.abs));maxStep=Math.max(maxStep,...angles.map((a,k)=>Math.abs(a-last[k])));last=angles;if(f.R[2][2]<Math.cos(r.angle-.01)&&f.pos[2]>(id==='vertical'?8:18)){reached=true;break;}}
 assert(reached);assert(maxAngle<1.5*Math.PI/180,'Uncommanded steering under climbing load must stay under 1.5 degrees');assert(maxStep<1*Math.PI/180,'No abrupt wheel wobble');results[id]={climbSeconds:f.t,maxSteeringDeg:maxAngle*180/Math.PI,maxStepDeg:maxStep*180/Math.PI};sim.dispose();}
const fastClimb=await make({downforce:true});f=fastClimb.reset({pos:[0,0,.5]});let highSpeedSteer=0,highSpeedStep=0,previous=[0,0];for(let i=0;i<300;i++){f=await fastClimb.step({throttle:1});const a=f.wheelSteering.slice(2);highSpeedSteer=Math.max(highSpeedSteer,...a.map(Math.abs));highSpeedStep=Math.max(highSpeedStep,...a.map((v,k)=>Math.abs(v-previous[k])));previous=a;if(f.mode==='air')break;}assert(highSpeedSteer<2*Math.PI/180,'High-load ramp entry must not shake the steering');assert(highSpeedStep<1.5*Math.PI/180);results.fullPedalRamp={maxSteeringDeg:highSpeedSteer*180/Math.PI,maxStepDeg:highSpeedStep*180/Math.PI,exitKmh:f.speed};fastClimb.dispose();
results.status='passed';fs.writeFileSync(new URL('./qa-driving-dynamics-20261020.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
