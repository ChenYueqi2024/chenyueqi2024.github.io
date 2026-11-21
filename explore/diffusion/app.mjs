import {byId,canvasChart,ratio} from '../lab-utils.mjs';
import {samples,forward,reverse,centers,conditions,horizon,summarize} from './model.mjs';

let source, history, timer=null;
const modeColors=['#2e54a6','#0d785d','#bb5328','#87519b'];
function draw(id,points,target,marks){
  const c=canvasChart(id,520,350);
  const pos=([x,y])=>[260+42*x,175-42*y];
  c.strokeStyle='#c4d7cf';c.beginPath();c.moveTo(50,175);c.lineTo(470,175);c.moveTo(260,20);c.lineTo(260,330);c.stroke();
  for(const [i,center] of centers.entries()){
    const [x,y]=pos(center);
    c.strokeStyle=conditions[target].includes(i)?modeColors[i]:'#a5b6af';
    c.beginPath();c.arc(x,y,46,0,Math.PI*2);c.stroke();
    c.fillStyle='#253833';c.fillText(String(i+1),x+35,y-33);
  }
  for(const [i,point] of points.entries()){
    const [x,y]=pos(point);
    c.fillStyle=marks?modeColors[i%4]+'c0':'#185942aa';
    c.beginPath();c.arc(x,y,3,0,2*Math.PI);c.fill();
  }
}
function render(){
  const pct=Number(byId('timeline').value), steps=history.length-1;
  const step=Math.min(steps,Math.floor((100-pct)*steps/100));
  const target=byId('condition').value;
  draw('forward',forward(source,pct*horizon/100),target,true);
  draw('reverse',history[step],target,false);
  byId('time-value').textContent=(pct*horizon/100).toFixed(2);
  byId('step-value').textContent=step+' / '+steps;
  const {hits,counts,missed,effectiveModes}=summarize(history.at(-1),target);
  byId('distribution').textContent='最终目标命中 '+ratio(hits,source.start.length)+
    ' · 四区计数 '+counts.join(' / ')+' · 区外 '+missed+' · 有效区域数 '+effectiveModes.toFixed(2);
}
function stop(){
  if(timer!==null)clearInterval(timer);
  timer=null;byId('play').textContent='播放反向去噪';
}
function rebuild(){
  stop();
  source=samples(Number(byId('seed').value));
  const guidance=Number(byId('guidance').value);
  byId('guidance-value').textContent=guidance.toFixed(1);
  history=reverse(source.start,Number(byId('steps').value),byId('condition').value,guidance);
  render();
}
for(const id of ['seed','steps','condition','guidance']) byId(id).addEventListener('input',rebuild);
byId('timeline').oninput=()=>{stop();render();};
byId('play').onclick=()=>{
  if(timer!==null){stop();return;}
  byId('timeline').value=100;render();
  byId('play').textContent='暂停';
  timer=setInterval(()=>{
    const value=Math.max(0,Number(byId('timeline').value)-2);
    byId('timeline').value=value;render();
    if(value===0)stop();
  },40);
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
rebuild();
