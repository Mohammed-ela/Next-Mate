import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    AppState,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../context/ConversationsContext';
import { MessagesProvider, useMessages, type Message } from '../../context/MessagesContext';
import { useBadgeNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { BlockingService } from '../../services/blockingService';

const { width } = Dimensions.get('window');

// Configuration optimisée
const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  MIN_MESSAGE_LENGTH: 1,
  TYPING_INDICATOR_DURATION: 2000,
  ANIMATION_DURATION: 300,
  VIBRATION_DURATION: 50,
};

const PERFORMANCE_CONFIG = {
  MARK_AS_READ_INTERVAL: 2000,
  SCROLL_THROTTLE: 100,
  TYPING_DEBOUNCE: 800,
};

// 🎮 Composant Header modernisé avec profil synchronisé
function ModernChatHeader({ participant, onProfilePress, onGameInvite, onBlockUser }: {
  participant: any;
  onProfilePress: () => void;
  onGameInvite: () => void;
  onBlockUser: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation de pulsation pour le statut en ligne
    if (participant?.isOnline) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [participant?.isOnline]);

  return (
    <View style={[styles.modernHeader, { 
      backgroundColor: colors.card,
      paddingTop: insets.top + 15 
    }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.participantInfo} 
        onPress={onProfilePress}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {participant?.avatar?.startsWith('http') ? (
            <Image 
              source={{ uri: participant.avatar }} 
              style={[styles.headerAvatar, { borderColor: participant?.isOnline ? '#10B981' : colors.border }]}
              defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
            />
          ) : (
            <View style={[styles.headerAvatar, { 
              backgroundColor: participant?.isOnline ? 'rgba(16, 185, 129, 0.2)' : colors.surface,
              borderColor: participant?.isOnline ? '#10B981' : colors.border 
            }]}>
              <Text style={[styles.headerAvatarText, { color: colors.text }]}>
                {participant?.avatar || '🎮'}
              </Text>
            </View>
          )}
          
          {participant?.isOnline && (
            <Animated.View style={[styles.onlineIndicator, { opacity: fadeAnim }]} />
          )}
        </View>
        
        <View style={styles.participantDetails}>
          <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
            {participant?.name || 'Chargement...'}
          </Text>
          <Text style={[styles.participantStatus, { color: colors.textSecondary }]} numberOfLines={1}>
            {participant?.isOnline ? (
              participant?.currentGame ? `🎮 ${participant.currentGame}` : '🟢 En ligne'
            ) : (
              participant?.lastSeen ? 
                `Vu ${new Date(participant.lastSeen).toLocaleDateString('fr-FR')}` :
                '⚫ Hors ligne'
            )}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        {participant?.currentGame && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onGameInvite}
            activeOpacity={0.8}
          >
            <Ionicons name="game-controller" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            Alert.alert(
              'Options',
              'Que voulez-vous faire ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: '🚫 Bloquer utilisateur', 
                  style: 'destructive',
                                     onPress: () => onBlockUser()
                }
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 🎨 Composant Message modernisé
function ModernMessageBubble({ message, isMyMessage, participant, onPress }: {
  message: Message;
  isMyMessage: boolean;
  participant: any;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return timestamp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Message système
  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={[styles.systemMessageBubble, { backgroundColor: colors.surface }]}>
          <Text style={[styles.systemMessage, { color: colors.textSecondary }]}>
            {message.content}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary, textAlign: 'center' }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  }

  // Message d'invitation de jeu
  if (message.type === 'game_invite') {
    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <Animated.View style={[
          styles.gameInviteBubble,
          { 
            backgroundColor: isMyMessage ? colors.primary : '#FF8E53',
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <View style={styles.gameInviteContent}>
              <Ionicons 
                name="game-controller" 
                size={24} 
                color={isMyMessage ? '#FFFFFF' : '#FFFFFF'} 
              />
              <View style={styles.gameInviteText}>
                <Text style={[
                  styles.gameInviteTitle,
                  { color: isMyMessage ? '#FFFFFF' : '#FFFFFF' }
                ]}>
                  {message.gameInvite?.gameName}
                </Text>
                <Text style={[
                  styles.gameInviteMessage,
                  { color: isMyMessage ? '#FFFFFF90' : '#FFFFFF90' }
                ]}>
                  {message.gameInvite?.message}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isMyMessage ? '#FFFFFF' : '#FFFFFF90'} 
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
        <Text style={[
          styles.messageTime,
          { color: colors.textSecondary },
          isMyMessage && styles.myMessageTime
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  }

  // Message texte normal
  return (
    <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
      {!isMyMessage && (
        <TouchableOpacity onPress={() => {
          Alert.alert('Profil', `Voir le profil de ${participant?.name}`);
        }}>
          {participant?.avatar?.startsWith('http') ? (
            <Image 
              source={{ uri: participant.avatar }} 
              style={styles.messageAvatar}
              defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
            />
          ) : (
            <View style={[styles.messageAvatar, { backgroundColor: colors.surface }]}>
              <Text style={styles.messageAvatarText}>{participant?.avatar || '🎮'}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      
      <Animated.View style={[
        styles.messageBubble,
        {
          backgroundColor: isMyMessage ? colors.primary : '#FF8E53',
          transform: [{ scale: scaleAnim }]
        },
        isMyMessage && styles.myMessageBubble
      ]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Text style={[
            styles.messageText,
            { color: isMyMessage ? '#FFFFFF' : '#FFFFFF' }
          ]}>
            {message.content}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={[
        styles.messageTime,
        { color: colors.textSecondary },
        isMyMessage && styles.myMessageTime
      ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

// 🚀 Composant Chat principal
function ChatContent() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { getConversationById, markAsRead, sendGameInvite, refreshParticipantData } = useConversations();
  const { clearBadge } = useBadgeNotifications();
  const { messages, loading, sendMessage } = useMessages();
  const [inputText, setInputText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lastMarkTime, setLastMarkTime] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const markAsReadIntervalRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const conversation = getConversationById(conversationId);
  const participant = conversation?.participants[0];

  // Note: La synchronisation des données participant est gérée automatiquement
  // par le système d'avatars dans ConversationsContext

  // 🎯 Marquage automatique optimisé
  const markConversationAsRead = useCallback(() => {
    if (!conversationId || !isActive || !conversation?.unreadCount) return;
    
    const now = Date.now();
    if (now - lastMarkTime < 2000) return;
    
    markAsRead(conversationId);
    clearBadge(conversationId);
    console.log('🔄 Messages marqués lus + badge supprimé pour:', conversationId);
    setLastMarkTime(now);
  }, [conversationId, isActive, conversation?.unreadCount, markAsRead, clearBadge, lastMarkTime]);

  // 🔍 Détection focus avec vibration + synchronisation participant
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      Vibration.vibrate(CHAT_CONFIG.VIBRATION_DURATION);
      markConversationAsRead();
      
      // 🔄 Synchroniser les données du participant à l'ouverture du chat
      if (conversationId) {
        console.log('🔄 Synchronisation données participant à l\'ouverture du chat:', conversationId);
        refreshParticipantData(conversationId).catch(error => {
          console.error('❌ Erreur synchronisation participant:', error);
        });
      }
      
      // Scroll automatique vers le bas à l'ouverture
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
      
      markAsReadIntervalRef.current = setInterval(() => {
        markConversationAsRead();
      }, PERFORMANCE_CONFIG.MARK_AS_READ_INTERVAL) as any;
      
      return () => {
        setIsActive(false);
        if (markAsReadIntervalRef.current) {
          clearInterval(markAsReadIntervalRef.current);
          markAsReadIntervalRef.current = null;
        }
      };
    }, [markConversationAsRead, conversationId, refreshParticipantData])
  );

  // 📱 Gestion changements d'état app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setIsActive(nextAppState === 'active');
      if (nextAppState === 'active') {
        setTimeout(markConversationAsRead, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [markConversationAsRead]);

  // ⌨️ Gestion indicateur de frappe
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    
    if (text.trim() && !isTyping) {
      setIsTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, PERFORMANCE_CONFIG.TYPING_DEBOUNCE);
  }, [isTyping]);

  // 🧹 Nettoyage des timeouts lors du démontage
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (markAsReadIntervalRef.current) {
        clearInterval(markAsReadIntervalRef.current);
        markAsReadIntervalRef.current = null;
      }
    };
  }, []); // ✅ Nettoyage au démontage

  // 📤 Envoi de message avec vibration
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !conversationId) return;

    const trimmedText = inputText.trim();
    if (trimmedText.length < CHAT_CONFIG.MIN_MESSAGE_LENGTH) {
      Alert.alert('⚠️ Message trop court', 'Votre message doit contenir au moins 1 caractère');
      return;
    }
    
    if (inputText.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
      Alert.alert('⚠️ Message trop long', `Votre message ne peut pas dépasser ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} caractères`);
      return;
    }

    try {
      Vibration.vibrate(CHAT_CONFIG.VIBRATION_DURATION);
      const messageToSend = inputText;
      setInputText('');
      setIsTyping(false);
      
      await sendMessage(conversationId, messageToSend);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      markConversationAsRead();
    } catch (error) {
      setInputText(inputText);
      Alert.alert('❌ Erreur', 'Impossible d\'envoyer le message');
    }
  }, [inputText, conversationId, sendMessage, markConversationAsRead]);

  // 🎮 Envoyer invitation de jeu
  const handleGameInvite = useCallback(() => {
    if (!participant?.currentGame || !conversationId) return;
    
    Alert.alert(
      '🎮 Invitation de jeu',
      `Inviter ${participant.name} à jouer à ${participant.currentGame} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Inviter', 
          style: 'default',
          onPress: async () => {
            try {
              if (conversationId && participant.currentGame) {
                await sendGameInvite(conversationId, 'game-1', participant.currentGame);
                Vibration.vibrate([0, 100, 50, 100]);
              }
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible d\'envoyer l\'invitation');
            }
          }
        }
      ]
    );
  }, [participant, conversationId, sendGameInvite]);

  // 👤 Voir profil participant
  const handleProfilePress = useCallback(() => {
    const profileInfo = [
      participant?.name && `👤 ${participant.name}`,
      participant?.bio && `📝 ${participant.bio}`,
      participant?.currentGame && `🎮 ${participant.currentGame}`,
      participant?.isOnline ? '🟢 En ligne' : '⚫ Hors ligne',
    ].filter(Boolean).join('\n\n');

    Alert.alert(
      `Profil de ${participant?.name}`,
      profileInfo || 'Aucune information disponible',
      [{ text: 'Fermer', style: 'default' }]
    );
  }, [participant]);

  // 🚫 Bloquer utilisateur
  const handleBlockUser = useCallback(async () => {
    if (!participant || !user?.uid || !conversationId) return;

    Alert.alert(
      '🚫 Bloquer utilisateur',
      `Êtes-vous sûr de vouloir bloquer ${participant.name} ?\n\n⚠️ Cette action va :\n• Supprimer cette conversation\n• Empêcher tout contact futur\n• Retirer cet utilisateur de vos suggestions`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Bloquer l'utilisateur
              await BlockingService.blockUser(
                user.uid,
                participant.id,
                participant.name,
                participant.avatar
              );

              // 2. Supprimer la conversation
              await BlockingService.deleteConversationOnBlock(user.uid, participant.id);

              Alert.alert(
                '✅ Utilisateur bloqué',
                `${participant.name} a été bloqué avec succès.`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('❌ Erreur blocage:', error);
              Alert.alert('❌ Erreur', 'Impossible de bloquer cet utilisateur');
            }
          }
        }
      ]
    );
  }, [participant, user?.uid, conversationId]);

  // 💬 Interaction avec message
  const handleMessagePress = useCallback(() => {
    if ((conversation?.unreadCount || 0) > 0) {
      markConversationAsRead();
    }
  }, [conversation?.unreadCount, markConversationAsRead]);

  // 📜 Rendu de message optimisé
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.uid;

    return (
      <ModernMessageBubble
        message={item}
        isMyMessage={isMyMessage}
        participant={participant}
        onPress={handleMessagePress}
      />
    );
  }, [user?.uid, participant, handleMessagePress]);

  // État de chargement
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>💬</Text>
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement du chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header modernisé */}
      <ModernChatHeader 
        participant={participant}
        onProfilePress={handleProfilePress}
        onGameInvite={handleGameInvite}
        onBlockUser={handleBlockUser}
      />

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[styles.messagesContainer, { paddingBottom: insets.bottom + 10 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          onLayout={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />

        {/* Zone de saisie modernisée */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {isTyping && (
            <Text style={[styles.typingIndicator, { color: colors.textSecondary }]}>
              Vous tapez...
            </Text>
          )}
          
          <View style={styles.inputRow}>
          <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Écrivez votre message..."
            placeholderTextColor={colors.textSecondary}
            multiline
              maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity 
              style={[styles.sendButton, { 
                backgroundColor: inputText.trim() ? colors.primary : colors.surface 
              }]}
            onPress={handleSendMessage}
              disabled={!inputText.trim()}
            activeOpacity={0.8}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} 
              />
          </TouchableOpacity>
          </View>
          
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {inputText.length}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  
  return (
    <MessagesProvider conversationId={conversationId}>
      <ChatContent />
    </MessagesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header modernisé
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  headerAvatarText: {
    fontSize: 18,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  participantStatus: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Messages
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: width * 0.8,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  myMessageBubble: {
    borderBottomRightRadius: 6,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
    marginHorizontal: 8,
  },
  myMessageTime: {
    textAlign: 'right',
  },
  // Messages système
  systemMessageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  systemMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  systemMessage: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Invitations de jeu
  gameInviteBubble: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameInviteText: {
    flex: 1,
  },
  gameInviteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameInviteMessage: {
    fontSize: 14,
  },
  // Zone de saisie
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
}); 