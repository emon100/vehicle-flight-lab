import * as T from '../vendor/three.module.min.js';

const roof=[[-.380,.224],[-.345,.244],[-.270,.235],[-.140,.215],[0,.206],[.150,.195],[.300,.177],[.440,.147],[.565,.109]];
const side=[[-.215,.163],[-.150,.211],[-.085,.247],[-.015,.259],[.080,.259],[.190,.254],[.295,.244],[.358,.234],[.340,.221],[.303,.213],[.200,.203],[.050,.188],[-.110,.172]];
const number=x=>Number(x).toFixed(8);
function polygon(name,points){
 return `bool ${name}(vec2 p){bool hit=false;`+points.map((a,i)=>{const b=points[(i+1)%points.length];if(a[1]===b[1])return '';return `if((${number(a[1])}>p.y)!=(${number(b[1])}>p.y)){if(p.x<(${number(b[0]-a[0])})*(p.y-(${number(a[1])}))/(${number(b[1]-a[1])})+(${number(a[0])}))hit=!hit;}`;}).join('')+'return hit;}';
}
const definitions=`
varying vec3 vehiclePoint;
varying vec3 vehicleNormal;
uniform float vehicleBrakeGlow;
${polygon('sideWindow',side)}
${polygon('frontLens',[[-.620,.205],[-.542,.220],[-.548,.266]])}
float roofWidth(float x){${roof.slice(1).map((b,i)=>{const a=roof[i];return `if(x<=${number(b[0])})return mix(${number(a[1])},${number(b[1])},clamp((x-(${number(a[0])}))/${number(b[0]-a[0])},0.0,1.0));`;}).join('')}return .109;}
`;

export function applyVehicleMaterial(car){
 const shell=car.getObjectByName('Vehicle_body')??car.getObjectByName('Vehicle body');
 if(!shell)throw Error('Missing default vehicle body');
 const glow={value:.65};
 const material=new T.MeshPhysicalMaterial({color:0xb5bdc6,metalness:.62,roughness:.34,clearcoat:.52,clearcoatRoughness:.18});
 material.name='Procedural vehicle finish';
 material.onBeforeCompile=shader=>{
  shader.uniforms.vehicleBrakeGlow=glow;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vehiclePoint;\nvarying vec3 vehicleNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvehiclePoint=position;vehicleNormal=normal;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+definitions).replace('#include <color_fragment>',`#include <color_fragment>
   vec3 vp=vehiclePoint;float az=abs(vp.z);
   bool roofGlass=vp.y>.145&&vp.x>=-.380+.035*pow(az/.245,2.0)&&vp.x<=.565&&az<roofWidth(vp.x);
   bool sideGlass=az>.207&&az<.290&&sideWindow(vp.xy);
   bool glass=roofGlass||sideGlass;
   bool trim=vp.y<-.068||(vp.x<-.590&&vp.y<.025&&az<.229)||(vp.x>.640&&vp.y<.105&&az<.255)||(vp.x>-.29&&vp.x<.38&&vp.y<-.052&&az>.270);
   float tailY=.154+.005*(1.0-pow(az/.286,2.0));
   bool tail=vp.x>.685&&vehicleNormal.x>.1&&az<.288&&abs(vp.y-tailY)<.0038;
   bool head=vp.y>.025&&vehicleNormal.y>.15&&frontLens(vec2(vp.x,az));
   if(glass)diffuseColor.rgb=vec3(.020,.017,.014);
   if(trim)diffuseColor.rgb=vec3(.009,.012,.015);
   if(head)diffuseColor.rgb=vec3(.8,.9,1.0);
   if(tail)diffuseColor.rgb=vec3(.5,.008,.018);`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=glass ? .17 : (trim ? .70 : .34);')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=glass ? .12 : (trim ? .20 : .62);')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance=head?vec3(.65,.8,1.0)*4.0:(tail?vec3(.8,.01,.02)*vehicleBrakeGlow:vec3(0.0));');
 };
 material.customProgramCacheKey=()=> 'vehicle-procedural-finish-v1';
 shell.traverse(o=>{if(o.isMesh)o.material=material;});
 return glow;
}
