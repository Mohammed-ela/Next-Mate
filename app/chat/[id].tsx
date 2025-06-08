import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'game_invite' | 'system';
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  currentGame?: string;
}

// Données mock pour le chat
const MOCK_PARTICIPANTS: { [key: string]: Participant } = {
  '1': {
    id: '2',
    name: 'Alex_Gaming',
    avatar: '🎮',
    isOnline: true,
    currentGame: 'Valorant',
  },
  '2': {
    id: '3',
    name: 'ProGamer_Sarah',
    avatar: '⚔️',
    isOnline: false,
  },
  '3': {
    id: '4',
    name: 'Mike_FPS',
    avatar: '🔫',
    isOnline: true,
    currentGame: 'CS2',
  },
};

const MOCK_MESSAGES: { [key: string]: Message[] } = {
  '1': [
    {
      id: 'm1',
      senderId: '2',
      content: 'Salut ! Tu veux faire une partie de Valorant ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text',
    },
    {
      id: 'm2',
      senderId: '1',
      content: 'Hello ! Oui avec plaisir 🎮',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      type: 'text',
    },
    {
      id: 'm3',
      senderId: '2',
      content: 'Cool ! Je suis Diamant, et toi ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      type: 'text',
    },
    {
      id: 'm4',
      senderId: '1',
      content: 'Platinum 2, mais je push pour Diamant 💪',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'text',
    },
    {
      id: 'm5',
      senderId: '2',
      content: 'Tu veux faire une partie de Valorant ce soir ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: 'game_invite',
    },
  ],
  '2': [
    {
      id: 'm1',
      senderId: '3',
      content: 'GG pour la partie ! 🏆',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      type: 'text',
    },
    {
      id: 'm2',
      senderId: '1',
      content: 'Merci ! Tu carries bien 💪',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text',
    },
    {
      id: 'm3',
      senderId: '3',
      content: 'On refait ça demain ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text',
    },
  ],
  '3': [
    {
      id: 'm1',
      senderId: '1',
      content: 'Salut ! Tu joues souvent à CS2 ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: 'text',
    },
  ],
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES[id || '1'] || []);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const participant = MOCK_PARTICIPANTS[id || '1'];
  const currentUserId = '1'; // ID de l'utilisateur actuel

  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `m_${Date.now()}`,
        senderId: currentUserId,
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text',
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Simulation d'une réponse automatique
      setTimeout(() => {
        const responses = [
          'Sounds good! 🎮',
          'Let\'s go! 💪',
          'Perfect timing!',
          'I\'m ready when you are',
          'Great idea! 🚀',
        ];
        
        const autoReply: Message = {
          id: `m_auto_${Date.now()}`,
          senderId: participant?.id || '2',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
          type: 'text',
        };
        
        setMessages(prev => [...prev, autoReply]);
      }, 1000 + Math.random() * 2000);
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
          onPress: () => {
            const gameInvite: Message = {
              id: `m_invite_${Date.now()}`,
              senderId: currentUserId,
              content: `🎮 Invitation à jouer à ${participant?.currentGame || 'un jeu'}`,
              timestamp: new Date(),
              type: 'game_invite',
            };
            setMessages(prev => [...prev, gameInvite]);
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    const showAvatar = !isMyMessage && (index === 0 || messages[index - 1]?.senderId !== item.senderId);
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMyMessage && showAvatar && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{participant?.avatar}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          item.type === 'game_invite' && styles.gameInviteBubble
        ]}>
          {item.type === 'game_invite' && (
            <View style={styles.gameInviteHeader}>
              <Ionicons name="game-controller" size={16} color="#FFFFFF" />
              <Text style={styles.gameInviteTitle}>Invitation de jeu</Text>
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
        
        {!isMyMessage && !showAvatar && (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>
    );
  };

  if (!participant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation non trouvée</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2F0C4D', '#471573']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
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
                {participant.isOnline 
                  ? (participant.currentGame ? `Joue à ${participant.currentGame}` : 'En ligne')
                  : 'Hors ligne'
                }
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.gameButton}
            onPress={inviteToGame}
          >
            <Ionicons name="game-controller" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
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
                style={styles.textInput}
                placeholder="Tapez votre message..."
                placeholderTextColor="#FFFFFF60"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                newMessage.trim() && styles.sendButtonActive
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <LinearGradient
                colors={newMessage.trim() ? ['#FF8E53', '#FF6B35'] : ['#374151', '#374151']}
                style={styles.sendButtonGradient}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() ? "#FFFFFF" : "#FFFFFF60"} 
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
  backButton: {
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
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  backText: {
    color: '#FF8E53',
    fontSize: 16,
  },
}); 