import { Board } from "./board.js";

/**
 * @typedef {import("./board.js").Direction} Direction
 * @typedef {import("./board.js").FlowDirection} FlowDirection
 * @typedef {import("./board.js").Tile} Tile
 * @typedef {[number, number]} Point
 */

export class State {
  /**
   * @param {Board} board
   */
  constructor(board) {
    /** @type {Board} */
    this.board = board;

    /** @type {number} */
    this.collected = 0;

    /** @type {Point[]} */
    this.updatedTiles = [];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {Tile} tile
   */
  setTile(x, y, tile) {
    this.board.setTile(x, y, tile);
    this.addUpdatedTile(x, y);
    this.addUpdatedTile(x - 1, y);
    this.addUpdatedTile(x - 1, y - 1);
    this.addUpdatedTile(x - 1, y + 1);
    this.addUpdatedTile(x + 1, y);
    this.addUpdatedTile(x + 1, y - 1);
    this.addUpdatedTile(x + 1, y + 1);
    this.addUpdatedTile(x, y - 1);
    this.addUpdatedTile(x, y + 1);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  addUpdatedTile(x, y) {
    if (
      this.board.isInBounds(x, y) &&
      this.updatedTiles.every(point => point[0] !== x || point[1] !== y)
    ) {
      this.updatedTiles.push([x, y]);
    }
  }

  updateEntireBoard() {
    this.updatedTiles = [];

    for (let y = this.board.height - 1; y >= 0; --y) {
      for (let x = this.board.width - 1; x >= 0; --x) {
        this.updatedTiles.push([x, y]);
      }
    }
  }
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
 * Whether a rock can move through the tile
 *
 * @param {Tile} tile
 */
function canRockMoveThrough(tile) {
  return isEmptyForRock(tile) ||
    tile.type === "Player" ||
    (tile.type === "Rock" && tile.fallingDirection !== "None");
}

/**
 * Gets the next point in a given direction
 *
 * @param {number} x
 * @param {number} y
 * @param {Direction} direction
 * @returns {Point}
 */
function nextCoordinateInDirection(x, y, direction) {
  let newX = x;
  let newY = y;

  switch (direction) {
    case "Up":
      --newY;
      break;

    case "Left":
      --newX;
      break;

    case "Down":
      ++newY;
      break;

    case "Right":
      ++newX;
      break;

    case "DownLeft":
      --newX;
      ++newY;
      break;

    case "DownRight":
      ++newX;
      ++newY;
      break;
  }

  return [newX, newY];
}

/**
 * Whether a player can move to the given location
 *
 * @param {Board} board
 * @param {number} x
 * @param {number} y
 * @param {Direction} direction
 */
function canMoveToLocation(board, x, y, direction) {
  const tile = board.getTile(x, y);
  if (
    tile.type === "Wall" ||
    tile.type === "Player" ||
    tile.type === "Water"
  ) {
    return false;
  } else if (tile.type === "Rock") {
    const [nextX, nextY] = nextCoordinateInDirection(x, y, direction);
    if (!board.isInBounds(nextX, nextY)) {
      return false;
    }

    const nextTile = board.getTile(nextX, nextY);
    return nextTile.type !== "Player" && canRockMoveThrough(nextTile);
  }

  return true;
}

/**
 * Moves the player in the given direction
 *
 * @param {State} state
 * @param {Direction} direction
 * @returns {Point[]} the points that were updated
 */
export function movePlayer(state, direction) {
  const playerPositions = state.board.tiles.
    map((tile, index) => ({ tile, index })).
    filter(({ tile }) => tile.type === "Player" && tile.isAlive).
    map(({ tile, index }) => ({
      tile,
      x: index % state.board.width,
      y: Math.floor(index / state.board.width),
    }));

  playerPositions.sort((a, b) => {
    if (direction === "Up") {
      return a.y - b.y;
    } else if (direction === "Left") {
      return a.x - b.x;
    } else if (direction === "Down") {
      return b.y - a.y;
    }

    return b.x - a.x;
  });

  /** @type {Point[]} */
  const updatedPoints = [];
  for (const { tile: playerTile, x, y } of playerPositions) {
    const [newX, newY] = nextCoordinateInDirection(x, y, direction);

    if (canMoveToLocation(state.board, newX, newY, direction)) {
      const tile = state.board.getTile(newX, newY);
      if (tile.type === "Collectable") {
        ++state.collected;
      }

      state.setTile(x, y, Board.EMPTY_TILE);
      state.setTile(newX, newY, playerTile);

      updatedPoints.push([x, y]);
      updatedPoints.push([newX, newY]);

      if (tile.type === "Rock") {
        const [nextX, nextY] = nextCoordinateInDirection(
          newX,
          newY,
          direction
        );
        state.setTile(nextX, nextY, tile);
        updatedPoints.push([nextX, nextY]);
      }
    }
  }

  return updatedPoints;
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
 * Gets the falling direction for a rock at a given point
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 * @returns {"Down" | "DownLeft" | "DownRight" | "None"}
 */
function getFallingDirection(state, x, y) {
  const tileBelow = state.board.getTile(x, y + 1);
  if (canRockMoveThrough(tileBelow)) {
    return "Down";
  } else if (tileBelow.type === "Rock") {
    const tileLeft = state.board.getTile(x - 1, y);
    const tileBelowLeft = state.board.getTile(x - 1, y + 1);
    if (canRockMoveThrough(tileLeft) && canRockMoveThrough(tileBelowLeft)) {
      return "DownLeft";
    }

    const tileRight = state.board.getTile(x + 1, y);
    const tileBelowRight = state.board.getTile(x + 1, y + 1);
    if (canRockMoveThrough(tileRight) && canRockMoveThrough(tileBelowRight)) {
      return "DownRight";
    }
  }

  return "None";
}

/**
 * Whether a tile behaves as if it were solid for water
 *
 * @param {Tile} tile
 */
function isSolidForWater(tile) {
  return tile.type !== "Empty" && tile.type !== "Water";
}

/**
 * Whether a flow direction is down
 *
 * @param {FlowDirection} flowDirection
 */
function isFlowingDown(flowDirection) {
  return flowDirection === "Down" ||
    flowDirection === "DownFromBoth" ||
    flowDirection === "DownFromLeft" ||
    flowDirection === "DownFromRight";
}

/**
 * Whether a flow direction is left
 *
 * @param {FlowDirection} flowDirection
 */
function isFlowingLeft(flowDirection) {
  return flowDirection === "Left" || flowDirection === "Both";
}

/**
 * Whether a flow direction is right
 *
 * @param {FlowDirection} flowDirection
 */
function isFlowingRight(flowDirection) {
  return flowDirection === "Right" || flowDirection === "Both";
}

/**
 * Whether a water tile has an input of water which can sustain its flow
 * @param {State} state
 * @param {number} x
 * @param {number} y
 */
function canSustainFlow(state, x, y) {
  const tile = state.board.getTile(x, y);
  if (tile.type !== "Water") {
    return false;
  }

  if (tile.isSource) {
    return true;
  }

  const tileAbove = state.board.getTile(x, y - 1);
  if (tileAbove.type === "Water") {
    return true;
  }

  const tileLeft = state.board.getTile(x - 1, y);
  if (tileLeft.type === "Water" && isFlowingRight(tileLeft.flowDirection)) {
    return true;
  }

  const tileRight = state.board.getTile(x + 1, y);
  if (tileRight.type === "Water" && isFlowingLeft(tileRight.flowDirection)) {
    return true;
  }

  return false;
}

/**
 * Gets the flowing direction for water at a given point
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 * @returns {FlowDirection}
 */
function getFlowDirection(state, x, y) {
  const tile = state.board.getTile(x, y)
  if (tile.type !== "Water") {
    return "None";
  }

  const tileBelow = state.board.getTile(x, y + 1);
  const tileLeft = state.board.getTile(x - 1, y);
  const tileRight = state.board.getTile(x + 1, y);
  if (isSolidForWater(tileBelow)) {
    if (isSolidForWater(tileLeft) && isSolidForWater(tileRight)) {
      return "None";
    } else if (isSolidForWater(tileLeft) && !(tileRight.type === "Water" && isFlowingLeft(tileRight.flowDirection))) {
      return "Right";
    } else if (isSolidForWater(tileRight) && !(tileLeft.type === "Water" && isFlowingRight(tileLeft.flowDirection))) {
      return "Left";
    }

    const tileAbove = state.board.getTile(x, y - 1);
    if (tile.isSource || tileAbove.type === "Water") {
      return "Both";
    } else if (tileLeft.type === "Water" && isFlowingRight(tileLeft.flowDirection)) {
      return "Right";
    } else if (tileRight.type === "Water" && isFlowingLeft(tileRight.flowDirection)) {
      return "Left";
    }

    return "None";
  }

  if (tile.isSource) {
    return "Down";
  } else if (tileLeft.type === "Water" && tileRight.type === "Water") {
    return "DownFromBoth";
  } else if (tileLeft.type === "Water") {
    return "DownFromRight";
  } else if (tileRight.type === "Water") {
    return "DownFromLeft";
  }

  return "Down";
}

/**
 * Updates state to account for flowing water
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 * @param {FlowDirection} flowDirection
 * @returns {Point[]} the points that were updated
 */
function flowWater(state, x, y, flowDirection) {
  if (isFlowingDown(flowDirection)) {
    const tileBelow = state.board.getTile(x, y + 1);
    if (tileBelow.type === "Empty") {
      state.setTile(
        x,
        y + 1,
        {
          type: "Water",
          isSource: false,
          flowDirection: "Down",
        }
      );

      return [
        [x, y + 1],
      ];
    }
  }

  if (isFlowingLeft(flowDirection)) {
    const tileLeft = state.board.getTile(x - 1, y);
    if (tileLeft.type === "Empty") {
      state.setTile(
        x - 1,
        y,
        {
          type: "Water",
          isSource: false,
          flowDirection: "Left",
        }
      );

      return [
        [x - 1, y],
      ];
    }
  }

  if (isFlowingRight(flowDirection)) {
    const tileRight = state.board.getTile(x + 1, y);
    if (tileRight.type === "Empty") {
      state.setTile(
        x + 1,
        y,
        {
          type: "Water",
          isSource: false,
          flowDirection: "Right",
        }
      );

      return [
        [x + 1, y],
      ];
    }
  }

  return [];
}

/**
 * Updates a single tile based on the region around it
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 * @returns {Point[]} the points that were updated
 */
function updateTile(state, x, y) {
  const tile = state.board.getTile(x, y);
  const tileAbove = state.board.getTile(x, y - 1);
  const tileAboveRight = state.board.getTile(x + 1, y - 1);
  const tileAboveLeft = state.board.getTile(x - 1, y - 1);
  const tileLeft = state.board.getTile(x - 1, y);
  const tileRight = state.board.getTile(x + 1, y);
  const tileBelow = state.board.getTile(x, y + 1);
  const tileBelowRight = state.board.getTile(x + 1, y + 1);
  const tileBelowLeft = state.board.getTile(x - 1, y + 1);
  if (tile.type === "Player") {
    if (
      (tileAbove.type === "Rock" && tileAbove.fallingDirection === "Down") ||
      (
        tileAboveLeft.type === "Rock" &&
        tileAboveLeft.fallingDirection === "DownRight"
      ) ||
      (
        tileAboveRight.type === "Rock" &&
        tileAboveRight.fallingDirection === "DownLeft"
      ) ||
      (tileAbove.type === "Water") ||
      (tileRight.type === "Water" && !isFlowingLeft(tileRight.flowDirection)) ||
      (tileLeft.type === "Water" && !isFlowingRight(tileLeft.flowDirection))
    ) {
      tile.isAlive = false;
      return [[x, y]];
    }
  } else if (tile.type === "Rock") {
    if (isEmptyForRock(tileBelow)) {
      state.setTile(
        x,
        y + 1,
        {
          type: "Rock",
          fallingDirection: getFallingDirection(state, x, y + 1),
        }
      );
      state.setTile(x, y, Board.EMPTY_TILE);

      return [
        [x, y + 1],
        [x, y],
      ];
    } else if (
      tile.fallingDirection !== "None" &&
      tileBelow.type === "Rock" &&
      tileBelow.fallingDirection === "None"
    ) {
      const fallingDirection = getFallingDirection(state, x, y);
      if (fallingDirection === "None") {
        tile.fallingDirection = fallingDirection;
        return [[x, y]];
      } else if (
        tileLeft.type === "Empty" &&
        tileBelowLeft.type === "Empty"
      ) {
        state.setTile(
          x - 1,
          y + 1,
          {
            type: "Rock",
            fallingDirection: getFallingDirection(state, x - 1, y + 1),
          }
        );
        state.setTile(x, y, Board.EMPTY_TILE);

        return [
          [x - 1, y + 1],
          [x, y],
        ];
      } else if (
        tileRight.type === "Empty" &&
        tileBelowRight.type === "Empty"
      ) {
        state.setTile(
          x + 1,
          y + 1,
          {
            type: "Rock",
            fallingDirection: getFallingDirection(state, x + 1, y + 1),
          }
        );
        state.setTile(x, y, Board.EMPTY_TILE);

        return [
          [x + 1, y + 1],
          [x, y],
        ];
      }
    }
  } else if (tile.type === "Water") {
    if (!canSustainFlow(state, x, y)) {
      state.setTile(x, y, Board.EMPTY_TILE);

      return [
        [x, y],
      ];
    }

    const flowDirection = getFlowDirection(state, x, y);

    /** @type {Point[]} */
    const updatedPoints = [];
    if (flowDirection !== tile.flowDirection) {
      tile.flowDirection = flowDirection;

      updatedPoints.push([x, y]);
    }

    updatedPoints.push(...flowWater(state, x, y, flowDirection));
    return updatedPoints;
  }

  return [];
}

/**
 * Whether two points are equal
 *
 * @param {Point} u
 * @param {Point} v
 */
function arePointsEqual(u, v) {
  return u[0] === v[0] && u[1] === v[1];
}

/**
 * Applies updates to each tile that needs an update
 *
 * @param {State} state
 * @returns {Point[]} the points that were updated
 */
export function applyTileUpdates(state) {
  const sortedUpdatedTiles = reverseSortPoints(state.updatedTiles);

  state.updatedTiles = [];

  /** @type {Point[]} */
  const updatedPoints = [];
  for (const point of sortedUpdatedTiles) {
    if (!updatedPoints.some(updatedPoint => arePointsEqual(updatedPoint, point))) {
      updatedPoints.push(...updateTile(state, point[0], point[1]));
    }
  }

  return updatedPoints;
}
