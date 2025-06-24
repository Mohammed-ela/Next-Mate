import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  type: 'text' | 'game_invite';
  timestamp: Date;
  retry: number;
}

interface QueuedAction {
  id: string;
  type: 'mark_read' | 'update_profile' | 'send_message';
  data: any;
  timestamp: Date;
  retry: number;
}

// 📱 Service pour gérer les actions hors ligne
class OfflineService {
  private messageQueue: QueuedMessage[] = [];
  private actionQueue: QueuedAction[] = [];
  private isOnline: boolean = true;
  private maxRetries: number = 3;

  constructor() {
    this.loadQueuesFromStorage();
  }

  // 🔄 Gestion du statut de connexion
  setOnlineStatus(isOnline: boolean) {
    const previousStatus = this.isOnline;
    this.isOnline = isOnline;
    
    if (isOnline && !previousStatus) {
      logger.info('OfflineService', '📶 Connexion rétablie, traitement des files...');
      this.processQueues();
    } else if (!isOnline) {
      logger.info('OfflineService', '📵 Connexion perdue, mode hors ligne activé');
    }
  }

  // 💬 Ajouter un message en file d'attente
  async queueMessage(conversationId: string, content: string, type: 'text' | 'game_invite' = 'text') {
    const queuedMessage: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      content,
      type,
      timestamp: new Date(),
      retry: 0
    };

    this.messageQueue.push(queuedMessage);
    await this.saveQueuesStorage();
    
    logger.info('OfflineService', `💬 Message mis en file: ${content.substring(0, 20)}...`);
    
    if (this.isOnline) {
      this.processMessageQueue();
    }
  }

  // ⚡ Ajouter une action en file d'attente  
  async queueAction(type: QueuedAction['type'], data: any) {
    const queuedAction: QueuedAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retry: 0
    };

    this.actionQueue.push(queuedAction);
    await this.saveQueuesStorage();
    
    logger.info('OfflineService', `⚡ Action mise en file: ${type}`);
    
    if (this.isOnline) {
      this.processActionQueue();
    }
  }

  // 🔄 Traiter toutes les files d'attente
  private async processQueues() {
    await Promise.all([
      this.processMessageQueue(),
      this.processActionQueue()
    ]);
  }

  // 💬 Traiter la file des messages
  private async processMessageQueue() {
    // Note: La logique d'envoi sera intégrée directement dans MessagesContext
    // en utilisant le service offline comme queue
    
    for (let i = this.messageQueue.length - 1; i >= 0; i--) {
      const message = this.messageQueue[i];
      
      try {
        // Essayer d'envoyer le message
        // Cette partie sera appelée depuis MessagesContext avec la vraie fonction sendMessage
        logger.info('OfflineService', `📤 Prêt pour envoi message: ${message.content.substring(0, 20)}...`);
        
        // Cette fonction sera utilisée par MessagesContext pour traiter la queue
        // La suppression de la queue se fera après confirmation d'envoi
        
      } catch (error) {
        message.retry++;
        if (message.retry >= this.maxRetries) {
          logger.error('OfflineService', `❌ Échec définitif message: ${message.id}`);
          this.messageQueue.splice(i, 1);
        } else {
          logger.warn('OfflineService', `⚠️ Retry ${message.retry}/${this.maxRetries} pour: ${message.id}`);
        }
      }
    }
    
    await this.saveQueuesStorage();
  }

  // 📤 Obtenir le prochain message de la queue (pour MessagesContext)
  getNextQueuedMessage(): QueuedMessage | null {
    return this.messageQueue.length > 0 ? this.messageQueue[0] : null;
  }

  // ✅ Marquer un message comme envoyé avec succès
  async markMessageAsSent(messageId: string) {
    const index = this.messageQueue.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      this.messageQueue.splice(index, 1);
      await this.saveQueuesStorage();
      logger.info('OfflineService', `✅ Message ${messageId} retiré de la queue`);
    }
  }

  // ❌ Marquer un message comme échoué
  async markMessageAsFailed(messageId: string) {
    const message = this.messageQueue.find(msg => msg.id === messageId);
    if (message) {
      message.retry++;
      if (message.retry >= this.maxRetries) {
        await this.markMessageAsSent(messageId); // Supprimer définitivement
        logger.error('OfflineService', `❌ Message ${messageId} abandonné après ${this.maxRetries} tentatives`);
      }
      await this.saveQueuesStorage();
    }
  }

  // ⚡ Traiter la file des actions
  private async processActionQueue() {
    for (let i = this.actionQueue.length - 1; i >= 0; i--) {
      const action = this.actionQueue[i];
      
      try {
        // Traiter selon le type d'action
        switch (action.type) {
          case 'mark_read':
            // Logique pour marquer comme lu
            break;
          case 'update_profile':
            // Logique pour mettre à jour le profil
            break;
          default:
            logger.warn('OfflineService', `Type d'action inconnu: ${action.type}`);
        }
        
        // Supprimer après succès
        this.actionQueue.splice(i, 1);
        
      } catch (error) {
        action.retry++;
        if (action.retry >= this.maxRetries) {
          logger.error('OfflineService', `❌ Échec définitif action: ${action.id}`);
          this.actionQueue.splice(i, 1);
        }
      }
    }
    
    await this.saveQueuesStorage();
  }

  // 💾 Sauvegarder les files en AsyncStorage
  private async saveQueuesStorage() {
    try {
      await AsyncStorage.setItem('nextmate_offline_queues', JSON.stringify({
        messages: this.messageQueue,
        actions: this.actionQueue
      }));
    } catch (error) {
      logger.error('OfflineService', 'Erreur sauvegarde files', error);
    }
  }

  // 📖 Charger les files depuis AsyncStorage
  private async loadQueuesFromStorage() {
    try {
      const data = await AsyncStorage.getItem('nextmate_offline_queues');
      if (data) {
        const parsed = JSON.parse(data);
        this.messageQueue = parsed.messages || [];
        this.actionQueue = parsed.actions || [];
        logger.info('OfflineService', `📖 Files chargées: ${this.messageQueue.length} messages, ${this.actionQueue.length} actions`);
      }
    } catch (error) {
      logger.error('OfflineService', 'Erreur chargement files', error);
    }
  }

  // 📊 Statistiques des files d'attente
  getQueueStats() {
    return {
      isOnline: this.isOnline,
      pendingMessages: this.messageQueue.length,
      pendingActions: this.actionQueue.length,
      totalPending: this.messageQueue.length + this.actionQueue.length
    };
  }

  // 🧹 Nettoyer les files d'attente
  async clearQueues() {
    this.messageQueue = [];
    this.actionQueue = [];
    await this.saveQueuesStorage();
    logger.info('OfflineService', '🧹 Files d\'attente nettoyées');
  }
}

export default new OfflineService(); 