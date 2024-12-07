import { applyPatternTileUpdates } from "./patterns.js";

/**
 * @typedef {import("./board.js").Board} Board
 * @typedef {import("./board.js").Point} Point
 * @typedef {import("./tile.js").InputDirection} InputDirection
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
    this.originalCollectables = this.originalBoard.tiles.filter(
      tile => tile.type === "Collectable"
    ).length;

    /** @type {Point[]} */
    this.updatedTiles = [];

    this.#updateEntireBoard();
  }

  get collected() {
    return this.originalCollectables - this.collectablesRemaining;
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
    this.#updateEntireBoard();
  }

  /**
   * @param {Point} pt
   */
  #addUpdatedTile(pt) {
    if (
      this.board.isInBounds(pt) &&
      this.updatedTiles.every(
        point => point[0] !== pt[0] || point[1] !== pt[1]
      )
    ) {
      this.updatedTiles.push(pt);
    }
  }

  #updateEntireBoard() {
    this.updatedTiles = [];

    for (let y = this.board.height - 1; y >= 0; --y) {
      for (let x = this.board.width - 1; x >= 0; --x) {
        this.updatedTiles.push([x, y]);
      }
    }
  }

  #clearJustUpdated() {
    for (let y = 0; y < this.board.height; ++y) {
      for (let x = 0; x < this.board.width; ++x) {
        this.board.getTile([x, y]).justUpdated = false;
      }
    }
  }

  applyUpdates() {
    const updatedPoints = applyPatternTileUpdates(
      this.board,
      this.updatedTiles
    );

    this.updatedTiles = [];
    this.#clearJustUpdated();
    for (const pt of updatedPoints) {
      this.#tileChanged(pt);
    }

    return updatedPoints;
  }

  /**
   * Marks a tile as changed by adding it and all relevant tiles to the set of
   * tiles to update
   *
   * @param {Point} pt
   */
  #tileChanged(pt) {
    // The point is considered to be the center of the third row of the pattern
    // triangle. All other tiles in that shape are added
    this.#addUpdatedTile([pt[0], pt[1] - 2]);

    this.#addUpdatedTile([pt[0] - 1, pt[1] - 1]);
    this.#addUpdatedTile([pt[0], pt[1] - 1]);
    this.#addUpdatedTile([pt[0] + 1, pt[1] - 1]);

    this.#addUpdatedTile([pt[0] - 2, pt[1]]);
    this.#addUpdatedTile([pt[0] - 1, pt[1]]);
    this.#addUpdatedTile(pt);
    this.#addUpdatedTile([pt[0] + 1, pt[1]]);
    this.#addUpdatedTile([pt[0] + 2, pt[1]]);

    this.#addUpdatedTile([pt[0] - 1, pt[1] + 1]);
    this.#addUpdatedTile([pt[0], pt[1] + 1]);
    this.#addUpdatedTile([pt[0] + 1, pt[1] + 1]);
  }

  /**
   * Moves all living players in the given direction
   *
   * @param {InputDirection} inputDirection
   * @returns {Point[]} The points that were updated
   */
  movePlayers(inputDirection) {
    /** @type {Point[]} */
    const updatedPoints = [];

    for (let x = 0; x < this.board.width; ++x) {
      for (let y = 0; y < this.board.height; ++y) {
        /** @type {Point} */
        const pt = [x, y];
        const tile = this.board.getTile(pt);
        if (tile.type === "Player" && tile.isAlive) {
          this.board.setTile(
            pt,
            {
              type: "Player",
              isAlive: true,
              inputDirection,
              conveyorDirection: tile.conveyorDirection,
              justUpdated: tile.justUpdated,
            }
          )
          updatedPoints.push(pt);
          this.#tileChanged(pt);
        }
      }
    }

    return updatedPoints;
  }
}
