export interface WaitForElementsReadyOptions {
  /** CSS class added to the reveal element when all custom elements are ready. Default: `"ready"` */
  revealClass?: string;
  /**
   * Element that receives `revealClass`. Accepts an `HTMLElement` or a CSS selector string.
   * Defaults to `target` — root and reveal are the same element unless this is set.
   */
  reveal?: HTMLElement | string;
  /** Max milliseconds to wait per element before rejecting. Default: `4000` */
  timeout?: number;
  /** Watch for dynamically added custom elements after initial resolution. Default: `true` */
  observeMutations?: boolean;
  /** Provide an AbortSignal to disconnect the MutationObserver when no longer needed. */
  signal?: AbortSignal;
  /** Log lifecycle steps (definitions, ready signals, observer triggers) to the console. Default: `false` */
  debug?: boolean;
}

/**
 * Waits until all custom elements inside `target` are defined and ready,
 * then adds `revealClass` to the reveal element (defaults to `target`).
 *
 * When `reveal` is provided, the scan scope (`target`) and the revealed element
 * can be different — e.g. scan `#app` but add the class to `document.body`.
 */
export function waitForElementsReady(
  target?: HTMLElement | string,
  options?: WaitForElementsReadyOptions
): Promise<void>;
