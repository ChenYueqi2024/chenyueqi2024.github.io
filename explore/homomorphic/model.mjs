export const modulus = 7919n;
export const limit = modulus / 2n;

const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
const absolute = value => value < 0n ? -value : value;

export function toyCircuit({a, b, noise, gate, depth}) {
  const liftA = 2n * BigInt(noise) + BigInt(a);
  const liftB = 2n * BigInt(noise) + BigInt(b);
  const aCipher = 17n * modulus + liftA;
  const bCipher = 29n * modulus + liftB;
  let lifted = gate === 'product' ? liftA * liftB : liftA + liftB;
  let result = gate === 'product' ? aCipher * bCipher : aCipher + bCipher;
  const expected = Number(mod(gate === 'product' ? BigInt(a * b) : BigInt(a + b), 2n));
  const steps = [{label: gate === 'product' ? '乘法' : '加法', magnitude: absolute(lifted)}];
  if (gate === 'deep') {
    for (let i = 1; i <= depth; i++) {
      result *= result;
      lifted *= lifted;
      steps.push({label: '第 ' + i + ' 次平方', magnitude: absolute(lifted)});
    }
  }
  let centered = mod(result, modulus);
  if (centered > limit) centered -= modulus;
  return {aCipher, bCipher, result, expected, centered, bit: Number(mod(centered, 2n)), steps};
}

