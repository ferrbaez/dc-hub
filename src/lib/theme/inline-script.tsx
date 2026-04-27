/**
 * Inline script that runs BEFORE React hydration to apply the theme class.
 * Prevents flash-of-light when a dark-mode user loads the page.
 *
 * The script reads localStorage; if missing, falls back to the optional
 * `data-theme` attribute that the server can set from the user's
 * `users.theme_preference` (read in a server component / layout).
 */
const SCRIPT = `
(function() {
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem("hub:theme");
    var preference = stored || root.dataset.theme || "system";
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = preference === "system" ? (systemDark ? "dark" : "light") : preference;
    root.classList.toggle("dark", resolved === "dark");
  } catch (e) {}
})();
`.trim();

export function ThemeInlineScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: required to apply the theme class before hydration to prevent FOUC. SCRIPT is a hardcoded constant, no user input.
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
