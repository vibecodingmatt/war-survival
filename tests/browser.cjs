const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/';
const output=path.resolve('test-results');fs.mkdirSync(output,{recursive:true});
const executablePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
function chooseInput(s){
  const choices=[];
  for(const x of [-4,0,4])for(const z of [4,9,15]){
    let score=Math.hypot(x-s.x,z-s.z)*.2;
    for(const zone of s.zones)if(!zone.friendly&&Math.hypot(x-zone.x,z-zone.z)<zone.radius+1)score+=20;
    if(s.pickups[0])score+=Math.hypot(x-s.pickups[0].x,z-s.pickups[0].z)*.4;
    choices.push({x,z,score});
  }
  choices.sort((a,b)=>a.score-b.score);
  return {x:Math.max(-1,Math.min(1,(choices[0].x-s.x)*2)),z:Math.max(-1,Math.min(1,(choices[0].z-s.z)*2)),barrage:true};
}
(async()=>{
 const browser=await chromium.launch({executablePath,headless:true});
 const errors=[];
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base+'?test=1');
 await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
 await page.waitForTimeout(800);
 await page.screenshot({path:path.join(output,'desktop-menu.png')});
 await page.locator('#start-button').click();
 await page.keyboard.down('KeyD');await page.waitForTimeout(400);await page.keyboard.up('KeyD');
 let state=await page.evaluate(()=>window.__warTest.snapshot());assert.ok(state.x>1,'keyboard moves squad');
 await page.mouse.move(700,520);await page.mouse.down();await page.mouse.move(630,480);await page.waitForTimeout(400);await page.mouse.up();
 const moved=await page.evaluate(()=>window.__warTest.snapshot());assert.ok(moved.x<state.x,'pointer drag moves squad');
 await page.keyboard.press('Escape');
 state=await page.evaluate(()=>window.__warTest.snapshot());assert.equal(state.state,'paused');
 await page.waitForTimeout(350);assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).time,state.time,'pause freezes combat');
 await page.locator('#quality-button').click();await page.locator('#quality-button').click();
 await page.locator('#resume-button').click();
 await page.locator('#barrage-button').click();assert.ok((await page.evaluate(()=>window.__warTest.snapshot())).cooldown>0,'artillery fired');
 await page.waitForTimeout(700);
 await page.screenshot({path:path.join(output,'desktop-artillery.png')});
 // Complete an encounter through the actual combat model with a deterministic tactical input policy.
 await page.keyboard.press('Escape');await page.locator('#restart-button').click();
 let observedBoss=false,observedUpgrade=false,maxBullets=0,maxCorpses=0;
 for(let i=0;i<1100;i++){
   state=await page.evaluate(()=>window.__warTest.snapshot());
   maxBullets=Math.max(maxBullets,state.bullets);maxCorpses=Math.max(maxCorpses,state.corpses);
   if(state.state==='victory'||state.state==='defeat')break;
   if(state.state==='upgrade'){
     observedUpgrade=true;await page.screenshot({path:path.join(output,'desktop-upgrades.png')});
     await page.locator('[data-upgrade="'+(state.health<58?'repair':'damage')+'"]').click();continue;
   }
   if(state.wave===4&&!observedBoss){
     observedBoss=true;
     await page.evaluate(()=>window.__warTest.step(2,{x:-1,barrage:true}));
     await page.waitForTimeout(250);await page.screenshot({path:path.join(output,'desktop-boss.png')});
   }
   await page.evaluate(input=>window.__warTest.step(.15,input),chooseInput(state));
   if(i%40===0)await page.waitForTimeout(20);
 }
 assert.equal(state.state,'victory','tactical play can win a complete encounter');
 assert.ok(observedBoss&&observedUpgrade);assert.ok(maxBullets<=220&&maxCorpses<=64);
 await page.screenshot({path:path.join(output,'desktop-victory.png')});
 console.log('Full encounter:',state);
 await page.locator('#replay-button').click();
 assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).kills,0,'replay resets kills');
 await page.evaluate(()=>window.__warTest.damage(100));await page.waitForTimeout(100);
 assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).state,'defeat');
 await page.locator('#replay-button').click();
 await page.locator('#sound-button').click();assert.equal(await page.locator('#sound-button').getAttribute('aria-label'),'Enable sound');
 await page.locator('#sound-button').click();
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('Desktop:',await page.evaluate(()=>window.__warTest.renderer()));
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const mobile=await mobileContext.newPage();
 mobile.on('pageerror',e=>errors.push(e.message));
 mobile.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await mobile.goto(base+'?test=1');
 await mobile.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});await mobile.waitForTimeout(700);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile does not overflow');
 await mobile.screenshot({path:path.join(output,'mobile-menu.png')});
 await mobile.locator('#start-button').tap();
 const cdp=await mobileContext.newCDPSession(mobile);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:520}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:245,y:485}]});
 await mobile.waitForTimeout(450);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok((await mobile.evaluate(()=>window.__warTest.snapshot())).x>1,'touch drag moves squad');
 await mobile.locator('#barrage-button').tap();
 await mobile.waitForTimeout(700);await mobile.screenshot({path:path.join(output,'mobile-battle.png')});
 await mobile.locator('#pause-button').tap();assert.equal((await mobile.evaluate(()=>window.__warTest.snapshot())).state,'paused');
 await mobile.locator('#resume-button').tap();
 assert.equal((await mobile.evaluate(()=>window.__warTest.snapshot())).state,'active');
 assert.deepEqual(errors,[],'no browser errors or missing assets');
 console.log('Mobile:',await mobile.evaluate(()=>window.__warTest.snapshot()));
 console.log('PASS: keyboard, mouse, touch, pause, artillery, upgrades, complete win, defeat, restart, audio, and project-path hosting.');
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
