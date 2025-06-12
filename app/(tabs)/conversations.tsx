import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'game_invite' | 'system';
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    currentGame?: string;
  }[];
  lastMessage: Message;
  unreadCount: number;
  gameInCommon?: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participants: [
      {
        id: '2',
        name: 'Alex_Gaming',
        avatar: '🎮',
        isOnline: true,
        currentGame: 'Valorant',
      },
    ],
    lastMessage: {
      id: 'm1',
      senderId: '2',
      content: 'Tu veux faire une partie de Valorant ce soir ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // Il y a 15 min
      type: 'text',
    },
    unreadCount: 2,
    gameInCommon: 'Valorant',
  },
  {
    id: '2',
    participants: [
      {
        id: '3',
        name: 'ProGamer_Sarah',
        avatar: '⚔️',
        isOnline: false,
        currentGame: undefined,
      },
    ],
    lastMessage: {
      id: 'm2',
      senderId: '3',
      content: 'GG ! On refait ça demain ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Il y a 2h
      type: 'text',
    },
    unreadCount: 0,
    gameInCommon: 'League of Legends',
  },
  {
    id: '3',
    participants: [
      {
        id: '4',
        name: 'Mike_FPS',
        avatar: '🔫',
        isOnline: true,
        currentGame: 'CS2',
      },
    ],
    lastMessage: {
      id: 'm3',
      senderId: '1', // Moi
      content: 'Salut ! Tu joues souvent à CS2 ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Il y a 1 jour
      type: 'text',
    },
    unreadCount: 1,
    gameInCommon: 'CS2',
  },
];

export default function ConversationsScreen() {
  const { colors, isDarkMode } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const openConversation = (conversationId: string) => {
    // Marquer comme lu
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    
    // Ouvrir le chat individuel
    router.push(`/chat/${conversationId}`);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participants[0].name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteConversation = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setShowDeleteModal(true);
  };

  const confirmDeleteConversation = () => {
    if (conversationToDelete) {
      setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete));
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  const cancelDeleteConversation = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => openConversation(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={['#FF8E53', '#FF6B35']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{item.participants[0].avatar}</Text>
        </LinearGradient>
        {item.participants[0].isOnline && <View style={styles.onlineIndicator} />}
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.participantName, { color: colors.text }]}>{item.participants[0].name}</Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{formatTimeAgo(item.lastMessage.timestamp)}</Text>
        </View>
        
        <View style={styles.messagePreview}>
          <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
          {item.participants[0].currentGame && (
            <View style={styles.gameStatus}>
              <Ionicons name="game-controller" size={12} color="#FF8E53" />
              <Text style={[styles.currentGame, { color: colors.textSecondary }]}>{item.participants[0].currentGame}</Text>
            </View>
          )}
        </View>

        {item.gameInCommon && (
          <View style={styles.gameInCommon}>
            <Ionicons name="people" size={12} color="#8B5CF6" />
            <Text style={[styles.gameInCommonText, { color: colors.textSecondary }]}>{item.gameInCommon}</Text>
          </View>
        )}
      </View>

      {/* Bouton de suppression */}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          deleteConversation(item.id);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
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
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages 💬</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {MOCK_CONVERSATIONS.length} conversation{MOCK_CONVERSATIONS.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Rechercher un mate..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Liste des conversations */}
        {filteredConversations.length > 0 ? (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationsContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
              {searchQuery 
                ? 'Essayez un autre nom de mate'
                : 'Commencez à chercher des mates pour démarrer une conversation !'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.findMatesButton}>
                <LinearGradient
                  colors={['#FF8E53', '#FF6B35']}
                  style={styles.findMatesGradient}
                >
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={styles.findMatesText}>Trouver des Mates</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Modal de suppression personnalisée NextMate */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDeleteConversation}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteModalHeader}>
                <Text style={styles.deleteModalTitle}>🗑️ Supprimer la conversation</Text>
                <TouchableOpacity 
                  style={styles.deleteCloseButton}
                  onPress={cancelDeleteConversation}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF80" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.deleteModalBody}>
                <View style={styles.deleteIconContainer}>
                  <Text style={{ fontSize: 48 }}>🗑️</Text>
                </View>
                
                <Text style={styles.deleteMainText}>
                  Supprimer cette conversation ?
                </Text>
                
                <Text style={styles.deleteSubText}>
                  Cette action est irréversible. Tous les messages de cette conversation seront définitivement supprimés.
                </Text>
                
                <View style={styles.deleteButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.deleteCancelButton}
                    onPress={cancelDeleteConversation}
                  >
                    <Text style={styles.deleteCancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteConfirmButton}
                    onPress={confirmDeleteConversation}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.deleteConfirmGradient}
                    >
                      <Ionicons name="trash" size={18} color="#FFFFFF" />
                      <Text style={styles.deleteConfirmButtonText}>Supprimer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF80',
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#2F0C4D',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#FFFFFF60',
    fontSize: 12,
  },
  messagePreview: {
    gap: 4,
  },
  lastMessage: {
    color: '#FFFFFF80',
    fontSize: 14,
    flex: 1,
  },
  gameStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentGame: {
    color: '#FF8E53',
    fontSize: 12,
    fontWeight: '500',
  },
  gameInCommon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  gameInCommonText: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: '#FFFFFF80',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  findMatesButton: {
    borderRadius: 12,
  },
  findMatesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  findMatesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour la modal de suppression
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 12, 77, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#2F0C4D',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF20',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteCloseButton: {
    padding: 5,
  },
  deleteModalBody: {
    padding: 20,
    paddingTop: 10,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteMainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  deleteSubText: {
    color: '#FFFFFF80',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  deleteCancelButtonText: {
    color: '#FFFFFF80',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    flex: 1,
    borderRadius: 25,
  },
  deleteConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 