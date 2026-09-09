import * as T from '../../vendor/three.module.min.js';
import { randomSource } from '../core/math.js?v=0.8.1';
import { createSpectacle } from './spectacle.js?v=0.8.1';
import { createProjectiles } from './projectiles.js?v=0.8.1';
const d=new T.Object3D(),color=new T.Color();
function glowTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.2,'#ffffffbb');g.addColorStop(1,'#ffffff00');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);
}
export function createEffects(scene) {
  const spectacle=createSpectacle(scene);
  const projectiles=createProjectiles(scene);let particleBudget=900,smokeBudget=250,balanced=false,detailScale=1;
  const random=randomSource(491),particles=[],smoke=[],rings=[],scorches=[];
  const glow=glowTexture();
  const sparkMesh=new T.InstancedMesh(new T.SphereGeometry(1,5,4),new T.MeshBasicMaterial({color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthWrite:false}),900);
  const smokeMesh=new T.InstancedMesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:glow,color:0xffffff,transparent:true,opacity:.55,depthWrite:false}),250);
  for(const mesh of [sparkMesh,smokeMesh]){mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(mesh);}
  const ringGeometry=new T.RingGeometry(.88,1,32);
  const ringPool=Array.from({length:24},()=>{const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending}));mesh.rotation.x=-Math.PI/2;mesh.visible=false;scene.add(mesh);return mesh;});
  const squadRing=new T.Mesh(new T.RingGeometry(1.95,2.01,64),new T.MeshBasicMaterial({color:0x61d7f2,transparent:true,opacity:.6,depthWrite:false}));
  squadRing.rotation.x=-Math.PI/2;scene.add(squadRing);
  const squadGlow=new T.Mesh(new T.PlaneGeometry(5.8,5.8),new T.MeshBasicMaterial({map:glow,color:0x2494dc,transparent:true,opacity:.13,depthWrite:false,blending:T.AdditiveBlending}));
  squadGlow.rotation.x=-Math.PI/2;scene.add(squadGlow);
  const zoneVisuals=new Map();
  const shotLight=new T.PointLight(0xffb747,0,9,2);scene.add(shotLight);
  const blastLight=new T.PointLight(0xffa548,0,17,2);scene.add(blastLight);
  let shotLife=0,blastLife=0;
  function spark(x,y,z,vx,vy,vz,size,life,hex){
    if(particles.length>=particleBudget)return;
    particles.push({x,y,z,vx,vy,vz,size,life,maxLife:life,color:new T.Color(hex)});
  }
  function burst(x,y,z,count,power=1,hex=0xffb74d){
    count=Math.ceil(count*(balanced?.55:1)*detailScale);
    for(let i=0;i<count;i++){const a=random()*Math.PI*2,s=(1+random()*5)*power;
      spark(x,y,z,Math.cos(a)*s,(1+random()*5)*power,Math.sin(a)*s,.025+random()*.065,.2+random()*.5,random()>.65?0xffecc5:hex);}
  }
  function puff(x,y,z,count,power=1) {
    count=Math.ceil(count*(balanced?.5:1)*detailScale);
    for(let i=0;i<count&&smoke.length<smokeBudget;i++)smoke.push({x:x+(random()-.5)*power,y:y+random()*.3,z:z+(random()-.5)*power,
      vx:(random()-.5)*power*2,vy:(.7+random())*power,vz:(random()-.5)*power*2,
      size:(.15+random()*.35)*power,life:.65+random()*.8,maxLife:1.45,color:new T.Color().setHSL(.105,.09,.18+random()*.22)});
  }
  function ring(x,z,radius,hex,life=.6){
    const mesh=ringPool.find(m=>!m.visible);if(!mesh)return;
    mesh.visible=true;mesh.material.color.setHex(hex);mesh.position.set(x,.16,z);rings.push({mesh,age:0,life,radius});
  }
  function scorch(x,z,radius){
    const mesh=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map:glow,color:0x201e18,transparent:true,opacity:.58,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.145+random()*.004,z);scene.add(mesh);scorches.push(mesh);
    if(scorches.length>28){const old=scorches.shift();scene.remove(old);old.geometry.dispose();old.material.dispose();}
  }
  function handle(event) {
    spectacle.handle(event);
    if(event.type==='beam')spectacle.handle({...event,type:'powerBeam'});
    if(event.type==='powerup'){burst(event.x,1,event.z,42,1.2,0x9eeedb);ring(event.x,event.z,5,0xa4ffdf,1);}
    if(event.type==='shot'){
      if(balanced&&event.index%2)return;
      const dx=-Math.sin(event.yaw),dz=-Math.cos(event.yaw);
      for(let i=0;i<(balanced?2:4);i++)spark(event.x,event.y,event.z,dx*(3+random()*5)+(random()-.5),random()*1.4,dz*(3+random()*5),(.06+event.weaponLevel*.02)+random()*.07,.06+random()*.05,event.color||0xffd779);
      if(random()>.55)puff(event.x,event.y,event.z,1,.24);
      shotLight.position.set(event.x,event.y+.2,event.z);shotLife=.05;
    }
    if(event.type==='hit'){burst(event.x,event.y,event.z,event.blast?2:4,.6,event.friendly?0x77dcff:0xffb74d);if(!event.friendly&&random()>.75)puff(event.x,event.y,event.z,1,.35);}
    if(event.type==='cannon'){burst(event.x,.7,event.z,5,.9,event.color||0xff9e44);if(random()>.7)puff(event.x,.3,event.z,2,.9);}
    if(event.type==='weapon'){burst(event.x,2,event.z,48,1.2,0xffdb7d);ring(event.x,event.z,4,0xffdc8b,1.2);}
    if(event.type==='death'){burst(event.x,.6,event.z,event.boss?70:9,event.boss?2.4:.6);puff(event.x,.3,event.z,event.boss?22:3,event.boss?3:.7);if(event.boss){ring(event.x,event.z,12,0xffc27a,1.4);blastLife=.7;blastLight.position.set(event.x,3,event.z);}}
    if(event.type==='explosion'){
      burst(event.x,.5,event.z,48,1.8);puff(event.x,.3,event.z,12,2.5);
      ring(event.x,event.z,event.radius*1.4,event.friendly?0xffcf7a:0xff7861);
      scorch(event.x,event.z,event.radius*.58);blastLight.position.set(event.x,2,event.z);blastLife=.45;
    }
    if(event.type==='recruit'){
      burst(event.x,.4,event.z,32,1,0x62ddff);ring(event.x,event.z,4,0x6cd9ff,1);
    }
  }
  function drawParticles(mesh,array,dt,gravity,camera) {
    let write=0;
    for(let i=0;i<array.length;i++){
      const p=array[i];p.life-=dt;if(p.life<=0)continue;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=gravity*dt;
      if(p.y<.17){p.y=.17;p.vy=Math.abs(p.vy)*.25;p.vx*=.92;p.vz*=.92;}
      if(write>=mesh.instanceMatrix.count)continue;
      d.position.set(p.x,p.y,p.z);d.rotation.set(0,0,0);if(gravity<0&&camera)d.quaternion.copy(camera.quaternion);
      const life=p.life/p.maxLife,size=p.size*(gravity>0?Math.min(1,life*3):1+(1-life)*2);
      d.scale.set(size,gravity>0?size*(1+Math.abs(p.vy)*.08):size,size);d.updateMatrix();
      mesh.setMatrixAt(write,d.matrix);color.copy(p.color).multiplyScalar(gravity>0?.4+life*2:Math.max(.3,life));mesh.setColorAt(write,color);
      array[write++]=p;
    }
    array.length=write;mesh.count=write;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }
  function zoneVisual(zone) {
    const group=new T.Group(),hex=zone.friendly?0xffd489:0xff4839;
    const disk=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:hex,transparent:true,opacity:.11,depthWrite:false}));disk.rotation.x=-Math.PI/2;group.add(disk);
    const outer=new T.Mesh(new T.RingGeometry(.94,1,64),new T.MeshBasicMaterial({color:hex,transparent:true,opacity:.9,depthWrite:false}));outer.rotation.x=-Math.PI/2;group.add(outer);
    const inner=new T.Mesh(new T.RingGeometry(.9,1,48),new T.MeshBasicMaterial({color:hex,transparent:true,opacity:.6,depthWrite:false}));inner.rotation.x=-Math.PI/2;inner.position.y=.006;group.add(inner);
    group.position.set(zone.x,.16,zone.z);group.scale.setScalar(zone.radius);scene.add(group);
    return {group,inner,disk,outer};
  }
  function removeGroup(group){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});}
  return {
    handle,
    setQuality(value,scale=1){balanced=value==='balanced';detailScale=scale;particleBudget=Math.round((balanced?420:900)*scale);smokeBudget=Math.round((balanced?90:250)*scale);particles.length=Math.min(particles.length,particleBudget);smoke.length=Math.min(smoke.length,smokeBudget);spectacle.setQuality(value,scale);projectiles.setQuality(value,scale);},
    reset(){spectacle.reset();projectiles.reset();particles.length=0;smoke.length=0;sparkMesh.count=smokeMesh.count=0;for(const r of rings)r.mesh.visible=false;rings.length=0;
      for(const s of scorches){scene.remove(s);s.geometry.dispose();s.material.dispose();}scorches.length=0;
      for(const v of zoneVisuals.values())removeGroup(v.group);zoneVisuals.clear();shotLife=blastLife=0;},
    snapshot:()=>({...spectacle.snapshot(),...projectiles.snapshot(),particles:particles.length,smoke:smoke.length,particleBudget,smokeBudget}),
    update(sim,dt,time,camera,reduced=false){
      spectacle.update(sim,dt,time,reduced);
      drawParticles(sparkMesh,particles,dt,11,camera);drawParticles(smokeMesh,smoke,dt,-.1,camera);
      shotLife=Math.max(0,shotLife-dt);blastLife=Math.max(0,blastLife-dt);
      shotLight.intensity=shotLife*130;blastLight.intensity=blastLife*140;
      for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.age+=dt;const t=r.age/r.life;
        if(t>=1){r.mesh.visible=false;rings.splice(i,1);continue;}
        r.mesh.scale.setScalar(.4+r.radius*t);r.mesh.material.opacity=(1-t)*.7;
      }
      projectiles.update(sim,time);
      squadRing.position.set(sim.player.x,.16,sim.player.z+.7);
      squadRing.scale.set(1+Math.max(0,sim.player.squad-12)*.011,1+Math.max(0,sim.player.squad-9)*.027,1);
      squadGlow.position.copy(squadRing.position);squadGlow.position.y=.15;
      squadRing.material.color.setHex(sim.shield>0?0xb9b3ff:sim.buffs.overdrive>0?0xffd577:0x61d7f2);
      const zoneIds=new Set(sim.zones.map(z=>z.id));
      for(const [id,v] of zoneVisuals)if(!zoneIds.has(id)){removeGroup(v.group);zoneVisuals.delete(id);}
      for(const z of sim.zones){if(!zoneVisuals.has(z.id))zoneVisuals.set(z.id,zoneVisual(z));const v=zoneVisuals.get(z.id);
        v.inner.scale.setScalar(Math.max(.02,1-z.remaining/z.total));v.disk.material.opacity=(z.friendly?.07:.12)+Math.sin(time*15)*.04;}
    },
  };
}
