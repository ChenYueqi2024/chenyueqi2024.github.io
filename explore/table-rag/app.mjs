import {byId} from '../lab-utils.mjs';
import {entries, questions, retrieve, answer} from './model.mjs';
const selected = new Set(entries.map(entry=>entry.id));

function render() {
  const query=byId('problem').value, count=Number(byId('pool').value);
  const ranked=retrieve(query);
  const available=ranked.slice(0,count).filter(entry=>selected.has(entry.id));
  const result=answer(query,available);
  byId('query-text').textContent=questions[query].text;
  byId('pool-value').textContent=count;
  for(const cell of document.querySelectorAll('[data-evidence]')){
    cell.dataset.hidden=String(!available.some(entry=>entry.id===cell.dataset.evidence));
  }
  const format=id=>entries.find(e=>e.id===id).name;
  byId('result').textContent=result.missing?'证据不足。还需要 '+result.missing.map(format).join('、')+'。':
    '答案 '+result.value.toLocaleString('zh-CN',{maximumFractionDigits:2})+result.unit+'。';
  byId('calculation').textContent=result.missing?'':result.equation+' = '+result.value.toLocaleString('zh-CN')+result.unit;
  const citations=(result.cited??[]).map(id=>{
    const a=document.createElement('a');a.href='#evidence-'+id;a.textContent='['+format(id)+']';return a;
  });
  byId('sources').replaceChildren(...citations.flatMap((a,i)=>i?[' ',a]:[a]));
  byId('candidates').replaceChildren(...ranked.map((entry,i)=>{
    const tr=document.createElement('tr'), th=document.createElement('th');
    th.scope='row';th.id='evidence-'+entry.id;
    th.textContent=(i+1)+'. '+entry.name;
    tr.append(th);
    tr.insertCell().textContent=entry.hits.join('、')||'无';
    tr.insertCell().textContent=entry.text;
    const td=tr.insertCell(), cb=document.createElement('input');
    cb.type='checkbox';cb.checked=selected.has(entry.id);cb.disabled=i>=count;
    cb.setAttribute('aria-label','保留'+entry.name);
    cb.onchange=()=>{
      if(cb.checked) selected.add(entry.id); else selected.delete(entry.id);
      render();
      document.getElementById(th.id)?.parentElement.querySelector('input').focus({preventScroll:true});
    };
    td.append(cb, i>=count?' 超出 K':available.some(a=>a.id===entry.id)?' 保留':' 移除');
    return tr;
  }));
}
byId('problem').addEventListener('change',render);
byId('pool').addEventListener('input',render);
byId('restore').onclick=()=>{for(const entry of entries)selected.add(entry.id);byId('pool').value=6;render();};
render();
