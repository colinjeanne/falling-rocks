import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeTile, encodeTile } from "../src/tile.js"

/**
 * @typedef {import("../src/tile.js").ConveyorDirection} ConveyorDirection
 * @typedef {import("../src/tile.js").DeadPlayerTile} DeadPlayerTile
 * @typedef {import("../src/tile.js").DirtTile} DirtTile
 * @typedef {import("../src/tile.js").DoorTile} DoorTile
 * @typedef {import("../src/tile.js").GenericTile} GenericTile
 * @typedef {import("../src/tile.js").InputDirection} InputDirection
 * @typedef {import("../src/tile.js").KeyColor} KeyColor
 * @typedef {import("../src/tile.js").LivingPlayerTile} LivingPlayerTile
 * @typedef {import("../src/tile.js").RockTile} RockTile
 * @typedef {import("../src/tile.js").Tile} Tile
 * @typedef {import("../src/tile.js").WaterTile} WaterTile
 */

/** @type {[ConveyorDirection, string][]} */
const CONVEYOR_DIRECTIONS = [
  ["Down", "v"],
  ["Left", "<"],
  ["None", ""],
  ["Right", ">"],
  ["Up", "^"],
];

/** @type {[InputDirection, string][]} */
const INPUT_DIRECTIONS = [
  ["Down", "v"],
  ["Left", "<"],
  ["None", "."],
  ["Right", ">"],
  ["Up", "^"],
];

/** @type {[KeyColor, string][]} */
const KEY_COLORS = [
  ["Blue", "b"],
  ["Green", "g"],
  ["None", ""],
  ["Red", "r"],
  ["Yellow", "y"],
];

/**
 * @template {Tile} T
 * @template {keyof T} Field
 * @callback AppendCases
 * @param {[Omit<T, Field>, string][]} cases
 * @returns {[T, string][]}
 */

/**
 * @template {Tile} T
 * @template {keyof T} Field
 * @param {Field} field
 * @param {[unknown, string][]} caseList
 * @returns {AppendCases<T, Field>}
 */
function appendCases(field, caseList) {
  /**
   * @type {AppendCases<T, Field>}
   */
  function inner(cases) {
    /** @type {[T, string][]} */
    const allCases = [];

    for (const [partialTile, encoded] of cases) {
      for (const [element, addedEncoding] of caseList) {
        allCases.push([
          /** @type {T} */ ( /** @type {unknown} */ ({
            ...partialTile,
            [field]: element,
          })),
          encoded + addedEncoding,
        ]);
      }
    }

    return allCases;
  }

  return inner;
}

const appendConveyorCases = appendCases(
  "conveyorDirection",
  CONVEYOR_DIRECTIONS
);

/** @type {AppendCases<LivingPlayerTile, "inputDirection">} */
const appendInputDirectionCases = appendCases(
  "inputDirection",
  INPUT_DIRECTIONS
);

/** @type {AppendCases<LivingPlayerTile, "excessKey">} */
const appendExcessKeyCases = appendCases("excessKey", KEY_COLORS);
const appendKeyColorCases = appendCases("keyColor", KEY_COLORS);

/**
 * @typedef {(
 *  Omit<DeadPlayerTile, "justUpdated"> |
 *  Omit<DirtTile, "justUpdated"> |
 *  Omit<DoorTile, "justUpdated"> |
 *  Omit<GenericTile, "justUpdated"> |
 *  Omit<LivingPlayerTile, "justUpdated"> |
 *  Omit<RockTile, "justUpdated"> |
 *  Omit<WaterTile, "justUpdated">
 * )} TileWithoutJustUpdated
 */

/** @type {[TileWithoutJustUpdated, string][]} */
const successCases = [
  ...appendKeyColorCases(
    appendConveyorCases([
      [/** @type {GenericTile} */({ type: "Collectable" }), "C"],
    ])
  ),
  ...appendKeyColorCases(
    appendConveyorCases([
      [/** @type {GenericTile} */({ type: "Empty" }), " "],
    ])
  ),
  [
    {
      type: "Wall",
      conveyorDirection: "None",
      keyColor: "None",
    },
    "W",
  ],
  ...appendKeyColorCases(
    appendConveyorCases([
      [
        /** @type {DirtTile} */
        ({ type: "Dirt", flowDirection: "Both" }),
        "D_",
      ],
      [
        /** @type {DirtTile} */
        ({ type: "Dirt", flowDirection: "Down" }),
        "Dv",
      ],
      [
        /** @type {DirtTile} */
        ({ type: "Dirt", flowDirection: "Left" }),
        "D<",
      ],
      [
        /** @type {DirtTile} */
        ({ type: "Dirt", flowDirection: "None" }),
        "D.",
      ],
      [
        /** @type {DirtTile} */
        ({ type: "Dirt", flowDirection: "Right" }),
        "D>",
      ],
    ])
  ),
  [
    {
      type: "Door",
      color: "Blue",
      conveyorDirection: "None",
      keyColor: "None",
    },
    "Xb",
  ],
  [
    {
      type: "Door",
      color: "Green",
      conveyorDirection: "None",
      keyColor: "None",
    },
    "Xg",
  ],
  [
    {
      type: "Door",
      color: "Red",
      conveyorDirection: "None",
      keyColor: "None",
    },
    "Xr",
  ],
  [
    {
      type: "Door",
      color: "Yellow",
      conveyorDirection: "None",
      keyColor: "None",
    },
    "Xy",
  ],
  ...appendKeyColorCases(
    appendConveyorCases(
      appendInputDirectionCases(
        appendExcessKeyCases([
          [
            /** @type {LivingPlayerTile} */({
              type: "Player",
              isAlive: true,
            }),
            "Pa",
          ],
        ])
      )
    )
  ),
  ...appendKeyColorCases(
    appendConveyorCases([
      [
        /** @type {DeadPlayerTile} */
        ({ type: "Player", isAlive: false }),
        "Pd",
      ],
    ])
  ),
  ...appendKeyColorCases(
    appendConveyorCases([
      [
        /** @type {RockTile} */
        ({ type: "Rock", fallingDirection: "Down" }),
        "Rv",
      ],
      [
        /** @type {RockTile} */
        ({ type: "Rock", fallingDirection: "DownLeft" }),
        "R<",
      ],
      [
        /** @type {RockTile} */
        ({ type: "Rock", fallingDirection: "DownRight" }),
        "R>",
      ],
      [
        /** @type {RockTile} */
        ({ type: "Rock", fallingDirection: "None" }),
        "R.",
      ],
    ])
  ),
  ...appendKeyColorCases(
    appendConveyorCases([
      [
        /** @type {WaterTile} */
        ({ type: "Water", flowDirection: "All" }),
        "~+",
      ],
      [
        /** @type {WaterTile} */
        ({ type: "Water", flowDirection: "Both" }),
        "~_",
      ],
      [
        /** @type {WaterTile} */
        ({ type: "Water", flowDirection: "Down" }),
        "~v",
      ],
      [
        /** @type {WaterTile} */
        ({ type: "Water", flowDirection: "Left" }),
        "~<",
      ],
      [
        /** @type {WaterTile} */
        ({ type: "Water", flowDirection: "Right" }),
        "~>",
      ],
    ])
  ),
];

describe("encodeTile", function () {
  successCases.forEach(([tile, expected]) => {
    it(`encodes ${JSON.stringify(tile)} as "${expected}"`, function () {
      assert.equal(
        encodeTile(
          /** @type {Tile} */({
            ...tile,
            justUpdated: false,
          })
        ),
        expected
      );
    });
  });
});

describe("decodeTile", function () {
  successCases.forEach(([expected, encoding]) => {
    it(`decodes "${encoding}" as ${JSON.stringify(expected)}`, function () {
      const decoded = decodeTile([...encoding], 0);

      const expectedResult = {
        tile: { ...expected, justUpdated: false },
        nextIndex: encoding.length,
      };
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
    ["Paz", "Unexpected input direction z at 2"],
    ["Pagz", "Unexpected input direction z at 3"],
    ["R", "Unexpected falling direction undefined at 1"],
    ["Rz", "Unexpected falling direction z at 1"],
    ["X", "Unexpected color undefined at 1"],
    ["Xz", "Unexpected color z at 1"],
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
