import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../context/ConversationsContext';
import { MessagesProvider, useMessages } from '../../context/MessagesContext';
import { useTheme } from '../../context/ThemeContext';

// Composant Chat principal avec MessagesProvider
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  if (!id) {
    return (
      <View style={styles.container}>
        <Text>ID de conversation manquant</Text>
      </View>
    );
  }

  return (
    <MessagesProvider conversationId={id}>
      <ChatContent conversationId={id} />
    </MessagesProvider>
  );
}

// Composant de contenu du chat
function ChatContent({ conversationId }: { conversationId: string }) {
  const { getConversationById } = useConversations();
  const { messages, loading, sendMessage } = useMessages();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Récupérer la conversation depuis le contexte
  const conversation = getConversationById(conversationId);
  const participant = conversation?.participants[0];
  
  const [newMessage, setNewMessage] = React.useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const currentUserId = user?.uid || '1'; // ID de l'utilisateur actuel

  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const success = await sendMessage(newMessage.trim());
      if (success) {
        setNewMessage('');
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const inviteToGame = () => {
    Alert.alert(
      'Invitation de jeu',
      `Inviter ${participant?.name} à jouer à ${participant?.currentGame || 'un jeu'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Inviter', 
          onPress: async () => {
            const gameInviteMessage = `🎮 Invitation de jeu : ${participant?.currentGame || 'Partie'} !`;
            await sendMessage(gameInviteMessage, 'game_invite');
          }
        }
      ]
    );
  };

  // Vérifier si la conversation existe
  if (!participant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={colors.gradient as [string, string]}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="chatbubble-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Conversation introuvable</Text>
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
              Cette conversation n'existe pas ou a été supprimée.
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    const isSystemMessage = item.type === 'system';
    const isGameInvite = item.type === 'game_invite';
    const showAvatar = !isMyMessage && !isSystemMessage && (index === messages.length - 1 || messages[index + 1]?.senderId !== item.senderId);

    // Message système
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={[styles.systemMessageBubble, { backgroundColor: colors.surface }]}>
            <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
              {item.content}
            </Text>
          </View>
        </View>
      );
    }

    // Message normal ou invitation de jeu
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <Text style={styles.avatarText}>{participant?.avatar}</Text>
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          isGameInvite && styles.gameInviteBubble
        ]}>
          {isGameInvite && (
            <View style={styles.gameInviteHeader}>
              <Ionicons name="game-controller" size={14} color="#8B5CF6" />
              <Text style={styles.gameInviteTitle}>INVITATION DE JEU</Text>
            </View>
          )}
          
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
          
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.theirMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{participant.avatar}</Text>
              {participant.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.participantName}>{participant.name}</Text>
              <Text style={styles.statusText}>
                {participant.isOnline ? 
                  (participant.currentGame ? `Joue à ${participant.currentGame}` : 'En ligne') : 
                  'Hors ligne'
                }
              </Text>
            </View>
          </View>
          
          {participant.currentGame && (
            <TouchableOpacity 
              style={styles.gameButton}
              onPress={inviteToGame}
            >
              <Ionicons name="game-controller" size={20} color="#FF8E53" />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputRow}>
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Écris ton message..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <LinearGradient
                colors={newMessage.trim() ? ['#FF8E53', '#FF6B35'] : ['#666', '#555']}
                style={styles.sendButtonGradient}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#2F0C4D',
  },
  headerText: {
    flex: 1,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 2,
  },
  gameButton: {
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 24,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: '#FF8E53',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  gameInviteBubble: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  gameInviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  gameInviteTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#FFFFFF80',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#FFFFFF60',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 36,
    textAlignVertical: 'center',
  },
  sendButton: {
    borderRadius: 20,
  },
  sendButtonActive: {
    // Styles pour bouton actif
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F0C4D',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  systemMessageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  systemMessageText: {
    fontSize: 16,
    lineHeight: 22,
  },
}); 