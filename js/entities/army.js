import * as T from '../../vendor/three.module.min.js';
import { formation } from '../core/math.js';
import { MAX_SQUAD } from '../../data/waves.js';

const root = new T.Object3D(), limb = new T.Object3D(), partTransform = new T.Object3D();
const world = new T.Matrix4(), joint = new T.Matrix4(), tint = new T.Color();
const spheres = new Map();
function sphere(x,y,z) {
  const key=[x,y,z].join(',');
  if(!spheres.has(key)){const geometry=new T.SphereGeometry(1,12,8);geometry.scale(x,y,z);spheres.set(key,geometry);}
  return spheres.get(key);
}
const cylinder=(top,bottom,height,segments=10)=>new T.CylinderGeometry(top,bottom,height,segments);

function createArmy(scene, capacity, blue, heavy = false, weaponLevel = 1) {
  const cloth = new T.MeshStandardMaterial({color: blue?0x087fd6:0xa51d31,metalness:blue?.28:.45,roughness:.4});
  const darkCloth = new T.MeshStandardMaterial({color:blue?0x124e8c:0x521d28,roughness:.7});
  const gold = new T.MeshStandardMaterial({color:0xdcb85b,metalness:.74,roughness:.3});
  const steel = new T.MeshStandardMaterial({color:0x94a7a9,metalness:.82,roughness:.28});
  const darkSteel = new T.MeshStandardMaterial({color:0x27363b,metalness:.62,roughness:.42});
  const leather = new T.MeshStandardMaterial({color:0x302c28,roughness:.77});
  const skin = new T.MeshStandardMaterial({color:0xd6aa7b,roughness:.72});
  const stock = new T.MeshStandardMaterial({color:0x775235,metalness:.12,roughness:.5});
  const parts=[];
  function part(geo, material, p, r=[0,0,0], limbName=null) {
    const mesh=new T.InstancedMesh(geo,material,capacity);mesh.setColorAt(0,new T.Color(1,1,1));mesh.count=0;mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);
    parts.push({mesh,p,r,limbName,material});
  }
  // Tailored coat, curved breastplate, raised collar and riveted belt.
  part(cylinder(.35,.43,.53,12),darkCloth,[0,.93,0]);
  part(sphere(.34,.42,.25),cloth,[0,1.24,0]);
  part(cylinder(.29,.36,.12),gold,[0,1.03,0]);
  part(new T.BoxGeometry(.13,.13,.04),gold,[0,1.02,-.33]);
  part(cylinder(.22,.29,.14),darkCloth,[0,1.59,0]);
  part(cylinder(.21,.25,.06),gold,[0,1.65,0]);
  // Helmet dome, projecting rim, visor and a golden crown ridge.
  part(sphere(.245,.27,.235),skin,[0,1.79,-.02]);
  part(new T.SphereGeometry(.31,16,10,0,Math.PI*2,0,Math.PI*.65),cloth,[0,1.86,0]);
  part(cylinder(.337,.337,.035,16),gold,[0,1.77,0]);
  part(new T.BoxGeometry(.33,.095,.075),darkSteel,[0,1.83,-.248]);
  part(new T.BoxGeometry(.27,.026,.078),gold,[0,1.885,-.26]);
  part(new T.BoxGeometry(.042,.34,.48),gold,[0,1.98,-.015]);
  part(sphere(.19,.15,.11),cloth,[0,1.69,.21]);
  part(new T.BoxGeometry(.035,.33,.035),gold,[0,1.74,-.29]);
  for(const side of [-1,1]){
    part(sphere(.23,.18,.26),cloth,[side*.4,1.43,0]);
    part(sphere(.235,.06,.27),gold,[side*.4,1.53,0]);
    part(new T.BoxGeometry(.045,.25,.035),gold,[side*.21,1.26,-.238]);
    part(cylinder(.145,.12,.44),darkCloth,[0,-.19,0],[0,0,0],side<0?'leftLeg':'rightLeg');
    part(cylinder(.14,.17,.31),darkSteel,[0,-.42,-.01],[0,0,0],side<0?'leftLeg':'rightLeg');
    part(sphere(.17,.13,.28),leather,[0,-.58,-.1],[0,0,0],side<0?'leftLeg':'rightLeg');
    part(sphere(.16,.13,.12),gold,[0,-.28,-.11],[0,0,0],side<0?'leftLeg':'rightLeg');
  }
  if(blue){
    part(new T.BoxGeometry(.34,.4,.18),leather,[0,1.25,.3]);
    part(new T.BoxGeometry(.39,.07,.2),gold,[0,1.19,.32]);
    part(new T.BoxGeometry(.04,.6,.045),gold,[0,1.22,.265]);
    part(cylinder(.12,.13,.43),cloth,[-.32,1.25,-.25],[1.05,0,-.3]);
    part(cylinder(.12,.14,.4),cloth,[.34,1.3,-.25],[1.03,0,.16]);
    part(sphere(.105,.1,.12),skin,[-.15,1.23,-.43]);
    part(sphere(.105,.1,.12),skin,[.26,1.27,-.54]);
    if (weaponLevel === 1) {
    part(new T.BoxGeometry(.12,.16,.8),stock,[.23,1.31,-.38]);
    part(cylinder(.055,.068,1.31,10),steel,[.23,1.4,-1.03],[Math.PI/2,0,0]);
    part(cylinder(.085,.085,.14,10),gold,[.23,1.4,-1.52],[Math.PI/2,0,0]);
    part(cylinder(.082,.082,.08,10),gold,[.23,1.4,-.68],[Math.PI/2,0,0]);
    part(new T.BoxGeometry(.08,.07,.13),gold,[.23,1.48,-.66]);
    part(new T.ConeGeometry(.049,.36,4),steel,[.23,1.4,-1.84],[-Math.PI/2,0,0]);
    } else if (weaponLevel === 2) {
      part(new T.BoxGeometry(.22,.2,.86),darkSteel,[.23,1.35,-.58]);
      part(new T.BoxGeometry(.17,.24,.22),gold,[.23,1.2,-.7]);
      part(cylinder(.078,.085,1.1),steel,[.23,1.43,-1.15],[Math.PI/2,0,0]);
      part(cylinder(.11,.11,.12),gold,[.23,1.43,-1.65],[Math.PI/2,0,0]);
      part(new T.BoxGeometry(.06,.1,.22),gold,[.23,1.52,-.65]);
    } else if (weaponLevel === 3) {
      part(cylinder(.22,.24,.65),darkSteel,[.23,1.4,-.55],[Math.PI/2,0,0]);
      part(cylinder(.27,.27,.12),gold,[.23,1.4,-.78],[Math.PI/2,0,0]);
      part(cylinder(.24,.24,.1),gold,[.23,1.4,-1.75],[Math.PI/2,0,0]);
      for(let n=0;n<6;n++)part(cylinder(.045,.045,1.15,7),steel,[Math.cos(n*Math.PI/3)*.155,Math.sin(n*Math.PI/3)*.155,-.16],[Math.PI/2,0,0],'rotor');
      part(new T.BoxGeometry(.23,.26,.32),gold,[.55,1.37,-.5]);
    } else {
      part(cylinder(.17,.25,1.5,12),darkSteel,[.23,1.4,-.96],[Math.PI/2,0,0]);
      part(cylinder(.235,.235,.15,12),gold,[.23,1.4,-1.66],[Math.PI/2,0,0]);
      part(cylinder(.18,.18,.17,12),leather,[.23,1.4,-1.75],[Math.PI/2,0,0]);
      for(let n=0;n<3;n++)part(cylinder(.26,.26,.07,12),gold,[.23,1.4,-.52-n*.26],[Math.PI/2,0,0]);
      part(new T.BoxGeometry(.2,.25,.23),cloth,[.23,1.12,-.65]);
    }
  }else{
    part(new T.BoxGeometry(.28,.31,.14),leather,[-.27,.97,.1]);
    part(cylinder(.13,.16,.48),cloth,[-.45,1.23,.05],[.15,0,-.15],'leftArm');
    part(sphere(.115,.12,.115),skin,[-.48,.98,0],[0,0,0],'leftArm');
    part(cylinder(.14,.17,.44),cloth,[.47,1.25,-.1],[-.3,0,.16],'rightArm');
    part(sphere(.12,.12,.12),leather,[.48,1.06,-.17],[0,0,0],'rightArm');
    if(heavy){
      part(cylinder(.045,.045,2.05),stock,[.56,1.31,-.27],[.22,0,0],'rightArm');
      part(new T.BoxGeometry(.78,.48,.12),steel,[.56,2.03,-.44],[0,0,.2],'rightArm');
      part(new T.BoxGeometry(.28,.56,.2),gold,[.56,2.06,-.44],[0,0,.2],'rightArm');
      for(const side of [-1,1]) {
        part(new T.ConeGeometry(.11,.47,5),gold,[side*.5,1.75,.04],[0,0,-side*.45]);
        part(new T.ConeGeometry(.085,.32,5),steel,[side*.63,1.54,-.08],[0,0,-side*.95]);
      }
      part(new T.BoxGeometry(.48,.52,.035),cloth,[0,1.3,-.255]);
      part(new T.BoxGeometry(.045,.45,.05),gold,[0,1.32,-.28]);
      part(new T.BoxGeometry(.39,.045,.05),gold,[0,1.39,-.28]);
    }else{
      part(cylinder(.04,.05,.35,6),stock,[.5,1.03,-.24],[-.45,0,0],'rightArm');
      part(new T.BoxGeometry(.3,.035,.07),gold,[.5,1.21,-.32],[-.45,0,0],'rightArm');
      part(new T.BoxGeometry(.085,1.03,.035),steel,[.5,1.66,-.56],[-.45,0,0],'rightArm');
      part(new T.ConeGeometry(.062,.2,4),steel,[.5,2.19,-.81],[-.45,0,0],'rightArm');
      part(sphere(.095,.095,.095),darkSteel,[.28,.99,-.24]);
    }
  }
  return {
    update(units,time,moving=0,recoils=null,aim=null) {
      const count=Math.min(capacity,units.length);
      for(const p of parts)p.mesh.count=count;
      for(let i=0;i<count;i++){
        const unit=units[i], dead=unit.age!==undefined, age=unit.age||0, size=unit.scale||1;
        const phase=unit.phase??time*9+i;
        const gait=dead?0:Math.sin(phase)*(blue?Math.min(1,moving/3)*.6:.56);
        const bob=dead?0:Math.abs(Math.cos(phase))*(blue?.035:.065);
        root.position.set(unit.x,(unit.y||0)+bob,unit.z);
        root.rotation.set(0,aim&&!dead?aim[i]||0:unit.yaw||0,0);
        root.scale.set(size*(heavy?1.16:1),size,size);
        if(dead){
          const progress=Math.min(1,age*3.1);
          root.position.y=Math.max(.1,Math.sin(Math.min(1,age/1.1)*Math.PI)*unit.lift*.45);
          root.position.z+=Math.min(age,.8)*(unit.blast?-3.8:-1.5);
          root.rotation.x=-progress*Math.PI*.48;root.rotation.z=Math.sin(age*3)*.25+unit.spin*progress*.27;
          if(age>3.8)root.position.y-=(age-3.8)*1.7;
          root.scale.multiplyScalar(Math.max(.01,Math.min(1,(5-age)*1.3)));
        }
        if(blue&&recoils&&!dead)root.rotation.x=-recoils[i]*.045;
        root.updateMatrix();
        for(const p of parts){
          limb.position.set(0,0,0);limb.rotation.set(0,0,0);
          if(p.limbName==='leftLeg'||p.limbName==='rightLeg'){
            const sign=p.limbName==='leftLeg'?-1:1;
            limb.position.set(sign*.19,.72,0);limb.rotation.x=sign*gait+(dead?sign*.35:0);
          }else if(p.limbName==='rotor'){
            limb.position.set(.23,1.4,-1.18);limb.rotation.z=time*22;
          }else if(p.limbName){
            limb.rotation.x=(p.limbName==='leftArm'?gait:-gait)*.2;
            if(dead)limb.rotation.z=p.limbName==='leftArm'?-.55:.8;
          }
          limb.updateMatrix();
          partTransform.position.set(...p.p);partTransform.rotation.set(...p.r);partTransform.scale.set(1,1,1);partTransform.updateMatrix();
          joint.multiplyMatrices(limb.matrix,partTransform.matrix);world.multiplyMatrices(root.matrix,joint);
          p.mesh.setMatrixAt(i,world);
          const flash=dead?0:(unit.hit||0)*.7;
          tint.setRGB(1+flash*2,1+flash*1.6,1+flash*.8);p.mesh.setColorAt(i,tint);
        }
      }
      for(const p of parts){p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor)p.mesh.instanceColor.needsUpdate=true;}
    },
  };
}

export function createArmies(scene) {
  const squads=[1,2,3,4].map(level=>createArmy(scene,MAX_SQUAD*2,true,false,level));
  const legion=createArmy(scene,360,false),heavies=createArmy(scene,40,false,true);
  const blueUnits=Array.from({length:MAX_SQUAD},()=>({x:0,z:0,scale:1.08,phase:0}));
  return {
    update(sim,time) {
      const p=sim.player;
      for(let i=0;i<p.squad;i++){const f=formation(i,p.squad),u=blueUnits[i];u.x=p.x+f.x;u.z=p.z+f.z;u.phase=time*10+i*.8;}
      for(let level=0;level<4;level++){
        const units=level===p.weaponLevel-1?blueUnits.slice(0,p.squad):[];
        units.push(...sim.fallen.filter(soldier=>soldier.weaponLevel===level+1));
        squads[level].update(units,time,Math.hypot(p.vx,p.vz),sim.recoil,sim.aim);
      }
      const regular=[],heavy=[];
      for(const e of [...sim.enemies,...sim.corpses]) (e.type==='boss'||e.type==='brute'?heavy:regular).push(e);
      legion.update(regular,time);heavies.update(heavy,time);
    },
  };
}
