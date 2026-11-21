import {byId,canvasChart,sqdist} from '../lab-utils.mjs';
import {route,integrate,optimize,rmse} from './model.mjs';

let screen=[], first=true;
const mkOptions=(select,max)=> {
  const previous=select.value;
  select.replaceChildren(...Array.from({length:max+1},(_,i)=>new Option('第 '+i+' 帧',i)));
  select.value=Math.min(Number(previous)||0,max);
};
function draw(truth,raw,optimized,loop){
  const c=canvasChart('graph',660,430);
  const all=[...truth,...raw,...optimized];
  const minX=Math.min(-3.5,...all.map(p=>p[0])),maxX=Math.max(4,...all.map(p=>p[0]));
  const minY=Math.min(-.3,...all.map(p=>p[1])),maxY=Math.max(5.8,...all.map(p=>p[1]));
  const scale=Math.min(570/(maxX-minX),342/(maxY-minY));
  const p=([x,y])=>[330+scale*(x-(minX+maxX)/2),202-scale*(y-(minY+maxY)/2)];
  function path(points,color,width,dash=[]){
    c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);
    points.forEach((point,i)=>{const [x,y]=p(point);if(i)c.lineTo(x,y);else c.moveTo(x,y);});
    c.stroke();c.setLineDash([]);
  }
  raw.forEach((point,i)=>path([point,optimized[i]],'#c3aaa0',1,[3,2]));
  path(truth,'#597069',2,[5,4]);
  path(raw,'#ae4b30',2.2);
  path(optimized,'#116959',2.4);
  if(loop)path([optimized[loop.i],optimized[loop.j]],'#793991',3,[6,3]);
  screen=raw.map(p);
  screen.forEach(([x,y],i)=>{
    c.fillStyle=loop && [loop.i,loop.j].includes(i)?'#793991':'#ae4b30';
    c.beginPath();c.arc(x,y,loop&&[loop.i,loop.j].includes(i)?7:4,0,2*Math.PI);c.fill();
    if(i%4===0||i===raw.length-1||loop&&[loop.i,loop.j].includes(i)){
      c.fillStyle='#334b44';c.fillText(i,x+6,y-6);
    }
  });
  c.fillStyle='#3a514c';c.fillText('坐标单位为米 · X 向右，Y 向上',21,407);
}
function render(){
  const {truth,measurements}=route(Number(byId('seed').value));
  const n=Number(byId('frames').value), edges=measurements.slice(0,n);
  const actual=truth.slice(0,n+1);
  const i=Number(byId('node-a').value),j=Number(byId('node-b').value),weight=Number(byId('weight').value);
  const loop=byId('loop-enabled').checked && i!==j ? {i,j,weight} : null;
  const raw=integrate(edges), optimized=optimize(edges,loop);
  byId('frame-value').textContent=n;
  byId('weight-value').textContent=weight;
  byId('graph-score').textContent='优化前 RMSE '+rmse(raw,actual).toFixed(2)+' m · 优化后 '+rmse(optimized,actual).toFixed(2)+' m'+
    (loop?' · 两帧真实距离 '+Math.sqrt(sqdist(actual[i],actual[j])).toFixed(2)+' m':' · 暂无回环约束');
  draw(actual,raw,optimized,loop);
}
function updateFrames(){
  const n=Number(byId('frames').value);
  for(const id of ['node-a','node-b'])mkOptions(byId(id),n);
  render();
}
function preset(correct){
  byId('frames').value=28;updateFrames();
  byId('node-a').value=0;
  byId('node-b').value=correct?28:14;
  byId('loop-enabled').checked=true;
  first=true;render();
}
byId('correct').onclick=()=>preset(true);
byId('wrong').onclick=()=>preset(false);
byId('none').onclick=()=>{byId('loop-enabled').checked=false;render();};
byId('frames').oninput=updateFrames;
for(const id of ['seed','node-a','node-b','weight','loop-enabled'])byId(id).oninput=render;
byId('graph').onclick=event=>{
  const box=event.target.getBoundingClientRect(), pointer=[(event.clientX-box.left)*660/box.width,(event.clientY-box.top)*430/box.height];
  let match=-1,distance=625;
  screen.forEach((p,i)=>{const d=sqdist(p,pointer);if(d<distance){distance=d;match=i;}});
  if(match<0)return;
  byId(first?'node-a':'node-b').value=match;
  if(!first)byId('loop-enabled').checked=true;
  first=!first;
  byId('pick-note').textContent=first?'接下来选第一个节点。':'接下来选第二个节点。';
  render();
};
updateFrames();
byId('node-b').value=28;
render();
