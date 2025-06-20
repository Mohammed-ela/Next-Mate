import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  
  // Récupérer la conversation depuis le contexte
  const conversation = getConversationById(conversationId);
  const participant = conversation?.participants[0];
  
  const [newMessage, setNewMessage] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(36);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  
  const currentUserId = user?.uid || '1';

  // 🎯 Gestion du clavier pour tous les appareils Android
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      console.log('⌨️ Clavier ouvert, hauteur:', e.endCoordinates.height);
      setKeyboardVisible(true);
      
      // Auto-scroll vers le bas quand le clavier s'ouvre
      setTimeout(() => {
        if (flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('⌨️ Clavier fermé');
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [messages.length]);

  // 🔄 Auto-scroll quand les messages changent
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages]);

  // 📝 Gestion du changement de texte avec auto-scroll
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    // Auto-scroll vers le bas quand on tape (surtout important sur certains Android)
    if (isKeyboardVisible && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  // 📏 Gestion de la hauteur dynamique de l'input
  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(36, event.nativeEvent.contentSize.height), 100);
    setInputHeight(newHeight);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const success = await sendMessage(newMessage.trim());
      if (success) {
        setNewMessage('');
        setInputHeight(36); // Reset hauteur input
        
        // Scroll immédiatement après envoi
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    }
  };

  // 🎮 Invitation de jeu améliorée
  const inviteToGame = () => {
    Alert.alert(
      '🎮 Invitation de jeu',
      `Inviter ${participant?.name} à jouer à ${participant?.currentGame || 'un jeu'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: '🚀 Inviter', 
          onPress: async () => {
            const gameInviteMessage = `🎮 Invitation de jeu : ${participant?.currentGame || 'Partie'} !`;
            await sendMessage(gameInviteMessage, 'game_invite');
          }
        }
      ],
      { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
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
              participant?.isImageAvatar ? (
                <Image 
                  source={{ uri: participant.avatar }} 
                  style={styles.avatarImage}
                  defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                />
              ) : (
                <Text style={styles.avatarText}>{participant?.avatar}</Text>
              )
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
              {participant.isImageAvatar ? (
                <Image 
                  source={{ uri: participant.avatar }} 
                  style={styles.headerAvatarImage}
                  defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                />
              ) : (
                <Text style={styles.headerAvatarText}>{participant.avatar}</Text>
              )}
              {participant.isOnline && <View style={[styles.onlineIndicator, styles.onlineIndicatorPulse]} />}
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.participantName}>{participant.name}</Text>
              <Text style={styles.statusText}>
                {participant.isOnline ? 
                  (participant.currentGame ? `🎮 ${participant.currentGame}` : '✅ En ligne') : 
                  '⚫ Hors ligne'
                }
              </Text>
            </View>
          </View>
          
          {participant.currentGame && (
            <TouchableOpacity 
              style={styles.gameButton}
              onPress={inviteToGame}
              activeOpacity={0.7}
            >
              <Ionicons name="game-controller" size={20} color="#FF8E53" />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages avec gestion améliorée */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: isKeyboardVisible ? 10 : 20 } // Moins de padding quand clavier ouvert
          ]}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          onContentSizeChange={() => {
            // Auto-scroll quand le contenu change
            if (flatListRef.current && messages.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
        />

        {/* Input amélioré avec gestion clavier intelligente */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[
            styles.inputContainer, 
            { 
              paddingBottom: Math.max(insets.bottom, 10),
              backgroundColor: isKeyboardVisible ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)'
            }
          ]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.inputRow}>
            <View style={[styles.textInputContainer, { height: inputHeight + 16 }]}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.textInput, 
                  { 
                    color: colors.text,
                    height: inputHeight,
                  }
                ]}
                value={newMessage}
                onChangeText={handleTextChange}
                onContentSizeChange={handleContentSizeChange}
                placeholder="Écris ton message..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
                textAlignVertical="top"
                blurOnSubmit={false}
                onFocus={() => {
                  // Scroll vers le bas quand on focus l'input
                  setTimeout(() => {
                    if (flatListRef.current) {
                      flatListRef.current.scrollToEnd({ animated: true });
                    }
                  }, 300);
                }}
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                newMessage.trim() && styles.sendButtonActive,
                { marginBottom: (inputHeight - 36) / 2 } // Centrer le bouton verticalement
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              activeOpacity={0.8}
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
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    paddingTop: 15, // Padding fixe en haut
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15, // Padding fixe en bas
    gap: 12,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 116, // 100 + 16 de padding
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 36,
    maxHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 0,
    paddingBottom: 0,
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
  avatarText: {
    fontSize: 24,
  },
  onlineIndicatorPulse: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#2F0C4D',
  },
}); 