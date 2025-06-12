import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StatusBar, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  useGradient?: boolean;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ 
  children, 
  style, 
  useGradient = true 
}) => {
  const { isDarkMode, colors } = useTheme();

  if (useGradient) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={colors.gradient as [string, string]}
          style={[{ flex: 1 }, style]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      {children}
    </View>
  );
}; 