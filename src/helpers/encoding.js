/**
 * @typedef {(0 | 1)[]} BitArray
 */

/**
 * Performs a run-length encoding on the given array
 *
 * @template T
 * @param {T[]} arr
 * @param {number} maxRunLength
 */
export function encodeRle(arr, maxRunLength) {
  if (arr.length === 0) {
    return [];
  }

  let count = 0;

  let previousValue = arr[0];
  return arr.reduce((/** @type [number, T][] */ encoded, value, index) => {
    /** @type {[number, T][]} */
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

/**
 * Decodes a run-length encoded array into the full array
 *
 * @template T
 * @param {[number, T][]} rleEncoded
 */
export function decodeRle(rleEncoded) {
  return rleEncoded.reduce((/** @type T[] */ arr, rle) => [
    ...arr,
    ...Array(rle[0]).fill(rle[1])
  ], []);
}

const base64Symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Gets the bit at the given index
 *
 * @param {number} num
 * @param {number} bitIndex
 */
function getBit(num, bitIndex) {
  if (num >> bitIndex) {
    return 1;
  }

  return 0;
}

/**
 * Sets the bit at the given index to the given bit value
 *
 * @param {number} num
 * @param {number} bitIndex
 * @param {0 | 1} bit
 */
function setBit(num, bitIndex, bit) {
  return (num & ~(1 << bitIndex)) | (bit << bitIndex);
}

/**
 * Encodes a numeric value as an array of bits
 *
 * @param {number} value
 * @param {number} bitCount
 */
export function encodeToBits(value, bitCount) {
  /** @type {BitArray} */
  const bits = [];
  for (let i = 0; i < bitCount; ++i) {
    bits.push(getBit(value, bitCount - i - 1));
  }

  return bits;
}

/**
 * Encodes an array of no more than 6 bits to a Base-64 symbol
 *
 * @param {BitArray} bits
 */
export function bitsToBase64Symbol(bits) {
  const value = bits.reduce(
    (/** @type {number} */ value, bit, index) => setBit(value, 5 - index, bit),
    0
  );
  return base64Symbols[value];
}

/**
 * Encodes an array of bits to Base-64
 *
 * @param {BitArray} bits
 */
export function base64EncodeBits(bits) {
  let encoded = "";
  for (let currentBit = 0; currentBit < bits.length; currentBit += 6) {
    encoded += bitsToBase64Symbol(bits.slice(currentBit, currentBit + 6));
  }

  return encoded;
}

/**
 * Encodes a Base-64 symbol to an array of bits
 *
 * @param {string} symbol
 * @returns {BitArray}
 */
export function base64SymbolToBits(symbol) {
  const index = base64Symbols.indexOf(symbol);
  return [
    getBit(index, 5),
    getBit(index, 4),
    getBit(index, 3),
    getBit(index, 2),
    getBit(index, 1),
    getBit(index, 0),
  ];
}

/**
 * Decodes a Base-64 string to an array of bits
 *
 * @param {string} encoded
 */
export function decodeBase64ToBits(encoded) {
  /** @type {BitArray} */
  const bits = [];
  for (const chr of encoded) {
    if (!base64Symbols.includes(chr)) {
      throw new Error("Invalid base 64 string");
    }

    bits.push(...base64SymbolToBits(chr));
  }

  return bits;
}

/**
 * Reads a number of bits from a bit array as a numeric value
 *
 * @param {BitArray} bitsArray
 * @param {number} start
 * @param {number} count
 */
export function readBits(bitsArray, start, count) {
  return bitsArray.slice(start, start + count).reduce((/** @type {number} */ value, bit, index) => {
    return setBit(value, count - index - 1, bit);
  }, 0);
}
