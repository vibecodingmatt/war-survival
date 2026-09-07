const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/';
const output=path.resolve('test-results/mobile');fs.mkdirSync(output,{recursive:true});
let browser;
async function touchCopy(page){
  const copy=await page.evaluate(()=>({
    text:document.body.innerText,
    labels:[...document.querySelectorAll('[aria-label],[title]')].filter(e=>e.getClientRects().length).map(e=>(e.getAttribute('aria-label')||'')+' '+(e.title||'')).join('\n'),
    keys:[...document.querySelectorAll('kbd')].filter(e=>e.getClientRects().length).length,
  }));
  const keyboard=/\bW\s*A\s*S\s*D\b|\bspace\b|\besc(?:ape)?\b|\barrow keys\b|\bkeys?\s+[123]\b|1\s*\/\s*2\s*\/\s*3/i;
  assert.doesNotMatch(copy.text,keyboard,'visible mobile copy contains no keyboard instructions');
  assert.doesNotMatch(copy.labels,keyboard,'mobile accessibility labels contain no keyboard instructions');
  assert.equal(copy.keys,0,'no visible keyboard badges');
}
async function layout(page){
  const boxes=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
    return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,
      lanes:rect('.lane-controls'),squad:rect('.squad-card'),artillery:rect('#barrage-button'),pause:rect('#pause-button'),
      buttons:[...document.querySelectorAll('.lane-controls button,#barrage-button,#pause-button,#sound-button')].map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.dataset.lane,x:r.x,y:r.y,w:r.width,h:r.height};})};
  });
  assert.equal(boxes.overflow,false,'viewport has no horizontal overflow');
  for(const b of boxes.buttons){
    assert.ok(b.w>=44&&b.h>=44,b.id+' has a comfortable touch target');
    assert.ok(b.x>=-.5&&b.y>=-.5&&b.x+b.w<=boxes.width+.5&&b.y+b.h<=boxes.height+.5,b.id+' stays on screen');
  }
  const overlaps=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1;
  assert.equal(overlaps(boxes.lanes,boxes.squad),false,'lane buttons stay clear of squad card');
  assert.equal(overlaps(boxes.lanes,boxes.artillery),false,'lane buttons stay clear of artillery');
  return boxes;
}
(async()=>{
  const {strategy}=await import('./strategy.mjs');
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
  await touchCopy(page);
  const settings=await page.evaluate(()=>window.__warTest.renderer());
  assert.equal(settings.quality,'balanced');assert.equal(settings.pixelRatio,1);assert.equal(settings.shadowSize,1024);
  await page.locator('#start-button').tap();await layout(page);await touchCopy(page);
  const cdp=await context.newCDPSession(page);
  await page.locator('[data-lane="recruits"]').tap();
  assert.equal((await page.evaluate(()=>window.__warTest.controls())).steerX,-3.8);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:185,y:490}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:187,y:492}]});
  await page.waitForTimeout(120);
  let controls=await page.evaluate(()=>window.__warTest.controls());
  assert.equal(controls.steerX,null,'touch takes control from automatic lane steering immediately');
  assert.equal(controls.dx,0);assert.equal(controls.dz,0,'tiny finger movement stays in the dead zone');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:185,y:430}]});
  await page.waitForTimeout(250);controls=await page.evaluate(()=>window.__warTest.controls());
  assert.equal(controls.dx,0);assert.ok(controls.dz<-.95,'vertical drag remains vertical');
  const ability=await page.locator('#barrage-button').boundingBox(),ax=ability.x+ability.width/2,ay=ability.y+ability.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:185,y:430},{id:2,x:ax,y:ay}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:2,x:ax,y:ay}]});
  await page.waitForTimeout(100);
  assert.ok((await page.evaluate(()=>window.__warTest.snapshot())).cooldown>0,'a second finger can fire artillery');
  assert.equal((await page.evaluate(()=>window.__warTest.controls())).dragging,true,'artillery does not interrupt movement');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal((await page.evaluate(()=>window.__warTest.controls())).dragging,false);
  await page.waitForTimeout(350);const stopped=(await page.evaluate(()=>window.__warTest.snapshot())).z;
  await page.waitForTimeout(250);assert.ok(Math.abs((await page.evaluate(()=>window.__warTest.snapshot())).z-stopped)<.06,'lifting the finger stops movement');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:185,y:490}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:230,y:480}]});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
  assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).state,'paused','rotation pauses active combat');
  assert.equal((await page.evaluate(()=>window.__warTest.controls())).dragging,false,'rotation clears captured movement');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await touchCopy(page);await page.locator('#resume-button').tap();await layout(page);
  await page.locator('#pause-button').tap();await page.locator('#quality-button').tap();
  assert.equal((await page.evaluate(()=>window.__warTest.renderer())).quality,'high');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  assert.equal((await page.evaluate(()=>window.__warTest.renderer())).quality,'high','rotation preserves chosen graphics');
  await page.locator('#quality-button').tap();await page.locator('#pause-panel [data-menu]').tap();

  for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[667,375],[568,320]]){
    await page.setViewportSize({width,height});
    // Emulate the CSS insets supplied by notched browsers, in addition to ordinary viewports.
    await page.evaluate(landscape=>{
      const s=document.documentElement.style;
      s.setProperty('--safe-left',landscape?'44px':'0px');s.setProperty('--safe-right',landscape?'44px':'0px');
      s.setProperty('--safe-top',landscape?'0px':'24px');s.setProperty('--safe-bottom','20px');
    },width>height);
    await page.waitForTimeout(150);await touchCopy(page);
    await page.locator('#start-button').scrollIntoViewIfNeeded();
    const deploy=await page.locator('#start-button').boundingBox();
    assert.ok(deploy.y>=0&&deploy.y+deploy.height<height,'deploy is reachable at '+width+'×'+height);
    await page.screenshot({path:path.join(output,width+'x'+height+'-menu.png')});
    await page.locator('#start-button').tap();await page.waitForTimeout(200);
    await layout(page);await touchCopy(page);
    await page.locator('[data-lane="weapons"]').tap();
    await page.waitForFunction(()=>window.__warTest.snapshot().focus==='weapons',null,{timeout:4000});
    await page.waitForTimeout(150);await page.screenshot({path:path.join(output,width+'x'+height+'-battle.png')});
    await page.locator('#pause-button').tap();await touchCopy(page);
    await page.screenshot({path:path.join(output,width+'x'+height+'-pause.png')});
    await page.locator('#pause-panel [data-menu]').tap();
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{const s=document.documentElement.style;s.setProperty('--safe-left','0px');s.setProperty('--safe-right','0px');});
  await page.locator('[data-level="1"]').tap();await page.locator('#start-button').tap();
  let checkedFullSquad=false,state;
  for(let i=0;i<800;i++){
    state=await page.evaluate(()=>window.__warTest.snapshot());
    if(state.state!=='active')break;
    if(state.squad===42&&!checkedFullSquad){
      checkedFullSquad=true;await page.waitForTimeout(100);
      await page.screenshot({path:path.join(output,'full-squad-portrait.png')});
      await page.locator('#pause-button').tap();
      await page.setViewportSize({width:320,height:568});
      await page.evaluate(()=>window.__warTest.place(3.8,16));await page.waitForTimeout(1200);
      const foot=await page.evaluate(()=>{const s=window.__warTest.snapshot();return window.__warTest.screenPoint(s.x,0,s.z+3.5);});
      const dock=await page.locator('.lane-controls').boundingBox();
      assert.ok(foot.y<dock.y,'rear soldiers stay above the dock: foot '+Math.round(foot.y)+', dock '+Math.round(dock.y));
      const incoming=await page.evaluate(()=>window.__warTest.screenPoint(0,1,-26));
      assert.ok(incoming.y>90,'incoming enemy ranks remain in view below the phone header');
      await page.setViewportSize({width:568,height:320});
      await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-left','44px');document.documentElement.style.setProperty('--safe-right','44px');document.documentElement.style.setProperty('--safe-top','0px');});
      await page.waitForTimeout(1200);
      const landscapeFoot=await page.evaluate(()=>window.__warTest.screenPoint(3.8,0,19.5));
      const landscapeDock=await page.locator('.lane-controls').boundingBox();
      assert.ok(landscapeFoot.y<landscapeDock.y,'landscape foot '+Math.round(landscapeFoot.y)+' stays above dock '+Math.round(landscapeDock.y));
      await page.evaluate(()=>window.__warTest.place(0,11));
      await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-left','0px');document.documentElement.style.setProperty('--safe-right','0px');});
      await page.setViewportSize({width:390,height:844});await page.locator('#resume-button').tap();
      state=await page.evaluate(()=>window.__warTest.snapshot());
    }
    await page.evaluate(input=>window.__warTest.step(.2,input),strategy(state));
  }
  assert.equal(state.state,'victory','Level 2 remains playable with mobile rendering and controls');
  assert.ok(checkedFullSquad);await touchCopy(page);
  await page.screenshot({path:path.join(output,'level2-victory.png')});
  console.log('Mobile Level 2:',{health:state.health,squad:state.squad,kills:state.kills});
  const desktopContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:false});
  const desktop=await desktopContext.newPage();await desktop.goto(base+'?test=1');
  await desktop.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
  assert.match(await desktop.locator('#menu').innerText(),/W A S D/,'a narrow desktop keeps keyboard instructions');
  assert.equal((await desktop.evaluate(()=>window.__warTest.renderer())).quality,'high');
  assert.deepEqual(errors,[],'no mobile browser errors or missing assets');
  console.log('PASS: touch copy and labels, 44px targets, eight phone/tablet layouts, notched-screen insets, two-finger artillery, drag takeover/dead zone/release, rotation pause, quality defaults, full-squad visibility, Level 2 victory, and narrow desktop input hints.');
  await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
