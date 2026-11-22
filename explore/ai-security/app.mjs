import {byId} from '../lab-utils.mjs';
import {scenarios,simulate} from './policy.mjs';

const actions={read:'读取资料',share:'对外分享'};
const levels={public:'公开',internal:'内部'};
const scenario=byId('scenario');
for(const [id,item] of Object.entries(scenarios))scenario.add(new Option(item.label,id));

function render(){
  const current=scenario.value;
  const role=byId('role').value;
  const result=simulate({
    scenario:current,role,filter:byId('acl').checked,verifiedOnly:byId('verify').checked,
    confirmation:byId('confirm').checked
  });
  byId('query').textContent=scenarios[current].query;
  byId('sources').replaceChildren(...result.candidates.map(doc=>{
    const row=document.createElement('tr');
    for(const value of [doc.name,doc.source,levels[doc.level],doc.inContext?'进入上下文':'在检索层拦下']){
      row.insertCell().textContent=value;
    }
    return row;
  }));
  byId('context').textContent=result.leaked
    ? '出现权限边界失效：无权读取的资料已经进入上下文。末端拒答也无法撤销这次暴露。'
    : '进入上下文 '+result.context.length+' 条资料，其中 '+result.context.filter(doc=>doc.verified).length+' 条来自已登记来源。';
  byId('answer').textContent=result.result;
  byId('cited').textContent=result.citations.length?'可用出处 · '+result.citations.map(doc=>doc.name).join('、'):'当前没有可用出处。';
  byId('proposal').textContent=actions[result.proposal.action]+' · '+levels[result.proposal.resource]+'资料';
  byId('verdict').textContent=result.verdict;
  byId('confirm').disabled=current!=='approved';
}
for(const id of ['scenario','role'])byId(id).oninput=()=>{byId('confirm').checked=false;render();};
for(const id of ['acl','verify','confirm'])byId(id).oninput=render;
render();
