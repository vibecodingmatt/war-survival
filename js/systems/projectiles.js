import * as T from '../../vendor/three.module.min.js';
import { SHOT_STYLES } from '../../data/munitions.js?v=0.8.0';
import { mergeRigidParts } from '../core/geometry.js?v=0.8.0';

export function createProjectiles(scene){
  const d=new T.Object3D(),dir=new T.Vector3(),up=new T.Vector3(0,1,0),color=new T.Color();
  const core=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const rocketParts=[{geo:new T.CylinderGeometry(.07,.08,.9,6),p:[0,0,0],r:[0,0,0]},
    {geo:new T.ConeGeometry(.1,.3,6),p:[0,.6,0],r:[0,0,0]},
    {geo:new T.BoxGeometry(.32,.22,.025),p:[0,-.3,0],r:[0,0,0]},
    {geo:new T.BoxGeometry(.025,.22,.32),p:[0,-.3,0],r:[0,0,0]}];
  const geometries={tracer:new T.CylinderGeometry(.035,.045,1,5),orb:new T.IcosahedronGeometry(.11,1),shard:new T.OctahedronGeometry(.11),flame:new T.ConeGeometry(.11,1,6),rocket:mergeRigidParts(rocketParts)};
  for(const part of rocketParts)part.geo.dispose();
  const batches=new Map();let balanced=false,scale=1;
  function mesh(geometry,material,capacity=360){const m=new T.InstancedMesh(geometry,material,capacity);m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);return m;}
  for(const [key,geo] of Object.entries(geometries))batches.set(key,mesh(geo,core));
  const trails=mesh(new T.CylinderGeometry(.07,.13,1,5),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.25,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const halos=mesh(new T.TorusGeometry(.16,.025,4,12),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  return {
    setQuality(value,detail=1){balanced=value==='balanced';scale=detail;},
    reset(){for(const m of batches.values())m.count=0;trails.count=halos.count=0;},
    update(sim,time){
      for(const m of batches.values())m.count=0;trails.count=halos.count=0;
      const trailBudget=Math.round((balanced?160:360)*scale);
      for(let i=0;i<Math.min(360,sim.bullets.length);i++){
        const b=sim.bullets[i],style=SHOT_STYLES[b.weaponId]||SHOT_STYLES.rifle;
        const shape=b.pattern==='pulse'||b.pattern==='pinball'?'orb':b.pattern==='helix'?'shard':style.shape,m=batches.get(shape);
        dir.set(b.tx-b.x,b.ty-b.y,b.tz-b.z);const distance=dir.length();dir.normalize();
        const near=Math.min(1,distance/4),spiral=b.pattern==='helix',fan=b.pattern==='fanfire';
        const side=spiral?Math.cos(b.life*28+b.pellet*Math.PI)*.42*near:fan?(b.pellet-1)*Math.sin(Math.min(1,b.life*2)*Math.PI)*1.2*near:0;
        d.position.set(b.x+side,b.y+(spiral?Math.sin(b.life*28+b.pellet*Math.PI)*.42*near:0),b.z);
        d.quaternion.setFromUnitVectors(up,dir);
        const width=(b.prism?2.7:b.pattern==='pulse'?4.6:style.width)*(1+b.weaponLevel*.1);
        const length=shape==='orb'?width:style.length*(b.prism?1.25:1);
        d.scale.set(width,shape==='shard'?length*5:length,width);
        if(shape==='flame')d.scale.x*=1+Math.sin(b.life*31+i)*.25;
        d.updateMatrix();m.setMatrixAt(m.count,d.matrix);color.setHex(b.color);m.setColorAt(m.count++,color);
        if(trails.count<trailBudget){
          d.position.addScaledVector(dir,-length*.45);d.scale.set(width*.8,length*1.6,width*.8);d.updateMatrix();trails.setMatrixAt(trails.count,d.matrix);trails.setColorAt(trails.count++,color);
        }
        if((b.pattern==='pulse'||b.weaponId==='sun'||b.weaponId==='arc')&&halos.count<64){
          d.position.addScaledVector(dir,length*.45);d.rotation.z+=time*4;d.scale.setScalar(width*(1.1+Math.sin(time*10+i)*.16));d.updateMatrix();halos.setMatrixAt(halos.count,d.matrix);halos.setColorAt(halos.count++,color);
        }
      }
      for(const m of [...batches.values(),trails,halos]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
    },
    snapshot:()=>({shotShapes:Object.fromEntries([...batches].map(([key,m])=>[key,m.count])),shotTrails:trails.count}),
  };
}
