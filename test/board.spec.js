import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Board, decodeBoard, encodeBoard } from "../src/board.js"

/**
 * @typedef {import("../src/tile.js").Tile} Tile
 */

describe("Board", function () {
  describe("constructor", function () {
    it("ensures width must be a positive integer", function () {
      assert.throws(
        () => new Board(0, 1),
        /Width must be a positive integer$/
      );
      assert.throws(
        () => new Board(0.1, 1),
        /Width must be a positive integer$/
      );
      assert.throws(
        () => new Board(1.1, 1),
        /Width must be a positive integer$/
      );
    });

    it("ensures height must be a positive integer", function () {
      assert.throws(
        () => new Board(1, 0),
        /Height must be a positive integer$/
      );
      assert.throws(
        () => new Board(1, 0.1),
        /Height must be a positive integer$/
      );
      assert.throws(
        () => new Board(1, 1.1),
        /Height must be a positive integer$/
      );
    });

    it("ensures the number of tiles matches the given size", function () {
      assert.throws(
        () => new Board(2, 2, [Board.EMPTY_TILE]),
        /Size does not match number of tiles$/
      );
    });

    it("fills the board with empty tiles", function () {
      const board = new Board(2, 2);

      assert.deepEqual(
        board.tiles,
        [
          Board.EMPTY_TILE,
          Board.EMPTY_TILE,
          Board.EMPTY_TILE,
          Board.EMPTY_TILE,
        ]
      );
    });

    it("uses the provided tiles", function () {
      const tiles = [
        Board.WALL_TILE,
        Board.EMPTY_TILE,
        Board.WALL_TILE,
        Board.EMPTY_TILE,
      ];
      const board = new Board(2, 2, tiles);

      assert.strictEqual(board.tiles, tiles);
    });
  });

  describe("isInBounds", function () {
    it("ensures a point is within bounds", function () {
      const board = new Board(2, 2);

      assert.equal(board.isInBounds(1, 1), true);
      assert.equal(board.isInBounds(2, 1), false);
      assert.equal(board.isInBounds(1, -1), false);
    });
  });

  describe("getTile", function () {
    it("gets a tile if the tile is in bounds", function () {
      const board = new Board(2, 2);

      assert.equal(board.getTile(1, 1), Board.EMPTY_TILE);
    });

    it("gets a wall if the tile is out of bounds", function () {
      const board = new Board(2, 2);

      assert.equal(board.getTile(2, 2), Board.WALL_TILE);
    });
  });

  describe("setTile", function () {
    it("sets a tile if it is in bounds", function () {
      const board = new Board(2, 2);
      board.setTile(1, 1, Board.WALL_TILE);

      assert.equal(board.getTile(1, 1), Board.WALL_TILE);
    });

    it("throws if the tile is out of bounds", function () {
      const board = new Board(2, 2);

      assert.throws(
        () => board.setTile(2, 2, Board.WALL_TILE),
        /Coordinate \(2, 2\) out of bounds$/
      );
    });
  });

  describe("clone", function () {
    it("ensures the tiles are a different array", function () {
      const board = new Board(2, 2);
      const clone = board.clone();

      assert.deepEqual(clone.tiles, board.tiles);
      assert.notStrictEqual(clone.tiles, board.tiles);
    });
  });
});

/** @type {[Board, string][]} */
const successCases = [
  [new Board(1, 1), "1;1;1 "],
  [new Board(2, 3), "2;3;6 "],
  [
    new Board(
      2,
      2,
      [
        Board.EMPTY_TILE,
        Board.WALL_TILE,
        Board.EMPTY_TILE,
        Board.EMPTY_TILE,
      ],
    ),
    "2;2;1 1W2 ",
  ],
  [new Board(12, 24), "12;24;288 "],
];

describe("encodeBoard", function () {
  successCases.forEach(([board, expected], index) => {
    it(`encodes case ${index} as "${expected}"`, function () {
      assert.equal(encodeBoard(board), expected);
    });
  });
});

describe("decodeBoard", function () {
  successCases.forEach(([expected, encoding]) => {
    it(`decodes "${encoding}"`, function () {
      const decoded = decodeBoard(encoding);

      assert.deepEqual(decoded, expected);
    });
  });

  /** @type {[string, string][]} */
  const failureCases = [
    ["", "Expected number at 0"],
    [";1;1 ", "Expected number at 0"],
    ["1;;1 ", "Expected number at 2"],
    ["1;1", "Expected separator at 3"],
    [" ", "Expected number at 0"],
    ["1;1;2 ", "Size does not match number of tiles"],
    ["1;1;1;", "Unexpected tile ; at 5"],
    ["1;1;1", "Unexpected tile undefined at 5"],
  ];

  failureCases.forEach(([invalid, message]) => {
    it(`fails to decode "${invalid}"`, function () {
      assert.throws(
        () => decodeBoard(invalid),
        new RegExp(message + "$")
      );
    });
  });
});
