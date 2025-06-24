import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function FeedbackScreen() {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedRating, setSelectedRating] = useState(0);

  const openPlayStore = async () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.nextmate.app';
    const appStoreUrl = 'https://apps.apple.com/app/nextmate/id123456789';
    
    try {
      // Détecter la plateforme et ouvrir le bon store
      const canOpenPlayStore = await Linking.canOpenURL(playStoreUrl);
      const canOpenAppStore = await Linking.canOpenURL(appStoreUrl);
      
      if (canOpenPlayStore) {
        await Linking.openURL(playStoreUrl);
      } else if (canOpenAppStore) {
        await Linking.openURL(appStoreUrl);
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir le store. Recherchez "NextMate" manuellement dans votre store d\'applications.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le store. Recherchez "NextMate" dans votre store d\'applications.'
      );
    }
  };

  const handleRatingPress = (rating: number) => {
    setSelectedRating(rating);
    
    if (rating >= 4) {
      // Bonne note : rediriger vers le store
      Alert.alert(
        '🌟 Merci !',
        'Votre avis compte beaucoup pour nous ! Voulez-vous nous laisser un avis sur le store ?',
        [
          { text: 'Plus tard', style: 'cancel' },
          { 
            text: 'Oui, avec plaisir !', 
            onPress: openPlayStore 
          }
        ]
      );
    } else {
      // Note moins bonne : feedback interne
      Alert.alert(
        '💬 Aidez-nous à nous améliorer',
        'Nous sommes désolés que votre expérience ne soit pas parfaite. Voulez-vous nous dire ce qui ne va pas ?',
        [
          { text: 'Non merci', style: 'cancel' },
          { 
            text: 'Donner mon feedback', 
            onPress: () => router.push('/contact-support')
          }
        ]
      );
    }
  };

  const feedbackOptions = [
    {
      id: 'love',
      title: '❤️ J\'adore NextMate !',
      subtitle: 'L\'app fonctionne parfaitement',
      action: () => openPlayStore()
    },
    {
      id: 'suggestion',
      title: '💡 J\'ai une suggestion',
      subtitle: 'Idée d\'amélioration ou nouvelle fonctionnalité',
      action: () => router.push('/contact-support')
    },
    {
      id: 'bug',
      title: '🐛 J\'ai trouvé un bug',
      subtitle: 'Problème technique à signaler',
      action: () => router.push('/contact-support')
    },
    {
      id: 'other',
      title: '💬 Autre feedback',
      subtitle: 'Commentaire général',
      action: () => router.push('/contact-support')
    }
  ];

  const renderStar = (index: number) => (
    <TouchableOpacity
      key={index}
      onPress={() => handleRatingPress(index + 1)}
      style={styles.starButton}
    >
      <Ionicons
        name={index < selectedRating ? 'star' : 'star-outline'}
        size={40}
        color={index < selectedRating ? '#FFD700' : colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Donner un avis
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Rating Section */}
          <View style={[styles.ratingSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>
              🌟 Que pensez-vous de NextMate ?
            </Text>
            <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>
              Votre avis nous aide à améliorer l'expérience pour tous les gamers
            </Text>
            
            <View style={styles.starsContainer}>
              {[0, 1, 2, 3, 4].map(renderStar)}
            </View>
            
            {selectedRating > 0 && (
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {selectedRating === 1 && "😞 Décevant"}
                {selectedRating === 2 && "😐 Peut mieux faire"}
                {selectedRating === 3 && "🙂 Correct"}
                {selectedRating === 4 && "😊 Très bien"}
                {selectedRating === 5 && "🤩 Excellent"}
              </Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              💬 Actions rapides
            </Text>
            
            {feedbackOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.feedbackOption, { backgroundColor: colors.card }]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={styles.feedbackContent}>
                  <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.feedbackSubtitle, { color: colors.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Store Links */}
          <View style={[styles.storeSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.storeSectionTitle, { color: colors.text }]}>
              📱 Évaluez NextMate sur les stores
            </Text>
            <Text style={[styles.storeSectionText, { color: colors.textSecondary }]}>
              Votre avis aide d'autres gamers à découvrir NextMate
            </Text>
            
            <TouchableOpacity
              style={[styles.storeButton, { backgroundColor: colors.primary }]}
              onPress={openPlayStore}
            >
              <Ionicons name="star" size={20} color="#FFFFFF" />
              <Text style={styles.storeButtonText}>
                Laisser un avis sur le store
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>
              📊 NextMate en chiffres
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>10K+</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gamers actifs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>50K+</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Matches créés</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>4.8⭐</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Note moyenne</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ratingSection: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  feedbackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  storeSection: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  storeSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  storeSectionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  storeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  statsSection: {
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 