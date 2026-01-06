import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'green' | 'teal' | 'blue' | 'purple';

interface ThemeContextType {
  mode: ThemeMode;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.mode || 'dark';
    }
    return 'dark';
  });

  const [color, setColorState] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.color || 'green';
    }
    return 'green';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply mode
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color theme
    root.setAttribute('data-theme-color', color);

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode, color }));
  }, [mode, color]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setColor = (newColor: ThemeColor) => {
    setColorState(newColor);
  };

  return (
    <ThemeContext.Provider value={{ mode, color, setMode, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
