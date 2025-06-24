import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// Configuration du handler de notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface LocalNotificationData {
  type: 'message' | 'match' | 'game_invite' | 'reminder';
  conversationId?: string;
  userId?: string;
  url?: string;
  [key: string]: any;
}

class NotificationService {
  private isInitialized = false;
  private permissionGranted = false;
  private scheduledNotifications = new Map<string, string>(); // key -> notificationId

  async initialize(): Promise<boolean> {
    try {
      logger.info('NotificationService', 'Initialisation...');
      
      // Vérifier si on est sur un device physique
      if (!Device.isDevice) {
        logger.warn('NotificationService', 'Les notifications ne fonctionnent que sur un appareil physique');
        return false;
      }

      // Demander les permissions
      await this.requestPermissions();
      
      // Configurer les channels Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Setup listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      logger.info('NotificationService', 'Service initialisé avec succès');
      return true;
    } catch (error) {
      logger.error('NotificationService', 'Erreur initialisation', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            allowProvisional: false,
          },
        });
        finalStatus = status;
      }

      this.permissionGranted = finalStatus === 'granted';
      
      if (!this.permissionGranted) {
        logger.warn('NotificationService', 'Permissions de notification refusées');
      } else {
        logger.info('NotificationService', 'Permissions de notification accordées');
      }
    } catch (error) {
      logger.error('NotificationService', 'Erreur demande permissions', error);
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    try {
      // Channel pour les messages
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
        sound: 'default',
        description: 'Notifications pour les nouveaux messages',
      });

      // Channel pour les matches
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Nouveaux matches',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 150, 150],
        lightColor: '#10b981',
        sound: 'default',
        description: 'Notifications pour les nouveaux matches',
      });

      // Channel pour les invitations de jeu
      await Notifications.setNotificationChannelAsync('game_invites', {
        name: 'Invitations de jeu',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 100, 300],
        lightColor: '#f59e0b',
        sound: 'default',
        description: 'Notifications pour les invitations de jeu',
      });

      logger.info('NotificationService', 'Channels Android configurés');
    } catch (error) {
      logger.error('NotificationService', 'Erreur setup channels Android', error);
    }
  }

  private setupNotificationListeners(): void {
    // Listener pour les notifications reçues (app en foreground)
    Notifications.addNotificationReceivedListener(notification => {
      logger.debug('NotificationService', 'Notification reçue', notification);
    });

    // Listener pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      logger.debug('NotificationService', 'Interaction notification', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as LocalNotificationData;
    
    if (data?.url) {
      // Ici tu peux utiliser Expo Router pour naviguer
      logger.debug('NotificationService', 'Navigation vers', data.url);
      // router.push(data.url); // À implémenter selon ta navigation
    }
  }

  // === MÉTHODES PUBLIQUES ===

  async scheduleLocalNotification(
    title: string,
    body: string,
    data: LocalNotificationData,
    options: {
      seconds?: number;
      date?: Date;
      repeats?: boolean;
    } = {}
  ): Promise<string | null> {
    if (!this.permissionGranted) {
      logger.warn('NotificationService', 'Permissions non accordées');
      return null;
    }

    try {
      const { seconds, date, repeats = false } = options;
      
      let trigger: any = null;
      
      if (seconds) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats,
        };
      } else if (date) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          repeats,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger,
      });

      logger.info('NotificationService', 'Notification locale programmée', { notificationId, title });
      return notificationId;
    } catch (error) {
      logger.error('NotificationService', 'Erreur schedule notification', error);
      return null;
    }
  }

  async showInstantNotification(
    title: string,
    body: string,
    data: LocalNotificationData
  ): Promise<void> {
    await this.scheduleLocalNotification(title, body, data, {
      seconds: 1, // Afficher dans 1 seconde
    });
  }

  private getChannelForType(type: LocalNotificationData['type']): string {
    switch (type) {
      case 'message':
        return 'messages';
      case 'match':
        return 'matches';
      case 'game_invite':
        return 'game_invites';
      default:
        return 'messages';
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info('NotificationService', 'Notification annulée', notificationId);
    } catch (error) {
      logger.error('NotificationService', 'Erreur annulation notification', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('NotificationService', 'Toutes les notifications annulées');
    } catch (error) {
      logger.error('NotificationService', 'Erreur annulation toutes notifications', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      logger.error('NotificationService', 'Erreur lecture badge', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      logger.error('NotificationService', 'Erreur mise à jour badge', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // === MÉTHODES SPÉCIFIQUES À L'APP ===

  async notifyNewMessage(
    senderName: string,
    message: string,
    conversationId: string
  ): Promise<void> {
    await this.showInstantNotification(
      `Nouveau message de ${senderName}`,
      message.length > 50 ? message.substring(0, 50) + '...' : message,
      {
        type: 'message',
        conversationId,
        url: `/chat/${conversationId}`,
      }
    );
  }

  async notifyNewMatch(matchedUserName: string, userId: string): Promise<void> {
    await this.showInstantNotification(
      'Nouveau match ! 🎮',
      `Tu as matché avec ${matchedUserName} !`,
      {
        type: 'match',
        userId,
        url: `/chat/${userId}`, // Ou la route appropriée
      }
    );
  }

  async notifyGameInvite(
    inviterName: string,
    gameName: string,
    conversationId: string
  ): Promise<void> {
    await this.showInstantNotification(
      'Invitation de jeu ! 🎯',
      `${inviterName} t'invite à jouer à ${gameName}`,
      {
        type: 'game_invite',
        conversationId,
        url: `/chat/${conversationId}`,
      }
    );
  }

  async scheduleReminder(
    title: string,
    message: string,
    date: Date,
    data: LocalNotificationData = { type: 'reminder' }
  ): Promise<string | null> {
    return await this.scheduleLocalNotification(title, message, data, {
      date,
    });
  }

  // === GETTERS ===

  get isReady(): boolean {
    return this.isInitialized && this.permissionGranted;
  }

  get hasPermissions(): boolean {
    return this.permissionGranted;
  }
}

// Instance singleton
export const notificationService = new NotificationService();

// Export du service
export default notificationService;
