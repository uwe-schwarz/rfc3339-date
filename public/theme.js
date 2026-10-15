const savedTheme = () => {
  try {
    return localStorage.getItem("rfc3339-theme");
  } catch {
    return null;
  }
};
const preferredTheme = () =>
  savedTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.checked = theme === "dark";
};
const setTheme = (theme) => {
  applyTheme(theme);
  try {
    localStorage.setItem("rfc3339-theme", theme);
  } catch {}
};
applyTheme(preferredTheme());
const bindThemeToggle = () => {
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.checked = document.documentElement.dataset.theme === "dark";
  document.getElementById("theme-toggle")?.addEventListener("change", (event) => {
    setTheme(event.currentTarget.checked ? "dark" : "light");
  });
};
addEventListener("DOMContentLoaded", bindThemeToggle);
