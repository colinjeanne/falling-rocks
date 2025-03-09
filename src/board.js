/**
 * @typedef {import("./tile.js").Tile} Tile
 *
 * @typedef {[number, number]} Point
 */

import { decodeTile, encodeTile } from "./tile.js";

export class Board {
  /** @type {Tile} */
  static EMPTY_TILE = {
    type: "Empty",
    justUpdated: false,
    conveyorDirection: "None",
    keyColor: "None",
  };

  /** @type {Tile} */
  static WALL_TILE = {
    type: "Wall",
    justUpdated: false,
    conveyorDirection: "None",
    keyColor: "None",
  };

  /**
   * @param {number} width
   * @param {number} height
   * @param {Tile[]} [tiles]
   */
  constructor(width, height, tiles) {
    if ((width < 1) || width !== Math.floor(width)) {
      throw new Error("Width must be a positive integer");
    }

    if ((height < 1) || (height !== Math.floor(height))) {
      throw new Error("Height must be a positive integer");
    }

    /** @type {number} */
    this.width = width;

    /** @type {number} */
    this.height = height;

    /** @type {Tile[]} */
    this.tiles = [];

    if (tiles) {
      if (tiles.length !== width * height) {
        throw new Error("Size does not match number of tiles");
      }

      this.tiles = tiles;
    } else {
      this.tiles = Array(width * height).fill(Board.EMPTY_TILE, 0);
    }
  }

  /**
   * @param {Point} pt
   */
  isInBounds(pt) {
    return pt[0] >= 0 &&
      pt[0] < this.width &&
      pt[1] >= 0 &&
      pt[1] < this.height;
  }

  /**
   * @param {Point} pt
   */
  #validateCoordinate(pt) {
    if (!this.isInBounds(pt)) {
      throw new Error(`Coordinate (${pt[0]}, ${pt[1]}) out of bounds`);
    }
  }

  /**
   * @param {Point} pt
   * @returns {Tile}
   */
  getTile(pt) {
    if (this.isInBounds(pt)) {
      return this.tiles[pt[0] + pt[1] * this.width];
    }

    return Board.WALL_TILE;
  }

  /**
   * @param {Point} pt
   * @param {Tile} tile
   */
  setTile(pt, tile) {
    this.#validateCoordinate(pt);
    this.tiles[pt[0] + pt[1] * this.width] = tile;
  }

  clone() {
    return new Board(this.width, this.height, this.tiles.slice());
  }
}

/**
 * Performs a run-length encoding on the given array
 *
 * @template T
 * @param {T[]} arr
 */
function encodeRle(arr) {
  if (arr.length === 0) {
    return [];
  }

  let count = 0;

  let previousValue = arr[0];
  return arr.reduce((/** @type [number, T][] */ encoded, value, index) => {
    /** @type {[number, T][]} */
    let addition = [];

    if (value !== previousValue) {
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
 * Encodes a board as a string
 *
 * @param {Board} board
 */
export function encodeBoard(board) {
  const tiles = board.tiles.map(encodeTile);
  const rle = encodeRle(tiles).
    map(([count, tile]) => `${count}${tile}`).join('');
  return `${board.width};${board.height};${rle}`;
}

/**
 * Decodes a number from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ value: number, nextIndex: number }}
 */
function decodeInteger(chars, index) {
  let value = 0;

  let nextIndex = index;
  for (
    ;
    nextIndex < chars.length && /\d/.test(chars[nextIndex]);
    ++nextIndex
  ) {
    value = (value * 10) + Number.parseInt(chars[nextIndex]);
  }

  if (nextIndex === index) {
    throw new Error(`Expected number at ${index}`);
  }

  return { value, nextIndex };
}

/**
 * Decodes an RLE encoded set of tiles from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ value: Tile[], nextIndex: number }}
 */
function decodeRleTiles(chars, index) {
  const tiles = [];
  let nextIndex = index;

  while (nextIndex < chars.length) {
    const count = decodeInteger(chars, nextIndex);
    const tile = decodeTile(chars, count.nextIndex);
    tiles.push(...Array(count.value).fill(tile.tile));

    nextIndex = tile.nextIndex;
  }

  return { value: tiles, nextIndex };
}

/**
 * Decodes a board
 *
 * @param {string} encoded
 */
export function decodeBoard(encoded) {
  const chars = [...encoded];

  const decodedWidth = decodeInteger(chars, 0);
  if (chars[decodedWidth.nextIndex] !== ";") {
    throw new Error(`Expected separator at ${decodedWidth.nextIndex}`);
  }

  const decodedHeight = decodeInteger(chars, decodedWidth.nextIndex + 1);
  if (chars[decodedHeight.nextIndex] !== ";") {
    throw new Error(`Expected separator at ${decodedHeight.nextIndex}`);
  }

  const decodedTiles = decodeRleTiles(chars, decodedHeight.nextIndex + 1);
  if (decodedTiles.nextIndex !== chars.length) {
    throw new Error(
      `Unexpected character ${chars[decodedTiles.nextIndex]} at ${decodedTiles.nextIndex}`
    );
  }

  return new Board(decodedWidth.value, decodedHeight.value, decodedTiles.value);
}
