/**
 * @typedef {import("./board.js").Point} Point
 * @typedef {import("./tile.js").Tile} Tile
 * @typedef {import("./tile.js").WaterTile} WaterTile
 */

import { Board } from "./board.js";

/**
 * Converts a water tile flow direction into text
 *
 * @param {WaterTile["flowDirection"]} flowDirection
 * @returns {string}
 */
function getFlowDirectionText(flowDirection) {
  switch (flowDirection) {
    case "All":
      return "+";

    case "Down":
      return "D";

    case "Left":
      return "L";

    case "Right":
      return "R";

    case "Both":
      return "B";
  }
}

/**
 * Draws an arrow
 *
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} direction
 */
function drawArrow(context, x, y, width, height, direction) {
  context.save();

  context.translate(x + width / 2, y + height / 2);
  switch (direction) {
    case "Left":
      context.rotate(Math.PI / 2);
      break;

    case "Right":
      context.rotate(-Math.PI / 2);
      break;

    case "Up":
      context.rotate(Math.PI);
      break;
  }
  context.scale(0.75, 0.75);

  context.lineWidth = 2;
  context.strokeStyle = "grey";

  context.beginPath();
  context.moveTo(0, -height / 2);
  context.lineTo(0, height / 2);
  context.lineTo(-width / 2, 0);
  context.moveTo(0, height / 2);
  context.lineTo(width / 2, 0);
  context.stroke();

  context.restore();
}

/**
 * Draws a tile on a context
 *
 * @param {CanvasRenderingContext2D} context
 * @param {HTMLImageElement} tiles
 * @param {Tile} tile
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function drawTile(context, tiles, tile, x, y, width, height) {
  context.save();

  let tileIndex;
  if (tile.type === "Empty") {
    tileIndex = 0;
  } else if (tile.type === "Wall") {
    tileIndex = 1;
  } else if (tile.type === "Collectable") {
    tileIndex = 2;
  } else if (tile.type === "Rock") {
    tileIndex = 3;
  } else if (tile.type === "Dirt") {
    tileIndex = 4;
  } else if (tile.type === "Water" && tile.flowDirection === "All") {
    tileIndex = 7;
  } else if (tile.type === "Water" && tile.flowDirection !== "All") {
    tileIndex = 8;
  } else if (tile.type === "Player" && tile.isAlive) {
    tileIndex = 5;
  } else if (tile.type === "Player" && !tile.isAlive) {
    tileIndex = 6;
  } else {
    throw new Error("Unknown tile");
  }

  context.drawImage(
    tiles,
    0,
    tiles.naturalWidth * tileIndex,
    tiles.naturalWidth,
    tiles.naturalWidth,
    x,
    y,
    width,
    height
  );

  switch (tile.conveyorDirection) {
    case "Down":
      drawArrow(context, x, y, width, height, "Down");
      break;

    case "Left":
      drawArrow(context, x, y, width, height, "Left");
      break;

    case "Right":
      drawArrow(context, x, y, width, height, "Right");
      break;

    case "Up":
      drawArrow(context, x, y, width, height, "Up");
      break;
  }

  if (tile.type === "Water") {
    const text = getFlowDirectionText(tile.flowDirection);
    context.strokeText(text, x + width / 4, y + height / 2);
  } else if (tile.type === "Dirt" && tile.flowDirection !== "None") {
    const text = getFlowDirectionText(tile.flowDirection);
    context.strokeText(text, x + width / 4, y + height / 2);
  }

  context.restore();
}

/**
 * Draws a rect for the given tile point
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Point} point
 * @param {number} rows
 * @param {number} columns
 * @param {number} rowHeight
 * @param {number} columnWidth
 */
function drawTileRect(context, point, rows, columns, rowHeight, columnWidth) {
  const x = columnWidth * point[0];
  const y = rowHeight * point[1];

  context.beginPath();

  if (point[0] !== 0) {
    context.moveTo(x, y);
    context.lineTo(x, y + rowHeight);
  }

  if (point[0] !== columns - 1) {
    context.moveTo(x + columnWidth, y);
    context.lineTo(x + columnWidth, y + rowHeight);
  }

  if (point[1] !== 0) {
    context.moveTo(x, y);
    context.lineTo(x + columnWidth, y);
  }

  if (point[1] !== rows - 1) {
    context.moveTo(x, y + rowHeight);
    context.lineTo(x + columnWidth, y + rowHeight);
  }

  context.stroke();
}

/**
 * Draws gridlines with an optional point to highlight
 *
 * @param {CanvasRenderingContext2D} context
 * @param {number} rows
 * @param {number} columns
 * @param {Point | undefined} highlightedPoint
 */
function drawGrid(context, rows, columns, highlightedPoint) {
  context.save();

  context.strokeStyle = "#888";
  context.lineWidth = 2;
  context.lineCap = "butt";

  const width = context.canvas.width;
  const height = context.canvas.height;

  // Start at for rows and columns because the zeroth line would be at the edge
  // of the board and so can be ignored

  context.beginPath();

  const rowHeight = height / rows;
  for (let row = 1; row < rows; ++row) {
    const y = rowHeight * row;
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  const columnWidth = width / columns;
  for (let column = 1; column < columns; ++column) {
    const x = columnWidth * column;
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }

  context.stroke();

  if (highlightedPoint) {
    context.strokeStyle = "cornflowerblue";

    drawTileRect(
      context,
      highlightedPoint,
      rows,
      columns,
      rowHeight,
      columnWidth
    );
  }

  context.restore();
}

export default class BoardComponent extends HTMLElement {
  static observedAttributes = ["tileSize", "editing"];

  /** @type {Board | undefined} */
  #board;

  /** @type {boolean} */
  #isDragDrawing = false;

  /** @type {Point | undefined} */
  #hoveredPoint_ = undefined;

  /** @type {Point | undefined} */
  #previousHoveredPoint = undefined;

  /** @type {Tile} */
  selectedTile = Board.EMPTY_TILE;

  /** @type {HTMLImageElement | undefined} */
  #tiles;

  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const canvas = this.ownerDocument.createElement("canvas");

    shadow.appendChild(canvas);

    this.#adjustCanvasSize();
    this.render();
  }

  /**
   * Lifecycle callback called when an attribute changes
   *
   * @param {string} name
   */
  attributeChangedCallback(name) {
    if (name === "tileSize") {
      this.#endDragDrawing();
      this.#adjustCanvasSize();
      this.render();
    } else if (name === "editing") {
      this.#endDragDrawing();
      this.#updateEditingState();
    }
  }

  disconnectedCallback() {
    this.#removeEventListeners();
  }

  get board() {
    return this.#board;
  }

  set board(value) {
    this.#board = value;

    this.#endDragDrawing();
    this.#adjustCanvasSize();

    this.shadowRoot?.dispatchEvent(new Event("change", { composed: true }));

    this.render();
  }

  get tiles() {
    return this.#tiles;
  }

  set tiles(value) {
    this.#tiles = value;

    this.#endDragDrawing();
    this.render();
  }

  get #editing() {
    return this.getAttribute("editing") === "true";
  }

  get #hoveredPoint() {
    return this.#hoveredPoint_;
  }

  /**
   * Sets the hovered point
   *
   * @param {Point | undefined} point
   */
  set #hoveredPoint(point) {
    this.#previousHoveredPoint = this.#hoveredPoint_;
    this.#hoveredPoint_ = point;
  }

  #updateEditingState() {
    if (!this.#editing) {
      this.#hoveredPoint = undefined;
      this.#removeEventListeners();
    } else {
      this.#addEventListeners();
    }
  }

  #addEventListeners() {
    this.addEventListener("mousedown", this.#startDragDrawing);
    this.ownerDocument.addEventListener("mouseup", this.#endDragDrawing);
    this.addEventListener("mousemove", this.#handleMouseMove);
    this.addEventListener("mouseleave", this.#handleMouseLeave);
    this.addEventListener("click", this.#handleClick);
  }

  #removeEventListeners() {
    this.removeEventListener("mousedown", this.#startDragDrawing);
    this.ownerDocument.removeEventListener("mouseup", this.#endDragDrawing);
    this.removeEventListener("mousemove", this.#handleMouseMove);
    this.removeEventListener("mouseleave", this.#handleMouseLeave);
    this.removeEventListener("click", this.#handleClick);
  }

  /**
   * Adjusts the size of the canvas to the board and tile size
   */
  #adjustCanvasSize() {
    if (!this.#board) {
      return;
    }

    const canvas = this.shadowRoot?.querySelector("canvas");
    if (!canvas) {
      return;
    }

    const tileSize = Number.parseInt(this.getAttribute("tileSize") ?? "0");
    canvas.setAttribute("width", `${this.#board.width * tileSize}`);
    canvas.setAttribute("height", `${this.#board.height * tileSize}`);
  }

  /**
   * Starts drag drawing
   */
  #startDragDrawing = () => {
    this.#isDragDrawing = true;
  }

  /**
   * Ends drag drawing
   */
  #endDragDrawing = () => {
    this.#isDragDrawing = false;
  }

  /**
   * Set the point to the selected tile
   *
   * @param {Point} point
   */
  #setTile(point) {
    if (!this.#board) {
      return;
    }

    this.#board.setTile(point, this.selectedTile);
    this.shadowRoot?.dispatchEvent(new Event("change", { composed: true }));
  }

  #handleMouseLeave = () => {
    this.#hoveredPoint = undefined;

    if (
      (this.#hoveredPoint?.[0] !== this.#previousHoveredPoint?.[0]) ||
      (this.#hoveredPoint?.[1] !== this.#previousHoveredPoint?.[1])
    ) {
      this.render([]);
    }
  }

  /**
   * Handles mouse move events
   *
   * @param {MouseEvent} mouseEvent
   */
  #handleMouseMove = (mouseEvent) => {
    const point = this.#pointFromMouseEvent(mouseEvent);
    if (!point) {
      return;
    }

    if (this.#board?.isInBounds(point)) {
      this.#hoveredPoint = point;
    } else {
      this.#hoveredPoint = undefined;
    }

    if (this.#isDragDrawing) {
      this.#setTile(point);
    }

    this.render([point]);
  }

  /**
   * Converts a MouseEvent to a point of a tile
   *
   * @param {MouseEvent} mouseEvent
   * @returns {Point | undefined}
   */
  #pointFromMouseEvent(mouseEvent) {
    const canvas = this.shadowRoot?.querySelector("canvas");
    if (!canvas) {
      return;
    }

    // This is needed because the mouse event coordinates are relative to the
    // shadow root and the shadow root does not encompass the canvas
    const clientRect = canvas.getBoundingClientRect();
    const x = mouseEvent.clientX - clientRect.left;
    const y = mouseEvent.clientY - clientRect.top;

    const tileSize = Number.parseInt(this.getAttribute("tileSize") || "0");

    return [Math.floor(x / tileSize), Math.floor(y / tileSize)];
  }

  /**
   * Handles click events
   *
   * @param {MouseEvent} mouseEvent
   */
  #handleClick = (mouseEvent) => {
    const point = this.#pointFromMouseEvent(mouseEvent);
    if (!point) {
      return;
    }

    this.#setTile(point);
    this.render([point]);
  }

  /**
   * Renders a board
   *
   * @param {Point[]=} updatedPoints
   */
  render(updatedPoints) {
    if (!this.#board) {
      return;
    }

    if (!this.#tiles) {
      return;
    }

    const canvas = this.shadowRoot?.querySelector("canvas");
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const tileWidth = canvas.width / this.#board.width;
    const tileHeight = canvas.height / this.#board.height;

    if (updatedPoints === undefined) {
      updatedPoints = [];
      for (let x = 0; x < this.#board.width; ++x) {
        for (let y = 0; y < this.#board.height; ++y) {
          updatedPoints.push([x, y]);
        }
      }
    }

    const tiles = this.#tiles;
    const board = this.#board;
    const pointsWithTiles = updatedPoints.map(([x, y]) => ({
      x,
      y,
      tile: board.getTile([x, y]),
    }));

    pointsWithTiles.forEach(({ x, y, tile }) => {
      drawTile(
        context,
        tiles,
        tile, x * tileWidth,
        y * tileHeight,
        tileWidth,
        tileHeight
      );
    });

    if (this.#editing) {
      drawGrid(
        context,
        this.#board.height,
        this.#board.width,
        this.#hoveredPoint
      );
    }
  }
}
