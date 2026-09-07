import * as T from '../../vendor/three.module.min.js';
import { HDRLoader } from '../../vendor/HDRLoader.js';
import { randomSource } from '../core/math.js?v=0.4.0';
import { WORLDS } from '../../data/campaign.js?v=0.4.0';
import { createAmbience } from './ambience.js?v=0.4.0';

const dummy = new T.Object3D();
function instances(scene, geometry, material, entries, shadow = true) {
  const mesh = new T.InstancedMesh(geometry, material, entries.length);
  entries.forEach((e, i) => {
    dummy.position.set(...e.p); dummy.rotation.set(...(e.r || [0, 0, 0])); dummy.scale.set(...(e.s || [1, 1, 1]));
    dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    if (e.c) mesh.setColorAt(i, new T.Color(e.c));
  });
  mesh.castShadow = shadow; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}
function stoneTexture(random) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#aaa493'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6200; i++) {
    const v = Math.floor(105 + random() * 105);
    ctx.fillStyle = 'rgba(' + v + ',' + (v - 4) + ',' + (v - 14) + ',' + (0.04 + random() * 0.13) + ')';
    const size = random() * 9 + 1; ctx.fillRect(random() * 256, random() * 256, size, size * 0.65);
  }
  for (let i = 0; i < 14; i++) {
    let x = random() * 256, y = random() * 256;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) { x += (random() - 0.5) * 28; y += random() * 17; ctx.lineTo(x, y); }
    ctx.strokeStyle = '#393e3648'; ctx.lineWidth = 0.5 + random(); ctx.stroke();
    ctx.translate(1, 1); ctx.strokeStyle = '#e9e2c322'; ctx.stroke(); ctx.translate(-1, -1);
  }
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.anisotropy = 8;
  return texture;
}
function bevelBox(width, height, depth, bevel = 0.06) {
  const shape = new T.Shape();
  shape.moveTo(-width / 2, -depth / 2); shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2); shape.lineTo(-width / 2, depth / 2); shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: bevel, bevelThickness: bevel });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -height / 2, 0);
  return geo;
}
function frondGeometry() {
  const positions = [], colors = [];
  function triangle(a, b, c, shade) { positions.push(...a, ...b, ...c); for (let j = 0; j < 3; j++) colors.push(shade, shade, shade); }
  for (let i = 0; i < 14; i++) {
    const t = i / 14, z = t * 4.8, y = Math.sin(t * Math.PI) * 0.9 - t * t * 1.2;
    const width = Math.sin((t * 0.88 + 0.08) * Math.PI) * 0.96;
    for (const sign of [-1, 1]) {
      triangle([0, y, z], [sign * width, y - 0.3, z + 0.52], [0, y + 0.045, z + 0.25], 0.8 + t * 0.2);
      triangle([sign * width, y - 0.3, z + 0.52], [sign * width * 0.43, y - 0.05, z + 0.22], [0, y, z], 0.72 + t * 0.2);
    }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals(); return geo;
}

export async function createEnvironment(scene, renderer) {
  const random = randomSource(4397), range = (a, b) => a + random() * (b - a);
  const loader = new T.TextureLoader();
  const asset = file => new URL('../../assets/textures/' + file, import.meta.url).href;
  const [bridgeColor, bridgeNormal, bridgeRoughness, cliffColor, cliffNormal, hdr] = await Promise.all([
    loader.loadAsync(asset('bridge-color.jpg')), loader.loadAsync(asset('bridge-normal.jpg')),
    loader.loadAsync(asset('bridge-roughness.jpg')), loader.loadAsync(asset('cliff-color.jpg')),
    loader.loadAsync(asset('cliff-normal.jpg')), new HDRLoader().loadAsync(asset('sunrise.hdr')),
  ]);
  bridgeColor.colorSpace = cliffColor.colorSpace = T.SRGBColorSpace;
  for (const map of [bridgeColor, bridgeNormal, bridgeRoughness]) {
    map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(1.25, 10.45); map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  for (const map of [cliffColor, cliffNormal]) { map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(2, 2); map.anisotropy = 4; }
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(hdr).texture; scene.environmentIntensity = 0.7;
  hdr.dispose(); pmrem.dispose();
  scene.fog = new T.FogExp2(0xb9c6b6, 0.006);
  const sky = new T.Mesh(new T.SphereGeometry(360, 24, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false,
    uniforms: { zenith: { value: new T.Color('#608e9c') }, horizon: { value: new T.Color('#f5ddb1') } },
    vertexShader: 'varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vP; uniform vec3 zenith; uniform vec3 horizon; void main(){float h=normalize(vP).y;vec3 c=mix(horizon,zenith,smoothstep(-.02,.7,h));float s=pow(max(0.,dot(normalize(vP),normalize(vec3(-.5,.32,-1.)))),90.);c+=vec3(1.,.63,.23)*s*.7;gl_FragColor=vec4(c,1.);}',
  })); scene.add(sky);
  scene.add(new T.HemisphereLight(0xc6e5ed, 0x55583a, 1.15));
  const sun = new T.DirectionalLight(0xffd6a0, 3.7); sun.position.set(-32, 47, -26);
  sun.target.position.set(0, 0, -13); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -29, right: 29, top: 39, bottom: -39, near: 1, far: 135 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.055; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const rim = new T.DirectionalLight(0x86b7c9, 1.0); rim.position.set(12, 12, 20); scene.add(rim);

  const texture = stoneTexture(random);
  const stone = new T.MeshStandardMaterial({ color: 0xb0ada1, map: cliffColor, normalMap: cliffNormal, normalScale: new T.Vector2(.55,.55), roughness: 0.92 });
  const darkStone = new T.MeshStandardMaterial({ color: 0x879383, map: cliffColor, normalMap: cliffNormal, normalScale: new T.Vector2(.6,.6), roughness: 0.94 });
  const goldenStone = new T.MeshStandardMaterial({ color: 0xc1b69a, map: cliffColor, normalMap: cliffNormal, normalScale: new T.Vector2(.5,.5), roughness: 0.89 });
  const wood = new T.MeshStandardMaterial({ color: 0x493e2b, roughness: 0.9 });
  const brass = new T.MeshStandardMaterial({ color: 0x938267, metalness: 0.68, roughness: 0.42 });
  const floor = new T.Mesh(new T.BoxGeometry(14.3, 3.7, 118), darkStone); floor.position.set(0, -2.1, -31); floor.receiveShadow = true; scene.add(floor);
  const paving = new T.Mesh(new T.PlaneGeometry(14.22, 118), new T.MeshStandardMaterial({
    color: 0xc0bca8, map: bridgeColor, normalMap: bridgeNormal, normalScale: new T.Vector2(.85,.85),
    roughnessMap: bridgeRoughness, roughness: .88, metalness: .035,
  }));
  paving.rotation.x = -Math.PI / 2; paving.position.set(0, .125, -31); paving.receiveShadow = true; scene.add(paving);
  const rails = [], columns = [], caps = [], rubble = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 44; i++) {
      const z = 24 - i * 2.7;
      rails.push({ p: [side * 7.22, 0.27, z], s: [1, range(0.7, 1.15), 1], c: new T.Color().setHSL(0.13, 0.12, range(0.58, 0.82)) });
      if (i % 4 === 0) {
        columns.push({ p: [side * 7.22, 0.84, z], s: [1, 1, 1] });
        caps.push({ p: [side * 7.22, 1.55, z], s: [1, 1, 1] });
      }
      if (i % 3 === 0) rubble.push({ p: [side * range(6.4, 6.8), 0.2, z + range(-1, 1)], s: [range(0.2, 0.45), range(0.15, 0.3), range(0.3, 0.7)], r: [0.2, range(0, 6), 0.1] });
    }
  }
  instances(scene, bevelBox(0.65, 0.58, 2.57), goldenStone, rails);
  instances(scene, bevelBox(1.05, 1.48, 1.15), stone, columns);
  instances(scene, bevelBox(1.3, 0.18, 1.4), goldenStone, caps);
  instances(scene, new T.DodecahedronGeometry(1), darkStone, rubble);
  const piers = [], arches = [];
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = 20 - i * 21;
    piers.push({ p: [side * 6.2, -14, z], s: [2.0, 26, 3.7] });
    if (i < 5) arches.push({ p: [side * 6.2, -11, z - 10.5], r: [0, Math.PI / 2, 0], s: [1, 1, 1] });
  }
  instances(scene, new T.BoxGeometry(1, 1, 1), darkStone, piers);
  instances(scene, new T.TorusGeometry(8.7, 1.8, 6, 18, Math.PI), darkStone, arches);

  // Layered gorge walls and distant silhouettes.
  const rockGeometry = new T.IcosahedronGeometry(1, 5), rp = rockGeometry.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i);
    const scale=1+Math.sin(x*7+y*5+z*3)*.07+Math.sin(x*17-y*11+z*9)*.032+Math.sin(y*27+z*23)*.017;
    rp.setXYZ(i,x*scale,y*scale,z*scale);
  }
  rockGeometry.computeVertexNormals();
  const normals=rockGeometry.attributes.normal,normalGroups=new Map();
  for(let i=0;i<rp.count;i++){
    const key=[rp.getX(i),rp.getY(i),rp.getZ(i)].map(v=>Math.round(v*100000)).join(',');
    let group=normalGroups.get(key);if(!group){group={normal:new T.Vector3(),ids:[]};normalGroups.set(key,group);}
    group.normal.add(new T.Vector3(normals.getX(i),normals.getY(i),normals.getZ(i)));group.ids.push(i);
  }
  for(const group of normalGroups.values()){group.normal.normalize();for(const i of group.ids)normals.setXYZ(i,group.normal.x,group.normal.y,group.normal.z);}
  const cliffMat = new T.MeshStandardMaterial({ color: 0xa5b49a, roughness: 1, map: cliffColor, normalMap: cliffNormal, normalScale:new T.Vector2(1.35,1.35) });
  const cliffs = [], outcrops = [], mountains = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 17; i++) {
      const z = 38 - i * 9, x = side * range(24, 34), top = range(-5, 2);
      cliffs.push({ p: [x, top - 17, z], s: [range(8, 13), range(16, 24), range(9, 15)], r: [range(-.1,.1), range(0,6), range(-.1,.1)], c: new T.Color().setHSL(range(.19,.24), range(.08,.19), range(.42,.63)) });
      outcrops.push({ p: [side * range(17, 24), range(-14,-6), z], s: [range(3,6), range(6,13), range(4,8)], r: [0, range(0,6), .2] });
    }
    for (let i = 0; i < 13; i++) mountains.push({ p: [side * range(30, 130), range(-30, -8), -120 - i * 12],
      s: [range(20, 37), range(38, 72), range(25, 55)], r: [0, range(0, 5), range(-.2,.2)],
      c: new T.Color().setHSL(0.44, 0.1, range(0.45,0.65)) });
  }
  const cliffMesh=instances(scene, rockGeometry, cliffMat, cliffs); instances(scene, rockGeometry, darkStone, outcrops);
  instances(scene, rockGeometry, new T.MeshStandardMaterial({ color: 0x819b8e, roughness: 1 }), mountains, false);

  // Ancient gate: deep opening, stacked lintels, fluted columns, and broken towers.
  const blocks = [], trim = [];
  for (const side of [-1, 1]) {
    blocks.push({ p: [side * 10.7, 6.6, -70], s: [7, 13.5, 9] });
    for (let level = 0; level < 4; level++) trim.push({ p: [side * 10.7, 3 + level * 3.4, -70], s: [7.7, .38, 9.7] });
    for (let j = 0; j < 3; j++) blocks.push({ p: [side * (8.7 + j * 2), 14 + random(), -72], s: [1.1, 2.4, 1.2] });
    for (const z of [-66, -73]) blocks.push({ p: [side * 5.6, 4.7, z], s: [1.3, 9.7, 1.5] });
    const column = new T.Mesh(new T.CylinderGeometry(.75, .95, 10, 10), goldenStone); column.position.set(side * 5.5, 5, -65.2); column.castShadow = true; scene.add(column);
    for (let j = 0; j < 4; j++) trim.push({ p: [side * 5.5, j * 3, -65.2], s: [2.1, .38, 2] });
  }
  blocks.push({ p: [0, 10.1, -68.5], s: [13.5, 2.3, 7.9] });
  trim.push({ p: [0, 11.45, -68.5], s: [15.2, .5, 9] });
  trim.push({ p: [0, 12.25, -68.5], s: [12.2, 1.2, 7] });
  instances(scene, new T.BoxGeometry(1, 1, 1), darkStone, blocks);
  instances(scene, new T.BoxGeometry(1, 1, 1), goldenStone, trim);
  const bannerGeometry = new T.PlaneGeometry(1.8, 5.2, 6, 12);
  const banners = [];
  for (const side of [-1, 1]) {
    const mesh = new T.Mesh(bannerGeometry.clone(), new T.MeshStandardMaterial({ color: 0x852b32, roughness: .9, side: T.DoubleSide }));
    mesh.position.set(side * 9, 8.5, -65.4); scene.add(mesh); banners.push(mesh);
    const sigil = new T.Mesh(new T.RingGeometry(.42, .5, 4), brass); sigil.position.set(side * 9, 8.5, -65.26); scene.add(sigil);
  }

  // Original pinnate foliage; hundreds of fronds share one instanced draw.
  const fronds = [], trunks = [], vines = [];
  const trunkCurve = new T.CatmullRomCurve3([new T.Vector3(0,0,0), new T.Vector3(.1,2.5,.08), new T.Vector3(.5,5,.2), new T.Vector3(1.2,7.5,.3)]);
  const trunkGeo = new T.TubeGeometry(trunkCurve, 10, .22, 7, false);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 28; i++) {
      const x = side * range(19,38), z = 30 - i * 4.5 + range(-3,3), y = range(-3,1), scale = range(.75,1.5), yaw = range(0,6.28);
      trunks.push({ p: [x,y,z], r: [0,yaw,0], s: [scale,scale,scale] });
      const topX = x + (Math.cos(yaw)*1.2 + Math.sin(yaw)*.3)*scale;
      const topZ = z + (-Math.sin(yaw)*1.2 + Math.cos(yaw)*.3)*scale;
      for (let j = 0; j < 9; j++) fronds.push({ p: [topX,y+7.5*scale,topZ], r: [range(-.25,.12),j/9*Math.PI*2+yaw,0], s: [scale,scale,scale],
        c: new T.Color().setHSL(range(.22,.30), range(.24,.43), range(.35,.55)) });
    }
    for (let i = 0; i < 48; i++) {
      const x = side*range(6.55,7.05), z = 24-i*2.4, scale = range(.18,.39);
      for (let j=0;j<5;j++) fronds.push({p:[x,.27,z],r:[-.35,j/5*6.28,0],s:[scale,scale,scale],c:new T.Color().setHSL(.24,.35,range(.3,.5))});
      for(let j=0;j<4;j++) vines.push({p:[side*7.56,-j*.55,z],s:[range(.22,.5),.06,range(.35,.9)],r:[0,range(0,6),.4]});
    }
  }
  const palmTrunks=instances(scene, trunkGeo, wood, trunks);
  const leaves = instances(scene, frondGeometry(), new T.MeshStandardMaterial({ color: 0x93ac69, roughness: .9, side: T.DoubleSide, vertexColors:true }), fronds);
  instances(scene, new T.IcosahedronGeometry(1,0), new T.MeshStandardMaterial({color:0x435d38,roughness:1}), vines, false);
  const leavesUniform = { value: 0 };
  leaves.material.onBeforeCompile = shader => {
    shader.uniforms.windTime = leavesUniform;
    shader.vertexShader = 'uniform float windTime;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.x += sin(windTime*1.2+position.z*1.1+instanceMatrix[3].x)*.065*position.z;');
  };

  const waterUniform = { value: 0 };
  // Extend beneath wide phone views so the river never ends against the sky.
  const water = new T.Mesh(new T.PlaneGeometry(900, 900, 1, 1), new T.ShaderMaterial({
    uniforms: { time: waterUniform, tint:{value:new T.Color('#367b78')} }, transparent: true, opacity: .9,
    vertexShader: 'varying vec2 vUv;varying vec3 vView;void main(){vUv=uv;vec4 view=modelViewMatrix*vec4(position,1.);vView=view.xyz;gl_Position=projectionMatrix*view;}',
    fragmentShader: 'varying vec2 vUv;varying vec3 vView;uniform float time;uniform vec3 tint;void main(){float w=sin(vUv.x*2166.+time*.5+sin(vUv.y*240.+time)*2.)*.5+.5;float s=pow(w,18.)*.13;vec3 c=tint*(.7+vUv.y*.5)+s;float mist=1.-smoothstep(170.,330.,length(vView));gl_FragColor=vec4(c,.94*mist);}',
  })); water.rotation.x=-Math.PI/2; water.position.set(0,-29,-65); scene.add(water);
  const fallsMat = new T.ShaderMaterial({
    transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{time:waterUniform},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv;uniform float time;void main(){float line=sin(vUv.x*85.+sin(vUv.y*16.+time*2.))*.2+.65;float foam=sin(vUv.y*90.+time*13.)*.08;float edge=smoothstep(0.,.15,vUv.x)*smoothstep(1.,.82,vUv.x);gl_FragColor=vec4(vec3(.72,.86,.8)+foam,edge*line*.73);}',
  });
  for (const [x,z,w] of [[-22,-15,4],[25,-48,5],[-27,-82,3.5]]) {
    const fall=new T.Mesh(new T.PlaneGeometry(w,28),fallsMat);fall.position.set(x,-15,z);scene.add(fall);
  }

  const flames = [], braziers = [];
  const fireCanvas=document.createElement('canvas');fireCanvas.width=64;fireCanvas.height=128;
  const fireCtx=fireCanvas.getContext('2d'),fireGradient=fireCtx.createRadialGradient(32,88,1,32,75,52);
  fireGradient.addColorStop(0,'#ffed9fee');fireGradient.addColorStop(.2,'#ffba45dd');fireGradient.addColorStop(.48,'#fa641699');fireGradient.addColorStop(1,'#b4290000');
  fireCtx.fillStyle=fireGradient;fireCtx.fillRect(0,0,64,128);
  const flameMaterial = new T.SpriteMaterial({map:new T.CanvasTexture(fireCanvas),color:0xffa34b,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  for(const side of [-1,1]) for(const z of [14,-8,-30,-57]) {
    braziers.push({p:[side*7.22,2.05,z],s:[1,1,1]});
    const flame = new T.Sprite(flameMaterial);
    flame.position.set(side*7.22,2.59,z);flame.scale.set(1.3,2,1);scene.add(flame);flames.push(flame);
    const core = new T.Mesh(new T.IcosahedronGeometry(.13,1),new T.MeshBasicMaterial({color:0xffa134,toneMapped:false}));
    core.position.copy(flame.position);core.position.y-=.25;scene.add(core);
  }
  instances(scene,new T.CylinderGeometry(.55,.22,.5,8),brass,braziers);
  // Sunlit dust and distant birds keep the otherwise still landscape alive.
  const motePositions = new Float32Array(180*3);
  for(let i=0;i<180;i++){motePositions[i*3]=range(-30,30);motePositions[i*3+1]=range(1,18);motePositions[i*3+2]=range(-65,30);}
  const moteGeo=new T.BufferGeometry();moteGeo.setAttribute('position',new T.BufferAttribute(motePositions,3));
  const motes=new T.Points(moteGeo,new T.PointsMaterial({color:0xffe8ad,size:.055,transparent:true,opacity:.55,depthWrite:false}));scene.add(motes);
  const birdGeo=new T.BufferGeometry();birdGeo.setAttribute('position',new T.Float32BufferAttribute([-1,0,0,0,-.2,0,1,0,0],3));
  const birds=[];
  for(let i=0;i<7;i++){const bird=new T.Line(birdGeo,new T.LineBasicMaterial({color:0x465e5a}));bird.position.set(range(-45,45),range(18,28),range(-140,-90));bird.scale.setScalar(range(.7,1.3));scene.add(bird);birds.push(bird);}
  let emberGate=false,currentWorld=WORLDS[0],baseSun=3.7;
  const ambience=createAmbience(scene,{color:cliffColor,normal:cliffNormal});
  const moteOrigins=motePositions.slice();
  return {
    sun,
    setLevel(index){
      currentWorld=WORLDS[index];emberGate=currentWorld.weather==='embers';
      const night=['ice','storm','luminous','volcano'].includes(currentWorld.biome);
      scene.fog.color.set(currentWorld.fog);scene.fog.density=currentWorld.biome==='storm'?.008:.006;
      sky.material.uniforms.zenith.value.set(currentWorld.sky);sky.material.uniforms.horizon.value.set(currentWorld.horizon);
      sun.color.set(currentWorld.sun);baseSun=night?2.3:emberGate?2.8:3.7;sun.intensity=baseSun;
      sun.position.set(-32-index*1.5,night?29:47,-26);
      rim.color.set(currentWorld.accent);rim.intensity=night?1.6:1;
      scene.environmentIntensity=night?.62:.7;
      water.material.uniforms.tint.value.set(currentWorld.water);
      motes.material.color.set(currentWorld.accent);
      motes.material.size=emberGate?.095:.055;motes.material.opacity=emberGate?.8:.55;
      for(const bird of birds)bird.visible=!night&&!emberGate;
      paving.material.color.set(currentWorld.stone);stone.color.set(currentWorld.stone);goldenStone.color.set(currentWorld.stone);cliffMat.color.set(currentWorld.stone);
      for(let i=0;i<cliffs.length;i++)cliffMesh.setColorAt(i,new T.Color(currentWorld.stone).multiplyScalar(.68+(i%5)*.035));cliffMesh.instanceColor.needsUpdate=true;
      leaves.material.color.set(currentWorld.leaf);
      leaves.visible=palmTrunks.visible=!['ice','autumn','luminous','volcano','celestial'].includes(currentWorld.biome);
      for(const banner of banners)banner.material.color.set(currentWorld.accent);
      flameMaterial.color.set(currentWorld.accent);
      ambience.setLevel(index);
    },
    snapshot:()=>ambience.snapshot(),
    update(time,reduced=false) {
      waterUniform.value=time;leavesUniform.value=reduced?time*.2:time;
      ambience.update(time,reduced);
      const lightning=!reduced&&currentWorld.weather==='storm'&&time%17>16.7?Math.pow(Math.sin((time%17-16.7)*34),6)*1.7:0;
      sun.intensity=baseSun+lightning;
      for(let i=0;i<flames.length;i++){const f=flames[i];f.scale.y=2+Math.sin(time*9+i*4)*.3;f.scale.x=1.3+Math.sin(time*13+i)*.13;}
      for(const banner of banners){const p=banner.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,Math.sin(time*2+y*2+banner.position.x)*.16*(2.7-y)/5.4);}p.needsUpdate=true;banner.geometry.computeVertexNormals();}
      motes.rotation.y=Math.sin(time*.035)*.06;
      if(emberGate){for(let i=0;i<180;i++){motePositions[i*3]=moteOrigins[i*3]+Math.sin(time*.5+i)*.5;motePositions[i*3+1]=(moteOrigins[i*3+1]+time*.65)%18;}moteGeo.attributes.position.needsUpdate=true;}
      birds.forEach((bird,i)=>{bird.position.x+=Math.sin(time*.2+i)*.012;bird.rotation.z=Math.sin(time*2.5+i)*.1;});
    },
  };
}
