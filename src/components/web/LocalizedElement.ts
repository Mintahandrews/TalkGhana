/**
 * LocalizedElement - A Web Component that automatically updates when the language changes
 *
 * This custom element demonstrates how language settings can be applied to web components
 * and other custom elements outside of the React component tree.
 */

import i18n from "../../i18n";

/**
 * Custom element for localized text that automatically updates when the language changes
 */
export class LocalizedElement extends HTMLElement {
  static observedAttributes = ["key", "namespace"];
  private _key: string | null = null;
  private _namespace: string = "common";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    document.addEventListener(
      "language-changed",
      this.updateContent.bind(this)
    );
    this.updateContent();
  }

  disconnectedCallback() {
    document.removeEventListener(
      "language-changed",
      this.updateContent.bind(this)
    );
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === "key") {
      this._key = newValue;
    } else if (name === "namespace") {
      this._namespace = newValue;
    }

    this.updateContent();
  }

  private updateContent() {
    if (!this._key || !this.shadowRoot) return;

    try {
      const translated = i18n.t(this._key, { ns: this._namespace });
      this.shadowRoot.textContent = translated;
    } catch (error) {
      console.warn(`Translation failed for key: ${this._key}`, error);
      this.shadowRoot.textContent = this._key;
    }
  }
}

// Define the custom element if we're in a browser environment
if (typeof window !== "undefined") {
  if (!customElements.get("localized-text")) {
    customElements.define("localized-text", LocalizedElement);
  }
}

// Add typings for our global translateText function
declare global {
  interface Window {
    translateText?: (key: string, options?: any) => string;
  }
}

export default LocalizedElement;
