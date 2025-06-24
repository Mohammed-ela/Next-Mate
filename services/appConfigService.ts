import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// 🎮 Types pour la configuration de l'app
export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  platform: string;
  isActive: boolean;
  priority: number; // Pour l'ordre d'affichage
}

export interface GameRanks {
  gameName: string;
  ranks: string[];
}

export interface AppConfig {
  games: GameConfig[];
  timeSlots: string[];
  gameRanks: Record<string, string[]>;
  gameStyles: string[];
}

// Types optimisés
export interface GameRank {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface GameStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  isPopular: boolean;
  category: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isPopular: boolean;
}

// Configuration optimisée du cache - PERFORMANCE AMÉLIORÉE
const CACHE_CONFIG = {
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes (au lieu de 5)
  MAX_RETRIES: 2, // Réduit de 3 à 2
  RETRY_DELAY: 2000, // 2 secondes (au lieu de 1)
  BATCH_SIZE: 50, // Taille des batches pour les requêtes
  PRELOAD_DELAY: 5000, // 5 secondes (au lieu de 2)
};

// Cache intelligent avec métadonnées
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  retryCount: number;
}

class AppConfigCache {
  private cache = new Map<string, CacheEntry<any>>();
  private loadingPromises = new Map<string, Promise<any>>();
  private version = '1.2.0'; // Version du cache pour invalidation

  // 🚀 Méthode générique pour récupérer avec cache
  async getWithCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    fallback: T,
    maxAge: number = CACHE_CONFIG.CACHE_DURATION
  ): Promise<T> {
    // Vérifier le cache
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && 
        (now - cached.timestamp) < maxAge && 
        cached.version === this.version) {
      console.log(`📦 Cache hit pour ${key}`);
      return cached.data;
    }

    // Éviter les requêtes multiples simultanées
    if (this.loadingPromises.has(key)) {
      console.log(`⏳ Attente requête en cours pour ${key}`);
      return this.loadingPromises.get(key)!;
    }

    // Nouvelle requête avec retry
    const loadingPromise = this.fetchWithRetry(key, fetcher, fallback);
    this.loadingPromises.set(key, loadingPromise);

    try {
      const data = await loadingPromise;
      
      // Mettre en cache
      this.cache.set(key, {
        data,
        timestamp: now,
        version: this.version,
        retryCount: 0
      });
      
      console.log(`✅ Cache mis à jour pour ${key}`);
      return data;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  // 🔄 Récupération avec retry automatique
  private async fetchWithRetry<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    fallback: T,
    retryCount = 0
  ): Promise<T> {
    try {
      return await fetcher();
    } catch (error) {
      console.warn(`⚠️ Erreur fetch ${key} (tentative ${retryCount + 1}):`, error);
      
      if (retryCount < CACHE_CONFIG.MAX_RETRIES) {
        // Délai exponentiel
        const delay = CACHE_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(key, fetcher, fallback, retryCount + 1);
      }
      
      // Utiliser le cache expiré si disponible
      const cached = this.cache.get(key);
      if (cached) {
        console.log(`🔄 Utilisation cache expiré pour ${key}`);
        return cached.data;
      }
      
      console.error(`❌ Échec final pour ${key}, utilisation fallback`);
      return fallback;
    }
  }

  // 🧹 Nettoyage du cache
  cleanup(): void {
    const now = Date.now();
    const maxAge = CACHE_CONFIG.CACHE_DURATION * 2; // Double durée pour nettoyage
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        console.log(`🗑️ Cache nettoyé pour ${key}`);
      }
    }
  }

  // 📊 Statistiques du cache
  getStats() {
    return {
      size: this.cache.size,
      loadingPromises: this.loadingPromises.size,
      version: this.version,
      entries: Array.from(this.cache.keys())
    };
  }

  // 🔄 Invalidation forcée
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🔄 Cache invalidé pour ${key}`);
    } else {
      this.cache.clear();
      console.log('🔄 Cache entièrement invalidé');
    }
  }
}

// Instance globale du cache
const cache = new AppConfigCache();

// Nettoyage automatique du cache
setInterval(() => {
  cache.cleanup();
}, CACHE_CONFIG.CACHE_DURATION);

// 🎮 Service principal optimisé
export class AppConfigService {
  private cache: AppConfig | null = null;
  private lastFetch: number = 0;

  // 🔄 Récupérer la configuration complète
  async getConfig(): Promise<AppConfig> {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (this.cache && (now - this.lastFetch) < CACHE_CONFIG.CACHE_DURATION) {
      return this.cache;
    }

    try {
      console.log('🔄 Récupération configuration Firebase...');
      
      const config: AppConfig = {
        games: await this.getGames(),
        timeSlots: await this.getTimeSlots(),
        gameRanks: await this.getGameRanks(),
        gameStyles: await this.getGameStyles(),
      };

      this.cache = config;
      this.lastFetch = now;
      
      console.log('✅ Configuration chargée depuis Firebase');
      return config;
      
    } catch (error) {
      console.error('❌ Erreur chargement config Firebase:', error);
      
      // Retourner la config par défaut si erreur
      return this.getDefaultConfig();
    }
  }

  // 🎮 Récupérer les jeux
  private async getGames(): Promise<GameConfig[]> {
    try {
      const gamesSnapshot = await getDocs(collection(db, 'app_config', 'games', 'list'));
      const games: GameConfig[] = [];
      
      gamesSnapshot.forEach(doc => {
        games.push({ id: doc.id, ...doc.data() } as GameConfig);
      });
      
      // Trier par priorité
      return games.sort((a, b) => a.priority - b.priority);
      
    } catch (error) {
      console.error('❌ Erreur récupération jeux:', error);
      return this.getDefaultGames();
    }
  }

  // ⏰ Récupérer les créneaux horaires
  private async getTimeSlots(): Promise<string[]> {
    try {
      const doc = await this.getConfigDoc('time_slots');
      return doc?.slots || this.getDefaultTimeSlots();
    } catch (error) {
      console.error('❌ Erreur récupération créneaux:', error);
      return this.getDefaultTimeSlots();
    }
  }

  // 🏆 Récupérer les rangs par jeu
  private async getGameRanks(): Promise<Record<string, string[]>> {
    try {
      const doc = await this.getConfigDoc('game_ranks');
      return doc?.ranks || this.getDefaultRanks();
    } catch (error) {
      console.error('❌ Erreur récupération rangs:', error);
      return this.getDefaultRanks();
    }
  }

  // 🎯 Récupérer les styles de jeu
  private async getGameStyles(): Promise<string[]> {
    try {
      const doc = await this.getConfigDoc('game_styles');
      return doc?.styles || this.getDefaultGameStyles();
    } catch (error) {
      console.error('❌ Erreur récupération styles:', error);
      return this.getDefaultGameStyles();
    }
  }

  // 📄 Récupérer un document de config
  private async getConfigDoc(docName: string): Promise<any> {
    try {
      const docRef = doc(db, 'app_config', docName);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        return docSnapshot.data();
      }
      return null;
    } catch (error) {
      console.error(`❌ Erreur récupération ${docName}:`, error);
      return null;
    }
  }

  // 🔄 Vider le cache (pour forcer le rechargement)
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // 📊 Méthodes pour les valeurs par défaut (fallback)
  private getDefaultConfig(): AppConfig {
    return {
      games: this.getDefaultGames(),
      timeSlots: this.getDefaultTimeSlots(),
      gameRanks: this.getDefaultRanks(),
      gameStyles: this.getDefaultGameStyles(),
    };
  }

  private getDefaultGames(): GameConfig[] {
    return [
      { id: '1', name: 'Valorant', icon: '🎯', platform: 'PC', isActive: true, priority: 1 },
      { id: '2', name: 'League of Legends', icon: '⚔️', platform: 'PC', isActive: true, priority: 2 },
      { id: '3', name: 'FIFA 24', icon: '⚽', platform: 'PS5', isActive: true, priority: 3 },
      { id: '4', name: 'Apex Legends', icon: '🔫', platform: 'PC', isActive: true, priority: 4 },
      { id: '5', name: 'Fortnite', icon: '🏗️', platform: 'PC', isActive: true, priority: 5 },
      { id: '6', name: 'CS2', icon: '💥', platform: 'PC', isActive: true, priority: 6 },
    ];
  }

  private getDefaultTimeSlots(): string[] {
    return ['9h-12h', '12h-15h', '15h-18h', '18h-21h', '21h-24h', '24h-3h'];
  }

  private getDefaultRanks(): Record<string, string[]> {
    return {
      'Valorant': ['Fer', 'Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Ascendant', 'Immortel', 'Radiant'],
      'League of Legends': ['Fer', 'Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Maître', 'Grandmaître', 'Challenger'],
      'CS2': ['Argent', 'Or Nova', 'Maître Guardian', 'Aigle', 'Suprême', 'Global Elite'],
      'FIFA 24': ['Div 10', 'Div 9', 'Div 8', 'Div 7', 'Div 6', 'Div 5', 'Div 4', 'Div 3', 'Div 2', 'Div 1', 'Elite'],
      'Apex Legends': ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Maître', 'Prédateur'],
      'Fortnite': ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Elite', 'Champion', 'Non Classé'],
      'Default': ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert']
    };
  }

  private getDefaultGameStyles(): string[] {
    return ['Chill', 'Tryhard', 'Competitive', 'Fun', 'Improve'];
  }

  // 🔧 Méthodes d'administration (pour initialiser les données)
  async initializeAppConfig(): Promise<void> {
    console.log('🔄 Initialisation configuration Firebase...');
    
    try {
      // Créer les jeux
      const games = this.getDefaultGames();
      for (const game of games) {
        await setDoc(doc(db, 'app_config/data/games', game.id), {
          name: game.name,
          icon: game.icon,
          platform: game.platform,
          isActive: game.isActive,
          priority: game.priority,
          createdAt: new Date(),
        });
      }

      // Créer les créneaux horaires
      await setDoc(doc(db, 'app_config/data/time_slots', 'default'), {
        slots: this.getDefaultTimeSlots(),
        updatedAt: new Date(),
      });

      // Créer les rangs
      await setDoc(doc(db, 'app_config/data/game_ranks', 'default'), {
        ranks: this.getDefaultRanks(),
        updatedAt: new Date(),
      });

      // Créer les styles
      await setDoc(doc(db, 'app_config/data/game_styles', 'default'), {
        styles: this.getDefaultGameStyles(),
        updatedAt: new Date(),
      });

      console.log('✅ Configuration Firebase initialisée');
      this.clearCache(); // Vider le cache pour recharger

    } catch (error) {
      console.error('❌ Erreur initialisation config:', error);
      throw error;
    }
  }

  // 🎯 Récupérer tous les jeux avec cache intelligent
  static async getGames(): Promise<Game[]> {
    const fallbackGames: Game[] = [
      { id: 'valorant', name: 'Valorant', icon: '🎯', color: '#FF4654', isPopular: true, category: 'FPS' },
      { id: 'lol', name: 'League of Legends', icon: '⚔️', color: '#C8AA6E', isPopular: true, category: 'MOBA' },
      { id: 'fifa24', name: 'FC 24', icon: '⚽', color: '#00D4AA', isPopular: true, category: 'Sport' },
      { id: 'apex', name: 'Apex Legends', icon: '🎮', color: '#FF6600', isPopular: true, category: 'Battle Royale' },
      { id: 'fortnite', name: 'Fortnite', icon: '🏗️', color: '#00D4FF', isPopular: true, category: 'Battle Royale' },
      { id: 'cs2', name: 'Counter-Strike 2', icon: '🔫', color: '#F0B90B', isPopular: true, category: 'FPS' }
    ];

    return cache.getWithCache(
      'games',
      async () => {
        const gamesCollection = collection(db, 'app_config', 'games', 'list');
        const snapshot = await getDocs(gamesCollection);
        
        if (snapshot.empty) {
          throw new Error('Aucun jeu trouvé');
        }

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Game)).sort((a, b) => a.name.localeCompare(b.name));
      },
      fallbackGames
    );
  }

  // 🏆 Récupérer les rangs par jeu avec cache
  static async getGameRanks(): Promise<{ [gameId: string]: GameRank[] }> {
    const fallbackRanks = {
      'Valorant': [
        { id: 'iron', name: 'Fer', color: '#8B4513', order: 1 },
        { id: 'bronze', name: 'Bronze', color: '#CD7F32', order: 2 },
        { id: 'silver', name: 'Argent', color: '#C0C0C0', order: 3 },
        { id: 'gold', name: 'Or', color: '#FFD700', order: 4 },
        { id: 'platinum', name: 'Platine', color: '#E5E4E2', order: 5 },
        { id: 'diamond', name: 'Diamant', color: '#B9F2FF', order: 6 },
        { id: 'immortal', name: 'Immortel', color: '#FF4654', order: 7 },
        { id: 'radiant', name: 'Radiant', color: '#FFFF99', order: 8 }
      ],
      'League of Legends': [
        { id: 'iron', name: 'Fer', color: '#8B4513', order: 1 },
        { id: 'bronze', name: 'Bronze', color: '#CD7F32', order: 2 },
        { id: 'silver', name: 'Argent', color: '#C0C0C0', order: 3 },
        { id: 'gold', name: 'Or', color: '#FFD700', order: 4 },
        { id: 'platinum', name: 'Platine', color: '#E5E4E2', order: 5 },
        { id: 'diamond', name: 'Diamant', color: '#B9F2FF', order: 6 },
        { id: 'master', name: 'Maître', color: '#9932CC', order: 7 },
        { id: 'grandmaster', name: 'Grand Maître', color: '#FF4500', order: 8 },
        { id: 'challenger', name: 'Challenger', color: '#FFD700', order: 9 }
      ],
      'Default': [
        { id: 'beginner', name: 'Débutant', color: '#8B4513', order: 1 },
        { id: 'novice', name: 'Novice', color: '#CD7F32', order: 2 },
        { id: 'intermediate', name: 'Intermédiaire', color: '#C0C0C0', order: 3 },
        { id: 'advanced', name: 'Avancé', color: '#FFD700', order: 4 },
        { id: 'expert', name: 'Expert', color: '#E5E4E2', order: 5 }
      ]
    };

    return cache.getWithCache(
      'gameRanks',
      async () => {
        try {
          console.log('🎯 Récupération rangs depuis Firebase...');
          const ranksDoc = doc(db, 'app_config', 'game_ranks');
          const snapshot = await getDoc(ranksDoc);
          
          if (!snapshot.exists()) {
            console.warn('⚠️ Document game_ranks non trouvé, utilisation fallback');
            return fallbackRanks;
          }

          const data = snapshot.data();
          console.log('📊 Données rangs récupérées:', data);
          
          // Traiter les données - structure: { ranks: { "Valorant": ["Fer", "Bronze", ...], ... } }
          if (data.ranks) {
            const processedRanks: { [gameId: string]: GameRank[] } = {};
            
            for (const [gameName, ranks] of Object.entries(data.ranks)) {
              if (Array.isArray(ranks)) {
                processedRanks[gameName] = (ranks as string[]).map((rank, index) => ({
                  id: `${gameName.toLowerCase()}_${rank.toLowerCase()}`,
                  name: rank,
                  color: '#FF8E53',
                  order: index
                }));
              }
            }
            
            console.log('✅ Rangs traités:', Object.keys(processedRanks));
            return processedRanks;
          }
          
          console.warn('⚠️ Structure rangs inattendue, utilisation fallback');
          return fallbackRanks;
          
        } catch (error) {
          console.error('❌ Erreur récupération rangs:', error);
          return fallbackRanks;
        }
      },
      fallbackRanks
    );
  }

  // 🎨 Récupérer les styles de jeu avec cache
  static async getGameStyles(): Promise<GameStyle[]> {
    const fallbackStyles: GameStyle[] = [
      { id: 'chill', name: 'Chill', description: 'Détendu et fun', icon: '😎', color: '#4CAF50' },
      { id: 'tryhard', name: 'Tryhard', description: 'Compétitif et sérieux', icon: '🔥', color: '#FF5722' },
      { id: 'competitive', name: 'Competitive', description: 'Esprit compétitif', icon: '🏆', color: '#FF8E53' },
      { id: 'fun', name: 'Fun', description: 'Pour le plaisir', icon: '🎉', color: '#2196F3' },
      { id: 'improve', name: 'Improve', description: 'Amélioration continue', icon: '📈', color: '#9C27B0' }
    ];

    return cache.getWithCache(
      'gameStyles',
      async () => {
        try {
          console.log('🎨 Récupération styles depuis Firebase...');
          const stylesDoc = doc(db, 'app_config', 'game_styles');
          const snapshot = await getDoc(stylesDoc);
          
          if (!snapshot.exists()) {
            console.warn('⚠️ Document game_styles non trouvé, utilisation fallback');
            return fallbackStyles;
          }

          const data = snapshot.data();
          console.log('📊 Données styles récupérées:', data);
          
          // Traiter les données - structure: { styles: ["Chill", "Tryhard", ...] }
          if (data.styles && Array.isArray(data.styles)) {
            const processedStyles: GameStyle[] = data.styles.map((styleName: string, index: number) => ({
              id: styleName.toLowerCase(),
              name: styleName,
              description: `Style de jeu: ${styleName}`,
              icon: '🎮',
              color: '#FF8E53'
            }));
            
            console.log('✅ Styles traités:', processedStyles.map(s => s.name));
            return processedStyles;
          }
          
          console.warn('⚠️ Structure styles inattendue, utilisation fallback');
          return fallbackStyles;
          
        } catch (error) {
          console.error('❌ Erreur récupération styles:', error);
          return fallbackStyles;
        }
      },
      fallbackStyles
    );
  }

  // ⏰ Récupérer les créneaux horaires avec cache
  static async getTimeSlots(): Promise<TimeSlot[]> {
    const fallbackSlots: TimeSlot[] = [
      { id: 'morning', label: '9h-12h', startTime: '09:00', endTime: '12:00', isPopular: false },
      { id: 'afternoon', label: '12h-15h', startTime: '12:00', endTime: '15:00', isPopular: true },
      { id: 'evening', label: '15h-18h', startTime: '15:00', endTime: '18:00', isPopular: true },
      { id: 'night', label: '18h-21h', startTime: '18:00', endTime: '21:00', isPopular: true },
      { id: 'late_night', label: '21h-24h', startTime: '21:00', endTime: '24:00', isPopular: false },
      { id: 'very_late', label: '24h-3h', startTime: '00:00', endTime: '03:00', isPopular: false }
    ];

    return cache.getWithCache(
      'timeSlots',
      async () => {
        const slotsDoc = doc(db, 'app_config', 'time_slots');
        const snapshot = await getDoc(slotsDoc);
        
        if (!snapshot.exists()) {
          throw new Error('Créneaux non trouvés');
        }

        const data = snapshot.data();
        const slots = data.slots || [];
        
        // Convertir les slots Firebase (strings) en objets TimeSlot
        return slots.map((slot: string, index: number) => ({
          id: `slot_${index}`,
          label: slot,
          startTime: slot.split('-')[0] || '00:00',
          endTime: slot.split('-')[1] || '23:59',
          isPopular: ['12h-15h', '15h-18h', '18h-21h'].includes(slot)
        } as TimeSlot));
      },
      fallbackSlots
    );
  }

  // 🚀 Récupérer toute la configuration avec optimisation parallèle
  static async getFullConfig(): Promise<AppConfig> {
    console.log('🚀 Chargement configuration complète...');
    
    try {
      // Chargement parallèle optimisé avec cache intelligent
      const [games, gameRanks, gameStyles, timeSlots] = await Promise.all([
        this.getGames(),
        this.getGameRanks(),
        this.getGameStyles(),
        this.getTimeSlots()
      ]);

      const config: AppConfig = {
        games: games.map(game => ({
          id: game.id,
          name: game.name,
          icon: game.icon,
          platform: game.category,
          isActive: true,
          priority: game.isPopular ? 1 : 5
        })),
        timeSlots: timeSlots.map(slot => slot.label),
        gameRanks: Object.fromEntries(
          Object.entries(gameRanks).map(([gameId, ranks]) => [
            gameId,
            Array.isArray(ranks) ? ranks.map(rank => rank.name) : []
          ])
        ),
        gameStyles: gameStyles.map(style => style.name)
      };

      console.log('✅ Configuration complète chargée (optimisée):', {
        games: games.length,
        gameRanks: Object.keys(gameRanks).length,
        gameStyles: gameStyles.length,
        timeSlots: timeSlots.length,
        cacheStats: cache.getStats()
      });

      return config;
    } catch (error) {
      console.error('❌ Erreur chargement configuration:', error);
      throw error;
    }
  }

  // 🔄 Préchargement intelligent
  static async preloadConfig(): Promise<void> {
    console.log('🔄 Préchargement de la configuration...');
    
    // Délai pour éviter d'impacter le démarrage
    setTimeout(async () => {
      try {
        await this.getFullConfig();
        console.log('✅ Préchargement terminé');
      } catch (error) {
        console.warn('⚠️ Erreur préchargement (non bloquant):', error);
      }
    }, CACHE_CONFIG.PRELOAD_DELAY);
  }

  // 📊 Statistiques et debug
  static getCacheStats() {
    return cache.getStats();
  }

  // 🔄 Invalidation du cache
  static invalidateCache(key?: string): void {
    cache.invalidate(key);
  }

  // 🧪 Mode développement - rechargement forcé
  static async reloadConfig(): Promise<AppConfig> {
    console.log('🧪 Rechargement forcé de la configuration...');
    this.invalidateCache();
    return this.getFullConfig();
  }
}

// Export par défaut
export default AppConfigService;