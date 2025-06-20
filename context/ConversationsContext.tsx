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
    where
} from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import ImageService from '../services/imageService';
import { useAuth } from './AuthContext';

// 🔒 Types TypeScript pour les conversations
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
  isImageAvatar?: boolean; // Indique si l'avatar est une image ou un emoji
  isOnline: boolean;
  currentGame?: string;
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
  error: string | null;
  createConversation: (participant: Participant, gameInCommon?: string) => Promise<string | null>;
  getConversationById: (id: string) => Conversation | null;
  markAsRead: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  syncAvatars: () => Promise<void>;
}

// 🏗️ Context avec valeurs par défaut
const ConversationsContext = createContext<ConversationsContextType>({
  conversations: [],
  loading: true,
  error: null,
  createConversation: async () => null,
  getConversationById: () => null,
  markAsRead: () => {},
  deleteConversation: async () => {},
  refreshConversations: async () => {},
  syncAvatars: async () => {},
});

// 🎣 Hook personnalisé
export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations doit être utilisé dans un ConversationsProvider');
  }
  return context;
};

// 🔥 Provider principal
export const ConversationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🆕 Créer une nouvelle conversation
  const createConversation = async (participant: Participant, gameInCommon?: string): Promise<string | null> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return null;
    }

    try {
      // Vérifier si une conversation existe déjà avec ce participant
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === participant.id)
      );

      if (existingConversation) {
        console.log('✅ Conversation existante trouvée:', existingConversation.id);
        return existingConversation.id;
      }

      // Créer une nouvelle conversation dans Firestore
      const conversationRef = doc(collection(db, 'conversations'));
      const conversationId = conversationRef.id;

      const conversationData = {
        id: conversationId,
        participants: [user.uid, participant.id],
        participantDetails: {
          [user.uid]: {
            name: user.email?.split('@')[0] || 'Moi',
            avatar: '🎮',
            isImageAvatar: false,
            isOnline: true,
          },
          [participant.id]: {
            name: participant.name,
            avatar: participant.avatar,
            isImageAvatar: participant.isImageAvatar || false,
            isOnline: participant.isOnline,
            currentGame: participant.currentGame,
          },
        },
        ...(gameInCommon && { gameInCommon }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(conversationRef, conversationData);

      // Créer le message système de bienvenue
      const systemMessage = {
        senderId: 'system',
        content: `Vous êtes maintenant connectés ! ${gameInCommon ? `Vous avez ${gameInCommon} en commun 🎮` : 'Amusez-vous bien !'}`,
        type: 'system',
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), systemMessage);

      console.log('✅ Nouvelle conversation créée dans Firestore:', conversationId);
      return conversationId;
    } catch (err) {
      console.error('❌ Erreur création conversation:', err);
      setError('Erreur lors de la création de la conversation');
      return null;
    }
  };

  // 📖 Récupérer une conversation par ID
  const getConversationById = (id: string): Conversation | null => {
    return conversations.find(conv => conv.id === id) || null;
  };

  // ✅ Marquer comme lu (local seulement pour l'instant)
  const markAsRead = (conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  // 🗑️ Supprimer une conversation
  const deleteConversation = async (conversationId: string) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      // 1. Supprimer tous les messages de la conversation
      const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc => 
        deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
      );
      
      await Promise.all(deletePromises);
      console.log(`✅ ${messagesSnapshot.docs.length} messages supprimés`);

      // 2. Supprimer la conversation elle-même
      await deleteDoc(doc(db, 'conversations', conversationId));
      console.log('✅ Conversation supprimée de Firestore:', conversationId);

      // 3. La suppression locale se fera automatiquement via onSnapshot
      // Pas besoin de setConversations ici car Firestore va notifier le changement
      
    } catch (err) {
      console.error('❌ Erreur suppression conversation:', err);
      setError('Erreur lors de la suppression de la conversation');
      
      // En cas d'erreur Firestore, on supprime quand même localement
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    }
  };

  // 🔄 Actualiser les conversations
  const refreshConversations = async () => {
    // Les conversations sont automatiquement synchronisées via onSnapshot
    console.log('🔄 Conversations synchronisées automatiquement');
  };

  // 🔄 Forcer la synchronisation des avatars (utile après changement de photo)
  const syncAvatars = async () => {
    if (!user?.uid) return;
    
    console.log('🔄 Synchronisation forcée des avatars...');
    
    try {
      // Récupérer toutes les conversations actuelles
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      
      const snapshot = await getDocs(conversationsQuery);
      const updatedConversations: Conversation[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherParticipantId = data.participants.find((id: string) => id !== user.uid);
        
        if (otherParticipantId) {
          // Récupérer le profil à jour
          const userProfileDoc = await getDoc(doc(db, 'users', otherParticipantId));
          if (userProfileDoc.exists()) {
            const profileData = userProfileDoc.data();
            const avatarUrl = profileData.profilePicture || profileData.avatar || '🎮';
            const avatarType = ImageService.detectAvatarType(avatarUrl);
            
            const conversation: Conversation = {
              id: docSnap.id,
              participants: [{
                id: otherParticipantId,
                name: profileData.pseudo || `User_${otherParticipantId.slice(0, 6)}`,
                avatar: avatarUrl,
                isImageAvatar: ['cloudinary', 'firebase', 'url', 'local'].includes(avatarType),
                isOnline: profileData.isOnline || false,
                currentGame: profileData.currentlyPlaying,
              }],
              lastMessage: {
                id: 'last',
                senderId: data.lastMessage?.senderId || 'system',
                content: data.lastMessage?.content || 'Conversation créée',
                timestamp: data.lastMessage?.timestamp?.toDate() || data.createdAt?.toDate() || new Date(),
                type: data.lastMessage?.type || 'system',
              },
              unreadCount: 0,
              gameInCommon: data.gameInCommon,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };
            
            updatedConversations.push(conversation);
          }
        }
      }
      
      setConversations(updatedConversations);
      console.log(`✅ ${updatedConversations.length} avatars synchronisés manuellement`);
      
    } catch (error) {
      console.error('❌ Erreur synchronisation manuelle avatars:', error);
    }
  };

  // 👂 Écouter les conversations en temps réel
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('🔥 Démarrage écoute conversations Firestore pour:', user.uid);

    // Query pour récupérer les conversations où l'utilisateur est participant
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
      // orderBy('updatedAt', 'desc') // Temporairement commenté en attendant l'index
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        try {
          const conversationsData: Conversation[] = [];

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            
            // Récupérer les détails du participant (pas moi)
            const otherParticipantId = data.participants.find((id: string) => id !== user.uid);
            let participantDetails = data.participantDetails?.[otherParticipantId];

            // 🔄 SYNCHRONISATION AVATAR : Récupérer les infos à jour du profil utilisateur
            if (otherParticipantId) {
              try {
                const userProfileDoc = await getDoc(doc(db, 'users', otherParticipantId));
                if (userProfileDoc.exists()) {
                  const profileData = userProfileDoc.data();
                  
                  // Mettre à jour avec les infos les plus récentes du profil
                  const avatarUrl = profileData.profilePicture || profileData.avatar || '🎮';
                  const avatarType = ImageService.detectAvatarType(avatarUrl);
                  
                  participantDetails = {
                    ...participantDetails,
                    name: profileData.pseudo || participantDetails?.name || `User_${otherParticipantId.slice(0, 6)}`,
                    avatar: avatarUrl,
                    isImageAvatar: ['cloudinary', 'firebase', 'url', 'local'].includes(avatarType),
                    isOnline: profileData.isOnline || false,
                    currentGame: profileData.currentlyPlaying || participantDetails?.currentGame,
                  };
                  
                  console.log('🔄 Avatar synchronisé pour:', participantDetails.name, '→', avatarUrl);
                }
              } catch (profileError) {
                console.warn('⚠️ Erreur sync profil participant:', profileError);
                // Continuer avec les données existantes si erreur
              }
            }

            if (participantDetails) {
              const conversation: Conversation = {
                id: docSnap.id,
                participants: [{
                  id: otherParticipantId,
                  name: participantDetails.name,
                  avatar: participantDetails.avatar,
                  isImageAvatar: participantDetails.isImageAvatar,
                  isOnline: participantDetails.isOnline || false,
                  currentGame: participantDetails.currentGame,
                }],
                lastMessage: {
                  id: 'last',
                  senderId: data.lastMessage?.senderId || 'system',
                  content: data.lastMessage?.content || 'Conversation créée',
                  timestamp: data.lastMessage?.timestamp?.toDate() || data.createdAt?.toDate() || new Date(),
                  type: data.lastMessage?.type || 'system',
                },
                unreadCount: 0, // TODO: Calculer les messages non lus
                gameInCommon: data.gameInCommon,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              };

              conversationsData.push(conversation);
            }
          }

          setConversations(conversationsData);
          setError(null);
          console.log(`✅ ${conversationsData.length} conversations synchronisées avec avatars à jour`);
        } catch (err) {
          console.error('❌ Erreur traitement conversations:', err);
          setError('Erreur lors de la synchronisation');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Erreur écoute conversations:', err);
        setError('Erreur de connexion Firestore');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // 📦 Valeurs du contexte
  const value: ConversationsContextType = {
    conversations,
    loading,
    error,
    createConversation,
    getConversationById,
    markAsRead,
    deleteConversation,
    refreshConversations,
    syncAvatars,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export type { Conversation, Message, Participant };

