import * as T from '../../vendor/three.module.min.js';
import { mergeRigidParts } from '../core/geometry.js?v=0.8.0';

// Authored geometry, merged by animated joint and material. Two draws per species.
// Birds have layered feathers; insects have segmented bodies, eyes and wing veins.
const PALETTES = {
  morpho:[0x16394c,0x159af0,0x8defff], monarch:[0x32221b,0xf39a32,0xffe3a3], lunamoth:[0x556d72,0x98e0ae,0xf4efb5],
  dragonfly:[0x158787,0xb7f4ef,0x326079], clockdragonfly:[0xb0833f,0x96d8d2,0xf3d498],
  firefly:[0x403b29,0xe7ef8a,0xc1a563], scarab:[0x257d81,0xe0bd78,0x164752],
  emberbeetle:[0x6d3430,0xff9e56,0xe4b660], clockbeetle:[0xb9863e,0x80cbb8,0x413b39],
  macaw:[0x16859c,0xf2bd53,0x14458b], kingfisher:[0x137fa2,0xf1a662,0xd8f0ec],
  swallow:[0x304f68,0xdad6bb,0x162c45], snowfinch:[0xd9e5e6,0x596e87,0xf2d69c],
  goose:[0xeceded,0x4b6473,0xecb15d], hawk:[0x92684a,0xf3d9ac,0x3c3c42],
  raven:[0x293248,0x5e7494,0x172534], songbird:[0xc0824f,0xefcc85,0x526f65],
  crane:[0xe8e4d3,0x344b5c,0xd77864], heron:[0xcce3e4,0x7089a0,0xe0ba6c],
  brassbird:[0xc3954e,0x8ed9ca,0x465760], prismbird:[0x89c7d3,0xe6b5e6,0x88a0da],
  bat:[0x4b3e62,0x9b81a7,0xc4afa1], koi:[0xf3e9d2,0xe18b62,0x3d7185],
  reeffish:[0xe9b153,0xeae8cf,0x293e53], ray:[0x426e8c,0x9ccfd4,0xe8dab5],
  manta:[0x324e75,0x9bcee1,0xeae9d7], prismray:[0x9387bc,0x92e3df,0xf0cde7],
  starray:[0x4b527e,0x8abdcf,0xebd4a1], skywhale:[0x526985,0xaccdd1,0xf4dfa7],
};

export function coloredMerge(parts) {
  const geometry = mergeRigidParts(parts), colors = [];
  for (const part of parts) {
    const c = new T.Color(part.color);
    for (let i = 0; i < part.geo.attributes.position.count; i++) colors.push(c.r,c.g,c.b);
  }
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors,3));
  for (const geo of new Set(parts.map(part => part.geo))) geo.dispose();
  return geometry;
}

export function surface(points) {
  const shape = new T.Shape(); shape.moveTo(points[0][0], -points[0][1]);
  for (const point of points.slice(1)) shape.lineTo(point[0], -point[1]);
  shape.closePath(); const flat = new T.ShapeGeometry(shape); flat.rotateX(-Math.PI/2);
  const expanded=flat.toNonIndexed(),p=expanded.attributes.position;let triangles=[];
  for(let i=0;i<p.count;i+=3)triangles.push([0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]));
  for(let pass=0;pass<2;pass++)triangles=triangles.flatMap(([a,b,c])=>{
    const midpoint=(u,v)=>u.map((value,i)=>(value+v[i])*.5),ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
    return [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]];
  });
  const positions=triangles.flat(1).flatMap(([x,y,z])=>[x,y+Math.sin(x*Math.PI*.55)*.045,z]);
  flat.dispose();expanded.dispose();const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}

export function buildWildlife(kind) {
  const [base, accent, trim] = PALETTES[kind], body = [], wing = [];
  const add = (list, geo, color, p=[0,0,0], s=[1,1,1], r=[0,0,0]) => list.push({geo,color,p,s,r});
  const orb = (list,color,p,s) => add(list,new T.SphereGeometry(1,10,7),color,p,s);
  const line = (list,color,a,b,r=.018) => {
    const direction=new T.Vector3(...b).sub(new T.Vector3(...a)), o=new T.Object3D();
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.clone().normalize());
    add(list,new T.CylinderGeometry(r,r*.8,direction.length(),5),color,a.map((v,i)=>(v+b[i])/2),[1,1,1],[o.rotation.x,o.rotation.y,o.rotation.z]);
  };
  const eyes = (x,y,z,size=.055) => {
    for(const side of [-1,1]) { orb(body,0x101a27,[side*x,y,z],[size,size,size]); orb(body,0xf4faf0,[side*(x+.012),y+.019,z-.015],[size*.3,size*.3,size*.3]); }
  };
  let family='bird', wingSpeed=5, wingLift=.65, size=1;
  if(['morpho','monarch','lunamoth'].includes(kind)) {
    family='butterfly'; wingSpeed=kind==='lunamoth'?3.7:5.6; wingLift=1.05; size=.8;
    orb(body,base,[0,0,.12],[.09,.11,.5]); orb(body,trim,[0,.035,-.25],[.12,.13,.2]); eyes(.08,.075,-.43,.035);
    for(const side of [-1,1]) { line(body,base,[side*.05,.05,-.38],[side*.2,.16,-.8],.012); orb(body,trim,[side*.2,.16,-.8],[.028,.028,.028]); }
    const edge = [[.06,-.35],[.29,-.85],[.78,-1.18],[1.24,-1.08],[1.51,-.72],[1.43,-.22],[.95,.08],[1.19,.4],[1.13,.83],[.74,1.03],[.31,.81],[.09,.27]];
    add(wing,surface(edge),base);
    add(wing,surface(edge),accent,[.045,.014,0],[.87,1,.85]);
    // A second inset catches the light like the blue scales of a morpho.
    add(wing,surface([[.18,-.37],[.59,-.87],[1.16,-.76],[1.17,-.35],[.7,-.05],[.35,.37],[.91,.63],[.6,.78],[.2,.46]]),trim,[0,.025,0]);
    for(let i=0;i<6;i++) {
      const point=edge[i+2]; line(wing,base,[.14,.035,0],[point[0]*.9,.035,point[1]*.9],.013);
    }
    for(const [x,z,r] of [[.87,-.63,.11],[.72,.58,.14]]) {
      add(wing,new T.CircleGeometry(r,16),base,[x,.043,z],[1,1,1],[-Math.PI/2,0,0]);
      add(wing,new T.CircleGeometry(r*.5,12),kind==='morpho'?0xb9f5ff:trim,[x,.046,z],[1,1,1],[-Math.PI/2,0,0]);
    }
    for(let i=0;i<8;i++) { const p=edge[(i+2)%edge.length]; orb(wing,0xe6f5e8,[p[0]*.96,.02,p[1]*.96],[.027,.012,.027]); }
    if(kind==='lunamoth') add(wing,surface([[.7,.6],[.87,1.65],[.65,1.4],[.52,.65]]),accent);
    // Pattern both faces: the mirrored wing hinge exposes the underside in flight.
    const underside=wing.map(part=>({...part,geo:part.geo.clone(),p:[part.p[0],-part.p[1]-.018,part.p[2]],s:[part.s[0],-part.s[1],part.s[2]],r:[-part.r[0],part.r[1],-part.r[2]]}));
    wing.push(...underside);
  } else if(['dragonfly','clockdragonfly'].includes(kind)) {
    family='dragonfly'; wingSpeed=24; wingLift=.19; size=.85;
    for(let i=0;i<8;i++) orb(body,i%2?base:trim,[0,0,-.12+i*.12],[.085-i*.007,.075-i*.005,.09]);
    orb(body,base,[0,.04,-.28],[.13,.12,.19]); eyes(.135,.06,-.41,.084);
    for(const z of [-.25,.22]) {
      const outline=[[.06,z],[.45,z-.19],[1.27,z-.32],[1.5,z-.2],[1.26,z+.06],[.32,z+.13]];
      add(wing,surface(outline),accent);
      line(wing,trim,[.08,.013,z],[1.37,.013,z-.18],.014);
      for(let i=1;i<5;i++) line(wing,trim,[i*.25,.015,z-.1],[i*.25+.13,.015,z+.04],.007);
    }
  } else if(['scarab','emberbeetle','clockbeetle','firefly'].includes(kind)) {
    family=kind==='firefly'?'firefly':'beetle'; wingSpeed=17; wingLift=.34; size=kind==='firefly'?.42:.65;
    orb(body,base,[0,0,.07],[.25,.17,.39]); orb(body,trim,[0,.02,-.3],[.17,.14,.18]); eyes(.12,.065,-.41,.045);
    line(body,trim,[0,.175,-.18],[0,.175,.38],.017);
    for(const side of [-1,1]) for(let i=0;i<3;i++) line(body,trim,[side*.18,-.04,i*.18-.14],[side*.39,-.12,i*.23-.1],.024);
    orb(body,accent,[0,0,.37],[.19,.115,.17]);
    add(wing,surface([[.12,-.12],[.67,-.35],[1.07,-.08],[.92,.44],[.29,.32]]),accent);
    line(wing,trim,[.15,.014,0],[.91,.014,.11],.017);
    if(kind==='clockbeetle') add(body,new T.TorusGeometry(.16,.023,4,12),accent,[0,.18,.05],[1,1,1],[-Math.PI/2,0,0]);
  } else if(['ray','manta','prismray','starray','skywhale'].includes(kind)) {
    family=kind==='skywhale'?'whale':'ray'; wingSpeed=1.1; wingLift=.28; size=kind==='skywhale'?2.6:kind==='manta'?2:1.1;
    orb(body,base,[0,0,0],kind==='skywhale'?[.64,.48,1.8]:[.4,.18,.85]);
    orb(body,accent,[0,-.16,-.05],kind==='skywhale'?[.58,.31,1.5]:[.34,.1,.73]); eyes(kind==='skywhale'?.48:.29,.06,kind==='skywhale'?-1.12:-.52,.045);
    if(kind==='skywhale') {
      add(body,surface([[0,1.35],[.9,2.13],[1.15,2.2],[.8,2.45],[0,2.14],[-.8,2.45],[-1.15,2.2],[-.9,2.13]]),base);
      add(wing,surface([[.2,-.55],[1.1,-.2],[1.45,.55],[.78,.38],[.32,.03]]),base);
      for(let i=0;i<9;i++) orb(body,trim,[Math.sin(i*2.4)*.4,.42,Math.cos(i*2.4)*1.1],[.025,.025,.025]);
    } else {
      line(body,base,[0,0,.6],[0,-.04,2.1],.035);
      add(wing,surface([[.15,-.62],[.6,-.47],[1.55,.14],[2,.57],[1.03,.43],[.45,.86],[.18,.58]]),base);
      add(wing,surface([[.35,-.32],[1.5,.27],[.83,.27],[.34,.55]]),accent,[0,.015,0]);
      for(let i=0;i<6;i++) orb(wing,trim,[.5+i*.17,.028,.12+Math.sin(i)*.1],[.028,.01,.028]);
    }
  } else if(['koi','reeffish'].includes(kind)) {
    family='fish'; wingSpeed=4; wingLift=.4; size=.9;
    orb(body,base,[0,0,0],[.22,.35,.75]); eyes(.18,.09,-.48,.046);
    for(let i=0;i<3;i++) orb(body,i%2?trim:accent,[0,0,-.28+i*.31],[.232,.355,.065]);
    add(body,surface([[0,.58],[.5,1.17],[0,1.02],[-.5,1.17]]),accent,[0,0,0],[1,1,1],[0,0,Math.PI/2]);
    add(wing,surface([[.1,-.13],[.57,.06],[.61,.47],[.19,.22]]),accent);
  } else {
    const longNeck=['goose','crane','heron'].includes(kind), longTail=['swallow','macaw'].includes(kind);
    wingSpeed=['hawk','raven','crane','heron'].includes(kind)?2.2:4.5; size=longNeck?1.35:kind==='hawk'?1.4:.9;
    orb(body,base,[0,0,.02],[.24,.27,.65]); orb(body,accent,[0,-.13,-.14],[.19,.19,.43]);
    if(longNeck) { line(body,base,[0,.07,-.43],[0,.3,-.97],.09); orb(body,base,[0,.32,-1.02],[.14,.15,.22]); }
    else orb(body,base,[0,.18,-.49],[.19,.2,.23]);
    const z=longNeck?-1.14:-.64,y=longNeck?.32:.18; eyes(longNeck?.11:.15,y+.035,z,.04);
    add(body,new T.ConeGeometry(.075,longNeck?.46:.23,6),trim,[0,y,z-(longNeck?.25:.12)],[1,1,1],[-Math.PI/2,0,0]);
    add(body,surface([[0,.4],[.25,longTail?1.35:.93],[0,.89],[-.25,longTail?1.35:.93]]),base);
    if(longNeck) for(const side of [-1,1]) line(body,trim,[side*.12,-.15,.25],[side*.1,-.22,1.4],.025);
    if(kind==='bat') {
      family='bat'; wingSpeed=8; wingLift=.65;
      add(wing,surface([[.1,-.25],[.68,-.74],[1.6,-.47],[1.1,-.05],[1.23,.27],[.72,.18],[.68,.58],[.3,.32],[.12,.56]]),accent);
      for(const p of [[.68,-.74],[1.6,-.47],[1.23,.27],[.68,.58]]) line(wing,base,[.12,.02,-.14],[p[0],.02,p[1]],.021);
      for(const side of [-1,1]) add(body,new T.ConeGeometry(.09,.27,5),base,[side*.13,.43,-.46]);
    } else {
      add(wing,surface([[.13,-.31],[.6,-.42],[1.13,-.28],[1.73,.12],[1.19,.32],[.45,.3],[.13,.12]]),base);
      // Separate tapered flight feathers produce a scalloped silhouette and layered light.
      for(let i=0;i<8;i++) {
        const x=.45+i*.16,z=.06+i*.045;
        orb(wing,i<3?accent:base,[x,.015,z+.13],[.15,.035,.36-i*.015]);
        add(wing,surface([[x-.08,z+.09],[x+.1,z+.09],[x+.13,z+.43],[x,z+.51]]),trim,[0,-.005,0]);
      }
      add(wing,surface([[.25,-.23],[.84,-.27],[1.3,-.04],[.85,.04],[.27,.01]]),accent,[0,.05,0]);
    }
  }
  return { body:coloredMerge(body), wing:coloredMerge(wing), family, wingSpeed, wingLift, size,
    metallic:['morpho','clockdragonfly','clockbeetle','brassbird','prismray','prismbird'].includes(kind) };
}
