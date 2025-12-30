/**
 * BambiSleep™ Church MCP Control Tower
 * Theme Toggle Component - Dark/Light mode switching
 */

const THEME_KEY = 'mcp-tower-theme';
const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

/**
 * Get stored theme preference
 */
function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || THEMES.DARK;
  } catch {
    return THEMES.DARK;
  }
}

/**
 * Store theme preference
 */
function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage may not be available
  }
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setStoredTheme(theme);
}

/**
 * Get current theme
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || getStoredTheme();
}

/**
 * Toggle between themes
 */
export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(next);
  return next;
}

/**
 * Initialize theme system
 */
export function initTheme() {
  // Apply stored preference on load
  applyTheme(getStoredTheme());
  
  // Check for system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    }
  });
}

/**
 * Render theme toggle button
 */
export function renderThemeToggle() {
  const theme = getCurrentTheme();
  const icon = theme === THEMES.DARK ? '🌙' : '☀️';
  const label = theme === THEMES.DARK ? 'Light Mode' : 'Dark Mode';
  
  return `
    <button class="theme-toggle btn btn-secondary" onclick="window.Dashboard.toggleTheme()" title="${label}">
      ${icon}
    </button>
  `;
}
