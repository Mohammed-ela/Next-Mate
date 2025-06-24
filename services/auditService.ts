import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

// Types pour l'audit
export interface AuditEvent {
  id?: string;
  userId: string;
  userEmail?: string;
  action: AuditAction;
  category: AuditCategory;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type AuditAction = 
  // Actions utilisateur
  | 'user_login' 
  | 'user_logout' 
  | 'user_register'
  | 'user_profile_update'
  | 'user_avatar_change'
  | 'user_delete_account'
  // Actions de sécurité
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_reported'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  // Actions de communication
  | 'conversation_created'
  | 'conversation_deleted'
  | 'message_sent'
  | 'message_deleted'
  | 'game_invite_sent'
  // Actions système
  | 'system_error'
  | 'data_validation_failed'
  | 'unauthorized_access_attempt';

export type AuditCategory = 
  | 'authentication'
  | 'user_management'
  | 'security'
  | 'communication'
  | 'system'
  | 'moderation';

// Configuration de l'audit
const AUDIT_CONFIG = {
  BATCH_SIZE: 100,
  MAX_RETENTION_DAYS: 90,
  HIGH_PRIORITY_ACTIONS: [
    'user_blocked',
    'user_reported', 
    'rate_limit_exceeded',
    'unauthorized_access_attempt',
    'user_delete_account'
  ],
  CRITICAL_ACTIONS: [
    'suspicious_activity',
    'system_error',
    'data_validation_failed'
  ]
};

class AuditService {
  private static instance: AuditService;
  private auditQueue: AuditEvent[] = [];
  private isProcessing = false;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  // 📝 Enregistrer un événement d'audit
  async logEvent(
    userId: string,
    action: AuditAction,
    category: AuditCategory,
    details: Record<string, any> = {},
    userEmail?: string
  ): Promise<void> {
    try {
      const severity = this.determineSeverity(action);
      
      const auditEvent: AuditEvent = {
        userId,
        userEmail,
        action,
        category,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
        severity,
      };

      // Log immédiat pour les événements critiques
      if (severity === 'critical' || severity === 'high') {
        await this.writeAuditEvent(auditEvent);
        logger.warn('AuditService', `High priority event: ${action}`, { userId, details });
      } else {
        // Ajouter à la queue pour traitement par batch
        this.auditQueue.push(auditEvent);
        
        // Traiter la queue si elle devient trop grande
        if (this.auditQueue.length >= AUDIT_CONFIG.BATCH_SIZE) {
          this.processAuditQueue();
        }
      }

      logger.debug('AuditService', `Event logged: ${action}`, { userId, category, severity });
    } catch (error) {
      logger.error('AuditService', 'Error logging audit event', error);
      // Ne pas propager l'erreur pour éviter de casser l'app
    }
  }

  // 🔥 Écrire dans Firestore
  private async writeAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        userId: event.userId,
        userEmail: event.userEmail || null,
        action: event.action,
        category: event.category,
        details: event.details,
        timestamp: serverTimestamp(),
        severity: event.severity,
      });
    } catch (error) {
      logger.error('AuditService', 'Error writing audit event to Firestore', error);
      throw error;
    }
  }

  // 📦 Traiter la queue d'audit par batch
  private async processAuditQueue(): Promise<void> {
    if (this.isProcessing || this.auditQueue.length === 0) return;

    this.isProcessing = true;
    const eventsToProcess = [...this.auditQueue];
    this.auditQueue = [];

    try {
      // Traiter en parallèle avec limite
      const chunks = this.chunkArray(eventsToProcess, 10);
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(event => this.writeAuditEvent(event))
        );
      }

      logger.debug('AuditService', `Processed ${eventsToProcess.length} audit events`);
    } catch (error) {
      logger.error('AuditService', 'Error processing audit queue', error);
      // Remettre les événements en queue en cas d'erreur
      this.auditQueue.unshift(...eventsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  // 🎯 Déterminer la sévérité d'un événement
  private determineSeverity(action: AuditAction): 'low' | 'medium' | 'high' | 'critical' {
    if (AUDIT_CONFIG.CRITICAL_ACTIONS.includes(action)) {
      return 'critical';
    }
    if (AUDIT_CONFIG.HIGH_PRIORITY_ACTIONS.includes(action)) {
      return 'high';
    }
    if (['user_login', 'user_logout', 'user_register', 'conversation_created'].includes(action)) {
      return 'medium';
    }
    return 'low';
  }

  // 🔍 Rechercher des événements d'audit (pour les admins)
  async searchEvents(
    userId?: string,
    action?: AuditAction,
    category?: AuditCategory,
    startDate?: Date,
    endDate?: Date,
    limitCount: number = 100
  ): Promise<AuditEvent[]> {
    try {
      let auditQuery = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Ajouter des filtres si spécifiés
      if (userId) {
        auditQuery = query(auditQuery, where('userId', '==', userId));
      }
      if (action) {
        auditQuery = query(auditQuery, where('action', '==', action));
      }
      if (category) {
        auditQuery = query(auditQuery, where('category', '==', category));
      }

      const snapshot = await getDocs(auditQuery);
      const events: AuditEvent[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          category: data.category,
          details: data.details,
          timestamp: data.timestamp?.toDate() || new Date(),
          severity: data.severity,
        });
      });

      return events;
    } catch (error) {
      logger.error('AuditService', 'Error searching audit events', error);
      return [];
    }
  }

  // 📊 Obtenir des statistiques d'audit
  async getAuditStats(userId?: string): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentActivity: AuditEvent[];
  }> {
    try {
      const events = await this.searchEvents(userId, undefined, undefined, undefined, undefined, 1000);
      
      const stats = {
        totalEvents: events.length,
        eventsByCategory: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        recentActivity: events.slice(0, 10),
      };

      events.forEach(event => {
        // Compter par catégorie
        stats.eventsByCategory[event.category] = 
          (stats.eventsByCategory[event.category] || 0) + 1;
        
        // Compter par sévérité
        stats.eventsBySeverity[event.severity] = 
          (stats.eventsBySeverity[event.severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('AuditService', 'Error getting audit stats', error);
      return {
        totalEvents: 0,
        eventsByCategory: {},
        eventsBySeverity: {},
        recentActivity: [],
      };
    }
  }

  // 🚨 Détecter des activités suspectes
  async detectSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      const recentEvents = await this.searchEvents(
        userId, 
        undefined, 
        undefined, 
        new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
      );

      // Règles de détection
      const messageCount = recentEvents.filter(e => e.action === 'message_sent').length;
      const loginAttempts = recentEvents.filter(e => e.action === 'user_login').length;
      const rateLimitEvents = recentEvents.filter(e => e.action === 'rate_limit_exceeded').length;

      // Seuils de suspicion
      const isSuspicious = 
        messageCount > 100 ||  // Plus de 100 messages par heure
        loginAttempts > 10 ||  // Plus de 10 tentatives de connexion
        rateLimitEvents > 5;   // Plus de 5 dépassements de limite

      if (isSuspicious) {
        await this.logEvent(
          userId,
          'suspicious_activity',
          'security',
          {
            messageCount,
            loginAttempts,
            rateLimitEvents,
            detectionTime: new Date().toISOString(),
          }
        );
      }

      return isSuspicious;
    } catch (error) {
      logger.error('AuditService', 'Error detecting suspicious activity', error);
      return false;
    }
  }

  // 🧹 Nettoyer les anciens logs
  async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - AUDIT_CONFIG.MAX_RETENTION_DAYS);

      // Note: En production, ceci devrait être fait via une Cloud Function
      // car les règles Firestore empêchent la suppression côté client
      logger.info('AuditService', `Cleanup needed for logs older than ${cutoffDate}`);
    } catch (error) {
      logger.error('AuditService', 'Error cleaning up old logs', error);
    }
  }

  // 🛠️ Utilitaires
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 💾 Forcer le traitement de la queue (pour cleanup ou tests)
  async flushQueue(): Promise<void> {
    await this.processAuditQueue();
  }

  // 📊 Obtenir des métriques du service
  getServiceMetrics() {
    return {
      queueSize: this.auditQueue.length,
      isProcessing: this.isProcessing,
      configuredBatchSize: AUDIT_CONFIG.BATCH_SIZE,
      retentionDays: AUDIT_CONFIG.MAX_RETENTION_DAYS,
    };
  }
}

export default AuditService.getInstance(); 