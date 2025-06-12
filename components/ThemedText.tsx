import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'secondary' | 'title';
  style?: TextStyle;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  type = 'default', 
  style, 
  children,
  ...props 
}) => {
  const { colors } = useTheme();

  const getTextColor = () => {
    switch (type) {
      case 'secondary':
        return colors.textSecondary;
      case 'title':
        return colors.text;
      default:
        return colors.text;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 18, fontWeight: 'bold' as const };
      default:
        return {};
    }
  };

  return (
    <Text 
      style={[
        { color: getTextColor() },
        getTextStyle(),
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}; 