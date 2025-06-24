import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import messagesService, { PaginatedMessage, TypingIndicator } from '../services/messagesService';
import { logger } from '../utils/logger';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserProfileContext';

// Interface pour le contexte paginé
interface PaginatedMessagesContextType {
  // État des messages
  messages: PaginatedMessage[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  
  // Indicateurs de frappe
  typingIndicators: TypingIndicator[];
  
  // Actions
  loadInitialMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, type?: 'text' | 'game_invite', gameInvite?: any) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  
  // Statistiques
  totalMessages: number;
  error: string | null;
}

const PaginatedMessagesContext = createContext<PaginatedMessagesContextType | undefined>(undefined);

export const usePaginatedMessages = () => {
  const context = useContext(PaginatedMessagesContext);
  if (!context) {
    throw new Error('usePaginatedMessages must be used within a PaginatedMessagesProvider');
  }
  return context;
};

interface PaginatedMessagesProviderProps {
  children: ReactNode;
  conversationId: string | null;
}

export const PaginatedMessagesProvider: React.FC<PaginatedMessagesProviderProps> = ({ 
  children, 
  conversationId 
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  // États
  const [messages, setMessages] = useState<PaginatedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  
  // Refs pour optimisation
  const lastMessageTimestamp = useRef<Date | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const unsubscribeTypingRef = useRef<(() => void) | null>(null);
  const isTypingRef = useRef(false);

  // 📄 Charger messages initiaux
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      const messagePage = await messagesService.loadInitialMessages(conversationId, user.uid);
      
      setMessages(messagePage.messages);
      setHasMore(messagePage.hasMore);
      setTotalMessages(messagePage.totalCount);
      lastMessageTimestamp.current = messagePage.lastMessageTimestamp;
      
      logger.debug('PaginatedMessages', `Loaded ${messagePage.messages.length} initial messages`);
    } catch (error) {
      logger.error('PaginatedMessages', 'Error loading initial messages', error);
      setError('Erreur de chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  // 📄 Charger plus de messages
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore || !lastMessageTimestamp.current) return;

    try {
      setLoadingMore(true);
      setError(null);
      
      const messagePage = await messagesService.loadMoreMessages(
        conversationId, 
        lastMessageTimestamp.current
      );
      
      // Ajouter les nouveaux messages au début (plus anciens)
      setMessages(prevMessages => [...messagePage.messages, ...prevMessages]);
      setHasMore(messagePage.hasMore);
      setTotalMessages(prev => prev + messagePage.totalCount);
      lastMessageTimestamp.current = messagePage.lastMessageTimestamp;
      
      logger.debug('PaginatedMessages', `Loaded ${messagePage.messages.length} more messages`);
    } catch (error) {
      logger.error('PaginatedMessages', 'Error loading more messages', error);
      setError('Erreur de chargement');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loadingMore]);

  // 📨 Envoyer message
  const sendMessage = useCallback(async (
    content: string, 
    type: 'text' | 'game_invite' = 'text',
    gameInvite?: any
  ) => {
    if (!conversationId || !user || !content.trim()) return;

    try {
      // Arrêter l'indicateur de frappe
      stopTyping();
      
      await messagesService.sendMessage(
        conversationId,
        user.uid,
        content,
        type,
        gameInvite
      );

      // Le message apparaîtra via l'écoute temps réel
      logger.debug('PaginatedMessages', 'Message sent successfully');
    } catch (error: any) {
      logger.error('PaginatedMessages', 'Error sending message', error);
      setError(error.message || 'Erreur d\'envoi du message');
      throw error;
    }
  }, [conversationId, user]);

  // ⌨️ Commencer à taper
  const startTyping = useCallback(() => {
    if (!conversationId || !user || !profile || isTypingRef.current) return;

    isTypingRef.current = true;
    messagesService.setTypingIndicator(
      conversationId,
      user.uid,
      profile.pseudo || 'Utilisateur',
      true
    );

    // Auto-stop après 3 secondes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, user, profile]);

  // ⌨️ Arrêter de taper
  const stopTyping = useCallback(() => {
    if (!conversationId || !user || !profile || !isTypingRef.current) return;

    isTypingRef.current = false;
    messagesService.setTypingIndicator(
      conversationId,
      user.uid,
      profile.pseudo || 'Utilisateur',
      false
    );

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, user, profile]);

  // 🎯 Écouter les indicateurs de frappe
  useEffect(() => {
    if (!conversationId || !user) {
      setTypingIndicators([]);
      return;
    }

    const unsubscribe = messagesService.listenToTypingIndicators(
      conversationId,
      user.uid,
      (indicators) => {
        setTypingIndicators(indicators);
      }
    );

    unsubscribeTypingRef.current = unsubscribe;

    return () => {
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
        unsubscribeTypingRef.current = null;
      }
    };
  }, [conversationId, user]);

  // 🔄 Charger les messages quand la conversation change
  useEffect(() => {
    if (conversationId) {
      // Reset state
      setMessages([]);
      setHasMore(true);
      setTotalMessages(0);
      lastMessageTimestamp.current = null;
      setError(null);
      
      // Charger les messages
      loadInitialMessages();
    } else {
      // Cleanup
      setMessages([]);
      setTypingIndicators([]);
      setError(null);
    }

    return () => {
      // Cleanup typing
      stopTyping();
    };
  }, [conversationId, loadInitialMessages]);

  // 🧹 Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
      }
      stopTyping();
    };
  }, []);

  // 🔄 Gérer les changements d'état de l'app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopTyping();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [stopTyping]);

  const contextValue: PaginatedMessagesContextType = {
    messages,
    loading,
    loadingMore,
    hasMore,
    typingIndicators,
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    startTyping,
    stopTyping,
    totalMessages,
    error,
  };

  return (
    <PaginatedMessagesContext.Provider value={contextValue}>
      {children}
    </PaginatedMessagesContext.Provider>
  );
}; 