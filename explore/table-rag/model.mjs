export const entries = [
  {id:'scope',name:'正文 §2 · 口径',text:'设备经费指已支付的仪器设备款，不含耗材。比较时使用定稿，不用预算草案。'},
  {id:'header',name:'表 1 · 表头',text:'四列依次为年份、设备实付、耗材实付、设备原预算。'},
  {id:'old',name:'表 1 · 2024 行',text:'2024 | 80 | 20 | 90',equipment:80,consumables:20},
  {id:'new',name:'表 1 · 2025 行',text:'2025 | 100 | 35 | 112',equipment:100,consumables:35},
  {id:'unit',name:'表 1 · 脚注',text:'表 1 全部金额以万元计。',moneyScale:10000},
  {id:'draft',name:'表 2 · 草案',text:'2025 年设备预算草案为 112 万元。草案是计划额，发布后以表 1 为准。'}
];
export const questions = {
  growth:{text:'2025 年设备实付比 2024 年增长了百分之多少？', needed:['scope','header','old','new']},
  difference:{text:'2025 年设备实付比 2024 年多了多少元？', needed:['scope','header','old','new','unit']},
  total:{text:'2025 年设备和耗材实付一共是多少元？', needed:['scope','header','new','unit']}
};

export function answer(topic, evidence) {
  const included = new Map(evidence.map(item=>[item.id,item]));
  const needed = questions[topic].needed;
  const missing = needed.filter(id=>!included.has(id));
  if (missing.length) return {missing};
  const current = included.get('new'), previous = included.get('old');
  if (topic==='growth') return {value:100*(current.equipment-previous.equipment)/previous.equipment,
    unit:'%', equation:'('+current.equipment+' − '+previous.equipment+') ÷ '+previous.equipment+' × 100%', cited:needed};
  const scale = included.get('unit').moneyScale;
  if (topic==='difference') return {value:(current.equipment-previous.equipment)*scale,unit:' 元',
    equation:'('+current.equipment+' − '+previous.equipment+') × '+scale,cited:needed};
  return {value:(current.equipment+current.consumables)*scale,unit:' 元',
    equation:'('+current.equipment+' + '+current.consumables+') × '+scale,cited:needed};
}

// A transparent Boolean first stage so readers can audit why individual snippets ranked.
export function retrieve(query) {
  const terms = query==='total' ? ['2025','设备','耗材','实付','万元'] : ['设备','2025','2024','实付','万元'];
  return entries.map(entry=>({...entry,hits:terms.filter(term=>(entry.name+entry.text).includes(term))}))
    .sort((a,b)=>b.hits.length-a.hits.length);
}
