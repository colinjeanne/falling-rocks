import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Board } from "../src/board.js"
import { decodeTile, encodeTile } from "../src/tile.js";

import { State, applyPatternTileUpdates } from "../src/state.js";

/** @typedef {string[][]} TestBoard */

/**
 * Generates a board from an array
 *
 * @param {TestBoard} lines
 */
function arrayToBoard(lines) {
  const width = lines[0].length;
  const height = lines.length;
  const tiles = lines.flatMap(
    line => line.map(tile => decodeTile([...tile], 0).tile)
  );

  return new Board(width, height, tiles);
}

/**
 * @param {Board} board
 */
function boardToArray(board) {
  const lines = [];
  for (let i = 0; i < board.height; ++i) {
    const line = board.tiles.slice(i * board.width, (i + 1) * board.width)
      .map(encodeTile);
    lines.push(line);
  }
  return lines;
}

/**
 * Updates a state until it is stabilized
 *
 * @param {State} state
 * @param {TestBoard[]} intermediateBoards
 */
function stabilizeState(state, intermediateBoards) {
  const originalBoard = boardToArray(state.board);

  let currentIndex = 0;
  state.updateEntireBoard();

  while (state.updatedTiles.length > 0) {
    applyPatternTileUpdates(state);

    if (currentIndex < intermediateBoards.length) {
      assert.deepStrictEqual(
        boardToArray(state.board),
        intermediateBoards[currentIndex]
      );
    } else if (currentIndex === intermediateBoards.length) {
      if (intermediateBoards.length === 0) {
        // There are no expected changes
        assert.deepStrictEqual(boardToArray(state.board), originalBoard);
      } else {
        // The last state should equal the second to last as an
        // indication that the state has stabilized
        assert.deepStrictEqual(
          boardToArray(state.board),
          intermediateBoards[currentIndex - 1]
        );
      }
    } else {
      assert.fail("State stabilized late");
    }
    ++currentIndex;
  }

  if (currentIndex !== intermediateBoards.length + 1) {
    assert.fail("State did not encounter all intermediate boards");
  }
}

describe("applyPatternTileUpdates", function () {
  it("drops rocks straight down", function () {
    const board = [
      ["R."],
      [" "],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Rv"],
        [" "],
      ],
      [
        [" "],
        [" "],
        ["Rv"],
      ],
      [
        [" "],
        [" "],
        ["R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("rocks don't fall with gaps", function () {
    const board = [
      ["R."],
      ["R."],
      ["R."],
      [" "],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Rv"],
        ["Rv"],
        ["Rv"],
        [" "],
      ],
      [
        [" "],
        [" "],
        ["Rv"],
        ["Rv"],
        ["Rv"],
      ],
      [
        [" "],
        [" "],
        ["R."],
        ["R."],
        ["R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("collapses falling rocks to the right of rocks below", function () {
    const board = [
      ["R.", " "],
      [" ", " "],
      ["R.", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " "],
        ["Rv", " "],
        ["R.", " "],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "R>"],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("collapses falling rocks to the left of rocks below", function () {
    const board = [
      [" ", "R."],
      [" ", " "],
      [" ", "R."],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " "],
        [" ", "Rv"],
        [" ", "R."],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R<", "R."],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling to the left don't overlap rocks falling down", function () {
    const board = [
      ["R.", "R."],
      [" ", " "],
      ["R.", " "],
      ["W", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " "],
        ["Rv", "Rv"],
        ["R.", " "],
        ["W", " "],
      ],
      [
        [" ", " "],
        ["R>", " "],
        ["R.", "Rv"],
        ["W", " "],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "R>"],
        ["W", "Rv"],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "R."],
        ["W", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling to the right don't overlap rocks falling down", function () {
    const board = [
      ["R.", "R."],
      [" ", " "],
      [" ", "R."],
      [" ", "W"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " "],
        ["Rv", "Rv"],
        [" ", "R."],
        [" ", "W"],
      ],
      [
        [" ", " "],
        [" ", "R<"],
        ["Rv", "R."],
        [" ", "W"],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R<", "R."],
        ["Rv", "W"],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "R."],
        ["R.", "W"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling on both sides don't overlap with each other", function () {
    const board = [
      ["R.", " ", "R."],
      [" ", " ", " "],
      ["R.", " ", "R."],
      ["W", " ", "W"],
      [" ", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " ", " "],
        ["Rv", " ", "Rv"],
        ["R.", " ", "R."],
        ["W", " ", "W"],
        [" ", " ", " "],
      ],
      [
        [" ", " ", " "],
        ["R>", " ", " "],
        ["R.", "R<", "R."],
        ["W", " ", "W"],
        [" ", " ", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "R>", "R."],
        ["W", "Rv", "W"],
        [" ", " ", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", " ", "R."],
        ["W", "Rv", "W"],
        [" ", "Rv", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", " ", "R."],
        ["W", "Rv", "W"],
        [" ", "R.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling to the side don't block rocks falling from above", function () {
    const board = [
      [" ", "R.", " "],
      [" ", "R.", " "],
      [" ", "R.", " "],
      [" ", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " ", " "],
        [" ", "Rv", " "],
        [" ", "Rv", " "],
        [" ", "Rv", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "Rv", " "],
        ["R<", "R.", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "R.", "R>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "R.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks cascading to the left don't block other rocks cascading to the left", function () {
    const board = [
      ["R.", "R.", " "],
      [" ", " ", " "],
      ["R.", " ", " "],
      ["W", "R.", " "],
      [" ", "W", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " ", " "],
        ["Rv", "Rv", " "],
        ["R.", " ", " "],
        ["W", "R.", " "],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        ["R>", " ", " "],
        ["R.", "Rv", " "],
        ["W", "R.", " "],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "R>", " "],
        ["W", "R.", "R>"],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", " ", " "],
        ["W", "R.", "R>"],
        [" ", "W", "Rv"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", " ", " "],
        ["W", "R.", "R."],
        [" ", "W", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks cascading to the right don't block other rocks cascading to the right", function () {
    const board = [
      [" ", "R.", "R."],
      [" ", " ", " "],
      [" ", " ", "R."],
      [" ", "R.", "W"],
      [" ", "W", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " ", " "],
        [" ", "Rv", "Rv"],
        [" ", " ", "R."],
        [" ", "R.", "W"],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", "R<"],
        [" ", "Rv", "R."],
        [" ", "R.", "W"],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "R<", "R."],
        ["R<", "R.", "W"],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", "R."],
        ["R<", "R.", "W"],
        ["Rv", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", "R."],
        ["R.", "R.", "W"],
        ["R.", "W", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks always fall when nothing is below them", function () {
    const board = [
      [" ", " ", "R.", " "],
      ["R.", " ", "R.", "R."],
      ["R.", "R.", "R.", "R."],
      [" ", " ", " ", " "],
      [" ", " ", "W", " "],
      [" ", " ", " ", " "],
      ["W", " ", " ", " "],
      [" ", " ", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", " ", " ", " "],
        [" ", " ", "Rv", " "],
        ["Rv", " ", "Rv", "Rv"],
        ["Rv", "Rv", "Rv", "Rv"],
        [" ", " ", "W", " "],
        [" ", " ", " ", " "],
        ["W", " ", " ", " "],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "Rv", " "],
        ["Rv", "R<", "Rv", "Rv"],
        ["Rv", "Rv", "W", "Rv"],
        [" ", " ", " ", " "],
        ["W", " ", " ", " "],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", "R<", "Rv", " "],
        ["Rv", "Rv", "W", "Rv"],
        ["Rv", "Rv", " ", "Rv"],
        ["W", " ", " ", " "],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        ["R>", "Rv", "W", "R>"],
        ["R.", "Rv", " ", "Rv"],
        ["W", "Rv", " ", "Rv"],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        ["R>", " ", "W", " "],
        ["R.", "Rv", " ", "Rv"],
        ["W", "Rv", " ", "Rv"],
        [" ", "Rv", " ", "Rv"],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "W", " "],
        ["R.", "R>", " ", " "],
        ["W", "R>", "R>", "Rv"],
        [" ", "R.", "R<", "R."],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "W", " "],
        ["R.", "R.", " ", " "],
        ["W", "R>", "R.", "R."],
        [" ", "R.", "R.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("allows rocks to rest on a player", function () {
    const board = [
      ["R."],
      ["Pa"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down kill a player", function () {
    const board = [
      ["R."],
      [" "],
      ["Pa"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" "],
        ["Rv"],
        ["Pa"],
      ],
      [
        [" "],
        ["R."],
        ["Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down left kill a player", function () {
    const board = [
      [" ", "R."],
      [" ", " "],
      ["Pa", "W"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " "],
        [" ", "Rv"],
        ["Pa", "W"],
      ],
      [
        [" ", " "],
        [" ", "R."],
        ["Pd", "W"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down right kill a player", function () {
    const board = [
      ["R.", " "],
      [" ", " "],
      ["W", "Pa"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " "],
        ["Rv", " "],
        ["W", "Pa"],
      ],
      [
        [" ", " "],
        ["R.", " "],
        ["W", "Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows down", function () {
    const board = [
      ["~+"],
      [" "],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["~v"],
        [" "],
      ],
      [
        ["~+"],
        ["~v"],
        ["~v"],
      ],
      [
        ["~+"],
        ["~v"],
        ["~_"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down-flowing water kills a player", function () {
    const board = [
      ["~+"],
      [" "],
      ["Pa"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["~v"],
        ["Pa"],
      ],
      [
        ["~+"],
        ["~v"],
        ["Pd"],
      ],
      [
        ["~+"],
        ["~_"],
        ["Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows right", function () {
    const board = [
      ["~+", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+", "~>", " "],
      ],
      [
        ["~+", "~>", "~>"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water kills a player", function () {
    const board = [
      ["~+", " ", "Pa"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+", "~>", "Pa"],
      ],
      [
        ["~+", "~>", "Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows left", function () {
    const board = [
      [" ", " ", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", "~<", "~+"],
      ],
      [
        ["~<", "~<", "~+"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water kills a player", function () {
    const board = [
      ["Pa", " ", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["Pa", "~<", "~+"],
      ],
      [
        ["Pd", "~<", "~+"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down- and both-flowing water dry without a down-flowing source", function () {
    const board = [
      [" ", "R.", " "],
      [" ", " ", " "],
      [" ", "~+", " "],
      [" ", "W", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " ", " "],
        [" ", "Rv", " "],
        ["~<", "~+", "~>"],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", "Rv", "~>"],
        ["~v", "W", "~v"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", " ", " "],
        ["R<", "W", "~_"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "W", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water dries without a right-flowing source", function () {
    const board = [
      ["R.", " ", " "],
      [" ", " ", " "],
      ["~+", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " ", " "],
        ["Rv", " ", " "],
        ["~+", "~>", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["Rv", "~>", "~>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", " ", "~>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", " ", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water dries without a left-flowing source", function () {
    const board = [
      [" ", " ", "R."],
      [" ", " ", " "],
      [" ", " ", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " ", " "],
        [" ", " ", "Rv"],
        [" ", "~<", "~+"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", "~<", "Rv"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", "~<", "R."],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", " ", "R."],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water from waterlogged dirt flows down", function () {
    const board = [
      ["~+"],
      ["D."],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["Dv"],
        [" "],
      ],
      [
        ["~+"],
        ["Dv"],
        ["~v"],
      ],
      [
        ["~+"],
        ["Dv"],
        ["~_"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down-flowing water kills a player", function () {
    const board = [
      ["~+"],
      ["D."],
      ["Pa"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["D_"],
        ["Pa"],
      ],
      [
        ["~+"],
        ["D_"],
        ["Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows right", function () {
    const board = [
      ["~+", "D.", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+", "D>", " "],
      ],
      [
        ["~+", "D>", "~>"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water kills a player", function () {
    const board = [
      ["~+", "D.", "Pa"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+", "D>", "Pa"],
      ],
      [
        ["~+", "D>", "Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows left", function () {
    const board = [
      [" ", "D.", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", "D<", "~+"],
      ],
      [
        ["~<", "D<", "~+"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water kills a player", function () {
    const board = [
      ["Pa", "D.", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["Pa", "D<", "~+"],
      ],
      [
        ["Pd", "D<", "~+"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures both-flowing water dry without a down-flowing source", function () {
    const board = [
      [" ", "R.", " "],
      [" ", " ", " "],
      [" ", "~+", " "],
      [" ", "D.", " "],
      [" ", "W", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " ", " "],
        [" ", "Rv", " "],
        [" ", "~+", " "],
        [" ", "D_", " "],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "Rv", " "],
        ["~<", "D_", "~>"],
        [" ", "W", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        ["R<", "D.", "~>"],
        ["~v", "W", "~v"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "D.", " "],
        ["Rv", "W", "~_"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "D.", " "],
        ["R.", "W", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water dries without a right-flowing source", function () {
    const board = [
      ["R.", " ", " "],
      [" ", " ", " "],
      ["~+", "D.", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " ", " "],
        ["Rv", " ", " "],
        ["~+", "D>", " "],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["Rv", "D>", "~>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "D.", "~>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["R.", "D.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water dries without a left-flowing source", function () {
    const board = [
      [" ", " ", "R."],
      [" ", " ", " "],
      [" ", "D.", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " ", " "],
        [" ", " ", "Rv"],
        [" ", "D<", "~+"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", "D<", "Rv"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", "D<", "R."],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        ["~<", "D.", "R."],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "D.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });
});
