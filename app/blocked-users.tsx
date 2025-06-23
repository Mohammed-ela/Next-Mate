import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BlockingService, type BlockedUser } from '../services/blockingService';
import logger from '../utils/logger';

export default function BlockedUsersScreen() {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, [user]);

  const loadBlockedUsers = async (isRefresh = false) => {
    if (!user?.uid) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      logger.info('BlockedUsers', 'Chargement utilisateurs bloqués');
      const blocked = await BlockingService.getBlockedUsers(user.uid);
      setBlockedUsers(blocked);
      
      logger.info('BlockedUsers', `${blocked.length} utilisateurs bloqués trouvés`);
    } catch (error) {
      logger.error('BlockedUsers', 'Erreur chargement utilisateurs bloqués', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs bloqués');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnblockUser = async (blockedUser: BlockedUser) => {
    if (!user?.uid) return;

    Alert.alert(
      'Débloquer utilisateur',
      `Voulez-vous débloquer ${blockedUser.blockedUserName} ?\n\nCette personne pourra à nouveau vous contacter et apparaître dans vos suggestions.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Débloquer',
          style: 'default',
          onPress: async () => {
            try {
              logger.info('BlockedUsers', `Déblocage utilisateur: ${blockedUser.blockedUserName}`);
              
              await BlockingService.unblockUser(user.uid, blockedUser.blockedUserId);
              await loadBlockedUsers(); // Recharger la liste
              
              // 🔄 Invalider spécifiquement le cache discovery pour trouve1mate
              const { UserService } = require('../services/userService');
              UserService.invalidateDiscoveryCache();
              
              Alert.alert(
                '✅ Utilisateur débloqué', 
                `${blockedUser.blockedUserName} a été débloqué avec succès.`
              );
            } catch (error) {
              logger.error('BlockedUsers', 'Erreur déblocage utilisateur', error);
              Alert.alert('❌ Erreur', 'Impossible de débloquer cet utilisateur');
            }
          }
        }
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.userLeft}>
        <View style={[styles.userAvatar, { backgroundColor: colors.surface }]}>
          {item.blockedUserAvatar?.startsWith('http') ? (
            <Image 
              source={{ uri: item.blockedUserAvatar }} 
              style={styles.userAvatarImage}
            />
          ) : (
            <Text style={styles.userAvatarText}>{item.blockedUserAvatar || '🚫'}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.blockedUserName}
          </Text>
          <Text style={[styles.userDate, { color: colors.textSecondary }]}>
            Bloqué le {item.blockedAt.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
          <Text style={[styles.userTime, { color: colors.textSecondary }]}>
            à {item.blockedAt.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.unblockButton, { backgroundColor: colors.primary }]}
        onPress={() => handleUnblockUser(item)}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        <Text style={styles.unblockButtonText}>Débloquer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Aucun utilisateur bloqué
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Vous n'avez bloqué aucun utilisateur.{'\n'}
        Les utilisateurs bloqués apparaîtront ici.
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Retour aux paramètres</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="hourglass" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Chargement...
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Récupération des utilisateurs bloqués
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Utilisateurs bloqués
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {blockedUsers.length} utilisateur{blockedUsers.length > 1 ? 's' : ''} bloqué{blockedUsers.length > 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadBlockedUsers(true)}
            activeOpacity={0.7}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "hourglass" : "refresh"} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {loading ? (
            renderLoadingState()
          ) : blockedUsers.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={blockedUsers}
              renderItem={renderBlockedUser}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={() => loadBlockedUsers(true)}
            />
          )}
        </View>

        {/* Info footer */}
        {blockedUsers.length > 0 && (
          <View style={[styles.infoFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Les utilisateurs débloqués pourront à nouveau vous contacter
            </Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  userAvatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  userTime: {
    fontSize: 12,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
}); 