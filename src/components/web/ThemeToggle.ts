/**
 * ThemeToggle - A Web Component that handles theme switching
 *
 * This custom element allows toggling between light, dark, and system themes
 * outside of the React component tree. It synchronizes with the application's
 * theme context.
 */

export class ThemeToggle extends HTMLElement {
  private button: HTMLButtonElement | null = null;
  private currentTheme: "light" | "dark" | "system" = "system";
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Create the button element
    this.button = document.createElement("button");
    this.button.setAttribute("aria-label", "Toggle theme");
    this.button.classList.add("theme-toggle-button");

    // Add styles to shadow DOM
    const style = document.createElement("style");
    style.textContent = `
      .theme-toggle-button {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        padding: 0.5rem;
        border-radius: 0.25rem;
        color: var(--text-color, currentColor);
        background-color: var(--bg-subtle, transparent);
      }
      
      .theme-toggle-button:hover {
        background-color: var(--bg-hover, rgba(0, 0, 0, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
    this.shadowRoot?.appendChild(this.button);

    // Set initial content
    this.updateButtonContent();

    // Add event listeners
    this.button.addEventListener("click", this.handleClick.bind(this));
    document.addEventListener(
      "theme-changed",
      this.handleThemeChangeEvent.bind(this)
    );

    // Set up system theme detection
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQuery.addEventListener(
      "change",
      this.handleSystemThemeChange.bind(this)
    );

    // Get initial theme from document
    const documentTheme = document.documentElement.getAttribute("data-theme");
    if (documentTheme) {
      this.currentTheme = documentTheme as "light" | "dark" | "system";
      this.updateButtonContent();
    }
  }

  disconnectedCallback() {
    this.button?.removeEventListener("click", this.handleClick.bind(this));
    document.removeEventListener(
      "theme-changed",
      this.handleThemeChangeEvent.bind(this)
    );
    this.mediaQuery?.removeEventListener(
      "change",
      this.handleSystemThemeChange.bind(this)
    );
  }

  private handleClick() {
    // Cycle through themes: light -> dark -> system -> light
    switch (this.currentTheme) {
      case "light":
        this.currentTheme = "dark";
        break;
      case "dark":
        this.currentTheme = "system";
        break;
      case "system":
        this.currentTheme = "light";
        break;
    }

    this.updateButtonContent();
    this.applyTheme();

    // Dispatch event for other components
    const event = new CustomEvent("theme-toggle", {
      detail: { theme: this.currentTheme },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private handleThemeChangeEvent(e: Event) {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.theme) {
      this.currentTheme = customEvent.detail.theme;
      this.updateButtonContent();
    }
  }

  private handleSystemThemeChange(e: MediaQueryListEvent) {
    if (this.currentTheme === "system") {
      document.documentElement.classList.toggle("dark", e.matches);
    }
  }

  private updateButtonContent() {
    if (!this.button) return;

    switch (this.currentTheme) {
      case "light":
        this.button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        break;
      case "dark":
        this.button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        break;
      case "system":
        this.button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
        break;
    }
  }

  private applyTheme() {
    const html = document.documentElement;

    switch (this.currentTheme) {
      case "light":
        html.classList.remove("dark");
        html.setAttribute("data-theme", "light");
        break;
      case "dark":
        html.classList.add("dark");
        html.setAttribute("data-theme", "dark");
        break;
      case "system":
        const isDarkMode = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        html.classList.toggle("dark", isDarkMode);
        html.setAttribute("data-theme", "system");
        break;
    }
  }
}

// Define the custom element if we're in a browser environment
if (typeof window !== "undefined") {
  if (!customElements.get("theme-toggle")) {
    customElements.define("theme-toggle", ThemeToggle);
  }
}

export default ThemeToggle;
