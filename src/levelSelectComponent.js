import Levels from "./levels.js";

/**
 * @typedef {typeof Levels[0]} Level
 */

class LevelSelectedEvent extends Event {
  /**
   * @type {Level}
   */
  level;

  /**
   * @param {Level} level
   */
  constructor(level) {
    super("levelSelected", { composed: true });

    this.level = level;
  }
}

export default class LevelSelectComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const list = this.ownerDocument.createElement("ol");

    for (const level of Levels) {
      const button = document.createElement("button");
      button.textContent = level.name;

      button.addEventListener("click", () => {
        try {
          this.shadowRoot?.dispatchEvent(new LevelSelectedEvent(level));
        } catch (e) {
          console.log(e);
        }
      });

      list.appendChild(button);
    }

    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      ol {
        padding: 0;

        display: grid;
        grid-template-columns: repeat(5, auto);
        column-gap: 3em;
        row-gap: 2em;
      }

      button {
        font-size: 200%;
      }
    `);

    shadow.adoptedStyleSheets = [styles];
    shadow.appendChild(list);
  }

  /**
   * Returns the next level given a current level
   *
   * @param {Level} currentLevel
   */
  nextLevel(currentLevel) {
    const next = Levels.findIndex(level => level.name === currentLevel.name);
    if (next === Levels.length - 1) {
      return undefined;
    }

    return Levels[next + 1];
  }
}
