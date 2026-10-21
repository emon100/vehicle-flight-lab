// Unbranded block targets. Dimensions are simulation assumptions, not production vehicle specifications.
export const JUMP_LANE={y:16,start:-230,end:220,takeoff:-17,landingStart:50,halfWidth:5};
export const PARKED_VEHICLES=[
 {id:'low_target',label:'LOW TARGET',x:4,y:15.5,yaw:Math.PI/2,length:5,width:2,height:1.68,axles:[-1.4,1.5],wheelRadius:.38,wheelHalfWidth:.13,wheelTrack:.86,hulls:[{material:'white',sections:[[-2.5,.99,.3,1.68],[2.5,.99,.3,1.68]]}]},
 {id:'high_target',label:'HIGH TARGET',x:10,y:14.1,yaw:Math.PI/2,length:7.8,width:2.5,height:3.7,axles:[-2.95,-1.55,2.65],wheelRadius:.49,wheelHalfWidth:.16,wheelTrack:1.05,hulls:[{material:'dark',sections:[[-3.9,1.24,.5,3.7],[3.9,1.24,.5,3.7]]}]},
 {id:'medium_target',label:'MID TARGET',x:16,y:15.2,yaw:Math.PI/2,length:5.7,width:2.1,height:1.8,axles:[-1.6,1.6],wheelRadius:.4,wheelHalfWidth:.14,wheelTrack:.9,hulls:[{material:'white',sections:[[-2.85,1.04,.35,1.8],[2.85,1.04,.35,1.8]]}]}
];
export function vehicleHull({sections}){
 const vertices=[],faces=[],n=8;
 for(const [x,w,b,t] of sections){const bevel=Math.min(.08,(t-b)*.2);for(const [y,z] of [[-w*.86,b],[w*.86,b],[w,b+bevel],[w,t-bevel],[w*.86,t],[-w*.86,t],[-w,t-bevel],[-w,b+bevel]])vertices.push(x,y,z);}
 for(let s=0;s<sections.length-1;s++)for(let i=0;i<n;i++){const a=s*n+i,b=s*n+(i+1)%n,c=b+n,d=a+n;faces.push(a,b,c,a,c,d);}
 for(let i=1;i<n-1;i++){faces.push(0,i+1,i);const end=(sections.length-1)*n;faces.push(end,end+i,end+i+1);}
 return {vertices,faces};
}
export function parkedVehiclesXML(){
 const assets=[],geoms=[];
 for(const car of PARKED_VEHICLES){
  car.hulls.forEach((h,i)=>{const name=`parked_${car.id}_${i}`,{vertices,faces}=vehicleHull(h);assets.push(`<mesh name="${name}" vertex="${vertices.join(' ')}" face="${faces.join(' ')}"/>`);geoms.push(`<geom name="${name}" type="mesh" mesh="${name}" pos="${car.x} ${car.y} 0" quat="${Math.cos(car.yaw/2)} 0 0 ${Math.sin(car.yaw/2)}"/>`);});
  car.axles.forEach((x,i)=>{for(const side of [-1,1]){const y=side*car.wheelTrack,wx=car.x+x*Math.cos(car.yaw)-y*Math.sin(car.yaw),wy=car.y+x*Math.sin(car.yaw)+y*Math.cos(car.yaw);geoms.push(`<geom name="parked_${car.id}_wheel_${i}_${side===1?'l':'r'}" type="ellipsoid" pos="${wx} ${wy} ${car.wheelRadius}" quat="${Math.cos(car.yaw/2)} 0 0 ${Math.sin(car.yaw/2)}" size="${car.wheelRadius} ${car.wheelHalfWidth} ${car.wheelRadius}"/>`);}});
 }
 return {assets:`<asset>${assets.join('')}</asset>`,geoms:geoms.join('')};
}
