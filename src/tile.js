/**
 * @typedef {(
 *  "Down" |
 *  "Left" |
 *  "Right" |
 *  "Up" |
 *  "None"
 * )} ConveyorDirection
 *
 * @typedef GenericTile
 * @property {"Empty" | "Wall" | "Collectable"} type
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
 *
 * @typedef PlayerTile
 * @property {"Player"} type
 * @property {boolean} isAlive
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
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
 * @property {ConveyorDirection} conveyorDirection
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
 * @property {ConveyorDirection} conveyorDirection
 *
 * @typedef DirtTile
 * @property {"Dirt"} type
 * @property {FlowDirection | "None"} flowDirection
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
 *
 * @typedef {DirtTile | GenericTile | PlayerTile | RockTile | WaterTile} Tile
 */

/**
 * Appends the conveyor direction to an encoded tile
 *
 * @param {ConveyorDirection} conveyorDirection
 * @param {string} encoded
 * @returns {string}
 */
function appendConveyorDirection(conveyorDirection, encoded) {
  switch (conveyorDirection) {
    case "Down":
      return encoded + "v";

    case "Left":
      return encoded + "<";

    case "None":
      return encoded;

    case "Right":
      return encoded + ">";

    case "Up":
      return encoded + "^";
  }
}

/**
 * Decodes a conveyor direction from an array of characters
 *
 * @param {Omit<Tile, "conveyorDirection">} partialTile
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: Tile, nextIndex: number }}
 */
function decodeConveyorDirection(partialTile, chars, index) {
  switch (chars[index]) {
    case "v":
      return {
        tile: /** @type {Tile} */ ({
          ...partialTile,
          conveyorDirection: "Down",
        }),
        nextIndex: index + 1,
      };

    case "<":
      return {
        tile: /** @type {Tile} */ ({
          ...partialTile,
          conveyorDirection: "Left",
        }),
        nextIndex: index + 1,
      };

    case ">":
      return {
        tile: /** @type {Tile} */ ({
          ...partialTile,
          conveyorDirection: "Right",
        }),
        nextIndex: index + 1,
      };

    case "^":
      return {
        tile: /** @type {Tile} */ ({
          ...partialTile,
          conveyorDirection: "Up",
        }),
        nextIndex: index + 1,
      };
  }

  return {
    tile: /** @type {Tile} */ ({
      ...partialTile,
      conveyorDirection: "None",
    }),
    nextIndex: index,
  };
}

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
 * @returns {{ tile: Omit<GenericTile, "conveyorDirection">, nextIndex: number }}
 */
function decodeGenericTile(chars, index) {
  /** @type {Omit<GenericTile, "conveyorDirection">} */
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
 * @returns {{ tile: Omit<DirtTile, "conveyorDirection">, nextIndex: number }}
 */
function decodeDirtTile(chars, index) {
  const flowDirection = chars[index + 1];

  /** @type {Omit<DirtTile, "conveyorDirection">} */
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
 * @returns {{ tile: Omit<PlayerTile, "conveyorDirection">, nextIndex: number }}
 */
function decodePlayerTile(chars, index) {
  const status = chars[index + 1];

  /** @type {Omit<PlayerTile, "conveyorDirection">} */
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
 * @returns {{ tile: Omit<RockTile, "conveyorDirection">, nextIndex: number }}
 */
function decodeRockTile(chars, index) {
  const fallingDirection = chars[index + 1];

  /** @type {Omit<RockTile, "conveyorDirection">} */
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
 * @returns {{ tile: Omit<WaterTile, "conveyorDirection">, nextIndex: number }}
 */
function decodeWaterTile(chars, index) {
  const flowDirection = chars[index + 1];

  /** @type {Omit<WaterTile, "conveyorDirection">} */
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
  let encoded;
  switch (tile.type) {
    case "Collectable":
    case "Empty":
    case "Wall":
      encoded = encodeGenericTile(tile);
      break;

    case "Dirt":
      encoded = encodeDirtTile(tile);
      break;

    case "Player":
      encoded = encodePlayerTile(tile);
      break;

    case "Rock":
      encoded = encodeRockTile(tile);
      break;

    case "Water":
      encoded = encodeWaterTile(tile);
      break;
  }

  return appendConveyorDirection(tile.conveyorDirection, encoded);
}

/**
 * Decodes a tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: Tile, nextIndex: number }}
 */
export function decodeTile(chars, index) {
  /** @type {{ tile: Omit<Tile, "conveyorDirection">, nextIndex: number }} */
  let partialDecode;
  switch (chars[index]) {
    case "C":
    case "W":
    case " ":
      partialDecode = decodeGenericTile(chars, index);
      break;

    case "D":
      partialDecode = decodeDirtTile(chars, index);
      break;

    case "P":
      partialDecode = decodePlayerTile(chars, index);
      break;

    case "R":
      partialDecode = decodeRockTile(chars, index);
      break;

    case "~":
      partialDecode = decodeWaterTile(chars, index);
      break;

    default:
      throw new Error(`Unexpected tile ${chars[index]} at ${index}`);
  }

  return decodeConveyorDirection(
    partialDecode.tile,
    chars,
    partialDecode.nextIndex
  );
}
