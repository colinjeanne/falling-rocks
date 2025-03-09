/**
 * @typedef {import("./board.js").Board} Board
 * @typedef {import("./board.js").Point} Point
 * @typedef {import("./tile.js").ConveyorDirection} ConveyorDirection
 * @typedef {import("./tile.js").DeadPlayerTile} DeadPlayerTile
 * @typedef {import("./tile.js").DirtTile} DirtTile
 * @typedef {import("./tile.js").DoorTile} DoorTile
 * @typedef {import("./tile.js").FlowDirection} FlowDirection
 * @typedef {import("./tile.js").GenericTile} GenericTile
 * @typedef {import("./tile.js").KeyColor} KeyColor
 * @typedef {import("./tile.js").LivingPlayerTile} LivingPlayerTile
 * @typedef {import("./tile.js").RockTile} RockTile
 * @typedef {import("./tile.js").Tile} Tile
 * @typedef {import("./tile.js").WaterTile} WaterTile
 *
 * @callback PatternCallback
 * @param {Tile} tile The tile to match
 * @param {TileRegion} region The region that matched for this update
 * @returns {boolean} Whether the pattern matches
 */

/**
 * Negates a pattern
 *
 * @param {PatternCallback} pattern
 * @returns {PatternCallback}
 */
function not(pattern) {
  return (tile, region) => !pattern(tile, region);
}

/**
 * Ors two patterns
 *
 * @param {PatternCallback} pattern1
 * @param {PatternCallback} pattern2
 * @returns {PatternCallback}
 */
function or(pattern1, pattern2) {
  return (tile, region) => pattern1(tile, region) || pattern2(tile, region);
}

/**
 * Ands two patterns
 *
 * @param {PatternCallback} pattern1
 * @param {PatternCallback} pattern2
 * @returns {PatternCallback}
 */
function and(pattern1, pattern2) {
  return (tile, region) => pattern1(tile, region) && pattern2(tile, region);
}

/**
 * Matches a partial tile
 *
 * @param {Partial<Tile> & Pick<Tile, "type">} patternTile
 * @returns {PatternCallback}
 */
function isTile(patternTile) {
  return (tile) => {
    if (tile.type !== patternTile.type) {
      return false;
    }

    if (
      patternTile.conveyorDirection &&
      (tile.conveyorDirection !== patternTile.conveyorDirection)
    ) {
      return false;
    }

    if (
      patternTile.keyColor &&
      (tile.keyColor !== patternTile.keyColor)
    ) {
      return false;
    }

    if (tile.type === "Water" && patternTile.type === "Water") {
      if (
        (patternTile.flowDirection !== undefined) &&
        (tile.flowDirection !== patternTile.flowDirection)
      ) {
        return false;
      }
    } else if (tile.type === "Dirt" && patternTile.type === "Dirt") {
      if (
        (patternTile.flowDirection !== undefined) &&
        (tile.flowDirection !== patternTile.flowDirection)
      ) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Whether a tile was just updated
 *
 * @param {Tile} tile
 */
function wasJustUpdated(tile) {
  return tile.justUpdated;
}

/**
 * Whether a tile behaves as if it were empty for a player
 *
 * @param {Tile} tile
 */
function isEmptyForPlayer(tile) {
  return (
    (tile.type === "Collectable") ||
    (tile.type === "Empty") ||
    (tile.type === "Dirt" && tile.flowDirection === "None")
  );
}

/**
 * Whether a tile is a player on a conveyor
 *
 * @param {ConveyorDirection} conveyorDirection
 * @returns {PatternCallback}
 */
function isConveyoredPlayer(conveyorDirection) {
  return and(
    isTile({ type: "Player", conveyorDirection }),
    not(wasJustUpdated)
  );
}

/**
 * Whether a tile behaves as if it were empty for a rock
 *
 * @param {Tile} tile
 */
function isEmptyForRock(tile) {
  return tile.type === "Empty" || tile.type === "Water";
}

/**
 * Whether a rock is falling
 *
 * @param {Tile} tile
 */
function isFallingRock(tile) {
  return tile.type === "Rock" && tile.fallingDirection !== "None";
}

/**
 * Whether a rock is stationary
 *
 * @param {Tile} tile
 */
function isStationaryRock(tile) {
  return tile.type === "Rock" && tile.fallingDirection === "None";
}

/**
 * Whether a tile supports a particular flow direction
 *
 * @param {FlowDirection} flowDirection
 * @returns {PatternCallback}
 */
function supportsFlowDirection(flowDirection) {
  return (tile) =>
    (
      (tile.type === "Water") && (
        (tile.flowDirection === "All") ||
        (tile.flowDirection === flowDirection) ||
        (tile.flowDirection === "Both")
      )
    ) || (
      (tile.type === "Dirt") && (
        (tile.flowDirection === flowDirection) ||
        (tile.flowDirection === "Both")
      )
    );
}

/**
 * Whether a tile is a non-source flowing water with a specific direction
 *
 * @param {FlowDirection} flowDirection
 * @returns {PatternCallback}
 */
function isFlowingWater(flowDirection) {
  return (tile) =>
    (tile.type === "Water") &&
    (tile.flowDirection === flowDirection);
}

/**
 * Whether a tile is a waterlogged dirt
 *
 * @param {Tile} tile
 */
function isWaterloggedDirt(tile) {
  return tile.type === "Dirt" && tile.flowDirection !== "None";
}

/**
 * Whether a tile is a waterlogged dirt with a specific direction
 *
 * @param {FlowDirection} flowDirection
 * @returns {PatternCallback}
 */
function isDirtFlowing(flowDirection) {
  return (tile) =>
    (tile.type === "Dirt") &&
    (tile.flowDirection === flowDirection);
}

/**
 * Whether a tile behaves as if it were solid for water
 *
 * @param {Tile} tile
 */
function isSolidForWater(tile) {
  return !(["Dirt", "Empty", "Water"].includes(tile.type));
}

/**
 * Whether a player is alive
 *
 * @param {Tile} tile
 */
function isLivingPlayer(tile) {
  return tile.type === "Player" && tile.isAlive;
}

/**
 * Whether a tile is a player moving in a specific direction
 *
 * @param {LivingPlayerTile["inputDirection"]} inputDirection
 * @returns {PatternCallback}
 */
function isMovingPlayer(inputDirection) {
  return (tile) =>
    (tile.type === "Player") &&
    tile.isAlive &&
    (tile.inputDirection === inputDirection);
}

/**
 * Whether a tile is door that can be opened by the specified player
 *
 * @param {RegionPoint} playerLocation
 * @returns {PatternCallback}
 */
function isOpenableDoor(playerLocation) {
  return (tile, region) => {
    if (tile.type !== "Door") {
      return false;
    }

    const playerTile = region[playerLocation[1]][playerLocation[0]];
    if (!playerTile) {
      throw new Error(
        `Invalid region point (${playerLocation[0]}, ${playerLocation[1]})`
      );
    }

    return playerTile.type === "Player" &&
      playerTile.isAlive &&
      tile.color === playerTile.keyColor;
  }
}

/**
 * @typedef {(
 *           [2, 0] |
 *       [1 | 2 | 3, 1] |
 *   [0 | 1 | 2 | 3 | 4, 2] |
 *       [1 | 2 | 3, 3]
 * )} RegionPoint
 * @typedef {[
 *               [Tile],
 *         [Tile, Tile, Tile],
 *   [Tile, Tile, Tile, Tile, Tile],
 *         [Tile, Tile, Tile],
 * ]} TileRegion
 */

/**
 * @template T
 * @typedef {(
 *  Omit<T, "conveyorDirection" | "justUpdated" | "keyColor"> &
 *  { keyColor?: KeyColor }
 * )} _SimpleTile<T>
 */

/**
 * @typedef {(
 *   _SimpleTile<DeadPlayerTile> |
 *   _SimpleTile<DirtTile> |
 *   Omit<DoorTile, "justUpdated" | "conveyorDirection"> |
 *   _SimpleTile<GenericTile> |
 *   Omit<LivingPlayerTile, "justUpdated" | "conveyorDirection"> |
 *   _SimpleTile<RockTile> |
 *   _SimpleTile<WaterTile>
 * )} SimpleTile
 *
 * @callback TileUpdateCallback
 * @param {Tile} tile The tile that is being updated
 * @param {TileRegion} region The region that matched for this update
 * @returns {SimpleTile} The updated tile
 *
 * @typedef {TileUpdateCallback | null} TileUpdate
 */

/**
 * An empty tile after an update
 *
 * @type {TileUpdateCallback}
 */
function empty() {
  return { type: "Empty" };
}

/**
 * A dead player after an update
 *
 * @type {TileUpdateCallback}
 */
function deadPlayer(tile) {
  const keyColor = (tile.type === "Player" && tile.isAlive) ?
    tile.excessKey :
    undefined;
  return { type: "Player", isAlive: false, keyColor };
}

/**
 * A tile a player is moving to
 *
 * @param {RegionPoint} originalLocation
 * @returns {TileUpdateCallback}
 */
function playerMovedTo(originalLocation) {
  return (tile, region) => {
    const playerTile = region[originalLocation[1]][originalLocation[0]];
    if (!playerTile) {
      throw new Error(
        `Invalid region point (${originalLocation[0]}, ${originalLocation[1]})`
      );
    }

    if (playerTile.type !== "Player") {
      throw new Error(
        `Expected player tile at (${originalLocation[0]}, ${originalLocation[1]}) but got ${tile.type}`
      );
    }

    if (playerTile.isAlive) {
      /** @type {KeyColor} */
      let excessKey;

      /** @type {KeyColor} */
      let keyColor;

      if (playerTile.keyColor === "None") {
        keyColor = tile.keyColor;
        excessKey = "None";
      } else if (tile.keyColor !== "None") {
        keyColor = playerTile.keyColor;
        excessKey = tile.keyColor;
      } else if (tile.type === "Door") {
        keyColor = "None";
        excessKey = "None";
      } else {
        keyColor = playerTile.keyColor;
        excessKey = "None";
      }

      return {
        type: "Player",
        isAlive: playerTile.isAlive,
        inputDirection: "None",
        keyColor,
        excessKey,
      };
    }

    return { type: "Player", isAlive: playerTile.isAlive };
  };
}

/**
 * A tile after a player has moved from it
 *
 * @type {TileUpdateCallback}
 */
function playerMovedFrom(tile) {
  if (tile.type !== "Player") {
    throw new Error(`Expected player tile but got ${tile.type}`);
  }

  if (tile.isAlive) {
    return { type: "Empty", keyColor: tile.excessKey }
  }

  return { type: "Empty" };
}

/**
 * A living player without input
 *
 * @type {TileUpdateCallback}
 */
function playerWithoutInput(tile) {
  if (tile.type !== "Player" || !tile.isAlive) {
    throw new Error(`Expected living player tile but got ${tile.type}`);
  }

  /** @type {ConveyorDirection} */
  const inputDirection = "None";

  return {
    ...tile,
    inputDirection,
  };
}

/**
 * Dirt after an update
 *
 * @param {DirtTile["flowDirection"]} flowDirection
 * @returns {TileUpdateCallback}
 */
function dirt(flowDirection) {
  return () => {
    return { type: "Dirt", flowDirection };
  };
}

/**
 * A rock after an update
 *
 * @param {RockTile["fallingDirection"]} fallingDirection
 * @returns {TileUpdateCallback}
 */
function rock(fallingDirection) {
  return () => {
    return { type: "Rock", fallingDirection };
  };
}

/**
 * Water after an update
 *
 * @param {WaterTile["flowDirection"]} flowDirection
 * @returns {TileUpdateCallback}
 */
function water(flowDirection) {
  return () => {
    return { type: "Water", flowDirection };
  };
}

/**
 * @typedef {PatternCallback | null} Pattern
 *
 * @typedef {[
 *                     [Pattern],
 *            [Pattern, Pattern, Pattern],
 *   [Pattern, Pattern, Pattern, Pattern, Pattern],
 *            [Pattern, Pattern, Pattern],
 * ]} PatternRegion
 *
 * Because the simulation works bottom to top and right to left the tile in
 * the center of the tile update region must be a tile that is actually
 * updated. Conceptually, this is the tile that is being looked at by the
 * pattern region and is the subject of the entire pattern.
 *
 * @typedef {[
 *                           [TileUpdate],
 *               [TileUpdate, TileUpdate, TileUpdate],
 *   [TileUpdate, TileUpdate, TileUpdateCallback],
 * ]} TileUpdateRegion
 */

/** @type {[string, PatternRegion, TileUpdateRegion][]} */
export const patterns = [
  [
    "Down conveyors move players down",
    [
      [null],
      [null, isConveyoredPlayer("Down"), null],
      [null, null, isEmptyForPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedFrom, null],
      [null, null, playerMovedTo([1, 1])],
    ],
  ],
  [
    "Down conveyored players kill other players",
    [
      [null],
      [null, isConveyoredPlayer("Down"), null],
      [null, null, and(isLivingPlayer, not(isConveyoredPlayer("Down"))), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, deadPlayer, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Down conveyors move players through openable doors",
    [
      [null],
      [null, isConveyoredPlayer("Down"), null],
      [null, null, isOpenableDoor([1, 1]), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedFrom, null],
      [null, null, playerMovedTo([1, 1])],
    ],
  ],
  [
    "Down conveyored players crash",
    [
      [null],
      [null, null, null],
      [null, null, and(isLivingPlayer, isConveyoredPlayer("Down")), null, null],
      [null, not(isEmptyForPlayer), null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Left conveyors move players left",
    [
      [null],
      [null, null, null],
      [null, isEmptyForPlayer, isConveyoredPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedTo([2, 2]), playerMovedFrom],
    ],
  ],
  [
    "Left conveyored players move rocks",
    [
      [null],
      [null, null, null],
      [isEmptyForRock, isTile({ type: "Rock" }), isConveyoredPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [rock("None"), playerMovedTo([2, 2]), playerMovedFrom],
    ],
  ],
  [
    "Left pushed rocks kill players",
    [
      [null],
      [null, null, null],
      [isLivingPlayer, isTile({ type: "Rock" }), isConveyoredPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [deadPlayer, null, deadPlayer],
    ],
  ],
  [
    "Left conveyored players kill other players",
    [
      [null],
      [null, null, null],
      [null, and(isLivingPlayer, not(isConveyoredPlayer("Left"))), isConveyoredPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, deadPlayer, deadPlayer],
    ],
  ],
  [
    "Left conveyors move players through openable doors left",
    [
      [null],
      [null, null, null],
      [null, isOpenableDoor([2, 2]), isConveyoredPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedTo([2, 2]), playerMovedFrom],
    ],
  ],
  [
    "Left conveyored players crash",
    [
      [null],
      [null, null, null],
      [null, not(isEmptyForPlayer), and(isLivingPlayer, isConveyoredPlayer("Left")), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Right conveyors move players right",
    [
      [null],
      [null, null, null],
      [null, isConveyoredPlayer("Right"), isEmptyForPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedFrom, playerMovedTo([1, 2])],
    ],
  ],
  [
    "Right conveyored players move rocks",
    [
      [null],
      [null, null, null],
      [isConveyoredPlayer("Right"), isTile({ type: "Rock" }), isEmptyForRock, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [playerMovedFrom, playerMovedTo([0, 2]), rock("None")],
    ],
  ],
  [
    "Right pushed rocks kill players",
    [
      [null],
      [null, null, null],
      [isConveyoredPlayer("Right"), isTile({ type: "Rock" }), isLivingPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [deadPlayer, null, deadPlayer],
    ],
  ],
  [
    "Right conveyored players kill other players",
    [
      [null],
      [null, null, null],
      [null, isConveyoredPlayer("Right"), and(isLivingPlayer, not(isConveyoredPlayer("Right"))), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, deadPlayer, deadPlayer],
    ],
  ],
  [
    "Right conveyors move players through openable doors right",
    [
      [null],
      [null, null, null],
      [null, isConveyoredPlayer("Right"), isOpenableDoor([1, 2]), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedFrom, playerMovedTo([1, 2])],
    ],
  ],
  [
    "Right conveyored players crash",
    [
      [null],
      [null, null, null],
      [null, null, and(isLivingPlayer, isConveyoredPlayer("Right")), not(isEmptyForPlayer), null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Up conveyors move players up",
    [
      [null],
      [null, isEmptyForPlayer, null],
      [null, null, isConveyoredPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedTo([2, 2]), null],
      [null, null, playerMovedFrom],
    ],
  ],
  [
    "Falling rocks kill up-conveyed players",
    [
      [isEmptyForRock],
      [null, isFallingRock, null],
      [null, null, and(isLivingPlayer, isConveyoredPlayer("Up")), null, null],
      [null, null, null],
    ],
    [
      [rock("None")],
      [null, deadPlayer, null],
      [null, null, empty],
    ],
  ],
  [
    "Up conveyored players move rocks",
    [
      [isEmptyForRock],
      [null, isTile({ type: "Rock" }), null],
      [null, null, isConveyoredPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [rock("None")],
      [null, playerMovedTo([2, 2]), null],
      [null, null, playerMovedFrom],
    ],
  ],
  [
    "Up pushed rocks kill players",
    [
      [isLivingPlayer],
      [null, isTile({ type: "Rock" }), null],
      [null, null, isConveyoredPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [deadPlayer],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Up conveyored players kill other players",
    [
      [null],
      [null, and(isLivingPlayer, not(isConveyoredPlayer("Up"))), null],
      [null, null, isConveyoredPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, deadPlayer, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Up conveyors move players up",
    [
      [null],
      [null, isOpenableDoor([2, 2]), null],
      [null, null, isConveyoredPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedTo([2, 2]), null],
      [null, null, playerMovedFrom],
    ],
  ],
  [
    "Up conveyored players crash",
    [
      [null],
      [null, not(isEmptyForPlayer), null],
      [null, null, and(isLivingPlayer, isConveyoredPlayer("Up")), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Rocks fall down",
    [
      [null],
      [null, isTile({ type: "Rock" }), null],
      [null, null, isEmptyForRock, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, empty, null],
      [null, null, rock("Down")],
    ],
  ],
  [
    "Rocks fall left off of and kill a player",
    [
      [null],
      [isEmptyForRock, isFallingRock, null],
      [null, isEmptyForRock, isLivingPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, empty, null],
      [null, rock("DownLeft"), deadPlayer],
    ],
  ],
  [
    "Rocks fall left off a hard surface",
    [
      [null],
      [null, isEmptyForRock, isFallingRock],
      [null, null, isEmptyForRock, not(isEmptyForRock), null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, empty],
      [null, null, rock("DownLeft")],
    ],
  ],
  [
    "Rocks falling left kill a player and stop",
    [
      [null],
      [null, isEmptyForRock, isFallingRock],
      [null, null, isLivingPlayer, not(isEmptyForRock), null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, rock("None")],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Rocks fall right off of and kill a player",
    [
      [null],
      [isFallingRock, isEmptyForRock, null],
      [null, isLivingPlayer, isEmptyForRock, null, null],
      [null, null, null],
    ],
    [
      [null],
      [empty, null, null],
      [null, deadPlayer, rock("DownRight")],
    ],
  ],
  [
    "Rocks fall right off a hard surface",
    [
      [null],
      [isFallingRock, isEmptyForRock, null],
      [null, not(isEmptyForRock), isEmptyForRock, null, null],
      [null, null, null],
    ],
    [
      [null],
      [empty, null, null],
      [null, null, rock("DownRight")],
    ],
  ],
  [
    "Rocks falling right kill a player and stop",
    [
      [null],
      [isFallingRock, isEmptyForRock, null],
      [null, not(isEmptyForRock), isLivingPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [rock("None"), null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Rocks that fall down kill players and stop",
    [
      [null],
      [null, isFallingRock, null],
      [null, null, isLivingPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, rock("None"), null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Falling rocks stop if there is no where to fall",
    [
      [null],
      [null, null, null],
      [null, null, isFallingRock, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, rock("None")],
    ],
  ],
  [
    "Water flows down",
    [
      [null],
      [null, or(isTile({ type: "Water" }), isWaterloggedDirt), null],
      [null, null, isTile({ type: "Empty" }), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, water("Down")],
    ],
  ],
  [
    "Water onto a surface",
    [
      [null],
      [null, or(isTile({ type: "Water" }), isWaterloggedDirt), null],
      [null, null, isTile({ type: "Empty" }), null, null],
      [null, isSolidForWater, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, water("Both")],
    ],
  ],
  [
    "Down-flowing water kills a player",
    [
      [null],
      [null, or(isTile({ type: "Water" }), isWaterloggedDirt), null],
      [null, null, isLivingPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Down-ward flowing water converts to both when a surface is below it",
    [
      [null],
      [null, null, null],
      [null, null, isFlowingWater("Down"), null, null],
      [null, isSolidForWater, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, water("Both")],
    ],
  ],
  [
    "Both-ward flowing water converts to down when no surface is below it",
    [
      [null],
      [null, null, null],
      [null, null, isFlowingWater("Both"), null, null],
      [null, not(isSolidForWater), null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, water("Down")],
    ],
  ],
  [
    "Water spreads right",
    [
      [null],
      [null, null, null],
      [null, supportsFlowDirection("Right"), isTile({ type: "Empty" }), null, null],
      [isSolidForWater, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, water("Right")],
    ],
  ],
  [
    "Right-flowing water kills a player",
    [
      [null],
      [null, null, null],
      [null, or(isTile({ type: "Water" }), isWaterloggedDirt), isLivingPlayer, null, null],
      [isSolidForWater, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Water spreads left",
    [
      [null],
      [null, null, null],
      [null, null, isTile({ type: "Empty" }), and(supportsFlowDirection("Left"), not(wasJustUpdated)), null],
      [null, null, isSolidForWater],
    ],
    [
      [null],
      [null, null, null],
      [null, null, water("Left")],
    ],
  ],
  [
    "Left-flowing water kills a player",
    [
      [null],
      [null, null, null],
      [null, null, isLivingPlayer, and(or(isTile({ type: "Water" }), isWaterloggedDirt), not(wasJustUpdated)), null],
      [null, null, isSolidForWater],
    ],
    [
      [null],
      [null, null, null],
      [null, null, deadPlayer],
    ],
  ],
  [
    "Both-flowing and down-flowing water dries if it doesn't have a source" +
    " or down-flowing water above it",
    [
      [null],
      [null, not(or(isTile({ type: "Water" }), isWaterloggedDirt)), null],
      [null, null, or(isFlowingWater("Both"), isFlowingWater("Down")), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, empty],
    ],
  ],
  [
    "Right-flowing water dries if it doesn't have a source or right-flowing" +
    " water to its right",
    [
      [null],
      [null, null, null],
      [null, not(supportsFlowDirection("Right")), isFlowingWater("Right"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, empty],
    ],
  ],
  [
    "Left-flowing water dries if it doesn't have a source or left-flowing" +
    " water to its left",
    [
      [null],
      [null, null, null],
      // TODO: THIS ALSO CAUSES LEFT WATER TO WAIT IF THE SIDE IS A ROCK THAT FELL
      [null, null, isFlowingWater("Left"), and(not(supportsFlowDirection("Left")), not(wasJustUpdated)), null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, empty],
    ],
  ],
  [
    "Water waterlogs dirt from the top",
    [
      [null],
      [null, or(isTile({ type: "Water" }), isWaterloggedDirt), null],
      [null, null, isTile({ type: "Dirt", flowDirection: "None" }), null, null],
      [null, not(isSolidForWater), null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("Down")],
    ],
  ],
  [
    "Waterlogged dirt flows onto a surface",
    [
      [null],
      [null, or(isTile({ type: "Water" }), isWaterloggedDirt), null],
      [null, null, isTile({ type: "Dirt", flowDirection: "None" }), null, null],
      [null, isSolidForWater, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("Both")],
    ],
  ],
  [
    "Down-ward flowing waterlogged dirt converts to both when a surface is" +
    " below it",
    [
      [null],
      [null, null, null],
      [null, null, isDirtFlowing("Down"), null, null],
      [null, isSolidForWater, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("Both")],
    ],
  ],
  [
    "Both-ward flowing waterlogged dirt converts to down when no surface is" +
    " below it",
    [
      [null],
      [null, null, null],
      [null, null, isDirtFlowing("Both"), null, null],
      [null, not(isSolidForWater), null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("Down")],
    ],
  ],
  [
    "Water waterlogs to the right",
    [
      [null],
      [null, null, null],
      [null, supportsFlowDirection("Right"), isTile({ type: "Dirt", flowDirection: "None" }), null, null],
      [isSolidForWater, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("Right")],
    ],
  ],
  [
    "Water waterlogs to the left",
    [
      [null],
      [null, null, null],
      [null, null, isTile({ type: "Dirt", flowDirection: "None" }), and(or(isTile({ type: "Water" }), isWaterloggedDirt), not(wasJustUpdated)), null],
      [null, null, isSolidForWater],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("Left")],
    ],
  ],
  [
    "Both-flowing and down-flowing water dries if it doesn't have a source" +
    " or down-flowing water above it",
    [
      [null],
      [null, not(or(isTile({ type: "Water" }), isWaterloggedDirt)), null],
      [null, null, or(isDirtFlowing("Both"), isDirtFlowing("Down")), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("None")],
    ],
  ],
  [
    "Right-flowing water dries if it doesn't have a source or right-flowing" +
    " water to its right",
    [
      [null],
      [null, null, null],
      [null, not(supportsFlowDirection("Right")), isDirtFlowing("Right"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("None")],
    ],
  ],
  [
    "Left-flowing water dries if it doesn't have a source or left-flowing" +
    " water to its left",
    [
      [null],
      [null, null, null],
      // TODO: SAME ISSUE AS WITH WATER
      [null, null, isDirtFlowing("Left"), and(not(supportsFlowDirection("Left")), not(wasJustUpdated)), null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, dirt("None")],
    ],
  ],
  [
    "Down-moving players move into empty spaces",
    [
      [null],
      [null, isMovingPlayer("Down"), null],
      [null, null, isEmptyForPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedFrom, null],
      [null, null, playerMovedTo([1, 1])],
    ],
  ],
  [
    "Down-moving players move into openable doors",
    [
      [null],
      [null, isMovingPlayer("Down"), null],
      [null, null, isOpenableDoor([1, 1]), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedFrom, null],
      [null, null, playerMovedTo([1, 1])],
    ],
  ],
  [
    "Down-moving players are stopped by non-empty spaces",
    [
      [null],
      [null, null, null],
      [null, null, isMovingPlayer("Down"), null, null],
      [null, not(isEmptyForPlayer), null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, playerWithoutInput],
    ],
  ],
  [
    "Left-moving players move into empty spaces",
    [
      [null],
      [null, null, null],
      [null, isEmptyForPlayer, isMovingPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedTo([2, 2]), playerMovedFrom],
    ],
  ],
  [
    "Left-moving players move into openable doors",
    [
      [null],
      [null, null, null],
      [null, isOpenableDoor([2, 2]), isMovingPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedTo([2, 2]), playerMovedFrom],
    ],
  ],
  [
    "Left-moving players push rocks into empty spaces",
    [
      [null],
      [null, null, null],
      [isEmptyForRock, isStationaryRock, isMovingPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [rock("None"), playerMovedTo([2, 2]), playerMovedFrom],
    ],
  ],
  [
    "Left-moving players are stopped by non-empty spaces",
    [
      [null],
      [null, null, null],
      [null, not(isEmptyForPlayer), isMovingPlayer("Left"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, playerWithoutInput],
    ],
  ],
  [
    "Right-moving players move into empty spaces",
    [
      [null],
      [null, null, null],
      [null, isMovingPlayer("Right"), isEmptyForPlayer, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedFrom, playerMovedTo([1, 2])],
    ],
  ],
  [
    "Right-moving players move into empty spaces",
    [
      [null],
      [null, null, null],
      [null, isMovingPlayer("Right"), isOpenableDoor([1, 2]), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, playerMovedFrom, playerMovedTo([1, 2])],
    ],
  ],
  [
    "Right-moving players push rocks into empty spaces",
    [
      [null],
      [null, null, null],
      [isMovingPlayer("Right"), isStationaryRock, isEmptyForRock, null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [playerMovedFrom, playerMovedTo([0, 2]), rock("None")],
    ],
  ],
  [
    "Right-moving players are stopped by non-empty spaces",
    [
      [null],
      [null, null, null],
      [null, null, isMovingPlayer("Right"), not(isEmptyForPlayer), null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, playerWithoutInput],
    ],
  ],
  [
    "Up-moving players move into empty spaces",
    [
      [null],
      [null, isEmptyForPlayer, null],
      [null, null, isMovingPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedTo([2, 2]), null],
      [null, null, playerMovedFrom],
    ],
  ],
  [
    "Up-moving players move into openable doors",
    [
      [null],
      [null, isOpenableDoor([2, 2]), null],
      [null, null, isMovingPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, playerMovedTo([2, 2]), null],
      [null, null, playerMovedFrom],
    ],
  ],
  [
    "Up-moving players push rocks into empty spaces",
    [
      [isEmptyForRock],
      [null, isStationaryRock, null],
      [null, null, isMovingPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [rock("None")],
      [null, playerMovedTo([2, 2]), null],
      [null, null, playerMovedFrom],
    ],
  ],
  [
    "Up-moving players are stopped by non-emtpy spaces",
    [
      [null],
      [null, not(isEmptyForPlayer), null],
      [null, null, isMovingPlayer("Up"), null, null],
      [null, null, null],
    ],
    [
      [null],
      [null, null, null],
      [null, null, playerWithoutInput],
    ],
  ],
];

/**
 * Whether a row from a region matches the corresponding row from a pattern
 *
 * @template {number} index
 * @template {PatternRegion[index]} U
 * @param {TileRegion} tileRegion
 * @param {0 | 1 | 2 | 3} tileRegionRowIndex
 * @param {U} patternRegionRow
 */
function rowsMatch(tileRegion, tileRegionRowIndex, patternRegionRow) {
  const row = tileRegion[tileRegionRowIndex];
  for (let index = 0; index < row.length; ++index) {
    const pattern = patternRegionRow[index];
    if (pattern && !pattern(row[index], tileRegion)) {
      return false;
    }
  }

  return true;
}

/**
 * Whether a region matches a given tile pattern
 *
 * @param {TileRegion} region
 * @param {PatternRegion} patternRegion
 */
function matcher(region, patternRegion) {
  return rowsMatch(region, 3, patternRegion[3]) &&
    rowsMatch(region, 2, patternRegion[2]) &&
    rowsMatch(region, 1, patternRegion[1]) &&
    rowsMatch(region, 0, patternRegion[0]);
}

/**
 * Sorts the points from bottom right to top left
 *
 * @param {Point[]} points
 */
function reverseSortPoints(points) {
  return [...points].sort((p1, p2) => {
    if (p1[1] > p2[1]) {
      return -1;
    } else if (p1[1] < p2[1]) {
      return 1;
    } else if (p1[0] > p2[0]) {
      return -1;
    } else if (p1[0] < p2[0]) {
      return 1;
    }

    return 0;
  });
}

/**
 * Gets the 5x5 region centered at a given point
 *
 * @param {Board} board
 * @param {Point} pt
 * @returns {TileRegion}
 */
function getPointCenteredRegion(board, pt) {
  return [
    [board.getTile([pt[0], pt[1] - 2])],
    [
      board.getTile([pt[0] - 1, pt[1] - 1]),
      board.getTile([pt[0], pt[1] - 1]),
      board.getTile([pt[0] + 1, pt[1] - 1]),
    ],
    [
      board.getTile([pt[0] - 2, pt[1]]),
      board.getTile([pt[0] - 1, pt[1]]),
      board.getTile([pt[0], pt[1]]),
      board.getTile([pt[0] + 1, pt[1]]),
      board.getTile([pt[0] + 1, pt[1]]),
    ],
    [
      board.getTile([pt[0] - 1, pt[1] + 1]),
      board.getTile([pt[0], pt[1] + 1]),
      board.getTile([pt[0] + 1, pt[1] + 1]),
    ],
  ];
}

/**
 * Applies a tile update
 *
 * @param {Tile} tile
 * @param {TileRegion} region
 * @param {TileUpdate} tileUpdate
 * @returns {Tile}
 */
function applyTileUpdate(tile, region, tileUpdate) {
  const updated = tileUpdate?.(tile, region) || tile;
  if (updated.type === "Door") {
    return {
      ...updated,
      justUpdated: true,
      conveyorDirection: "None",
    };
  }

  return {
    ...updated,
    justUpdated: true,
    conveyorDirection: tile.conveyorDirection,
    keyColor: updated.keyColor ?? tile.keyColor,
  };
}

/**
 *
 * @param {Board} board
 * @param {Point} pt
 * @param {TileRegion} region
 * @param {TileUpdateRegion} updates
 */
function applyRegionUpdates(board, pt, region, updates) {
  /** @type {Point[]} */
  const updatedPoints = [];

  for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
    let rowOffset = 0;
    if (rowIndex === 0) {
      rowOffset = 2;
    } else if (rowIndex === 1) {
      rowOffset = 1;
    }

    const baseX = pt[0] + rowOffset - 2;

    for (let index = 0; index < updates.length; ++index) {
      /** @type {Point} */
      const currentPoint = [baseX + index, pt[1] + rowIndex - 2];

      const update = updates[rowIndex][index];
      if (update) {
        updatedPoints.push(currentPoint);

        board.setTile(
          currentPoint,
          applyTileUpdate(
            board.getTile(currentPoint),
            region,
            update
          )
        );
      }
    }
  }

  return updatedPoints;
}

/**
 * Applies updates to each tile that needs an update
 *
 * @param {Board} board
 * @param {Point[]} pointsToUpdate
 * @returns {Point[]} the points that were updated
 */
export function applyPatternTileUpdates(board, pointsToUpdate) {
  const sortedUpdatedTiles = reverseSortPoints(pointsToUpdate);

  /** @type {Point[]} */
  const updatedPoints = [];
  for (const point of sortedUpdatedTiles) {
    const region = getPointCenteredRegion(board, point);
    for (const [description, pattern, updates] of patterns) {
      if (matcher(region, pattern)) {
        console.debug(
          `Matched "${description}" at (${point[0]}, ${point[1]})`
        );

        updatedPoints.push(
          ...applyRegionUpdates(board, point, region, updates)
        );
        break;
      }
    }
  }

  return updatedPoints;
}
