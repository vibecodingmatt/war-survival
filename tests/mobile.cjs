const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/';
const output=path.resolve('test-results/mobile');fs.mkdirSync(output,{recursive:true});let browser;
async function touchCopy(page){
 const copy=await page.evaluate(()=>({text:document.body.innerText,labels:[...document.querySelectorAll('[aria-label],[title]')].filter(e=>e.getClientRects().length).map(e=>(e.getAttribute('aria-label')||'')+' '+(e.title||'')).join('\n'),keys:[...document.querySelectorAll('kbd')].filter(e=>e.getClientRects().length).length}));
 const keyboard=/\bW\s*A\s*S\s*D\b|\bspace\b|\besc(?:ape)?\b|\barrow keys\b|\bkeys?\s+[123]\b|1\s*\/\s*2\s*\/\s*3/i;
 assert.doesNotMatch(copy.text,keyboard);assert.doesNotMatch(copy.labels,keyboard);assert.equal(copy.keys,0);assert.doesNotMatch(copy.text,/tap a lane/i);
}
async function layout(page){
 const b=await page.evaluate(()=>({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('#barrage-button,#pause-button,#sound-button')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})}));
 assert.equal(b.overflow,false);for(const r of b.buttons){assert.ok(r.w>=44&&r.h>=44);assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=b.width+.5&&r.y+r.h<=b.height+.5);}
 assert.equal(await page.locator('.lane-controls,.armory-hud,#control-hint').count(),0);
}
(async()=>{
 const {strategy}=await import('./strategy.mjs');
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});await touchCopy(page);
 const settings=await page.evaluate(()=>window.__warTest.renderer());assert.equal(settings.quality,'balanced');assert.equal(settings.pixelRatio,1);assert.equal(settings.shadowSize,1024);
 await page.locator('#start-button').tap();await layout(page);const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:185,y:490}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:187,y:492}]});await page.waitForTimeout(120);
 let controls=await page.evaluate(()=>window.__warTest.controls());assert.equal(controls.dx,0);assert.equal(controls.dz,0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:130,y:490}]});await page.waitForFunction(()=>window.__warTest.snapshot().shots.recruits>0);
 const ability=await page.locator('#barrage-button').boundingBox(),ax=ability.x+ability.width/2,ay=ability.y+ability.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:130,y:490},{id:2,x:ax,y:ay}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:2,x:ax,y:ay}]});await page.waitForTimeout(100);
 assert.ok((await page.evaluate(()=>window.__warTest.snapshot())).cooldown>0);assert.equal((await page.evaluate(()=>window.__warTest.controls())).dragging,true);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:245,y:490}]});await page.waitForFunction(()=>window.__warTest.snapshot().focus==='weapons');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await page.evaluate(()=>window.__warTest.controls())).dragging,false);
 await page.waitForTimeout(350);const stopped=(await page.evaluate(()=>window.__warTest.snapshot())).x;await page.waitForTimeout(250);assert.ok(Math.abs((await page.evaluate(()=>window.__warTest.snapshot())).x-stopped)<.06);
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).state,'paused');await touchCopy(page);
 await page.locator('#quality-button').tap();assert.equal((await page.evaluate(()=>window.__warTest.renderer())).quality,'high');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>window.__warTest.renderer())).quality,'high');
 await page.locator('#quality-button').tap();await page.locator('#pause-panel [data-menu]').tap();
 assert.equal(await page.locator('[data-level]:not(:disabled)').count(),1);
 await context.addCookies([{name:'war_survival_campaign_v1',value:'3ff',url:base}]);
 await page.reload();await page.waitForFunction(()=>window.__warTest?.ready);let sector=0;
 for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[667,375],[568,320]]){
   await page.setViewportSize({width,height});await page.evaluate(landscape=>{const s=document.documentElement.style;s.setProperty('--safe-left',landscape?'44px':'0px');s.setProperty('--safe-right',landscape?'44px':'0px');s.setProperty('--safe-top',landscape?'0px':'24px');s.setProperty('--safe-bottom','20px');},width>height);
   await page.locator('[data-level="'+(sector++%10)+'"]').tap();await touchCopy(page);const deploy=await page.locator('#start-button').boundingBox();assert.ok(deploy.y>=0&&deploy.y+deploy.height<=height,'Deploy visible without scrolling at '+width+'x'+height);assert.equal(await page.locator('.menu-content').evaluate(e=>e.scrollTop),0);
   await page.screenshot({path:path.join(output,width+'x'+height+'-menu.png')});await page.locator('#start-button').tap();await page.waitForTimeout(1600);await layout(page);await touchCopy(page);
   await page.screenshot({path:path.join(output,width+'x'+height+'-battle.png')});await page.locator('#pause-button').tap();await touchCopy(page);await page.locator('#pause-panel [data-menu]').tap();
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{const s=document.documentElement.style;for(const key of ['left','right','top','bottom'])s.removeProperty('--safe-'+key);});
 await page.evaluate(()=>window.__warTest.useManualClock());
 await page.locator('[data-level="9"]').tap();await page.locator('#start-button').tap();let state,full=false;
 for(let i=0;i<1100;i++){
   state=await page.evaluate(()=>window.__warTest.snapshot());if(state.state!=='active')break;
   if(state.squad===42&&!full){full=true;await page.waitForTimeout(100);await page.screenshot({path:path.join(output,'full-squad-citadel.png')});
     await page.locator('#pause-button').tap();await page.setViewportSize({width:320,height:568});await page.evaluate(()=>window.__warTest.place(3.8,16));await page.waitForTimeout(1200);
     const foot=await page.evaluate(()=>window.__warTest.screenPoint(3.8,0,19.5));const box=await page.locator('.squad-card').boundingBox();assert.ok(foot.y<box.y);
     await page.evaluate(()=>window.__warTest.place(0,11));await page.setViewportSize({width:390,height:844});await page.locator('#resume-button').tap();state=await page.evaluate(()=>window.__warTest.snapshot());}
   await page.evaluate(input=>window.__warTest.step(.2,input),strategy(state));
 }
 assert.equal(state.state,'victory');assert.ok(full);await touchCopy(page);await page.screenshot({path:path.join(output,'campaign-victory.png')});
 assert.deepEqual(errors,[]);console.log('PASS: drag to recruit and upgrade, two-finger artillery, release, rotation, quality defaults, eight layouts with safe insets, no lane menus, and mobile Level 10 victory.');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
