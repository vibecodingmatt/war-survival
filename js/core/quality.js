// Cosmetic governor only. Never change combat dt, targeting, projectile caps or warnings.
export function nextRenderTime(previous,now,interval=1000/60){
  const elapsed=now-previous;
  if(elapsed<interval-.5)return null;
  // An early frame within the tolerance consumes its slot. A modulo here would
  // leave the old timestamp intact and render again on the next high-refresh tick.
  return now-(elapsed>=interval?elapsed%interval:0);
}

// Hysteresis prevents quality oscillation: three slow seconds down, twelve fast up.
export function createQualityGovernor(){
  let scale=1,elapsed=0,total=0,frames=0,slow=0,fast=0;
  return {
    get scale(){return scale;},
    reset(){scale=1;elapsed=total=frames=slow=fast=0;},
    sample(milliseconds,enabled){
      if(!enabled||milliseconds<=0||milliseconds>100){elapsed=total=frames=slow=fast=0;return false;}
      elapsed+=milliseconds;total+=milliseconds;frames++;
      if(elapsed<1000)return false;
      const mean=total/frames;elapsed=total=frames=0;
      slow=mean>22?slow+1:0;fast=mean<18?fast+1:0;
      const before=scale;
      if(slow>=3){scale=Math.max(.8,Math.round((scale-.1)*10)/10);slow=0;fast=0;}
      if(fast>=12){scale=Math.min(1,Math.round((scale+.1)*10)/10);fast=0;}
      return scale!==before;
    },
  };
}
