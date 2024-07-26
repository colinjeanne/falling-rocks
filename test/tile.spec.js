import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeTile, encodeTile } from "../src/tile.js"

/**
 * @typedef {import("../src/tile.js").Tile} Tile
 */

/** @type {[Tile, string][]} */
const successCases = [
  [
    { type: "Collectable", conveyorDirection: "None", justUpdated: false },
    "C",
  ],
  [{ type: "Empty", conveyorDirection: "None", justUpdated: false }, " "],
  [{ type: "Empty", conveyorDirection: "Down", justUpdated: false }, " v"],
  [{ type: "Empty", conveyorDirection: "Left", justUpdated: false }, " <"],
  [{ type: "Empty", conveyorDirection: "Right", justUpdated: false }, " >"],
  [{ type: "Empty", conveyorDirection: "Up", justUpdated: false }, " ^"],
  [{ type: "Wall", conveyorDirection: "None", justUpdated: false }, "W"],
  [
    {
      type: "Dirt",
      conveyorDirection: "None",
      flowDirection: "Both",
      justUpdated: false,
    },
    "D_",
  ],
  [
    {
      type: "Dirt",
      conveyorDirection: "None",
      flowDirection: "Down",
      justUpdated: false,
    },
    "Dv",
  ],
  [
    {
      type: "Dirt",
      conveyorDirection: "None",
      flowDirection: "Left",
      justUpdated: false,
    },
    "D<",
  ],
  [
    {
      type: "Dirt",
      conveyorDirection: "None",
      flowDirection: "None",
      justUpdated: false,
    },
    "D.",
  ],
  [
    {
      type: "Dirt",
      conveyorDirection: "Down",
      flowDirection: "None",
      justUpdated: false,
    },
    "D.v",
  ],
  [
    {
      type: "Dirt",
      conveyorDirection: "None",
      flowDirection: "Right",
      justUpdated: false,
    },
    "D>",
  ],
  [
    {
      type: "Player",
      conveyorDirection: "None",
      isAlive: true,
      justUpdated: false,
    },
    "Pa",
  ],
  [
    {
      type: "Player",
      conveyorDirection: "None",
      isAlive: false,
      justUpdated: false,
    },
    "Pd",
  ],
  [
    {
      type: "Rock",
      conveyorDirection: "None",
      fallingDirection: "Down",
      justUpdated: false,
    },
    "Rv",
  ],
  [
    {
      type: "Rock",
      conveyorDirection: "None",
      fallingDirection: "DownLeft",
      justUpdated: false,
    },
    "R<",
  ],
  [
    {
      type: "Rock",
      conveyorDirection: "None",
      fallingDirection: "DownRight",
      justUpdated: false,
    },
    "R>",
  ],
  [
    {
      type: "Rock",
      conveyorDirection: "None",
      fallingDirection: "None",
      justUpdated: false,
    },
    "R.",
  ],
  [
    {
      type: "Water",
      conveyorDirection: "None",
      flowDirection: "All",
      justUpdated: false,
    },
    "~+",
  ],
  [
    {
      type: "Water",
      conveyorDirection: "None",
      flowDirection: "Both",
      justUpdated: false,
    },
    "~_",
  ],
  [
    {
      type: "Water",
      conveyorDirection: "None",
      flowDirection: "Down",
      justUpdated: false,
    },
    "~v",
  ],
  [
    {
      type: "Water",
      conveyorDirection: "None",
      flowDirection: "Left",
      justUpdated: false,
    },
    "~<",
  ],
  [
    {
      type: "Water",
      conveyorDirection: "None",
      flowDirection: "Right",
      justUpdated: false,
    },
    "~>",
  ],
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
