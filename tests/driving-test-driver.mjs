// A test driver modulates a torque pedal to hold a requested speed. The sandbox itself has no speed servo.
export const pedalFor=(frame,target=2)=>Math.sign(target)*Math.max(0,Math.min(1,.22+(Math.abs(target)-Math.sign(target)*(frame?.longitudinalSpeed??0))*.2));
