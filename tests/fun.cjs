const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/',output=path.resolve('test-results/fun');fs.mkdirSync(output,{recursive:true});let browser;
(async()=>{
 const {strategy}=await import('./strategy.mjs'),{POWER_DECK}=await import('../data/powers.js');
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
 await context.addCookies([{name:'war_survival_campaign_v1',value:'7fff',url:base}]);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const seen=new Set();let choiceShot=false;
 for(const seed of [731,42,19]){
  await page.goto(base+'?test=1&seed='+seed);await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});await page.evaluate(()=>window.__warTest.useManualClock());
  await page.locator('[data-level="0"]').click();await page.locator('#start-button').click();
  for(let i=0;i<750;i++){
   const state=await page.evaluate(()=>window.__warTest.snapshot());if(state.state!=='active')break;
   if(state.choice&&!choiceShot){choiceShot=true;await page.waitForTimeout(120);assert.equal((await page.evaluate(()=>window.__warTest.targets())).armory,false);await page.screenshot({path:path.join(output,'choose-one-desktop.png')});}
   for(const kind of POWER_DECK)if(state.buffs[kind]>0&&!seen.has(kind)){
    await page.evaluate(seconds=>window.__warTest.step(seconds),kind==='starfall'?.65:.35);await page.waitForTimeout(150);
    const fx=await page.evaluate(()=>window.__warTest.spectacle());const key={tesla:'drones',prism:'prism',starfall:'meteors',gravity:'gravity',phoenix:'phoenix'}[kind];assert.ok(fx[key],kind+' renders');
    await page.screenshot({path:path.join(output,kind+'.png')});seen.add(kind);
   }
   const input=strategy(state);if(state.choice&&state.nearestEnemy<state.z-6)input.x=Math.max(-1,Math.min(1,(3.8-state.x)*3));
   await page.evaluate(input=>window.__warTest.step(.2,input),input);
  }
  if(seen.size===POWER_DECK.length)break;
 }
 assert.equal(seen.size,5,'all five random powers can be earned through normal shooting');
 await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready);await page.evaluate(()=>window.__warTest.useManualClock());
 await page.locator('[data-level="9"]').click();await page.locator('#start-button').click();let launch=false;
 for(let i=0;i<750;i++){
  const state=await page.evaluate(()=>window.__warTest.snapshot());if(state.state!=='active')break;
  if(state.launchedSoldiers>0&&!launch){launch=true;await page.evaluate(()=>window.__warTest.step(.45));await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'boss-soldiers-airborne.png')});}
  await page.evaluate(input=>window.__warTest.step(.2,input),strategy(state));
 }
 assert.ok(launch,'a real boss hit launches soldiers during tactical play');
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await touch.newPage();
 phone.on('pageerror',e=>errors.push(e.message));phone.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await touch.addCookies([{name:'war_survival_campaign_v1',value:'7fff',url:base}]);
 await phone.goto(base+'?test=1');await phone.waitForFunction(()=>window.__warTest?.ready);await phone.evaluate(()=>window.__warTest.useManualClock());
 await phone.locator('[data-level="10"]').tap();await phone.locator('#start-button').tap();await phone.evaluate(()=>window.__warTest.step(.1));await phone.waitForTimeout(300);
 assert.ok((await phone.evaluate(()=>window.__warTest.snapshot())).choice);assert.equal((await phone.evaluate(()=>window.__warTest.targets())).armory,false);
 assert.ok(await phone.locator('#rift-banner').isVisible());assert.ok(await phone.locator('#rift-options').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=15));
 await phone.screenshot({path:path.join(output,'choose-one-mobile.png')});
 for(const [width,height] of [[320,568],[844,390],[568,320]]){
  await phone.locator('#pause-button').tap();await phone.setViewportSize({width,height});await phone.locator('#resume-button').tap();await phone.waitForTimeout(150);
  const box=await phone.locator('#rift-banner').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height,'rift choice fits '+width+'x'+height);
  await phone.screenshot({path:path.join(output,'choose-one-'+width+'x'+height+'.png')});
 }
 assert.deepEqual(errors,[]);console.log('PASS: five randomly earned powers, power visuals, real boss launches, and mobile power-duel layouts.');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
