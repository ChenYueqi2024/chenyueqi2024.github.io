import {random,sqdist} from '../lab-utils.mjs';
export function route(seed){
  const rng=random(seed);
  const truth=Array.from({length:29},(_,i)=>{
    const angle=i/28*2*Math.PI;
    return [2.8*Math.sin(angle),2.4*(1-Math.cos(angle))];
  });
  const measurements=truth.slice(1).map((point,i)=>point.map((v,j)=>
    v-truth[i][j]+(j===0?.068:.039)+(rng()-.5)*.13));
  return {truth,measurements};
}
export function integrate(edges){
  const route=[[0,0]];
  for(const step of edges)route.push(route.at(-1).map((v,i)=>v+step[i]));
  return route;
}

// One weighted linear least-squares system shared by both coordinates. Pin x0=y0=0.
export function optimize(measurements,loop){
  const n=measurements.length;
  const matrix=Array.from({length:n},()=>new Float64Array(n+2));
  const add=(i,j,step,weight)=>{
    if(i>0){
      matrix[i-1][i-1]+=weight;
      if(j>0)matrix[i-1][j-1]-=weight;
      for(let d=0;d<2;d++)matrix[i-1][n+d]-=weight*step[d];
    }
    if(j>0){
      matrix[j-1][j-1]+=weight;
      if(i>0)matrix[j-1][i-1]-=weight;
      for(let d=0;d<2;d++)matrix[j-1][n+d]+=weight*step[d];
    }
  };
  measurements.forEach((step,i)=>add(i,i+1,step,1));
  if(loop && loop.weight>0 && loop.i!==loop.j)add(loop.i,loop.j,[0,0],loop.weight);
  for(let k=0;k<n;k++){
    for(let i=k+1;i<n;i++){
      const factor=matrix[i][k]/matrix[k][k];
      for(let j=k+1;j<n+2;j++)matrix[i][j]-=factor*matrix[k][j];
    }
  }
  const fit=integrate(measurements);
  for(let i=n-1;i>=0;i--)for(let d=0;d<2;d++){
    let total=matrix[i][n+d];
    for(let j=i+1;j<n;j++)total-=matrix[i][j]*fit[j+1][d];
    fit[i+1][d]=total/matrix[i][i];
  }
  return fit;
}
export const rmse=(route,truth)=>Math.sqrt(route.reduce((s,p,i)=>s+sqdist(p,truth[i]),0)/route.length);
