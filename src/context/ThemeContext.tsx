import { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeContext.Provider value={{ isDarkMode: true }}>
    {children}
  </ThemeContext.Provider>
);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
