import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface NotificationBadgeProps {
  count: number;
  isVisible: boolean;
  isAnimating?: boolean;
  type?: 'message' | 'match' | 'general';
  size?: 'small' | 'medium' | 'large';
  position?: 'topRight' | 'topLeft' | 'center';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  isVisible,
  isAnimating = false,
  type = 'message',
  size = 'medium',
  position = 'topRight'
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Animation d'apparition
  useEffect(() => {
    if (isVisible && count > 0) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, count]);

  // Animation de pulsation pour nouveau message
  useEffect(() => {
    if (isVisible && !isAnimating) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
      
      // Arrêter l'animation après 3 cycles
      setTimeout(() => {
        pulseAnimation.stop();
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 4800);
      
      return () => pulseAnimation.stop();
    }
  }, [isVisible, isAnimating]);

  if (!isVisible || count === 0) {
    return null;
  }

  // Couleurs selon le type
  const getBadgeColor = () => {
    switch (type) {
      case 'message':
        return '#FF8E53'; // Orange NextMate
      case 'match':
        return '#10B981'; // Vert pour matches
      case 'general':
        return '#8B5CF6'; // Violet pour général
      default:
        return '#FF8E53';
    }
  };

  // Tailles selon le prop
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 16,
          height: 16,
          minWidth: 16,
        };
      case 'medium':
        return {
          width: 20,
          height: 20,
          minWidth: 20,
        };
      case 'large':
        return {
          width: 24,
          height: 24,
          minWidth: 24,
        };
      default:
        return {
          width: 20,
          height: 20,
          minWidth: 20,
        };
    }
  };

  // Position selon le prop
  const getPositionStyles = () => {
    const basePosition = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'topRight':
        return {
          ...basePosition,
          top: -8,
          right: -8,
        };
      case 'topLeft':
        return {
          ...basePosition,
          top: -8,
          left: -8,
        };
      case 'center':
        return {
          ...basePosition,
          top: -10,
          left: -10,
        };
      default:
        return {
          ...basePosition,
          top: -8,
          right: -8,
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.badge,
        getSizeStyles(),
        getPositionStyles(),
        {
          backgroundColor: getBadgeColor(),
          transform: [
            { scale: scaleAnim },
            { scale: bounceAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12 }]}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 