const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/',output=path.resolve('test-results/wildlife');
fs.mkdirSync(output,{recursive:true});let browser;
(async()=>{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors=[],report=[];
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
    await context.addCookies([{name:'war_survival_campaign_v1',value:'7fff',url:base}]);const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
    await page.evaluate(()=>window.__warTest.useManualClock());
    for(let level=0;level<15;level++){
      await page.locator('[data-level="'+level+'"]').click();await page.locator('#start-button').click();await page.waitForTimeout(400);
      await page.locator('#pause-button').click();
      await page.evaluate(()=>{const w=window.__warTest.world();window.__warTest.visualTime(w.detailTime-w.wildlifeTime+w.nextVisit.start+w.nextVisit.duration*.5);document.querySelector('#pause-panel').style.visibility='hidden';});
      await page.waitForTimeout(250);
      let state=await page.evaluate(()=>window.__warTest.world());
      assert.ok(state.visitors>0,'scheduled visitor visible in world '+(level+1));assert.ok(state.creatures<=22);assert.ok(state.detailBatches<=12);
      const positions=JSON.stringify(state.wildlifePositions);await page.waitForTimeout(100);assert.equal(JSON.stringify((await page.evaluate(()=>window.__warTest.world())).wildlifePositions),positions,'wildlife freezes on pause');
      await page.screenshot({path:path.join(output,(mobile?'phone':'desktop')+'-'+(level+1)+'.png'),style:'#banner,#rift-banner{visibility:hidden}'});
      report.push({mobile,level:level+1,species:state.wildlifeSpecies,visitor:state.visitorSpecies,count:state.creatures});
      if(level===0){
        await page.evaluate(()=>{const w=window.__warTest.world();window.__warTest.visualTime(w.detailTime-w.wildlifeTime+w.nextBloom.start+w.nextBloom.duration*.4);});await page.waitForTimeout(150);
        assert.ok((await page.evaluate(()=>window.__warTest.world())).butterflyBloom>0);
        await page.screenshot({path:path.join(output,(mobile?'phone':'desktop')+'-butterfly-gathering.png'),style:'#banner,#rift-banner{visibility:hidden}'});
      }
      await page.evaluate(()=>{const w=window.__warTest.world();window.__warTest.visualTime(w.detailTime-w.wildlifeTime+w.nextVisit.start+w.nextVisit.duration+.5);});
      assert.equal((await page.evaluate(()=>window.__warTest.world())).visitors,0,'visitors leave the scene');
      await page.locator('#pause-panel').evaluate(e=>e.style.removeProperty('visibility'));await page.locator('#pause-panel [data-menu]').click();
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: varied residents and scheduled visitors in all 15 worlds, butterfly gathering, quiet intervals, desktop/phone framing and pause.');
  await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
