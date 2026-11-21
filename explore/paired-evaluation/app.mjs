import {byId,ratio,canvasChart} from '../lab-utils.mjs';
import {scenes,bootstrap,interval} from './model.mjs';

const points=value=>(value>=0?'+':'−')+Math.abs(value*100).toFixed(1);
function chart(result){
  const c=canvasChart('sampling-chart',660,310);
  const samples=[result.byFrame,result.byClip], inks=['#2857a4','#af4c29'];
  const limit=Math.max(.12,...samples.flat().map(Math.abs));
  const x=value=>46+(value+limit)/(2*limit)*570;
  const bins=31;
  const counts=samples.map(values=>{
    const tally=new Array(bins).fill(0);
    for(const value of values)tally[Math.min(bins-1,Math.floor((value+limit)/(limit*2)*bins))]++;
    return tally;
  });
  const max=Math.max(...counts.flat());
  c.strokeStyle='#526d62';c.setLineDash([5,4]);c.beginPath();c.moveTo(x(0),20);c.lineTo(x(0),254);c.stroke();c.setLineDash([]);
  for(const [index,tally] of counts.entries()){
    c.fillStyle=inks[index]+'85';
    tally.forEach((n,i)=>c.fillRect(46+i*570/bins,252-n/max*222,570/bins-1,n/max*222));
  }
  c.fillStyle='#223b34';c.textAlign='center';
  for(const mark of [-limit,-limit/2,0,limit/2,limit])c.fillText(points(mark),x(mark),273);
  c.fillText('B − A（百分点）',331,299);
}
function run(){
  const groups=Number(byId('clips').value), repeats=Number(byId('repeats').value), seed=Number(byId('seed').value);
  const result=bootstrap(scenes(groups,repeats,seed),seed+301);
  byId('repeat-value').textContent=repeats;
  byId('aggregate').textContent='A '+ratio(result.a,1)+' · B '+ratio(result.b,1)+' · 差值 '+points(result.b-result.a)+
    ' 个百分点 · '+groups+' 个独立片段、'+result.count+' 条帧记录。';
  const show=id=>interval(result[id]).map(points).join(' 至 ')+' 个百分点';
  byId('per-frame').textContent=show('byFrame');
  byId('per-clip').textContent=show('byClip');
  byId('clip-list').textContent=result.clipMeans.map((d,i)=>'片段 '+(i+1)+'：'+points(d)).join('　');
  chart(result);
}
for(const id of ['clips','repeats','seed'])byId(id).addEventListener('input',run);
run();
