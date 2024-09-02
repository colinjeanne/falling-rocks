/**
 * @typedef {import("./board.js").Board} Board
 * @typedef {import("./board.js").Point} Point
 * @typedef {import("./tile.js").ConveyorDirection} ConveyorDirection
 * @typedef {import("./tile.js").DeadPlayerTile} DeadPlayerTile
 * @typedef {import("./tile.js").DirtTile} DirtTile
 * @typedef {import("./tile.js").FlowDirection} FlowDirection
 * @typedef {import("./tile.js").GenericTile} GenericTile
 * @typedef {import("./tile.js").LivingPlayerTile} LivingPlayerTile
 * @typedef {import("./tile.js").RockTile} RockTile
 * @typedef {import("./tile.js").Tile} Tile
 * @typedef {import("./tile.js").WaterTile} WaterTile
 *
 * @callback Pattern
 * @param {Tile} tile The tile to match
 * @returns {boolean} Whether the pattern matches
 */

/**
 * Matches any tile
 *
 * @param {Tile} _tile
 */
function any(_tile) {
  return true;
}

/**
 * Negates a pattern
 *
 * @param {Pattern} pattern
 * @returns {Pattern}
 */
function not(pattern) {
  return (tile) => !pattern(tile);
}

/**
 * Ors two patterns
 *
 * @param {Pattern} pattern1
 * @param {Pattern} pattern2
 * @returns {Pattern}
 */
function or(pattern1, pattern2) {
  return (tile) => pattern1(tile) || pattern2(tile);
}

/**
 * Ands two patterns
 *
 * @param {Pattern} pattern1
 * @param {Pattern} pattern2
 * @returns {Pattern}
 */
function and(pattern1, pattern2) {
  return (tile) => pattern1(tile) && pattern2(tile);
}

/**
 * Matches a partial tile
 *
 * @param {Partial<Tile> & Pick<Tile, "type">} patternTile
 * @returns {Pattern}
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
 * @returns {Pattern}
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
 * @returns {Pattern}
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
 * @returns {Pattern}
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
 * @returns {Pattern}
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
 * @returns {Pattern}
 */
function isMovingPlayer(inputDirection) {
  return (tile) =>
    (tile.type === "Player") &&
    tile.isAlive &&
    (tile.inputDirection === inputDirection);
}

/**
 * @typedef {[0 | 1 | 2, 0 | 1 | 2]} RegionPoint
 * @typedef {[
 *   Tile, Tile, Tile,
 *   Tile, Tile, Tile,
 *   Tile, Tile, Tile
 * ]} TileRegion
 *
 * @typedef {(
 *   Omit<DeadPlayerTile, "justUpdated" | "conveyorDirection"> |
 *   Omit<DirtTile, "justUpdated" | "conveyorDirection"> |
 *   Omit<GenericTile, "justUpdated" | "conveyorDirection"> |
 *   Omit<LivingPlayerTile, "justUpdated" | "conveyorDirection"> |
 *   Omit<RockTile, "justUpdated" | "conveyorDirection"> |
 *   Omit<WaterTile, "justUpdated" | "conveyorDirection">
 * )} SimpleTile
 *
 * @callback TileUpdateCallback
 * @param {TileRegion} region The region that matched for this update
 * @returns {SimpleTile} The updated tile
 *
 * @typedef {TileUpdateCallback | null} TileUpdate
 */

/**
 * An empty tile after an update
 *
 * @returns {SimpleTile}
 */
function empty() {
  return { type: "Empty" };
}

/**
 * A dead player after an update
 *
 * @returns {SimpleTile}
 */
function deadPlayer() {
  return { type: "Player", isAlive: false };
}

/**
 * A player moved after an update
 *
 * @param {RegionPoint} originalLocation
 * @returns {TileUpdateCallback}
 */
function movedPlayer(originalLocation) {
  return (region) => {
    const tile = region[originalLocation[0] + 3 * originalLocation[1]];
    if (tile.type !== "Player") {
      throw new Error(
        `Expected player tile at (${originalLocation[0]}, ${originalLocation[1]}) but got ${tile.type}`
      );
    }

    if (tile.isAlive) {
      return {
        type: "Player",
        isAlive: tile.isAlive,
        inputDirection: "None",
      };
    }

    return { type: "Player", isAlive: tile.isAlive };
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
 * @typedef {[
 *   Pattern, Pattern, Pattern,
 *   Pattern, Pattern, Pattern,
 *   Pattern, Pattern, Pattern
 * ]} PatternRegion
 * @typedef {[
 *   TileUpdate, TileUpdate, TileUpdate,
 *   TileUpdate, TileUpdate, TileUpdate,
 *   TileUpdate, TileUpdate, TileUpdate
 * ]} TileUpdateRegion
 */

/** @type {[PatternRegion, TileUpdateRegion][]} */
export const patterns = [
  // Down conveyors move players down
  [
    [
      any, any, any,
      any, isConveyoredPlayer("Down"), any,
      any, isEmptyForPlayer, any,
    ],
    [
      null, null, null,
      null, empty, null,
      null, movedPlayer([1, 1]), null,
    ],
  ],
  // Down conveyored players kill other players
  [
    [
      any, any, any,
      any, isConveyoredPlayer("Down"), any,
      any, and(isLivingPlayer, not(isConveyoredPlayer("Down"))), any,
    ],
    [
      null, null, null,
      null, deadPlayer, null,
      null, deadPlayer, null,
    ],
  ],
  // Down conveyored players crash
  [
    [
      any, any, any,
      any, and(isLivingPlayer, isConveyoredPlayer("Down")), any,
      any, not(isEmptyForPlayer), any,
    ],
    [
      null, null, null,
      null, deadPlayer, null,
      null, null, null,
    ],
  ],
  // Left conveyors move players left
  [
    [
      any, any, any,
      isEmptyForPlayer, isConveyoredPlayer("Left"), any,
      any, any, any,
    ],
    [
      null, null, null,
      movedPlayer([1, 1]), empty, null,
      null, null, null,
    ],
  ],
  // Left conveyored players move rocks
  [
    [
      any, any, any,
      isEmptyForRock, isTile({ type: "Rock" }), isConveyoredPlayer("Left"),
      any, any, any,
    ],
    [
      null, null, null,
      rock("None"), movedPlayer([2, 1]), empty,
      null, null, null,
    ],
  ],
  // Left pushed rocks kill players
  [
    [
      any, any, any,
      isLivingPlayer, isTile({ type: "Rock" }), isConveyoredPlayer("Left"),
      any, any, any,
    ],
    [
      null, null, null,
      deadPlayer, null, deadPlayer,
      null, null, null,
    ],
  ],
  // Left conveyored players kill other players
  [
    [
      any, any, any,
      and(isLivingPlayer, not(isConveyoredPlayer("Left"))), isConveyoredPlayer("Left"), any,
      any, any, any,
    ],
    [
      null, null, null,
      deadPlayer, deadPlayer, null,
      null, null, null,
    ],
  ],
  // Left conveyored players crash
  [
    [
      any, any, any,
      any, not(isEmptyForPlayer), and(isLivingPlayer, isConveyoredPlayer("Left")),
      any, any, any,
    ],
    [
      null, null, null,
      null, null, deadPlayer,
      null, null, null,
    ],
  ],
  // Right conveyors move players right
  [
    [
      any, any, any,
      any, isConveyoredPlayer("Right"), isEmptyForPlayer,
      any, any, any,
    ],
    [
      null, null, null,
      null, empty, movedPlayer([1, 1]),
      null, null, null,
    ],
  ],
  // Right conveyored players move rocks
  [
    [
      any, any, any,
      isConveyoredPlayer("Right"), isTile({ type: "Rock" }), isEmptyForRock,
      any, any, any,
    ],
    [
      null, null, null,
      empty, movedPlayer([0, 1]), rock("None"),
      null, null, null,
    ],
  ],
  // Right pushed rocks kill players
  [
    [
      any, any, any,
      isConveyoredPlayer("Right"), isTile({ type: "Rock" }), isLivingPlayer,
      any, any, any,
    ],
    [
      null, null, null,
      deadPlayer, null, deadPlayer,
      null, null, null,
    ],
  ],
  // Right conveyored players kill other players
  [
    [
      any, any, any,
      any, isConveyoredPlayer("Right"), and(isLivingPlayer, not(isConveyoredPlayer("Right"))),
      any, any, any,
    ],
    [
      null, null, null,
      null, deadPlayer, deadPlayer,
      null, null, null,
    ],
  ],
  // Right conveyored players crash
  [
    [
      any, any, any,
      any, and(isLivingPlayer, isConveyoredPlayer("Right")), not(isEmptyForPlayer),
      any, any, any,
    ],
    [
      null, null, null,
      null, deadPlayer, null,
      null, null, null,
    ],
  ],
  // Up conveyors move players up
  [
    [
      any, isEmptyForPlayer, any,
      any, isConveyoredPlayer("Up"), any,
      any, any, any,
    ],
    [
      null, movedPlayer([1, 1]), null,
      null, empty, null,
      null, null, null,
    ],
  ],
  // Falling rocks kill up-conveyed players
  [
    [
      any, isEmptyForRock, any,
      any, isFallingRock, any,
      any, and(isLivingPlayer, isConveyoredPlayer("Up")), any,
    ],
    [
      null, rock("None"), null,
      null, deadPlayer, null,
      null, empty, null,
    ],
  ],
  // Up conveyored players move rocks
  [
    [
      any, isEmptyForRock, any,
      any, isTile({ type: "Rock" }), any,
      any, isConveyoredPlayer("Up"), any,
    ],
    [
      null, rock("None"), null,
      null, movedPlayer([1, 2]), null,
      null, empty, null,
    ],
  ],
  // Up pushed rocks kill players
  [
    [
      any, isLivingPlayer, any,
      any, isTile({ type: "Rock" }), any,
      any, isConveyoredPlayer("Up"), any,
    ],
    [
      null, deadPlayer, null,
      null, null, null,
      null, deadPlayer, null,
    ],
  ],
  // Up conveyored players kill other players
  [
    [
      any, and(isLivingPlayer, not(isConveyoredPlayer("Up"))), any,
      any, isConveyoredPlayer("Up"), any,
      any, any, any,
    ],
    [
      null, deadPlayer, null,
      null, deadPlayer, null,
      null, null, null,
    ],
  ],
  // Up conveyored players crash
  [
    [
      any, any, any,
      any, not(isEmptyForPlayer), any,
      any, and(isLivingPlayer, isConveyoredPlayer("Up")), any,
    ],
    [
      null, null, null,
      null, null, null,
      null, deadPlayer, null,
    ],
  ],
  // Rocks fall down
  [
    [
      any, any, any,
      any, isTile({ type: "Rock" }), any,
      any, isEmptyForRock, any,
    ],
    [
      null, null, null,
      null, empty, null,
      null, rock("Down"), null,
    ],
  ],
  // Rocks that fall down kill players and stop
  [
    [
      any, any, any,
      any, isFallingRock, any,
      any, isLivingPlayer, any,
    ],
    [
      null, null, null,
      null, rock("None"), null,
      null, deadPlayer, null,
    ],
  ],
  // Rocks fall left off a hard surface
  [
    [
      any, any, any,
      isEmptyForRock, isFallingRock, any,
      isEmptyForRock, not(isEmptyForRock), any,
    ],
    [
      null, null, null,
      null, empty, null,
      rock("DownLeft"), null, null,
    ],
  ],
  // Rocks falling left kill a player and stop
  [
    [
      any, any, any,
      isEmptyForRock, isFallingRock, any,
      isLivingPlayer, not(isEmptyForRock), any,
    ],
    [
      null, null, null,
      null, rock("None"), null,
      deadPlayer, null, null,
    ],
  ],
  // Rocks fall right off a hard surface
  [
    [
      any, any, any,
      any, isFallingRock, isEmptyForRock,
      any, not(isEmptyForRock), isEmptyForRock,
    ],
    [
      null, null, null,
      null, empty, null,
      null, null, rock("DownRight"),
    ],
  ],
  // Rocks falling right kill a player and stop
  [
    [
      any, any, any,
      any, isFallingRock, isEmptyForRock,
      any, not(isEmptyForRock), isLivingPlayer,
    ],
    [
      null, null, null,
      null, rock("None"), null,
      null, null, deadPlayer,
    ],
  ],
  // Falling rocks stop if there is no where to fall
  [
    [
      any, any, any,
      any, isFallingRock, any,
      any, any, any,
    ],
    [
      null, null, null,
      null, rock("None"), null,
      null, null, null,
    ],
  ],
  // Water flows down
  [
    [
      any, or(isTile({ type: "Water" }), isWaterloggedDirt), any,
      any, isTile({ type: "Empty" }), any,
      any, any, any,
    ],
    [
      null, null, null,
      null, water("Down"), null,
      null, null, null,
    ],
  ],
  // Water onto a surface
  [
    [
      any, or(isTile({ type: "Water" }), isWaterloggedDirt), any,
      any, isTile({ type: "Empty" }), any,
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, water("Both"), null,
      null, null, null,
    ],
  ],
  // Down-flowing water kills a player
  [
    [
      any, any, any,
      any, or(isTile({ type: "Water" }), isWaterloggedDirt), any,
      any, isLivingPlayer, any,
    ],
    [
      null, null, null,
      null, null, null,
      null, deadPlayer, null,
    ],
  ],
  // Down-ward flowing water converts to both when a surface is below it
  [
    [
      any, any, any,
      any, isFlowingWater("Down"), any,
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, water("Both"), null,
      null, null, null,
    ],
  ],
  // Both-ward flowing water converts to down when no surface is below it
  [
    [
      any, any, any,
      any, isFlowingWater("Both"), any,
      any, not(isSolidForWater), any,
    ],
    [
      null, null, null,
      null, water("Down"), null,
      null, null, null,
    ],
  ],
  // Water spreads right
  [
    [
      any, any, any,
      any, supportsFlowDirection("Right"), isTile({ type: "Empty" }),
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, null, water("Right"),
      null, null, null,
    ],
  ],
  // Right-flowing water kills a player
  [
    [
      any, any, any,
      any, or(isTile({ type: "Water" }), isWaterloggedDirt), isLivingPlayer,
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, null, deadPlayer,
      null, null, null,
    ],
  ],
  // Water spreads left
  [
    [
      any, any, any,
      any, isTile({ type: "Empty" }), and(supportsFlowDirection("Left"), not(wasJustUpdated)),
      any, any, isSolidForWater,
    ],
    [
      null, null, null,
      null, water("Left"), null,
      null, null, null,
    ],
  ],
  // Left-flowing water kills a player
  [
    [
      any, any, any,
      any, isLivingPlayer, and(or(isTile({ type: "Water" }), isWaterloggedDirt), not(wasJustUpdated)),
      any, any, isSolidForWater,
    ],
    [
      null, null, null,
      null, deadPlayer, null,
      null, null, null,
    ],
  ],
  // Both-flowing and down-flowing water dries if it doesn't have a source or
  // down-flowing water above it
  [
    [
      any, not(or(isTile({ type: "Water" }), isWaterloggedDirt)), any,
      any, or(isFlowingWater("Both"), isFlowingWater("Down")), any,
      any, any, any,
    ],
    [
      null, null, null,
      null, empty, null,
      null, null, null,
    ],
  ],
  // Right-flowing water dries if it doesn't have a source or right-flowing
  // water to its right
  [
    [
      any, any, any,
      not(supportsFlowDirection("Right")), isFlowingWater("Right"), any,
      any, any, any,
    ],
    [
      null, null, null,
      null, empty, null,
      null, null, null,
    ],
  ],
  // Left-flowing water dries if it doesn't have a source or left-flowing
  // water to its left
  [
    [
      any, any, any,
      any, isFlowingWater("Left"), and(not(supportsFlowDirection("Left")), not(wasJustUpdated)),
      any, any, any,
    ],
    [
      null, null, null,
      null, empty, null,
      null, null, null,
    ],
  ],
  // Water waterlogs dirt from the top
  [
    [
      any, or(isTile({ type: "Water" }), isWaterloggedDirt), any,
      any, isTile({ type: "Dirt", flowDirection: "None" }), any,
      any, not(isSolidForWater), any,
    ],
    [
      null, null, null,
      null, dirt("Down"), null,
      null, null, null,
    ],
  ],
  // Waterlogged dirt flows onto a surface
  [
    [
      any, or(isTile({ type: "Water" }), isWaterloggedDirt), any,
      any, isTile({ type: "Dirt", flowDirection: "None" }), any,
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, dirt("Both"), null,
      null, null, null,
    ],
  ],
  // Down-ward flowing waterlogged dirt converts to both when a surface is below it
  [
    [
      any, any, any,
      any, isDirtFlowing("Down"), any,
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, dirt("Both"), null,
      null, null, null,
    ],
  ],
  // Both-ward flowing waterlogged dirt converts to down when no surface is below it
  [
    [
      any, any, any,
      any, isDirtFlowing("Both"), any,
      any, not(isSolidForWater), any,
    ],
    [
      null, null, null,
      null, dirt("Down"), null,
      null, null, null,
    ],
  ],
  // Water waterlogs to the right
  [
    [
      any, any, any,
      any, supportsFlowDirection("Right"), isTile({ type: "Dirt", flowDirection: "None" }),
      any, isSolidForWater, any,
    ],
    [
      null, null, null,
      null, null, dirt("Right"),
      null, null, null,
    ],
  ],
  // Water waterlogs to the left
  [
    [
      any, any, any,
      any, isTile({ type: "Dirt", flowDirection: "None" }), and(or(isTile({ type: "Water" }), isWaterloggedDirt), not(wasJustUpdated)),
      any, any, isSolidForWater,
    ],
    [
      null, null, null,
      null, dirt("Left"), null,
      null, null, null,
    ],
  ],
  // Both-flowing and down-flowing water dries if it doesn't have a source or
  // down-flowing water above it
  [
    [
      any, not(or(isTile({ type: "Water" }), isWaterloggedDirt)), any,
      any, or(isDirtFlowing("Both"), isDirtFlowing("Down")), any,
      any, any, any,
    ],
    [
      null, null, null,
      null, dirt("None"), null,
      null, null, null,
    ],
  ],
  // Right-flowing water dries if it doesn't have a source or right-flowing
  // water to its right
  [
    [
      any, any, any,
      not(supportsFlowDirection("Right")), isDirtFlowing("Right"), any,
      any, any, any,
    ],
    [
      null, null, null,
      null, dirt("None"), null,
      null, null, null,
    ],
  ],
  // Left-flowing water dries if it doesn't have a source or left-flowing
  // water to its left
  [
    [
      any, any, any,
      any, isDirtFlowing("Left"), and(not(supportsFlowDirection("Left")), not(wasJustUpdated)),
      any, any, any,
    ],
    [
      null, null, null,
      null, dirt("None"), null,
      null, null, null,
    ],
  ],
  // Down-moving players move into empty spaces
  [
    [
      any, any, any,
      any, isMovingPlayer("Down"), any,
      any, isEmptyForPlayer, any,
    ],
    [
      null, null, null,
      null, empty, null,
      null, movedPlayer([1, 1]), null,
    ],
  ],
  // Down-moving players are stopped by non-empty spaces
  [
    [
      any, any, any,
      any, isMovingPlayer("Down"), any,
      any, not(isEmptyForPlayer), any,
    ],
    [
      null, null, null,
      null, movedPlayer([1, 1]), null,
      null, null, null,
    ],
  ],
  // Left-moving players move into empty spaces
  [
    [
      any, any, any,
      isEmptyForPlayer, isMovingPlayer("Left"), any,
      any, any, any,
    ],
    [
      null, null, null,
      movedPlayer([1, 1]), empty, null,
      null, null, null,
    ],
  ],
  // Left-moving players push rocks into empty spaces
  [
    [
      any, any, any,
      isEmptyForRock, isStationaryRock, isMovingPlayer("Left"),
      any, any, any,
    ],
    [
      null, null, null,
      rock("None"), movedPlayer([2, 1]), empty,
      null, null, null,
    ],
  ],
  // Left-moving players are stopped by non-empty spaces
  [
    [
      any, any, any,
      any, not(isEmptyForPlayer), isMovingPlayer("Left"),
      any, any, any,
    ],
    [
      null, null, null,
      null, null, movedPlayer([2, 1]),
      null, null, null,
    ],
  ],
  // Right-moving players move into empty spaces
  [
    [
      any, any, any,
      any, isMovingPlayer("Right"), isEmptyForPlayer,
      any, any, any,
    ],
    [
      null, null, null,
      null, empty, movedPlayer([1, 1]),
      null, null, null,
    ],
  ],
  // Right-moving players push rocks into empty spaces
  [
    [
      any, any, any,
      isMovingPlayer("Right"), isStationaryRock, isEmptyForRock,
      any, any, any,
    ],
    [
      null, null, null,
      empty, movedPlayer([0, 1]), rock("None"),
      null, null, null,
    ],
  ],
  // Right-moving players are stopped by non-empty spaces
  [
    [
      any, any, any,
      isMovingPlayer("Right"), not(isEmptyForPlayer), any,
      any, any, any,
    ],
    [
      null, null, null,
      movedPlayer([0, 1]), null, null,
      null, null, null,
    ],
  ],
  // Up-moving players move into empty spaces
  [
    [
      any, isEmptyForPlayer, any,
      any, isMovingPlayer("Up"), any,
      any, any, any,
    ],
    [
      null, movedPlayer([1, 1]), null,
      null, empty, null,
      null, null, null,
    ],
  ],
  // Up-moving players push rocks into empty spaces
  [
    [
      any, isEmptyForRock, any,
      any, isStationaryRock, any,
      any, isMovingPlayer("Up"), any,
    ],
    [
      null, rock("None"), null,
      null, movedPlayer([1, 2]), null,
      null, empty, null,
    ],
  ],
  // Up-moving players are stopped by non-emtpy spaces
  [
    [
      any, any, any,
      any, not(isEmptyForPlayer), any,
      any, isMovingPlayer("Up"), any,
    ],
    [
      null, null, null,
      null, null, null,
      null, movedPlayer([1, 2]), null,
    ],
  ],
];

/**
 * Whether a region matches a given tile pattern
 *
 * @param {TileRegion} region
 * @param {PatternRegion} pattern
 */
function matcher(region, pattern) {
  for (let index = 0; index < region.length; ++index) {
    if (!pattern[index](region[index])) {
      return false;
    }
  }

  return true;
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
 * Gets the 3x3 region centered at a given point
 *
 * @param {Board} board
 * @param {Point} pt
 * @returns {TileRegion}
 */
function getPointCenteredRegion(board, pt) {
  return [
    board.getTile([pt[0] - 1, pt[1] - 1]),
    board.getTile([pt[0], pt[1] - 1]),
    board.getTile([pt[0] + 1, pt[1] - 1]),
    board.getTile([pt[0] - 1, pt[1]]),
    board.getTile([pt[0], pt[1]]),
    board.getTile([pt[0] + 1, pt[1]]),
    board.getTile([pt[0] - 1, pt[1] + 1]),
    board.getTile([pt[0], pt[1] + 1]),
    board.getTile([pt[0] + 1, pt[1] + 1]),
  ];
}

/**
 * Applies a tile update
 *
 * @param {Tile} tile
 * @param {TileRegion} region
 * @param {TileUpdate} tileUpdate
 */
function applyTileUpdate(tile, region, tileUpdate) {
  return tileUpdate ? {
    ...tileUpdate(region),
    justUpdated: true,
    conveyorDirection: tile.conveyorDirection
  } : tile;
}

/**
 *
 * @param {Board} board
 * @param {Point} pt
 * @param {TileRegion} region
 * @param {TileUpdate[]} updates
 */
function applyRegionUpdates(board, pt, region, updates) {
  /** @type {Point[]} */
  const updatedPoints = [];

  for (let y = -1; y < 2; ++y) {
    for (let x = -1; x < 2; ++x) {
      const update = updates[(x + 1) + 3 * (y + 1)];

      /** @type {Point} */
      const currentPoint = [pt[0] + x, pt[1] + y];

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
    for (const [pattern, updates] of patterns) {
      if (matcher(region, pattern)) {
        updatedPoints.push(
          ...applyRegionUpdates(board, point, region, updates)
        );
        break;
      }
    }
  }

  return updatedPoints;
}
