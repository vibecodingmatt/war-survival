import * as T from '../../vendor/three.module.min.js';
import { randomSource } from '../core/math.js?v=0.4.1';

// Water follows a stream bed, rounds the rock lip, then separates into falling ribbons.
export function createWaterfalls(root, surfaces, profile, clock, cloudMap) {
  const random=randomSource(9401),rocks=[],foam=[],spray=[],dummy=new T.Object3D();
  const rockMaterial=new T.MeshStandardMaterial({color:profile.stone,map:surfaces.color,normalMap:surfaces.normal,roughness:.92,normalScale:new T.Vector2(.9,.9)});
  const waterMaterial=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,
    uniforms:{time:clock,tint:{value:new T.Color(profile.water)}},
    vertexShader:`varying vec2 v;varying float depth;uniform float time;
      void main(){v=uv;vec3 p=position;float falling=smoothstep(.25,.4,v.y);
        p.z+=falling*sin(v.x*31.+v.y*19.-time*4.)*.09;
        vec4 view=modelViewMatrix*vec4(p,1.);depth=-view.z;gl_Position=projectionMatrix*view;}`,
    fragmentShader:`varying vec2 v;varying float depth;uniform float time;uniform vec3 tint;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
      void main(){float fall=smoothstep(.22,.38,v.y);
        float flow=n(vec2(v.x*18.,v.y*12.-time*3.4));
        float fine=n(vec2(v.x*73.+flow,v.y*35.-time*8.));
        float ribbons=n(vec2(v.x*32.,v.y*1.7-time*.25));
        float edge=smoothstep(0.,.13,v.x+.035*(flow-.5))*smoothstep(0.,.13,1.-v.x+.035*(fine-.5));
        float crest=exp(-pow((v.y-.28)*23.,2.));
        float white=clamp(.16+fall*.25+flow*.28+fine*.15+crest*.3,0.,.92);
        float alpha=edge*(.55+flow*.25)*mix(1.,smoothstep(.15,.42,ribbons),fall*.55);
        alpha*=1.-smoothstep(.91,1.,v.y);
        vec3 color=mix(tint*.76,vec3(.87,.97,.94),white);
        color=mix(color,vec3(.48,.67,.62),smoothstep(100.,200.,depth)*.5);
        gl_FragColor=vec4(color,alpha);}`});
  const poolMaterial=new T.MeshStandardMaterial({color:new T.Color(profile.water).multiplyScalar(.62),metalness:.22,roughness:.3,transparent:true,opacity:.86});
  for(const side of [-1,1])for(let f=0;f<(profile.biome==='jade'?3:2);f++) {
    const x=side*(18+f*2.8),z=9-f*33+(side>0?-14:0),width=5.2+random()*2.5,top=.2+random()*1.1;
    // Broad weathered shelf behind the lip, with an uneven stream channel cut through it.
    rocks.push({p:[x,top-3.2,z-4.3],s:[width*.92,3.5,5.4],r:[.06,random(),.04]});
    for(const bank of [-1,1])for(let k=0;k<6;k++) {
      rocks.push({p:[x+bank*(width*.51+random()*.65),top-.5+random()*.65,z-6+k*1.3],s:[1.1+random()*.7,.7+random()*.8,1.1+random()],r:[random(),random()*3,random()]});
    }
    rocks.push({p:[x,top+.35,z-7.2],s:[width*.72,.65,1.1],r:[.05,.05,.04]});
    rocks.push({p:[x+width*.17,top-.03,z-2.8],s:[.5,.24,.85],r:[.15,.4,.1]});
    const pool=new T.Mesh(new T.SphereGeometry(1,24,10),poolMaterial);pool.position.set(x,top-.06,z-3.3);pool.scale.set(width*.51,.08,3.7);root.add(pool);
    const columns=42,rows=70,positions=[],uv=[],indices=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++) {
      const u=i/columns,s=j/rows,a=u*2-1,crest=Math.sin(u*12.+f)*.12+Math.sin(u*23.+side)*.07;
      let y,forward;
      if(s<.22){const t=s/.22;y=top-.07*t;forward=-6*(1-t);}
      else if(s<.34){const angle=(s-.22)/.12*Math.PI/2;y=top-.07-.95*(1-Math.cos(angle));forward=Math.sin(angle)*1.25;}
      else {const t=(s-.34)/.66;y=top-1.02-(top+27.9)*t;forward=1.25+t*2.1+Math.sin(t*Math.PI)*.5;}
      const falling=Math.max(0,(s-.3)/.7),spread=1-.12*Math.sin(s*Math.PI)+falling*.2;
      positions.push(x+a*width*.5*spread+Math.sin(s*17+u*6)*.10*falling,y+crest*Math.sin(s*Math.PI),z+forward+Math.sin(u*17)*.12);
      uv.push(u,s);
      if(i<columns&&j<rows){const n=j*(columns+1)+i;indices.push(n,n+columns+1,n+1,n+1,n+columns+1,n+columns+2);}
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();root.add(new T.Mesh(geometry,waterMaterial));
    for(let k=0;k<23;k++){
      const u=k/22;foam.push({p:[x+(u-.5)*width*.92,top-.03,z+.2+Math.sin(u*17)*.16],s:[.18+random()*.22,.055,.22+random()*.2],r:[0,random()*3,0]});
    }
    // Broken whitewater at the plunge pool, softened by rising spray.
    for(let k=0;k<34;k++){
      const angle=random()*Math.PI*2,radius=1.5+random()*4;
      foam.push({p:[x+Math.cos(angle)*radius,-28.83,z+3.7+Math.sin(angle)*radius*.7],s:[.3+random()*.8,.055,.12+random()*.3],r:[0,-angle,0]});
      spray.push(x+(random()-.5)*width*1.5,-28+random()*4,z+2.6+random()*3);
    }
  }
  for(const [entries,geometry,material] of [[rocks,new T.IcosahedronGeometry(1,1),rockMaterial],[foam,new T.SphereGeometry(1,7,4),new T.MeshBasicMaterial({color:0xcdeee7,transparent:true,opacity:.48})]]) {
    const mesh=new T.InstancedMesh(geometry,material,entries.length);
    entries.forEach((e,i)=>{dummy.position.set(...e.p);dummy.scale.set(...e.s);dummy.rotation.set(...e.r);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.receiveShadow=true;root.add(mesh);
  }
  const sprayMaterial=new T.PointsMaterial({map:cloudMap,size:6,color:0xd1f6ec,transparent:true,opacity:.28,depthWrite:false});
  sprayMaterial.onBeforeCompile=shader=>{shader.uniforms.fallTime=clock;shader.vertexShader='uniform float fallTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=sin(fallTime*.8+position.z)*.6; transformed.y+=sin(fallTime+position.x)*.8;');};
  const sprayGeometry=new T.BufferGeometry();sprayGeometry.setAttribute('position',new T.Float32BufferAttribute(spray,3));root.add(new T.Points(sprayGeometry,sprayMaterial));
}
