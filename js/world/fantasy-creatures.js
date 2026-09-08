import * as T from '../../vendor/three.module.min.js';
import { buildFantasy } from './fantasy-models.js?v=0.8.0';

export function createFantasyCreature(root,kind,level){
  const model=buildFantasy(kind),count=kind==='dragon'?2:1,parts={};
  const material=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:model.metallic?.36:.7,metalness:model.metallic?.65:.12});
  const base=new T.Object3D(),joint=new T.Object3D(),matrix=new T.Matrix4();
  let positions=[],poseTime=0;
  for(const name of ['body','head','motion','plinth'])if(model[name]){
    const mesh=new T.InstancedMesh(model[name],material,count*(name==='motion'&&model.wings?2:1));
    mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);parts[name]=mesh;
  }
  function put(name,index,p,r=[0,0,0],s=[1,1,1]){
    joint.position.set(...p);joint.rotation.set(...r);joint.scale.set(...s);joint.updateMatrix();matrix.multiplyMatrices(base.matrix,joint.matrix);parts[name].setMatrixAt(index,matrix);
  }
  function update(time,reduced=false){
    poseTime=time*(reduced?.35:1);positions=[];
    for(let i=0;i<count;i++){
      const side=level%2?1:-1;let x=side*13.1,y=kind==='frogking'?-3.3:.4,z=-30,yaw=-side*.38,bank=0,size=model.scale;
      if(kind==='dragon'){
        const a=poseTime*.14+i*Math.PI;x=(i?-1:1)*(15.5+Math.cos(a)*.5);y=1.2+i*.4+Math.sin(a*2)*.4;z=-67+Math.sin(a)*9-i*13;
        yaw=Math.atan2(-(i?-1:1)*Math.sin(a)*.5,Math.cos(a)*9);bank=Math.sin(a)*.2;size=1.4*(i?.88:1);
      }else if(kind==='nautilus'){x=-14.2+Math.sin(poseTime*.12)*.6;y=.8+Math.sin(poseTime*.3)*.5;z=-31+Math.cos(poseTime*.12)*2;yaw=.75;}
      base.position.set(x,y,z);base.rotation.set(0,yaw,bank);base.scale.setScalar(size);base.updateMatrix();
      const breathe=Math.sin(poseTime*1.1+i)*.012;
      put('body',i,[0,0,0],[0,0,0],[1,1+breathe,1]);
      const gaze=kind==='owl'?Math.sin(poseTime*.23)*.55:Math.sin(poseTime*.34)*.09;
      put('head',i,model.headPivot,[Math.sin(poseTime*.4)*.035,gaze,0]);
      if(model.wings){
        const spread=kind==='dragon'?.18+Math.sin(poseTime*1.75+i)*.48:kind==='griffin'?1.03:kind==='owl'?1.14:.55+Math.sin(poseTime*.28)*.2;
        for(const side of [-1,1])put('motion',i*2+(side>0?1:0),model.motionPivot,[0,0,side<0?Math.PI-spread:spread]);
      }else{
        const throat=kind==='frogking'?1+Math.pow(Math.max(0,Math.sin(poseTime*.65)),3)*.22:1;
        put('motion',i,model.motionPivot,[0,Math.sin(poseTime*.5)*.065,kind==='moonhare'?Math.sin(poseTime*.7)*.065:0],[1,throat,throat]);
      }
      if(parts.plinth)put('plinth',i,[0,0,0]);
      positions.push({kind,x:+x.toFixed(2),y:+y.toFixed(2),z:+z.toFixed(2),mode:kind==='dragon'?'circling':kind==='nautilus'?'swimming':'resting'});
    }
    for(const mesh of Object.values(parts))mesh.instanceMatrix.needsUpdate=true;
  }
  return {batches:Object.keys(parts).length,update,snapshot:()=>({signatureKind:kind,signatureCount:count,signaturePositions:positions,signaturePoseTime:poseTime})};
}
