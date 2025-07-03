import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../constants/Design';
import { useTheme } from '../context/ThemeContext';

interface InteractiveBadgeProps {
  count: number;
  isAnimating?: boolean;
  onPress?: () => void;
  onAnimationComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: any;
  color?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  children?: React.ReactNode;
}

export const InteractiveBadge: React.FC<InteractiveBadgeProps> = ({
  count,
  isAnimating = false,
  onPress,
  onAnimationComplete,
  size = 'medium',
  style,
  textStyle,
  color,
  position = 'top-right',
  children,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🎯 Animation de disparition
  useEffect(() => {
    if (isAnimating) {
      Animated.sequence([
        // Grossissement
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        // Disparition
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onAnimationComplete?.();
      });
    } else {
      // Réinitialiser les animations
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [isAnimating, scaleAnim, opacityAnim, onAnimationComplete]);

  // 💫 Animation de pulsation pour nouveaux messages
  useEffect(() => {
    if (count > 0 && !isAnimating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [count, isAnimating, pulseAnim]);

  // 📏 Tailles selon le props size
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { minWidth: 18, height: 18, borderRadius: 9 };
      case 'large':
        return { minWidth: 32, height: 32, borderRadius: 16 };
      default:
        return { minWidth: 24, height: 24, borderRadius: RADIUS.MD };
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: TYPOGRAPHY.FONT_SIZE.XS, fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD };
      case 'large':
        return { fontSize: TYPOGRAPHY.FONT_SIZE.MD, fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD };
      default:
        return { fontSize: TYPOGRAPHY.FONT_SIZE.SM, fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD };
    }
  };

  // 📍 Position du badge
  const getPositionStyle = (): ViewStyle => {
    const offset = size === 'small' ? -6 : size === 'large' ? -8 : -4;
    
    switch (position) {
      case 'top-left':
        return { top: offset, left: offset };
      case 'bottom-right':
        return { bottom: offset, right: offset };
      case 'bottom-left':
        return { bottom: offset, left: offset };
      default:
        return { top: offset, right: offset };
    }
  };

  if (count <= 0) {
    return children ? <>{children}</> : null;
  }

  const badgeColor = color || COLORS.PRIMARY_ORANGE;
  const displayCount = count > 99 ? '99+' : count.toString();

  const BadgeComponent = (
    <Animated.View
      style={[
        styles.badge,
        getSizeStyle(),
        {
          backgroundColor: badgeColor,
          opacity: opacityAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ],
        },
        getPositionStyle(),
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          getTextStyle(),
          { color: COLORS.WHITE },
          textStyle,
        ]}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );

  // Si onPress est fourni, rendre le badge cliquable
  if (onPress) {
    return (
      <View style={styles.container}>
        {children}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          {BadgeComponent}
        </TouchableOpacity>
      </View>
    );
  }

  // Badge simple avec children
  if (children) {
    return (
      <View style={styles.container}>
        {children}
        {BadgeComponent}
      </View>
    );
  }

  // Badge seul
  return BadgeComponent;
};

// 🎨 Composant Badge de notification optimisé
export const NotificationBadge: React.FC<{
  conversationId: string;
  count: number;
  isAnimating?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
}> = ({ conversationId, count, isAnimating, onPress, size, children }) => {
  const handlePress = () => {
    console.log('🎯 Badge cliqué pour conversation:', conversationId);
    onPress?.();
  };

  return (
    <InteractiveBadge
      count={count}
      isAnimating={isAnimating}
      onPress={handlePress}
      size={size}
      color="#FF8E53"
    >
      {children}
    </InteractiveBadge>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  touchable: {
    position: 'absolute',
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default InteractiveBadge; 