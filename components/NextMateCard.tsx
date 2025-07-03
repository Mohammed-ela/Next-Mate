import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { RADIUS, SHADOWS, SPACING } from '../constants/Design';
import { useTheme } from '../context/ThemeContext';

interface NextMateCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'surface' | 'transparent';
  size?: 'small' | 'medium' | 'large';
  shadow?: boolean;
  gradientColors?: [string, string];
}

export const NextMateCard: React.FC<NextMateCardProps> = ({
  children,
  style,
  variant = 'default',
  size = 'medium',
  shadow = true,
  gradientColors,
}) => {
  const { colors } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: RADIUS.CARD,
      ...getSizeStyle(),
      ...(shadow ? SHADOWS.CARD : {}),
    };

    switch (variant) {
      case 'gradient':
        return baseStyle;
      case 'surface':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
        };
      case 'transparent':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.card,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          padding: SPACING.MD,
          marginBottom: SPACING.MD,
        };
      case 'large':
        return {
          padding: SPACING.XXL,
          marginBottom: SPACING.XXL,
        };
      default:
        return {
          padding: SPACING.XL,
          marginBottom: SPACING.XL,
        };
    }
  };

  // Si variant gradient, utiliser LinearGradient
  if (variant === 'gradient') {
    const finalGradientColors = gradientColors || [colors.surface, colors.card];
    
    return (
      <LinearGradient
        colors={finalGradientColors}
        style={[getCardStyle(), style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Sinon, utiliser View normale
  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

// 🎯 VARIANTES PRÉ-CONFIGURÉES COMMUNES
export const GameCard: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <NextMateCard 
    variant="gradient" 
    gradientColors={['rgba(139, 92, 246, 0.08)', 'rgba(139, 92, 246, 0.04)']} 
    style={style}
  >
    {children}
  </NextMateCard>
);

export const UserCard: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <NextMateCard 
    variant="gradient"
    shadow={true}
    style={style}
  >
    {children}
  </NextMateCard>
);

export const ModalCard: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const modalStyle = {
    borderRadius: RADIUS.XXXL,
    ...SHADOWS.MODAL,
    ...style,
  };
  
  return (
    <NextMateCard 
      variant="surface"
      shadow={true}
      size="large"
      style={modalStyle}
    >
      {children}
    </NextMateCard>
  );
};

const styles = StyleSheet.create({
  // Styles supplémentaires si nécessaire
}); 