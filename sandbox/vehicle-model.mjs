import * as T from '../vendor/three.module.min.js';
import {GLTFLoader} from '../vendor/GLTFLoader.mjs';
import {applyVehicleMaterial} from './vehicle-material.mjs';

let loaded;
export async function loadVehicleModelFactory(){
 loaded??=new GLTFLoader().loadAsync(new URL('../models/default-vehicle.glb',import.meta.url).href).catch(error=>{loaded=null;throw error});
 const gltf=await loaded;
 return function createMeshyModel(){
  const root=new T.Group(),car=gltf.scene.clone(true),geometries=new Map(),materials=new Map(),textures=new Map();
  root.name='Meshy · texture-free vehicle';root.userData.appearance='meshy-untextured';root.userData.modelRevision='untextured-20261022';
  // Source front is -X and up is +Y. Convert to +X front, +Z up without reshaping.
  car.rotation.y=Math.PI;root.rotation.x=Math.PI/2;root.add(car);
  car.traverse(o=>{if(!o.isMesh)return;
   if(!geometries.has(o.geometry))geometries.set(o.geometry,o.geometry.clone());o.geometry=geometries.get(o.geometry);
   const copyMaterial=m=>{if(!materials.has(m)){const copy=m.clone();for(const [key,value]of Object.entries(copy)){if(value?.isTexture){if(!textures.has(value)){const t=value.clone();t.needsUpdate=true;textures.set(value,t)}copy[key]=textures.get(value)}}materials.set(m,copy)}return materials.get(m)};
   o.material=Array.isArray(o.material)?o.material.map(copyMaterial):copyMaterial(o.material);o.castShadow=true;o.receiveShadow=false;
  });
  root.updateMatrixWorld(true);let box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());
  if(!size.toArray().every(Number.isFinite)||size.x<=0)throw Error('Meshy model has invalid bounds');
  root.scale.setScalar(4.1/size.x);root.updateMatrixWorld(true);box=new T.Box3().setFromObject(root);const center=box.getCenter(new T.Vector3());root.position.set(-center.x,-center.y,-box.min.z);
  root.userData.brakeGlow=applyVehicleMaterial(car);
  root.userData.scaleAssumption='Uniform display length 4.1 m; dimensions uncalibrated';return root;
 };
}
