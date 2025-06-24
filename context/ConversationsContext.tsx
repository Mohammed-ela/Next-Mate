import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../config/firebase';
import { cleanObjectForFirestore, cleanParticipantData, safeTimestampToDate } from '../utils/firebaseHelpers';
import logger from '../utils/logger';
import { clearTimerCategory } from '../utils/timerManager';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserProfileContext';

// Types améliorés avec synchronisation temps réel
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

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isImageAvatar: boolean;
  bio?: string;
  isOnline: boolean;
  currentGame?: string;
  lastSeen?: Date;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: Message;
  unreadCount: number;
  gameInCommon?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  createConversation: (participant: Participant) => Promise<string | null>;
  getConversationById: (id: string) => Conversation | null;
  deleteConversation: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  sendGameInvite: (conversationId: string, gameId: string, gameName: string) => Promise<void>;
  refreshParticipantData: (conversationId: string) => Promise<void>;
  syncAllParticipantData: () => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextType>({
  conversations: [],
  loading: true,
  createConversation: async () => null,
  getConversationById: () => null,
  deleteConversation: async () => {},
  markAsRead: () => {},
  sendGameInvite: async () => {},
  refreshParticipantData: async () => {},
  syncAllParticipantData: async () => {},
});

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within ConversationsProvider');
  }
  return context;
};

export const ConversationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { registerAvatarChangeCallback } = useUserProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // 🛡️ Protection anti-boucle pour la synchronisation
  const lastSyncTime = useRef<number>(0);
  const SYNC_DEBOUNCE_MS = 3000; // 3 secondes minimum entre les syncs

  // 🆕 Créer une conversation optimisée
  const createConversation = async (participant: Participant): Promise<string | null> => {
    if (!user) {
      logger.warn('Conversations', 'Tentative création conversation sans utilisateur');
      return null;
    }

    try {
      logger.info('Conversations', `Création conversation avec ${participant.name}`);

      // Vérifier si conversation existe déjà
      const existingQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      const existingConversation = existingSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(participant.id);
      });

      if (existingConversation) {
        logger.debug('Conversations', `Conversation existante trouvée: ${existingConversation.id}`);
        return existingConversation.id;
      }

      // Créer nouvelle conversation avec données participant complètes
      const conversationRef = doc(collection(db, 'conversations'));
      const conversationData = {
        participants: [user.uid, participant.id],
        participantDetails: {
          [user.uid]: {
            name: user.email?.split('@')[0] || 'Moi',
            avatar: '🎮',
            isImageAvatar: false,
            bio: '',
            isOnline: true,
          },
          [participant.id]: cleanParticipantData(participant),
        },
        gameInCommon: participant.currentGame,
        unreadCounts: {
          [user.uid]: 0,
          [participant.id]: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const cleanedData = cleanObjectForFirestore(conversationData);
      await setDoc(conversationRef, cleanedData);

      logger.firebase('create', 'conversations', 'success', { 
        id: conversationRef.id,
        participant: participant.name 
      });

      return conversationRef.id;
    } catch (error) {
      logger.error('Conversations', 'Erreur création conversation', error);
      return null;
    }
  };

  // 🎮 Envoyer invitation de jeu optimisée
  const sendGameInvite = async (conversationId: string, gameId: string, gameName: string) => {
    if (!user?.uid) {
      logger.warn('Conversations', 'Tentative envoi invitation sans utilisateur');
      return;
    }

    try {
      logger.info('Conversations', `Envoi invitation jeu: ${gameName}`);

      const gameInviteMessage = {
        senderId: user.uid,
        content: `🎮 Invitation de jeu: ${gameName}`,
        type: 'game_invite' as const,
        gameInvite: {
          gameId,
          gameName,
          message: `Jouons ensemble à ${gameName}!`,
        },
        timestamp: serverTimestamp(),
      };

      await addDoc(
        collection(db, 'conversations', conversationId, 'messages'),
        gameInviteMessage
      );

      // Mise à jour dernière conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          senderId: user.uid,
          content: gameInviteMessage.content,
          timestamp: serverTimestamp(),
          type: 'game_invite',
        },
        updatedAt: serverTimestamp(),
      });

      logger.firebase('send', 'game_invite', 'success', { gameId, gameName });
    } catch (error) {
      logger.error('Conversations', 'Erreur envoi invitation jeu', error);
    }
  };

  // 🔄 Mettre à jour les données des participants (avatars, etc.)
  const refreshParticipantData = async (conversationId: string) => {
    if (!user?.uid) return;

    try {
      logger.debug('Conversations', `🔄 Refresh participant data: ${conversationId}`);

      // Récupérer la conversation actuelle
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        logger.warn('Conversations', `Conversation non trouvée: ${conversationId}`);
        return;
      }

      const conversationData = conversationSnap.data();
      const otherParticipantId = conversationData.participants.find((id: string) => id !== user.uid);
      
      if (!otherParticipantId) {
        logger.warn('Conversations', 'Autre participant non trouvé');
        return;
      }

      // Récupérer les données actuelles de l'utilisateur depuis Firestore
      const userRef = doc(db, 'users', otherParticipantId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        logger.warn('Conversations', `Utilisateur non trouvé: ${otherParticipantId}`);
        return;
      }

      const userData = userSnap.data();
      
      // Créer les nouvelles données participant synchronisées
      const updatedParticipantData = {
        name: userData.pseudo || userData.name || 'Joueur',
        avatar: userData.profilePicture || userData.avatar || '🎮',
        isImageAvatar: (userData.profilePicture || userData.avatar)?.startsWith('http') || false,
        bio: userData.bio || '',
        isOnline: userData.isOnline || false,
        currentGame: userData.currentlyPlaying || (userData.games && userData.games.length > 0 ? userData.games[0].name : undefined),
        lastSeen: userData.lastSeen,
      };

      // Mettre à jour dans Firestore
      await updateDoc(conversationRef, {
        [`participantDetails.${otherParticipantId}`]: cleanParticipantData(updatedParticipantData),
        updatedAt: serverTimestamp(),
      });

      logger.firebase('update', 'participant_data', 'success', { 
        conversationId, 
        participantId: otherParticipantId,
        newAvatar: updatedParticipantData.avatar 
      });

    } catch (error) {
      logger.error('Conversations', 'Erreur refresh participant data', error);
    }
  };

  const getConversationById = (id: string): Conversation | null => {
    return conversations.find(conv => conv.id === id) || null;
  };

  const markAsRead = (conversationId: string) => {
    if (!user?.uid) return;

    logger.debug('Conversations', `Marquage lu: ${conversationId}`);

    // Mettre à jour localement
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      );
      return updated;
    });

    // Mettre à jour dans Firestore
    const conversationRef = doc(db, 'conversations', conversationId);
    setDoc(conversationRef, {
      [`unreadCounts.${user.uid}`]: 0
    }, { merge: true }).then(() => {
      logger.firebase('update', 'unread_count', 'success', { conversationId });
    }).catch(error => {
      logger.error('Conversations', 'Erreur mise à jour lecture', error);
    });
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      logger.info('Conversations', `Suppression conversation: ${conversationId}`);

      // Supprimer les messages
      const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc => 
        deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
      );
      await Promise.all(deletePromises);

      // Supprimer la conversation
      await deleteDoc(doc(db, 'conversations', conversationId));
      
      logger.firebase('delete', 'conversations', 'success', { 
        conversationId,
        messagesDeleted: messagesSnapshot.docs.length 
      });
    } catch (err) {
      logger.error('Conversations', 'Erreur suppression conversation', err);
    }
  };

  // 📡 Écouter les conversations optimisé
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    logger.info('Conversations', 'Initialisation listener conversations');

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    firestoreUnsubscribeRef.current = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const conversationsData: Conversation[] = [];

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const otherParticipantId = data.participants.find((id: string) => id !== user.uid);
          const participantDetails = data.participantDetails?.[otherParticipantId];
          
          const unreadCount = data.unreadCounts?.[user.uid] || 0;

          if (participantDetails) {
            const conversation: Conversation = {
              id: docSnap.id,
              participants: [{
                id: otherParticipantId,
                name: participantDetails.name,
                avatar: participantDetails.avatar,
                isImageAvatar: participantDetails.isImageAvatar || false,
                bio: participantDetails.bio,
                isOnline: participantDetails.isOnline || false,
                currentGame: participantDetails.currentGame,
                lastSeen: participantDetails.lastSeen?.toDate(),
              }],
              lastMessage: {
                id: 'last',
                senderId: data.lastMessage?.senderId || 'system',
                content: data.lastMessage?.content || 'Conversation créée',
                timestamp: safeTimestampToDate(data.lastMessage?.timestamp || data.createdAt),
                type: data.lastMessage?.type || 'system',
              },
              unreadCount,
              gameInCommon: data.gameInCommon,
              createdAt: safeTimestampToDate(data.createdAt),
              updatedAt: safeTimestampToDate(data.updatedAt),
            };

            conversationsData.push(conversation);
          }
        });

        setConversations(conversationsData);
        setLoading(false);
        
        logger.firebase('sync', 'conversations', 'success', { 
          count: conversationsData.length 
        });
      },
      (err) => {
        logger.error('Conversations', 'Erreur écoute conversations', err);
        setLoading(false);
      }
    );

    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }
      clearTimerCategory('conversations');
      logger.debug('Conversations', 'Nettoyage listeners et timers');
    };
  }, [user?.uid]);

  // 🔄 Fonction pour synchroniser tous les avatars des conversations (avec protection)
  const syncAllParticipantData = async () => {
    const now = Date.now();
    
    // 🛡️ Vérifier le délai minimum depuis la dernière sync
    if (now - lastSyncTime.current < SYNC_DEBOUNCE_MS) {
      logger.debug('Conversations', '⏳ Synchronisation ignorée (trop récente)');
      return;
    }
    
    if (!user?.uid || conversations.length === 0) return;

    try {
      lastSyncTime.current = now;
      logger.info('Conversations', '🔄 Synchronisation avatars de toutes les conversations');
      
      // Synchroniser en parallèle pour optimiser
      const syncPromises = conversations.map(conversation => 
        refreshParticipantData(conversation.id)
      );
      
      await Promise.all(syncPromises);
      logger.info('Conversations', '✅ Synchronisation avatars terminée');
    } catch (error) {
      logger.error('Conversations', 'Erreur synchronisation avatars', error);
    }
  };

  // 👂 S'enregistrer pour écouter les changements d'avatar
  useEffect(() => {
    const unregister = registerAvatarChangeCallback(() => {
      logger.info('Conversations', '🔄 Avatar changé détecté, synchronisation...');
      syncAllParticipantData();
    });

    return unregister;
  }, [registerAvatarChangeCallback]);

  const value: ConversationsContextType = {
    conversations,
    loading,
    createConversation,
    getConversationById,
    deleteConversation,
    markAsRead,
    sendGameInvite,
    refreshParticipantData,
    syncAllParticipantData,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export type { Conversation, Message, Participant };

