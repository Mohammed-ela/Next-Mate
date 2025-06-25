import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingSlide, type SlideData } from '../components/OnboardingSlide';
import { useOnboarding } from '../context/OnboardingContext';

const { width } = Dimensions.get('window');

// 🎨 Données des slides d'onboarding NextMate
const ONBOARDING_SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'Bienvenue sur NextMate',
    description: 'Trouve ton coéquipier gaming idéal ! Connecte-toi avec des joueurs qui partagent tes jeux favoris et ton style de jeu.',
    image: '🎮', // Emoji au lieu d'une URL
    backgroundColor: ['#581C87', '#7C3AED'] as [string, string],
    titleColor: '#FFFFFF',
    descriptionColor: '#E5E7EB',
  },
  {
    id: '2',
    title: 'Matchs Intelligents',
    description: 'Notre algorithme trouve des gamers compatibles basé sur vos jeux en commun, disponibilités et styles de jeu.',
    image: '🎯', // Emoji au lieu d'une URL
    backgroundColor: ['#7C3AED', '#FF8E53'] as [string, string],
    titleColor: '#FFFFFF',
    descriptionColor: '#FEF3C7',
  },
  {
    id: '3',
    title: 'Chat et Équipes',
    description: 'Communique en temps réel, forme des équipes et lance des invitations de jeu directement depuis l\'app !',
    image: '💬', // Emoji au lieu d'une URL
    backgroundColor: ['#FF8E53', '#F97316'] as [string, string],
    titleColor: '#FFFFFF',
    descriptionColor: '#FFF7ED',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding } = useOnboarding();
  const insets = useSafeAreaInsets();
  
  // 📱 Références pour le carousel
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // 🎯 Navigation vers le slide suivant
  const goToNextSlide = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  // 🎯 Navigation vers le slide précédent
  const goToPreviousSlide = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  // ✅ Terminer l'onboarding
  const handleCompleteOnboarding = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      // Redirection vers l'écran d'authentification ou principal
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('❌ Erreur completion onboarding:', error);
      setIsCompleting(false);
    }
  };

  // 🔄 Gestion du scroll manuel
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < ONBOARDING_SLIDES.length) {
      setCurrentIndex(newIndex);
    }
  };

  // 🎨 Rendu d'un slide
  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => (
    <OnboardingSlide 
      slide={item} 
      isActive={index === currentIndex}
      index={index}
    />
  );

  // 🔵 Indicateurs de pagination
  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {ONBOARDING_SLIDES.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.paginationDot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: index === currentIndex ? '#FF8E53' : '#FFFFFF',
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 🎠 Carousel principal */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* 🔵 Indicateurs de pagination */}
      {renderPaginationDots()}

      {/* 🎮 Contrôles de navigation */}
      <View style={[styles.navigationContainer, { bottom: insets.bottom + 20 }]}>
        {/* Bouton précédent */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.navigationButton, styles.previousButton]}
            onPress={goToPreviousSlide}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Précédent</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        {/* Bouton suivant / commencer */}
        <TouchableOpacity
          style={[styles.navigationButton, styles.nextButton]}
          onPress={isLastSlide ? handleCompleteOnboarding : goToNextSlide}
          activeOpacity={0.8}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {isLastSlide ? 'Commencer' : 'Suivant'}
              </Text>
              <Ionicons 
                name={isLastSlide ? 'rocket' : 'chevron-forward'} 
                size={24} 
                color="#FFFFFF" 
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 🔗 Lien "Passer" en haut à droite */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 10 }]}
        onPress={handleCompleteOnboarding}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#581C87',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigationContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  previousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButton: {
    backgroundColor: '#FF8E53',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  spacer: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 