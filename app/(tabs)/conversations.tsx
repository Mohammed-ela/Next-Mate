import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InteractiveBadge from '../../components/InteractiveBadge';
import { NotificationBadge } from '../../components/NotificationBadge';
import { useAuth } from '../../context/AuthContext';
import { useConversations, type Conversation } from '../../context/ConversationsContext';
import { useBadgeNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/userService';

// Configuration ultra-optimisée
const PERFORMANCE_CONFIG = {
  ANIMATION_DURATION: 120, // Plus rapide
  STAGGERED_DELAY: 15, // Délai réduit entre animations
  SEARCH_DEBOUNCE: 150, // Debounce recherche optimisé
  REFRESH_THRESHOLD: 40, // Pull-to-refresh threshold réduit
  ITEM_HEIGHT: 88, // Hauteur optimisée pour le contenu
  RENDER_BATCH_SIZE: 8, // Rendu par batch optimisé
  WINDOW_SIZE: 8, // Fenêtre de rendu réduite
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ConversationsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { conversations, loading, deleteConversation, syncAllParticipantData } = useConversations();
  const { animateBadgeDisappear, updateBadge, clearBadge } = useBadgeNotifications();
  const insets = useSafeAreaInsets();

  // États optimisés
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Animations optimisées
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const badgeAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;

  // 🎨 Animation d'entrée optimisée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: PERFORMANCE_CONFIG.ANIMATION_DURATION * 2,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: PERFORMANCE_CONFIG.ANIMATION_DURATION * 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 🔍 Animation recherche optimisée
  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchFocused ? 1 : 0,
      duration: PERFORMANCE_CONFIG.ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [searchFocused]);

  // 🔄 Synchronisation des badges avec les conversations
  useEffect(() => {
    conversations.forEach(conversation => {
      const unreadCount = conversation.unreadCount || 0;
      if (unreadCount > 0) {
        updateBadge(conversation.id, unreadCount);
      } else {
        clearBadge(conversation.id);
      }
    });
  }, [conversations, updateBadge, clearBadge]);

  // 📱 Filtrage optimisé avec useMemo
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase().trim();
    return conversations.filter(conversation => {
      const participant = conversation.participants[0];
      return participant?.name?.toLowerCase().includes(query) ||
             conversation.lastMessage?.content?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery]);

  // 🔄 Pull-to-refresh optimisé avec vraie synchronisation
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refresh conversations - Synchronisation des profils participants...');
      
      // 1. Invalider le cache des profils utilisateurs
      UserService.clearCache();
      
      // 2. Synchroniser toutes les données des participants dans les conversations
      await syncAllParticipantData();
      
      console.log('✅ Refresh conversations terminé - Profils participants synchronisés');
    } catch (error) {
      console.error('❌ Erreur refresh conversations:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncAllParticipantData]);

  // 🗑️ Suppression optimisée avec animation
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      // Animation de disparition du badge
      const badgeAnim = badgeAnimations.get(conversationId);
      if (badgeAnim) {
        Animated.timing(badgeAnim, {
          toValue: 0,
          duration: PERFORMANCE_CONFIG.ANIMATION_DURATION,
          useNativeDriver: true,
        }).start();
      }

      await deleteConversation(conversationId);
      animateBadgeDisappear(conversationId);
      
      // Nettoyage de l'animation
      badgeAnimations.delete(conversationId);
      
    } catch (error) {
      console.error('Erreur suppression conversation:', error);
      Alert.alert('❌ Erreur', 'Impossible de supprimer la conversation');
    }
  }, [deleteConversation, animateBadgeDisappear, badgeAnimations]);

  // 📤 Navigation optimisée vers le chat
  const handleConversationPress = useCallback((conversationId: string) => {
    // Animation de disparition du badge
    const badgeAnim = badgeAnimations.get(conversationId);
    if (badgeAnim) {
      Animated.timing(badgeAnim, {
        toValue: 0,
        duration: PERFORMANCE_CONFIG.ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }

    animateBadgeDisappear(conversationId);
    router.push(`/chat/${conversationId}`);
  }, [animateBadgeDisappear, badgeAnimations]);

  // 🕐 Formatage optimisé du temps
  const formatLastMessageTime = useCallback((timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffInMinutes < 10080) return timestamp.toLocaleDateString('fr-FR', { weekday: 'short' });
    return timestamp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }, []);

  // 🎯 Rendu d'item optimisé avec animations
  const renderConversationItem = useCallback(({ item, index }: { item: Conversation; index: number }) => {
    const participant = item.participants[0];
    const hasUnreadMessages = (item.unreadCount || 0) > 0;
    
    // Compteur de messages non lus pour cette conversation spécifique
    const conversationUnreadCount = item.unreadCount || 0;
    
    // Initialiser l'animation du badge si nécessaire
    if (conversationUnreadCount > 0 && !badgeAnimations.has(item.id)) {
      badgeAnimations.set(item.id, new Animated.Value(1));
    }

    const badgeOpacity = badgeAnimations.get(item.id) || new Animated.Value(conversationUnreadCount > 0 ? 1 : 0);

    return (
      <Animated.View
        style={[
          styles.conversationItem,
          {
            backgroundColor: colors.surface,
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50],
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() => handleConversationPress(item.id)}
          activeOpacity={0.8}
        >
          {/* Avatar optimisé */}
          <View style={styles.avatarContainer}>
            {participant.avatar.startsWith('http') ? (
              <Image 
                source={{ uri: participant.avatar }} 
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarEmoji}>{participant.avatar}</Text>
            )}
            
            {/* Badge animé optimisé */}
            {conversationUnreadCount > 0 && (
              <Animated.View
                style={[
                  styles.unreadBadgeContainer,
                  {
                    opacity: badgeOpacity,
                    transform: [
                      {
                        scale: badgeOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        })
                      }
                    ]
                  }
                ]}
              >
                <NotificationBadge
                  count={conversationUnreadCount}
                  isVisible={conversationUnreadCount > 0}
                  isAnimating={false}
                  type="message"
                  size="medium"
                  position="topRight"
                />
              </Animated.View>
            )}
          </View>

          {/* Contenu conversation optimisé */}
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text 
                style={[
                  styles.participantName, 
                  { color: colors.text },
                  hasUnreadMessages && styles.unreadText
                ]}
                numberOfLines={1}
              >
                {participant.name}
              </Text>
              
              {item.lastMessage && (
                <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                  {formatLastMessageTime(item.lastMessage.timestamp)}
                </Text>
              )}
            </View>

            {item.lastMessage && (
              <Text 
                style={[
                  styles.lastMessage, 
                  { color: colors.textSecondary },
                  hasUnreadMessages && styles.unreadLastMessage
                ]}
                numberOfLines={2}
              >
                {item.lastMessage.senderId === user?.uid ? 'Vous: ' : ''}
                {item.lastMessage.content}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Bouton suppression optimisé */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: '#FF4444' }]}
          onPress={() => {
            setConversationToDelete(item.id);
            setDeleteModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [
    colors, 
    fadeAnim, 
    slideAnim, 
    user?.uid, 
    handleConversationPress, 
    formatLastMessageTime,
    badgeAnimations,
    conversations
  ]);

  // 🎨 Animations recherche
  const searchContainerStyle = {
    transform: [
      {
        scaleY: searchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        })
      }
    ],
    opacity: searchAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    })
  };

  // 🚀 Early return pour état vide optimisé
  if (loading && conversations.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement des conversations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header optimisé avec gradient */}
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 15 }]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Conversations
        </Text>
        
        {/* Badge global optimisé */}
        {conversations.length > 0 && (
          <View style={styles.globalBadgeContainer}>
            <InteractiveBadge
              count={conversations.length}
              position="top-right"
              size="large"
            />
          </View>
        )}
      </LinearGradient>

      {/* Barre de recherche optimisée */}
      <Animated.View style={[styles.searchContainer, searchContainerStyle]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une conversation..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Liste conversations optimisée */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          style={styles.conversationsList}
          contentContainerStyle={styles.conversationsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={colors.surface}
            />
          }
          // Optimisations performances
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          getItemLayout={(data, index) => ({
            length: PERFORMANCE_CONFIG.ITEM_HEIGHT,
            offset: PERFORMANCE_CONFIG.ITEM_HEIGHT * index,
            index,
          })}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            {searchQuery 
              ? `Aucune conversation ne correspond à "${searchQuery}"`
              : 'Commencez à matcher pour voir vos conversations ici'
            }
          </Text>
        </Animated.View>
      )}

      {/* Modal suppression optimisée */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Supprimer la conversation
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setConversationToDelete(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonModal, { backgroundColor: '#FF4444' }]}
                onPress={async () => {
                  if (conversationToDelete) {
                    await handleDeleteConversation(conversationToDelete);
                    setDeleteModalVisible(false);
                    setConversationToDelete(null);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  globalBadgeContainer: {
    shadowColor: '#FF8E53',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  clearSearchButton: {
    padding: 4,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: PERFORMANCE_CONFIG.ITEM_HEIGHT,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarEmoji: {
    fontSize: 38,
  },
  unreadBadgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '800',
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 20,
    opacity: 0.8,
  },
  unreadLastMessage: {
    fontWeight: '600',
    opacity: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#FF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteButtonModal: {
    shadowColor: '#FF4444',
    shadowOpacity: 0.3,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
}); 