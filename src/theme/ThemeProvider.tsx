import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, spacing, typography } from './tokens';

type WealthTheme = {
  colorScheme: 'light' | 'dark';
  colors: typeof lightColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const ThemeContext = createContext<WealthTheme | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const value = useMemo<WealthTheme>(
    () => ({
      colorScheme: scheme === 'dark' ? 'dark' : 'light',
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useWealthTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useWealthTheme must be used inside ThemeProvider');
  }
  return theme;
}
