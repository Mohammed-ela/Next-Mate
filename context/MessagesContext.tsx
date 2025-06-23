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
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { db } from '../config/firebase';
import { safeTimestampToDate } from '../utils/firebaseHelpers';
import { useAuth } from './AuthContext';

// Types étendus pour supporter les invitations de jeu
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

interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'game_invite') => Promise<void>;
  sendGameInvite: (conversationId: string, gameId: string, gameName: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType>({
  messages: [],
  loading: true,
  sendMessage: async () => {},
  sendGameInvite: async () => {},
});

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages doit être utilisé dans un MessagesProvider');
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
  const [loading, setLoading] = useState(true);
  const previousMessageIdsRef = useRef<string[]>([]);

  // Envoyer un message (texte ou invitation)
  const sendMessage = async (
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

        console.log('📨 Message envoyé - notifications push désactivées temporairement');
      }

      console.log('✅ Message envoyé:', content.trim());
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  };

  // Envoyer une invitation de jeu spécialisée
  const sendGameInvite = async (conversationId: string, gameId: string, gameName: string) => {
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

      // 🔢 CORRECTION : Incrémenter les compteurs comme dans sendMessage
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
          console.log('🔢 Compteurs messages non lus mis à jour pour invitation');
        }
      }

      console.log('🎮 Invitation de jeu envoyée:', gameName);
    } catch (error) {
      console.error('❌ Erreur envoi invitation:', error);
    }
  };

  // Écouter les messages avec support des invitations de jeu
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      previousMessageIdsRef.current = [];
      return;
    }

    console.log('🔄 Initialisation écoute messages pour:', conversationId);

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          senderId: doc.data().senderId,
          content: doc.data().content,
          timestamp: safeTimestampToDate(doc.data().timestamp),
          type: doc.data().type || 'text',
          gameInvite: doc.data().gameInvite,
        }));

        // Vérifier s'il y a de nouveaux messages (pas de moi) en utilisant la ref
        const newMessages = messagesData.filter(m => 
          !previousMessageIdsRef.current.includes(m.id) && 
          m.senderId !== user?.uid &&
          m.type !== 'system'
        );

        // Note: Notifications locales retirées - à réimplémenter plus tard
        if (newMessages.length > 0 && AppState.currentState === 'active') {
          console.log('📨 Nouveaux messages reçus - notifications désactivées temporairement');
        }

        // Mettre à jour la ref avec les nouveaux IDs
        previousMessageIdsRef.current = messagesData.map(m => m.id);

        setMessages(messagesData);
        setLoading(false);
        console.log(`💬 ${messagesData.length} messages synchronisés`);
      },
      (error) => {
        console.error('❌ Erreur écoute messages:', error);
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
