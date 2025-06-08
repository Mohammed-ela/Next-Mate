import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const openChat = (conversationId: string) => {
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

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const participant = item.participants[0];
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => openChat(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{participant.avatar}</Text>
          </View>
          {participant.isOnline && <View style={styles.onlineIndicator} />}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName}>{participant.name}</Text>
            <Text style={styles.timestamp}>
              {formatTimeAgo(item.lastMessage.timestamp)}
            </Text>
          </View>

          <View style={styles.conversationPreview}>
            <View style={styles.lastMessageContainer}>
              <Text 
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && styles.unreadMessage
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.content}
              </Text>
            </View>
            
            {participant.currentGame && (
              <View style={styles.gameStatus}>
                <Ionicons name="game-controller" size={12} color="#FF8E53" />
                <Text style={styles.currentGame}>{participant.currentGame}</Text>
              </View>
            )}
          </View>

          {item.gameInCommon && (
            <View style={styles.gameInCommon}>
              <Ionicons name="people" size={12} color="#8B5CF6" />
              <Text style={styles.gameInCommonText}>{item.gameInCommon}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color="#FFFFFF40" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2F0C4D', '#471573']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages 💬</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#FFFFFF80" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un mate..."
              placeholderTextColor="#FFFFFF80"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color="#FFFFFF80" />
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
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
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

        {/* Floating Action Button pour nouveau message */}
        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#FF8E53', '#FF6B35']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
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
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
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
  conversationPreview: {
    gap: 4,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    color: '#FFFFFF80',
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    color: '#FFFFFF',
    fontWeight: '500',
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 