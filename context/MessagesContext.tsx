import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// 🔒 Types TypeScript pour les messages
interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'game_invite' | 'system';
}

interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, type?: 'text' | 'game_invite') => Promise<boolean>;
}

// 🏗️ Context avec valeurs par défaut
const MessagesContext = createContext<MessagesContextType>({
  messages: [],
  loading: true,
  error: null,
  sendMessage: async () => false,
});

// 🎣 Hook personnalisé
export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages doit être utilisé dans un MessagesProvider');
  }
  return context;
};

// 🔥 Provider pour une conversation spécifique
export const MessagesProvider: React.FC<{ 
  children: ReactNode; 
  conversationId: string;
}> = ({ children, conversationId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 💬 Envoyer un message
  const sendMessage = async (content: string, type: 'text' | 'game_invite' = 'text'): Promise<boolean> => {
    if (!user || !conversationId) {
      setError('Utilisateur non connecté ou conversation invalide');
      return false;
    }

    try {
      const messageData = {
        senderId: user.uid,
        content: content.trim(),
        type,
        timestamp: serverTimestamp(),
      };

      // Ajouter le message à la sous-collection
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      // Mettre à jour la conversation avec le dernier message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
          senderId: user.uid,
          content: content.trim(),
          type,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Message envoyé:', content);
      return true;
    } catch (err) {
      console.error('❌ Erreur envoi message:', err);
      setError('Erreur lors de l\'envoi du message');
      return false;
    }
  };

  // 👂 Écouter les messages en temps réel
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('🔥 Démarrage écoute messages pour conversation:', conversationId);

    // Query pour récupérer les messages triés par timestamp
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        try {
          const messagesData: Message[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const message: Message = {
              id: doc.id,
              senderId: data.senderId,
              content: data.content,
              timestamp: data.timestamp?.toDate() || new Date(),
              type: data.type || 'text',
            };
            messagesData.push(message);
          });

          setMessages(messagesData);
          setError(null);
          console.log(`✅ ${messagesData.length} messages synchronisés`);
        } catch (err) {
          console.error('❌ Erreur traitement messages:', err);
          setError('Erreur lors de la synchronisation des messages');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Erreur écoute messages:', err);
        setError('Erreur de connexion Firestore');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [conversationId]);

  // 📦 Valeurs du contexte
  const value: MessagesContextType = {
    messages,
    loading,
    error,
    sendMessage,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export type { Message };
