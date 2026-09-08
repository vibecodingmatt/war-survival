import * as T from '../../vendor/three.module.min.js';

export function createMythicEffects(scene){
  const well=new T.Group(),phoenix=new T.Group();scene.add(well,phoenix);
  const violet=new T.MeshBasicMaterial({color:0xbbacff,toneMapped:false}),gold=new T.MeshBasicMaterial({color:0xffdc94,toneMapped:false}),fire=new T.MeshBasicMaterial({color:0xff8355,toneMapped:false});
  const core=new T.Mesh(new T.SphereGeometry(.95,20,14),new T.MeshBasicMaterial({color:0x100f2c}));well.add(core);
  const rings=Array.from({length:3},(_,i)=>{const ring=new T.Mesh(new T.TorusGeometry(1.5+i*.65,.065,6,64),violet);ring.rotation.set(.5+i*.7,i*.3,0);well.add(ring);return ring;});
  const disk=new T.Mesh(new T.RingGeometry(1.2,4.2,64),new T.MeshBasicMaterial({color:0x8772ef,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));disk.rotation.x=-Math.PI/2;well.add(disk);
  const crystal=new T.OctahedronGeometry(1),orb=new T.SphereGeometry(1,12,8);
  const body=new T.Mesh(orb,gold);body.scale.set(.4,.45,1.1);phoenix.add(body);
  const head=new T.Mesh(orb,gold);head.position.set(0,.35,-.95);head.scale.set(.34,.35,.4);phoenix.add(head);
  const beak=new T.Mesh(crystal,fire);beak.position.set(0,.3,-1.4);beak.scale.set(.12,.12,.4);phoenix.add(beak);
  const wings=[];
  for(const side of [-1,1]){
    const wing=new T.Group();wing.position.x=side*.3;phoenix.add(wing);wings.push({wing,side});
    for(let i=0;i<7;i++){const feather=new T.Mesh(crystal,i%2?fire:gold);feather.position.set(side*(.35+i*.35),0,i*.16);feather.scale.set(.34,.14,1.1-i*.07);feather.rotation.y=-side*(.6+i*.07);wing.add(feather);}
  }
  for(let i=0;i<3;i++){const tail=new T.Mesh(crystal,i%2?gold:fire);tail.position.set((i-1)*.22,-.1,1.6);tail.scale.set(.17,.14,1.5);phoenix.add(tail);}
  well.visible=phoenix.visible=false;
  return {reset(){well.visible=phoenix.visible=false;},update(sim,time,segment){
    well.visible=!!sim.gravityWell;phoenix.visible=sim.buffs.phoenix>0||!!sim.phoenixFlight;
    if(well.visible){
      const w=sim.gravityWell;well.position.set(w.x,2,w.z);core.scale.setScalar(1+Math.sin(time*3)*.07);
      rings.forEach((ring,i)=>{ring.rotation.z=time*(.8+i*.4);ring.rotation.y=time*.3+i;});
      for(let j=0;j<3;j++)for(let i=0;i<28;i++){
        const at=n=>{const a=n*.21+time*2+j*2.094,r=1.3+n*.16;return {x:w.x+Math.cos(a)*r,y:2+n*.025,z:w.z+Math.sin(a)*r};};
        segment(at(i),at(i+1),.028,0xbca9ff,.7);
      }
      let links=0;for(const enemy of sim.enemies)if(enemy.hp>0&&Math.hypot(enemy.x-w.x,enemy.z-w.z)<11&&links++<18)segment({x:enemy.x,y:.7,z:enemy.z},{x:w.x,y:2,z:w.z},.014,0x8876db,.4);
    }
    if(phoenix.visible){
      const f=sim.phoenixFlight,t=f?Math.min(1,f.age/1.7):0;
      phoenix.position.set(f?Math.sin(t*Math.PI*2)*1.7:sim.player.x,f?4+Math.sin(t*Math.PI)*3:4.5+Math.sin(time*2)*.35,f?f.fromZ+(f.toZ-f.fromZ)*t:sim.player.z+1);
      phoenix.rotation.set(f?Math.sin(t*Math.PI)*.15:0,0,f?Math.cos(t*Math.PI*2)*.2:0);phoenix.scale.setScalar(1.5);
      for(const {wing,side} of wings)wing.rotation.z=side*(.2+Math.sin(time*8)*.5);
      for(let i=0;i<9;i++){
        const a={x:phoenix.position.x+Math.sin(time*7-i*.4)*.15,y:phoenix.position.y-i*.1,z:phoenix.position.z+2+i*.45};
        segment(a,{x:a.x,y:a.y-.1,z:a.z+.5},.12*(1-i/10),i%2?0xffdc94:0xff9870,.8);
      }
    }
  },snapshot:()=>({gravity:well.visible,phoenix:phoenix.visible})};
}
