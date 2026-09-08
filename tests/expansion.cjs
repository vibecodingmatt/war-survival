const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/',output=path.resolve('test-results/expansion');fs.mkdirSync(output,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
  await context.addCookies([{name:'war_survival_campaign_v1',value:'3ff',url:base}]);const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
  assert.equal(await page.locator('[data-level="10"]').isDisabled(),false,'a veteran save opens Level 11');assert.equal(await page.locator('[data-level="11"]').isDisabled(),true);
  await context.addCookies([{name:'war_survival_campaign_v1',value:'7fff',url:base}]);await page.reload();await page.waitForFunction(()=>window.__warTest?.ready);
  await page.evaluate(()=>window.__warTest.useManualClock());
  for(let level=10;level<15;level++){
   await page.locator('[data-level="'+level+'"]').click();const deploy=await page.locator('#start-button').boundingBox();assert.ok(deploy.y+deploy.height<=(mobile?844:900));
   await page.locator('#start-button').click();await page.waitForTimeout(1100);
   const world=await page.evaluate(()=>window.__warTest.world());assert.equal(world.level,level+1);assert.ok(world.features.length>=3);
   await page.screenshot({path:path.join(output,(level+1)+(mobile?'-phone':'-desktop')+'.png')});
   const before=world.animationTime;await page.waitForTimeout(600);assert.ok((await page.evaluate(()=>window.__warTest.world())).animationTime>before);
   if(!mobile)console.log(JSON.stringify({level:level+1,world,render:await page.evaluate(()=>window.__warTest.renderer())}));
   await page.locator('#pause-button').click();await page.locator('#pause-panel [data-menu]').click();
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: five animated worlds, desktop/phone rendering, visible Deploy, and legacy-save expansion unlock.');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
