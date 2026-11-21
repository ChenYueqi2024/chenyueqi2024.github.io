import {random,sqdist} from '../lab-utils.mjs';

export function patches(seed) {
  const rng=random(seed), width=12;
  return Array.from({length:60},(_,i)=>{
    const family=i%4, angle=family*Math.PI/4+.35*(rng()-.5);
    const hue=rng(), spacing=2+2.2*rng(), phase=6.3*rng(), tint=.35+.25*rng();
    const image=Array.from({length:144},(_,j)=>{
      const x=j%width,y=Math.floor(j/width);
      const signal=.18*Math.sin((x*Math.cos(angle)+y*Math.sin(angle))*Math.PI/spacing+phase);
      return [tint+signal+.23*hue,tint+signal,tint+signal+.23*(1-hue)];
    });
    const mean=[0,1,2].map(c=>image.reduce((sum,p)=>sum+p[c],0)/image.length);
    const gradient=[0,0,0], quadrants=[0,0,0,0];
    for(let y=0;y<11;y++) for(let x=0;x<11;x++){
      const j=y*12+x, dx=image[j+1][1]-image[j][1],dy=image[j+12][1]-image[j][1];
      gradient[0]+=dx*dx;gradient[1]+=dy*dy;gradient[2]+=dx*dy;
      quadrants[(x<6?0:1)+(y<6?0:2)]+=image[j][1]/121;
    }
    const vector=[...mean,...gradient.map(v=>Math.sign(v)*Math.sqrt(Math.abs(v)/121)*2),...quadrants];
    return {id:i,family,image,vector};
  });
}

export function standardized(rows) {
  const m=rows[0].length;
  const centers=Array.from({length:m},(_,j)=>rows.reduce((s,a)=>s+a[j],0)/rows.length);
  const scales=centers.map((v,j)=>Math.sqrt(rows.reduce((s,a)=>s+(a[j]-v)**2,0)/rows.length) || 1);
  return rows.map(a=>a.map((x,i)=>(x-centers[i])/scales[i]));
}
const dot = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0);
export function pca(rows) {
  const size=rows[0].length, components=[], rng=random(57);
  for(let component=0;component<2;component++){
    let v=Array.from({length:size},()=>rng()-.5);
    for(let step=0;step<90;step++){
      const next=new Array(size).fill(0);
      for(const row of rows){
        const coefficient=dot(row,v);
        for(let i=0;i<size;i++) next[i]+=row[i]*coefficient;
      }
      for(const axis of components){
        const projection=dot(next,axis);
        for(let i=0;i<size;i++) next[i]-=projection*axis[i];
      }
      const norm=Math.hypot(...next) || 1;
      v=next.map(x=>x/norm);
    }
    components.push(v);
  }
  return rows.map(row=>components.map(axis=>dot(row,axis)));
}

export function tsne(rows,perplexity,seed) {
  const n=rows.length, rng=random(seed);
  const distances=rows.map(a=>rows.map(b=>sqdist(a,b)));
  const conditional=distances.map((row,i)=>{
    let low=0, high=Infinity, beta=1, weights;
    const entropy=Math.log(perplexity);
    const offset=Math.min(...row.filter((_,j)=>i!==j));
    for(let step=0;step<30;step++){
      weights=row.map((d,j)=>i===j?0:Math.exp(-(d-offset)*beta));
      const total=weights.reduce((a,b)=>a+b,0);
      weights=weights.map(w=>w/total);
      const h=-weights.reduce((sum,p)=>sum+(p>0?p*Math.log(p):0),0);
      if(h>entropy){low=beta;beta=Number.isFinite(high)?(beta+high)/2:beta*2;}
      else{high=beta;beta=(beta+low)/2;}
    }
    return weights;
  });
  const probabilities=conditional.map((row,i)=>row.map((p,j)=>(p+conditional[j][i])/(2*n)));
  const positions=rows.map(()=>[.02*(rng()-.5),.02*(rng()-.5)]);
  const velocity=positions.map(()=>[0,0]);
  const q=positions.map(()=>new Float64Array(n));
  for(let iter=0;iter<380;iter++){
    let total=0;
    for(let i=0;i<n;i++) for(let j=0;j<i;j++){
      q[i][j]=q[j][i]=1/(1+sqdist(positions[i],positions[j]));
      total+=2*q[i][j];
    }
    const gain=iter<80?4:1;
    for(let i=0;i<n;i++){
      let dx=0,dy=0;
      for(let j=0;j<n;j++){
        if(i===j) continue;
        const scale=4*(gain*probabilities[i][j]-q[i][j]/total)*q[i][j];
        dx+=scale*(positions[i][0]-positions[j][0]);
        dy+=scale*(positions[i][1]-positions[j][1]);
      }
      velocity[i][0]=.68*velocity[i][0]-38*dx;
      velocity[i][1]=.68*velocity[i][1]-38*dy;
    }
    positions.forEach((p,i)=>{p[0]+=velocity[i][0];p[1]+=velocity[i][1];});
  }
  return positions;
}

export function nearest(points,index,k) {
  return points.map((point,id)=>({id,d:sqdist(points[index],point)}))
    .filter(row=>row.id!==index)
    .sort((a,b)=>a.d-b.d || a.id-b.id).slice(0,k).map(row=>row.id);
}
