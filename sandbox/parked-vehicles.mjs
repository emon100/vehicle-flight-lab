import * as T from '../vendor/three.module.min.js';
import {PARKED_VEHICLES,JUMP_LANE,vehicleHull} from './driving-obstacles.mjs?v=20261022-jump-final';

export function createParkedVehicles(){
 const group=new T.Group();group.name='无品牌障碍测试区';
 const paint=new T.MeshPhysicalMaterial({color:0xcbd0d2,metalness:.35,roughness:.27,clearcoat:.8}),glass=new T.MeshPhysicalMaterial({color:0x0a1420,metalness:.5,roughness:.17,clearcoat:1}),steel=new T.MeshStandardMaterial({color:0x9ca4aa,metalness:.85,roughness:.32,flatShading:true}),dark=new T.MeshStandardMaterial({color:0x161a1e,roughness:.7}),rubber=new T.MeshStandardMaterial({color:0x080a0d,roughness:.92}),rim=new T.MeshStandardMaterial({color:0x6e757b,metalness:.85,roughness:.24}),whiteLight=new T.MeshStandardMaterial({color:0xc9e5f4,emissive:0xc9e5f4,emissiveIntensity:2}),redLight=new T.MeshStandardMaterial({color:0xaf1821,emissive:0xdd1826,emissiveIntensity:1.2});
 const materials={white:paint,glass,steel,dark};
 const mesh=(parent,g,m,pos=[0,0,0])=>{const o=new T.Mesh(g,m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(parent,size,pos,mat)=>mesh(parent,new T.BoxGeometry(...size),mat,pos);
 function panel(parent,points,mat){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),indices=[];for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);g.setIndex(indices);g.computeVertexNormals();const m=mat.clone();m.side=T.DoubleSide;return mesh(parent,g,m);}
 function line(parent,points,color=0x252b30){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));parent.add(new T.Line(g,new T.LineBasicMaterial({color})));}
 function sign(text,x,y,z,width=5){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=96;const ctx=canvas.getContext('2d');ctx.font='500 32px system-ui';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#06090ddd';ctx.strokeText(text,384,62);ctx.fillStyle='#f1f3f5';ctx.fillText(text,384,62);const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false}));sprite.position.set(x,y,z);sprite.scale.set(width,width/8,1);group.add(sprite);return sprite;}
 for(const car of PARKED_VEHICLES){
  const body=new T.Group();body.name=car.label;body.position.set(car.x,car.y,0);body.rotation.z=car.yaw;group.add(body);
  for(const h of car.hulls){const {vertices,faces}=vehicleHull(h),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();const m=materials[h.material].clone();m.flatShading=!h.smooth;mesh(body,g,m);}
  for(const x of car.axles)for(const side of [-1,1]){
   const y=side*car.wheelTrack,r=car.wheelRadius,w=car.wheelHalfWidth,z=r;
   mesh(body,new T.CylinderGeometry(r*1.1,r*1.1,.025,40),dark,[x,side*(car.width/2+.003),z]);
   mesh(body,new T.CylinderGeometry(r,r,w*2,40),rubber,[x,y,z]);
   mesh(body,new T.CylinderGeometry(r*.63,r*.63,.022,40),dark,[x,y+side*(w+.012),z]);
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7,spoke=box(body,[r*.09,.026,r*1.16],[x,y+side*(w+.028),z],rim);spoke.rotation.y=a;}
   mesh(body,new T.CylinderGeometry(r*.16,r*.16,.035,24),rim,[x,y+side*(w+.04),z]);
  }
  sign(car.label,car.x,22,.7,3.4);
 }
 const lane=new T.Mesh(new T.PlaneGeometry(JUMP_LANE.end-JUMP_LANE.start,JUMP_LANE.halfWidth*2),new T.MeshStandardMaterial({color:0x34383d,roughness:.9}));lane.receiveShadow=true;lane.position.set((JUMP_LANE.start+JUMP_LANE.end)/2,JUMP_LANE.y,.006);group.add(lane);
 const marking=new T.MeshBasicMaterial({color:0xd8d8d8});
 for(const y of [-1,1].map(s=>JUMP_LANE.y+s*JUMP_LANE.halfWidth))for(let x=JUMP_LANE.start;x<JUMP_LANE.end;x+=12)box(group,[5,.1,.008],[x+2.5,y,.013],marking);
 for(const x of [-200,-140,-80,-25]){box(group,[3,.12,.008],[x-2,JUMP_LANE.y,.016],marking);panel(group,[[x+1,JUMP_LANE.y,.02],[x-1,JUMP_LANE.y+.7,.02],[x-1,JUMP_LANE.y-.7,.02]],marking).castShadow=false;}
 box(group,[.18,JUMP_LANE.halfWidth*2,.008],[JUMP_LANE.takeoff,JUMP_LANE.y,.017],new T.MeshBasicMaterial({color:0xe82127}));
 sign('障碍飞越区  ←',-25,8,1.1,8);sign('障碍飞越区  →',-55,24,1.5,8);sign('80 km/h · 在红线按 K',JUMP_LANE.takeoff,25,1.4,8);sign('落地区 · 继续直行',85,25,1.2,8);
 return group;
}
