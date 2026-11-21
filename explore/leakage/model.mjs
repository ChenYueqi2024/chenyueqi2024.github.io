import {random,shuffled,sqdist} from '../lab-utils.mjs';
export function clips(seed) {
  const rng = random(seed);
  return Array.from({length:16}, (_, scene) => {
    const rgb = Array.from({length:3}, () => .18+.65*rng());
    const stripe = rng(), pattern = rng();
    const label = scene%2;
    return Array.from({length:12},(_,frame) => {
      const cue = .39 + .19*label + .24*(rng()-.5);
      const tint = rgb.map(v=>v+.02*(rng()-.5));
      return {scene,frame,label,tint,stripe,pattern,cue,x:34+frame*5,
        descriptor:[...tint, stripe, pattern, cue*.85]};
    });
  });
}

export function protocols(seed) {
  const all = clips(seed);
  const available = all.slice(0,12).flat(), external = all.slice(12).flat();
  const rng = random(seed+101);
  const byClass = [0,1].map(label=>shuffled(available.filter(x=>x.label===label),rng));
  const randomFrames = {train:byClass.flatMap(a=>a.slice(0,48)),test:byClass.flatMap(a=>a.slice(48))};
  const held = [0,1].flatMap(label=>shuffled([0,1,2,3,4,5],rng).slice(0,2).map(i=>i*2+label));
  const grouped = {train:available.filter(x=>!held.includes(x.scene)),test:available.filter(x=>held.includes(x.scene))};
  return {randomFrames,grouped,external};
}
export function classify(training, data, features='all') {
  const vector = item => features === 'cue' ? [item.cue] : item.descriptor;
  return data.map(frame => {
    let neighbor = null, distance = Infinity;
    for (const other of training) {
      const d = sqdist(vector(frame),vector(other));
      if (d<distance) {neighbor=other;distance=d;}
    }
    return {frame,neighbor,distance,correct:neighbor.label===frame.label};
  });
}
