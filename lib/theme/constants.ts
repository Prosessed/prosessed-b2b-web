export const THEME_STORAGE_KEY = "b2b-theme"

export type ThemeMode = "light" | "dark"

export const applyThemeToDocument = (theme: ThemeMode) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export const readStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "dark" || stored === "light") return stored
  } catch {
    /* ignore */
  }
  return null
}

export const persistTheme = (theme: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}
