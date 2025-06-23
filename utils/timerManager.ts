// Gestionnaire centralisé des timers pour éviter les fuites mémoire
import logger from './logger';

interface TimerInfo {
  id: string;
  type: 'timeout' | 'interval';
  handler: number;
  callback: () => void;
  delay: number;
  created: Date;
  category: string;
}

class TimerManager {
  private static instance: TimerManager;
  private timers: Map<string, TimerInfo> = new Map();
  private cleanupInterval: number | null = null;

  private constructor() {
    // Auto-nettoyage toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000) as any;
  }

  static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  // Créer un timeout avec tracking
  setTimeout(callback: () => void, delay: number, category: string = 'default'): string {
    const id = `timeout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = setTimeout(() => {
      callback();
      this.timers.delete(id);
      logger.debug('TimerManager', `Timeout completed [${id}]`);
    }, delay) as any;

    const timerInfo: TimerInfo = {
      id,
      type: 'timeout',
      handler,
      callback,
      delay,
      created: new Date(),
      category,
    };

    this.timers.set(id, timerInfo);
    logger.debug('TimerManager', `Timeout created [${id}] (${delay}ms)`, { category });

    return id;
  }

  // Créer un interval avec tracking
  setInterval(callback: () => void, delay: number, category: string = 'default'): string {
    const id = `interval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler = setInterval(callback, delay) as any;

    const timerInfo: TimerInfo = {
      id,
      type: 'interval',
      handler,
      callback,
      delay,
      created: new Date(),
      category,
    };

    this.timers.set(id, timerInfo);
    logger.debug('TimerManager', `Interval created [${id}] (${delay}ms)`, { category });

    return id;
  }

  // Nettoyer un timer spécifique
  clear(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      logger.warn('TimerManager', `Timer not found for clearing [${id}]`);
      return false;
    }

    if (timer.type === 'timeout') {
      clearTimeout(timer.handler);
    } else {
      clearInterval(timer.handler);
    }

    this.timers.delete(id);
    logger.debug('TimerManager', `Timer cleared [${id}]`, { type: timer.type });
    return true;
  }

  // Nettoyer tous les timers d'une catégorie
  clearCategory(category: string): number {
    let cleared = 0;
    const toDelete: string[] = [];

    for (const [id, timer] of this.timers) {
      if (timer.category === category) {
        if (timer.type === 'timeout') {
          clearTimeout(timer.handler);
        } else {
          clearInterval(timer.handler);
        }
        toDelete.push(id);
        cleared++;
      }
    }

    toDelete.forEach(id => this.timers.delete(id));
    
    if (cleared > 0) {
      logger.info('TimerManager', `Cleared ${cleared} timers from category [${category}]`);
    }

    return cleared;
  }

  // Nettoyer tous les timers
  clearAll(): number {
    const count = this.timers.size;
    
    for (const timer of this.timers.values()) {
      if (timer.type === 'timeout') {
        clearTimeout(timer.handler);
      } else {
        clearInterval(timer.handler);
      }
    }

    this.timers.clear();
    
    if (count > 0) {
      logger.info('TimerManager', `Cleared all ${count} timers`);
    }

    return count;
  }

  // Obtenir des statistiques
  getStats() {
    const stats = {
      total: this.timers.size,
      byType: { timeout: 0, interval: 0 },
      byCategory: {} as Record<string, number>,
      oldestTimer: null as Date | null,
    };

    for (const timer of this.timers.values()) {
      stats.byType[timer.type]++;
      stats.byCategory[timer.category] = (stats.byCategory[timer.category] || 0) + 1;
      
      if (!stats.oldestTimer || timer.created < stats.oldestTimer) {
        stats.oldestTimer = timer.created;
      }
    }

    return stats;
  }

  // Nettoyage automatique des timers orphelins
  private performCleanup() {
    const now = new Date();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;

    const toDelete: string[] = [];

    for (const [id, timer] of this.timers) {
      const age = now.getTime() - timer.created.getTime();
      
      // Supprimer les timeouts qui auraient dû être exécutés depuis longtemps
      if (timer.type === 'timeout' && age > timer.delay + maxAge) {
        clearTimeout(timer.handler);
        toDelete.push(id);
        cleaned++;
      }
    }

    toDelete.forEach(id => this.timers.delete(id));

    if (cleaned > 0) {
      logger.info('TimerManager', `Auto-cleanup: removed ${cleaned} stale timers`);
    }
  }

  // Détruire le manager (pour tests ou shutdown)
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
    logger.info('TimerManager', 'TimerManager destroyed');
  }
}

// Instance singleton
const timerManager = TimerManager.getInstance();

// Exports convenances
export const createTimeout = (callback: () => void, delay: number, category?: string) => 
  timerManager.setTimeout(callback, delay, category);

export const createInterval = (callback: () => void, delay: number, category?: string) => 
  timerManager.setInterval(callback, delay, category);

export const clearTimer = (id: string) => timerManager.clear(id);

export const clearTimerCategory = (category: string) => timerManager.clearCategory(category);

export const getTimerStats = () => timerManager.getStats();

export default timerManager; 