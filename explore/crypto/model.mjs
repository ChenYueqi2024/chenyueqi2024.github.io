const encode=value=>new TextEncoder().encode(value);
const randomBytes=size=>crypto.getRandomValues(new Uint8Array(size));
const subtle=()=>crypto.subtle;
const aesKey=()=>subtle().generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
const gcm=iv=>({name:'AES-GCM',iv,tagLength:128});
const rsa={name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'};
const curve={name:'ECDSA',namedCurve:'P-256'};
const ecdsa={name:'ECDSA',hash:'SHA-256'};

export function hex(bytes){return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');}
export const bytes=data=>new Uint8Array(data);
export function flip(source){
  const data=source.slice();
  data[0]^=1;
  return data;
}

export async function symmetric(message){
  const key=await aesKey();
  const plain=encode(message);
  const seal=async()=>{
    const iv=randomBytes(12), cipher=bytes(await subtle().encrypt(gcm(iv),key,plain));
    return {iv,cipher,open:data=>subtle().decrypt(gcm(iv),key,data)};
  };
  const first=await seal();
  return {...first,second:await seal(),bytes:plain.length};
}

export async function hybrid(message){
  const pair=await subtle().generateKey(rsa,false,['encrypt','decrypt']);
  const transport=randomBytes(32);
  let key,wrapped;
  try{
    key=await subtle().importKey('raw',transport,'AES-GCM',false,['encrypt']);
    wrapped=bytes(await subtle().encrypt({name:rsa.name},pair.publicKey,transport));
  }finally{transport.fill(0);}
  const plain=encode(message),iv=randomBytes(12);
  const cipher=bytes(await subtle().encrypt(gcm(iv),key,plain));
  async function open(data,keyPacket=wrapped){
    const recovered=bytes(await subtle().decrypt({name:rsa.name},pair.privateKey,keyPacket));
    try{
      const decryptKey=await subtle().importKey('raw',recovered,'AES-GCM',false,['decrypt']);
      return await subtle().decrypt(gcm(iv),decryptKey,data);
    }finally{recovered.fill(0);}
  }
  return {iv,cipher,wrapped,open,bytes:plain.length};
}

export async function hashPair(message){
  const [original,changed]=await Promise.all([message,message+'!'].map(async s=>bytes(await subtle().digest('SHA-256',encode(s)))));
  let changedBits=0;
  for(let i=0;i<original.length;i++){
    let value=original[i]^changed[i];
    while(value){changedBits+=value&1;value>>>=1;}
  }
  return {original,changed,changedBits};
}

export async function sign(message){
  const pair=await subtle().generateKey(curve,false,['sign','verify']);
  const signature=bytes(await subtle().sign(ecdsa,pair.privateKey,encode(message)));
  const verify=(tested,data=signature)=>subtle().verify(ecdsa,pair.publicKey,data,encode(tested));
  return {signature,verify};
}
