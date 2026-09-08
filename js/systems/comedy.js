import * as T from '../../vendor/three.module.min.js';
import { mergeRigidParts } from '../core/geometry.js?v=0.7.0';
import { BOSS_TYPES } from '../../data/campaign.js?v=0.7.0';

export function createComedy(scene){
  const d=new T.Object3D(),color=new T.Color(),duckBounces=[],bits=[],finales=[];
  let balanced=false,detail=1,quack=false,stampede=false;
  const sphere=new T.SphereGeometry(1,12,8),box=new T.BoxGeometry(1,1,1),cone=new T.ConeGeometry(1,1,6),tube=new T.CylinderGeometry(1,1,1,10);
  const part=(geo,p,s,r=[0,0,0])=>({geo,p,s,r});
  function mesh(geo,hex,count,glow=false){
    const material=glow?new T.MeshBasicMaterial({color:hex,toneMapped:false}):new T.MeshStandardMaterial({color:hex,metalness:.22,roughness:.33});
    const m=new T.InstancedMesh(geo,material,count);m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);return m;
  }
  const duck=[
    mesh(mergeRigidParts([part(sphere,[0,.85,0],[1.25,.85,1.6]),part(sphere,[0,1.9,-.9],[.8,.85,.8]),part(sphere,[-1,.95,.1],[.3,.42,.8]),part(sphere,[1,.95,.1],[.3,.42,.8]),part(cone,[0,1,1.5],[.55,1,.55],[.5,0,0])]),0xffd447,8),
    mesh(mergeRigidParts([part(sphere,[0,1.7,-1.65],[.64,.21,.56]),part(box,[-.55,.18,.2],[.7,.12,.9]),part(box,[.55,.18,.2],[.7,.12,.9])]),0xff863c,8),
    mesh(mergeRigidParts([part(sphere,[-.47,2.13,-1.51],[.12,.17,.09]),part(sphere,[.47,2.13,-1.51],[.12,.17,.09])]),0x172743,8),
  ];
  const tank=[
    mesh(mergeRigidParts([part(box,[0,.8,0],[1.6,.65,2.3]),part(sphere,[0,1.35,-.1],[.7,.5,.8]),part(tube,[0,1.4,-1.25],[.13,1.7,.13],[Math.PI/2,0,0])]),0x72dba7,9),
    mesh(mergeRigidParts([-1,1].flatMap(side=>[part(box,[side*.9,.5,0],[.45,.55,2.4]),...[-.8,0,.8].map(z=>part(tube,[side*1.14,.5,z],[.28,.1,.28],[0,0,Math.PI/2]))])),0x263953,9),
    mesh(mergeRigidParts([part(box,[0,1.8,0],[.16,.65,.16]),part(box,[0,2,0],[.85,.13,.13]),part(tube,[-.42,2,0],[.2,.08,.2],[Math.PI/2,0,0]),part(tube,[.42,2,0],[.2,.08,.2],[Math.PI/2,0,0])]),0xffd481,9),
  ];
  const hats=mesh(mergeRigidParts([part(sphere,[0,0,0],[.25,.16,.25]),part(tube,[0,-.1,0],[.33,.04,.33]),part(box,[0,.12,0],[.04,.24,.4])]),0xd49b68,64);
  const casings=mesh(new T.CylinderGeometry(.035,.035,.15,5),0xe9bb6d,72);
  const stars=mesh(new T.OctahedronGeometry(.17),0xffe692,96,true);
  const crowns=mesh(mergeRigidParts([part(tube,[0,0,0],[.85,.22,.85]),...Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2;return part(cone,[Math.cos(a)*.8,.5,Math.sin(a)*.8],[.2,.9,.2]);})]),0xffd885,4);
  for(const g of [sphere,box,cone,tube])g.dispose();
  function at(m,i,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.set(rx,ry,rz);d.updateMatrix();m.setMatrixAt(i,d.matrix);}
  function addBit(e,kind){
    if(bits.length>=Math.round((balanced?55:110)*detail))return;
    const a=(e.id||e.index||bits.length)*2.399;bits.push({kind,x:e.x,y:kind==='hat'?1.7:e.y,z:e.z,vx:Math.cos(a)*(kind==='hat'?3:1.6),vy:kind==='hat'?6:2,vz:Math.sin(a)*2,age:0});
  }
  return {
    setQuality(value,scale=1){balanced=value==='balanced';detail=scale;},
    handle(e){
      if(e.type==='explosion'&&e.power==='quack'){if(duckBounces.length<6)duckBounces.push({x:e.x,z:e.z,age:0});}
      if(e.type==='death'&&!e.boss&&e.id%5===0)addBit(e,'hat');
      if(e.type==='shot'&&e.index%7===0&&['rifle','repeater','gatling','cannon'].includes(e.weaponId))addBit(e,'case');
      if(e.type==='death'&&e.boss&&finales.length<4)finales.push({x:e.x,z:e.z,age:0,stage:0,mini:e.mini,color:BOSS_TYPES[e.bossType]?.accent||0xffd689});
    },
    reset(){bits.length=duckBounces.length=finales.length=0;for(const m of [...duck,...tank,hats,casings,stars,crowns])m.count=0;quack=stampede=false;},
    update(sim,dt,time,reduced,pulse,scatter,segment){
      quack=sim.buffs.quack>0;stampede=sim.buffs.stampede>0;
      let ducks=0;
      for(const zone of sim.zones)if(zone.power==='quack'&&ducks<8){
        const t=1-zone.remaining/zone.total,y=.2+22*(1-t)*(1-t);
        for(const m of duck)at(m,ducks,zone.x,y,zone.z,1.7,1.7,1.7,0,Math.PI+Math.sin(t*3)*.22,Math.sin(t*6)*.12);
        ducks++;
        for(let j=0;j<(reduced?0:3);j++)segment({x:zone.x+(j-1)*1.6,y:y+5,z:zone.z},{x:zone.x+(j-1)*1.6,y:y+8,z:zone.z},.035,0xffe6a3,.55);
      }
      for(let i=duckBounces.length-1;i>=0;i--){
        const b=duckBounces[i];b.age+=dt;if(b.age>1.1){duckBounces.splice(i,1);continue;}if(ducks>=8)continue;
        const t=b.age/1.1,flatten=Math.exp(-t*14),size=1.7*Math.min(1,(1-t)*4);
        for(const m of duck)at(m,ducks,b.x,.15+Math.sin(t*Math.PI)*2,b.z,size*(1+flatten*.8),size*(1-flatten*.6),size,0,Math.PI+t*.7,Math.sin(t*7)*.12);ducks++;
      }
      for(const m of duck)m.count=ducks;
      let tanks=0;
      for(const t of sim.toyTanks){if(tanks>=9)break;
        const yaw=Math.sin(time*13+t.id)*.06,y=.08+Math.abs(Math.sin(time*21+t.id))*.13;
        for(let i=0;i<tank.length;i++)at(tank[i],tanks,t.x,y,t.z,1.15,1.15,1.15,0,yaw+(i===2?time*9:0),Math.sin(time*15+t.id)*.055);
        tanks++;
      }
      for(const m of tank)m.count=tanks;
      hats.count=casings.count=0;
      for(let i=bits.length-1;i>=0;i--){
        const b=bits[i];b.age+=dt;if(b.age>2.1){bits.splice(i,1);continue;}
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vy-=14*dt;
        if(b.y<.22){b.y=.22;b.vy=Math.abs(b.vy)*.4;b.vx*=.8;b.vz*=.8;}
        const m=b.kind==='hat'?hats:casings;if(m.count>=m.instanceMatrix.count)continue;
        const size=Math.min(1,(2.1-b.age)*3);at(m,m.count++,b.x,b.y,b.z,size,size,size,b.age*7,b.age*9,0);
      }
      stars.count=crowns.count=0;
      // Dizzy stars accompany the existing recoverable knockdown, without changing hitboxes.
      for(const unit of sim.knockups)if(unit.age>1.1)for(let j=0;j<3&&stars.count<48;j++){
        const a=time*(reduced?.4:5)+j*Math.PI*2/3;at(stars,stars.count++,unit.x+Math.cos(a)*.6,2.3,unit.z+Math.sin(a)*.5,1,1,1,0,time,0);
      }
      for(let i=finales.length-1;i>=0;i--){
        const f=finales[i];f.age+=dt;if(f.age>3.1){finales.splice(i,1);continue;}
        const t=f.age,size=f.mini?.65:1;
        if(t>.5&&f.stage===0){f.stage=1;pulse(f.x,f.z,9*size,f.color,1.1);scatter(f.x,f.z,f.color,balanced?20:42);}
        if(t>1.2&&f.stage===1){f.stage=2;pulse(f.x,f.z,16*size,f.color,1.5);pulse(f.x,f.z,10*size,0xe0faff,1.3);scatter(f.x,f.z,0xffe2a5,balanced?25:60);}
        const radius=(1+Math.min(1,t)*7)*size;
        if(t<1.5)for(let j=0;j<10;j++){
          const a=j/10*Math.PI*2+t*.35,alpha=Math.max(0,1-t/1.5)*(reduced?.3:1);
          segment({x:f.x,y:2,z:f.z},{x:f.x+Math.cos(a)*radius,y:2+Math.abs(Math.sin(a))*radius,z:f.z+Math.sin(a)*radius},.05,f.color,alpha);
        }
        const y=Math.max(.35,6+t*9-t*t*5),s=size*Math.min(1,(3.1-t)*3);
        at(crowns,crowns.count++,f.x+Math.sin(t)*1.8,y,f.z+t,s,s,s,t*1.3,t*4,t*.8);
        for(let j=0;j<(balanced?12:24)&&stars.count<96;j++){
          const a=j*2.399,x=f.x+Math.cos(a)*t*(1+j%4),z=f.z+Math.sin(a)*t*3,sy=Math.max(.2,2+t*(4+j%5)-t*t*3.5);
          at(stars,stars.count,f.x+(x-f.x)*size,sy,z,.6,.4,.6,time*3,j,time*2);color.setHex([f.color,0xffe39c,0xc6f9ff][j%3]);stars.setColorAt(stars.count++,color);
        }
      }
      for(const m of [...duck,...tank,hats,casings,stars,crowns]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
    },
    snapshot:()=>({quack,stampede,ducks:duck[0].count,toyTanks:tank[0].count,helmets:hats.count,casings:casings.count,finales:finales.length,dizzyStars:stars.count}),
  };
}
