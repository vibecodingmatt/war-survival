const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:4173/war-survival/')+'?test=1');await page.waitForFunction(()=>window.__warTest?.ready,null,{timeout:60000});
 assert.equal(await page.locator('[data-level]:not(:disabled)').count(),1);
 await page.locator('[data-level="8"]').evaluate(e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true})));
 assert.equal(await page.locator('[data-level="0"]').getAttribute('aria-pressed'),'true');
 assert.match(await page.locator('#menu').innerText(),/W A S D/);await page.locator('#start-button').click();
 await page.keyboard.down('KeyD');await page.waitForTimeout(450);await page.keyboard.up('KeyD');assert.ok((await page.evaluate(()=>window.__warTest.snapshot())).x>1);
 await page.keyboard.press('Digit1');await page.waitForFunction(()=>window.__warTest.snapshot().shots.recruits>0);
 await page.keyboard.press('Digit3');await page.waitForFunction(()=>window.__warTest.snapshot().armory.hp<650);
 await page.mouse.move(700,520);await page.mouse.down();await page.mouse.move(645,520);await page.waitForTimeout(450);await page.mouse.up();assert.equal((await page.evaluate(()=>window.__warTest.controls())).steerX,null);
 await page.keyboard.press('Digit2');await page.keyboard.press('Space');assert.ok((await page.evaluate(()=>window.__warTest.snapshot())).cooldown>0);
 await page.keyboard.press('Escape');const time=(await page.evaluate(()=>window.__warTest.snapshot())).time;await page.waitForTimeout(200);assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).time,time);
 await page.locator('#restart-button').click();
 // UI progression uses accelerated wave clears; ordinary combat is covered by campaign.cjs.
 for(let level=1;level<=15;level++){
   assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).level,level);
   for(let wave=0;wave<4;wave++)await page.evaluate(()=>{window.__warTest.clear();const initial=window.__warTest.snapshot().wave;for(let i=0;i<160;i++){window.__warTest.step(.2);const s=window.__warTest.snapshot();if(s.wave!==initial||s.state!=='active')break;}});
   assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).state,'victory');
   assert.equal(await page.locator('[data-level]:not(:disabled)').count(),Math.min(level+1,15));
   if(level===1){await page.reload();await page.waitForFunction(()=>window.__warTest?.ready);assert.equal(await page.locator('[data-level]:not(:disabled)').count(),2);assert.equal(await page.locator('[data-level="1"]').getAttribute('aria-pressed'),'true');await page.locator('#start-button').click();continue;}
   if(level<15){await page.locator('#next-level-button').click();assert.equal((await page.evaluate(()=>window.__warTest.snapshot())).squad,9);}
   else {assert.equal(await page.locator('#next-level-button').isVisible(),false);assert.match(await page.locator('#result-title').textContent(),/Borderlands/);}
 }
 await page.locator('#result-panel [data-menu]').click();assert.match(await page.locator('#campaign-progress').textContent(),/15 \/ 15/);
 assert.deepEqual(errors,[]);console.log('PASS: desktop keyboard/mouse controls, pause, artillery, all fourteen Next Level transitions, fresh starts and final campaign result.');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
