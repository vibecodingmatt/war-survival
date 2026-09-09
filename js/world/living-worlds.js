import * as T from '../../vendor/three.module.min.js';
import { randomSource } from '../core/math.js?v=0.8.1';
import { createWildlife } from './wildlife.js?v=0.8.1';

// All additions live under the biome root. No lights, textures, or per-particle meshes.
// The battlefield occupies |x| < 7.6; landmarks and wildlife stay outside that space.
const THEMES = {
  jungle: { garden:'flower', ribbon:'rainbow', colors:[0xffb7d5,0xffdb84,0x89e9b5], features:['orchid banks','rainbows in the waterfall mist'] },
  ember: { garden:'crystal', ribbon:'spiral', colors:[0xffb44e,0xff795c,0xffdc9a], features:['emberglass gardens','beacon fire spirals'] },
  jade: { garden:'flower', ribbon:'rainbow', colors:[0x9effdf,0xffffff,0xffbba3], features:['white water lilies','layered mist bows'] },
  ice: { garden:'crystal', ribbon:'orbit', colors:[0x91eaff,0xa7b2ff,0xe5fcff], features:['breathing frost crystals','glacial halo arcs'] },
  desert: { garden:'crystal', ribbon:'orbit', colors:[0xffd67e,0xffa475,0x91ede0], features:['amber geodes','golden oasis halos'] },
  storm: { garden:'crystal', ribbon:'spiral', colors:[0xa8baff,0x85e0f6,0xe7c0ff], features:['charged storm stones','monolith storm vortices'] },
  autumn: { garden:'flower', ribbon:'stream', colors:[0xffbd79,0xffe0a4,0xef8d99], features:['chrysanthemum terraces','rivers of gold leaves'] },
  volcano: { garden:'crystal', ribbon:'spiral', colors:[0xff7140,0xffc46a,0xf5423e], features:['molten obsidian seams','spiraling lava fountains'] },
  luminous: { garden:'flower', ribbon:'spiral', colors:[0xa7a1ff,0xffa7df,0x8affe6], features:['pulsing spore flowers','mycelium spore currents'] },
  celestial: { garden:'crystal', ribbon:'orbit', colors:[0xffe9b3,0xbcb6ff,0xa6e7ff], features:['cloud opal gardens','orbiting eclipse filaments'] },
  coral: { garden:'flower', ribbon:'stream', colors:[0xff9cce,0x89f4ed,0xffdaae], features:['swaying sea anemones','underwater caustic shafts'] },
  clockwork: { garden:'gear', ribbon:'orbit', colors:[0xffd38a,0x91ffd5,0xe7b876], features:['tiny clockwork daisies','escapement orbit rings'] },
  lotus: { garden:'flower', ribbon:'stream', colors:[0xffb7df,0xb7bbff,0x97eedd], features:['moonlit lotus terraces','silver moonlight currents'] },
  prismatic: { garden:'crystal', ribbon:'orbit', colors:[0xffa5df,0x9ffff4,0xc2a5ff], features:['rainbow crystal blooms','chromatic orbital trails'] },
  astral: { garden:'crystal', ribbon:'orbit', colors:[0xffdc94,0xb6b1ff,0x9beaff], features:['constellation gardens','celestial navigation rings'] },
};

export function createLivingWorld(root, profile, level, surfaces) {
  const theme=THEMES[profile.biome], random=randomSource(8181+level*73), range=(a,b)=>a+random()*(b-a);
  const d=new T.Object3D(), color=new T.Color(), time={value:0};
  const meshes=[];
  const add=mesh=>{root.add(mesh);meshes.push(mesh);return mesh;};
  function batch(geometry,material,count){
    const mesh=add(new T.InstancedMesh(geometry,material,count));mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);return mesh;
  }
  function put(mesh,i,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.set(rx,ry,rz);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  }
  const flower=theme.garden==='flower',gear=theme.garden==='gear';
  const gardenMaterial=new T.MeshStandardMaterial({color:0xffffff,metalness:gear?.7:.2,roughness:.42,emissive:profile.accent,emissiveIntensity:.16});
  gardenMaterial.onBeforeCompile=shader=>{
    shader.uniforms.gardenTime=time;
    shader.vertexShader='uniform float gardenTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.x+=sin(gardenTime*1.1+instanceMatrix[3].z*.3)*.12*max(0.,position.y);');
    shader.fragmentShader='uniform float gardenTime;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n totalEmissiveRadiance *= .6+.4*sin(gardenTime*1.3+vViewPosition.z*.12);');
  };
  const garden=batch(flower?new T.SphereGeometry(1,7,5):gear?new T.TorusGeometry(1,.23,4,12):new T.OctahedronGeometry(1),gardenMaterial,288);
  const stems=batch(new T.CylinderGeometry(.045,.085,1,5),new T.MeshStandardMaterial({color:profile.leaf,roughness:.85}),48);
  const banks=batch(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:new T.Color(profile.stone).multiplyScalar(.65),map:surfaces.color,normalMap:surfaces.normal,roughness:.95}),48);
  stems.visible=flower||gear;
  let gi=0;
  for(let i=0;i<48;i++){
    const side=i%2?1:-1,x=side*range(10.5,18),z=22-Math.floor(i/2)*4.6,y=range(-2.5,-.5),size=range(.4,.85);
    put(banks,i,x,y-.8,z,1.6,1.2,1.7,0,i*.7,.1);
    put(stems,i,x,y+.15,z,1,.7,1);
    for(let petal=0;petal<6;petal++){
      const a=petal*Math.PI/3,r=flower?.55:.38;
      put(garden,gi,x+Math.cos(a)*r*size,y+.65+(flower?0:.15*Math.sin(a)),z+Math.sin(a)*r*size,
        size*(flower?.46:.38),size*(flower?.17:gear?.52:1.4),size*(flower?.8:.42),flower?.22:0,-a,flower?0:Math.cos(a)*.35);
      garden.setColorAt(gi++,color.setHex(theme.colors[i%3]).multiplyScalar(.45));
    }
  }
  garden.instanceMatrix.setUsage(T.StaticDrawUsage);stems.instanceMatrix.setUsage(T.StaticDrawUsage);

  // Near-field focal points remain visible in portrait, where distant landmarks fall offscreen.
  const celestial=['celestial','clockwork','prismatic','astral'].includes(profile.biome),heroes=[];
  const jewel=new T.IcosahedronGeometry(1,1),hoop=new T.TorusGeometry(1,.035,5,48);
  for(const side of [-1,1]){
    const group=new T.Group();group.position.set(side*13.8,1.8,side<0?-16:-36);root.add(group);heroes.push(group);
    const center=new T.Mesh(celestial?new T.SphereGeometry(1,16,10):jewel,new T.MeshStandardMaterial({color:new T.Color(theme.colors[0]).multiplyScalar(.45),emissive:theme.colors[1],emissiveIntensity:.18,metalness:.55,roughness:.34}));
    center.scale.setScalar(celestial?1.35:flower?.7:1.1);if(!celestial&&!flower)center.scale.y=2.7;group.add(center);
    if(celestial){
      for(let j=0;j<3;j++){const orbit=new T.Mesh(hoop,new T.MeshBasicMaterial({color:theme.colors[j],toneMapped:false}));orbit.scale.setScalar(2.1+j*.35);orbit.rotation.set(.5+j*.65,j*.9,.2);group.add(orbit);}
      for(let j=0;j<3;j++){const moon=new T.Mesh(jewel,new T.MeshStandardMaterial({color:theme.colors[j],roughness:.5}));moon.scale.setScalar(.3+j*.1);group.add(moon);}
    }else{
      const ring=new T.Mesh(hoop,new T.MeshBasicMaterial({color:theme.colors[1],transparent:true,opacity:.6,depthWrite:false}));ring.scale.setScalar(2);ring.rotation.x=Math.PI/2;group.add(ring);
      // Petal crowns on botanical worlds, facets on geological worlds.
      for(let j=0;j<7;j++){const petal=new T.Mesh(jewel,center.material);petal.position.set(Math.cos(j*.898)*1.4,0,Math.sin(j*.898)*1.4);petal.scale.set(flower?.75:.4,flower?.22:1.2,flower?1.7:1.3);petal.rotation.set(flower?.3:0,-j*.898,0);group.add(petal);}
    }
  }

  // One ribbon draw for all of a world's animated arcs. UVs animate on the GPU.
  const positions=[],uv=[],tints=[];
  function point(side,band,t){
    const z=-21-band*24;
    if(theme.ribbon==='rainbow'){const a=t*Math.PI;return [side*(18+Math.cos(a)*8),-2+Math.sin(a)*(10+band*1.8),z];}
    if(theme.ribbon==='spiral'){const a=t*Math.PI*4+band;return [side*20+Math.cos(a)*(1+t*3),-3+t*(15-band*2),z+Math.sin(a)*4];}
    if(theme.ribbon==='orbit'){const a=t*Math.PI*2;return [side*22+Math.cos(a)*(7+band),5+Math.sin(a)*(6+band*.5),z+Math.sin(a)*3];}
    return [side*(15+Math.sin(t*10+band)*3),-1+Math.sin(t*6+band)*2,z+28-t*55];
  }
  for(const side of [-1,1])for(let band=0;band<3;band++)for(let i=0;i<64;i++){
    const a=point(side,band,i/64),b=point(side,band,(i+1)/64),width=theme.ribbon==='rainbow'?1.5:.6;
    for(const [p,u,v] of [[a,i/64,0],[b,(i+1)/64,0],[a,i/64,1],[a,i/64,1],[b,(i+1)/64,0],[b,(i+1)/64,1]]){
      positions.push(p[0],p[1]+(v-.5)*width,p[2]);uv.push(u,v);color.setHex(theme.colors[band]);tints.push(color.r,color.g,color.b);
    }
  }
  const ribbonGeometry=new T.BufferGeometry();ribbonGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));ribbonGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ribbonGeometry.setAttribute('color',new T.Float32BufferAttribute(tints,3));
  const ribbon=add(new T.Mesh(ribbonGeometry,new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexColors:true,uniforms:{time,opacity:{value:.45},rainbow:{value:theme.ribbon==='rainbow'?1:0}},
    vertexShader:'varying vec2 v;varying vec3 tint;uniform float time;void main(){v=uv;tint=color;vec3 p=position;p.x+=sin(time*.45+p.z*.07)*.22;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'varying vec2 v;varying vec3 tint;uniform float time;uniform float opacity;uniform float rainbow;void main(){float edge=pow(sin(v.y*3.14159),1.5);float flow=.2+.8*pow(.5+.5*sin(v.x*50.-time*2.),10.);vec3 spectrum=.65+.35*cos(6.28318*(v.y+vec3(0.,.33,.67)));gl_FragColor=vec4(mix(tint,spectrum,rainbow),edge*mix(flow,.5,rainbow)*opacity);}'
  })));

  // Six soft shafts suggest volumetric light without a postprocessing pass.
  const rays=add(new T.Mesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{time,tint:{value:new T.Color(profile.sun)}},
    vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 v;uniform float time;uniform vec3 tint;void main(){float shaft=pow(.5+.5*cos(v.x*38.+sin(v.y*5.+time*.2)),22.);float fade=sin(v.y*3.14159)*sin(v.x*3.14159);gl_FragColor=vec4(tint,shaft*fade*.065);}'
  })));
  rays.position.set(-20,9,-45);rays.scale.set(24,44,1);rays.rotation.z=-.26;
  const ray2=rays.clone();ray2.position.x=24;ray2.rotation.z=.26;add(ray2);

  const wildlife=createWildlife(root,profile.biome,level);
  return {
    features:[theme.features[0],wildlife.description,theme.features[1]],
    setQuality(value,scale=1){wildlife.setQuality(value,scale);},
    update(t,reduced=false){
      time.value=t;ribbon.material.uniforms.opacity.value=reduced?.25:.55;
      for(const [i,hero] of heroes.entries()){
        hero.rotation.y=Math.sin(t*.18+i)*.2;hero.position.y=1.8+Math.sin(t*.6+i)*.25;
        if(celestial){hero.children[0].rotation.y=t*.2;for(let j=1;j<=3;j++)hero.children[j].rotation.z=t*(j%2?.16:-.12);
          for(let j=0;j<3;j++){const a=t*(.35+j*.08)+j*2.1;hero.children[j+4].position.set(Math.cos(a)*(2.1+j*.35),Math.sin(a)*(1+j*.2),Math.sin(a)*(2+j*.3));}}
      }
      wildlife.update(t,reduced);
    },
    snapshot:()=>({details:[theme.features[0],wildlife.description,theme.features[1]],detailBatches:meshes.length+wildlife.batches,detailTime:time.value,...wildlife.snapshot()}),
  };
}
