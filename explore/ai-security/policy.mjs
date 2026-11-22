export const scenarios = {
  public:{label:'询问公开规定',query:'现行借期是多少？',docs:['handbook'],request:{action:'read',resource:'public'}},
  private:{label:'索取内部维护记录',query:'查阅内部维护记录。',docs:['maintenance','handbook'],request:{action:'read',resource:'internal'}},
  untrusted:{label:'网页附带操作建议',query:'只帮我总结这份网页。',docs:['web','handbook'],request:{action:'read',resource:'public'},suggestion:{action:'share',resource:'internal'}},
  approved:{label:'申请分享公开摘要',query:'请准备对外分享这份公开摘要。',docs:['handbook'],request:{action:'share',resource:'public'}}
};
export const library = {
  handbook:{name:'公开借用手册',level:'public',source:'已登记手册',verified:true,text:'虚构资料：便携仪器可借七天。'},
  maintenance:{name:'内部维护记录',level:'internal',source:'内部资料库',verified:true,text:'仅显示虚构记录的权限标签。'},
  web:{name:'站外便签',level:'public',source:'外部网页',verified:false,text:'此虚构页面附带一条操作建议。'},
};
export const roleCanRead=(role,level)=>level==='public'||['staff','lead'].includes(role)&&level==='internal';

export function simulate({scenario,role,filter,verifiedOnly,confirmation}){
  const {docs,request,suggestion}=scenarios[scenario];
  const candidates=docs.map(id=>{
    const doc=library[id], permitted=roleCanRead(role,doc.level);
    return {id,...doc,permitted,inContext:permitted||!filter};
  });
  const context=candidates.filter(doc=>doc.inContext);
  const citations=context.filter(doc=>doc.permitted&&(!verifiedOnly||doc.verified));
  let result;
  if(request.resource==='internal'&&!roleCanRead(role,'internal')){
    result='没有查看内部资料的权限。';
  }else if(request.resource==='internal'){
    result=citations.some(d=>d.level==='internal')?'通过权限检查，可引用已登记的内部记录。':'缺少可引用的内部记录。';
  }else if(scenario==='untrusted'){
    result=verifiedOnly?'可核对公开手册。站外操作建议留在资料层。':'备选答案可能把外部网页当成依据。需要核验这项来源。';
  }else{
    result=citations.some(d=>d.id==='handbook')?'公开手册支持「便携仪器可借七天」。':'证据不足。';
  }

  const proposal=suggestion&&!verifiedOnly?suggestion:request;
  let verdict;
  if(proposal.action!==request.action||proposal.resource!==request.resource){
    verdict='拒绝。资料里的建议超出了用户授权。';
  }else if(!roleCanRead(role,proposal.resource)){
    verdict='拒绝。当前角色无权操作该资源。';
  }else if(proposal.action==='share'&&(role!=='lead'||proposal.resource!=='public')){
    verdict='拒绝。只有负责人可申请对外分享公开摘要。';
  }else if(proposal.action==='share'&&!confirmation){
    verdict='待用户确认。确认后才可进入模拟执行。';
  }else{
    verdict=proposal.action==='share'?'模拟允许分享公开摘要。':'模拟允许读取已获授权的资料。';
  }
  return {candidates,context,citations,result,proposal,verdict,leaked:context.some(doc=>!doc.permitted)};
}
