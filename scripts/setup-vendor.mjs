import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const write=(p,data)=>{const url=new URL(p,root);fs.mkdirSync(new URL('.',url),{recursive:true});fs.writeFileSync(url,data);};
for(const [pkg,version] of [['three','0.180.0'],['@mujoco/mujoco','3.15.0']])assert.equal(JSON.parse(read(`node_modules/${pkg}/package.json`)).version,version);
for(const name of ['three.module.min.js','three.core.min.js'])write(`vendor/${name}`,read(`node_modules/three/build/${name}`));
for(const [folder,name] of [['loaders','GLTFLoader'],['utils','BufferGeometryUtils'],['objects','Reflector']]){
 const source=read(`node_modules/three/examples/jsm/${folder}/${name}.js`).toString().replaceAll("from 'three'","from './three.module.min.js'").replaceAll("'../utils/BufferGeometryUtils.js'","'./BufferGeometryUtils.mjs'");
 assert(!/from ['"](?:three['"]|\.\.\/)/.test(source),`Unexpected upstream dependency in ${name}`);
 write(`vendor/${name}.mjs`,source);
}
write('vendor/THREE-LICENSE',read('node_modules/three/LICENSE'));
for(const name of ['mujoco.js','mujoco.wasm'])write(`vendor/mujoco/${name}`,read(`node_modules/@mujoco/mujoco/${name}`));
write('vendor/mujoco/LICENSE',read('LICENSES/MuJoCo-Apache-2.0.txt'));
console.log('Prepared pinned Three.js and MuJoCo dependencies. Original licenses are preserved.');
