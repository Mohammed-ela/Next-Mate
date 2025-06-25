import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// 📝 Types pour les données de slide
export interface SlideData {
  id: string;
  title: string;
  description: string;
  image: any; // Peut être require() pour local ou { uri: string } pour remote
  backgroundColor: [string, string];
  titleColor: string;
  descriptionColor: string;
}

interface OnboardingSlideProp {
  slide: SlideData;
  isActive: boolean;
  index: number;
}

export const OnboardingSlide: React.FC<OnboardingSlideProp> = ({ 
  slide, 
  isActive, 
  index 
}) => {
  // 🎨 Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // 🚀 Animation d'entrée quand le slide devient actif
  useEffect(() => {
    if (isActive) {
      Animated.stagger(200, [
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations quand pas actif
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      scaleAnim.setValue(0.8);
    }
  }, [isActive]);

  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={slide.backgroundColor}
        style={styles.slideGradient}
      >
        {/* 🖼️ Image principale */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.imageWrapper}>
            {typeof slide.image === 'string' ? (
              // Afficher emoji
              <Text style={styles.emojiImage}>{slide.image}</Text>
            ) : (
              // Afficher image (pour compatibilité future)
              <Image 
                source={slide.image}
                style={styles.slideImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Animated.View>

        {/* 📝 Contenu textuel */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.title, { color: slide.titleColor }]}>
            {slide.title}
          </Text>
          
          <Text style={[styles.description, { color: slide.descriptionColor }]}>
            {slide.description}
          </Text>
        </Animated.View>

        {/* ✨ Élément décoratif (optionnel) */}
        <Animated.View 
          style={[
            styles.decorativeElement,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1]
              }),
              transform: [
                { 
                  rotate: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                },
                { scale: scaleAnim }
              ]
            }
          ]}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  imageWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    maxWidth: 300,
    maxHeight: 300,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  slideImage: {
    width: '80%',
    height: '80%',
  },
  textContainer: {
    flex: 0.4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    opacity: 0.9,
  },
  decorativeElement: {
    position: 'absolute',
    top: 100,
    right: 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  emojiImage: {
    fontSize: 100,
    textAlign: 'center',
  },
}); 