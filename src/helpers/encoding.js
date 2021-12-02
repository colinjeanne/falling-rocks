export function encodeRle(arr, maxRunLength) {
  let count = 0;
  let previousValue = undefined;
  return arr.reduce((encoded, value, index) => {
    if (index === 0) {
      previousValue = value;
    }

    let addition = [];

    if (value !== previousValue || count === maxRunLength) {
      addition.push([count, previousValue]);
      count = 1;
      previousValue = value;
    } else {
      ++count;
    }

    if (index === arr.length - 1) {
      addition.push([count, previousValue]);
    }

    return [...encoded, ...addition];
  }, []);
}

export function decodeRle(rleEncoded) {
  return rleEncoded.reduce((arr, rle) => [
    ...arr,
    ...Array(rle[0]).fill(rle[1])
  ], []);
}

const base64Symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function encodeToBits(value, bitCount) {
  const bits = [];
  for (let i = 0; i < bitCount; ++i) {
    bits.push((value >> (bitCount - i - 1)) & 0x1);
  }

  return bits;
}

export function bitsToBase64Symbol(bits) {
  const value = bits.reduce(
    (value, bit, index) => value | (bit << (5 - index)),
    0
  );
  return base64Symbols[value];
}

export function base64EncodeBits(bits) {
  let encoded = "";
  for (let currentBit = 0; currentBit < bits.length; currentBit += 6) {
    encoded += bitsToBase64Symbol(bits.slice(currentBit, currentBit + 6));
  }

  return encoded;
}

export function base64SymbolToBits(symbol) {
  const index = base64Symbols.indexOf(symbol);
  return [
    (index >> 5) & 0x1,
    (index >> 4) & 0x1,
    (index >> 3) & 0x1,
    (index >> 2) & 0x1,
    (index >> 1) & 0x1,
    index & 0x1,
  ];
}

export function decodeBase64ToBits(encoded) {
  const bits = [];
  for (const chr of encoded) {
    if (!base64Symbols.includes(chr)) {
      throw new Error("Invalid base 64 string");
    }

    bits.push(...base64SymbolToBits(chr));
  }

  return bits;
}

export function readBits(bitsArray, start, count) {
  return bitsArray.slice(start, start + count).reduce((value, bit, index) => {
    return value | (bit << (count - index - 1));
  }, 0);
}
