import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlay, createProgress, decodeProgress, frontier, LEVEL_COUNT, COMPLETE_MASK } from '../js/core/progress.js';

test('only victories and the next uncompleted stage are playable',()=>{
  let mask=0;
  for(let next=0;next<LEVEL_COUNT;next++){
    assert.equal(frontier(mask),next);
    for(let i=0;i<LEVEL_COUNT;i++)assert.equal(canPlay(mask,i),i<=next);
    mask|=1<<next;
  }
  assert.equal(frontier(mask),LEVEL_COUNT-1);assert.equal(canPlay(mask,LEVEL_COUNT),false);assert.equal(canPlay(mask,-1),false);
  assert.equal(canPlay(1<<7,8),false,'a legacy victory does not unlock all intervening sectors');
  assert.equal(canPlay(1<<7,7),true);
});
test('cookie completion survives a new session and rejected stages cannot be recorded',()=>{
  const doc={cookie:''},progress=createProgress(doc,null);
  assert.equal(progress.beat(4),false);assert.equal(doc.cookie,'');
  assert.equal(progress.beat(0),true);assert.match(doc.cookie,/Max-Age=31536000/);assert.match(doc.cookie,/SameSite=Lax/);
  const restored=createProgress(doc,null);assert.equal(restored.completed(0),true);assert.equal(restored.allowed(1),true);assert.equal(restored.allowed(2),false);
});
test('malformed cookies are discarded and existing earned progress migrates once',()=>{
  for(const value of ['','xyz','-1','8000','ffff','1garbage','%31'])assert.equal(decodeProgress(value),0);
  assert.equal(decodeProgress('3ff'),1023);
  assert.equal(decodeProgress('7fff'),COMPLETE_MASK);
  const veteran=createProgress({cookie:'war_survival_campaign_v1=3ff'},null);assert.equal(veteran.next,10);assert.equal(veteran.allowed(10),true);assert.equal(veteran.allowed(11),false);
  const doc={cookie:''},storage={getItem:key=>['war-survival-level-1','war-survival-level-8'].includes(key)?'complete':null};
  const progress=createProgress(doc,storage);assert.equal(progress.mask,129);assert.ok(progress.allowed(0)&&progress.allowed(1)&&progress.allowed(7));assert.equal(progress.allowed(8),false);
  assert.match(doc.cookie,/=81;/);
  assert.equal(createProgress({cookie:'war_survival_campaign_v1=0'},storage).mask,0,'existing cookie is authoritative');
});
