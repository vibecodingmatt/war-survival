import * as T from '../../vendor/three.module.min.js';
import { randomSource } from '../core/math.js?v=0.7.2';

export function createVolcano(root,surfaces,clock,cloudMap) {
  const atmosphere=root,landmark=new T.Group();root.add(landmark);root=landmark;
  landmark.position.set(-3,-12,18);landmark.scale.set(.8,.6,.65);
  const random=randomSource(804),geometry=new T.CylinderGeometry(7,31,43,40,8,true);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),z=positions.getZ(i),y=positions.getY(i),a=Math.atan2(z,x);
    const ridge=1+Math.sin(a*11)*.045+Math.sin(a*19+y*.1)*.025;
    positions.setXYZ(i,x*ridge,y+Math.sin(a*7)*.65,z*ridge);
  }
  geometry.computeVertexNormals();
  const mountain=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0x51444c,map:surfaces.color,normalMap:surfaces.normal,normalScale:new T.Vector2(1.3,1.3),roughness:.96}));mountain.position.set(-35,5,-94);root.add(mountain);
  const lavaMaterial=new T.MeshBasicMaterial({color:0xff671c,toneMapped:false});
  const crater=new T.Mesh(new T.CircleGeometry(6.6,40),lavaMaterial);crater.rotation.x=-Math.PI/2;crater.position.set(-35,26.7,-94);root.add(crater);
  const lip=new T.Mesh(new T.TorusGeometry(7,.85,8,40),mountain.material);lip.rotation.x=Math.PI/2;lip.position.set(-35,26.7,-94);root.add(lip);
  for(let branch=0;branch<3;branch++) {
    const points=[];
    for(let i=0;i<10;i++){const t=i/9,angle=1.1+branch*.35+Math.sin(t*9+branch)*.065,radius=7.6+t*24;points.push(new T.Vector3(-35+Math.cos(angle)*radius,26.8-t*42,-94+Math.sin(angle)*radius));}
    const curve=new T.CatmullRomCurve3(points);
    root.add(new T.Mesh(new T.TubeGeometry(curve,48,.22+branch*.1,5,false),lavaMaterial));
    root.add(new T.Mesh(new T.TubeGeometry(curve,48,.085,4,false),new T.MeshBasicMaterial({color:0xffc24a,toneMapped:false})));
  }
  // Soft soot billows expand above the crater, carried sideways by the same wind as the ash.
  const plume=[];
  for(let i=0;i<15;i++) {
    const material=new T.SpriteMaterial({map:cloudMap,color:i<3?0x8b5549:0x24212b,transparent:true,opacity:1,depthWrite:false});
    const sprite=new T.Sprite(material);root.add(sprite);plume.push(sprite);
  }
  const count=560,ash=new T.InstancedMesh(new T.CircleGeometry(1,5),new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:clock},
    vertexShader:`uniform float time;varying float shade;varying float fade;
      void main(){vec3 origin=instanceMatrix[3].xyz;float seed=origin.x*17.+origin.z*3.;
        float a=seed+time*(.7+fract(seed)*2.);float size=.045+fract(seed*.17)*.12;
        vec3 p=origin;p.y=39.-mod(origin.y+time*(1.1+fract(seed)*1.9),43.);
        p.x+=sin(time*.3+origin.z*.06)*4.+sin(time*.9+seed)*.8;
        p.z+=cos(time*.22+seed)*2.;
        vec2 flake=mat2(cos(a),-sin(a),sin(a),cos(a))*position.xy;
        flake.x*=.3+.7*abs(sin(a*.73));
        vec4 view=modelViewMatrix*vec4(p,1.);view.xy+=flake*size;
        shade=.2+fract(seed*.33)*.5;fade=smoothstep(-4.,2.,p.y)*(1.-smoothstep(32.,39.,p.y));
        gl_Position=projectionMatrix*view;}`,
    fragmentShader:`varying float shade;varying float fade;void main(){gl_FragColor=vec4(vec3(shade,shade*.94,shade*.94),fade*.78);}`,
  }),count),dummy=new T.Object3D();
  for(let i=0;i<count;i++){dummy.position.set((random()-.5)*74,random()*43,-80+random()*116);dummy.updateMatrix();ash.setMatrixAt(i,dummy.matrix);}ash.frustumCulled=false;atmosphere.add(ash);
  return time=>{
    for(let i=0;i<plume.length;i++) {
      const t=((time*.045+i/plume.length)%1),sprite=plume[i],size=7+t*25;
      sprite.position.set(-35+t*19+Math.sin(t*9+i)*1.4,28+t*25,-94+t*6);
      sprite.scale.set(size,size*.82,1);sprite.material.rotation=Math.sin(i*3+time*.06)*.3;
      sprite.material.opacity=Math.sin(Math.min(1,t*6)*Math.PI/2)*(1-t)*1.4;
    }
    lavaMaterial.color.setRGB(1,.25+Math.sin(time*1.3)*.04,.035);
  };
}
