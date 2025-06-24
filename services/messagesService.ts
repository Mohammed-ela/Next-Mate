import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    startAfter,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import cacheManager from '../utils/cacheManager';
import { safeTimestampToDate } from '../utils/firebaseHelpers';
import { logger } from '../utils/logger';

// Configuration optimisée pour les messages
const MESSAGE_CONFIG = {
  INITIAL_LOAD: 50,        // Charger 50 messages au départ
  PAGINATION_SIZE: 25,     // Charger 25 de plus à chaque pagination
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes de cache
  MAX_RECENT_MESSAGES: 100, // Maximum de messages récents en cache
  TYPING_TIMEOUT: 3000,    // 3 secondes pour "en train d'écrire"
  RATE_LIMIT_MESSAGES: 10, // Max 10 messages par minute
  RATE_LIMIT_WINDOW: 60 * 1000, // Fenêtre de 1 minute
};

export interface PaginatedMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'game_invite';
  gameInvite?: {
    gameId: string;
    gameName: string;
    message: string;
  };
}

export interface MessagePage {
  messages: PaginatedMessage[];
  hasMore: boolean;
  lastMessageTimestamp: Date | null;
  totalCount: number;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: Date;
  isTyping: boolean;
}

class MessagesService {
  private static instance: MessagesService;
  private rateLimitMap = new Map<string, number[]>(); // userId -> timestamps[]
  private typingTimeouts = new Map<string, any>(); // conversationId -> timeout

  static getInstance(): MessagesService {
    if (!MessagesService.instance) {
      MessagesService.instance = new MessagesService();
    }
    return MessagesService.instance;
  }

  // 📄 Charger la première page de messages
  async loadInitialMessages(
    conversationId: string,
    userId: string
  ): Promise<MessagePage> {
    try {
      logger.debug('MessagesService', `Loading initial messages for ${conversationId}`);

      // Vérifier le cache d'abord
      const cacheKey = `initial_messages_${conversationId}`;
      const cached = cacheManager.get<MessagePage>('messages', cacheKey, MESSAGE_CONFIG.CACHE_DURATION);
      
      if (cached) {
        logger.cache('hit', cacheKey);
        return cached;
      }

      // Requête optimisée : récents messages d'abord
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(MESSAGE_CONFIG.INITIAL_LOAD)
      );

      const snapshot = await getDocs(messagesQuery);
      const messages: PaginatedMessage[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          content: data.content,
          timestamp: safeTimestampToDate(data.timestamp),
          type: data.type || 'text',
          gameInvite: data.gameInvite,
        });
      });

      // Inverser pour avoir l'ordre chronologique
      messages.reverse();

      const result: MessagePage = {
        messages,
        hasMore: snapshot.docs.length === MESSAGE_CONFIG.INITIAL_LOAD,
        lastMessageTimestamp: messages.length > 0 ? messages[0].timestamp : null,
        totalCount: messages.length,
      };

      // Mettre en cache
      cacheManager.set('messages', cacheKey, result);
      
      logger.performance('loadInitialMessages', Date.now() - Date.now(), {
        conversationId,
        messageCount: messages.length,
        hasMore: result.hasMore
      });

      return result;
    } catch (error) {
      logger.error('MessagesService', 'Error loading initial messages', error);
      throw error;
    }
  }

  // 📄 Charger plus de messages (pagination vers le haut)
  async loadMoreMessages(
    conversationId: string,
    lastTimestamp: Date
  ): Promise<MessagePage> {
    try {
      logger.debug('MessagesService', `Loading more messages before ${lastTimestamp}`);

      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc'),
        startAfter(Timestamp.fromDate(lastTimestamp)),
        limit(MESSAGE_CONFIG.PAGINATION_SIZE)
      );

      const snapshot = await getDocs(messagesQuery);
      const messages: PaginatedMessage[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          content: data.content,
          timestamp: safeTimestampToDate(data.timestamp),
          type: data.type || 'text',
          gameInvite: data.gameInvite,
        });
      });

      // Inverser pour avoir l'ordre chronologique
      messages.reverse();

      return {
        messages,
        hasMore: snapshot.docs.length === MESSAGE_CONFIG.PAGINATION_SIZE,
        lastMessageTimestamp: messages.length > 0 ? messages[0].timestamp : lastTimestamp,
        totalCount: messages.length,
      };
    } catch (error) {
      logger.error('MessagesService', 'Error loading more messages', error);
      throw error;
    }
  }

  // ⌨️ Indicateur "en train d'écrire"
  async setTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const typingKey = `typing.${userId}`;

      if (isTyping) {
        // Marquer comme en train d'écrire
        await updateDoc(conversationRef, {
          [typingKey]: {
            userName,
            timestamp: serverTimestamp(),
            isTyping: true,
          }
        });

        // Supprimer automatiquement après timeout
        this.clearTypingTimeout(conversationId, userId);
        const timeout = setTimeout(() => {
          this.setTypingIndicator(conversationId, userId, userName, false);
        }, MESSAGE_CONFIG.TYPING_TIMEOUT);
        
        this.typingTimeouts.set(`${conversationId}_${userId}`, timeout);
      } else {
        // Arrêter l'indicateur
        await updateDoc(conversationRef, {
          [typingKey]: null
        });
        this.clearTypingTimeout(conversationId, userId);
      }
    } catch (error) {
      logger.error('MessagesService', 'Error setting typing indicator', error);
    }
  }

  // 🎯 Écouter les indicateurs de frappe en temps réel
  listenToTypingIndicators(
    conversationId: string,
    currentUserId: string,
    callback: (indicators: TypingIndicator[]) => void
  ): () => void {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    return onSnapshot(conversationRef, (doc) => {
      if (!doc.exists()) return;
      
      const data = doc.data();
      const typing = data.typing || {};
      const indicators: TypingIndicator[] = [];

      Object.entries(typing).forEach(([userId, typingData]: [string, any]) => {
        if (userId !== currentUserId && typingData && typingData.isTyping) {
          const timestamp = safeTimestampToDate(typingData.timestamp);
          const now = new Date();
          
          // Ignorer les indicateurs trop anciens
          if (now.getTime() - timestamp.getTime() < MESSAGE_CONFIG.TYPING_TIMEOUT) {
            indicators.push({
              userId,
              userName: typingData.userName,
              timestamp,
              isTyping: true,
            });
          }
        }
      });

      callback(indicators);
    });
  }

  // 📨 Envoyer message avec rate limiting
  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    type: 'text' | 'game_invite' = 'text',
    gameInvite?: any
  ): Promise<void> {
    try {
      // Vérifier rate limiting
      if (!this.checkRateLimit(userId)) {
        throw new Error('Trop de messages envoyés. Ralentissez un peu ! 😅');
      }

      // Arrêter l'indicateur de frappe
      await this.setTypingIndicator(conversationId, userId, '', false);

      const messageData = {
        senderId: userId,
        content: content.trim(),
        type,
        timestamp: serverTimestamp(),
        ...(gameInvite && { gameInvite }),
      };

      // Ajouter le message
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      // Mettre à jour la conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          senderId: userId,
          content: content.trim(),
          type,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Incrémenter compteurs non lus
      const conversationDoc = await getDoc(conversationRef);
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        const participants = data.participants || [];
        const otherParticipants = participants.filter((id: string) => id !== userId);
        
        const updates: Record<string, any> = {};
        otherParticipants.forEach((participantId: string) => {
          updates[`unreadCounts.${participantId}`] = increment(1);
        });
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(conversationRef, updates);
        }
      }

      // Invalider le cache
      cacheManager.invalidateKey('messages', `initial_messages_${conversationId}`);

      logger.firebase('create', 'messages', 'success', { conversationId, type });
    } catch (error) {
      logger.error('MessagesService', 'Error sending message', error);
      throw error;
    }
  }

  // 🛡️ Vérification rate limiting
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userMessages = this.rateLimitMap.get(userId) || [];
    
    // Nettoyer les anciens timestamps
    const recentMessages = userMessages.filter(
      timestamp => now - timestamp < MESSAGE_CONFIG.RATE_LIMIT_WINDOW
    );
    
    if (recentMessages.length >= MESSAGE_CONFIG.RATE_LIMIT_MESSAGES) {
      logger.warn('MessagesService', `Rate limit exceeded for user ${userId}`);
      return false;
    }
    
    // Ajouter le nouveau timestamp
    recentMessages.push(now);
    this.rateLimitMap.set(userId, recentMessages);
    
    return true;
  }

  // 🧹 Nettoyer timeout typing
  private clearTypingTimeout(conversationId: string, userId: string): void {
    const key = `${conversationId}_${userId}`;
    const timeout = this.typingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }
  }

  // 📊 Obtenir statistiques du service
  getStats() {
    return {
      activeTypingTimeouts: this.typingTimeouts.size,
      rateLimitEntries: this.rateLimitMap.size,
      cacheStats: cacheManager.getStats(),
    };
  }

  // 🧹 Nettoyer les ressources
  cleanup() {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.rateLimitMap.clear();
  }
}

export default MessagesService.getInstance(); 