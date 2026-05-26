/*****************************
   PCStat Design System - Theme JavaScript
   Version: 1.0.0
   Handles theme switching and validation
*****************************/

/**
 * Theme Constants
 */
const THEME_KEY = 'theme';
const DEFAULT_THEME = 'dark';
const VALID_THEMES = ['light', 'dark'];

/**
 * Theme Icons (SVG)
 */
const SUN_ICON = `<svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.63" y2="5.63"></line><line x1="18.37" y1="4.22" x2="19.78" y2="5.63"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.63" y2="18.37"></line><line x1="18.37" y1="19.78" x2="19.78" y2="18.37"></line></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

/**
 * Initialize theme based on localStorage or default
 * Must be called on DOMContentLoaded
 */
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  setTheme(savedTheme);
}

/**
 * Set theme and update UI
 * @param {'light'|'dark'} theme - Theme to apply
 */
export function setTheme(theme) {
  if (!VALID_THEMES.includes(theme)) {
    console.warn(`Invalid theme: ${theme}. Using default: ${DEFAULT_THEME}`);
    theme = DEFAULT_THEME;
  }

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggles();
}

/**
 * Update all theme toggle buttons
 */
function updateThemeToggles() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const thumbs = document.querySelectorAll('.switch-thumb');

  thumbs.forEach(thumb => {
    thumb.innerHTML = currentTheme === 'dark' ? MOON_ICON : SUN_ICON;
  });
}

/**
 * Toggle theme between light and dark
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

/**
 * Validate theme variables match expected values
 * @returns {boolean} True if theme is valid
 */
export function validateTheme() {
  const rootStyles = getComputedStyle(document.documentElement);
  const expectedVars = {
    dark: {
      bg: '#0a0a0a',
      fg: '#e0e0e0',
      ac: '#00d4aa'
    },
    light: {
      bg: '#ffffff',
      fg: '#111111',
      ac: '#00a884'
    }
  };

  const currentTheme = document.documentElement.getAttribute('data-theme');
  const expected = expectedVars[currentTheme] || expectedVars[DEFAULT_THEME];

  for (const [varName, expectedValue] of Object.entries(expected)) {
    const actualValue = rootStyles.getPropertyValue(`--${varName}`).trim();
    if (actualValue !== expectedValue) {
      console.error(`Theme validation failed: --${varName} expected ${expectedValue}, got ${actualValue}`);
      return false;
    }
  }

  return true;
}

/**
 * Show theme validation badge
 */
export function showThemeValidator() {
  const validator = document.createElement('div');
  validator.className = 'theme-validator';
  validator.className += validateTheme() ? ' theme-valid' : ' theme-invalid';
  document.body.appendChild(validator);

  // Re-validate on theme change
  const observer = new MutationObserver(() => {
    validator.className = 'theme-validator';
    validator.className += validateTheme() ? ' theme-valid' : ' theme-invalid';
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

/**
 * Initialize theme toggle event listeners
 * @param {string} selector - CSS selector for toggle buttons
 */
export function initThemeToggles(selector = '#theme-toggle') {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
}

// Auto-initialize if this is the main module
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initThemeToggles();
    initThemeToggles('#theme-toggle-mob'); // Mobile toggle
  });
}