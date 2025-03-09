/**
 * @typedef {(
 *  "Down" |
 *  "Left" |
 *  "Right" |
 *  "Up" |
 *  "None"
 * )} ConveyorDirection
 *
 * @typedef {(
 *   "Blue" |
 *   "Green" |
 *   "None" |
 *   "Red" |
 *   "Yellow"
 * )} KeyColor
 *
 * @typedef GenericTile
 * @property {"Empty" | "Wall" | "Collectable"} type
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
 * @property {KeyColor} keyColor
 *
 * @typedef {ConveyorDirection} InputDirection
 *
 * @typedef LivingPlayerTile
 * @property {"Player"} type
 * @property {true} isAlive
 * @property {InputDirection} inputDirection
 * @property {KeyColor} excessKey
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
 * @property {KeyColor} keyColor
 *
 * @typedef DeadPlayerTile
 * @property {"Player"} type
 * @property {false} isAlive
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
 * @property {KeyColor} keyColor
 *
 * @typedef {DeadPlayerTile | LivingPlayerTile} PlayerTile
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
 * @property {KeyColor} keyColor
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
 * @property {KeyColor} keyColor
 *
 * @typedef DirtTile
 * @property {"Dirt"} type
 * @property {FlowDirection | "None"} flowDirection
 * @property {boolean} justUpdated
 * @property {ConveyorDirection} conveyorDirection
 * @property {KeyColor} keyColor
 *
 * @typedef DoorTile
 * @property {"Door"} type
 * @property {Exclude<KeyColor, "None">} color
 * @property {boolean} justUpdated
 * @property {"None"} conveyorDirection
 * @property {"None"} keyColor
 *
 * @typedef {(
 *  DirtTile |
 *  DoorTile |
 *  GenericTile |
 *  PlayerTile |
 *  RockTile |
 *  WaterTile
 * )} Tile
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
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ conveyorDirection: ConveyorDirection, nextIndex: number }}
 */
function decodeConveyorDirection(chars, index) {
  /**
   * @type {ConveyorDirection}
   */
  let conveyorDirection = "None";
  let nextIndex = index;

  // Assume any other character actually is part of another sequence
  switch (chars[index]) {
    case "v":
      conveyorDirection = "Down";
      ++nextIndex;
      break;

    case "<":
      conveyorDirection = "Left";
      ++nextIndex;
      break;

    case ">":
      conveyorDirection = "Right";
      ++nextIndex;
      break;

    case "^":
      conveyorDirection = "Up";
      ++nextIndex;
      break;
  }

  return {
    conveyorDirection,
    nextIndex,
  };
}

/**
 * Appends the key color to an encoded tile
 *
 * @param {KeyColor | undefined} keyColor
 * @param {string} encoded
 * @returns {string}
 */
function appendKeyColor(keyColor, encoded) {
  switch (keyColor) {
    case "Blue":
      return encoded + "b";

    case "Green":
      return encoded + "g";

    case "Red":
      return encoded + "r";

    case "Yellow":
      return encoded + "y";

    default:
      return encoded;
  }
}

/**
 * Decodes a key color from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ keyColor: KeyColor, nextIndex: number }}
 */
function decodeKeyColor(chars, index) {
  /**
   * @type {KeyColor}
   */
  let keyColor = "None";
  let nextIndex = index;

  // Assume any other character actually is part of another sequence
  switch (chars[index]) {
    case "b":
      keyColor = "Blue";
      ++nextIndex;
      break;

    case "g":
      keyColor = "Green";
      ++nextIndex;
      break;

    case "r":
      keyColor = "Red";
      ++nextIndex;
      break;

    case "y":
      keyColor = "Yellow";
      ++nextIndex;
      break;
  }

  return {
    keyColor,
    nextIndex,
  };
}

/**
 * Encodes a generic tile
 *
 * @param {GenericTile} tile
 * @returns {string}
 */
function encodeGenericTile(tile) {
  /** @type {string} */
  let encoded;
  switch (tile.type) {
    case "Collectable":
      encoded = "C";
      break;

    case "Empty":
      encoded = " ";
      break;

    case "Wall":
      encoded = "W";
      break;
  }

  return appendKeyColor(
    tile.keyColor,
    appendConveyorDirection(
      tile.conveyorDirection,
      encoded
    )
  );
}

/**
 * Decodes a generic tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: GenericTile, nextIndex: number }}
 */
function decodeGenericTile(chars, index) {
  /** @type {Omit<GenericTile, "conveyorDirection" | "keyColor">} */
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

  const decodedConveyorDirection = decodeConveyorDirection(chars, index + 1);
  const decodedKeyColor = decodeKeyColor(chars, decodedConveyorDirection.nextIndex);

  return {
    tile: {
      ...tile,
      conveyorDirection: decodedConveyorDirection.conveyorDirection,
      keyColor: decodedKeyColor.keyColor,
    },
    nextIndex: decodedKeyColor.nextIndex,
  };
}

/**
 * Encodes a dirt tile
 *
 * @param {DirtTile} tile
 * @returns {string}
 */
function encodeDirtTile(tile) {
  /** @type {string} */
  let encoded;
  switch (tile.flowDirection) {
    case "Both":
      encoded = "D_";
      break;

    case "Down":
      encoded = "Dv";
      break;

    case "Left":
      encoded = "D<";
      break;

    case "None":
      encoded = "D.";
      break;

    case "Right":
      encoded = "D>";
      break;
  }

  return appendKeyColor(
    tile.keyColor,
    appendConveyorDirection(
      tile.conveyorDirection,
      encoded
    )
  );
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

  /** @type {Omit<DirtTile, "conveyorDirection" | "keyColor">} */
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

  const decodedConveyorDirection = decodeConveyorDirection(chars, index + 2);
  const decodedKeyColor = decodeKeyColor(chars, decodedConveyorDirection.nextIndex);

  return {
    tile: {
      ...tile,
      conveyorDirection: decodedConveyorDirection.conveyorDirection,
      keyColor: decodedKeyColor.keyColor,
    },
    nextIndex: decodedKeyColor.nextIndex,
  };
}

/**
 * Encodes a door tile
 *
 * @param {DoorTile} tile
 * @returns {string}
 */
function encodedDoorTile(tile) {
  switch (tile.color) {
    case "Blue":
      return "Xb";

    case "Green":
      return "Xg";

    case "Red":
      return "Xr";

    case "Yellow":
      return "Xy";
  }
}

/**
 * Decodes a door tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {{ tile: DoorTile, nextIndex: number }}
 */
function decodeDoorTile(chars, index) {
  const decodedDoorColor = decodeKeyColor(chars, index + 1);
  if (decodedDoorColor.keyColor === "None") {
    throw new Error(`Unexpected color ${chars[index + 1]} at ${index + 1}`);
  }

  return {
    tile: {
      type: "Door",
      color: decodedDoorColor.keyColor,
      justUpdated: false,
      conveyorDirection: "None",
      keyColor: "None",
    },
    nextIndex: decodedDoorColor.nextIndex,
  };
}

/**
 * Encodes a player tile
 *
 * @param {PlayerTile} tile
 * @returns {string}
 */
function encodePlayerTile(tile) {
  /** @type {string} */
  let encoded;
  if (tile.isAlive) {
    encoded = appendKeyColor(tile.excessKey, "Pa");
    switch (tile.inputDirection) {
      case "Down":
        encoded = `${encoded}v`;
        break;

      case "Left":
        encoded = `${encoded}<`;
        break;

      case "None":
        encoded = `${encoded}.`;
        break;

      case "Right":
        encoded = `${encoded}>`;
        break;

      case "Up":
        encoded = `${encoded}^`;
        break;
    }
  } else {
    encoded = "Pd";
  }

  return appendKeyColor(
    tile.keyColor,
    appendConveyorDirection(
      tile.conveyorDirection,
      encoded
    )
  );
}

/**
 * Decodes an input direction from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {InputDirection}}
 */
function decodeInputDirection(chars, index) {
  switch (chars[index]) {
    case "v":
      return "Down";

    case "<":
      return "Left";

    case ">":
      return "Right";

    case "^":
      return "Up";

    case ".":
      return "None";

    default:
      throw new Error(
        `Unexpected input direction ${chars[index]} at ${index}`
      );
  }
}

/**
 * Decodes a player tile from an array of characters
 *
 * @param {string[]} chars
 * @param {number} index The index in the array to decode from
 * @returns {(
 *  {
 *    tile: LivingPlayerTile,
 *    nextIndex: number
 *  } |
 *  {
 *    tile: DeadPlayerTile,
 *    nextIndex: number
 *  }
 * )}
 */
function decodePlayerTile(chars, index) {
  const status = chars[index + 1];

  /**
   * @type {boolean}
   */
  let isAlive;
  switch (status) {
    case "a":
      isAlive = true;
      break;

    case "d":
      isAlive = false;
      break;

    default:
      throw new Error(`Unexpected player status ${status} at ${index + 1}`);
  }

  if (isAlive) {
    const decodedExcessKey = decodeKeyColor(chars, index + 2);
    const inputDirection = decodeInputDirection(
      chars,
      decodedExcessKey.nextIndex
    );
    const decodedConveyorDirection = decodeConveyorDirection(
      chars,
      decodedExcessKey.nextIndex + 1
    );
    const decodedKeyColor = decodeKeyColor(
      chars,
      decodedConveyorDirection.nextIndex
    );

    return {
      tile: {
        type: "Player",
        isAlive,
        inputDirection,
        excessKey: decodedExcessKey.keyColor,
        justUpdated: false,
        conveyorDirection: decodedConveyorDirection.conveyorDirection,
        keyColor: decodedKeyColor.keyColor,
      },
      nextIndex: decodedKeyColor.nextIndex,
    };
  }

  const decodedConveyorDirection = decodeConveyorDirection(
    chars,
    index + 2
  );
  const decodedKeyColor = decodeKeyColor(
    chars,
    decodedConveyorDirection.nextIndex
  );

  return {
    tile: {
      type: "Player",
      isAlive,
      justUpdated: false,
      conveyorDirection: decodedConveyorDirection.conveyorDirection,
      keyColor: decodedKeyColor.keyColor,
    },
    nextIndex: decodedKeyColor.nextIndex,
  };
}

/**
 * Encodes a rock tile
 *
 * @param {RockTile} tile
 * @returns {string}
 */
function encodeRockTile(tile) {
  /** @type {string} */
  let encoded;
  switch (tile.fallingDirection) {
    case "Down":
      encoded = "Rv";
      break;

    case "DownLeft":
      encoded = "R<";
      break;

    case "DownRight":
      encoded = "R>";
      break;

    case "None":
      encoded = "R.";
      break;
  }

  return appendKeyColor(
    tile.keyColor,
    appendConveyorDirection(
      tile.conveyorDirection,
      encoded
    )
  );
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

  /** @type {Omit<RockTile, "conveyorDirection" | "keyColor">} */
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

  const decodedConveyorDirection = decodeConveyorDirection(chars, index + 2);
  const decodedKeyColor = decodeKeyColor(chars, decodedConveyorDirection.nextIndex);

  return {
    tile: {
      ...tile,
      conveyorDirection: decodedConveyorDirection.conveyorDirection,
      keyColor: decodedKeyColor.keyColor,
    },
    nextIndex: decodedKeyColor.nextIndex,
  };
}

/**
 * Encodes a water tile
 *
 * @param {WaterTile} tile
 * @returns {string}
 */
function encodeWaterTile(tile) {
  /** @type {string} */
  let encoded;
  switch (tile.flowDirection) {
    case "All":
      encoded = "~+";
      break;

    case "Both":
      encoded = "~_";
      break;

    case "Down":
      encoded = "~v";
      break;

    case "Left":
      encoded = "~<";
      break;

    case "Right":
      encoded = "~>";
      break;
  }

  return appendKeyColor(
    tile.keyColor,
    appendConveyorDirection(
      tile.conveyorDirection,
      encoded
    )
  );
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

  /** @type {Omit<WaterTile, "conveyorDirection" | "keyColor">} */
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

  const decodedConveyorDirection = decodeConveyorDirection(chars, index + 2);
  const decodedKeyColor = decodeKeyColor(chars, decodedConveyorDirection.nextIndex);

  return {
    tile: {
      ...tile,
      conveyorDirection: decodedConveyorDirection.conveyorDirection,
      keyColor: decodedKeyColor.keyColor,
    },
    nextIndex: decodedKeyColor.nextIndex,
  };
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

    case "Door":
      return encodedDoorTile(tile);

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

    case "X":
      return decodeDoorTile(chars, index);

    case "~":
      return decodeWaterTile(chars, index);

    default:
      throw new Error(`Unexpected tile ${chars[index]} at ${index}`);
  }
}
