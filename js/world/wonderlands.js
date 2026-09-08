import * as T from '../../vendor/three.module.min.js';
import { randomSource } from '../core/math.js?v=0.6.0';

// Each material/shape is one batch, including articulated petals, gears and creatures.
export function createWonderland(root,profile,clock,cloudMap,surfaces){
  const supported=['reef','gears','lotus','prisms','orrery'];
  if(!supported.includes(profile.landmark))return null;
  const random=randomSource(4921+supported.indexOf(profile.landmark)*91),range=(a,b)=>a+random()*(b-a);
  const materials={
    stone:new T.MeshStandardMaterial({color:profile.stone,map:surfaces.color,normalMap:surfaces.normal,roughness:.85,metalness:.12}),
    gold:new T.MeshStandardMaterial({color:0xd4a15c,roughness:.32,metalness:.65}),
    dark:new T.MeshStandardMaterial({color:0x243751,roughness:.4,metalness:.65}),
    leaf:new T.MeshStandardMaterial({color:profile.landmark==='gears'?0x357c52:profile.leaf,roughness:.8,side:T.DoubleSide}),
    pink:new T.MeshStandardMaterial({color:0xcd5b95,emissive:0x892558,emissiveIntensity:.2,roughness:.65,side:T.DoubleSide}),
    cyan:new T.MeshStandardMaterial({color:0x339da4,emissive:0x197b90,emissiveIntensity:.3,roughness:.5}),
    light:new T.MeshBasicMaterial({color:profile.accent,toneMapped:false}),
    ripple:new T.MeshBasicMaterial({color:profile.accent,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false}),
    glass:new T.MeshStandardMaterial({color:profile.accent,emissive:profile.accent,emissiveIntensity:.24,transparent:true,opacity:.46,depthWrite:false,side:T.DoubleSide,roughness:.2}),
  };
  const petal=new T.PlaneGeometry(1,1,8,12),pp=petal.attributes.position,uv=petal.attributes.uv;
  for(let i=0;i<pp.count;i++){const v=uv.getY(i);pp.setXYZ(i,(uv.getX(i)*2-1)*Math.pow(Math.sin(v*Math.PI),.75)*.8,v*3,Math.sin(v*Math.PI)*.6);}petal.computeVertexNormals();
  const geo={orb:new T.SphereGeometry(1,14,10),rock:new T.IcosahedronGeometry(1,2),bell:new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.54),box:new T.BoxGeometry(1,1,1),rod:new T.CylinderGeometry(.7,1,1,7),ring:new T.TorusGeometry(1,.075,7,48),gear:new T.RingGeometry(.63,1,48),crystal:new T.OctahedronGeometry(1),cone:new T.ConeGeometry(1,1,8),pad:new T.CircleGeometry(1,32,.2,5.8),petal};
  const batches=new Map(),d=new T.Object3D(),up=new T.Vector3(0,1,0),direction=new T.Vector3();
  geo.ripple=new T.RingGeometry(.985,1,64);
  const put=(shape,material,p,s=[1,1,1],r=[0,0,0],animate=null)=>{
    const key=shape+':'+material;if(!batches.has(key))batches.set(key,{shape,material,entries:[]});
    batches.get(key).entries.push({p,s,r,animate});
  };
  const rod=(a,b,r,material)=>{
    direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const length=direction.length();
    d.quaternion.setFromUnitVectors(up,direction.normalize());
    put('rod',material,a.map((n,i)=>(n+b[i])/2),[r,length,r],[d.rotation.x,d.rotation.y,d.rotation.z]);
  };
  const features=[];
  if(profile.landmark==='reef'){
    features.push('branching coral','pulsing jellyfish','swaying tentacles','bubble currents');
    for(const side of [-1,1])for(let i=0;i<7;i++){
      const x=side*(15+i%2*7),z=18-i*15,y=-5,h=range(6,12),mat=i%2?'pink':'cyan';
      put('rock','stone',[x,-7.3,z],[6.5,2.7,7.5],[0,i,0]);
      rod([x,y,z],[x+side,y+h,z],.35,mat);
      for(let j=0;j<5;j++){
        const a=j*2.4+i,base=[x+side*.5,y+h*(.35+j*.1),z],end=[x+Math.cos(a)*3,y+h*(.55+j*.09),z+Math.sin(a)*2];
        rod(base,end,.22,mat);rod(end,[end[0]+Math.cos(a)*.6,end[1]+1.5,end[2]+.3],.13,mat);
        put('orb','light',[end[0]+Math.cos(a)*.6,end[1]+1.5,end[2]+.3],[.18,.18,.18]);
      }
      const branch=(a,angle,len,depth)=>{
        const b=[a[0]+Math.sin(angle)*len,a[1]+Math.cos(angle)*len,a[2]+.2];rod(a,b,.05+depth*.045,mat);
        if(depth){branch(b,angle-.46,len*.7,depth-1);branch(b,angle+.46,len*.7,depth-1);}
      };
      for(let n=0;n<3;n++)branch([x+(n-1)*2,-5.5,z+3],(n-1)*.4,2.4,4);
      for(let n=0;n<7;n++)put('petal','cyan',[x+range(-4,4),-5.7,z+range(-4,4)],[.65,range(.6,1.5),.65],[.4,range(0,6.28),.3],(t,o)=>{o.rotation.z+=Math.sin(t*.7+i+n)*.12;});
    }
    for(let i=0;i<10;i++){
      const x=(i%2?1:-1)*range(12,26),z=range(-65,20),y=range(3,11),s=range(1.2,2.4),phase=i*1.7;
      const bob=t=>Math.sin(t*.65+phase)*1.3;
      put('bell','glass',[x,y,z],[s,s*.65,s],[0,0,0],(t,o)=>{const pulse=1+Math.sin(t*1.6+phase)*.07;o.position.y+=bob(t);o.scale.multiplyScalar(pulse);});
      put('orb','light',[x,y+.2,z],[s*.28,.23,s*.28],[0,0,0],(t,o)=>{o.position.y+=bob(t);});
      for(let n=0;n<7;n++)for(let k=0;k<5;k++){
        const a=n/7*Math.PI*2;
        put('rod','cyan',[x+Math.cos(a)*s*.65,y-.4-k*.6,z+Math.sin(a)*s*.65],[.035,.72,.035],[0,0,0],(t,o)=>{
          o.position.y+=bob(t);o.position.x+=Math.sin(t*1.6+phase+k*.55)*(.1+k*.09);o.rotation.z=Math.cos(t*1.6+phase+k*.55)*.2;
        });
      }
    }
  }
  if(profile.landmark==='gears'){
    features.push('interlocking clockwork','swinging pendulums','mechanical butterflies');
    for(const side of [-1,1])for(let i=0;i<4;i++){
      const x=side*(17+i%2*6),z=9-i*25,y=3,r=3.7-i*.2,spin=side*(i%2?-1:1)*.18;
      put('rod','stone',[x,-2,z],[.6,13,.6]);
      put('gear','gold',[x,y,z],[r,r,r],[0,0,0],(t,o)=>{o.rotation.z=t*spin;});
      put('ring','cyan',[x,y,z],[r*.62,r*.62,r*.62]);
      for(let j=0;j<16;j++){
        const a=j*Math.PI/8;
        put('box','gold',[x,y,z],[r*.22,r*.23,.5],[0,0,0],(t,o)=>{const b=a+t*spin;o.position.x+=Math.cos(b)*r;o.position.y+=Math.sin(b)*r;o.rotation.z=b;});
      }
      for(let j=0;j<4;j++)put('box','dark',[x,y,z+.1],[r*1.75,.17,.26],[0,0,j*Math.PI/4],(t,o)=>{o.rotation.z+=t*spin;});
      put('orb','gold',[x,y,z+.5],[.42,.42,.42]);
      put('rod','gold',[x,y-2,z+.7],[.065,4,.065],[0,0,0],(t,o)=>{o.rotation.z=Math.sin(t*1.2+i)*.4;o.position.x+=Math.sin(o.rotation.z)*2;o.position.y=y-Math.cos(o.rotation.z)*2;});
      put('orb','cyan',[x,y-4,z+.7],[.55,.55,.26],[0,0,0],(t,o)=>{const a=Math.sin(t*1.2+i)*.4;o.position.x+=Math.sin(a)*4;o.position.y=y-Math.cos(a)*4;});
      for(let j=0;j<7;j++)put('rock','leaf',[x+range(-3,3),-3+range(0,2),z+range(-2,2)],[1.4,1.1,1.4]);
      for(let j=0;j<10;j++)put('petal','leaf',[x+range(-3,3),-1.5,z+range(-2,2)],[.6,.8,.6],[.7,range(0,6.28),.4],(t,o)=>{o.rotation.z+=Math.sin(t*.5+j)*.12;});
    }
    for(let i=0;i<16;i++){
      const x=(i%2?1:-1)*range(11,26),y=range(3,10),z=range(-75,25);
      for(const side of [-1,1]){
      put('petal',i%2?'cyan':'pink',[x,y,z],[.6,.6,.6],[0,0,0],(t,o)=>{o.position.x+=Math.sin(t*.6+i)*2;o.position.y+=Math.cos(t+i)*.5;o.rotation.set(.4,side*Math.sin(t*7+i)*.9,side*1.1);});
      }
    }
  }
  if(profile.landmark==='lotus'){
    features.push('unfurling lotus flowers','lily pads','water ripples','dancing wisps');
    for(let i=0;i<22;i++){
      const x=(i%2?1:-1)*range(11,30),z=range(-85,25),y=-3,scale=range(.7,1.7),phase=i*2.4;
      put('pad','leaf',[x,y-.3,z],[scale*3,scale*3,scale*3],[-Math.PI/2,0,phase]);
      put('orb','gold',[x,y+.3,z],[scale*.65,scale*.4,scale*.65]);
      for(let j=0;j<10;j++){
        const a=j*Math.PI/5;
        put('petal',j%2?'pink':'glass',[x,y,z],[scale,scale,scale],[0,a,0],(t,o)=>{o.rotation.set(.85+Math.sin(t*.35+phase)*.24,a,0,'YXZ');o.position.y+=Math.sin(t*.7+phase)*.08;});
      }
      put('ripple','ripple',[x,y-.22,z],[scale*4,scale*4,scale*4],[-Math.PI/2,0,0],(t,o)=>{o.scale.multiplyScalar(1+Math.sin(t*.8+phase)*.08);});
    }
    for(let i=0;i<20;i++){
      const x=(i%2?1:-1)*range(12,25),z=range(-75,18),y=range(1,6);
      const sprite=new T.Sprite(new T.SpriteMaterial({map:cloudMap,color:i%2?0xffa1d8:0x8befff,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
      sprite.scale.set(1.6,1.6,1);root.add(sprite);features.push({update:t=>sprite.position.set(x+Math.sin(t*.6+i)*2,y+Math.cos(t*.8+i)*.6,z+Math.cos(t*.4+i))});
    }
  }
  if(profile.landmark==='prisms'){
    features.push('levitating crystal gardens','orbital fragments','aurora ribbons');
    for(const side of [-1,1])for(let i=0;i<7;i++){
      const x=side*(16+i%2*8),z=20-i*17,y=3+i%3,phase=i+side;
      put('crystal',i%2?'cyan':'pink',[x,y,z],[1.8,5,1.8],[0,phase,.12],(t,o)=>{o.position.y+=Math.sin(t*.5+phase);o.rotation.y+=t*.15;});
      put('ring','light',[x,y,z],[3,3,3],[.7,.3,0],(t,o)=>{o.rotation.z=t*.3+phase;});
      for(let j=0;j<6;j++)put('crystal',j%2?'glass':'gold',[x,y,z],[.4,.7,.4],[0,0,0],(t,o)=>{const a=t*.4+phase+j*Math.PI/3;o.position.x+=Math.cos(a)*3.8;o.position.z+=Math.sin(a)*3.8;o.position.y+=Math.sin(a*2)*1.5;o.rotation.set(a,a,0);});
    }
  }
  if(profile.landmark==='orrery'){
    features.push('celestial orreries','orbiting planets','flying astral dragon');
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(19+i*6),z=8-i*35,y=6+i*2;
      put('rock','stone',[x,-3,z],[6,1.4,6],[0,i,0]);put('cone','dark',[x,-7,z],[5.3,7,5.3],[Math.PI,0,.08]);
      put('rod','stone',[x,-1,z],[1.2,10,1.2]);put('orb','light',[x,y,z],[1.4,1.4,1.4]);
      for(let j=0;j<3;j++){
        const r=3+j*1.1;
        put('ring',j%2?'cyan':'gold',[x,y,z],[r,r,r],[j*.75,.5,0],(t,o)=>{o.rotation.y+=t*.12*(j+1);});
        put('orb',j%2?'pink':'cyan',[x,y,z],[.5,.5,.5],[0,0,0],(t,o)=>{const a=t*(.25+j*.13)+i;o.position.x+=Math.cos(a)*r;o.position.y+=Math.sin(a)*r*Math.cos(j*.75);o.position.z+=Math.sin(a)*r*Math.sin(j*.75);});
      }
    }
    // A long articulated silhouette circles behind the gate, clear of the combat lanes.
    for(let j=0;j<24;j++)put('orb',j%3?'dark':'gold',[0,18,-100],[1.6*(1-j/30),1.2*(1-j/30),1.5],[0,0,0],(t,o)=>{
      const a=t*.13-j*.045;o.position.set(25+Math.sin(a)*8,8+Math.sin(a*2)*2-j*.1,-25+Math.cos(a)*14);o.rotation.y=a;
    });
    for(const side of [-1,1])for(let j=0;j<5;j++)put('petal',j%2?'gold':'glass',[0,20,-100],[2.4,3.7-j*.35,2],[0,0,0],(t,o)=>{
      const a=t*.13-.13;o.position.set(25+Math.sin(a)*8+side*3,9+Math.sin(a*2)*2,-25+Math.cos(a)*14);o.rotation.set(.6,a,side*(1.15+Math.sin(t*1.4)*.3+j*.11));
    });
  }
  if(['prisms','orrery','reef'].includes(profile.landmark)){
    const material=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:clock,tint:{value:new T.Color(profile.accent)}},
      vertexShader:'varying vec2 v;uniform float time;void main(){v=uv;vec3 p=position;p.y+=sin(p.x*.065+time*.35)*5.;p.z+=sin(p.x*.04+time*.2)*7.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader:'varying vec2 v;uniform float time;uniform vec3 tint;void main(){float edge=pow(sin(v.y*3.14159),2.);float ribbon=.55+.45*sin(v.x*55.+time*.7+v.y*4.);gl_FragColor=vec4(mix(tint,vec3(.35,.65,1.),v.x),edge*ribbon*.28);}'});
    const ribbon=new T.Mesh(new T.PlaneGeometry(190,20,60,8),material);ribbon.position.set(0,18,-115);root.add(ribbon);
  }
  const active=[];
  for(const batch of batches.values()){
    const mesh=new T.InstancedMesh(geo[batch.shape],materials[batch.material],batch.entries.length);mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=!['glass','light'].includes(batch.material);root.add(mesh);
    if(batch.entries.some(e=>e.animate))mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    active.push({mesh,entries:batch.entries,moving:batch.entries.some(e=>e.animate)});
  }
  const usedG=new Set(active.map(b=>b.mesh.geometry)),usedM=new Set(active.map(b=>b.mesh.material));
  for(const g of Object.values(geo))if(!usedG.has(g))g.dispose();for(const m of Object.values(materials))if(!usedM.has(m))m.dispose();
  let initialized=false;
  return {update(time){
    for(const batch of active){if(initialized&&!batch.moving)continue;
      batch.entries.forEach((e,i)=>{d.position.set(...e.p);d.scale.set(...e.s);d.rotation.set(e.r[0],e.r[1],e.r[2],'XYZ');e.animate?.(time,d);d.updateMatrix();batch.mesh.setMatrixAt(i,d.matrix);});batch.mesh.instanceMatrix.needsUpdate=true;
    }
    for(const f of features)if(f.update)f.update(time);initialized=true;
  },features:features.filter(f=>typeof f==='string')};
}
