const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/',output=path.resolve('test-results/polish');fs.mkdirSync(output,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],report=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1});
  await context.addCookies([{name:'war_survival_campaign_v1',value:'7fff',url:base}]);const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});await page.evaluate(()=>window.__warTest.useManualClock());
  const prefix=mobile?'phone':'desktop';let initialMemory;
  for(let cycle=0;cycle<2;cycle++)for(let level=0;level<15;level++){
   await page.locator('[data-level="'+level+'"]').click();await page.locator('#start-button').click();
   // Match the original baseline's 2.2s warm-up; keep shader/sector construction
   // out of the settled frame sample without changing the wall-time FPS metric.
   await page.waitForTimeout(cycle?120:2200);
   const world=await page.evaluate(()=>window.__warTest.world());assert.equal(world.level,level+1);assert.equal(world.details.length,3);assert.ok(world.creatures>0);assert.ok(world.detailBatches<=12);
   if(!cycle){
    const before=world.animationTime;await page.waitForTimeout(150);assert.ok((await page.evaluate(()=>window.__warTest.world())).animationTime>before);
    await page.screenshot({path:path.join(output,prefix+'-world-'+(level+1)+'.png'),style:'#banner{visibility:hidden}'});
    report.push({device:prefix,level:level+1,...await page.evaluate(()=>window.__warTest.renderer())});
   }
   if(level===14){
    const memory=await page.evaluate(()=>window.__warTest.renderer());if(!cycle)initialMemory=memory;
    else {assert.ok(memory.geometries<=initialMemory.geometries+6,'world/squad resources remain bounded on revisit');assert.ok(memory.textures<=initialMemory.textures+2);}
   }
   await page.locator('#pause-button').click();await page.locator('#pause-panel [data-menu]').click();
  }
  await page.locator('[data-level="14"]').click();await page.locator('#start-button').click();
  for(const kind of ['quack','stampede']){
   await page.evaluate(kind=>{window.__warTest.stress();window.__warTest.power(kind);window.__warTest.step(kind==='quack'?.8:.6);},kind);
   await page.waitForTimeout(150);let fx=await page.evaluate(()=>window.__warTest.spectacle());assert.ok(fx[kind]);assert.ok(kind==='quack'?fx.ducks>0:fx.toyTanks>0);
   await page.screenshot({path:path.join(output,prefix+'-'+kind+'.png'),style:'#banner{visibility:hidden}'});
   await page.locator('#pause-button').click();const state=await page.evaluate(()=>window.__warTest.snapshot());await page.waitForTimeout(250);assert.deepEqual((await page.evaluate(()=>window.__warTest.snapshot())).buffs,state.buffs);await page.locator('#resume-button').click();
  }
  for(const kind of ['fanfire','helix','pinball','pulse','jackpot']){
   await page.evaluate(kind=>{window.__warTest.stress();window.__warTest.ammo(kind);window.__warTest.step(.12);},kind);await page.waitForTimeout(150);
   const fx=await page.evaluate(()=>window.__warTest.spectacle());assert.ok(Object.values(fx.shotShapes).some(n=>n>0),kind+' has projectiles');
   assert.ok((await page.locator('#buff-status').innerText()).length>0);await page.screenshot({path:path.join(output,prefix+'-'+kind+'.png')});
  }
  await page.evaluate(()=>{window.__warTest.stress();window.__warTest.power('quack');window.__warTest.power('stampede');window.__warTest.power('tesla');window.__warTest.power('prism');window.__warTest.ammo('jackpot');window.__warTest.useRealtimeClock();});
  await page.waitForTimeout(4300);
  const stress=await page.evaluate(()=>({render:window.__warTest.renderer(),fx:window.__warTest.spectacle(),state:window.__warTest.snapshot()}));
  assert.ok(stress.state.bullets<=360);assert.ok(stress.fx.particles<=stress.fx.particleBudget);assert.ok(stress.fx.segments<=stress.fx.segmentBudget);assert.ok(stress.render.calls<380,'stress draw budget');
  report.push({device:prefix,scenario:'42-soldier jackpot + four powers',...stress.render,bullets:stress.state.bullets,particles:stress.fx.particles,segments:stress.fx.segments});
  await page.screenshot({path:path.join(output,prefix+'-stress.png')});
  await page.evaluate(()=>{window.__warTest.useManualClock();window.__warTest.clear();window.__warTest.step(.02);});await page.waitForTimeout(750);
  assert.ok((await page.evaluate(()=>window.__warTest.spectacle())).finales>0);await page.screenshot({path:path.join(output,prefix+'-boss-finale.png')});
  await page.waitForTimeout(2700);assert.equal((await page.evaluate(()=>window.__warTest.spectacle())).finales,0);
  await page.locator('#pause-button').click();await page.locator('#restart-button').click();await page.waitForTimeout(100);
  const reset=await page.evaluate(()=>window.__warTest.snapshot());assert.equal(reset.ammo,null);assert.equal(reset.squad,9);assert.ok(Object.values(reset.buffs).every(v=>v===0));
  await context.close();
 }
 // Reduced motion keeps combat cues while freezing them on pause.
 const reduced=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await reduced.newPage();
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready);await page.locator('#start-button').click();
 await page.evaluate(()=>{window.__warTest.useManualClock();window.__warTest.power('quack');window.__warTest.step(.8);});await page.waitForTimeout(150);assert.ok((await page.evaluate(()=>window.__warTest.spectacle())).ducks>0);
 await page.locator('#pause-button').click();const time=(await page.evaluate(()=>window.__warTest.world())).detailTime;await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>window.__warTest.world())).detailTime,time);
 await reduced.close();
 const publicPage=await browser.newPage();await publicPage.goto(base);await publicPage.locator('#start-button').waitFor({state:'visible'});assert.equal(await publicPage.evaluate(()=>typeof window.__warTest),'undefined');await publicPage.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.filter(r=>r.scenario)));console.log('PASS: all 15 detailed worlds on desktop/phone, bounded revisit resources, five ammunition modes, comic powers, boss finales, pause/reset, reduced motion and simultaneous-power stress.');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
