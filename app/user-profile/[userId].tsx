import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../context/ConversationsContext';
import { useTheme } from '../../context/ThemeContext';
import UserService, { type UserProfile } from '../../services/userService';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors, isDarkMode } = useTheme();
  const { createConversation } = useConversations();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      // Récupérer les données utilisateur depuis le cache ou l'API
      const users = await UserService.getDiscoveryUsers(currentUser?.uid || '');
      const targetUser = users.find(u => u.uid === userId);
      
      if (targetUser) {
        setUser(targetUser);
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToUser = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Tentative de connexion avec:', user.name);
      
      const targetUserGames = user.preferences?.favoriteGames || [];
      
      const participant = {
        id: user.uid,
        name: user.name,
        avatar: user.avatar || '🎮',
        isImageAvatar: user.avatar?.startsWith('http') || false,
        isOnline: user.isOnline || false,
        ...(targetUserGames[0] && { currentGame: targetUserGames[0] }),
      };

      const conversationId = await createConversation(participant);
      
      if (conversationId) {
        console.log('✅ Conversation créée/trouvée:', conversationId);
        router.push(`/chat/${conversationId}`);
      }
    } catch (error) {
      console.error('❌ Erreur connexion utilisateur:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient colors={colors.gradient as [string, string]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>🎮</Text>
            <Text style={[styles.loadingText, { color: colors.text }]}>Chargement du profil...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient colors={colors.gradient as [string, string]} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😔</Text>
            <Text style={[styles.errorText, { color: colors.text }]}>Profil introuvable</Text>
            <TouchableOpacity 
              style={styles.backButtonError}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={['#FF8E53', '#FF6B35']}
                style={styles.backButtonGradient}
              >
                <Text style={styles.backButtonText}>Retour</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={colors.gradient as [string, string]} style={styles.gradient}>
        {/* Header moderne et épuré */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Gaming</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section - Design moderne */}
          <LinearGradient
            colors={['rgba(255, 142, 83, 0.08)', 'rgba(255, 107, 53, 0.04)']}
            style={styles.heroSection}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={user.isOnline ? 
                  ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)'] : 
                  ['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0.1)']}
                style={styles.avatarGradient}
              >
                {user.avatar?.startsWith('http') || user.avatar?.includes('cloudinary') ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarEmoji}>{user.avatar || '🎮'}</Text>
                )}
              </LinearGradient>
              {user.isOnline && (
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlinePulse} />
                </View>
              )}
            </View>
            
            <Text style={styles.heroName}>{user.name}</Text>
            
            {/* Infos utilisateur en ligne fluide */}
            <View style={styles.userInfoRow}>
              {user.preferences?.ageRange && (
                <View style={styles.infoChip}>
                  <Text style={styles.infoText}>🎂 {user.preferences.ageRange} ans</Text>
                </View>
              )}
              {user.preferences?.gender && (
                <View style={styles.infoChip}>
                  <Text style={styles.infoText}>
                    {user.preferences.gender === 'Homme' ? '👨' : 
                     user.preferences.gender === 'Femme' ? '👩' : '🧑'} {user.preferences.gender}
                  </Text>
                </View>
              )}
            </View>

            {user.preferences?.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={18} color="#FF8E53" />
                <Text style={styles.locationText}>{user.preferences.location}</Text>
              </View>
            )}
          </LinearGradient>

          {/* Stats en ligne moderne */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#FF8E53', '#FF6B35']}
                style={styles.statIconGradient}
              >
                <Text style={styles.statEmoji}>⭐</Text>
              </LinearGradient>
              <Text style={styles.statValue}>{user.stats.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.statIconGradient}
              >
                <Text style={styles.statEmoji}>🎮</Text>
              </LinearGradient>
              <Text style={styles.statValue}>{user.stats.totalGames}</Text>
              <Text style={styles.statLabel}>Jeux</Text>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={user.isOnline ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
                style={styles.statIconGradient}
              >
                <Text style={styles.statEmoji}>{user.isOnline ? '🟢' : '⚫'}</Text>
              </LinearGradient>
              <Text style={[styles.statValue, { color: user.isOnline ? '#10B981' : '#9CA3AF' }]}>
                {user.isOnline ? 'En ligne' : 'Hors ligne'}
              </Text>
              <Text style={styles.statLabel}>Statut</Text>
            </View>
          </View>

          {/* Biographie moderne */}
          {user.preferences?.bio && (
            <View style={styles.bioCard}>
              <Text style={styles.sectionTitle}>💭 À propos</Text>
              <Text style={styles.bioText}>{user.preferences.bio}</Text>
            </View>
          )}

          {/* Jeux favoris - Layout fluide */}
          {user.preferences?.favoriteGames && user.preferences.favoriteGames.length > 0 && (
            <View style={styles.gamesCard}>
              <Text style={styles.sectionTitle}>🎮 Jeux favoris ({user.preferences.favoriteGames.length})</Text>
              <View style={styles.gamesList}>
                {user.preferences.favoriteGames.map((game, index) => (
                  <View key={index} style={styles.gameChip}>
                    <Text style={styles.gameText}>{game}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Disponibilités - Layout moderne */}
          {user.preferences?.preferredTimeSlots && user.preferences.preferredTimeSlots.length > 0 && (
            <View style={styles.timesCard}>
              <Text style={styles.sectionTitle}>⏰ Disponibilités ({user.preferences.preferredTimeSlots.length})</Text>
              <View style={styles.timesList}>
                {user.preferences.preferredTimeSlots.map((time, index) => (
                  <View key={index} style={styles.timeChip}>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bouton d'action moderne et large */}
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={connectToUser}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF8E53', '#FF6B35']}
              style={styles.connectGradient}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
              <Text style={styles.connectText}>Commencer une conversation</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 30,
  },
  backButtonError: {
    borderRadius: 12,
  },
  backButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Hero Section moderne
  heroSection: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
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
  heroName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  userInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  
  // Stats modernes
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 22,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Cards modernes
  bioCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  gamesCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  timesCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#FFFFFF',
    opacity: 0.9,
    fontStyle: 'italic',
  },
  gamesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gameChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Bouton moderne
  connectButton: {
    marginTop: 8,
    marginBottom: 40,
    borderRadius: 20,
    shadowColor: '#FF8E53',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    gap: 12,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
}); 