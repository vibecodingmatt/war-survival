import * as T from '../../vendor/three.module.min.js';
import { WORLDS } from '../../data/campaign.js?v=0.4.0';
import { randomSource } from '../core/math.js?v=0.4.0';

// Rebuild only the selected biome. Shared batches keep the mobile draw count bounded.
export function createAmbience(scene,surfaces){
  let root=null,profile=WORLDS[0],level=-1,weather=null,origins=null,mist=[],floaters=[],timeUniform={value:0};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#ffffff88');gradient.addColorStop(.45,'#ffffff44');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const cloudMap=new T.CanvasTexture(canvas);
  function setLevel(index){
    if(index===level)return;level=index;profile=WORLDS[index];
    if(root){scene.remove(root);const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
    root=new T.Group();scene.add(root);mist=[];floaters=[];
    const random=randomSource(741+index*139),range=(a,b)=>a+random()*(b-a);
    const mats={
      stone:new T.MeshStandardMaterial({color:profile.stone,map:surfaces.color,normalMap:surfaces.normal,normalScale:new T.Vector2(.5,.5),roughness:.86,metalness:.12}),
      bark:new T.MeshStandardMaterial({color:profile.biome==='ice'?0x738396:0x57443e,roughness:.9}),
      leaf:new T.MeshStandardMaterial({color:profile.leaf,roughness:.8}),
      gold:new T.MeshStandardMaterial({color:profile.accent,metalness:.65,roughness:.3}),
      glow:new T.MeshStandardMaterial({color:profile.accent,emissive:profile.accent,emissiveIntensity:.48,roughness:.3}),
      dark:new T.MeshStandardMaterial({color:profile.biome==='volcano'?0x3b3442:0x8497a4,map:surfaces.color,normalMap:surfaces.normal,roughness:.9}),
    };
    const geometries={box:new T.BoxGeometry(1,1,1),rock:new T.IcosahedronGeometry(1,1),orb:new T.SphereGeometry(1,14,9),cone:new T.ConeGeometry(1,1,7),pyramid:new T.ConeGeometry(1,1,4),tube:new T.CylinderGeometry(1,1,1,9),arch:new T.TorusGeometry(1,.17,8,32,Math.PI),ring:new T.TorusGeometry(1,.045,6,64)};
    const batches=new Map();
    const put=(shape,material,p,s,r=[0,0,0])=>{const key=shape+':'+material;if(!batches.has(key))batches.set(key,{shape,material,entries:[]});batches.get(key).entries.push({p,s,r});};
    for(const side of [-1,1]){
      for(let i=0;i<9;i++){
        const x=side*range(17,30),z=20-i*11,y=range(-3,0);
        if(profile.landmark==='crystals'){
          put('rock','stone',[x,y-2,z],[4,3,4]);
          for(let k=0;k<5;k++)put('cone',k%2?'glow':'stone',[x+range(-2,2),y+range(2,5),z+range(-2,2)],[range(.5,1.2),range(5,12),range(.5,1.2)],[range(-.2,.2),0,range(-.25,.25)]);
          put('tube','bark',[x+side*5,y+4,z],[.4,8,.4]);for(let k=0;k<3;k++)put('cone','leaf',[x+side*5,y+4+k*2,z],[3.4-k*.8,5,3.4-k*.8]);
        }else if(profile.landmark==='mushrooms'){
          const height=range(4,10);put('tube','stone',[x,y+height/2,z],[.65,height,.65]);
          put('orb','leaf',[x,y+height,z],[4,1.4,4]);put('orb','glow',[x,y+height-.4,z],[3.6,.35,3.6]);
          for(let k=0;k<5;k++)put('orb','glow',[x+range(-2,2),y+height+1.1,z+range(-2,2)],[.22,.1,.22]);
        }else if(profile.landmark==='pagoda'){
          put('tube','bark',[x,y+4,z],[.48,8,.48],[0,0,side*.12]);
          for(let k=0;k<5;k++)put('rock','leaf',[x+range(-2,2),y+7+range(0,2),z+range(-2,2)],[range(2,4),range(1.5,2.5),range(2,4)]);
        }else if(profile.biome==='jade'){
          for(let k=0;k<5;k++){const bx=x+range(-2,2),bz=z+range(-2,2);put('tube','leaf',[bx,y+4,bz],[.15,8,.15],[0,0,range(-.12,.12)]);for(let h=2;h<9;h+=2)put('orb','leaf',[bx+range(-.7,.7),y+h,bz],[1.4,.15,.65],[0,range(0,6),.2]);}
        }
      }
      if(['arches','monoliths','beacons'].includes(profile.landmark))for(let i=0;i<4;i++){
        const x=side*(18+i%2*7),z=9-i*27;
        if(profile.landmark==='arches'){
          put('arch','stone',[x,6,z],[5.5,8,5.5],[0,side*.3,0]);
          for(const dx of [-5.5,5.5])put('box','stone',[x+dx,1,z],[1.8,10,2]);
        }else{
          put('box','dark',[x,3,z],[2.5,12,2.5],[0,.4,side*.1]);put('cone','gold',[x,10,z],[1.9,3,1.9]);
          put('box','glow',[x,4,z+1.4],[.2,8,.12]);
          if(profile.landmark==='beacons'){const f=new T.Sprite(new T.SpriteMaterial({map:cloudMap,color:profile.accent,blending:T.AdditiveBlending,depthWrite:false}));f.position.set(x,12,z);f.scale.set(6,10,1);root.add(f);floaters.push({mesh:f,x,y:12,z,phase:i});}
        }
      }
      if(profile.landmark==='pagoda'){
        const x=side*24,z=-43;
        for(let floor=0;floor<3;floor++){
          put('box','bark',[x,2+floor*4,z],[7-floor,3.5,6-floor]);
          put('pyramid','gold',[x,4.7+floor*4,z],[8-floor,2,8-floor],[0,Math.PI/4,0]);
          for(const dx of [-2,2])put('box','glow',[x+dx,2+floor*4,z+3.05-floor*.5],[.8,1.6,.1]);
        }
      }
      if(profile.landmark==='islands')for(let i=0;i<5;i++){
        const x=side*(21+i*7),z=14-i*25,y=-2+i*2;
        put('cone','dark',[x,y-4,z],[5.5,10,5.5],[Math.PI,.6,side*.08]);put('rock','stone',[x,y+.3,z],[5.7,1.1,5.5]);
        for(const dx of [-2.5,2.5])put('tube','stone',[x+dx,y+3.2,z],[.45,5.7,.45]);
        put('arch','gold',[x,y+6,z],[2.5,2.5,2.5]);
        put('tube','bark',[x+1.5,y+2.2,z+2],[.18,4,.18],[0,0,.18]);
        for(let j=0;j<3;j++)put('rock','leaf',[x+1.5+(j-1)*.7,y+4,z+2],[1.5,1,1.4]);
        for(let j=0;j<4;j++)put('tube','leaf',[x+(j-1.5)*1.1,y-1,z+3.7],[.07,3+random()*3,.07],[0,0,.15]);
      }
    }
    if(profile.landmark==='volcano'){
      put('cone','dark',[-35,6,-94],[32,53,32]);put('cone','stone',[43,1,-124],[39,63,39]);
      put('orb','glow',[-35,27,-94],[7,.9,7]);
      for(let i=0;i<9;i++)put('box','glow',[-35+i*.6,24-i*3,-88+i*1.5],[.8,4,.3],[0,0,-.17]);
    }
    if(profile.landmark==='islands'){
      put('ring','gold',[0,21,-101],[17,17,17]);put('ring','glow',[0,21,-100.8],[15.8,15.8,15.8]);put('orb','dark',[0,24,-115],[11,11,2]);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;put('pyramid','glow',[Math.cos(a)*19,21+Math.sin(a)*19,-101],[1.1,2.3,1.1],[0,0,a-Math.PI/2]);}
    }
    const wind={value:0};
    mats.leaf.onBeforeCompile=shader=>{shader.uniforms.gustTime=wind;shader.vertexShader='uniform float gustTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=sin(gustTime+instanceMatrix[3].z*.3)*.09*max(0.,position.y+1.);');};
    timeUniform=wind;
    const dummy=new T.Object3D();
    for(const b of batches.values()){
      const mesh=new T.InstancedMesh(geometries[b.shape],mats[b.material],b.entries.length);
      b.entries.forEach((e,i)=>{dummy.position.set(...e.p);dummy.scale.set(...e.s);dummy.rotation.set(...e.r);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
      mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    }
    // Dispose unused resources too: switching sectors does not accumulate GPU allocations.
    const usedG=new Set([...batches.values()].map(b=>geometries[b.shape])),usedM=new Set([...batches.values()].map(b=>mats[b.material]));
    for(const g of Object.values(geometries))if(!usedG.has(g))g.dispose();for(const m of Object.values(mats))if(!usedM.has(m))m.dispose();
    if(profile.landmark==='falls'){
      const material=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{time:wind,tint:{value:new T.Color(profile.water)}},
        vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'varying vec2 v;uniform float time;uniform vec3 tint;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}void main(){float a=n(vec2(v.x*9.,v.y*3.+time*2.));float b=n(vec2(v.x*27.+a,v.y*10.+time*5.));float edge=smoothstep(.015,.17,v.x+.04*a)*(1.-smoothstep(.83,.985,v.x-.04*a));float foam=.4*a+.3*b;vec3 c=mix(tint,vec3(.88,.96,.96),.55+foam);gl_FragColor=vec4(c,edge*(.48+foam)*smoothstep(0.,.04,v.y));}'});
      const geometry=new T.PlaneGeometry(5.5,34);
      for(const side of [-1,1])for(let i=0;i<(index===2?3:2);i++){const fall=new T.Mesh(geometry,material);fall.position.set(side*(17+i*2),-12,8-i*32+(side>0?-12:0));fall.rotation.y=-side*.18;root.add(fall);}
      if(index===2){
        for(let i=0;i<6;i++){const rainbow=new T.Mesh(new T.TorusGeometry(10+i*.18,.1,4,48,Math.PI),new T.MeshBasicMaterial({color:new T.Color().setHSL(i/8,.7,.7),transparent:true,opacity:.18,depthWrite:false}));rainbow.position.set(-19,-6,-22);rainbow.rotation.y=.15;root.add(rainbow);}
      }
    }
    if(profile.biome==='ice'){
      const material=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:wind},
        vertexShader:'varying vec2 v;uniform float time;void main(){v=uv;vec3 p=position;p.z+=sin(p.x*.035+time*.3)*8.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
        fragmentShader:'varying vec2 v;uniform float time;void main(){float a=pow(sin(v.y*3.14159),2.)*(.3+.16*sin(v.x*100.+time));vec3 c=mix(vec3(.1,.9,.55),vec3(.4,.3,1.),v.y);gl_FragColor=vec4(c,a);}'});
      const aurora=new T.Mesh(new T.PlaneGeometry(220,32,40,8),material);aurora.position.set(0,12,-130);root.add(aurora);
    }
    for(let i=0;i<18;i++){
      const fog=new T.Sprite(new T.SpriteMaterial({map:cloudMap,color:profile.fog,transparent:true,opacity:profile.biome==='celestial'?.6:.26,depthWrite:false}));
      const x=(i%2?1:-1)*range(14,35),y=range(-23,-11),z=range(-90,30);fog.position.set(x,y,z);fog.scale.set(range(18,32),range(7,12),1);root.add(fog);mist.push({mesh:fog,x,y,z,phase:i});
    }
    if(profile.landmark==='pagoda'||profile.landmark==='beacons')for(let i=0;i<14;i++){
      const lantern=new T.Mesh(new T.BoxGeometry(.55,.9,.55),new T.MeshBasicMaterial({color:profile.accent}));const x=(i%2?1:-1)*range(12,22),y=range(1,16),z=range(-70,20);root.add(lantern);floaters.push({mesh:lantern,x,y,z,phase:i});
    }
    const positions=new Float32Array(420*3);
    for(let i=0;i<420;i++){positions[i*3]=range(-33,33);positions[i*3+1]=range(1,35);positions[i*3+2]=range(-80,25);}
    origins=positions.slice();const geometry=new T.BufferGeometry(),rain=['rain','storm'].includes(profile.weather);
    geometry.setAttribute('position',new T.BufferAttribute(rain?new Float32Array(420*6):positions,3));
    weather=rain?new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xbadcea,transparent:true,opacity:.24,depthWrite:false})):new T.Points(geometry,new T.PointsMaterial({color:profile.weather==='snow'?'#eefbff':profile.accent,size:['snow','petals','fireflies','stars'].includes(profile.weather)?.16:.07,map:cloudMap,transparent:true,opacity:.8,depthWrite:false,blending:['fireflies','stars','embers'].includes(profile.weather)?T.AdditiveBlending:T.NormalBlending}));root.add(weather);
  }
  return {setLevel,update(time,reduced=false){
    if(!root)return;const t=reduced?time*.15:time;timeUniform.value=t;
    for(const f of mist){f.mesh.position.x=f.x+Math.sin(t*.11+f.phase)*3;f.mesh.position.y=f.y+Math.sin(t*.15+f.phase)*.5;}
    for(const f of floaters){f.mesh.position.set(f.x+Math.sin(t*.22+f.phase)*.8,f.y+Math.sin(t*.6+f.phase)*.8,f.z);f.mesh.rotation.y=t*.12+f.phase;}
    const p=weather.geometry.attributes.position.array,w=profile.weather,fall=['rain','storm','snow','petals','sand'].includes(w),speed=w==='storm'?17:w==='rain'?11:w==='snow'?1.2:2;
    for(let i=0;i<420;i++){
      const rain=w==='rain'||w==='storm',j=i*(rain?6:3);
      p[j]=origins[i*3]+Math.sin(t*.4+i)*.7+(w==='sand'?Math.sin(t*.2)*7:0);
      p[j+1]=fall?35-((origins[i*3+1]+t*speed)%35):(origins[i*3+1]+t*.4)%35;
      p[j+2]=origins[i*3+2]+Math.sin(t*.15+i)*.6;
      if(rain){p[j+3]=p[j]-.18;p[j+4]=p[j+1]+1.2;p[j+5]=p[j+2];}
    }
    weather.geometry.attributes.position.needsUpdate=true;
  },snapshot:()=>({biome:profile.biome,landmark:profile.landmark,weather:profile.weather,level:level+1})};
}
