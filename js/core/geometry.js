import * as T from '../../vendor/three.module.min.js';

// Bake rigid offsets once, then instance an entire material/bone batch per soldier.
// Keep indexed vertices: expanding every triangle would waste memory on curved armor.
export function mergeRigidParts(parts){
  let vertices=0,indices=0;
  for(const p of parts){vertices+=p.geo.attributes.position.count;indices+=p.geo.index?.count||p.geo.attributes.position.count;}
  const position=new Float32Array(vertices*3),normal=new Float32Array(vertices*3),uv=new Float32Array(vertices*2),index=new Uint32Array(indices);
  let vertexOffset=0,indexOffset=0;const transform=new T.Object3D();
  for(const p of parts){
    transform.position.set(...p.p);transform.rotation.set(...p.r);transform.scale.set(...(p.s||[1,1,1]));transform.updateMatrix();
    const baked=p.geo.clone().applyMatrix4(transform.matrix),n=baked.attributes.position.count;
    position.set(baked.attributes.position.array,vertexOffset*3);normal.set(baked.attributes.normal.array,vertexOffset*3);
    if(baked.attributes.uv)uv.set(baked.attributes.uv.array,vertexOffset*2);
    const count=baked.index?.count||n;
    for(let i=0;i<count;i++)index[indexOffset++]=vertexOffset+(baked.index?baked.index.getX(i):i);
    vertexOffset+=n;baked.dispose();
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(position,3));geometry.setAttribute('normal',new T.BufferAttribute(normal,3));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setIndex(new T.BufferAttribute(index,1));return geometry;
}
