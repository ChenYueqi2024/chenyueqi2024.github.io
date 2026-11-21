import {random,sqdist} from '../lab-utils.mjs';

export const centers=[[-2,-2],[-2,2],[2,-2],[2,2]];
export const conditions={left:[0,1],diagonal:[0,3]};
const all=[0,1,2,3], sigma=.43;
export const horizon=5;
function normal(rng){
  const radius=Math.sqrt(-2*Math.log(Math.max(rng(),Number.EPSILON)));
  const angle=2*Math.PI*rng();
  return [radius*Math.cos(angle),radius*Math.sin(angle)];
}

export function samples(seed,count=240){
  const rng=random(seed);
  const clean=[], noise=[], start=[];
  for(let i=0;i<count;i++){
    const center=centers[i%4];
    clean.push(normal(rng).map((x,d)=>center[d]+sigma*x));
    noise.push(normal(rng));
    start.push(normal(rng));
  }
  return {clean,noise,start};
}

export function forward({clean,noise},time){
  const alpha=Math.exp(-time), jitter=Math.sqrt(1-alpha**2);
  return clean.map((p,i)=>p.map((v,j)=>alpha*v+jitter*noise[i][j]));
}

export function score(point,time,modes=all){
  const alpha=Math.exp(-time), variance=1+(sigma**2-1)*alpha**2;
  const offsets=modes.map(i=>centers[i].map((v,j)=>alpha*v-point[j]));
  const logits=offsets.map(delta=>-sqdist(delta,[0,0])/(2*variance));
  const max=Math.max(...logits), weights=logits.map(v=>Math.exp(v-max));
  const total=weights.reduce((sum,w)=>sum+w,0)*variance;
  return [0,1].map(d=>offsets.reduce((sum,delta,i)=>sum+delta[d]*weights[i],0)/total);
}

export function reverse(start,steps,target,guidance){
  const result=[start], dt=horizon/steps;
  for(let i=0;i<steps;i++){
    const time=horizon-i*dt;
    const moved=result[i].map(p=>{
      const global=score(p,time);
      const local=guidance ? score(p,time,conditions[target]) : global;
      return p.map((v,j)=>v+dt*(v+global[j]+guidance*(local[j]-global[j])));
    });
    result.push(moved);
  }
  return result;
}

export function summarize(points,target){
  const counts=[0,0,0,0];
  let missed=0;
  for(const p of points){
    const distances=centers.map(center=>sqdist(p,center));
    const best=Math.min(...distances);
    if(best<=1.1**2) counts[distances.indexOf(best)]++;
    else missed++;
  }
  const hits=conditions[target].reduce((sum,i)=>sum+counts[i],0);
  const reached=counts.reduce((sum,n)=>sum+n,0);
  const entropy=-counts.reduce((sum,n)=>sum+(n?n/reached*Math.log(n/reached):0),0);
  return {counts,missed,hits,effectiveModes:reached?Math.exp(entropy):0};
}
