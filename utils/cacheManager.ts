// Service centralisé pour cache et retry logic
import logger from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  accessCount: number;
  lastAccess: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  exponential: boolean;
  jitter: boolean;
}

class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private defaultTTL = 30 * 60 * 1000; // 30 minutes
  private maxCacheSize = 1000;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Créer ou obtenir un cache nommé
  getCache(name: string): Map<string, CacheEntry<any>> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
      logger.debug('CacheManager', `Cache créé [${name}]`);
    }
    return this.caches.get(name)!;
  }

  // Récupérer une valeur avec gestion TTL
  get<T>(cacheName: string, key: string, ttl?: number): T | null {
    const cache = this.getCache(cacheName);
    const entry = cache.get(key);

    if (!entry) {
      logger.cache('miss', `${cacheName}:${key}`);
      return null;
    }

    const now = Date.now();
    const maxAge = ttl || this.defaultTTL;

    if (now - entry.timestamp > maxAge) {
      cache.delete(key);
      logger.cache('miss', `${cacheName}:${key}`, { reason: 'expired' });
      return null;
    }

    // Mettre à jour les stats d'accès
    entry.accessCount++;
    entry.lastAccess = now;

    logger.cache('hit', `${cacheName}:${key}`, { 
      age: now - entry.timestamp,
      accessCount: entry.accessCount 
    });

    return entry.data;
  }

  // Stocker une valeur
  set<T>(cacheName: string, key: string, data: T, version: string = '1.0'): void {
    const cache = this.getCache(cacheName);
    const now = Date.now();

    // Vérifier la taille du cache
    if (cache.size >= this.maxCacheSize) {
      this.evictLRU(cache);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      version,
      accessCount: 0,
      lastAccess: now,
    };

    cache.set(key, entry);
    logger.cache('set', `${cacheName}:${key}`, { 
      version,
      cacheSize: cache.size 
    });
  }

  // Récupérer avec fallback et retry
  async getWithFallback<T>(
    cacheName: string,
    key: string,
    fetcher: () => Promise<T>,
    fallback: T,
    options: {
      ttl?: number;
      version?: string;
      retryConfig?: Partial<RetryConfig>;
    } = {}
  ): Promise<T> {
    // Essayer le cache d'abord
    const cached = this.get<T>(cacheName, key, options.ttl);
    if (cached !== null) {
      return cached;
    }

    // Configuration retry par défaut
    const retryConfig: RetryConfig = {
      maxRetries: 2,
      baseDelay: 1000,
      exponential: true,
      jitter: true,
      ...options.retryConfig,
    };

    // Tenter de récupérer avec retry
    const result = await this.executeWithRetry(
      `${cacheName}:${key}`,
      fetcher,
      retryConfig
    );

    if (result !== null) {
      this.set(cacheName, key, result, options.version);
      return result;
    }

    // Retourner le fallback
    logger.warn('CacheManager', `Using fallback for ${cacheName}:${key}`);
    return fallback;
  }

  // Exécuter une fonction avec retry logic
  private async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    config: RetryConfig
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await fn();
        const duration = Date.now() - startTime;
        
        logger.performance(`Fetch ${operation}`, duration, { 
          attempt: attempt + 1,
          success: true 
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < config.maxRetries) {
          const delay = this.calculateDelay(attempt, config);
          logger.warn('CacheManager', `Retry ${attempt + 1}/${config.maxRetries} for ${operation} in ${delay}ms`, error);
          
          await this.sleep(delay);
        } else {
          logger.error('CacheManager', `Failed after ${config.maxRetries + 1} attempts: ${operation}`, error);
        }
      }
    }

    return null;
  }

  // Calculer le délai de retry
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay;

    if (config.exponential) {
      delay *= Math.pow(2, attempt);
    }

    if (config.jitter) {
      // Ajouter jusqu'à 20% de variation aléatoire
      const jitter = delay * 0.2 * Math.random();
      delay += jitter;
    }

    return Math.min(delay, 30000); // Max 30 secondes
  }

  // Helper pour sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Éviction LRU (Least Recently Used)
  private evictLRU(cache: Map<string, CacheEntry<any>>): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
      logger.debug('CacheManager', `Evicted LRU entry: ${oldestKey}`);
    }
  }

  // Invalider un cache entier
  invalidateCache(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      const size = cache.size;
      cache.clear();
      logger.cache('clear', cacheName, { itemsCleared: size });
    }
  }

  // Invalider une clé spécifique
  invalidateKey(cacheName: string, key: string): boolean {
    const cache = this.getCache(cacheName);
    const existed = cache.delete(key);
    
    if (existed) {
      logger.cache('clear', `${cacheName}:${key}`);
    }
    
    return existed;
  }

  // Obtenir des statistiques
  getStats() {
    const stats = {
      totalCaches: this.caches.size,
      caches: {} as Record<string, {
        size: number;
        totalAccess: number;
        avgAccessPerItem: number;
      }>,
    };

    for (const [name, cache] of this.caches) {
      let totalAccess = 0;
      
      for (const entry of cache.values()) {
        totalAccess += entry.accessCount;
      }

      stats.caches[name] = {
        size: cache.size,
        totalAccess,
        avgAccessPerItem: cache.size > 0 ? totalAccess / cache.size : 0,
      };
    }

    return stats;
  }

  // Nettoyage automatique des entrées expirées
  cleanup(): void {
    let totalCleaned = 0;
    const now = Date.now();

    for (const [cacheName, cache] of this.caches) {
      const toDelete: string[] = [];

      for (const [key, entry] of cache) {
        if (now - entry.timestamp > this.defaultTTL * 2) {
          toDelete.push(key);
        }
      }

      toDelete.forEach(key => cache.delete(key));
      totalCleaned += toDelete.length;

      if (toDelete.length > 0) {
        logger.debug('CacheManager', `Cleaned ${toDelete.length} expired entries from ${cacheName}`);
      }
    }

    if (totalCleaned > 0) {
      logger.info('CacheManager', `Auto-cleanup: removed ${totalCleaned} expired entries`);
    }
  }

  // Vider tous les caches
  clearAll(): void {
    let totalItems = 0;
    
    for (const cache of this.caches.values()) {
      totalItems += cache.size;
      cache.clear();
    }

    logger.info('CacheManager', `Cleared all caches (${totalItems} items)`);
  }
}

// Instance singleton
const cacheManager = CacheManager.getInstance();

// Auto-nettoyage toutes les 15 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 15 * 60 * 1000);

export default cacheManager; 