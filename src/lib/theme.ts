// Light / dark theme handling. The choice is persisted locally; on a first
// visit we honour the operating-system preference.
export type Theme = 'dark' | 'light'

const KEY = 'mmc:v1:theme'

export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  try {
    if (window.matchMedia('(prefers-color-scheme: light)').matches)
      return 'light'
  } catch {
    /* ignore */
  }
  return 'dark'
}

/** Sets the theme attribute without persisting (used at first paint). */
export function setThemeAttribute(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t)
}

/** Sets the theme and remembers the explicit choice. */
export function applyTheme(t: Theme): void {
  setThemeAttribute(t)
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* ignore */
  }
}
