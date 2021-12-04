import { tileNames } from "./board.js";

/**
 * @typedef {import("./board.js").Board} Board
 * @typedef {"Up" | "Left" | "Down" | "Right" | "DownLeft" | "DownRight" | "None"} Direction
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

    /** @type {[number, number, Direction][]} */
    this.fallingRocks = [];
  }
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
  if (!board.isInBounds(x, y)) {
    return false;
  }

  const tile = board.getTile(x, y);
  if (tile === tileNames.WALL || tile === tileNames.DEAD_PLAYER || tile === tileNames.PLAYER) {
    return false;
  } else if (tile === tileNames.ROCK) {
    const [nextX, nextY] = nextCoordinateInDirection(x, y, direction);
    if (!board.isInBounds(nextX, nextY)) {
      return false;
    }

    const nextTile = board.getTile(nextX, nextY);
    if (nextTile !== tileNames.EMPTY && nextTile !== tileNames.DIRT) {
      return false;
    }
  }

  return true;
}

/**
 * Moves the player in the given direction
 *
 * @param {State} state
 * @param {Direction} direction
 */
export function movePlayer(state, direction) {
  const playerPositions = state.board.tiles.
    map((tile, index) => ({ tile, index })).
    filter(({ tile }) => tile === tileNames.PLAYER).
    map(({ index }) => ({
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

  for (const { x, y } of playerPositions) {
    const [newX, newY] = nextCoordinateInDirection(x, y, direction);

    if (canMoveToLocation(state.board, newX, newY, direction)) {
      const tile = state.board.getTile(newX, newY);
      if (tile === tileNames.COLLECTABLE) {
        ++state.collected;
      }

      state.board.setTile(x, y, tileNames.EMPTY);
      state.board.setTile(newX, newY, tileNames.PLAYER);

      if (tile === tileNames.ROCK) {
        const [nextX, nextY] = nextCoordinateInDirection(newX, newY, direction);
        state.board.setTile(nextX, nextY, tileNames.ROCK);
      }
    }
  }
}

/**
 * Whether a rock can fall straight down
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 */
function canFallDown(state, x, y) {
  if (!state.board.isInBounds(x, y + 1)) {
    return false;
  }

  const isTileBelowFalling = state.fallingRocks.find(
    ([tileX, tileY]) => tileX === x && tileY === y + 1
  );

  const tileBelow = state.board.getTile(x, y + 1);
  return tileBelow === tileNames.EMPTY ||
    tileBelow === tileNames.PLAYER ||
    isTileBelowFalling;
}

/**
 * Whether a rock can fall to the left
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 */
function canFallLeft(state, x, y) {
  if (!state.board.isInBounds(x - 1, y + 1) || canFallDown(state, x, y)) {
    return false;
  }

  const tileBelow = state.board.getTile(x, y + 1);
  const tileLeft = state.board.getTile(x - 1, y);
  const tileBelowLeft = state.board.getTile(x - 1, y + 1);
  return tileBelow === tileNames.ROCK &&
    tileLeft === tileNames.EMPTY &&
    (tileBelowLeft === tileNames.EMPTY || tileBelowLeft === tileNames.PLAYER);
}

/**
 * Whether a rock can fall to the right
 *
 * @param {State} state
 * @param {number} x
 * @param {number} y
 */
function canFallRight(state, x, y) {
  if (!state.board.isInBounds(x + 1, y + 1) || canFallDown(state, x, y)) {
    return false;
  }

  const tileBelow = state.board.getTile(x, y + 1);
  const tileRight = state.board.getTile(x + 1, y);
  const tileBelowRight = state.board.getTile(x + 1, y + 1);
  return tileBelow === tileNames.ROCK &&
    tileRight === tileNames.EMPTY &&
    (tileBelowRight === tileNames.EMPTY || tileBelowRight === tileNames.PLAYER);
}

/**
 * Updates all rocks that could start falling to do so
 *
 * @param {State} state
 */
export function updateFallingRocks(state) {
  for (let x = 0; x < state.board.width; ++x) {
    // Skip the last row since rocks on the last row can't fall
    // Always add the rocks from bottom to top so that a rock falling from
    // below triggers the rocks above to fall
    for (let y = state.board.height - 2; y >= 0; --y) {
      const tile = state.board.getTile(x, y);
      const tileBelow = state.board.getTile(x, y + 1);
      if (tile === tileNames.ROCK && tileBelow !== tileNames.PLAYER && canFallDown(state, x, y)) {
        state.fallingRocks.push([x, y, "Down"]);
      }
    }
  }
}

/**
 * @param {State} state
 * @param {number} x
 * @param {number} y
 * @param {Direction} direction
 * @returns {[number, number, Direction]}
 */
function applyGravityToRock(state, x, y, direction) {
  const [newX, newY] = nextCoordinateInDirection(x, y, direction);

  // Prevent this rock from falling if another rock has taken up that space
  const tile = state.board.getTile(newX, newY);
  if (tile !== tileNames.EMPTY && tile !== tileNames.PLAYER) {
    return [x, y, "None"];
  }

  if (tile === tileNames.PLAYER) {
    state.board.setTile(newX, newY, tileNames.DEAD_PLAYER);
    return [x, y, "None"];
  }

  state.board.setTile(x, y, tileNames.EMPTY);
  state.board.setTile(newX, newY, tileNames.ROCK);

  if (canFallDown(state, newX, newY)) {
    return [newX, newY, "Down"];
  } else if (canFallLeft(state, newX, newY)) {
    return [newX, newY, "DownLeft"];
  } else if (canFallRight(state, newX, newY)) {
    return [newX, newY, "DownRight"];
  }

  return [newX, newY, "None"];
}

/**
 * Moves all falling rocks to their next position
 *
 * @param {State} state
 */
export function applyGravityToFallingRocks(state) {
  const fallingRocks = state.fallingRocks;
  state.fallingRocks = [];

  // Since state.fallingRocks is ordered bottom to top this loop keeps the
  // same order
  for (const [x, y, direction] of fallingRocks) {
    const [newX, newY, newDirection] = applyGravityToRock(state, x, y, direction);
    if (newDirection !== "None") {
      state.fallingRocks.push([newX, newY, newDirection]);
    }
  }
}
