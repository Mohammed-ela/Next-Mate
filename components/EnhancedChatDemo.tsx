import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePaginatedMessages } from '../context/PaginatedMessagesContext';
import { useTheme } from '../context/ThemeContext';
import messagesService from '../services/messagesService';
import { TypingIndicator } from './TypingIndicator';

interface EnhancedChatDemoProps {
  conversationId: string;
  onClose: () => void;
}

export const EnhancedChatDemo: React.FC<EnhancedChatDemoProps> = ({
  conversationId,
  onClose,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    typingIndicators,
    loadMoreMessages,
    sendMessage,
    startTyping,
    stopTyping,
    error,
  } = usePaginatedMessages();

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 📝 Gérer le changement de texte avec indicateur de frappe
  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      startTyping();
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      stopTyping();
    }
  }, [isTyping, startTyping, stopTyping]);

  // 📨 Envoyer un message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(messageText);
      setMessageText('');
      setIsTyping(false);
      stopTyping();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le message');
    }
  }, [messageText, sendMessage, stopTyping]);

  // 📄 Charger plus de messages (pagination)
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadMoreMessages();
    }
  }, [loadingMore, hasMore, loadMoreMessages]);

  // 🎮 Envoyer invitation de jeu
  const handleGameInvite = useCallback(async () => {
    try {
      await sendMessage('Jouons ensemble !', 'game_invite', {
        gameId: 'valorant',
        gameName: 'Valorant',
        message: 'Veux-tu jouer à Valorant avec moi ?',
      });
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'invitation');
    }
  }, [sendMessage]);

  // 📊 Afficher les statistiques
  const showStats = useCallback(() => {
    const stats = messagesService.getStats();
    Alert.alert(
      'Statistiques du Chat',
      `🔄 Timeouts actifs: ${stats.activeTypingTimeouts}\n` +
      `🛡️ Rate limits: ${stats.rateLimitEntries}\n` +
      `💾 Cache: Voir console pour détails`
    );
    console.log('📊 Stats cache:', stats.cacheStats);
  }, []);

  // 🎨 Rendu d'un message
  const renderMessage = useCallback(({ item, index }: { item: any; index: number }) => {
    const isMyMessage = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isMyMessage ? colors.primary : colors.surface,
            borderColor: colors.border,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isMyMessage ? '#FFFFFF' : colors.text }
          ]}>
            {item.content}
          </Text>
          
          {item.type === 'game_invite' && (
            <View style={styles.gameInviteContainer}>
              <Ionicons name="game-controller" size={16} color="#FFD700" />
              <Text style={styles.gameInviteText}>Invitation de jeu</Text>
            </View>
          )}
          
          <Text style={[
            styles.messageTime,
            { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {item.timestamp.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  }, [user?.uid, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec stats */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          💬 Chat Enhanced Demo
        </Text>
        
        <TouchableOpacity onPress={showStats}>
          <Ionicons name="stats-chart" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Error display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FFE6E6' }]}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {/* Messages list */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        inverted
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={loadingMore ? (
          <View style={styles.loadingMore}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              ⏳ Chargement...
            </Text>
          </View>
        ) : null}
        ListHeaderComponent={
          <TypingIndicator indicators={typingIndicators} style={styles.typingIndicator} />
        }
      />

      {/* Input area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          value={messageText}
          onChangeText={handleTextChange}
          placeholder="Tapez votre message..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
          multiline
          maxLength={500}
        />
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={handleGameInvite}
            style={[styles.actionButton, { backgroundColor: '#FF8E53' }]}
          >
            <Ionicons name="game-controller" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Features info */}
      <View style={[styles.featuresInfo, { backgroundColor: colors.surface }]}>
        <Text style={[styles.featuresText, { color: colors.textSecondary }]}>
          ✨ Features: 📄 Pagination • ⌨️ Typing • 🛡️ Rate limiting • 📊 Audit logs
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    margin: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  typingIndicator: {
    marginVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  gameInviteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  gameInviteText: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featuresText: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 