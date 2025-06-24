import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { db } from '../config/firebase';
import { notificationService } from '../services/notificationService';
import { safeTimestampToDate } from '../utils/firebaseHelpers';
import { logger } from '../utils/logger';
import { useAuth } from './AuthContext';
// 📱 Import du service notifications (en douceur)

// 🔧 Interface Message unifiée et cohérente
interface Message {
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

// 🔧 Interface du contexte corrigée
interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'game_invite') => Promise<void>;
  sendGameInvite: (conversationId: string, gameId: string, gameName: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};

interface MessagesProviderProps {
  children: ReactNode;
  conversationId: string | null;
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ 
  children, 
  conversationId 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const previousMessageIdsRef = useRef<string[]>([]);

  // 📨 Envoyer un message (texte ou invitation)
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    type: 'text' | 'game_invite' = 'text'
  ) => {
    if (!user || !content.trim()) return;

    try {
      const messageData = {
        senderId: user.uid,
        content: content.trim(),
        type,
        timestamp: serverTimestamp(),
      };

      // Ajouter le message
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      // Mettre à jour la conversation avec le dernier message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          senderId: user.uid,
          content: content.trim(),
          type,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Incrémenter les compteurs de messages non lus pour les autres participants
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        const participants = data.participants || [];
        const otherParticipants = participants.filter((id: string) => id !== user.uid);
        
        // Incrémenter le compteur pour chaque autre participant
        const updates: Record<string, any> = {};
        otherParticipants.forEach((participantId: string) => {
          updates[`unreadCounts.${participantId}`] = increment(1);
        });
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(conversationRef, updates);
        }

        logger.debug('Messages', '✅ Message envoyé et compteurs mis à jour');
      }

    } catch (error) {
      logger.error('Messages', 'Erreur envoi message', error);
      throw error;
    }
  }, [user]);

  // 🎮 Envoyer une invitation de jeu spécialisée
  const sendGameInvite = useCallback(async (conversationId: string, gameId: string, gameName: string) => {
    if (!user) return;

    try {
      const gameInviteMessage = {
        senderId: user.uid,
        content: `🎮 Invitation à jouer : ${gameName}`,
        type: 'game_invite',
        gameInvite: {
          gameId,
          gameName,
          message: `Veux-tu jouer à ${gameName} avec moi ?`,
        },
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), gameInviteMessage);
      
      // Mettre à jour la conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          senderId: user.uid,
          content: `🎮 Invitation : ${gameName}`,
          type: 'game_invite',
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Incrémenter les compteurs comme dans sendMessage
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        const participants = data.participants || [];
        const otherParticipants = participants.filter((id: string) => id !== user.uid);
        
        const updates: Record<string, any> = {};
        otherParticipants.forEach((participantId: string) => {
          updates[`unreadCounts.${participantId}`] = increment(1);
        });
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(conversationRef, updates);
        }
      }

      logger.info('Messages', '🎮 Invitation de jeu envoyée', { gameName });
    } catch (error) {
      logger.error('Messages', 'Erreur envoi invitation', error);
      throw error;
    }
  }, [user]);

  // 👂 Écouter les messages - UN SEUL useEffect unifié
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      previousMessageIdsRef.current = [];
      return;
    }

    // Initialiser le service de notifications une seule fois
    notificationService.initialize();

    setLoading(true);
    logger.debug('Messages', 'Initialisation écoute messages pour', conversationId);

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        const messagesData: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          senderId: doc.data().senderId,
          content: doc.data().content,
          timestamp: safeTimestampToDate(doc.data().timestamp),
          type: doc.data().type || 'text',
          gameInvite: doc.data().gameInvite,
        }));

        // 🔔 Détecter nouveaux messages pour notifications locales
        const newMessages = messagesData.filter(m => 
          !previousMessageIdsRef.current.includes(m.id) && 
          m.senderId !== user?.uid &&
          m.type !== 'system'
        );

        // 📱 Envoyer notifications locales pour nouveaux messages
        if (newMessages.length > 0 && user && AppState.currentState !== 'active') {
          for (const message of newMessages) {
            try {
              const senderDoc = await getDoc(doc(db, 'users', message.senderId));
              const senderData = senderDoc.data();
              const senderName = senderData?.pseudo || senderData?.displayName || 'Utilisateur';
              
              await notificationService.notifyNewMessage(
                senderName,
                message.content,
                conversationId
              );
            } catch (error) {
              logger.error('Messages', 'Erreur notification nouveau message', error);
            }
          }
        }

        // Mettre à jour la ref avec les nouveaux IDs
        previousMessageIdsRef.current = messagesData.map(m => m.id);

        setMessages(messagesData);
        setLoading(false);
        logger.debug('Messages', `💬 ${messagesData.length} messages synchronisés`);
      },
      (error) => {
        logger.error('Messages', 'Erreur écoute messages', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [conversationId, user?.uid]);

  const value: MessagesContextType = {
    messages,
    loading,
    sendMessage,
    sendGameInvite,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export type { Message };
