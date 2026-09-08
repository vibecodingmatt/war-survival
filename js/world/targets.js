import * as T from '../../vendor/three.module.min.js';
import { MAX_SQUAD, SUPPLY_EXIT } from '../../data/waves.js?v=0.7.2';
import { createSupplies } from './supplies.js?v=0.7.2';
import { createChoiceTargets } from './choices.js?v=0.7.2';

function canvasTexture(width,height,draw){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');draw(ctx,width,height);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  return {canvas,ctx,texture};
}
export function createTargets(scene){
  const recruits=new Map(),supplies=createSupplies(scene),choices=createChoiceTargets(scene);
  const faceMats=new Map([1,3].map(amount=>{
  const card=canvasTexture(160,160,(ctx,w,h)=>{
    const fill=ctx.createLinearGradient(0,0,0,h);fill.addColorStop(0,'#46caff');fill.addColorStop(1,'#125bba');
    ctx.fillStyle=fill;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#a3e6ff';ctx.lineWidth=5;ctx.strokeRect(6,6,w-12,h-12);
    ctx.fillStyle='#fff';ctx.font='bold 96px Arial';ctx.textAlign='center';ctx.shadowColor='#123461';ctx.shadowBlur=8;ctx.fillText('+'+amount,w/2,111);
  });
  const faceMat=new T.MeshStandardMaterial({map:card.texture,roughness:.32,metalness:.1,emissive:0x155888,emissiveIntensity:.5});
  return [amount,faceMat];}));
  const sideMat=new T.MeshStandardMaterial({color:0x147cbd,metalness:.35,roughness:.38});
  const bodyGeometry=new T.BoxGeometry(1.25,1.25,.46),faceGeometry=new T.PlaneGeometry(1.22,1.22);
  const armoryCanvas=canvasTexture(384,512,()=>{});
  const armory=new T.Group();
  const frame=new T.Mesh(new T.BoxGeometry(2.9,3.85,.3),new T.MeshStandardMaterial({color:0xb79858,metalness:.7,roughness:.32}));
  const front=new T.Mesh(new T.PlaneGeometry(2.76,3.69),new T.MeshStandardMaterial({map:armoryCanvas.texture,roughness:.6,emissive:0x6f501a,emissiveIntensity:.24}));
  front.position.z=.16;armory.add(frame,front);armory.position.set(5.45,2.5,-4);scene.add(armory);
  const halo=new T.Mesh(new T.RingGeometry(.65,1.1,32),new T.MeshBasicMaterial({color:0xffce79,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));
  halo.rotation.x=-Math.PI/2;halo.position.y=-2.2;armory.add(halo);
  let previous='',hit=0,lastDraw=-1,lastLevel=0;
  function drawArmory(target,next,remaining){
    const c=armoryCanvas.ctx,w=384,h=512,progress=target?1-Math.max(0,target.hp)/target.maxHp:1;
    c.fillStyle='#162e36';c.fillRect(0,0,w,h);
    const fill=c.createLinearGradient(0,0,0,h);fill.addColorStop(0,'#3b5960');fill.addColorStop(1,'#10252b');c.fillStyle=fill;c.fillRect(12,12,w-24,h-24);
    c.textAlign='center';c.fillStyle='#f4d494';c.font='bold 21px Arial';c.fillText(target?'SHOOT TO UNLOCK':'ARMORY COMPLETE',w/2,53);
    c.font='bold 31px Arial';c.fillStyle='#fff3cf';c.fillText(next?.name||'SIEGE CANNON',w/2,99);
    c.save();c.translate(70,177);c.fillStyle='#adc7c9';c.strokeStyle='#ecddae';c.lineWidth=4;
    c.fillRect(30,10,120,38);c.fillRect(2,13,42,27);c.fillRect(75,46,18,42);c.fillRect(112,45,24,25);
    const barrels=next?.model===3?4:[8,9].includes(next?.model)?2:1;
    for(let i=0;i<barrels;i++){c.fillStyle=i%2?'#ebc481':'#c5d5d4';c.fillRect(143,7+i*12,95,barrels===1?22:9);}
    c.strokeStyle='#'+(next?.color||0xffdf94).toString(16).padStart(6,'0');c.strokeRect(26,7,126,44);c.restore();
    c.fillStyle='#91b6b9';c.font='18px Arial';c.fillText(target?'DAMAGE REMAINING':'MAXIMUM FIREPOWER',w/2,321);
    c.fillStyle='#fff';c.font='bold 66px Arial';c.fillText(target?Math.ceil(Math.max(0,target.hp)).toLocaleString():'MAX',w/2,392);
    c.fillStyle='#081b23';c.fillRect(35,421,314,20);c.fillStyle='#f2c974';c.fillRect(35,421,314*progress,20);
    c.fillStyle=remaining<=5?'#ff9c7d':'#c4d3c7';c.font='bold 23px Arial';c.fillText('PASSES IN '+Math.ceil(remaining)+'s',w/2,480);
    armoryCanvas.texture.needsUpdate=true;
  }
  return {
    update(sim,time){
      supplies.update(sim,time);
      choices.update(sim,time);
      const ids=new Set(sim.recruits.filter(r=>!sim.choice&&r.hp>0&&sim.player.squad<MAX_SQUAD).map(r=>r.id));
      for(const [id,group] of recruits)if(!ids.has(id)){scene.remove(group);recruits.delete(id);}
      for(const target of sim.recruits){
        if(!ids.has(target.id))continue;
        let group=recruits.get(target.id);
        if(!group){group=new T.Group();const body=new T.Mesh(bodyGeometry,sideMat),face=new T.Mesh(faceGeometry,faceMats.get(target.amount||1));face.position.z=.24;group.add(body,face);scene.add(group);recruits.set(target.id,group);}
        group.position.set(target.x,1.02+Math.sin(time*2+target.id)*.045,target.z);
        group.rotation.x=-.08;group.scale.setScalar(1);
      }
      armory.visible=!!sim.armory&&!sim.choice;
      const remaining=sim.armory?(SUPPLY_EXIT-sim.armory.z)/sim.levelData.weaponSpeed:0;
      const key=(sim.armory?sim.armory.id+':'+Math.ceil(sim.armory.hp):'none')+':'+Math.ceil(remaining)+':'+sim.player.weaponLevel+':'+sim.level;
      if(sim.armory&&key!==previous&&(time-lastDraw>.1||lastLevel!==sim.player.weaponLevel)){drawArmory(sim.armory,sim.weapons[sim.player.weaponLevel],remaining);previous=key;lastDraw=time;lastLevel=sim.player.weaponLevel;}
      if(sim.armory)armory.position.set(sim.armory.x,sim.armory.y+Math.sin(time*2)*.12,sim.armory.z);
      hit=sim.armory?.hit||0;front.material.emissiveIntensity=.2+hit*.8;
      armory.rotation.z=Math.sin(time*42)*hit*.009;
      sideMat.emissive.setHex(sim.focus==='recruits'?0x13578c:0x000000);
    },
    snapshot:()=>({recruits:recruits.size,armory:armory.visible,armoryZ:armory.position.z,choice:choices.snapshot().visible}),
  };
}
