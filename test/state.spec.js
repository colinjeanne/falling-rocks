import { expect } from "chai";
import { Board, tileNames } from "../src/board.js"

import {
  State,
  applyGravityToFallingRocks,
  updateFallingRocks
} from "../src/state.js";

const tileMap = {
  " ": tileNames.EMPTY,
  "W": tileNames.WALL,
  "C": tileNames.COLLECTABLE,
  "R": tileNames.ROCK,
  "D": tileNames.DIRT,
  "P": tileNames.PLAYER,
  "X": tileNames.DEAD_PLAYER,
};

/** @typedef {string[]} TestBoard */

/**
 * Reverses the keys and values of an object
 *
 * @param {Object} o
 */
function reverseObject(o) {
  const entries = Object.entries(o);
  return Object.fromEntries(entries.map(([key, value]) => ([value, key])));
}

const reverseTileMap = reverseObject(tileMap);

/**
 * Generates a board from an array
 *
 * @param {TestBoard} lines
 */
function arrayToBoard(lines) {
  const width = lines[0].length;
  const height = lines.length;
  const tiles = lines.flatMap(
    line => line.split('')
      .map(tile => tileMap[/** @type {keyof tileMap} */(tile)])
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
      .map(tile => reverseTileMap[tile])
      .join('');
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
  let currentIndex = 0;
  updateFallingRocks(state);

  while (state.fallingRocks.length > 0) {
    applyGravityToFallingRocks(state);

    if (currentIndex >= intermediateBoards.length) {
      expect.fail("State stabilized late");
    }

    expect(boardToArray(state.board)).to.eql(
      intermediateBoards[currentIndex]
    );
    ++currentIndex;
  }

  if (currentIndex !== intermediateBoards.length) {
    expect.fail("State did not encounter all intermediate boards");
  }
}

describe("applyGravityToFallingRocks", function () {
  it("drops rocks straight down", function () {
    const board = [
      "R",
      " ",
      " ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        " ",
        "R",
        " ",
      ],
      [
        " ",
        " ",
        "R",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("rocks don't fall with gaps", function () {
    const board = [
      "R",
      "R",
      "R",
      " ",
      " ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        " ",
        "R",
        "R",
        "R",
        " ",
      ],
      [
        " ",
        " ",
        "R",
        "R",
        "R",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("collapses falling rocks to the right of rocks below", function () {
    const board = [
      "R ",
      "  ",
      "R ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "  ",
        "R ",
        "R ",
      ],
      [
        "  ",
        "  ",
        "RR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("collapses falling rocks to the left of rocks below", function () {
    const board = [
      " R",
      "  ",
      " R",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "  ",
        " R",
        " R",
      ],
      [
        "  ",
        "  ",
        "RR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling to the left don't overlap rocks falling down", function () {
    const board = [
      "RR",
      "  ",
      "R ",
      "W ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "  ",
        "RR",
        "R ",
        "W ",
      ],
      [
        "  ",
        "R ",
        "RR",
        "W ",
      ],
      [
        "  ",
        "  ",
        "RR",
        "WR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling to the right don't overlap rocks falling down", function () {
    const board = [
      "RR",
      "  ",
      " R",
      " W",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "  ",
        "RR",
        " R",
        " W",
      ],
      [
        "  ",
        " R",
        "RR",
        " W",
      ],
      [
        "  ",
        "  ",
        "RR",
        "RW",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling on both sides don't overlap with each other", function () {
    const board = [
      "R R",
      "   ",
      "R R",
      "W W",
      "   ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "   ",
        "R R",
        "R R",
        "W W",
        "   ",
      ],
      [
        "   ",
        "R  ",
        "RRR",
        "W W",
        "   ",
      ],
      [
        "   ",
        "   ",
        "RRR",
        "WRW",
        "   ",
      ],
      [
        "   ",
        "   ",
        "R R",
        "WRW",
        " R ",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling to the side don't block rocks falling from above", function () {
    const board = [
      " R ",
      " R ",
      " R ",
      "   ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "   ",
        " R ",
        " R ",
        " R ",
      ],
      [
        "   ",
        "   ",
        " R ",
        "RR ",
      ],
      [
        "   ",
        "   ",
        "   ",
        "RRR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks cascading to the left don't block other rocks cascading to the left", function () {
    const board = [
      "RR ",
      "   ",
      "R  ",
      "WR ",
      " W ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "   ",
        "RR ",
        "R  ",
        "WR ",
        " W ",
      ],
      [
        "   ",
        "R  ",
        "RR ",
        "WR ",
        " W ",
      ],
      [
        "   ",
        "   ",
        "RR ",
        "WRR",
        " W ",
      ],
      [
        "   ",
        "   ",
        "R  ",
        "WRR",
        " WR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks cascading to the right don't block other rocks cascading to the right", function () {
    const board = [
      " RR",
      "   ",
      "  R",
      " RW",
      " W ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "   ",
        " RR",
        "  R",
        " RW",
        " W ",
      ],
      [
        "   ",
        "  R",
        " RR",
        " RW",
        " W ",
      ],
      [
        "   ",
        "   ",
        " RR",
        "RRW",
        " W ",
      ],
      [
        "   ",
        "   ",
        "  R",
        "RRW",
        "RW ",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks always fall when nothing is below them", function () {
    const board = [
      "  R ",
      "R RR",
      "RRRR",
      "    ",
      "  W ",
      "    ",
      "W   ",
      "    ",
    ];
    const state = new State(arrayToBoard(board));

    const intermediateBoards = [
      [
        "    ",
        "  R ",
        "R RR",
        "RRRR",
        "  W ",
        "    ",
        "W   ",
        "    ",
      ],
      [
        "    ",
        "    ",
        "  R ",
        "RRRR",
        "RRWR",
        "    ",
        "W   ",
        "    ",
      ],
      [
        "    ",
        "    ",
        "    ",
        " RR ",
        "RRWR",
        "RR R",
        "W   ",
        "    ",
      ],
      [
        "    ",
        "    ",
        "    ",
        "  R ",
        "RRW ",
        "RR R",
        "WR R",
        "    ",
      ],
      [
        "    ",
        "    ",
        "    ",
        "  R ",
        "R W ",
        "RR  ",
        "WR R",
        " R R",
      ],
      [
        "    ",
        "    ",
        "    ",
        "  R ",
        "R W ",
        "RR  ",
        "WR  ",
        " RRR",
      ],
      [
        "    ",
        "    ",
        "    ",
        "  R ",
        "R W ",
        "R   ",
        "WRR ",
        " RRR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });
});
