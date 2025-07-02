import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../context/ConversationsContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import AiMatchingService from '../../services/aiMatchingService';
import UserService, { type UserProfile } from '../../services/userService';

// Suggestions de prompts prédéfinis
const PROMPT_SUGGESTIONS = [
  "Un teammate chill pour du Valorant le soir",
  "Quelqu&apos;un de compétitif pour progresser ensemble", 
  "Un partenaire détente pour des jeux coopératifs",
  "Une personne motivée pour du gaming sérieux",
  "Un mate pour des sessions gaming longues",
];

export default function AiMatchingScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { createConversation } = useConversations();
  const insets = useSafeAreaInsets();

  // États
  const [prompt, setPrompt] = useState('');
  const [recommendations, setRecommendations] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<{ requestsToday: number; canRequest: boolean; nextAvailableTime?: Date } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // 🎨 Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 📊 Charger les statistiques utilisateur
  useEffect(() => {
    if (user?.uid) {
      loadUserStats();
    }
  }, [user?.uid]);

  const loadUserStats = async () => {
    if (!user?.uid) return;
    try {
      const stats = await AiMatchingService.getUserStats(user.uid);
      setUserStats(stats);
    } catch (error) {
      console.error('❌ Erreur chargement stats IA:', error);
    }
  };

  // 👤 Ouvrir le profil d'un utilisateur
  const openProfile = (userId: string) => {
    router.push(`/user-profile/${userId}`);
  };

  // 🤖 Générer les recommandations IA
  const generateRecommendations = async () => {
    if (!prompt.trim() || !user?.uid || !profile) {
      Alert.alert('⚠️ Erreur', 'Veuillez décrire le type de mate que vous recherchez');
      return;
    }

    setLoading(true);
    try {
      console.log('🤖 Génération recommandations IA...');

      // 1. Récupérer tous les utilisateurs disponibles
      const allUsers = await UserService.getDiscoveryUsers(user.uid);
      
      if (allUsers.length < 3) {
        Alert.alert('😔 Pas assez d&apos;utilisateurs', 'Il n&apos;y a pas assez d&apos;utilisateurs dans la base pour générer des recommandations IA. Réessayez plus tard.');
        return;
      }

      // 2. Générer les recommandations avec Mistral
      const aiRecommendations = await AiMatchingService.generateRecommendations(
        user.uid,
        profile,
        prompt.trim(),
        allUsers
      );

      setRecommendations(aiRecommendations);
      setShowSuggestions(false);
      await loadUserStats(); // Recharger les stats

      console.log('✅ Recommandations IA générées:', aiRecommendations.length);

    } catch (error) {
      console.error('❌ Erreur génération IA:', error);
      Alert.alert(
        '🤖 Erreur IA',
        error instanceof Error ? error.message : 'Le service IA est temporairement indisponible'
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Reset pour une nouvelle recherche
  const resetSearch = () => {
    setRecommendations([]);
    setPrompt('');
    setShowSuggestions(true);
  };

  // 🎯 Connecter avec un utilisateur recommandé
  const connectToUser = async (item: UserProfile) => {
    try {
      const targetUserGames = item.preferences?.favoriteGames || [];
      
      const participant = {
        id: item.uid,
        name: item.name,
        avatar: item.avatar || '🎮',
        isImageAvatar: item.avatar?.startsWith('http') || false,
        isOnline: item.isOnline || false,
        ...(targetUserGames[0] && { currentGame: targetUserGames[0] }),
      };

      const conversationId = await createConversation(participant);
      
      if (conversationId) {
        console.log('✅ Conversation IA créée:', conversationId);
        router.push(`/chat/${conversationId}`);
      }
    } catch (error) {
      console.error('❌ Erreur connexion utilisateur IA:', error);
      Alert.alert('😕 Erreur', 'Impossible de créer la conversation. Réessayez plus tard.');
    }
  };

  // 🎴 Rendu des cartes de recommandation (même format que trouve1mate)
  const renderRecommendationCard = (item: UserProfile) => {
    const favoriteGames = item.preferences?.favoriteGames || [];
    const userBio = item.preferences?.bio || '';
    
    // Nettoyer la bio : supprimer retours à la ligne multiples et espaces en trop
    const cleanBio = userBio.replace(/\s+/g, ' ').trim();
    
    // Limiter à 80 caractères pour les cards (plus court)
    const displayBio = cleanBio.length > 80 ? `${cleanBio.substring(0, 80)}...` : cleanBio;

    return (
      <LinearGradient
        key={item.uid}
        colors={[colors.surface, colors.card]}
        style={styles.userCard}
      >
        {/* Header de la carte */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={item.isOnline ? 
                ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)'] : 
                ['rgba(107, 114, 128, 0.3)', 'rgba(107, 114, 128, 0.1)']}
              style={styles.avatarGradient}
            >
              {item.avatar?.startsWith('http') || item.avatar?.includes('cloudinary') ? (
                <Image 
                  source={{ uri: item.avatar }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarEmoji}>{item.avatar || '🎮'}</Text>
              )}
            </LinearGradient>
            {item.isOnline && (
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.onlineIndicator}
              >
                <View style={styles.onlinePulse} />
              </LinearGradient>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
            
            <View style={styles.userTags}>
              {item.preferences?.ageRange && (
                <View style={[styles.userTag, { backgroundColor: colors.background }]}>
                  <Text style={[styles.userTagText, { color: colors.text }]}>🎂 {item.preferences.ageRange}</Text>
                </View>
              )}
              {item.preferences?.gender && (
                <View style={[styles.userTag, { backgroundColor: colors.background }]}>
                  <Text style={[styles.userTagText, { color: colors.text }]}>
                    {item.preferences.gender === 'Homme' ? '👨' : 
                     item.preferences.gender === 'Femme' ? '👩' : '🧑'} {item.preferences.gender.slice(0, 1)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.stats.rating}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🎮</Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.stats.totalGames}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>{item.isOnline ? '🟢' : '⚫'}</Text>
                <Text style={[styles.statText, { color: item.isOnline ? '#10B981' : colors.textSecondary }]}>
                  {item.isOnline ? 'En ligne' : 'Hors ligne'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Biographie */}
        {displayBio && (
          <View style={styles.bioSection}>
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>
              &ldquo;{displayBio}&rdquo;
            </Text>
          </View>
        )}

        {/* Jeux favoris */}
        {favoriteGames.length > 0 && (
          <View style={styles.gamesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎮 Jeux favoris ({favoriteGames.length})
            </Text>
            <View style={styles.gamesList}>
              {favoriteGames.slice(0, 3).map((game, index) => (
                <View key={index} style={[styles.gameChip, { backgroundColor: colors.background }]}>
                  <Text style={[styles.gameText, { color: '#8B5CF6' }]}>{game}</Text>
                </View>
              ))}
              {favoriteGames.length > 3 && (
                <View style={[styles.gameChip, { backgroundColor: colors.background }]}>
                  <Text style={[styles.gameText, { color: colors.textSecondary }]}>+{favoriteGames.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Disponibilités */}
        {item.preferences?.preferredTimeSlots && item.preferences.preferredTimeSlots.length > 0 && (
          <View style={styles.timeSlotsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ⏰ Disponibilités ({item.preferences.preferredTimeSlots.length})
            </Text>
            <View style={styles.timeSlotsList}>
              {item.preferences.preferredTimeSlots.slice(0, 2).map((timeSlot, index) => (
                <View key={index} style={[styles.timeSlotChip, { backgroundColor: colors.background }]}>
                  <Text style={[styles.timeSlotText, { color: '#10B981' }]}>{timeSlot}</Text>
                </View>
              ))}
              {item.preferences.preferredTimeSlots.length > 2 && (
                <View style={[styles.timeSlotChip, { backgroundColor: colors.background }]}>
                  <Text style={[styles.timeSlotText, { color: colors.textSecondary }]}>+{item.preferences.preferredTimeSlots.length - 2}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Localisation */}
        {item.preferences?.location && (
          <View style={styles.locationSection}>
            <Ionicons name="location" size={16} color="#FF8E53" />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{item.preferences.location}</Text>
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.profileButton]}
            onPress={() => openProfile(item.uid)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.buttonGradient}
            >
              <Ionicons name="person" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Profil</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.connectButton]}
            onPress={() => connectToUser(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF8E53', '#FF6B35']}
              style={styles.buttonGradient}
            >
              <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Connecter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={colors.gradient as [string, string]} style={styles.gradient}>
        
        {/* Header avec stats */}
        <Animated.View style={[styles.header, { paddingTop: insets.top + 15, opacity: fadeAnim }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <LinearGradient
                colors={['#8B5CF6', '#FF8E53']}
                style={styles.titleGradient}
              >
                <Ionicons name="construct" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.headerTitleText}>IA Premium</Text>
            </View>
            
            {userStats && (
              <View style={styles.statsContainer}>
                <Text style={[styles.statsText, { color: colors.text }]}>
                  {userStats.canRequest ? 
                    `${userStats.requestsToday}/1 requête utilisée aujourd'hui` :
                    'Limite atteinte'
                  }
                </Text>
                {!userStats.canRequest && userStats.nextAvailableTime && (
                  <Text style={[styles.nextAvailableText, { color: colors.textSecondary }]}>
                    Prochaine requête: {userStats.nextAvailableTime.toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Zone de prompt - Masquée quand il y a des recommandations */}
          {recommendations.length === 0 && (
            <Animated.View style={[styles.promptSection, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={[colors.surface, colors.card]}
                style={styles.promptContainer}
              >
                <Text style={[styles.promptTitle, { color: colors.text }]}>
                  🤖 Décrivez votre mate idéal
                </Text>
                                 <Text style={[styles.promptSubtitle, { color: colors.textSecondary }]}>
                   L&apos;IA analysera votre demande et vous proposera 3 profils personnalisés
                 </Text>
                
                <TextInput
                  style={[styles.promptInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Ex: Je cherche un teammate chill pour du Valorant le soir..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={200}
                  onFocus={() => setShowSuggestions(false)}
                  editable={!loading}
                />
                
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {prompt.length}/200 caractères
                </Text>

                {/* Bouton génération - RATE LIMITING DÉSACTIVÉ POUR TESTS */}
                <TouchableOpacity
                  style={[styles.generateButton, { opacity: (prompt.trim() && !loading) ? 1 : 0.5 }]}
                  onPress={generateRecommendations}
                  disabled={!prompt.trim() || loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#FF8E53']}
                    style={styles.generateButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="construct" size={20} color="#FFFFFF" />
                    )}
                    <Text style={styles.generateButtonText}>
                      {loading ? 'IA en cours...' : 'Générer mes 3 mates IA'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Suggestions rapides - Affichées seulement quand pas de recommandations */}
          {showSuggestions && !loading && recommendations.length === 0 && (
            <Animated.View style={[styles.suggestionsSection, { opacity: fadeAnim }]}>
              <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
                💡 Suggestions rapides
              </Text>
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionButton, { backgroundColor: colors.surface }]}
                  onPress={() => setPrompt(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Résultats IA avec cartes détaillées */}
          {recommendations.length > 0 && (
            <Animated.View style={[styles.resultsSection, { opacity: fadeAnim }]}>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsTitle, { color: colors.text }]}>
                  🎯 Vos 3 mates recommandés par l'IA
                </Text>
                <TouchableOpacity
                  style={[styles.newSearchButton, { backgroundColor: colors.surface }]}
                  onPress={resetSearch}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color={colors.text} />
                  <Text style={[styles.newSearchText, { color: colors.text }]}>Reset</Text>
                </TouchableOpacity>
              </View>
              
              {recommendations.map(renderRecommendationCard)}
            </Animated.View>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextAvailableText: {
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  promptSection: {
    marginBottom: 20,
  },
  promptContainer: {
    borderRadius: 20,
    padding: 20,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  promptInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  generateButton: {
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  resultsSection: {
    marginTop: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  newSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  newSearchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Styles des cartes (copiés de trouve1mate.tsx)
  userCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlinePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  userTag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  userTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bioSection: {
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  gamesSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  gamesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gameChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeSlotsSection: {
    marginBottom: 15,
  },
  timeSlotsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeSlotChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileButton: {
    shadowColor: '#8B5CF6',
  },
  connectButton: {
    shadowColor: '#FF8E53',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 15,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 