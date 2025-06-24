import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../context/ConversationsContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { BlockingService } from '../../services/blockingService';
import UserService, { type UserProfile } from '../../services/userService';

const { width } = Dimensions.get('window');

export default function Trouve1MateScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors, isDarkMode } = useTheme();
  const { createConversation } = useConversations();
  const { user: currentUser } = useAuth();
  const { profile } = useUserProfile();

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  // 🔄 Rafraîchir automatiquement quand on revient à l'écran
  useFocusEffect(
    useCallback(() => {
      // Vérifier si le cache a été invalidé (après déblocage)
      const lastCacheInvalidation = UserService.getLastCacheInvalidation();
      const now = Date.now();
      
      // Si le cache a été invalidé dans les 5 dernières secondes, recharger
      if (lastCacheInvalidation && (now - lastCacheInvalidation) < 5000) {
        console.log('🔄 Cache invalidé récemment, rechargement automatique...');
        loadUsers();
      }
    }, [])
  );

  const loadUsers = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔍 Chargement des utilisateurs de la plateforme...');
      
      // Vider le cache pour forcer la récupération des nouvelles données
      UserService.clearCache();
      console.log('🧹 Cache vidé pour récupérer les données utilisateur corrigées');
      
      // Récupérer les jeux de l'utilisateur actuel pour un meilleur matching
      const currentUserGameNames = profile?.games?.map(game => game.name) || [];
      
      const platformUsers = await UserService.getDiscoveryUsers(currentUser.uid);
      
      // 🚫 Filtrer les utilisateurs bloqués
      const filteredUsers = await BlockingService.filterBlockedUsers(
        currentUser.uid, 
        platformUsers
      );
      
      setUsers(filteredUsers);
      
      if (filteredUsers.length === 0) {
        setError('Aucun utilisateur trouvé pour le moment');
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement utilisateurs:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const connectToUser = async (targetUser: UserProfile) => {
    try {
      console.log('🔄 Tentative de connexion avec:', targetUser.name);
      
      // Vérifications de sécurité
      if (!targetUser.uid || !targetUser.name) {
        console.error('❌ Données utilisateur incomplètes:', targetUser);
        Alert.alert('❌ Erreur', 'Profil utilisateur incomplet');
        return;
      }

      // Trouver un jeu en commun en utilisant les vrais jeux de l'utilisateur
      const currentUserGames = profile?.games || [];
      const currentUserGameNames = currentUserGames.map(game => game.name).filter(Boolean);
      const targetUserGames = targetUser.preferences?.favoriteGames || [];
      
      const commonGames = targetUserGames.filter((game: string) => 
        currentUserGameNames.includes(game)
      );
      const gameInCommon = commonGames.length > 0 ? commonGames[0] : undefined;

      console.log('🎮 Jeux en commun trouvés:', commonGames);

      // Créer le participant pour la conversation avec des valeurs par défaut sécurisées
      const participant = {
        id: targetUser.uid,
        name: targetUser.name,
        avatar: targetUser.avatar || '🎮',
        isImageAvatar: targetUser.avatar?.startsWith('http') || false,
        isOnline: targetUser.isOnline || false,
        ...(targetUserGames[0] && { currentGame: targetUserGames[0] }),
      };

      console.log('👤 Participant créé:', participant);

      // Créer la conversation (ou récupérer l'existante)
      const conversationId = await createConversation(participant);
      
      if (conversationId) {
        console.log('✅ Conversation créée/trouvée:', conversationId);
        // Rediriger directement vers le chat
        router.push(`/chat/${conversationId}`);
      } else {
        console.error('❌ Échec création conversation');
        Alert.alert(
          '❌ Erreur',
          'Impossible de créer la conversation. Réessaie plus tard.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur connexion utilisateur:', error);
      Alert.alert(
        '❌ Erreur',
        'Une erreur est survenue lors de la connexion.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const openProfile = (targetUser: UserProfile) => {
    const games = targetUser.preferences?.favoriteGames || [];
    const availability = targetUser.preferences?.preferredTimeSlots || [];
    
    const profileInfo = [
      games.length > 0 ? `🎮 Jeux: ${games.join(', ')}` : '',
      availability.length > 0 ? `⏰ Dispo: ${availability.join(', ')}` : '',
      targetUser.preferences?.location ? `📍 Localisation: ${targetUser.preferences.location}` : '',
      targetUser.preferences?.ageRange ? `🎂 Âge: ${targetUser.preferences.ageRange} ans` : '',
    ].filter(Boolean).join('\n');

    const bioText = targetUser.preferences?.bio ? `\n\n"${targetUser.preferences.bio}"` : '';

    Alert.alert(
      `Profil de ${targetUser.name}`,
      profileInfo + bioText,
      [{ text: 'Fermer', style: 'default' }]
    );
  };

  const renderUserCard = ({ item }: { item: UserProfile }) => (
    <View style={[styles.mateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.cardGradient}
      >
        {/* Header avec avatar et infos */}
        <View style={styles.mateHeader}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: item.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)' }]}>
              {item.avatar?.startsWith('http') || item.avatar?.includes('cloudinary') ? (
                <Image 
                  source={{ uri: item.avatar }} 
                  style={styles.avatarImage}
                  onError={() => {
                    console.log('❌ Erreur chargement avatar trouve1mate:', item.avatar);
                  }}
                />
              ) : (
                <Text style={styles.avatarEmoji}>{item.avatar || '🎮'}</Text>
              )}
            </View>
            {item.isOnline && <View style={[styles.onlineIndicator, styles.onlineIndicatorPulse]} />}
          </View>
          
          <View style={styles.mateInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.mateName, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.userInfoRow}>
                {item.preferences?.ageRange && <Text style={[styles.mateAge, { color: colors.textSecondary }]}>{item.preferences.ageRange} ans</Text>}
                {/* Affichage du sexe avec emoji */}
                {item.preferences?.gender && (
                  <Text style={[styles.genderInfo, { color: colors.textSecondary }]}>
                    {item.preferences.gender === 'Homme' ? '♂️' : 
                     item.preferences.gender === 'Femme' ? '♀️' : 
                     item.preferences.gender === 'Autre' ? '⚧️' : ''}
                  </Text>
                )}
              </View>
            </View>
            {item.preferences?.location && (
              <Text style={[styles.mateDistance, { color: colors.textSecondary }]}>📍 {item.preferences.location}</Text>
            )}
            <View style={styles.matchContainer}>
              <Text style={[styles.matchText, { color: colors.textSecondary }]}>⭐ Rating: {item.stats.rating}</Text>
              <Text style={[styles.matchText, { color: colors.textSecondary }]}>🎮 {item.stats.totalGames} jeux</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        {item.preferences?.bio && (
          <Text style={[styles.mateBio, { color: colors.textSecondary }]}>
            {item.preferences.bio}
          </Text>
        )}

        {/* Jeux */}
        {item.preferences?.favoriteGames && item.preferences.favoriteGames.length > 0 && (
          <View style={styles.gamesSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>🎮 Jeux favoris</Text>
            <View style={styles.gamesList}>
              {item.preferences.favoriteGames.slice(0, 4).map((game, index) => (
                <View key={index} style={[styles.gameTag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.gameText, { color: colors.textSecondary }]}>{game}</Text>
                </View>
              ))}
              {item.preferences.favoriteGames.length > 4 && (
                <View style={[styles.gameTag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.gameText, { color: colors.textSecondary }]}>+{item.preferences.favoriteGames.length - 4}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Disponibilités */}
        {item.preferences?.preferredTimeSlots && item.preferences.preferredTimeSlots.length > 0 && (
          <View style={styles.availabilitySection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>⏰ Disponibilités</Text>
            <View style={styles.timesList}>
              {item.preferences.preferredTimeSlots.slice(0, 3).map((time, index) => (
                <View key={index} style={[styles.timeTag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>{time}</Text>
                </View>
              ))}
              {item.preferences.preferredTimeSlots.length > 3 && (
                <View style={[styles.timeTag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>+{item.preferences.preferredTimeSlots.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Statut de jeu actuel */}
        {item.preferences?.favoriteGames && item.preferences.favoriteGames.length > 0 && (
          <View style={styles.currentGameSection}>
            <Ionicons name="game-controller" size={16} color="#FF8E53" />
            <Text style={[styles.currentGameText, { color: colors.textSecondary }]}>
              Jeu favori: {item.preferences.favoriteGames[0]}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: colors.surface }]}
            onPress={() => openProfile(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={20} color={colors.textSecondary} />
            <Text style={[styles.profileText, { color: colors.textSecondary }]}>Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => connectToUser(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF8E53', '#FF6B35']}
              style={styles.connectGradient}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.connectText}>Connect</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // État de chargement
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient colors={colors.gradient as [string, string]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>🎮</Text>
            <Text style={[styles.loadingText, { color: colors.text }]}>Chargement des mates...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // État d'erreur
  if (error && users.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient colors={colors.gradient as [string, string]} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😔</Text>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Oups !</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
              <LinearGradient colors={['#FF8E53', '#FF6B35']} style={styles.retryGradient}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryText}>Réessayer</Text>
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
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trouve ton Mate ! 🎮</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {users.length} gamer{users.length > 1 ? 's' : ''} disponible{users.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Liste des utilisateurs */}
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.uid || `user-${item.name}-${Math.random()}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={refreshUsers}
          ListEmptyComponent={
            !loading && !refreshing ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎮</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun mate trouvé</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Tire vers le bas pour actualiser ou reviens plus tard !
                </Text>
              </View>
            ) : null
          }
        />
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
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  // États de chargement et d'erreur
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
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    borderRadius: 12,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Cartes utilisateurs
  mateCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  mateHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarSection: {
    position: 'relative',
    marginRight: 15,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#2F0C4D',
  },
  onlineIndicatorPulse: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  mateInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mateName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mateAge: {
    fontSize: 14,
  },
  genderInfo: {
    fontSize: 16,
  },
  mateDistance: {
    fontSize: 14,
    marginTop: 4,
  },
  matchContainer: {
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchFill: {
    height: '100%',
    backgroundColor: '#FF8E53',
  },
  mateBio: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 20,
  },
  gamesSection: {
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  gamesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gameTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gameText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  availabilitySection: {
    marginBottom: 15,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  currentGameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  currentGameText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  profileText: {
    fontSize: 14,
    fontWeight: '500',
  },
  connectButton: {
    flex: 1,
    borderRadius: 12,
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
}); 