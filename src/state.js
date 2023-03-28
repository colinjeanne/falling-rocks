import { tileNames } from "./board.js";

/**
 * @typedef {import("./board.js").Board} Board
 * @typedef {(
 *  "Up" |
 *  "Left" |
 *  "Down" |
 *  "Right" |
 *  "DownLeft" |
 *  "DownRight" |
 *  "None"
 * )} Direction
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

    /** @type {[number, number, Direction][][]} */
    this.fallingRocks = [];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {Direction}
  */
  getFallingDirection(x, y) {
    const tile = this.board.getTile(x, y);
    if (tile !== tileNames.ROCK) {
      return "None";
    }

    for (const line of this.fallingRocks) {
      const fallingRock = line.find(
        ([tileX, tileY]) => tileX === x && tileY === y
      );

      if (fallingRock) {
        return fallingRock[2];
      }
    }

    return "None";
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {Direction} direction
   */
  setFallingRock(x, y, direction) {
    /** @type [number, number, Direction] */
    const fallingRock = [x, y, direction];
    for (let index = 0; index < this.fallingRocks.length; ++index) {
      const line = this.fallingRocks[index];
      if (line.length > 0) {
        if (line[0][1] === y) {
          line.push(fallingRock);
          return;
        } else if (line[0][1] < y) {
          const newLine = [fallingRock];
          this.fallingRocks.splice(index, 0, newLine);
          return;
        }
      }
    }

    const newLine = [fallingRock];
    this.fallingRocks.push(newLine);
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
  if (
    tile === tileNames.WALL ||
    tile === tileNames.DEAD_PLAYER ||
    tile === tileNames.PLAYER
  ) {
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
        const [nextX, nextY] = nextCoordinateInDirection(
          newX,
          newY,
          direction
        );
        state.board.setTile(nextX, nextY, tileNames.ROCK);
      }
    }
  }
}

/**
 * @param {State} state
 * @param {number} x
 * @param {number} y
 */
function isTileFallingRock(state, x, y) {
  return state.getFallingDirection(x, y) !== "None";
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

  const tileBelow = state.board.getTile(x, y + 1);
  return tileBelow === tileNames.EMPTY ||
    tileBelow === tileNames.PLAYER ||
    isTileFallingRock(state, x, y + 1);
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
    (tileLeft === tileNames.EMPTY || isTileFallingRock(state, x - 1, y)) &&
    (
      tileBelowLeft === tileNames.EMPTY ||
      isTileFallingRock(state, x - 1, y + 1) ||
      tileBelowLeft === tileNames.PLAYER
    );
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
    (tileRight === tileNames.EMPTY || isTileFallingRock(state, x + 1, y)) &&
    (
      tileBelowRight === tileNames.EMPTY ||
      isTileFallingRock(state, x + 1, y + 1) ||
      tileBelowRight === tileNames.PLAYER
    );
}

/**
 * Updates all rocks that could start falling to do so
 *
 * @param {State} state
 */
export function updateFallingRocks(state) {
  if (state.fallingRocks.length > 0) {
    return;
  }

  // Skip the last row since rocks on the last row can't fall
  for (let y = state.board.height - 2; y >= 0; --y) {
    /** @type [number, number, Direction][] */
    const line = [];
    for (let x = state.board.width - 1; x >= 0; --x) {
      const tile = state.board.getTile(x, y);
      const tileBelow = state.board.getTile(x, y + 1);
      if (
        tile === tileNames.ROCK &&
        tileBelow !== tileNames.PLAYER &&
        canFallDown(state, x, y) &&
        state.getFallingDirection(x, y) === "None"
      ) {
        line.push([x, y, "Down"]);
      }
    }

    if (line.length > 0) {
      state.fallingRocks.push(line);
    }
  }
}

/**
 * @param {State} state
 * @param {number} x
 * @param {number} y
 * @returns {[number, number, boolean]}
 */
function applyGravityToTile(state, x, y) {
  const direction = state.getFallingDirection(x, y);
  if (direction === "None") {
    return [x, y, false];
  }

  const [newX, newY] = nextCoordinateInDirection(x, y, direction);

  const tile = state.board.getTile(newX, newY);
  if (tile !== tileNames.EMPTY) {
    if (tile === tileNames.PLAYER) {
      state.board.setTile(newX, newY, tileNames.DEAD_PLAYER);
    }

    return [x, y, true];
  }

  state.board.setTile(x, y, tileNames.EMPTY);
  state.board.setTile(newX, newY, tileNames.ROCK);

  return [newX, newY, true];
}

/**
 * Moves all falling rocks to their next position
 *
 * @param {State} state
 */
export function applyGravityToFallingRocks(state) {
  /** @type {[number, number][][]} */
  const fallingRocks = [];
  for (const line of state.fallingRocks) {
    /** @type [number, number][] */
    const newLine = [];
    for (const [x, y, direction] of line) {
      if (direction === "Down") {
        const updatedTile = applyGravityToTile(state, x, y);
        if (updatedTile[2]) {
          newLine.push([updatedTile[0], updatedTile[1]]);
        }
      }
    }

    for (const [x, y, direction] of line) {
      if (direction !== "Down") {
        const updatedTile = applyGravityToTile(state, x, y);
        if (updatedTile[2]) {
          newLine.push([updatedTile[0], updatedTile[1]]);
        }
      }
    }

    fallingRocks.push(newLine);
  }

  state.fallingRocks = [];
  for (const line of fallingRocks) {
    /** @type {[number, number][]} */
    const unprocessed = [];
    for (const [x, y] of line) {
      if (canFallDown(state, x, y)) {
        state.setFallingRock(x, y, "Down");
      } else {
        unprocessed.push([x, y]);
      }
    }

    for (const [x, y] of unprocessed) {
      if (canFallLeft(state, x, y)) {
        state.setFallingRock(x, y, "DownLeft");
      } else if (canFallRight(state, x, y)) {
        state.setFallingRock(x, y, "DownRight");
      }
    }
  }
}
