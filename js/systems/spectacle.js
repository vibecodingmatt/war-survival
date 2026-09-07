import * as T from '../../vendor/three.module.min.js';
import { flightPose } from '../core/flight.js?v=0.5.0';
import { POWERS } from '../../data/powers.js?v=0.5.0';

// Persistent pools: a full screen of chain lightning still costs two draw calls.
export function createSpectacle(scene) {
  const d=new T.Object3D(),up=new T.Vector3(0,1,0),dir=new T.Vector3(),color=new T.Color();
  const arcs=[],pulses=[],debris=[];
  const lines=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),900);
  const glowLines=new T.InstancedMesh(lines.geometry,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.2,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),900);
  const shards=new T.InstancedMesh(new T.OctahedronGeometry(1),new T.MeshStandardMaterial({color:0xffffff,metalness:.6,roughness:.3}),180);
  const meteors=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color:0xffe2a0,toneMapped:false}),12);
  for(const mesh of [lines,glowLines,shards,meteors]){mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(mesh);}
  const ringGeometry=new T.RingGeometry(.84,1,64),slashGeometry=new T.RingGeometry(.78,1,48,1,0,Math.PI*1.4);
  const pulsePool=Array.from({length:24},()=>{
    const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));mesh.visible=false;scene.add(mesh);return mesh;
  });
  const shieldMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},strength:{value:1}},
    vertexShader:'varying vec2 v;varying vec3 n;varying vec3 view;void main(){v=uv;n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);view=-p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec2 v;varying vec3 n;varying vec3 view;uniform float time;uniform float strength;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(view))),2.);float cells=pow(abs(sin(v.x*75.+v.y*32.))*abs(sin(v.x*75.-v.y*32.)),14.);float wave=pow(.5+.5*sin(v.y*20.-time*3.),12.);gl_FragColor=vec4(mix(vec3(.24,.6,1.),vec3(.65,.85,1.),rim),(.025+rim*.24+cells*.14+wave*.035)*strength);}' });
  const shield=new T.Mesh(new T.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),shieldMaterial);shield.visible=false;scene.add(shield);
  const droneRoot=new T.Group(),prismRoot=new T.Group();scene.add(droneRoot,prismRoot);
  const metal=new T.MeshStandardMaterial({color:0x293c65,metalness:.8,roughness:.24}),gold=new T.MeshStandardMaterial({color:0xded7a0,metalness:.7,roughness:.3});
  const energy=new T.MeshBasicMaterial({color:0x88f6ff,toneMapped:false});
  const droneGeometry=new T.OctahedronGeometry(.32),wingGeometry=new T.BoxGeometry(.8,.1,.32),orbitGeometry=new T.TorusGeometry(.47,.03,5,32);
  const drones=Array.from({length:3},()=>{
    const group=new T.Group();group.add(new T.Mesh(droneGeometry,energy));
    for(const side of [-1,1]){const wing=new T.Mesh(wingGeometry,metal);wing.position.x=side*.55;wing.rotation.z=side*.2;group.add(wing);const tip=new T.Mesh(new T.BoxGeometry(.12,.18,.36),gold);tip.position.x=side*.92;group.add(tip);}
    const halo=new T.Mesh(orbitGeometry,energy);halo.rotation.x=Math.PI/2;group.add(halo);droneRoot.add(group);return group;
  });
  const prisms=Array.from({length:4},()=>{const mesh=new T.Mesh(new T.OctahedronGeometry(.32),new T.MeshBasicMaterial({color:0xeb9dff,toneMapped:false}));mesh.scale.y=1.8;prismRoot.add(mesh);return mesh;});
  let lineCount=0;
  function segment(a,b,width,hex,intensity=1){
    if(lineCount>=900)return;
    dir.set(b.x-a.x,b.y-a.y,b.z-a.z);const length=dir.length();if(length<.001)return;
    d.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);d.quaternion.setFromUnitVectors(up,dir.normalize());d.scale.set(width,length,width);d.updateMatrix();
    lines.setMatrixAt(lineCount,d.matrix);color.setHex(hex).multiplyScalar(intensity);lines.setColorAt(lineCount,color);
    d.scale.set(width*4,length,width*4);d.updateMatrix();glowLines.setMatrixAt(lineCount,d.matrix);glowLines.setColorAt(lineCount,color);lineCount++;
  }
  function pulse(x,z,radius,hex,life=.7,kind='ring'){
    const mesh=pulsePool.find(m=>!m.visible);if(!mesh)return;
    mesh.visible=true;mesh.geometry=kind==='slash'?slashGeometry:ringGeometry;mesh.material.color.setHex(hex);
    mesh.position.set(x,.3,z);mesh.rotation.set(-Math.PI/2,0,0);pulses.push({mesh,radius,age:0,life,kind});
  }
  function scatter(x,z,hex,count=20){
    for(let i=0;i<count&&debris.length<180;i++){const angle=i*2.399+debris.length*.13,speed=2+i%5;debris.push({x,y:.4,z,vx:Math.cos(angle)*speed,vy:4+i%6,vz:Math.sin(angle)*speed,age:0,size:.05+(i%4)*.04,hex});}
  }
  return {
    handle(e){
      if(e.type==='powerBeam') {if(arcs.length>=50)arcs.shift();arcs.push({...e,life:.2});}
      if(e.type==='bossSwing'){pulse(e.x,e.z,e.radius*1.3,0xffb477,.45,'slash');pulse(e.x,e.z,e.radius,0xff583c,.7);scatter(e.x,e.z,0xa9abb2,28);}
      if(e.type==='bossImpact'){pulse(e.x,e.z,6,0x83d9ff,.8);scatter(e.x,e.z,0xc7e9ff,32);}
      if(e.type==='shieldBlock'){pulse(e.x,e.z,6.5,0xa5dfff,1);scatter(e.x,e.z,0x8eeaff,40);}
      if(e.type==='explosion'&&e.power==='starfall'){pulse(e.x,e.z,e.radius*1.5,0xffa465,.8);pulse(e.x,e.z,e.radius,0xe59bff,1.1);scatter(e.x,e.z,0xffd381,26);}
      if(e.type==='choiceTaken'){pulse(e.x,e.z,4,POWERS[e.kind].color,.9);pulse(e.rejectedX,e.z,3,0xb592dc,.7,'collapse');scatter(e.x,e.z,POWERS[e.kind].color,22);}
      if(e.type==='powerup'){const hex=POWERS[e.kind]?.color||0x9de9cf;pulse(e.x,e.z,6,hex,1.2);scatter(e.x,e.z,hex,36);}
      if(e.type==='death'&&e.boss){pulse(e.x,e.z,15,0xffd19a,1.5);pulse(e.x,e.z,10,0xb5eaff,1);scatter(e.x,e.z,0xf7c686,50);}
    },
    reset(){arcs.length=debris.length=0;for(const p of pulses)p.mesh.visible=false;pulses.length=0;lines.count=glowLines.count=shards.count=meteors.count=0;shield.visible=droneRoot.visible=prismRoot.visible=false;},
    update(sim,dt,time,reduced=false){
      lineCount=0;
      for(let i=arcs.length-1;i>=0;i--){const a=arcs[i];a.life-=dt;if(a.life<=0){arcs.splice(i,1);continue;}
        let previous={x:a.x,y:a.y,z:a.z};
        for(let j=1;j<=6;j++){const t=j/6,bend=j===6?0:Math.sin(j*19+a.tx*7)*.35;const next={x:a.x+(a.tx-a.x)*t+bend,y:a.y+(a.ty-a.y)*t+Math.abs(bend),z:a.z+(a.tz-a.z)*t};segment(previous,next,.035,a.color,a.life*4+.25);previous=next;}
      }
      for(const unit of [...sim.fallen,...sim.knockups,...sim.corpses])if(unit.flight&&unit.age<Math.min(2.3,2*unit.flight.vy/15)){
        const blue=sim.fallen.includes(unit)||sim.knockups.includes(unit);
        for(let j=0;j<5;j++){const age=unit.age-j*.045;if(age<=.045)break;const a=flightPose(unit,age),b=flightPose(unit,age-.045);a.y+=.8;b.y+=.8;segment(a,b,.038*(1-j/6),blue?0x94e7ff:0xffbc86,.75);}
      }
      let meteorCount=0;
      for(const zone of sim.zones)if(zone.power==='starfall'&&meteorCount<12){
        const t=1-zone.remaining/zone.total,at=u=>({x:zone.fromX+(zone.x-zone.fromX)*u,y:.3+24*Math.pow(1-u,1.3),z:zone.fromZ+(zone.z-zone.fromZ)*u});
        const p=at(t);d.position.set(p.x,p.y,p.z);d.rotation.set(time*7,t*9,0);d.scale.setScalar(.38+t*.32);d.updateMatrix();meteors.setMatrixAt(meteorCount++,d.matrix);
        for(let j=0;j<7;j++){const tail=Math.max(0,t-j*.026),next=Math.max(0,tail-.026);segment(at(tail),at(next),.25*(1-j/8),j<2?0xffe2ad:0xe686ff,1-j*.09);}
      }
      meteors.count=meteorCount;meteors.instanceMatrix.needsUpdate=true;
      for(let i=pulses.length-1;i>=0;i--){const p=pulses[i];p.age+=dt;const t=p.age/p.life;if(t>=1){p.mesh.visible=false;pulses.splice(i,1);continue;}
        const size=p.kind==='collapse'?p.radius*(1-t):.2+p.radius*(p.kind==='slash'?.7+t*.3:t);
        p.mesh.scale.setScalar(size);p.mesh.material.opacity=(1-t)*(reduced?.4:.85);p.mesh.rotation.z=p.kind==='slash'?t*3:0;p.mesh.position.y=p.kind==='slash'?.5+Math.sin(t*Math.PI)*1.1:.25;
      }
      let count=0;
      for(let i=0;i<debris.length;i++){const p=debris[i];p.age+=dt;if(p.age>1.5)continue;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=14*dt;if(p.y<.18){p.y=.18;p.vy=Math.abs(p.vy)*.25;p.vx*=.9;p.vz*=.9;}
        d.position.set(p.x,p.y,p.z);d.rotation.set(p.age*6,p.age*9,i);d.scale.setScalar(p.size*Math.min(1,(1.5-p.age)*3));d.updateMatrix();shards.setMatrixAt(count,d.matrix);color.setHex(p.hex);shards.setColorAt(count,color);debris[count++]=p;}
      debris.length=count;shards.count=count;shards.instanceMatrix.needsUpdate=true;if(shards.instanceColor)shards.instanceColor.needsUpdate=true;
      const p=sim.player,visible=sim.state!=='menu';shield.visible=visible&&sim.shield>0;
      shield.position.set(p.x,.2,p.z+.8);shield.scale.set(2.2+p.squad*.027,3,2.5+p.squad*.06);shieldMaterial.uniforms.time.value=time;shieldMaterial.uniforms.strength.value=.6+Math.min(1,sim.shield/30)*.4;
      droneRoot.visible=visible&&sim.buffs.tesla>0;prismRoot.visible=visible&&sim.buffs.prism>0;
      drones.forEach((drone,i)=>{const angle=sim.time*2+i*Math.PI*2/3;drone.position.set(p.x+Math.cos(angle)*3.1,3.2+Math.sin(time*3+i)*.1,p.z+Math.sin(angle)*2);drone.rotation.set(0,-angle,Math.sin(time*4+i)*.1);});
      prisms.forEach((prism,i)=>{const a=sim.time*1.3+i*Math.PI/2;prism.position.set(p.x+Math.cos(a)*3,2+Math.sin(a*2)*.5,p.z+Math.sin(a)*2.5);prism.rotation.set(a,0,a*.5);});
      lines.count=glowLines.count=lineCount;for(const mesh of [lines,glowLines]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    },
    snapshot:()=>({arcs:arcs.length,shards:shards.count,meteors:meteors.count,segments:lines.count,shield:shield.visible,drones:droneRoot.visible,prism:prismRoot.visible}),
  };
}
