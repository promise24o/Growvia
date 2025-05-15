import { useTheme as useNextTheme } from "next-themes"

export const useTheme = () => {
  const { theme, setTheme, resolvedTheme, themes, systemTheme } = useNextTheme()

  return {
    theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  }
}