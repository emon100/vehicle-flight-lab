import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import * as T from '../vendor/three.module.min.js';
import {GLTFLoader} from '../vendor/GLTFLoader.mjs';
import {loadVehicleModelFactory} from '../sandbox/vehicle-model.mjs';
import {applyVehicleMaterial} from '../sandbox/vehicle-material.mjs';
import {rigDrivingWheels} from '../sandbox/driving-model.mjs';
import {createVehicleLights,brakeLightOn} from '../sandbox/driving-effects.mjs';
import {PARKED_VEHICLES,JUMP_LANE,vehicleHull} from '../sandbox/driving-obstacles.mjs';
const root=new URL('../',import.meta.url),read=path=>fs.readFileSync(new URL(path,root)),json=path=>JSON.parse(read(path)),sha=data=>createHash('sha256').update(data).digest('hex');
assert.equal(typeof loadVehicleModelFactory,'function');
for(const record of json('docs/records.json')){
 assert(!record.path.startsWith('/')&&!record.path.split('/').includes('..'));
 const raw=gunzipSync(read(record.path));assert.equal(raw.length,record.bytes);assert.equal(sha(raw),record.sha256);
}
const sources=json('simulation_v4/campaign/source.json');
for(const [name,hash] of Object.entries(sources))assert.equal(sha(read('simulation_v4/'+name)),hash,`Frozen v4 source changed: ${name}`);
const generations=gunzipSync(read('simulation_v4/campaign/training-ledger.jsonl.gz')).toString().trim().split('\n').map(line=>JSON.parse(line));
assert.equal(generations.length,60);
for(const [i,generation] of generations.entries()){
 assert.equal(generation.generation,i+1);assert.equal(generation.parameters.length,18);assert.equal(generation.scores.length,18);assert.equal(generation.rows.length,18);assert.equal(generation.cases.length,6);
 for(const rows of generation.rows){assert.equal(rows.length,6);assert.deepEqual(rows.map(row=>row.case.id),generation.cases.map(row=>row.id));}
}
assert.equal(json('simulation_v4/evaluation.json').rows.length,240);
const training=json('simulation_v2/policies.json');
if(training.sourceSha256)assert.equal(sha(read('simulation_v2/core.py')),training.sourceSha256);
const raw=read('models/default-vehicle.glb'),provenance=json('models/model-provenance.json');
assert.equal(sha(raw),provenance.outputSha256);assert.equal(raw.readUInt32LE(0),0x46546c67);assert.equal(raw.readUInt32LE(8),raw.length);
const doc=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)));
assert(!doc.images&&!doc.textures&&!doc.samplers);
for(const mesh of doc.meshes)for(const p of mesh.primitives){assert.deepEqual(Object.keys(p.attributes).sort(),['NORMAL','POSITION']);assert.equal(p.mode??4,4);}
const binary=raw.subarray(28+raw.readUInt32LE(12));
for(const check of provenance.geometryAttributeChecks){
 const primitives=check.mesh===0?doc.meshes[0].primitives:[doc.meshes[check.mesh].primitives[check.primitive]];
 for(const primitive of primitives){const a=doc.accessors[primitive.attributes[check.attribute]],view=doc.bufferViews[a.bufferView];assert.equal(sha(binary.subarray(view.byteOffset,view.byteOffset+view.byteLength)),check.sourceSha256,'Geometry must match the retained source');}
}
assert(!/Texture"\s*:|data:image|Roadster|Tesla/i.test(JSON.stringify(doc)));
assert.equal(doc.asset.extras.license,'CC-BY-4.0');
const gltf=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
const model=new T.Group();model.rotation.x=Math.PI/2;gltf.scene.rotation.y=Math.PI;model.add(gltf.scene);model.updateMatrixWorld(true);
model.userData.brakeGlow=applyVehicleMaterial(gltf.scene);
const shell=gltf.scene.getObjectByName('Vehicle_body')??gltf.scene.getObjectByName('Vehicle body');
const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <metalnessmap_fragment>\n#include <emissivemap_fragment>'};
shell.material.onBeforeCompile(shader);
assert(!/--[\d.]|NaN|Infinity|\/\(0\.00000000\)/.test(shader.fragmentShader));
const size=new T.Box3().setFromObject(model).getSize(new T.Vector3());model.scale.setScalar(4.1/size.x);
const rig=rigDrivingWheels(model),wheels=rig.userData.wheelCenters;
assert.equal(wheels.length,4);assert(wheels.flat().every(Number.isFinite));
const lights=createVehicleLights(rig);lights.update({braking:true});assert.equal(lights.stats().tailEmissive,7);lights.update({braking:false});assert.equal(lights.stats().tailEmissive,.65);
assert.equal(shader.uniforms.vehicleBrakeGlow.value,.65);
assert.equal(lights.stats().headlights,2);
assert.equal(brakeLightOn({mode:'air',powertrain:{regenPower:80000},longitudinalSpeed:12}),false);
rig.traverse(o=>{if(o.isSpotLight&&o.name==='前车灯')assert(o.target.position.x>o.position.x&&o.target.position.z<o.position.z,'Headlights must face forward and toward the road');});
assert.equal(PARKED_VEHICLES.length,3);assert(JUMP_LANE.end<270&&JUMP_LANE.start>-270);
for(const car of PARKED_VEHICLES){
 assert(!/tesla|model.?x|semi|cybertruck/i.test(car.label+car.id));
 for(const hull of car.hulls){const {vertices,faces}=vehicleHull(hull),edges=new Map();assert(vertices.every(Number.isFinite));for(let i=0;i<faces.length;i+=3)for(let j=0;j<3;j++){const edge=[faces[i+j],faces[i+(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(edge,(edges.get(edge)??0)+1);}assert([...edges.values()].every(n=>n===2));}
}
for(const name of fs.readdirSync(new URL('sandbox/',root))){
 if(!name.endsWith('.mjs'))continue;
 const source=read('sandbox/'+name).toString();
 assert(!/Roadster|Tesla|modelx|cybertruck/.test(source),`Branding left in ${name}`);
 for(const match of source.matchAll(/(?:\bfrom\s+|\bimport\s*\(|new URL\(\s*)['"](\.[^'"]+)['"]/g))assert(fs.existsSync(new URL(match[1].split('?')[0],new URL('sandbox/'+name,root))),`Missing dependency in ${name}: ${match[1]}`);
}
for(const path of ['README.md','models/README.md','sandbox/credits.html']){
 const source=read(path).toString();assert(source.includes('Model created with'));assert(source.includes('https://www.meshy.ai/'));assert(source.includes('https://creativecommons.org/licenses/by/4.0/'));
}
console.log(JSON.stringify({release:'passed',compressedRecords:json('docs/records.json').length,modelBytes:raw.length,embeddedImages:0,wheels:4,lights:2,neutralObstacles:3,frozenV4SourceHashes:'match'}));
