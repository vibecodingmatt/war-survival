export class BattlefieldAudio {
  constructor(){this.enabled=true;this.ctx=null;this.lastShot=0;try{this.enabled=localStorage.getItem('war-survival-sound')!=='off';}catch{}}
  async start(){
    try{
      if(!this.ctx){
        this.ctx=new (window.AudioContext||window.webkitAudioContext)();
        this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.34:0;this.master.connect(this.ctx.destination);
        const length=this.ctx.sampleRate*3;this.noise=this.ctx.createBuffer(1,length,this.ctx.sampleRate);
        const data=this.noise.getChannelData(0);for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
        const wind=this.ctx.createBufferSource();wind.buffer=this.noise;wind.loop=true;
        const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=350;
        const gain=this.ctx.createGain();gain.gain.value=.065;wind.connect(filter).connect(gain).connect(this.master);wind.start();
        for(const frequency of [73.416,110,146.832]){
          const oscillator=this.ctx.createOscillator(),g=this.ctx.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;
          g.gain.value=.018;oscillator.connect(g).connect(this.master);oscillator.start();
        }
      }
      await this.ctx.resume();
    }catch{this.enabled=false;}
  }
  toggle(){this.enabled=!this.enabled;try{localStorage.setItem('war-survival-sound',this.enabled?'on':'off');}catch{}
    if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?.34:0,this.ctx.currentTime,.06);return this.enabled;}
  noiseHit(duration,volume,frequency){
    if(!this.ctx||!this.enabled)return;
    const now=this.ctx.currentTime,source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
    source.buffer=this.noise;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,now);filter.frequency.exponentialRampToValueAtTime(110,now+duration);
    gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    source.connect(filter).connect(gain).connect(this.master);source.start(now,Math.random());source.stop(now+duration+.02);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  tone(frequency,duration,volume=.14,type='sine'){
    if(!this.ctx||!this.enabled)return;
    const now=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(frequency,now);o.frequency.exponentialRampToValueAtTime(frequency*.45,now+duration);
    g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);
    o.connect(g).connect(this.master);o.start();o.stop(now+duration);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  handle(e){
    if(!this.ctx||!this.enabled)return;
    const now=this.ctx.currentTime;
    if(e.type==='shot'&&now-this.lastShot>.047){
      this.lastShot=now;const energy=['frost','arc','rail','sun'].includes(e.weaponId),cannon=e.weaponLevel===4;
      this.noiseHit(cannon?.2:.1,cannon?.25:.16,energy?1900:e.weaponId==='flame'?900:e.weaponLevel===3?4700:3300);
      this.tone(energy?(e.weaponId==='arc'?520:340):cannon?85:125,cannon?.17:.09,energy?.045:.08,energy?'sine':'triangle');
    }
    if(e.type==='explosion'){this.noiseHit(.7,.6,1800);this.tone(78,.5,.35);}
    if(e.type==='hurt'){this.tone(150,.19,.22,'triangle');this.noiseHit(.17,.12,700);}
    if(e.type==='wave'){this.tone(220,1.1,.09,'triangle');this.tone(330,.9,.05);}
    if(e.type==='recruit'){this.tone(660,.16,.065);this.tone(880,.22,.04);}
    if(e.type==='weapon'){this.tone(440,.45,.1);this.tone(660,.6,.1);this.tone(990,.8,.07);}
    if(e.type==='powerup'){this.tone(440,.8,.12);this.tone(880,.65,.1);this.tone(1320,.9,.05);}
    if(e.type==='choiceOpen'){this.tone(660,.45,.07);this.tone(990,.7,.055);}
    if(e.type==='choiceTaken'){this.tone(1100,.6,.11);this.noiseHit(.35,.14,2600);}
    if(e.type==='bossSwing'){this.noiseHit(.32,.25,3600);this.tone(92,.35,.18);}
    if(e.type==='bossImpact'){this.noiseHit(.65,.55,1800);this.tone(52,.7,.3);}
    if(e.type==='shieldBlock'){this.tone(760,.7,.12);this.tone(1140,.65,.08);}
    if(e.type==='powerBeam'&&now-(this.lastArc||0)>.12){this.lastArc=now;this.tone(e.color===0xeb9dff?940:1400,.1,.045,'triangle');}
    if(e.type==='warning')this.tone(380,.3,.075,'triangle');
    if(e.type==='victory'){this.tone(440,1.4,.14);this.tone(660,1.5,.1);this.tone(880,1.3,.05);}
    if(e.type==='defeat')this.tone(130,1.7,.16);
  }
}
