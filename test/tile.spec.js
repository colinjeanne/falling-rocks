import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeTile, encodeTile } from "../src/tile.js"

/**
 * @typedef {import("../src/tile.js").Tile} Tile
 */

/** @type {[Tile, string][]} */
const successCases = [
  [{ type: "Collectable", justUpdated: false }, "C"],
  [{ type: "Empty", justUpdated: false }, " "],
  [{ type: "Wall", justUpdated: false }, "W"],
  [{ type: "Dirt", flowDirection: "Both", justUpdated: false }, "D_"],
  [{ type: "Dirt", flowDirection: "Down", justUpdated: false }, "Dv"],
  [{ type: "Dirt", flowDirection: "Left", justUpdated: false }, "D<"],
  [{ type: "Dirt", flowDirection: "None", justUpdated: false }, "D."],
  [{ type: "Dirt", flowDirection: "Right", justUpdated: false }, "D>"],
  [{ type: "Player", isAlive: true, justUpdated: false }, "Pa"],
  [{ type: "Player", isAlive: false, justUpdated: false }, "Pd"],
  [{ type: "Rock", fallingDirection: "Down", justUpdated: false }, "Rv"],
  [{ type: "Rock", fallingDirection: "DownLeft", justUpdated: false }, "R<"],
  [{ type: "Rock", fallingDirection: "DownRight", justUpdated: false }, "R>"],
  [{ type: "Rock", fallingDirection: "None", justUpdated: false }, "R."],
  [{ type: "Water", flowDirection: "All", justUpdated: false }, "~+"],
  [{ type: "Water", flowDirection: "Both", justUpdated: false }, "~_"],
  [{ type: "Water", flowDirection: "Down", justUpdated: false }, "~v"],
  [{ type: "Water", flowDirection: "Left", justUpdated: false }, "~<"],
  [{ type: "Water", flowDirection: "Right", justUpdated: false }, "~>"],
];

describe("encodeTile", function () {
  successCases.forEach(([tile, expected]) => {
    it(`encodes ${JSON.stringify(tile)} as "${expected}"`, function () {
      assert.equal(encodeTile(tile), expected);
    });
  });
});

describe("decodeTile", function () {
  successCases.forEach(([expected, encoding]) => {
    it(`decodes "${encoding}" as ${JSON.stringify(expected)}`, function () {
      const decoded = decodeTile([...encoding], 0);

      const expectedResult = { tile: expected, nextIndex: encoding.length };
      assert.deepEqual(decoded, expectedResult);
    });
  });

  /** @type {[string, string][]} */
  const failureCases = [
    ["", "Unexpected tile undefined at 0"],
    ["!", "Unexpected tile ! at 0"],
    ["D", "Unexpected flow direction undefined at 1"],
    ["D#", "Unexpected flow direction # at 1"],
    ["P", "Unexpected player status undefined at 1"],
    ["Pz", "Unexpected player status z at 1"],
    ["R", "Unexpected falling direction undefined at 1"],
    ["Rz", "Unexpected falling direction z at 1"],
    ["~", "Unexpected flow direction undefined at 1"],
    ["~#", "Unexpected flow direction # at 1"],
  ];

  failureCases.forEach(([invalid, message]) => {
    it(`fails to decode "${invalid}"`, function () {
      assert.throws(
        () => decodeTile([...invalid], 0),
        new RegExp(message + "$")
      );
    });
  });
});
