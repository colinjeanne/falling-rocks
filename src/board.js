import * as Encoding from "./helpers/encoding.js";

/** @enum {number} */
export const tileNames = {
  EMPTY: 0,
  WALL: 1,
  COLLECTABLE: 2,
  ROCK: 3,
  DIRT: 4,
  PLAYER: 5,
  DEAD_PLAYER: 6,
};

export class Board {
  /**
   * @param {number} width
   * @param {number} height
   * @param {tileNames[]} tiles
   */
  constructor(width, height, tiles) {
    /** @type {number} */
    this.width = width;

    /** @type {number} */
    this.height = height;

    if (tiles) {
      if (tiles.length !== width * height) {
        throw new Error("Invalid board");
      }

      this.tiles = tiles;
    } else {
      this.tiles = Array(width * height).fill(tileNames.EMPTY, 0);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  #validateCoordinate(x, y) {
    if (!this.isInBounds(x, y)) {
      throw new Error("Coordinate out of bounds");
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  getTile(x, y) {
    this.#validateCoordinate(x, y);
    return this.tiles[x + y * this.width];
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {tileNames} tile
   */
  setTile(x, y, tile) {
    this.#validateCoordinate(x, y);
    this.tiles[x + y * this.width] = tile;
  }

  clone() {
    return new Board(this.width, this.height, this.tiles.slice());
  }
}

const tileBits = Math.ceil(Math.log2(Object.values(tileNames).length));
const runLengthBits = 7;
const maxRunLength = 1 << runLengthBits;

/**
 * Encodes a board as a Base-64 string
 *
 * @param {Board} board
 */
export function base64EncodeBoard(board) {
  const bits = [
    ...Encoding.encodeToBits(board.width, 6),
    ...Encoding.encodeToBits(board.height, 6),
  ];

  const rleEncodedTiles = Encoding.encodeRle(board.tiles, maxRunLength);
  for (const [runLength, tile] of rleEncodedTiles) {
    bits.push(...Encoding.encodeToBits(runLength, runLengthBits));
    bits.push(...Encoding.encodeToBits(tile, tileBits));
  }

  return Encoding.base64EncodeBits(bits);
}

/**
 * Decodes a Base-64 string as a board
 *
 * @param {string} encoded
 */
export function base64DecodeBoard(encoded) {
  const bits = Encoding.decodeBase64ToBits(encoded);

  const width = Encoding.readBits(bits, 0, 6);
  const height = Encoding.readBits(bits, 6, 6);
  if (width === 0 || height === 0) {
    throw new Error("Invalid board");
  }

  /** @type {[number, number][]} */
  const rleEncodedTiles = [];
  let currentBit = 12;
  while (currentBit + runLengthBits + tileBits <= bits.length) {
    const runLength = Encoding.readBits(bits, currentBit, runLengthBits);
    if (runLength === 0) {
      throw new Error("Invalid board");
    }

    const tile = Encoding.readBits(bits, currentBit + runLengthBits, tileBits);
    if (!Object.values(tileNames).includes(tile)) {
      throw new Error("Invalid board");
    }

    rleEncodedTiles.push([runLength, tile]);

    currentBit += (runLengthBits + tileBits);
  }

  const tiles = Encoding.decodeRle(rleEncodedTiles);
  if (tiles.length !== width * height) {
    throw new Error("Invalid board");
  }

  return new Board(width, height, tiles);
}
