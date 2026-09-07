import * as T from '../../vendor/three.module.min.js';
export function createSupplies(scene){
  const d=new T.Object3D(),pods=new Map(),textures=new Map();
  const box=new T.BoxGeometry(1.7,1.7,1.2),face=new T.PlaneGeometry(1.65,1.65);
  const colors={shield:'#89e7ff',repair:'#89f5b1',overdrive:'#ffd677',rally:'#d4a0ff'};
  for(const kind of Object.keys(colors)){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
    c.fillStyle='#17343f';c.fillRect(0,0,256,256);c.strokeStyle=colors[kind];c.lineWidth=8;c.strokeRect(6,6,244,244);
    c.textAlign='center';c.fillStyle=colors[kind];c.font='bold 88px Arial';c.fillText({shield:'◇',repair:'+',overdrive:'»',rally:'×2'}[kind],128,132);
    c.font='bold 23px Arial';c.fillText(kind.toUpperCase(),128,185);c.font='16px Arial';c.fillText('SHOOT TO OPEN',128,222);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;textures.set(kind,map);
  }
  const parts=[
    new T.InstancedMesh(new T.BoxGeometry(1.3,.28,1.8),new T.MeshStandardMaterial({color:0x655343,roughness:.75}),64),
    new T.InstancedMesh(new T.CylinderGeometry(.31,.31,.2,10),new T.MeshStandardMaterial({color:0x242d37,metalness:.65,roughness:.45}),256),
    new T.InstancedMesh(new T.CylinderGeometry(.28,.28,1.05,10),new T.MeshStandardMaterial({color:0xa33227,metalness:.4,roughness:.5}),192),
    new T.InstancedMesh(new T.SphereGeometry(.13,6,4),new T.MeshBasicMaterial({color:0xffa93d}),64),
  ];
  for(const p of parts){p.count=0;p.frustumCulled=false;p.castShadow=true;scene.add(p);}
  const put=(part,index,x,y,z,s=1,r=[0,0,0])=>{d.position.set(x,y,z);d.scale.setScalar(s);d.rotation.set(...r);d.updateMatrix();part.setMatrixAt(index,d.matrix);};
  return {update(sim,time){
    const ids=new Set(sim.pods.map(p=>p.id));
    for(const [id,g] of pods)if(!ids.has(id)){scene.remove(g);g.traverse(o=>o.material?.dispose());pods.delete(id);}
    for(const pod of sim.pods){
      let g=pods.get(pod.id);
      if(!g){g=new T.Group();g.add(new T.Mesh(box,new T.MeshStandardMaterial({color:colors[pod.kind],metalness:.55,roughness:.35})));const front=new T.Mesh(face,new T.MeshBasicMaterial({map:textures.get(pod.kind)}));front.position.z=.61;g.add(front);scene.add(g);pods.set(pod.id,g);}
      g.position.set(pod.x,pod.y+Math.sin(time*3)*.15,pod.z);g.rotation.z=Math.sin(time*2)*.07;
    }
    const carts=sim.enemies.filter(e=>e.type==='cart').slice(0,64);
    carts.forEach((e,i)=>{
      put(parts[0],i,e.x,.55,e.z);
      for(let n=0;n<4;n++)put(parts[1],i*4+n,e.x+(n%2?.7:-.7),.4,e.z+(n<2?-.6:.6),1,[0,0,Math.PI/2]);
      for(let n=0;n<3;n++)put(parts[2],i*3+n,e.x+(n-1)*.4,1.1,e.z);
      put(parts[3],i,e.x,1.78+Math.sin(time*9+i)*.08,e.z);
    });
    [carts.length,carts.length*4,carts.length*3,carts.length].forEach((n,i)=>{parts[i].count=n;parts[i].instanceMatrix.needsUpdate=true;});
  }};
}
