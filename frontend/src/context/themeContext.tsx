import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { THEMES, Theme } from '../constants/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  setTheme: () => {},
});

export const ThemesProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('chess-theme');
    if (saved) {
      const found = THEMES.find((t) => t.name === saved || t.className === saved);
      if (found) return found;
    }
    return THEMES[0];
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('chess-theme', newTheme.className);
  };

  useEffect(() => {
    document.documentElement.classList.remove('green', 'wood', 'glass', 'ocean', 'dark-neon');
    document.documentElement.classList.add(theme.className);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme.className}>{children}</div>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
