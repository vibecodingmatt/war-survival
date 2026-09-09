const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/';
const output=path.resolve('test-results/menu');fs.mkdirSync(output,{recursive:true});let browser;
async function browse(page,id){
  await page.locator('#'+id).click();
  await settleScroll(page);
}
async function settleScroll(page){
  // Let native momentum/snap and the scroll-event boundary state finish together.
  await page.evaluate(()=>new Promise(resolve=>{
    const rail=document.querySelector('.level-select');let previous=rail.scrollLeft,stable=0;
    function check(){const current=rail.scrollLeft;stable=Math.abs(current-previous)<.1?stable+1:0;previous=current;if(stable>=5)resolve();else requestAnimationFrame(check);}
    requestAnimationFrame(check);
  }));
}
(async()=>{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors=[];
  for(const [width,height,touch] of [[1440,900,false],[1280,720,false],[1920,1080,false],[390,844,true],[320,568,true],[768,1024,true],[844,390,true],[568,320,true]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
    if(touch)await page.evaluate(landscape=>{const s=document.documentElement.style;s.setProperty('--safe-left',landscape?'44px':'0px');s.setProperty('--safe-right',landscape?'44px':'0px');s.setProperty('--safe-top',landscape?'0px':'24px');s.setProperty('--safe-bottom','20px');},width>height);
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.menu-art').evaluate(e=>e.complete&&e.naturalWidth>0),true);
    for(const id of ['sectors-back','sectors-forward']){
      assert.equal(await page.locator('#'+id).isVisible(),true,'Sector navigation is visible on every layout');
      const box=await page.locator('#'+id).boundingBox();assert.ok(box.width>=44&&box.height>=44,'44px navigation targets');
    }
    assert.equal(await page.locator('#sectors-back').isDisabled(),true);
    assert.equal(await page.locator('#sectors-forward').isDisabled(),false);
    if(touch)assert.match(await page.locator('#campaign-hint').innerText(),/Swipe/);
    const boxes=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,rects:['.menu-intro','.menu-deploy','.campaign-browser','#start-button'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,x:r.x,y:r.y,w:r.width,h:r.height};})}));
    assert.equal(boxes.overflow,false);
    for(const b of boxes.rects)assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=width+1&&b.y+b.h<=height+1,`${width}x${height}: ${JSON.stringify(b)}`);
    const [intro,deploy,campaign]=boxes.rects;
    const header=await page.locator('.topbar').boundingBox();
    assert.ok(intro.y>=header.y+header.height-5,'Title is clear of header '+width+'x'+height+' '+JSON.stringify({intro,header}));
    assert.ok(intro.y+intro.h<=deploy.y+1||intro.x+intro.w<=deploy.x+1,'Intro and deployment do not overlap');
    assert.ok(deploy.y+deploy.h<=campaign.y+1,'Campaign does not cover deployment');
    await page.screenshot({path:path.join(output,`${width}x${height}.png`)});
    await page.locator('#how-to-play').click();assert.equal(await page.locator('#how-dialog').evaluate(e=>e.open),true);
    if(touch)assert.equal(await page.locator('#how-dialog kbd:visible').count(),0,'Touch help has no keyboard hints');
    await page.screenshot({path:path.join(output,`${width}x${height}-help.png`)});
    await page.keyboard.press('Escape');assert.equal(await page.locator('#how-dialog').evaluate(e=>e.open),false);
    assert.equal(await page.locator('#how-to-play').evaluate(e=>document.activeElement===e),true);
    await context.addCookies([{name:'war_survival_campaign_v1',value:'3ff',url:base}]);
    await page.reload();await page.waitForFunction(()=>window.__warTest?.ready);
    assert.match(await page.locator('#start-label').textContent(),/CONTINUE/);
    await page.waitForTimeout(200);
    const selected=await page.locator('[data-level="10"]').boundingBox();assert.ok(selected.x>=0&&selected.x+selected.width<=width+1,'Returning mission is visible '+width+'x'+height+' '+JSON.stringify(selected));
    if(touch)assert.match(await page.locator('#campaign-hint').innerText(),/replay/);
    await page.screenshot({path:path.join(output,`${width}x${height}-returning.png`)});
    const before=await page.locator('.level-select').evaluate(e=>e.scrollLeft);
    await browse(page,'sectors-back');await page.waitForFunction(before=>document.querySelector('.level-select').scrollLeft<before,before);
    assert.equal(await page.locator('[data-level="10"]').getAttribute('aria-pressed'),'true','Browsing preserves selected mission');
    for(let i=0;i<15&&!await page.locator('#sectors-back').isDisabled();i++)await browse(page,'sectors-back');
    await page.waitForFunction(()=>document.querySelector('#sectors-back').disabled);
    const first=await page.locator('[data-level="0"]').boundingBox();assert.ok(first.x>=0&&first.x+first.width<=width+1,'Earlier cleared levels reachable using visible controls');
    assert.match(await page.locator('[data-level="0"] small').textContent(),/CLEARED.*REPLAY/);
    if(touch){
      const rail=await page.locator('.level-select').boundingBox(),cdp=await context.newCDPSession(page),start=rail.x+Math.min(rail.width-15,240),y=rail.y+rail.height/2;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});
      for(let step=1;step<=6;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start-step*25,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(()=>document.querySelector('.level-select').scrollLeft>30);
      await settleScroll(page);
    }
    for(let i=0;i<15&&!await page.locator('#sectors-forward').isDisabled();i++)await browse(page,'sectors-forward');
    await page.waitForFunction(()=>document.querySelector('#sectors-forward').disabled);
    assert.equal(await page.locator('#sectors-back').isDisabled(),false,'Earlier-level control remains available at the end');
    await page.locator('[data-level="0"]').click();assert.match(await page.locator('#start-label').textContent(),/REPLAY/);
    await page.locator('#start-button').click();assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).state,'active');
    await page.locator('#pause-button').click();await page.locator('#pause-panel [data-menu]').click();
    assert.equal(await page.locator('#menu').isVisible(),true);assert.match(await page.locator('#mission-name').textContent(),/ASHEN/);
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: eight desktop/phone layouts, visible 44px sector controls, both scroll boundaries, native swipes, saved-mission browsing and replay, artwork, help focus and battle return.');
  await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
