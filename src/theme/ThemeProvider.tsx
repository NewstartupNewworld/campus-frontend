import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme } from './colors';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  themeKey: number;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  themeKey: 0,
});

const THEME_STORAGE_KEY = 'appThemeIsDark';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [themeKey, setThemeKey] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const darkMode = saved === null ? true : saved === 'true';
        applyTheme(darkMode);
        setIsDark(darkMode);
      } catch (e) {
        applyTheme(true);
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    applyTheme(next);
    setIsDark(next);
    setThemeKey(k => k + 1);
    AsyncStorage.setItem(THEME_STORAGE_KEY, String(next));
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, themeKey }}>
      {/* key forces a full remount of children when theme toggles,
          so every screen re-reads the freshly-mutated Colors object */}
      <React.Fragment key={themeKey}>
        {children}
      </React.Fragment>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);