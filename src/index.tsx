// Initialize theme based on localStorage preference and system settings
const storedTheme = localStorage.getItem("theme");
const prefersDarkMode = window.matchMedia(
  "(prefers-color-scheme: dark)"
).matches;

// Apply theme based on preference
if (storedTheme === "dark" || (storedTheme === "system" && prefersDarkMode)) {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
  document.documentElement.style.colorScheme = "dark";
} else {
  document.documentElement.classList.add("light");
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

// Rest of the index.tsx content
// ... existing code ...
