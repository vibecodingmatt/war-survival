const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/';
const output=path.resolve('test-results/campaign');fs.mkdirSync(output,{recursive:true});
let browser;
(async()=>{
 const {strategy}=await import('./strategy.mjs');
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
 const first=Number(process.env.FIRST_LEVEL||1)-1;
 if(first)await context.addCookies([{name:'war_survival_campaign_v1',value:((1<<first)-1).toString(16),url:base}]);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
 await page.evaluate(()=>window.__warTest.useManualClock());
 assert.equal(await page.locator('[data-level]').count(),15);
 assert.equal(await page.locator('.lane-controls,.armory-hud,#control-hint').count(),0,'no persistent lane panels remain');
 const worlds=new Set(),guns=new Set();let totalPods=0,totalCarts=0;
 for(let level=first;level<15;level++){
   await page.locator('[data-level="'+level+'"]').click();await page.waitForTimeout(350);
   await page.screenshot({path:path.join(output,'level-'+(level+1)+'-menu.png')});
   await page.locator('#start-button').click();await page.waitForTimeout(1400);
   const world=await page.evaluate(()=>window.__warTest.world());worlds.add(world.biome);assert.equal(world.level,level+1);
   await page.screenshot({path:path.join(output,'level-'+(level+1)+'-world.png')});
   let state,bossShot=false,meleeShot=false,gun=1;
   for(let i=0;i<1100;i++){
     state=await page.evaluate(()=>window.__warTest.snapshot());guns.add(state.weaponId);
     if(state.state!=='active')break;
     if(state.weaponLevel!==gun){gun=state.weaponLevel;await page.waitForTimeout(100);}
     if(state.wave===4&&state.bossHealth>0&&!bossShot){bossShot=true;await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'level-'+(level+1)+'-boss.png')});}
     if(!meleeShot&&state.zones.some(z=>z.melee)){meleeShot=true;await page.waitForTimeout(100);await page.screenshot({path:path.join(output,'level-'+(level+1)+'-swipe.png')});}
     await page.evaluate(input=>window.__warTest.step(.2,input),strategy(state));
   }
   if(state.state!=='victory')console.log('Failed run:',JSON.stringify(state));
   assert.equal(state.state,'victory','Level '+(level+1)+' is beatable with ordinary tactical movement');
   totalPods+=state.podsOpened;totalCarts+=state.cartsDestroyed;
   assert.equal(await page.locator('#next-level-button').isVisible(),level<14);
   if(level<14)assert.match(await page.locator('#next-level-button').textContent(),/NEXT/);
   console.log(JSON.stringify({level:level+1,health:state.health,kills:state.kills,pods:state.podsOpened,carts:state.cartsDestroyed,world,renderer:await page.evaluate(()=>window.__warTest.renderer())}));
   await page.locator('#result-panel [data-menu]').click();
   assert.match(await page.locator('[data-level="'+level+'"] small').textContent(),/COMPLETED/);
 }
 if(first===0){assert.equal(worlds.size,15);assert.equal(guns.size,10);assert.ok(totalPods>0&&totalCarts>0);}
 const completed='15 / 15';assert.equal(await page.locator('#campaign-progress').textContent(),completed+' CLEARED');
 await page.reload();await page.waitForFunction(()=>window.__warTest?.ready);assert.equal(await page.locator('#campaign-progress').textContent(),completed+' CLEARED','completion survives reload');
 assert.deepEqual(errors,[],'no browser errors, shader failures or missing assets');
 console.log('PASS: fifteen complete levels, fifteen worlds, ten weapons, supply pods, explosive carts, completion persistence and final campaign result.');
 await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
