class ActionSelectedEvent extends Event {
  /**
   * @param {string=} actionName
   */
  constructor(actionName) {
    super("actionSelected", { composed: true });

    this.actionName = actionName;
  }
}

export default class LevelEndPopup extends HTMLElement {
  /**
   * @param {string} title
   * @param {string=} actionName
   */
  constructor(title, actionName) {
    super();

    this.title = title;
    this.actionName = actionName;
  }

  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    const popupRoot = this.ownerDocument.createElement("div");
    popupRoot.id = "popupRoot";

    const title = this.ownerDocument.createElement("div");
    title.textContent = this.title;
    popupRoot.appendChild(title);

    const buttons = this.ownerDocument.createElement("div");

    const returnToMainMenuButton = this.ownerDocument.createElement("button");
    returnToMainMenuButton.textContent = "Main Menu";
    returnToMainMenuButton.type = "button";
    returnToMainMenuButton.addEventListener("click", () => {
      this.shadowRoot?.dispatchEvent(new ActionSelectedEvent("Main Menu"));
    });
    buttons.appendChild(returnToMainMenuButton);

    if (this.actionName) {
      const actionButton = this.ownerDocument.createElement("button");
      actionButton.textContent = this.actionName;
      actionButton.type = "button";
      actionButton.addEventListener("click", () => {
        this.shadowRoot?.dispatchEvent(new ActionSelectedEvent(this.actionName));
      });
      buttons.appendChild(actionButton);
    }

    popupRoot.appendChild(buttons);

    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      @keyframes fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      #popupRoot {
        animation: fadeIn 2s ease-in;
        position: absolute;
        left: 50%;
        translate: -50% -50%;
      }

      #popupRoot div:first-child {
        font-size: 500%;
        font-family: sans-serif;
        width: max-content;
      }
    `);

    shadowRoot.adoptedStyleSheets = [styles];
    shadowRoot.appendChild(popupRoot);
  }
}
