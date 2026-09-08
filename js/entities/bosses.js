import * as T from '../../vendor/three.module.min.js';
import { BOSS_TYPES } from '../../data/campaign.js?v=0.7.0';

// A few articulated hero models, separate from the instanced infantry.
export function createBosses(scene){
  const models=new Map();
  const geometry={box:new T.BoxGeometry(1,1,1),orb:new T.SphereGeometry(1,16,10),cone:new T.ConeGeometry(1,1,6),ring:new T.TorusGeometry(1,.065,6,32),tube:new T.CylinderGeometry(1,1,1,10)};
  geometry.wing=new T.BufferGeometry();geometry.wing.setAttribute('position',new T.Float32BufferAttribute([0,0,0, 4,2,-1, 3,-1,-2, 0,0,0, 3,-1,-2, 1,-1,-3],3));geometry.wing.computeVertexNormals();
  function build(kind){
    const spec=BOSS_TYPES[kind],group=new T.Group(),joints=[];
    const armor=new T.MeshStandardMaterial({color:spec.color,roughness:.35,metalness:.7});
    const trim=new T.MeshStandardMaterial({color:spec.accent,roughness:.26,metalness:.75});
    const dark=new T.MeshStandardMaterial({color:0x1b2734,roughness:.6,metalness:.5});
    const glow=new T.MeshStandardMaterial({color:spec.accent,emissive:spec.accent,emissiveIntensity:1.7,roughness:.25});
    const part=(shape,mat,p,s,r=[0,0,0],parent=group)=>{const mesh=new T.Mesh(geometry[shape],mat);mesh.position.set(...p);mesh.scale.set(...s);mesh.rotation.set(...r);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
    if(spec.shape==='dragon'){
      part('orb',armor,[0,3.7,0],[1.6,1.5,2.7]);part('orb',trim,[0,3.2,1.3],[1.15,.8,1.4]);
      part('orb',armor,[0,5.5,2.1],[1,1.1,1.4]);part('box',armor,[0,5.1,3.3],[1.2,.65,1.8]);
      for(const side of [-1,1]){
        part('orb',glow,[side*.8,5.7,2.9],[.18,.2,.35]);part('cone',trim,[side*.65,6.8,1.8],[.22,2,.22],[0,0,-side*.25]);
        const wing=new T.Group();wing.position.set(side*1.2,4.3,-.6);wing.scale.x=side;group.add(wing);joints.push({mesh:wing,wing:side});
        const membrane=armor.clone();membrane.side=T.DoubleSide;membrane.color.setHex(0x795b9d);part('wing',membrane,[0,0,0],[1.5,1.3,1.2],[0,0,0],wing);
        part('tube',trim,[2.8,1,-.6],[.09,6,.09],[0,0,-1.05],wing);
        for(const z of [-1.3,1.4]){part('box',armor,[side*1.25,1.6,z],[.65,2.7,.75],[.2,0,-side*.25]);for(let j=0;j<3;j++)part('cone',trim,[side*1.35+(j-1)*.23,.4,z+.6],[.12,.65,.12],[Math.PI/2,0,0]);}
      }
      for(let i=0;i<7;i++){const tail=part('orb',armor,[0,3.4-i*.22,-2.1-i*.65],[.95-i*.1,.7-i*.075,.9]);joints.push({mesh:tail,tail:i});part('cone',glow,[0,5-i*.12,-1.4-i*.7],[.2,.9-i*.06,.3]);}
    }else if(spec.shape==='crawler'){
      part('orb',armor,[0,2.9,0],[2.5,1.45,2.1]);part('orb',trim,[0,3.4,-.2],[1.8,1,1.6]);
      part('orb',glow,[0,3.2,1.85],[.75,.35,.24]);
      for(const side of [-1,1])for(let i=0;i<3;i++){
        const leg=new T.Group();leg.position.set(side*1.8,2.8,(i-1)*1.5);group.add(leg);
        part('box',armor,[side*.9,-.4,0],[2.3,.42,.45],[0,0,-side*.4],leg);
        part('cone',trim,[side*1.8,-1.55,0],[.28,2.7,.28],[0,0,side*.25+Math.PI],leg);joints.push({mesh:leg,phase:i+side});
      }
      for(let i=0;i<5;i++)part('cone',glow,[(i-2)*.65,4.4,0],[.25,1.8-Math.abs(i-2)*.3,.4],[0,0,(i-2)*-.16]);
    }else if(spec.shape==='tank'){
      for(const side of [-1,1]){
        part('box',dark,[side*2,1.1,0],[1.1,1.9,4.2]);
        for(let i=0;i<4;i++)part('tube',trim,[side*2.6,1.1,-1.4+i*.95],[.65,.22,.65],[0,0,Math.PI/2]);
        part('tube',dark,[side*.85,4,2],[.4,3.5,.4],[Math.PI/2,0,0]);part('tube',glow,[side*.85,4,3.7],[.45,.25,.45],[Math.PI/2,0,0]);
      }
      part('box',armor,[0,2.5,0],[4.6,1.7,3.7]);part('box',armor,[0,4,.2],[3.2,1.8,2.2]);
      part('orb',glow,[0,4.25,1.32],[.65,.16,.12]);
      for(let i=0;i<3;i++)part('cone',trim,[(i-1)*.9,5.7,-.3],[.25,1.4,.3]);
    }else{
      for(const side of [-1,1]){
        const leg=part('box',dark,[side*.85,1.4,0],[.85,2.8,1]);joints.push({mesh:leg,phase:side*Math.PI/2});
        part('box',trim,[side*.85,.4,.35],[1.1,.8,1.65]);
        part('orb',armor,[side*1.65,4.8,0],[.95,.8,.9]);
        part('cone',trim,[side*1.8,5.6,0],[.3,1.4,.4],[0,0,-side*.3]);
        const arm=new T.Group();arm.position.set(side*1.9,4.6,.15);group.add(arm);joints.push({mesh:arm,sweep:side});
        part('box',armor,[0,-.9,0],[.85,1.8,.85],[0,0,side*.1],arm);
      }
      part('orb',armor,[0,4.1,0],[1.6,1.9,1.05]);part('box',trim,[0,3.25,.1],[3.1,.35,2.1]);
      part('orb',armor,[0,6.25,0],[1,1.1,.92]);part('box',glow,[0,6.35,.88],[1.35,.2,.15]);
      for(let i=0;i<5;i++)part('cone',trim,[(i-2)*.42,7.4+Math.abs(i-2)*.12,0],[.15,1.2,.28],[0,0,(i-2)*-.16]);
      if(spec.shape==='knight'){
        const hammer=new T.Group();hammer.position.set(2.3,4.6,.6);group.add(hammer);joints.push({mesh:hammer,strike:true});
        part('tube',dark,[0,-1.2,0],[.18,5.8,.18],[0,0,0],hammer);part('box',trim,[0,1.3,0],[2.4,1.15,.9],[0,0,0],hammer);
        part('box',armor,[-2.4,3.9,.7],[1.7,2.7,.45]);part('box',glow,[-2.4,3.9,.96],[.12,2.1,.08]);
      }else if(spec.shape==='crystal'){
        for(const side of [-1,1])for(let i=0;i<3;i++)part('cone',glow,[side*(1.6+i*.5),4.5+i*.75,-.6],[.45,3.1,.55],[0,0,-side*(.25+i*.2)]);
      }else{
        const halo=part('ring',glow,[0,6,-.7],[3.4,3.4,3.4]);joints.push({mesh:halo,spin:true});
        for(const side of [-1,1])for(let i=0;i<4;i++)part('cone',trim,[side*(2.1+i*.6),5-i*.4,-.6],[.5,3.7-i*.4,.3],[0,0,-side*(.65+i*.12)]);
        part('orb',glow,[0,4.4,1],[.48,.48,.28]);
      }
    }
    scene.add(group);return {group,joints,armor,glow,kind};
  }
  return {update(sim,time){
    const units=[...sim.enemies,...sim.corpses].filter(e=>e.type==='boss');
    const ids=new Set(units.map(e=>e.id));
    for(const [id,m] of models)if(!ids.has(id)){scene.remove(m.group);m.group.traverse(o=>{if(o.material)o.material.dispose();});models.delete(id);}
    for(const e of units){
      let m=models.get(e.id);
      if(m&&m.kind!==e.bossType){scene.remove(m.group);m.group.traverse(o=>o.material?.dispose());models.delete(e.id);m=null;}
      if(!m){m=build(e.bossType);models.set(e.id,m);}
      const dead=e.age!==undefined,size=e.scale/3.7;
      const collapse=dead?Math.max(0,Math.min(1,(e.age-.65)/1.15)):0;
      m.group.position.set(e.x,dead?-collapse*.8-Math.max(0,e.age-2.8):Math.sin(time*2)*.08,e.z);
      m.group.rotation.set(dead?-collapse*Math.PI*.48:0,-(e.yaw-Math.PI),dead?Math.sin(e.age*25)*Math.max(0,1-e.age)*.06+e.spin*.12*collapse:0);
      const windup=e.swing>0?1-e.swing/1.05:0,strike=e.swing<=0&&e.recovery>0?Math.sin(e.recovery/.45*Math.PI):0;
      if(!dead){m.group.rotation.x=-windup*.3+strike*.38;m.group.rotation.z=Math.sin(windup*Math.PI)*.12;m.group.rotation.y+=windup*.32-strike*.6;}
      m.group.scale.setScalar(size*(dead?Math.max(.01,1-Math.max(0,e.age-3.3)*.75):1));
      m.armor.emissive.setHex(BOSS_TYPES[e.bossType].accent);m.armor.emissiveIntensity=dead?Math.max(0,1-e.age/1.3)*1.5:(e.hit||0)*.5;
      m.glow.emissiveIntensity=dead?Math.max(0,3-e.age*1.5):1.2+Math.sin(time*4)*.5+windup*3;
      if(!dead)for(const j of m.joints){if(j.wing){j.mesh.rotation.z=j.wing*(.15+Math.sin(time*2.8)*.28+windup*.5);}else if(j.tail!==undefined){j.mesh.position.x=Math.sin(time*2-j.tail*.5)*j.tail*.12;}else if(j.strike){j.mesh.rotation.x=-windup*1.5+strike*2.2;j.mesh.rotation.z=-windup*.5+strike*.65;}else if(j.sweep){j.mesh.rotation.x=-windup*1.3+strike*1.6;j.mesh.rotation.z=j.sweep*(windup*.65-strike*.85);}else if(j.spin)j.mesh.rotation.z=time*.4;else j.mesh.rotation.x=Math.sin(time*3+j.phase)*.16+windup*.4-strike*.6;}
    }
  }};
}
