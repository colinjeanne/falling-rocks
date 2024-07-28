/**
 * @typedef {import("./tile.js").Tile} Tile
 *
 * @callback Pattern
 * @param {Tile} tile The tile to match
 * @returns {boolean} Whether the pattern matches
 */

/**
 * Whether a region matches a given tile pattern
 *
 * @param {Tile[]} region
 * @param {Pattern[]} pattern
 */
export function matcher(region, pattern) {
  if (region.length !== pattern.length) {
    throw new Error("region and pattern must have the same length");
  }

  for (let index = 0; index < region.length; ++index) {
    if (!pattern[index](region[index])) {
      return false;
    }
  }

  return true;
}
