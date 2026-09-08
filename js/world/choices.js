import * as T from '../../vendor/three.module.min.js';
import { POWERS } from '../../data/powers.js?v=0.8.0';

export function createChoiceTargets(scene) {
  const root=new T.Group();scene.add(root);root.visible=false;
  const box=new T.BoxGeometry(3.25,4.15,.24),plane=new T.PlaneGeometry(3.12,4.02),ring=new T.TorusGeometry(1,.035,6,48),crystal=new T.OctahedronGeometry(.36);
  const cards=[0,1].map(()=>{
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;
    const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const group=new T.Group(),rim=new T.MeshStandardMaterial({color:0xffffff,metalness:.6,roughness:.3});
    group.add(new T.Mesh(box,rim));
    const face=new T.Mesh(plane,new T.MeshBasicMaterial({map:texture,toneMapped:false}));face.position.z=.14;group.add(face);
    const gem=new T.Mesh(crystal,new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));gem.position.y=2.5;group.add(gem);
    const portal=new T.Mesh(ring,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));portal.rotation.x=-Math.PI/2;portal.position.y=-2.1;portal.scale.setScalar(1.8);group.add(portal);
    root.add(group);return {group,rim,gem,portal,ctx,texture,key:''};
  });
  const points=[];for(let i=0;i<32;i++){const t=i/31;points.push(new T.Vector3(-5.55+t*11.1,1.3+Math.sin(t*Math.PI)*.6,0));}
  const tether=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:0xc1b8f5,transparent:true,opacity:.4,dashSize:.3,gapSize:.3}));tether.computeLineDistances();root.add(tether);
  function draw(card,option,remaining,ready) {
    const c=card.ctx,spec=POWERS[option.kind],hex='#'+spec.color.toString(16).padStart(6,'0');
    c.clearRect(0,0,384,512);const gradient=c.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#29384d');gradient.addColorStop(1,'#091524');c.fillStyle=gradient;c.fillRect(0,0,384,512);
    c.strokeStyle=hex;c.lineWidth=5;c.strokeRect(9,9,366,494);c.textAlign='center';
    c.fillStyle=hex;c.font='bold 22px Arial';c.fillText('CHOOSE ONE',192,43);
    const title=spec.name.split(' '),last=title.length>1?title.pop():'';
    c.fillStyle='#fff';c.font='bold '+(option.kind==='reinforce'?76:54)+'px Arial';c.fillText(title.join(' '),192,107);
    c.font='bold 48px Arial';if(last)c.fillText(last,192,158);
    c.save();c.translate(192,219);c.strokeStyle=hex;c.fillStyle=hex;c.lineWidth=7;
    if(spec.symbol==='comet'){c.beginPath();c.arc(-9,14,24,0,Math.PI*2);c.fill();for(let i=0;i<3;i++){c.beginPath();c.moveTo(-9+i*13,3);c.lineTo(25+i*13,-49);c.stroke();}}
    else if(spec.symbol==='bolt'){c.beginPath();c.moveTo(9,-49);c.lineTo(-31,6);c.lineTo(-2,6);c.lineTo(-13,49);c.lineTo(34,-10);c.lineTo(7,-10);c.closePath();c.fill();}
    else if(spec.symbol==='prism'){c.beginPath();c.moveTo(0,-45);c.lineTo(40,31);c.lineTo(-40,31);c.closePath();c.stroke();c.beginPath();c.moveTo(-60,0);c.lineTo(0,0);c.stroke();for(let i=0;i<3;i++){c.beginPath();c.moveTo(0,0);c.lineTo(62,(i-1)*22);c.stroke();}}
    else if(spec.symbol==='vortex'){for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<40;i++){const a=i*.14+j*2.094,r=6+i;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(!i)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();}
    else if(spec.symbol==='phoenix'){c.beginPath();c.moveTo(0,35);c.lineTo(-55,-25);c.lineTo(-40,16);c.lineTo(-15,25);c.lineTo(0,-35);c.lineTo(15,25);c.lineTo(40,16);c.lineTo(55,-25);c.closePath();c.fill();}
    else if(spec.symbol==='duck'){c.beginPath();c.ellipse(0,16,47,28,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(20,-16,25,0,Math.PI*2);c.fill();c.fillStyle='#ff9751';c.fillRect(36,-16,26,13);c.fillStyle='#172743';c.beginPath();c.arc(25,-23,4,0,Math.PI*2);c.fill();}
    else if(spec.symbol==='tank'){c.fillRect(-47,4,94,32);c.fillRect(-27,-18,51,29);c.fillRect(12,-13,52,9);c.lineWidth=5;c.strokeRect(-51,39,102,10);c.fillRect(-3,-42,6,25);c.beginPath();c.ellipse(-12,-44,12,8,0,0,Math.PI*2);c.ellipse(12,-44,12,8,0,0,Math.PI*2);c.stroke();}
    else if(spec.symbol==='shield'){c.beginPath();c.moveTo(-37,-36);c.lineTo(37,-36);c.lineTo(29,19);c.lineTo(0,48);c.lineTo(-29,19);c.closePath();c.stroke();c.fillRect(-4,-19,8,42);c.fillRect(-20,-2,40,8);}
    else for(let i=0;i<3;i++){const x=(i-1)*35;c.beginPath();c.arc(x,-16,12,0,Math.PI*2);c.fill();c.fillRect(x-13,2,26,32);}
    c.restore();c.fillStyle='#dce9f5';c.font='bold 22px Arial';
    spec.detail.split(' · ').forEach((line,i)=>c.fillText(line,192,303+i*28));
    c.fillStyle=hex;c.font='bold 24px Arial';c.fillText(ready?'SHOOT TO CHOOSE':'RIFT OPENING',192,386);
    c.fillStyle='#060d18';c.fillRect(32,412,320,23);c.fillStyle=hex;c.fillRect(32,412,320*(1-option.hp/100),23);
    c.fillStyle='#bccedb';c.font='bold 22px Arial';c.fillText(Math.ceil(remaining)+'s · OTHER RIFT CLOSES',192,476);card.texture.needsUpdate=true;
  }
  return {update(sim,time){
    const choice=sim.choice;root.visible=!!choice;if(!choice)return;
    tether.position.z=choice.z;
    choice.options.forEach((option,i)=>{
      const card=cards[i],spec=POWERS[option.kind],remaining=(20-choice.z)/choice.speed;
      const key=option.kind+':'+Math.floor(option.hp/4)+':'+Math.ceil(remaining)+':'+(choice.age>=1.2);
      if(key!==card.key){draw(card,option,remaining,choice.age>=1.2);card.key=key;}
      card.group.position.set(option.x,option.y+Math.sin(time*2+i)*.1,option.z);
      card.group.scale.setScalar(Math.min(1,.6+choice.age*1.4));card.group.rotation.z=Math.sin(time*40)*option.hit*.014;
      card.rim.color.setHex(spec.color);card.gem.material.color.setHex(spec.color);card.portal.material.color.setHex(spec.color);
      card.gem.rotation.set(time*.7,time*1.7,0);card.portal.rotation.z=time*(i?1:-1);card.portal.material.opacity=.45+option.hit*.35;
    });
  },snapshot:()=>({visible:root.visible})};
}
