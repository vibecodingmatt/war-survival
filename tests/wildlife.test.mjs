import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { WILDLIFE, wildlifeVisit } from '../data/wildlife.js';
import { createWildlife } from '../js/world/wildlife.js';

test('wildlife visits have quiet gaps, varied arrivals, bounded flocks and reproducible timing',()=>{
  for(const seed of [1,9127,10908]){
    const starts=new Set();let active=0;
    for(let time=0;time<470;time+=.5){
      const visit=wildlifeVisit(time,seed);assert.deepEqual(visit,wildlifeVisit(time,seed));
      if(visit.active){active++;assert.ok(visit.progress>=0&&visit.progress<1);assert.ok(visit.count>=2&&visit.count<=4);}
      starts.add((visit.start-visit.cycle*47).toFixed(2));
    }
    assert.ok(active>150&&active<360,'visitors occupy a minority of the timeline');
    assert.ok(starts.size>5,'subsequent arrivals vary');
  }
});

test('all biome populations render distinct geometry, stay out of the bridge and remain bounded',()=>{
  const populations=new Set();let level=0;
  for(const [biome,spec] of Object.entries(WILDLIFE)){
    const root=new T.Group(),wildlife=createWildlife(root,biome,level++);
    populations.add(spec.residents.map(([kind])=>kind).join(','));
    const geometryCount=root.children.length;
    for(const mesh of root.children){
      assert.ok(mesh.geometry.attributes.position.count>40,'authored multi-part animals');
      for(const value of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
      assert.equal(mesh.geometry.attributes.color.count,mesh.geometry.attributes.position.count);
    }
    for(let time=0;time<150;time+=.25){
      wildlife.update(time);
      const state=wildlife.snapshot();assert.ok(state.creatures>0&&state.creatures<=22);
      assert.ok(state.wildlifePositions.every(p=>Math.abs(p.x)>7.6),'wildlife avoids combat lanes');
      for(const mesh of root.children)assert.ok(mesh.count<=mesh.instanceMatrix.count);
    }
    assert.equal(root.children.length,geometryCount,'visits never allocate more meshes');
    wildlife.update(0);const high=wildlife.snapshot().creatures;
    wildlife.setQuality('balanced',.65);wildlife.update(0);
    assert.ok(wildlife.snapshot().creatures<=high);
    const paused=JSON.stringify(wildlife.snapshot());wildlife.update(0,true);assert.equal(JSON.stringify(wildlife.snapshot()),paused);
    for(const geometry of new Set(root.children.map(m=>m.geometry)))geometry.dispose();
    for(const material of new Set(root.children.map(m=>m.material)))material.dispose();
  }
  assert.equal(populations.size,15,'each world has its own resident combination');
});

test('butterfly gatherings are occasional and restricted to the jungle',()=>{
  const root=new T.Group(),wildlife=createWildlife(root,'jungle',0);wildlife.update(0);
  const before=wildlife.snapshot(),bloom=before.nextBloom;
  assert.equal(before.butterflyBloom,0);
  wildlife.update(bloom.start+bloom.duration*.5);assert.equal(wildlife.snapshot().butterflyBloom,8);
  wildlife.update(bloom.start+bloom.duration+.1);assert.equal(wildlife.snapshot().butterflyBloom,0);
  assert.deepEqual(Object.keys(WILDLIFE).filter(key=>WILDLIFE[key].bloom),['jungle']);
});
