/**
 * @typedef GenericTile
 * @property {"Empty" | "Wall" | "Collectable"} type
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
 * @property {FlowDirection | "All"} flowDirection
 * @property {boolean} justUpdated
 *
 * @typedef DirtTile
 * @property {"Dirt"} type
 * @property {FlowDirection | "None"} flowDirection
 * @property {boolean} justUpdated
 *
 * @typedef {DirtTile | GenericTile | PlayerTile | RockTile | WaterTile} Tile
 */

/**
 * Encodes a generic tile
 *
 * @param {GenericTile} tile
 * @returns {string}
 */
function encodeGenericTile(tile) {
  switch (tile.type) {
    case "Collectable":
      return "C";

    case "Empty":
      return " ";

    case "Wall":
      return "W";
  }
}

/**
 * Decodes a generic tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: GenericTile, nextIndex: number }}
 */
function decodeGenericTile(chars, index) {
  /** @type {GenericTile} */
  let tile;
  switch (chars[index]) {
    case "C":
      tile = { type: "Collectable", justUpdated: false };
      break;

    case "W":
      tile = { type: "Wall", justUpdated: false };
      break;

    case " ":
      tile = { type: "Empty", justUpdated: false };
      break;

    default:
      throw new Error(`Unexpected generic tile ${chars[index]} at ${index}`);
  }

  return { tile, nextIndex: index + 1 };
}

/**
 * Encodes a dirt tile
 *
 * @param {DirtTile} tile
 * @returns {string}
 */
function encodeDirtTile(tile) {
  switch (tile.flowDirection) {
    case "Both":
      return "D_";

    case "Down":
      return "Dv";

    case "Left":
      return "D<";

    case "None":
      return "D.";

    case "Right":
      return "D>";
  }
}

/**
 * Decodes a dirt tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: DirtTile, nextIndex: number }}
 */
function decodeDirtTile(chars, index) {
  const flowDirection = chars[index + 1];

  /** @type {DirtTile} */
  let tile;
  switch (flowDirection) {
    case "_":
      tile = { type: "Dirt", flowDirection: "Both", justUpdated: false };
      break;

    case "v":
      tile = { type: "Dirt", flowDirection: "Down", justUpdated: false };
      break;

    case "<":
      tile = { type: "Dirt", flowDirection: "Left", justUpdated: false };
      break;

    case ".":
      tile = { type: "Dirt", flowDirection: "None", justUpdated: false };
      break;

    case ">":
      tile = { type: "Dirt", flowDirection: "Right", justUpdated: false };
      break;

    default:
      throw new Error(
        `Unexpected flow direction ${flowDirection} at ${index + 1}`
      );
  }

  return { tile, nextIndex: index + 2 };
}

/**
 * Encodes a player tile
 *
 * @param {PlayerTile} tile
 * @returns {string}
 */
function encodePlayerTile(tile) {
  return tile.isAlive ? "Pa" : "Pd";
}

/**
 * Decodes a player tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: PlayerTile, nextIndex: number }}
 */
function decodePlayerTile(chars, index) {
  const status = chars[index + 1];

  /** @type {PlayerTile} */
  let tile;
  switch (status) {
    case "a":
      tile = { type: "Player", isAlive: true, justUpdated: false };
      break;

    case "d":
      tile = { type: "Player", isAlive: false, justUpdated: false };
      break;

    default:
      throw new Error(`Unexpected player status ${status} at ${index + 1}`);
  }

  return { tile, nextIndex: index + 2 };
}

/**
 * Encodes a rock tile
 *
 * @param {RockTile} tile
 * @returns {string}
 */
function encodeRockTile(tile) {
  switch (tile.fallingDirection) {
    case "Down":
      return "Rv";

    case "DownLeft":
      return "R<";

    case "DownRight":
      return "R>";

    case "None":
      return "R.";
  }
}

/**
 * Decodes a rock tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: RockTile, nextIndex: number }}
 */
function decodeRockTile(chars, index) {
  const fallingDirection = chars[index + 1];

  /** @type {RockTile} */
  let tile;
  switch (fallingDirection) {
    case "v":
      tile = { type: "Rock", fallingDirection: "Down", justUpdated: false };
      break;

    case "<":
      tile = {
        type: "Rock",
        fallingDirection: "DownLeft",
        justUpdated: false
      };
      break;

    case ">":
      tile = {
        type: "Rock",
        fallingDirection: "DownRight",
        justUpdated: false
      };
      break;

    case ".":
      tile = { type: "Rock", fallingDirection: "None", justUpdated: false };
      break;

    default:
      throw new Error(
        `Unexpected falling direction ${fallingDirection} at ${index + 1}`
      );
  }

  return { tile, nextIndex: index + 2 };
}

/**
 * Encodes a water tile
 *
 * @param {WaterTile} tile
 * @returns {string}
 */
function encodeWaterTile(tile) {
  switch (tile.flowDirection) {
    case "All":
      return "~+";

    case "Both":
      return "~_";

    case "Down":
      return "~v";

    case "Left":
      return "~<";

    case "Right":
      return "~>";
  }
}

/**
 * Decodes a water tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: WaterTile, nextIndex: number }}
 */
function decodeWaterTile(chars, index) {
  const flowDirection = chars[index + 1];

  /** @type {WaterTile} */
  let tile;
  switch (flowDirection) {
    case "+":
      tile = { type: "Water", flowDirection: "All", justUpdated: false };
      break;

    case "_":
      tile = { type: "Water", flowDirection: "Both", justUpdated: false };
      break;

    case "v":
      tile = { type: "Water", flowDirection: "Down", justUpdated: false };
      break;

    case "<":
      tile = { type: "Water", flowDirection: "Left", justUpdated: false };
      break;

    case ">":
      tile = { type: "Water", flowDirection: "Right", justUpdated: false };
      break;

    default:
      throw new Error(
        `Unexpected flow direction ${flowDirection} at ${index + 1}`
      );
  }

  return { tile, nextIndex: index + 2 };
}

/**
 * Encodes a tile as a string
 *
 * @param {Tile} tile
 * @returns {string}
 */
export function encodeTile(tile) {
  switch (tile.type) {
    case "Collectable":
    case "Empty":
    case "Wall":
      return encodeGenericTile(tile);

    case "Dirt":
      return encodeDirtTile(tile);

    case "Player":
      return encodePlayerTile(tile);

    case "Rock":
      return encodeRockTile(tile);

    case "Water":
      return encodeWaterTile(tile);
  }
}

/**
 * Decodes a tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: Tile, nextIndex: number }}
 */
export function decodeTile(chars, index) {
  switch (chars[index]) {
    case "C":
    case "W":
    case " ":
      return decodeGenericTile(chars, index);

    case "D":
      return decodeDirtTile(chars, index);

    case "P":
      return decodePlayerTile(chars, index);

    case "R":
      return decodeRockTile(chars, index);

    case "~":
      return decodeWaterTile(chars, index);
  }

  throw new Error(`Unexpected tile ${chars[index]} at ${index}`);
}
