/**
 * @typedef {(
 *   "None" |
 *   "Building" |
 *   "Playing"
 * )} State
 *
 * @typedef {(newState: State, oldState: State) => void} StateChangeCallback
 */

export default class AppState {
  /** @type {State} */
  #current;

  /** @type {Map<string, StateChangeCallback>} */
  #stateChangeCallbacks;

  constructor() {
    this.#current = "None";
    this.#stateChangeCallbacks = new Map();
  }

  get current() {
    return this.#current;
  }

  /**
   * @param {State} state
   */
  set current(state) {
    const current = this.#current;
    this.#current = state;
    this.#stateChangeCallbacks.forEach((callback) => callback(state, current));
  }

  /**
   * Adds a state change listener
   *
   * @param {StateChangeCallback} stateChangeCallback
   * @returns {string} A cookie that can remove the listener later
   */
  addListener(stateChangeCallback) {
    const cookie = self.crypto.randomUUID();
    this.#stateChangeCallbacks.set(cookie, stateChangeCallback);
    return cookie;
  }

  /**
   * Removes a state change listener
   *
   * @param {string} cookie
   */
  removeListener(cookie) {
    this.#stateChangeCallbacks.delete(cookie);
  }
}
