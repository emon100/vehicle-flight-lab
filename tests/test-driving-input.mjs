import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadEngine} from '../simulation_v4/browser-runtime.mjs';
import {createDrivingSimulation} from '../sandbox/driving-core.mjs';
import {bindDrivingControls} from '../sandbox/driving-input.mjs';
class Button extends EventTarget{constructor(key){super();this.dataset={key};this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};this.attributes={};this.captures=new Set();}setAttribute(k,v){this.attributes[k]=v;}setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}}
const win=new EventTarget(),doc=new EventTarget(),viewport=new EventTarget(),forward=new Button('KeyW'),left=new Button('KeyA'),brake=new Button('Space'),buttons=[forward,left,brake];let state,changes=0,selection=null;
doc.defaultView=win;doc.hidden=false;doc.getSelection=()=>selection;viewport.ownerDocument=doc;viewport.querySelectorAll=()=>buttons;viewport.contains=node=>buttons.includes(node);
const input=bindDrivingControls(viewport,value=>{state=value;changes++;}),event=(target,type,fields={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,fields);target.dispatchEvent(e);return e;},down=(b,id=1)=>event(b,'pointerdown',{pointerId:id,pointerType:'touch',button:0,buttons:1}),up=id=>event(win,'pointerup',{pointerId:id}),zero=()=>{assert.deepEqual(state,{throttle:0,steer:0,brake:false});assert(buttons.every(b=>!b.classes.has('held')&&b.attributes['aria-pressed']==='false'));};
assert(down(forward).defaultPrevented);down(left,2);assert.deepEqual(state,{throttle:1,steer:1,brake:false});up(1);assert.deepEqual(state,{throttle:0,steer:1,brake:false});up(2);zero();
down(forward,3);down(forward,4);up(3);assert.equal(state.throttle,1,'One finger ending must not release the other finger');up(4);zero();
for(const type of ['pointercancel','lostpointercapture']){down(brake,5);event(win,type,{pointerId:5});zero();}
down(forward,6);event(win,'pointermove',{pointerId:6,buttons:0});zero();
for(const type of ['contextmenu','selectstart','dragstart']){down(forward,7);input.pressKey('KeyA');assert(event(viewport,type).defaultPrevented);zero();up(7);zero();}
for(const type of ['blur','focus','pagehide','orientationchange','touchcancel']){down(forward,8);down(left,9);event(win,type);zero();}
down(forward,10);event(win,'touchend',{touches:[]});zero();
input.pressKey('KeyW');down(left,11);event(win,'touchend',{touches:[]});assert.equal(state.throttle,1,'Touch release must not release a keyboard key that is still pressed');input.releaseKey('KeyW');zero();
down(forward,12);doc.hidden=true;event(doc,'visibilitychange');zero();doc.hidden=false;
down(forward,13);event(doc,'fullscreenchange');zero();
down(forward,14);selection={isCollapsed:false,anchorNode:forward,focusNode:forward,removeAllRanges(){this.isCollapsed=true;}};event(doc,'selectionchange');zero();assert(selection.isCollapsed);
event(forward,'pointerdown',{pointerId:15,pointerType:'mouse',button:2,buttons:2});zero();
input.dispose();const n=changes;down(forward,16);assert.equal(changes,n,'Disposed controls must release listeners');
const html=fs.readFileSync(new URL('../sandbox/index.html',import.meta.url),'utf8'),js=fs.readFileSync(new URL('../sandbox/driving.mjs',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../sandbox/driving.css',import.meta.url),'utf8');assert(html.includes('开启姿态喷气辅助')&&html.includes('关闭姿态喷气辅助'));assert(!/id="crawl"|慢行|SHIFT/.test(html));assert(!/crawl|ShiftLeft|ShiftRight/.test(js));assert(css.includes('-webkit-touch-callout:none')&&css.includes('-webkit-user-select:none'));
console.log('Input passed: long-press prevention, outside release, two fingers, cancelled touch, lost capture, menu/selection, focus/visibility/fullscreen, cleanup and removed slow-mode UI.');

const root=new URL('../simulation_v4/',import.meta.url),cfg=JSON.parse(fs.readFileSync(new URL('config.json',root))),params=JSON.parse(fs.readFileSync(new URL('manifest.json',root))).final,xml=fs.readFileSync(new URL('world.xml',root),'utf8'),engine=await loadEngine(),sim=await createDrivingSimulation(cfg,params,{engine,xml,crawl:true});sim.reset({pos:[0,-20,.5]});let f;for(let i=0;i<120;i++)f=await sim.step({throttle:1});assert(f.speed>20,'An obsolete saved slow-mode flag must not retain the old speed limit');assert(!Object.hasOwn(f,'crawl'));sim.dispose();console.log('Legacy slow-mode setting ignored; normal acceleration exceeds 20 km/h.');
