import { Board } from "./board.js";
import { matcher } from "./matcher.js";
import { patterns, applyTileUpdate } from "./patterns.js";

/**
 * @typedef {import("./board.js").Point} Point
 * @typedef {import("./tile.js").Direction} Direction
 * @typedef {import("./tile.js").PlayerTile} PlayerTile
 * @typedef {import("./tile.js").RockTile} RockTile
 * @typedef {import("./tile.js").Tile} Tile
 * @typedef {import("./patterns.js").TileUpdate} TileUpdate
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
   * @param {Point} pt
   * @param {Tile} tile
   */
  setTile(pt, tile) {
    this.board.setTile(pt, tile);
    this.addUpdatedTile(pt);
    this.addUpdatedTile([pt[0] - 1, pt[1]]);
    this.addUpdatedTile([pt[0] - 1, pt[1] - 1]);
    this.addUpdatedTile([pt[0] - 1, pt[1] + 1]);
    this.addUpdatedTile([pt[0] + 1, pt[1]]);
    this.addUpdatedTile([pt[0] + 1, pt[1] - 1]);
    this.addUpdatedTile([pt[0] + 1, pt[1] + 1]);
    this.addUpdatedTile([pt[0], pt[1] - 1]);
    this.addUpdatedTile([pt[0], pt[1] + 1]);
  }

  /**
   * @param {Point} pt
   */
  addUpdatedTile(pt) {
    if (
      this.board.isInBounds(pt) &&
      this.updatedTiles.every(
        point => point[0] !== pt[0] || point[1] !== pt[1]
      )
    ) {
      this.updatedTiles.push(pt);
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
        this.board.getTile([x, y]).justUpdated = false;
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
 * @param {Point} pt
 * @param {Direction} direction
 * @returns {Point}
 */
function nextCoordinateInDirection(pt, direction) {
  let newX = pt[0];
  let newY = pt[1];

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
 * @param {Point} pt
 * @param {Direction} direction
 */
function canMoveToLocation(board, pt, direction) {
  const tile = board.getTile(pt);
  if (
    tile.type === "Wall" ||
    tile.type === "Player" ||
    tile.type === "Water" ||
    (tile.type === "Dirt" && tile.flowDirection !== "None")
  ) {
    return false;
  } else if (tile.type === "Rock") {
    const next = nextCoordinateInDirection(pt, direction);
    if (!board.isInBounds(next)) {
      return false;
    }

    const nextTile = board.getTile(next);
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
      pt: /** @type {Point} */ ([
        index % state.board.width,
        Math.floor(index / state.board.width),
      ]),
    }));

  playerPositions.sort((a, b) => {
    if (direction === "Up") {
      return a.pt[1] - b.pt[1];
    } else if (direction === "Left") {
      return a.pt[0] - b.pt[0];
    } else if (direction === "Down") {
      return b.pt[1] - a.pt[1];
    }

    return b.pt[0] - a.pt[0];
  });

  /** @type {Point[]} */
  const updatedPoints = [];
  for (const { tile: playerTile, pt } of playerPositions) {
    const newPoint = nextCoordinateInDirection(pt, direction);

    if (canMoveToLocation(state.board, newPoint, direction)) {
      const tile = state.board.getTile(newPoint);
      if (tile.type === "Collectable") {
        ++state.collected;
      }

      /** @type {Tile} */
      const newEmptyTile = {
        type: "Empty",
        justUpdated: false,
        conveyorDirection: playerTile.conveyorDirection,
      };

      /** @type {PlayerTile} */
      const newPlayerTile = {
        type: "Player",
        isAlive: true,
        justUpdated: false,
        conveyorDirection: tile.conveyorDirection,
      };

      state.setTile(pt, newEmptyTile);
      state.setTile(newPoint, newPlayerTile);

      updatedPoints.push(pt);
      updatedPoints.push(newPoint);

      if (tile.type === "Rock") {
        const next = nextCoordinateInDirection(newPoint, direction);
        const nextTile = state.board.getTile(next);

        /** @type {RockTile} */
        const newRockTile = {
          type: "Rock",
          fallingDirection: "None",
          justUpdated: false,
          conveyorDirection: nextTile.conveyorDirection,
        }
        state.setTile(next, newRockTile);
        updatedPoints.push(next);
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
 * @param {Point} pt
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
 *
 * @param {State} state
 * @param {Point} pt
 * @param {TileUpdate[]} updates
 */
function applyRegionUpdates(state, pt, updates) {
  /** @type {Point[]} */
  const updatedPoints = [];

  for (let y = -1; y < 2; ++y) {
    for (let x = -1; x < 2; ++x) {
      const update = updates[(x + 1) + 3 * (y + 1)];

      /** @type {Point} */
      const currentPoint = [pt[0] + x, pt[1] + y];

      if (update) {
        updatedPoints.push(currentPoint);

        state.setTile(
          currentPoint,
          applyTileUpdate(
            state.board.getTile(currentPoint),
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
