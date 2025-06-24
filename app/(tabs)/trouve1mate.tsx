import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../context/ConversationsContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import UserService, { type UserProfile } from '../../services/userService';

const { width } = Dimensions.get('window');

export default function Trouve1MateScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { colors, isDarkMode } = useTheme();
  const { createConversation } = useConversations();
  const { user: currentUser } = useAuth();
  const { profile } = useUserProfile();

  const loadUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const discoveryUsers = await UserService.getDiscoveryUsers(currentUser?.uid || '');
      setUsers(discoveryUsers);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      Alert.alert(
        '😕 Erreur',
        'Impossible de charger les profils. Vérifiez votre connexion.'
      );
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openProfile = (userId: string) => {
    // Navigation vers la page de profil avec l'ID utilisateur
    router.push(`/user-profile/${userId}`);
  };

  const connectToUser = async (item: UserProfile) => {
    try {
      console.log('🔄 Tentative de connexion avec:', item.name);
      
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
        console.log('✅ Conversation créée/trouvée:', conversationId);
        router.push(`/chat/${conversationId}`);
      }
    } catch (error) {
      console.error('❌ Erreur connexion utilisateur:', error);
      Alert.alert(
        '😕 Erreur',
        'Impossible de créer la conversation. Réessayez plus tard.'
      );
    }
  };

  const renderUserCard = ({ item }: { item: UserProfile }) => {
    const favoriteGames = item.preferences?.favoriteGames || [];
    const userBio = item.preferences?.bio || '';
    
    // Nettoyer la bio : supprimer retours à la ligne multiples et espaces en trop
    const cleanBio = userBio.replace(/\s+/g, ' ').trim();
    
    // Limiter à 80 caractères pour les cards (plus court)
    const displayBio = cleanBio.length > 80 ? `${cleanBio.substring(0, 80)}...` : cleanBio;

    return (
      <LinearGradient
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
              "{displayBio}"
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

  if (loading) {
    return (
      <LinearGradient colors={colors.gradient as [string, string]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8E53" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Recherche de mates...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradient as [string, string]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎮 Trouve 1 Mate</Text>
        <Text style={styles.headerSubtitle}>
          {users.length} gamers disponibles
        </Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadUsers(true)}
            colors={['#FF8E53']}
            tintColor="#FF8E53"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😔</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun mate trouvé
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tirez vers le bas pour actualiser
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 