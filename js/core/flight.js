// Shared by the soldier meshes and their trails, so impacts never leave detached effects.
export function flightPose(unit, age=unit.age||0) {
  const f=unit.flight,gravity=15,landing=2*f.vy/gravity;
  const overEdge=Math.abs(unit.x+f.vx*landing)>6.7;
  const travel=overEdge?age:Math.min(age,landing)+Math.max(0,1-Math.exp(-(age-landing)*3))*.22;
  const airborne=age<landing||overEdge;
  const bounce=age>landing&&!overEdge?Math.max(0,Math.sin(Math.min(1,(age-landing)/.38)*Math.PI))*.38:0;
  return {x:unit.x+f.vx*travel,y:airborne?.2+f.vy*age-gravity*age*age/2:.15+bounce,z:unit.z+f.vz*travel,
    rx:airborne?age*f.spin:Math.PI*.48,ry:(unit.yaw||0)+Math.min(age,landing)*f.spin*.4,rz:Math.min(age,landing)*f.spin*.65,airborne};
}
