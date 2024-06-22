import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Board, createTile } from "../src/board.js"

import { State, applyPatternTileUpdates } from "../src/state.js";

/**
 * @typedef {import("../src/board.js").Tile} Tile
 */

/**
 * @type {{
 *  [key: string]: Tile["type"]
 * }}
 */
const tileMap = {
  " ": "Empty",
  "W": "Wall",
  "C": "Collectable",
  "R": "Rock",
  "D": "Dirt",
  "#": "Dirt",
  "P": "Player",
  "X": "Player",
  "~": "Water"
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
      .map(tile => createTile(tileMap[/** @type {keyof tileMap} */(tile)]))
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
      .map(tile => {
        if (tile.type === "Player") {
          if (tile.isAlive) {
            return "P";
          } else {
            return "X";
          }
        } else if (tile.type === "Dirt") {
          if (tile.flowDirection === "None") {
            return "D";
          } else {
            return "#";
          }
        }

        return reverseTileMap[tile.type];
      })
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
        "    ",
        "RRWR",
        "RR R",
        "WR R",
        "    ",
      ],
      [
        "    ",
        "    ",
        "    ",
        "    ",
        "R W ",
        "RR R",
        "WR R",
        " R R",
      ],
      [
        "    ",
        "    ",
        "    ",
        "    ",
        "  W ",
        "RR  ",
        "WRRR",
        " RRR",
      ],
      [
        "    ",
        "    ",
        "    ",
        "    ",
        "  W ",
        "RR  ",
        "WRRR",
        " RRR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("allows rocks to rest on a player", function () {
    const board = [
      "R",
      "P",
      " ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down kill a player", function () {
    const board = [
      "R",
      " ",
      "P",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        " ",
        "R",
        "P",
      ],
      [
        " ",
        "R",
        "X",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down left kill a player", function () {
    const board = [
      " R",
      "  ",
      "PW",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "  ",
        " R",
        "PW",
      ],
      [
        "  ",
        " R",
        "XW",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures rocks falling down right kill a player", function () {
    const board = [
      "R ",
      "  ",
      "WP",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "  ",
        "R ",
        "WP",
      ],
      [
        "  ",
        "R ",
        "WX",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows down", function () {
    const board = [
      "~",
      " ",
      " ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~",
        "~",
        " ",
      ],
      [
        "~",
        "~",
        "~",
      ],
      [
        "~",
        "~",
        "~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down-flowing water kills a player", function () {
    const board = [
      "~",
      " ",
      "P",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~",
        "~",
        "P",
      ],
      [
        "~",
        "~",
        "X",
      ],
      [
        "~",
        "~",
        "X",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows right", function () {
    const board = [
      "~  ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~~ ",
      ],
      [
        "~~~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water kills a player", function () {
    const board = [
      "~ P",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~~P",
      ],
      [
        "~~X",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows left", function () {
    const board = [
      "  ~",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        " ~~",
      ],
      [
        "~~~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water kills a player", function () {
    const board = [
      "P ~",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "P~~",
      ],
      [
        "X~~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down- and both-flowing water dry without a down-flowing source", function () {
    const board = [
      " R ",
      "   ",
      " ~ ",
      " W ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "   ",
        " R ",
        "~~~",
        " W ",
      ],
      [
        "   ",
        "   ",
        "~R~",
        "~W~",
      ],
      [
        "   ",
        "   ",
        "~  ",
        "RW~",
      ],
      [
        "   ",
        "   ",
        "   ",
        "RW ",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water dries without a right-flowing source", function () {
    const board = [
      "R  ",
      "   ",
      "~  ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "   ",
        "R  ",
        "~~ ",
      ],
      [
        "   ",
        "   ",
        "R~~",
      ],
      [
        "   ",
        "   ",
        "R ~",
      ],
      [
        "   ",
        "   ",
        "R  ",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water dries without a left-flowing source", function () {
    const board = [
      "  R",
      "   ",
      "  ~",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "   ",
        "  R",
        " ~~",
      ],
      [
        "   ",
        "   ",
        "~~R",
      ],
      [
        "   ",
        "   ",
        "~~R",
      ],
      [
        "   ",
        "   ",
        "~ R",
      ],
      [
        "   ",
        "   ",
        "  R",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water from waterlogged dirt flows down", function () {
    const board = [
      "~",
      "D",
      " ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~",
        "#",
        " ",
      ],
      [
        "~",
        "#",
        "~",
      ],
      [
        "~",
        "#",
        "~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures down-flowing water kills a player", function () {
    const board = [
      "~",
      "D",
      "P",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~",
        "#",
        "P",
      ],
      [
        "~",
        "#",
        "X",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows right", function () {
    const board = [
      "~D ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~# ",
      ],
      [
        "~#~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water kills a player", function () {
    const board = [
      "~DP",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "~#P",
      ],
      [
        "~#X",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures water flows left", function () {
    const board = [
      " D~",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        " #~",
      ],
      [
        "~#~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water kills a player", function () {
    const board = [
      "PD~",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "P#~",
      ],
      [
        "X#~",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures both-flowing water dry without a down-flowing source", function () {
    const board = [
      " R ",
      "   ",
      " ~ ",
      " D ",
      " W ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "   ",
        " R ",
        " ~ ",
        " # ",
        " W ",
      ],
      [
        "   ",
        "   ",
        " R ",
        "~#~",
        " W ",
      ],
      [
        "   ",
        "   ",
        "   ",
        "RD~",
        "~W~",
      ],
      [
        "   ",
        "   ",
        "   ",
        " D ",
        "RW~",
      ],
      [
        "   ",
        "   ",
        "   ",
        " D ",
        "RW ",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures right-flowing water dries without a right-flowing source", function () {
    const board = [
      "R  ",
      "   ",
      "~D ",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "   ",
        "R  ",
        "~# ",
      ],
      [
        "   ",
        "   ",
        "R#~",
      ],
      [
        "   ",
        "   ",
        "RD~",
      ],
      [
        "   ",
        "   ",
        "RD ",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });

  it("ensures left-flowing water dries without a left-flowing source", function () {
    const board = [
      "  R",
      "   ",
      " D~",
    ];
    const state = new State(arrayToBoard(board));

    /** @type {TestBoard[]} */
    const intermediateBoards = [
      [
        "   ",
        "  R",
        " #~",
      ],
      [
        "   ",
        "   ",
        "~#R",
      ],
      [
        "   ",
        "   ",
        "~#R",
      ],
      [
        "   ",
        "   ",
        "~DR",
      ],
      [
        "   ",
        "   ",
        " DR",
      ],
    ];

    stabilizeState(state, intermediateBoards);
  });
});
