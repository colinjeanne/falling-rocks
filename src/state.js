import { Board } from "./board.js";
import { matcher } from "./matcher.js";
import { patterns, applyTileUpdate } from "./patterns.js";

/**
 * @typedef {import("./board.js").Direction} Direction
 * @typedef {import("./board.js").FlowDirection} FlowDirection
 * @typedef {import("./board.js").Tile} Tile
 * @typedef {import("./patterns.js").TileUpdate} TileUpdate
 * @typedef {[number, number]} Point
 *
 * @typedef {"Lose" | "In Progress" | "Win"} GameState
 */

export class State {
  /**
   * @param {Board} board
   */
  constructor(board) {
    /** @type {Board} */
    this.board = board;

    /** @type {Board} */
    this.originalBoard = this.board.clone();

    /** @type {number} */
    this.collected = 0;

    /** @type {Point[]} */
    this.updatedTiles = [];
  }

  get collectablesRemaining() {
    return this.board.tiles.filter(tile => tile.type === "Collectable").length;
  }

  /**
   * The current state of the game
   *
   * @returns {GameState}
  */
  get gameState() {
    if (!this.board.tiles.some(tile => tile.type === "Player" && tile.isAlive)) {
      return "Lose"
    }

    if ((this.collectablesRemaining === 0) && (this.updatedTiles.length === 0)) {
      return "Win";
    }

    return "In Progress";
  }

  reset() {
    this.board = this.originalBoard.clone();
    this.collected = 0;
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

  clearJustUpdated() {
    for (let y = 0; y < this.board.height; ++y) {
      for (let x = 0; x < this.board.width; ++x) {
        this.board.getTile(x, y).justUpdated = false;
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
    tile.type === "Water" ||
    (tile.type === "Dirt" && tile.flowDirection !== "None")
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
 * Gets the 3x3 region centered at a given point
 *
 * @param {Board} board
 * @param {Point} point
 */
function getPointCenteredRegion(board, point) {
  return [
    board.getTile(point[0] - 1, point[1] - 1),
    board.getTile(point[0], point[1] - 1),
    board.getTile(point[0] + 1, point[1] - 1),
    board.getTile(point[0] - 1, point[1]),
    board.getTile(point[0], point[1]),
    board.getTile(point[0] + 1, point[1]),
    board.getTile(point[0] - 1, point[1] + 1),
    board.getTile(point[0], point[1] + 1),
    board.getTile(point[0] + 1, point[1] + 1),
  ];
}

/**
 *
 * @param {State} state
 * @param {Point} point
 * @param {TileUpdate[]} updates
 */
function applyRegionUpdates(state, point, updates) {
  /** @type {Point[]} */
  const updatedPoints = [];

  for (let y = -1; y < 2; ++y) {
    for (let x = -1; x < 2; ++x) {
      const update = updates[(x + 1) + 3 * (y + 1)];

      /** @type {Point} */
      const currentPoint = [point[0] + x, point[1] + y];

      if (update) {
        updatedPoints.push(currentPoint);

        state.setTile(
          currentPoint[0],
          currentPoint[1],
          applyTileUpdate(
            state.board.getTile(currentPoint[0], currentPoint[1]),
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
 * @param {State} state
 * @returns {Point[]} the points that were updated
 */
export function applyPatternTileUpdates(state) {
  const sortedUpdatedTiles = reverseSortPoints(state.updatedTiles);

  state.updatedTiles = [];

  /** @type {Point[]} */
  const updatedPoints = [];
  for (const point of sortedUpdatedTiles) {
    const region = getPointCenteredRegion(state.board, point);
    for (const [pattern, updates] of patterns) {
      if (matcher(region, pattern)) {
        updatedPoints.push(...applyRegionUpdates(state, point, updates));
        break;
      }
    }
  }

  state.clearJustUpdated();

  return updatedPoints;
}
