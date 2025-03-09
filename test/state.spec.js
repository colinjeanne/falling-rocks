import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Board } from "../src/board.js"
import { decodeTile, encodeTile } from "../src/tile.js";

import { State } from "../src/state.js";

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
  while (state.updatedTiles.length > 0) {
    state.applyUpdates();

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

  it("drops rocks through keys", function () {
    const board = [
      ["R."],
      [" b"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Rvb"],
        [" "],
      ],
      [
        [" "],
        [" b"],
        ["Rv"],
      ],
      [
        [" "],
        [" b"],
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

  it("ensures falling rocks stop falling rocks from rolling right", function () {
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
        ["R.", " "],
        ["R.", "Rv"],
        ["W", " "],
      ],
      [
        [" ", " "],
        ["R.", " "],
        ["R.", " "],
        ["W", "Rv"],
      ],
      [
        [" ", " "],
        ["R.", " "],
        ["R.", " "],
        ["W", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures falling rocks stop falling rocks from rolling left", function () {
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
        [" ", "R."],
        ["Rv", "R."],
        [" ", "W"],
      ],
      [
        [" ", " "],
        [" ", "R."],
        [" ", "R."],
        ["Rv", "W"],
      ],
      [
        [" ", " "],
        [" ", "R."],
        [" ", "R."],
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
        ["R.", " ", " "],
        ["R.", "R<", "R."],
        ["W", " ", "W"],
        [" ", " ", " "],
      ],
      [
        [" ", " ", " "],
        ["R.", " ", " "],
        ["R.", " ", "R."],
        ["W", "Rv", "W"],
        [" ", " ", " "],
      ],
      [
        [" ", " ", " "],
        ["R.", " ", " "],
        ["R.", " ", "R."],
        ["W", " ", "W"],
        [" ", "Rv", " "],
      ],
      [
        [" ", " ", " "],
        ["R.", " ", " "],
        ["R.", " ", "R."],
        ["W", " ", "W"],
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
        [" ", "R.", "R>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        ["R<", "R.", "R."],
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
        ["Rv", "R<", "R.", "Rv"],
        ["Rv", "Rv", "W", "Rv"],
        [" ", " ", " ", " "],
        ["W", " ", " ", " "],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "R.", "R>"],
        ["Rv", "Rv", "W", "Rv"],
        ["Rv", "Rv", " ", "Rv"],
        ["W", " ", " ", " "],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "R.", " "],
        ["R.", " ", "W", "Rv"],
        ["R.", "Rv", " ", "Rv"],
        ["W", "Rv", " ", "Rv"],
        [" ", " ", " ", " "],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "R.", " "],
        ["R.", " ", "W", " "],
        ["R.", " ", " ", "Rv"],
        ["W", "Rv", " ", "Rv"],
        [" ", "Rv", " ", "Rv"],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "R.", " "],
        ["R.", " ", "W", " "],
        ["R.", " ", " ", " "],
        ["W", "R.", " ", "Rv"],
        [" ", "R.", "R<", "R."],
      ],
      [
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", "R.", " "],
        ["R.", " ", "W", " "],
        ["R.", " ", " ", " "],
        ["W", "R.", " ", "R."],
        [" ", "R.", "R.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("allows rocks to rest on a player", function () {
    const board = [
      ["R."],
      ["Pa."],
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
      ["Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" "],
        ["Rv"],
        ["Pa."],
      ],
      [
        [" "],
        ["R."],
        ["Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down kill a player and roll left", function () {
    const board = [
      [" ", "R."],
      [" ", " "],
      [" ", "Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " "],
        [" ", "Rv"],
        [" ", "Pa."],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["R.", "Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down kill a player and roll right", function () {
    const board = [
      ["R.", " "],
      [" ", " "],
      ["Pa.", " "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " "],
        ["Rv", " "],
        ["Pa.", " "],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["Pd", "R>"],
      ],
      [
        [" ", " "],
        [" ", " "],
        ["Pd", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down left kill a player", function () {
    const board = [
      [" ", "R."],
      [" ", " "],
      ["Pa.", "W"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " "],
        [" ", "Rv"],
        ["Pa.", "W"],
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
      ["W", "Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        [" ", " "],
        ["Rv", " "],
        ["W", "Pa."],
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

  it("ensures water flows through keys", function () {
    const board = [
      ["~+"],
      [" b"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["~vb"],
        [" "],
      ],
      [
        ["~+"],
        ["~vb"],
        ["~v"],
      ],
      [
        ["~+"],
        ["~vb"],
        ["~_"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down-flowing water kills a player", function () {
    const board = [
      ["~+"],
      [" "],
      ["Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["~v"],
        ["Pa."],
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
      ["~+", " ", "Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+", "~>", "Pa."],
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
      ["Pa.", " ", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["Pa.", "~<", "~+"],
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
        ["~_", "W", "R>"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        ["~_", "W", "R."],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "W", "R."],
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
      ["Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+"],
        ["D_"],
        ["Pa."],
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
      ["~+", "D.", "Pa."],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["~+", "D>", "Pa."],
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
      ["Pa.", "D.", "~+"],
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        ["Pa.", "D<", "~+"],
      ],
      [
        ["Pd", "D<", "~+"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures both-flowing water dries without a down-flowing source", function () {
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
        ["~<", "D.", "R>"],
        ["~v", "W", "~v"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "D.", " "],
        ["~_", "W", "Rv"],
      ],
      [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", "D.", " "],
        [" ", "W", "R."],
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

  it("conveys living players down", function () {
    const board = [
      ["Pa.v"],
      [" "],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" v"],
        ["Pa."],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through keys down", function () {
    const board = [
      ["Pa.v"],
      [" vb"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" v"],
        ["Pa.vb"],
        [" "],
      ],
      [
        [" v"],
        [" v"],
        ["Pa.b"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through openable doors down", function () {
    const board = [
      ["Pa.vb"],
      ["Xb"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" v"],
        ["Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players down", function () {
    const board = [
      ["Pdv"],
      [" "],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" v"],
        ["Pd"],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players through keys down", function () {
    const board = [
      ["Pdv"],
      [" vb"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" v"],
        ["Pdvb"],
        [" "],
      ],
      [
        [" v"],
        [" vb"],
        ["Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("down-conveyed die by crashing into players", function () {
    const board = [
      ["Pa.v"],
      ["Pd"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pdv"],
        ["Pd"],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("down-conveyed players kill living players", function () {
    const board = [
      ["Pa.v"],
      ["Pa."],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pdv"],
        ["Pd"],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players left", function () {
    const board = [
      [" ", " ", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pa.", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through keys left", function () {
    const board = [
      [" ", " <b", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pa.<b", " <"],
      ],
      [
        ["Pa.b", " <", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through openable doors left", function () {
    const board = [
      ["Xb", "Pa.<b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa.", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players left", function () {
    const board = [
      [" ", " ", "Pd<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pd", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players through keys left", function () {
    const board = [
      [" ", " <b", "Pd<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pd<b", " <"],
      ],
      [
        ["Pd", " <b", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-conveyed die by crashing into players", function () {
    const board = [
      [" ", "Pd", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pd", "Pd<"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-conveyed players kill living players", function () {
    const board = [
      [" ", "Pa.", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pd", "Pd<"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-conveyed living players push single rocks", function () {
    const board = [
      [" ", " ", "R.", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "R.", "Pa.", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-conveyed dead players push single rocks", function () {
    const board = [
      [" ", " ", "R.", "Pd<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "R.", "Pd", " <"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-conveyed players crash into double rocks rocks", function () {
    const board = [
      [" ", "R.", "R.", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "R.", "R.", "Pd<"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-conveyed rocks kill players", function () {
    const board = [
      [" ", "Pa.", "R.", "Pa.<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pd", "R.", "Pd<"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players right", function () {
    const board = [
      ["Pa.>", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pa.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through keys right", function () {
    const board = [
      ["Pa.>", " >b", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pa.>b", " "],
      ],
      [
        [" >", " >", "Pa.b"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through openable doors right", function () {
    const board = [
      ["Pa.>b", "Xb"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players right", function () {
    const board = [
      ["Pd>", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pd", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players through keys right", function () {
    const board = [
      ["Pd>", " >b", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pd>b", " "],
      ],
      [
        [" >", " >b", "Pd"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-conveyed die by crashing into players", function () {
    const board = [
      ["Pa.>", "Pd", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pd>", "Pd", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-conveyed players kill living players", function () {
    const board = [
      ["Pa.>", "Pa.", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pd>", "Pd", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-conveyed living players push single rocks", function () {
    const board = [
      ["Pa.>", "R.", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pa.", "R.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-conveyed dead players push single rocks", function () {
    const board = [
      ["Pd>", "R.", " ", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" >", "Pd", "R.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-conveyed players crash into double rocks rocks", function () {
    const board = [
      ["Pa.>", "R.", "R.", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pd>", "R.", "R.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-conveyed rocks kill players", function () {
    const board = [
      ["Pa.>", "R.", "Pa.", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pd>", "R.", "Pd", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players up", function () {
    const board = [
      [" "],
      [" "],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pa."],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through keys up", function () {
    const board = [
      [" "],
      [" ^b"],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pa.^b"],
        [" ^"],
      ],
      [
        ["Pa.b"],
        [" ^"],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys living players through openable doors up", function () {
    const board = [
      ["Xb"],
      ["Pa.^b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa."],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players up", function () {
    const board = [
      [" "],
      [" "],
      ["Pd^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pd"],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("conveys dead players through keys up", function () {
    const board = [
      [" "],
      [" ^b"],
      ["Pd^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pd^b"],
        [" ^"],
      ],
      [
        ["Pd"],
        [" ^b"],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-conveyed die by crashing into players", function () {
    const board = [
      [" "],
      ["Pd"],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pd"],
        ["Pd^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-conveyed players kill living players", function () {
    const board = [
      [" "],
      ["Pa."],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pd"],
        ["Pd^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-conveyed living players push single rocks", function () {
    const board = [
      [" "],
      [" "],
      ["R."],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["R."],
        ["Pa."],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-conveyed dead players push single rocks", function () {
    const board = [
      [" "],
      [" "],
      ["R."],
      ["Pd^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["R."],
        ["Pd"],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-conveyed players crash into double rocks rocks", function () {
    const board = [
      [" "],
      ["R."],
      ["R."],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["R."],
        ["R."],
        ["Pd^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-conveyed rocks kill players", function () {
    const board = [
      [" "],
      ["Pa."],
      ["R."],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pd"],
        ["R."],
        ["Pd^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("falling rocks kill up-conveyed players", function () {
    const board = [
      ["R."],
      [" ^"],
      [" ^"],
      ["Pa.^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Rv^"],
        ["Pa.^"],
        [" ^"],
      ],
      [
        ["R."],
        ["Pd^"],
        [" ^"],
        [" ^"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("down-moving players move into empty spaces", function () {
    const board = [
      ["Pav"],
      [" "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("down-moving players are stopped by non-empty spaces", function () {
    const board = [
      ["Pav"],
      ["W"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa."],
        ["W"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-moving players move into empty spaces", function () {
    const board = [
      [" ", "Pa<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-moving players are stopped by non-empty spaces", function () {
    const board = [
      ["W", "Pa<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["W", "Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-moving players push single rocks", function () {
    const board = [
      [" ", "R.", "Pa<"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["R.", "Pa.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-moving players move into empty spaces", function () {
    const board = [
      ["Pa>", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-moving players are stopped by non-empty spaces", function () {
    const board = [
      ["Pa>", "W"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa.", "W"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-moving players push single rocks", function () {
    const board = [
      ["Pa>", "R.", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pa.", "R."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-moving players move into empty spaces", function () {
    const board = [
      [" "],
      ["Pa^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa."],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-moving players are stopped by non-empty spaces", function () {
    const board = [
      ["W"],
      ["Pa^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["W"],
        ["Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-moving players push single rocks", function () {
    const board = [
      [" "],
      ["R."],
      ["Pa^"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["R."],
        ["Pa."],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("moving living players pick up keys", function () {
    const board = [
      ["Pa>", " b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pa.b"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("moving living players with keys do not pick up keys", function () {
    const board = [
      ["Pa>g", " b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pab.g"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("moving living players drop excess keys", function () {
    const board = [
      ["Pab>g", " "],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" b", "Pa.g"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("stuck moving living players with keys do not duplicate keys", function () {
    const board = [
      ["Pa>b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa.b"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("down-moving living players open doors with matching color", function () {
    const board = [
      ["Pavb"],
      ["Xb"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" "],
        ["Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("left-moving living players open doors with matching color", function () {
    const board = [
      ["Xb", "Pa<b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa.", " "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("right-moving living players open doors with matching color", function () {
    const board = [
      ["Pa>b", "Xb"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        [" ", "Pa."],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("up-moving living players open doors with matching color", function () {
    const board = [
      ["Xb"],
      ["Pa^b"]
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa."],
        [" "],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("moving living players do not open doors with mismatched color", function () {
    const board = [
      ["Pa>g", "Xb"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pa.g", "Xb"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("moving living players do not open doors with the excess key", function () {
    const board = [
      ["Pag>b", "Xg"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pag.b", "Xg"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("killed players drop excess keys", function () {
    const board = [
      ["Pag.>b"],
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        ["Pd>g"],
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });
});
