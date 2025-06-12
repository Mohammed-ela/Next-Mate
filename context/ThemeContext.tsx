import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  gradient: string[];
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  globalStyles: any;
}

const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#581C87',
  secondary: '#FF8E53',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#D1D5DB',
  card: '#FFFFFF',
  gradient: ['#F8FAFC', '#E2E8F0'],
};

const darkTheme: ThemeColors = {
  background: '#2F0C4D',
  surface: 'rgba(255, 255, 255, 0.1)',
  primary: '#581C87',
  secondary: '#FF8E53',
  text: '#FFFFFF',
  textSecondary: '#FFFFFF80',
  border: 'rgba(255, 255, 255, 0.1)',
  card: 'rgba(255, 255, 255, 0.05)',
  gradient: ['#2F0C4D', '#471573'],
};

// Styles globaux qui s'appliquent automatiquement
const createGlobalStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.secondary,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
  },
});

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  colors: darkTheme,
  globalStyles: {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
      console.log(`🎨 Thème changé: ${newTheme ? 'Sombre' : 'Clair'}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const colors = isDarkMode ? darkTheme : lightTheme;
  const globalStyles = createGlobalStyles(colors);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, globalStyles }}>
      {children}
    </ThemeContext.Provider>
  );
}; 