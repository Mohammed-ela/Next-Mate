import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TypingIndicator as TypingIndicatorType } from '../services/messagesService';

interface TypingIndicatorProps {
  indicators: TypingIndicatorType[];
  style?: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  indicators, 
  style 
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Animation d'apparition/disparition
  useEffect(() => {
    if (indicators.length > 0) {
      // Apparition avec animation fluide
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animation des points qui dansent
      const createDotAnimation = (index: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(dotAnimations[index], {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnimations[index], {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        );
      };

      // Démarrer les animations avec délai échelonné
      dotAnimations.forEach((_, index) => {
        setTimeout(() => {
          createDotAnimation(index).start();
        }, index * 200);
      });
    } else {
      // Disparition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Arrêter les animations des points
      dotAnimations.forEach(anim => anim.stopAnimation());
    }
  }, [indicators.length]);

  // Texte formaté pour plusieurs utilisateurs
  const getTypingText = (): string => {
    if (indicators.length === 0) return '';
    
    if (indicators.length === 1) {
      return `${indicators[0].userName} est en train d'écrire`;
    } else if (indicators.length === 2) {
      return `${indicators[0].userName} et ${indicators[1].userName} sont en train d'écrire`;
    } else {
      return `${indicators[0].userName} et ${indicators.length - 1} autres sont en train d'écrire`;
    }
  };

  if (indicators.length === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: fadeAnim 
        },
        style
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            {getTypingText()}
          </Text>
        </View>
        
        <View style={styles.dotsContainer}>
          {dotAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.primary,
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
}); 