import * as Encoding from "./helpers/encoding.js";

/** @enum {number} */
const tileNames = {
  Empty: 0,
  Wall: 1,
  Collectable: 2,
  Rock: 3,
  Dirt: 4,
  Player: 5,
  Water: 6,
};

/**
 * @typedef GenericTile
 * @property {"Empty" | "Wall" | "Collectable" | "Dirt"} type
 * @property {boolean} justUpdated
 *
 * @typedef PlayerTile
 * @property {"Player"} type
 * @property {boolean} isAlive
 * @property {boolean} justUpdated
 *
 * @typedef {(
 *  "Up" |
 *  "Left" |
 *  "Down" |
 *  "Right" |
 *  "DownLeft" |
 *  "DownRight" |
 *  "None"
 * )} Direction
 *
 * @typedef RockTile
 * @property {"Rock"} type
 * @property {"Down" | "DownLeft" | "DownRight" | "None"} fallingDirection
 * @property {boolean} justUpdated
 *
 * @typedef {(
 *  "Down" |
 *  "Left" |
 *  "Right" |
 *  "Both"
 * )} FlowDirection
 *
 * @typedef WaterTile
 * @property {"Water"} type
 * @property {boolean} isSource
 * @property {FlowDirection} flowDirection
 * @property {boolean} justUpdated
 *
 * @typedef {GenericTile | PlayerTile | RockTile | WaterTile} Tile
 */

export class Board {
  /** @type {Tile} */
  static EMPTY_TILE = { type: "Empty", justUpdated: false };

  /** @type {Tile} */
  static WALL_TILE = { type: "Wall", justUpdated: false };

  /**
   * @param {number} width
   * @param {number} height
   * @param {Tile[]} [tiles]
   */
  constructor(width, height, tiles) {
    /** @type {number} */
    this.width = width;

    /** @type {number} */
    this.height = height;

    /** @type {Tile[]} */
    this.tiles = []

    if (tiles) {
      if (tiles.length !== width * height) {
        throw new Error("Invalid board");
      }

      this.tiles = tiles.map(tile => {
        if (tile.type === "Player") {
          return { ...tile, isAlive: true };
        }

        return tile;
      });
    } else {
      this.tiles = Array(width * height).fill(Board.EMPTY_TILE, 0);
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
      throw new Error(`Coordinate (${x}, ${y}) out of bounds`);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {Tile}
   */
  getTile(x, y) {
    if (this.isInBounds(x, y)) {
      return this.tiles[x + y * this.width];
    }

    return Board.WALL_TILE;
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {Tile} tile
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
    bits.push(...Encoding.encodeToBits(tileNames[tile.type], tileBits));
  }

  return Encoding.base64EncodeBits(bits);
}

/**
 * Creates a generic version of the given tile
 *
 * @param {Tile["type"]} type
 * @returns {Tile}
 */
export function createTile(type) {
  switch (type) {
    case "Empty":
    case "Wall":
    case "Collectable":
    case "Dirt":
      return { type, justUpdated: false };

    case "Player":
      return { type, isAlive: true, justUpdated: false };

    case "Rock":
      return { type, fallingDirection: "None", justUpdated: false };

    case "Water":
      return {
        type,
        isSource: true,
        flowDirection: "Both",
        justUpdated: false
      };
  }
}

/**
 * Creates a generic version of the given tile
 *
 * @param {number} tileValue
 * @returns {Tile}
 */
function createTileFromTileValue(tileValue) {
  for (const [type, value] of /** @type {[Tile["type"], number][]} */ (Object.entries(tileNames))) {
    if (value === tileValue) {
      return createTile(type);
    }
  }

  throw new Error("Unknown tile");
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

  return new Board(width, height, tiles.map(createTileFromTileValue));
}
