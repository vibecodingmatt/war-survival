const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),normalize=text=>text.replace(/\r\n/g,'\n');
const read=file=>fs.readFile(path.join(root,file),'utf8');
async function inventory(directory){
  const entries=await fs.readdir(path.join(root,directory),{withFileTypes:true});
  const groups=await Promise.all(entries.map(entry=>entry.isDirectory()?inventory(directory+'/'+entry.name):[directory+'/'+entry.name]));
  return groups.flat();
}
(async()=>{
  const {version}=JSON.parse(await read('package.json')),lock=JSON.parse(await read('package-lock.json'));
  assert.equal(lock.version,version);assert.equal(lock.packages[''].version,version);
  const runtime=(await Promise.all(['js','data','css'].map(inventory))).flat().filter(file=>/\.(js|css)$/.test(file));
  let imports=0;
  for(const file of runtime.filter(file=>file.endsWith('.js'))){
    for(const match of (await read(file)).matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
      const [relative,query]=match[1].split('?'),target=path.resolve(root,path.dirname(file),relative);
      assert.ok((await fs.stat(target)).isFile(),file+' imports '+relative);
      if(!path.relative(root,target).replace(/\\/g,'/').startsWith('vendor/'))assert.equal(query,'v='+version,file+' has a stale import');
      imports++;
    }
  }
  const html=await read('index.html');
  assert.ok(html.includes(' · '+version+'</div>'),'visible build version');
  for(const match of html.matchAll(/(?:href|src)="(\.\/(?:css|js)\/[^\"]+)"/g)){
    const url=new URL(match[1],'https://example.com/');assert.equal(url.search,'?v='+version);
    assert.ok((await fs.stat(path.join(root,url.pathname))).isFile());
  }
  assert.match(html,/name="twitter:card" content="summary_large_image"/);
  const shareImage=html.match(/property="og:image" content="([^"]+)"/)[1];
  assert.ok(shareImage.startsWith('https://vibecodingmatt.github.io/war-survival/'));
  const assets=[new URL(shareImage).pathname.replace(/^\/war-survival\//,''),'assets/images/apple-touch-icon.png','assets/images/favicon-32.png'];
  for(const asset of assets)assert.ok((await fs.stat(path.join(root,asset))).size>0);
  console.log(`PASS: v${version} package/build/import versions, ${imports} imports, static entry points and share assets.`);
  if(!process.argv.includes('--live'))return;

  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
  const base=(process.env.RELEASE_URL||'https://vibecodingmatt.github.io/war-survival/').replace(/\/?$/,'/');
  const output=path.join(root,'test-results/release');await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const context=await browser.newContext(),request=context.request;
    const response=await request.get(base);assert.equal(response.status(),200);
    assert.equal(normalize(await response.text()),normalize(html),'live HTML matches release');
    for(let i=0;i<runtime.length;i+=4)await Promise.all(runtime.slice(i,i+4).map(async file=>{
      const response=await request.get(base+file+'?v='+version);assert.equal(response.status(),200,file);
      assert.equal(normalize(await response.text()),normalize(await read(file)),'live content: '+file);
    }));
    const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
    for(const asset of assets){
      const response=await request.get(base+asset);assert.equal(response.status(),200,asset);
      assert.equal(hash(await response.body()),hash(await fs.readFile(path.join(root,asset))),'live asset: '+asset);
    }
    await context.close();const errors=[];
    for(const mobile of [false,true]){
      const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
      await context.addCookies([{name:'war_survival_campaign_v1',value:'3ff',url:base}]);
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
      // The loaded game indicator establishes readiness after module/asset setup.
      await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForFunction(()=>document.querySelector('#loading').classList.contains('hidden'),null,{timeout:60000});
      assert.equal(await page.evaluate(()=>typeof window.__warTest),'undefined');
      assert.equal(await page.locator('[data-level="10"]').isDisabled(),false);
      assert.equal(await page.locator('[data-level="11"]').isDisabled(),true);
      await page.locator('[data-level="10"]').click();await page.locator('#start-button').click();await page.waitForTimeout(1600);
      assert.equal(await page.locator('#hud').isVisible(),true);assert.equal(await page.locator('#error-panel').isVisible(),false);
      await page.locator('#pause-button').click();assert.equal(await page.locator('#pause-panel').isVisible(),true);
      await page.locator('#resume-button').click();assert.equal(await page.locator('#pause-panel').isVisible(),false);
      await page.screenshot({path:path.join(output,'live-'+version+'-'+(mobile?'phone':'desktop')+'.png')});await context.close();
    }
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(output,'verification.json'),JSON.stringify({version,url:base,verifiedAt:new Date().toISOString(),runtimeFiles:runtime.length,assets,desktop:true,phone:true},null,2));
    console.log(`PASS: live v${version} HTML, ${runtime.length} modules/styles and share assets match; desktop/phone startup, save migration, pause/resume and production debug isolation pass.`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
