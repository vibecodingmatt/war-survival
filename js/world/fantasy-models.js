import * as T from '../../vendor/three.module.min.js';
import { coloredMerge, surface } from './wildlife-models.js?v=0.8.1';

// Each silhouette is authored for one world. Four merged joints at most, no textures.
export function buildFantasy(kind) {
  const body=[],head=[],motion=[],plinth=[];
  let headPivot=[0,1.8,.8],motionPivot=[0,1,0],wings=false;
  let stone=0x647c68,metallic=false,scale=1.8;
  const add=(list,geo,color,p=[0,0,0],s=[1,1,1],r=[0,0,0])=>list.push({geo,color,p,s,r});
  const orb=(list,c,p,s)=>add(list,new T.SphereGeometry(1,16,10),c,p,s);
  const rock=(list,c,p,s)=>add(list,new T.IcosahedronGeometry(1,1),c,p,s);
  const cone=(list,c,p,s,r=[0,0,0])=>add(list,new T.ConeGeometry(1,1,7),c,p,s,r);
  const tube=(list,c,points,r=.1)=>add(list,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(12,points.length*6),r,7,false),c);
  const ring=(list,c,p,radius,tubeRadius=.045,r=[Math.PI/2,0,0])=>add(list,new T.TorusGeometry(radius,tubeRadius,6,36),c,p,[1,1,1],r);
  const eye=(x,y,z,c=0xf9d884,r=.13)=>{
    for(const side of [-1,1]){orb(head,0x162330,[side*x,y,z],[r*1.5,r*1.3,r*.8]);orb(head,c,[side*x,y,z+r*.6],[r,r,r*.45]);orb(head,0x14212c,[side*x,y,z+r*.9],[r*.28,r*.72,r*.2]);orb(head,0xfff7d5,[side*x-r*.2,y+r*.35,z+r],[r*.2,r*.2,r*.1]);}
  };
  const leg=(c,x,z,height=1.1,width=.26)=>{orb(body,c,[x,height*.52,z],[width,height*.62,width]);orb(body,c,[x,.16,z+.15],[width*1.4,.19,width*1.8]);};
  const horn=(list,c,points,r=.12)=>{tube(list,c,points,r);const tip=points.at(-1);cone(list,c,[tip[0],tip[1]+.13,tip[2]],[r*.8,.45,r*.8]);};
  const antler=(c,side,y,z)=>{
    horn(head,c,[[side*.35,y,z],[side*.65,y+.7,z-.15],[side*.9,y+1.5,z-.35],[side*1.2,y+2.05,z-.6]],.1);
    for(let i=0;i<3;i++)horn(head,c,[[side*(.57+i*.19),y+.6+i*.45,z-.1-i*.16],[side*(1.05+i*.3),y+.9+i*.5,z+.03],[side*(1.13+i*.3),y+1.25+i*.5,z-.1]],.07);
  };
  const feather=(list,c,a,b,width=.18)=>{
    const v=new T.Vector3(...b).sub(new T.Vector3(...a)),o=new T.Object3D();o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());
    add(list,new T.SphereGeometry(1,10,7),c,a.map((v,i)=>(v+b[i])/2),[width,v.length()*.6,width*.35],[o.rotation.x,o.rotation.y,o.rotation.z]);
  };
  if(kind==='mossback'){
    stone=0x5d775d;scale=2;
    orb(body,0x516e48,[0,1,0],[1.65,.65,2]);orb(body,0x315c48,[0,1.5,-.2],[1.65,1.1,1.8]);
    for(let row=0;row<4;row++)for(let col=0;col<5;col++){const a=col/4*Math.PI,z=-1.35+row*.8;rock(body,(row+col)%2?0x789060:0x426d54,[Math.cos(a)*1.47,1.6+Math.sin(a)*.92,z],[.42,.17,.4]);}
    for(const x of [-1.25,1.25])for(const z of [-1.15,1.15])leg(0x8b9867,x,z,.62,.4);
    headPivot=[0,1.1,1.4];orb(head,0x9ca779,[0,1.15,1.72],[.48,.36,.67]);eye(.25,1.29,2.24,0xe6c677,.095);
    for(let i=0;i<4;i++){const x=(i%2?1:-1)*(.3+i*.14),z=-.9+i*.43;tube(body,0x6d5a43,[[x,2,z],[x,2.65,z],[x+.1,2.9,z]],.075);orb(body,0x9cae70,[x,2.95,z],[.42,.16,.35]);}
    tube(motion,0x899368,[[0,.65,-1.6],[.3,.55,-2.2],[.65,.5,-2.5]],.12);
  }else if(kind==='qilin'||kind==='spiritstag'){
    const stag=kind==='spiritstag',coat=stag?0x526b91:0x2f9a89,trim=stag?0xb5f7ed:0xf4d08b;stone=stag?0x655d85:0x659486;
    orb(body,coat,[0,1.6,0],[.68,.75,1.25]);for(const x of [-.46,.46])for(const z of [-.82,.75]){leg(coat,x,z,1.2,.16);orb(body,trim,[x,.12,z+.07],[.2,.14,.25]);}
    orb(body,coat,[0,2.03,.83],[.48,.85,.46]);headPivot=[0,2.6,.98];orb(head,coat,[0,2.79,1.13],[.38,.52,.43]);orb(head,trim,[0,2.6,1.6],[.28,.25,.48]);eye(.25,2.88,1.47,stag?0xc6ffff:0xffe790,.09);
    for(const side of [-1,1]){antler(trim,side,3.1,.96);cone(head,coat,[side*.49,3.05,1.01],[.18,.7,.32],[0,0,-side*.55]);}
    for(let i=0;i<18;i++){const a=i*2.399,z=-.9+(i%6)*.34;rock(body,trim,[Math.cos(a)*.6,1.65+Math.sin(a)*.58,z],[.1,.06,.12]);}
    if(!stag)for(let i=0;i<9;i++)cone(body,0x8fd8b4,[0,2.32,-1+i*.25],[.22,.5,.27],[0,0,.15]);
    else for(let i=0;i<9;i++){const side=i%2?1:-1;orb(head,i%3?0x8ddedc:0xe0bff7,[side*(.8+i*.085),4.2+(i%3)*.45,.5],[.18,.1,.16]);}
    tube(motion,trim,[[0,1.7,-1],[.3,1.4,-1.65],[.55,.8,-1.95],[.75,.75,-2.05]],.15);
  }else if(kind==='mammoth'){
    stone=0x9dc3d4;scale=2.1;orb(body,0x8094ae,[0,1.65,0],[1.1,1.1,1.65]);
    for(const x of [-.74,.74])for(const z of [-1,1])leg(0x71869c,x,z,1.2,.36);
    for(let i=0;i<35;i++){const a=i*2.399,z=-1.3+(i%7)*.39;cone(body,i%2?0xb5c7d4:0x708ba5,[Math.cos(a)*.95,1.7+Math.sin(a)*.83,z],[.24,.7,.28],[.12,0,Math.PI+(Math.cos(a)*.4)]);}
    headPivot=[0,1.9,1.2];orb(head,0x9db5c9,[0,2.07,1.36],[.83,.9,.75]);eye(.42,2.3,1.94,0xabe8ff,.13);
    tube(head,0x829eb6,[[0,1.99,1.95],[0,1.17,2.2],[0,.55,2.45],[.32,.62,2.73]],.24);
    for(const side of [-1,1])for(let i=0;i<3;i++)horn(head,0xddf4ef,[[side*(.36+i*.16),1.66,1.87],[side*(.65+i*.16),1.05,2.25],[side*(.8+i*.2),1.6,2.85],[side*(.7+i*.2),2.05,2.9]],.11-i*.023);
    tube(motion,0x607994,[[0,1.9,-1.55],[.25,1.5,-1.95],[.35,1.1,-2]],.1);
  }else if(kind==='sphinx'){
    stone=0xa37d4f;scale=2.1;orb(body,0xd5ad68,[0,.65,-.35],[.9,.66,1.65]);orb(body,0xe4c580,[0,1.1,.8],[.7,.9,.7]);
    for(const x of [-.59,.59]){orb(body,0xdcb975,[x,.25,1.3],[.36,.28,1.25]);for(let i=0;i<3;i++)orb(body,0xf3dba0,[x+(i-1)*.16,.28,2.36],[.11,.12,.2]);}
    headPivot=[0,1.8,1.03];orb(head,0xeed1a0,[0,2.13,1.16],[.48,.63,.43]);orb(head,0xd6b784,[0,2.05,1.55],[.1,.2,.14]);eye(.22,2.25,1.51,0x50bac3,.08);
    for(const side of [-1,1])for(let i=0;i<8;i++)orb(head,i%2?0x287c99:0xe5c471,[side*(.45+i*.015),2.5-i*.16,1.08],[.25,.105,.5]);
    cone(head,0xf1d777,[0,2.91,1.08],[.14,.64,.14]);ring(head,0x329aa6,[0,1.62,1.18],.56,.085);
    tube(motion,0xdcb975,[[0,.8,-1.6],[1,.6,-2],[1.55,.6,-1.35],[1.45,.8,-.6]],.15);
  }else if(kind==='kitsune'){
    stone=0x836f58;scale=2;orb(body,0xce7649,[0,.7,-.15],[.68,.63,1.05]);
    for(const x of [-.42,.42]){orb(body,0xedd4aa,[x,.18,.77],[.19,.2,.68]);orb(body,0xa54b36,[x,.43,-.55],[.35,.4,.45]);}
    headPivot=[0,1.18,.65];orb(head,0xd8804c,[0,1.41,.85],[.54,.48,.58]);orb(head,0xf4e0bc,[0,1.24,1.32],[.34,.22,.44]);orb(head,0x253640,[0,1.31,1.7],[.15,.11,.11]);eye(.27,1.56,1.22,0x9ff1e2,.085);
    for(const side of [-1,1]){cone(head,0xb94d35,[side*.37,1.99,.8],[.33,.97,.24],[0,0,-side*.17]);cone(head,0xf0c9b2,[side*.37,2,.94],[.17,.64,.1],[0,0,-side*.17]);}
    for(let i=0;i<9;i++){const a=(i-4)*.36,x=Math.sin(a)*2.3,y=.8+Math.cos(a)*1.9,z=-1.5-Math.cos(a)*.35;tube(motion,i%2?0xdb995a:0xba6041,[[0,.65,-.9],[x*.65,y*.7,z-.4],[x,y,z]],.26);orb(motion,0xf6deb3,[x,y+.17,z],[.27,.48,.28]);}
  }else if(['phoenix','roc','griffin','owl'].includes(kind)){
    const phoenix=kind==='phoenix',roc=kind==='roc',owl=kind==='owl';metallic=owl;stone=phoenix?0x6f4c46:roc?0x485b70:owl?0x676057:0x9c927b;
    const coat=phoenix?0xb83536:roc?0x42547e:owl?0xb78c49:0xc49b62,trim=phoenix?0xffbd58:roc?0x9de9f1:owl?0x9de0cf:0xf2dba0;
    wings=true;motionPivot=[0,1.95,0];headPivot=[0,2.25,.53];scale=kind==='griffin'?2.05:1.85;
    orb(body,coat,[0,1.5,0],[owl?.78:.63,1,owl?.63:.8]);
    if(kind==='griffin'){orb(body,coat,[0,.76,-.73],[.76,.69,1.4]);for(const x of [-.5,.5])for(const z of [-1.4,.4])leg(coat,x,z,.72,.23);tube(body,0xd9b978,[[0,.8,-1.9],[.8,.7,-2.5],[1.05,1.3,-2.3]],.11);}
    else for(const side of [-1,1]){leg(0xbea474,side*.36,.12,.7,.12);for(let i=0;i<3;i++)tube(body,0xd7c687,[[side*.36,.13,.25],[side*.36+(i-1)*.13,.09,.67],[side*.36+(i-1)*.18,.04,.79]],.05);}
    orb(head,owl?0xd5ba7c:trim,[0,2.57,.39],[owl?.84:.44,owl?.69:.48,.46]);
    if(owl){for(const side of [-1,1]){ring(head,0x584934,[side*.37,2.66,.8],.31,.075,[0,0,0]);ring(head,0xe9d28c,[side*.37,2.66,.82],.22,.038,[0,0,0]);cone(head,0x907245,[side*.6,3.2,.25],[.26,.63,.2],[0,0,-side*.3]);}eye(.37,2.66,.83,0x8bffe5,.17);ring(body,0xecd191,[0,1.5,.72],.38,.07,[0,0,0]);for(let i=0;i<12;i++){const a=i*Math.PI/6;rock(body,trim,[Math.sin(a)*.44,1.5+Math.cos(a)*.44,.74],[.075,.075,.07]);}}
    else {eye(.25,2.66,.73,phoenix?0xffea91:0x94e6f0,.1);for(let i=0;i<5;i++)feather(head,trim,[(i-2)*.1,2.85,.22],[(i-2)*.24,3.58-Math.abs(i-2)*.13,-.15],.16);}
    cone(head,owl?0xe7c474:0xdec285,[0,owl?2.4:2.5,owl?.92:1.03],[.16,.5,.18],[Math.PI/2,0,0]);
    add(motion,surface([[.15,-.48],[.6,-.6],[1.45,-.2],[2.6,.6],[1.75,1.05],[.4,.5]]),coat);
    for(let row=0;row<3;row++)for(let i=0;i<10;i++){const x=.4+i*.2,z=-.28+row*.22;feather(motion,(i+row)%3?coat:trim,[x,.04,z],[x+.35,.02,z+.9+(phoenix?.5:0)],.16);}
    if(phoenix)for(let i=0;i<7;i++)feather(body,i%2?0xe65c35:0xffc366,[(i-3)*.12,1,-.5],[(i-3)*.42,.3,-3.3+Math.abs(i-3)*.2],.24);
    if(roc)for(let i=0;i<5;i++)cone(body,trim,[0,2.35-i*.2,-.42],[.18,.62,.18],[.7,0,0]);
  }else if(kind==='dragon'){
    stone=0x514455;scale=2.3;wings=true;headPivot=[0,1.65,1.6];motionPivot=[0,1.75,0];
    orb(body,0x3d354a,[0,1.2,0],[.7,.72,1.5]);orb(body,0x9e5346,[0,.94,.12],[.5,.45,1.2]);
    tube(body,0x4d3a4c,[[0,1.1,-1],[0,1,-2],[.6,.6,-3.2],[1.2,1,-4.3],[1.1,1.45,-5]],.23);
    for(let i=0;i<15;i++)cone(body,i%3?0xdc8145:0xffbd70,[i>8?(i-8)*.17:0,1.9-i*.035,1-i*.38],[.18,.65-i*.025,.22],[.35,0,0]);
    for(const side of [-1,1])for(const z of [-.75,.8]){tube(body,0x514153,[[side*.45,1.2,z],[side*.85,.5,z+.2],[side*.6,.2,z+.65]],.17);for(let i=0;i<3;i++)cone(body,0xe1bc8b,[side*.6+(i-1)*.12,.17,z+.85],[.065,.35,.06],[Math.PI/2,0,0]);}
    tube(body,0x564356,[[0,1.3,.9],[0,1.8,1.45],[0,2.05,1.8]],.4);orb(head,0x685062,[0,2.07,1.95],[.47,.46,.74]);orb(head,0xa77565,[0,1.86,2.55],[.37,.18,.57]);eye(.31,2.19,2.45,0xffaa43,.12);
    for(const side of [-1,1]){horn(head,0xe9ba86,[[side*.32,2.34,1.65],[side*.58,2.85,1.3],[side*.65,3.03,.95]],.14);for(let i=0;i<4;i++)cone(head,0xffdfac,[side*.31,1.82,2.2+i*.2],[.055,.18,.055],[Math.PI,0,0]);}
    const outline=[[.1,-.68],[1.4,-1.5],[2.75,-1.7],[4.4,-.9],[3.2,-.1],[3.45,.85],[2.25,.44],[2.08,1.5],[.7,.65],[.15,.9]];
    add(motion,surface(outline),0xa55043);add(motion,surface(outline),0xe17d4c,[.03,.02,.01],[.92,1,.87]);
    for(const p of [[1.4,-1.5],[2.75,-1.7],[4.4,-.9],[3.45,.85],[2.08,1.5]])tube(motion,0x45354b,[[.12,.08,-.3],[p[0]*.55,.08,p[1]*.55],[p[0],.08,p[1]]],.07);
  }else if(kind==='nautilus'){
    scale=2.25;stone=0x477e83;headPivot=[0,.8,1.15];motionPivot=[0,.65,1.6];
    orb(body,0x735a86,[0,1.4,0],[.72,1.45,1.4]);
    const spiral=[];for(let i=0;i<90;i++){const a=i/89*Math.PI*4.7,r=.08+i/89*1.38;spiral.push([.66,1.45+Math.sin(a)*r,Math.cos(a)*r]);}tube(body,0xedbd9b,spiral,.17);tube(body,0xedbd9b,spiral.map(([x,y,z])=>[-x,y,z]),.17);
    for(let i=0;i<20;i++){const a=i/20*Math.PI*2;rock(body,i%2?0xdda4b2:0xe8c8a0,[0,1.43+Math.sin(a)*1.38,Math.cos(a)*1.37],[.74,.13,.2]);}
    orb(head,0xb8bdca,[0,.8,1.29],[.64,.48,.75]);eye(.44,1.03,1.88,0x84f1e7,.15);
    for(let i=0;i<9;i++){const x=(i-4)*.16;tube(motion,i%2?0xdab5d2:0x91c9ca,[[x,.65,1.75],[x*2,.5,2.7],[x*2.5,.2,3.1],[x*2.6,.5,3.6]],.075);}
  }else if(kind==='frogking'){
    scale=2.1;stone=0x586d75;headPivot=[0,1,.6];motionPivot=[0,.55,1.18];
    orb(body,0x3e9f91,[0,.75,0],[1.2,.7,1]);orb(body,0x97cc9b,[0,.63,.55],[.91,.51,.6]);
    for(const side of [-1,1]){orb(body,0x337d78,[side*1.05,.38,-.5],[.63,.45,.75]);tube(body,0x69b0a1,[[side*.95,.7,.4],[side*1.45,.25,.9],[side*1.1,.12,1.45]],.18);for(let i=0;i<3;i++)orb(body,0xa8d49b,[side*(1.02+i*.16),.1,1.5+i*.06],[.09,.1,.27]);}
    orb(head,0x60b7a2,[0,1.17,.66],[1,.43,.73]);for(const side of [-1,1])orb(head,0x45958c,[side*.68,1.54,.82],[.38,.36,.34]);eye(.68,1.64,1.07,0xffdd79,.2);
    tube(head,0x295e62,[[-.8,1.07,1.14],[0,.96,1.35],[.8,1.07,1.14]],.035);
    orb(motion,0xded69b,[0,.6,1.14],[.64,.43,.22]);ring(head,0xe7c36d,[0,1.57,.38],.44,.08);
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;orb(head,i%2?0xf0aedb:0xd177b8,[Math.cos(a)*.38,1.95,.38+Math.sin(a)*.38],[.18,.52,.14]);}
    orb(head,0xffdf8d,[0,1.98,.38],[.24,.29,.24]);
  }else if(kind==='basilisk'){
    scale=1.8;metallic=true;stone=0x746e97;headPivot=[0,1.15,1.6];motionPivot=[0,.7,-1.4];
    for(let i=0;i<6;i++)rock(body,i%2?0x789eb7:0x9a82b1,[0,.9,1-i*.49],[.69,.59,.55]);
    for(const side of [-1,1])for(let i=0;i<3;i++){tube(body,0x8daec6,[[side*.4,.9,.9-i*.85],[side*1.12,.4,1.1-i*.85],[side*1.2,.12,1.4-i*.85]],.12);for(let j=0;j<3;j++)cone(body,0xdad2ef,[side*(1.05+j*.13),.13,1.64-i*.85],[.055,.42,.055],[Math.PI/2,0,0]);}
    rock(head,0xa0c3d4,[0,1.17,1.59],[.56,.51,.76]);rock(head,0xd1b7d9,[0,1,2.1],[.38,.24,.5]);eye(.34,1.38,1.96,0xffdd97,.1);
    for(let i=0;i<10;i++)cone(body,i%2?0xa4e4df:0xd7b0e5,[0,1.74,1.18-i*.33],[.34,1+(i%3)*.3,.32],[.17,0,0]);
    for(const side of [-1,1])cone(head,0xb6f2e3,[side*.4,1.89,1.4],[.19,1.35,.19],[0,0,-side*.4]);
    tube(motion,0x8498c2,[[0,.65,-1.5],[.4,.48,-2.5],[1.2,.52,-3.2],[1.55,.85,-3.5]],.17);
  }else if(kind==='moonhare'){
    scale=2.05;stone=0x767c9b;headPivot=[0,1.35,.67];motionPivot=[0,1.7,.5];
    orb(body,0xaaaed0,[0,.85,-.18],[.67,.88,.98]);for(const side of [-1,1]){orb(body,0x929ac1,[side*.59,.41,-.45],[.43,.45,.62]);orb(body,0xc1d2e1,[side*.39,.13,.54],[.22,.18,.63]);}orb(body,0xe9e4d4,[0,.77,-1.12],[.4,.39,.39]);
    orb(head,0xc1cde1,[0,1.66,.65],[.57,.56,.53]);orb(head,0xe3dfe6,[0,1.43,1.04],[.32,.24,.3]);eye(.31,1.79,1.02,0xb7e9ef,.11);orb(head,0xb69aba,[0,1.6,1.32],[.11,.08,.08]);
    for(const side of [-1,1]){orb(motion,0xb9c6dd,[side*.34,2.67,.46],[.25,1.15,.21]);orb(motion,0xe3bed6,[side*.34,2.68,.64],[.13,.85,.05]);}
    const stars=[[-.36,1.4,.45],[-.48,1.2,.16],[-.56,1.4,-.17],[-.49,1.16,-.48]];tube(body,0xd4d89b,stars,.016);for(const p of stars)orb(body,0xffe5ad,p,[.055,.055,.055]);
    ring(body,0xe4cf93,[0,1.4,-.12],1.3,.026,[.35,.5,.1]);
  }else throw new Error('Unknown fantasy creature: '+kind);

  if(kind!=='dragon'&&kind!=='nautilus'){
    // Habitats differ as much as the creatures: rooted ledges, ruins, ice and lily pads.
    if(kind==='frogking'){
      orb(plinth,0x387c72,[0,-.08,0],[2.15,.09,2.1]);
      for(let i=0;i<9;i++){const a=i/9*Math.PI*2;orb(plinth,0x568d80,[Math.cos(a)*1.7,-.03,Math.sin(a)*1.7],[.7,.07,.6]);}
    }else if(['sphinx','griffin'].includes(kind)){
      for(let i=0;i<3;i++)add(plinth,new T.BoxGeometry(1,1,1),stone,[0,-.25-i*.48,0],[3.1+i*.45,.5,4+i*.3]);
      if(kind==='griffin'){for(const side of [-1,1])for(let i=0;i<3;i++)add(plinth,new T.BoxGeometry(1,1,1),0xd8ca9e,[side*1.85,.2,-1.5+i*1.4],[.34,.7,.45]);cone(plinth,stone,[0,-2.7,0],[1.8,3,2],[Math.PI,0,0]);}
      else rock(plinth,stone,[0,-3.3,0],[1.75,2.4,2]);
    }else if(kind==='owl'){
      add(plinth,new T.CylinderGeometry(1.8,1.55,.35,16),0x87673f,[0,-.15,0]);ring(plinth,0xd4b474,[0,.03,0],1.56,.13);
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2;add(plinth,new T.BoxGeometry(.32,.3,.44),0xc79b56,[Math.cos(a)*1.85,-.12,Math.sin(a)*1.85],[1,1,1],[0,-a,0]);}
      add(plinth,new T.CylinderGeometry(.7,1.1,5,8),0x697b70,[0,-2.7,0]);
    }else if(kind==='phoenix'||kind==='roc'){
      add(plinth,new T.CylinderGeometry(1.7,.85,6,5),stone,[0,-3,0]);
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2;cone(plinth,kind==='roc'?0x809cae:0xa16a4d,[Math.cos(a)*1.65,-.15,Math.sin(a)*1.65],[.3,.85,.35],[0,0,.2]);}
    }else if(kind==='mammoth'||kind==='basilisk'){
      add(plinth,new T.CylinderGeometry(2,1.25,1.1,6),stone,[0,-.55,0]);
      rock(plinth,stone,[0,-2.7,0],[1.55,2.2,1.8]);
      for(let i=0;i<7;i++){const a=i/7*Math.PI*2;cone(plinth,kind==='mammoth'?0xc9edf0:i%2?0xa8e5df:0xbd9ed6,[Math.cos(a)*1.78,.12,Math.sin(a)*1.9],[.28,.9+i%3*.25,.3],[.14,0,.18]);}
    }else if(kind==='moonhare'){
      rock(plinth,0x9298b6,[0,-.85,0],[1.9,1,1.8]);
      for(let i=0;i<7;i++){const a=i*2.399;orb(plinth,0x616b8c,[Math.cos(a)*1.3,-.12,Math.sin(a)*1.3],[.21,.035,.18]);}
      for(let i=0;i<3;i++)rock(plinth,0xb1b4cc,[1.7-i*1.7,-1.7-i*.3,.7+i*.2],[.18,.28,.21]);
    }else{
      rock(plinth,stone,[0,-.45,0],[2,.45,2.1]);rock(plinth,stone,[0,-2.55,0],[1.55,2.3,1.9]);
      for(let i=0;i<13;i++){const a=i*2.399;rock(plinth,kind==='spiritstag'?0x93b8b6:kind==='kitsune'?0xd59152:0x789971,[Math.cos(a)*1.65,-.01,Math.sin(a)*1.8],[.3,.065,.28]);}
      if(kind==='mossback')tube(plinth,0x786846,[[-1.6,-.03,-1.3],[-.4,.01,-1.8],[1.2,-.04,-1.5]],.16);
      if(kind==='spiritstag')for(const side of [-1,1]){tube(plinth,0x80a7bb,[[side*1.6,0,1],[side*1.7,.55,1]],.07);orb(plinth,0xd6a1dd,[side*1.7,.61,1],[.35,.12,.3]);}
    }
  }
  if(wings)for(const part of motion)part.p=part.p.map((v,i)=>v+motionPivot[i]);
  const bake=(parts,pivot)=>coloredMerge(parts.map(p=>({...p,p:p.p.map((v,i)=>v-pivot[i])})));
  return {body:coloredMerge(body),head:bake(head,headPivot),motion:bake(motion,motionPivot),plinth:plinth.length?coloredMerge(plinth):null,headPivot,motionPivot,wings,scale,metallic};
}
