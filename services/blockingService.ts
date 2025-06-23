import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockedUserName: string;
  blockedUserAvatar: string;
  blockedAt: Date;
  reason?: string;
}

export class BlockingService {
  // 🚫 Bloquer un utilisateur
  static async blockUser(
    currentUserId: string, 
    targetUserId: string, 
    targetUserName: string, 
    targetUserAvatar: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log('🚫 Blocage utilisateur:', { currentUserId, targetUserId, targetUserName });
      
      const blockId = `${currentUserId}_${targetUserId}`;
      const blockRef = doc(db, 'blocked_users', blockId);
      
      await setDoc(blockRef, {
        blockerId: currentUserId,
        blockedUserId: targetUserId,
        blockedUserName: targetUserName,
        blockedUserAvatar: targetUserAvatar,
        blockedAt: serverTimestamp(),
        reason: reason || null,
      });
      
      console.log('✅ Utilisateur bloqué avec succès');
    } catch (error) {
      console.error('❌ Erreur blocage utilisateur:', error);
      throw new Error('Impossible de bloquer cet utilisateur');
    }
  }

  // 🔓 Débloquer un utilisateur
  static async unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      console.log('🔓 Déblocage utilisateur:', { currentUserId, targetUserId });
      
      const blockId = `${currentUserId}_${targetUserId}`;
      const blockRef = doc(db, 'blocked_users', blockId);
      
      await deleteDoc(blockRef);
      
      console.log('✅ Utilisateur débloqué avec succès');
    } catch (error) {
      console.error('❌ Erreur déblocage utilisateur:', error);
      throw new Error('Impossible de débloquer cet utilisateur');
    }
  }

  // 📋 Récupérer la liste des utilisateurs bloqués
  static async getBlockedUsers(currentUserId: string): Promise<BlockedUser[]> {
    try {
      console.log('📋 Récupération utilisateurs bloqués pour:', currentUserId);
      
      const blockedUsersQuery = query(
        collection(db, 'blocked_users'),
        where('blockerId', '==', currentUserId)
      );
      
      const snapshot = await getDocs(blockedUsersQuery);
      const blockedUsers: BlockedUser[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        blockedUsers.push({
          id: doc.id,
          blockedUserId: data.blockedUserId,
          blockedUserName: data.blockedUserName,
          blockedUserAvatar: data.blockedUserAvatar,
          blockedAt: data.blockedAt?.toDate() || new Date(),
          reason: data.reason,
        });
      });
      
      console.log('✅ Utilisateurs bloqués récupérés:', blockedUsers.length);
      return blockedUsers;
    } catch (error) {
      console.error('❌ Erreur récupération utilisateurs bloqués:', error);
      return [];
    }
  }

  // ✅ Vérifier si un utilisateur est bloqué
  static async isUserBlocked(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const blockedUsersQuery = query(
        collection(db, 'blocked_users'),
        where('blockerId', '==', currentUserId),
        where('blockedUserId', '==', targetUserId)
      );
      
      const snapshot = await getDocs(blockedUsersQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('❌ Erreur vérification blocage:', error);
      return false;
    }
  }

  // 🗑️ Supprimer la conversation lors du blocage
  static async deleteConversationOnBlock(
    currentUserId: string, 
    targetUserId: string
  ): Promise<void> {
    try {
      console.log('🗑️ Suppression conversation lors du blocage');
      
      // Rechercher les conversations impliquant les deux utilisateurs
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
      );
      
      const snapshot = await getDocs(conversationsQuery);
      const conversationsToDelete: string[] = [];
      
      snapshot.forEach((conversationDoc) => {
        const data = conversationDoc.data();
        const participants = data.participants || [];
        
        // Vérifier si la conversation implique l'utilisateur bloqué
        if (participants.includes(targetUserId)) {
          console.log('🗑️ Conversation trouvée à supprimer:', conversationDoc.id);
          conversationsToDelete.push(conversationDoc.id);
        }
      });
      
      // Supprimer les conversations une par une
      for (const conversationId of conversationsToDelete) {
        try {
          console.log('🗑️ Suppression conversation:', conversationId);
          const conversationRef = doc(db, 'conversations', conversationId);
          await deleteDoc(conversationRef);
          console.log('✅ Conversation supprimée:', conversationId);
        } catch (deleteError) {
          console.error('❌ Erreur suppression conversation individuelle:', conversationId, deleteError);
          // Continue avec les autres conversations même si une échoue
        }
      }
      
      console.log(`✅ ${conversationsToDelete.length} conversation(s) supprimée(s) lors du blocage`);
    } catch (error) {
      console.error('❌ Erreur suppression conversations:', error);
      throw new Error('Erreur lors de la suppression des conversations');
    }
  }

  // 🔍 Filtrer les utilisateurs bloqués de la découverte
  static async filterBlockedUsers(
    currentUserId: string, 
    users: any[]
  ): Promise<any[]> {
    try {
      console.log('🔍 Filtrage utilisateurs bloqués de la découverte');
      
      const blockedUsersQuery = query(
        collection(db, 'blocked_users'),
        where('blockerId', '==', currentUserId)
      );
      
      const snapshot = await getDocs(blockedUsersQuery);
      const blockedUserIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        blockedUserIds.add(data.blockedUserId);
      });
      
      // Filtrer les utilisateurs bloqués
      const filteredUsers = users.filter(user => !blockedUserIds.has(user.uid));
      
      console.log('✅ Utilisateurs filtrés:', {
        total: users.length,
        blocked: blockedUserIds.size,
        remaining: filteredUsers.length
      });
      
      return filteredUsers;
    } catch (error) {
      console.error('❌ Erreur filtrage utilisateurs bloqués:', error);
      return users; // Retourner la liste originale en cas d'erreur
    }
  }
} 