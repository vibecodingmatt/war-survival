import * as T from '../../vendor/three.module.min.js';
import { WILDLIFE, wildlifeVisit, residentCount } from '../../data/wildlife.js?v=0.8.0';
import { buildWildlife } from './wildlife-models.js?v=0.8.0';
import { randomSource } from '../core/math.js?v=0.8.0';
import { createFantasyCreature } from './fantasy-creatures.js?v=0.8.0';

export function createWildlife(root, biome, level) {
  const spec=WILDLIFE[biome], seed=9127+level*137, random=randomSource(seed);
  const species=new Map(), residentGroups=[], transform=new T.Object3D(), joint=new T.Object3D(), matrix=new T.Matrix4();
  let balanced=false,density=1,origin=null,lastTime=-1,localTime=0,visitors=0,bloomCount=0,positions=[];
  function flock(kind,capacity) {
    if(species.has(kind))return species.get(kind);
    const model=buildWildlife(kind);
    const material=kind==='morpho'
      ? new T.MeshPhysicalMaterial({vertexColors:true,side:T.DoubleSide,roughness:.4,metalness:.18,iridescence:.85,iridescenceIOR:1.3,iridescenceThicknessRange:[180,380],sheen:.35,sheenColor:0x58c7ff})
      : new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:model.metallic?.32:.68,metalness:model.metallic?.48:.08});
    if(model.family==='firefly'){material.emissive.setHex(0xcedb72);material.emissiveIntensity=.45;}
    const body=new T.InstancedMesh(model.body,material,capacity),wing=new T.InstancedMesh(model.wing,material,capacity*2);
    for(const mesh of [body,wing]) { mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh); }
    const group={kind,model,body,wing,capacity};species.set(kind,group);return group;
  }
  for(const [kind,count] of spec.residents) {
    const group=flock(kind,count+(spec.bloom&&kind==='morpho'?8:0));
    const units=Array.from({length:count},(_,i)=>({side:i%2?1:-1,x:i<2?11.1:12+random()*8,z:i<2?-7+i*13:-15-random()*53,y:2.2+random()*3.5,phase:random()*Math.PI*2,size:i<2?1.1:.7+random()*.32}));
    residentGroups.push({group,units,count});
  }
  const signature=createFantasyCreature(root,spec.signature,level);
  function draw(group,x,y,z,yaw,bank,scale,phase,time,gliding=false) {
    const {model,body,wing}=group,i=body.count;if(i>=group.capacity)return;
    transform.position.set(x,y,z);transform.rotation.set(0,yaw,bank);transform.scale.setScalar(scale*model.size);transform.updateMatrix();body.setMatrixAt(i,transform.matrix);body.count++;
    const rate=model.wingSpeed, stroke=Math.sin(time*rate+phase);
    const flap=gliding?Math.sin(time*.7+phase)*.1:(model.family==='butterfly'?.35:0)+stroke*model.wingLift;
    for(const side of [-1,1]) {
      joint.position.set(0,0,0);joint.rotation.set(0,0,side<0?Math.PI-flap:flap);
      if(model.family==='fish')joint.rotation.y=side*Math.sin(time*4+phase)*.25;
      joint.updateMatrix();matrix.multiplyMatrices(transform.matrix,joint.matrix);wing.setMatrixAt(i*2+(side>0?1:0),matrix);
    }
    wing.count=body.count*2;
    positions.push({kind:group.kind,x:+x.toFixed(2),y:+y.toFixed(2),z:+z.toFixed(2)});
  }
  function update(time,reduced=false) {
    if(origin===null||time<origin)origin=time;
    localTime=time-origin;
    if(balanced&&lastTime>=0&&time>=lastTime&&time-lastTime<1/30)return;
    lastTime=time;positions=[];visitors=bloomCount=0;
    for(const group of species.values())group.body.count=group.wing.count=0;
    for(const {group,units,count} of residentGroups) {
      const n=residentCount(count,balanced,density);
      for(let i=0;i<n;i++) {
        const f=units[i],a=localTime*.35+f.phase;
        const bird=group.model.family==='bird',fish=group.model.family==='fish'||group.model.family==='ray';
        const x=f.side*(f.x+Math.sin(a)*.65),z=f.z+Math.cos(a)*(bird?5:fish?2.5:1.2);
        const hover=group.model.family==='dragonfly'?.14:bird?.7:.4;
        const y=f.y+(bird?3:0)+Math.sin(a*2)*hover;
        const yaw=Math.atan2(-f.side*Math.cos(a)*.65,Math.sin(a)*(bird?5:1.2));
        draw(group,x,y,z,yaw,Math.sin(a)*.15,f.size,f.phase,localTime*(reduced?.55:1),bird&&Math.sin(a)>.25);
      }
    }
    signature.update(localTime,reduced);
    if(spec.bloom) {
      const bloom=wildlifeVisit(localTime,seed,true);
      if(bloom.active) {
        const n=balanced?5:8;
        for(let i=0;i<n;i++) {
          const u=bloom.progress,a=localTime*.65+i*2.399;
          const x=bloom.side*(12.3+Math.cos(a)*1.5),y=2+u*6+Math.sin(a)*.6,z=-11+Math.sin(a)*2-u*12;
          draw(species.get('morpho'),x,y,z,-a,.2*Math.sin(a),Math.min(1,u*9,(1-u)*8),i*.8,localTime*(reduced?.55:1));bloomCount++;
        }
      }
    }
    for(const group of species.values()) {group.body.instanceMatrix.needsUpdate=group.wing.instanceMatrix.needsUpdate=true;}
  }
  return {description:spec.description,batches:species.size*2+signature.batches,
    setQuality(value,scale=1){balanced=value==='balanced';density=scale;lastTime=-1;},update,
    snapshot:()=>({creatures:[...species.values()].reduce((n,g)=>n+g.body.count,0)+signature.snapshot().signatureCount,wildlifeSpecies:spec.residents.map(([kind])=>kind),
      visitors,butterflyBloom:bloomCount,wildlifeTime:localTime,wildlifePositions:[...positions,...signature.snapshot().signaturePositions],...signature.snapshot(),
      nextVisit:null,nextBloom:spec.bloom?wildlifeVisit(localTime,seed,true):null}),
  };
}
