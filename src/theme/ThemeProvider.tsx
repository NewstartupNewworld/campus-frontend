import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme, Colors } from './colors';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof Colors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  colors: { ...Colors },
});

const THEME_STORAGE_KEY = 'appThemeIsDark';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [colors, setColors] = useState({ ...Colors });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const darkMode = saved === null ? true : saved === 'true';
        applyTheme(darkMode);
        setIsDark(darkMode);
        setColors({ ...Colors });
      } catch (e) {
        applyTheme(true);
        setColors({ ...Colors });
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
    setColors({ ...Colors });
    AsyncStorage.setItem(THEME_STORAGE_KEY, String(next));
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;