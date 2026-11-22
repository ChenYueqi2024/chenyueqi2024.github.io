import test from 'node:test';
import assert from 'node:assert/strict';
import {symmetric,hybrid,hashPair,sign,flip,hex} from './crypto/model.mjs';
import {simulate} from './ai-security/policy.mjs';

test('AES-GCM uses separate IVs and rejects a changed ciphertext',async()=>{
  const output=await symmetric('试验');
  assert.notDeepEqual(output.iv,output.second.iv);
  assert.notDeepEqual(output.cipher,output.second.cipher);
  assert.equal(output.cipher.length,output.bytes+16);
  assert.equal(new TextDecoder().decode(await output.open(output.cipher)),'试验');
  await assert.rejects(output.open(flip(output.cipher)),{name:'OperationError'});
});

test('RSA-OAEP transports the short AES key and rejects altered packets',async()=>{
  const output=await hybrid('封装');
  assert.equal(output.wrapped.length,256);
  assert.equal(new TextDecoder().decode(await output.open(output.cipher)),'封装');
  await assert.rejects(output.open(output.cipher,flip(output.wrapped)),{name:'OperationError'});
});

test('SHA-256 returns the known digest and ECDSA binds the original message',async()=>{
  const output=await hashPair('abc');
  assert.equal(hex(output.original),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.ok(output.changedBits>0&&output.changedBits<256);
  const signed=await sign('证据');
  assert.equal(await signed.verify('证据'),true);
  assert.equal(await signed.verify('证据!'),false);
});

test('retrieval ACL blocks internal documents early, and downstream rejection cannot undo exposure',()=>{
  const options={scenario:'private',role:'reader',verifiedOnly:true,confirmation:false};
  const protectedResult=simulate({...options,filter:true});
  const exposed=simulate({...options,filter:false});
  assert.ok(!protectedResult.leaked && exposed.leaked);
  assert.ok(!exposed.citations.some(item=>item.level==='internal'));
  assert.match(exposed.verdict,/拒绝/);
});

test('untrusted proposals and user approval cannot bypass scope or role',()=>{
  const base={role:'lead',filter:true,verifiedOnly:false,confirmation:true};
  assert.match(simulate({...base,scenario:'untrusted'}).verdict,/资料里的建议超出/);
  assert.match(simulate({...base,scenario:'approved',role:'reader'}).verdict,/拒绝/);
  assert.match(simulate({...base,scenario:'approved',confirmation:false}).verdict,/待用户确认/);
  assert.match(simulate({...base,scenario:'approved'}).verdict,/模拟允许/);
});
