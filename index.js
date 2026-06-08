/**
 * @typedef {Object} WaitForElementsReadyOptions
 * @property {number}       [timeout=4000]          - Max ms to wait per element before rejecting
 * @property {boolean}      [observeMutations=true] - Watch for dynamically added custom elements
 * @property {AbortSignal}  [signal]                - Disconnect the MutationObserver when aborted
 * @property {boolean}      [debug=false]           - Log lifecycle steps to the console
 */

/**
 * Waits until all custom elements inside `target` are defined and ready.
 *
 * @param {HTMLElement | string} [target=document.body]
 * @param {WaitForElementsReadyOptions} [options={}]
 * @returns {Promise<void>}
 */
export async function waitForElementsReady(
  target = document.body,
  options = {}
) {
  const {
    timeout = 4000,
    observeMutations = true,
    signal,
    debug = false,
  } = options;

  const log = (...args) => { if (debug) console.log("[waitForElementsReady]", ...args); };

  const root =
    typeof target === "string"
      ? document.querySelector(target)
      : target;

  if (!root) {
    throw new Error("Target element not found");
  }

  log("root:", root);

  const isCustomElement = (el) =>
    el.tagName.includes("-");

  const containsCustomElement = (n) =>
    isCustomElement(n) ||
    Array.from(n.querySelectorAll?.("*") ?? []).some(isCustomElement);

  const getCustomElements = () =>
    Array.from(root.querySelectorAll("*")).filter(isCustomElement);

  const waitForDefinition = (el) =>
    customElements.whenDefined(el.tagName.toLowerCase());

  const waitForReadySignal = (el) => {
    const tag = el.tagName.toLowerCase();
    if (el.ready instanceof Promise) {
      log(`waiting for ready Promise: <${tag}>`);
      return el.ready;
    }

    if (typeof el.whenReady === "function") {
      log(`calling whenReady(): <${tag}>`);
      return el.whenReady();
    }

    return Promise.resolve();
  };

  const withTimeout = (promise, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout waiting for ${label}`)),
          timeout
        )
      ),
    ]);

  const processElements = async () => {
    const elements = getCustomElements();

    log(`found ${elements.length} custom element(s):`, elements.map((el) => el.tagName.toLowerCase()));

    await Promise.all(
      elements.map(async (el) => {
        const tag = el.tagName.toLowerCase();
        if (!customElements.get(tag)) {
          log(`waiting for definition: <${tag}>`);
        }
        await withTimeout(waitForDefinition(el), el.tagName);
        await withTimeout(waitForReadySignal(el), el.tagName);
        log(`<${tag}> ready`);
      })
    );
  };

  await processElements();

  if (observeMutations) {
    const observer = new MutationObserver(async (mutations) => {
      const hasNewCustomElements = mutations
        .flatMap((m) => Array.from(m.addedNodes).filter((n) => n.nodeType === 1))
        .some(containsCustomElement);

      if (hasNewCustomElements) {
        log("observer: new custom elements detected — reprocessing");
        await processElements();
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    signal?.addEventListener("abort", () => observer.disconnect(), { once: true });
  }

  log("all ready");
}
