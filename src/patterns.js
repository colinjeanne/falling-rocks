/**
 * @typedef {import("./tile.js").DirtTile} DirtTile
 * @typedef {import("./tile.js").FlowDirection} FlowDirection
 * @typedef {import("./tile.js").GenericTile} GenericTile
 * @typedef {import("./tile.js").PlayerTile} PlayerTile
 * @typedef {import("./tile.js").RockTile} RockTile
 * @typedef {import("./tile.js").Tile} Tile
 * @typedef {import("./tile.js").WaterTile} WaterTile
 * @typedef {import("./matcher.js").Pattern} Pattern
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
 * @typedef {(
 *   Omit<DirtTile, "justUpdated"> |
 *   Omit<GenericTile, "justUpdated"> |
 *   Omit<PlayerTile, "justUpdated"> |
 *   Omit<RockTile, "justUpdated"> |
 *   Omit<WaterTile, "justUpdated"> |
 *   null
 * )} TileUpdate
 */

/**
 * Applies a tile update
 *
 * @param {Tile} tile
 * @param {TileUpdate} tileUpdate
 */
export function applyTileUpdate(tile, tileUpdate) {
  return tileUpdate ? { ...tileUpdate, justUpdated: true } : tile;
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
  // Rocks fall down
  [
    [
      any, any, any,
      any, isTile({ type: "Rock" }), any,
      any, isEmptyForRock, any,
    ],
    [
      null, null, null,
      null, { type: "Empty" }, null,
      null, { type: "Rock", fallingDirection: "Down" }, null,
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
      null, { type: "Rock", fallingDirection: "None" }, null,
      null, { type: "Player", isAlive: false }, null,
    ],
  ],
  // Rocks wait for other falling rocks to fall left off a rock below them
  [
    [
      any, any, any,
      isFallingRock, isFallingRock, any,
      or(isEmptyForRock, isFallingRock), isTile({ type: "Rock" }), any,
    ],
    [
      null, null, null,
      null, { type: "Rock", fallingDirection: "DownLeft" }, null,
      null, null, null,
    ],
  ],
  // Rocks wait for other falling rocks to fall left off a rock below them
  [
    [
      any, any, any,
      any, isFallingRock, any,
      isFallingRock, isTile({ type: "Rock" }), any,
    ],
    [
      null, null, null,
      null, { type: "Rock", fallingDirection: "DownLeft" }, null,
      null, null, null,
    ],
  ],
  // Rocks wait for other falling rocks to fall right off a rock below them
  [
    [
      any, any, any,
      not(isEmptyForRock), isFallingRock, isFallingRock,
      any, isTile({ type: "Rock" }), or(isEmptyForRock, isFallingRock),
    ],
    [
      null, null, null,
      null, { type: "Rock", fallingDirection: "DownRight" }, null,
      null, null, null,
    ],
  ],
  // Rocks wait for other falling rocks to fall right off a rock below them
  [
    [
      any, any, any,
      not(isEmptyForRock), isFallingRock, any,
      any, isTile({ type: "Rock" }), isFallingRock,
    ],
    [
      null, null, null,
      null, { type: "Rock", fallingDirection: "DownRight" }, null,
      null, null, null,
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
      null, { type: "Empty" }, null,
      { type: "Rock", fallingDirection: "DownLeft" }, null, null,
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
      null, { type: "Rock", fallingDirection: "None" }, null,
      { type: "Player", isAlive: false }, null, null,
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
      null, { type: "Empty" }, null,
      null, null, { type: "Rock", fallingDirection: "DownRight" },
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
      null, { type: "Rock", fallingDirection: "None" }, null,
      null, null, { type: "Player", isAlive: false },
    ],
  ],
  // Falling rocks stop if there is no where to fall
  [
    [
      any, any, any,
      any, isFallingRock, any,
      not(isEmptyForRock), not(isEmptyForRock), not(isEmptyForRock),
    ],
    [
      null, null, null,
      null, { type: "Rock", fallingDirection: "None" }, null,
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
      null, { type: "Water", flowDirection: "Down" }, null,
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
      null, { type: "Water", flowDirection: "Both" }, null,
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
      null, { type: "Player", isAlive: false }, null,
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
      null, { type: "Water", flowDirection: "Both" }, null,
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
      null, { type: "Water", flowDirection: "Down" }, null,
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
      null, null, { type: "Water", flowDirection: "Right" },
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
      null, null, { type: "Player", isAlive: false },
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
      null, { type: "Water", flowDirection: "Left" }, null,
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
      null, { type: "Player", isAlive: false }, null,
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
      null, { type: "Empty" }, null,
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
      null, { type: "Empty" }, null,
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
      null, { type: "Empty" }, null,
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
      null, { type: "Dirt", flowDirection: "Down" }, null,
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
      null, { type: "Dirt", flowDirection: "Both" }, null,
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
      null, { type: "Dirt", flowDirection: "Both" }, null,
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
      null, { type: "Dirt", flowDirection: "Down" }, null,
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
      null, null, { type: "Dirt", flowDirection: "Right" },
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
      null, { type: "Dirt", flowDirection: "Left" }, null,
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
      null, { type: "Dirt", flowDirection: "None" }, null,
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
      null, { type: "Dirt", flowDirection: "None" }, null,
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
      null, { type: "Dirt", flowDirection: "None" }, null,
      null, null, null,
    ],
  ],
];
