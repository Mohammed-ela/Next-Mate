import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import cacheManager from '../utils/cacheManager';
import { cleanObjectForFirestore, safeTimestampToDate } from '../utils/firebaseHelpers';
import { logger } from '../utils/logger';
import AppConfigService from './appConfigService';
import { BlockingService } from './blockingService';

// Configuration optimisée - PERFORMANCE AMÉLIORÉE
const PERFORMANCE_CONFIG = {
  CACHE_DURATION: 3 * 60 * 1000, // Réduit à 3 minutes (au lieu de 15)
  BATCH_SIZE: 15, // Taille optimale des batches
  MAX_RETRIES: 1, // Réduit de 2 à 1
  RETRY_DELAY: 1000, // 1 seconde (au lieu de 500ms)
  DISCOVERY_LIMIT: 20, // Limite des utilisateurs découverte
  POPULAR_GAMES_CACHE: 10 * 60 * 1000, // 10 minutes (au lieu de 2)
  DISCOVERY_CACHE_DURATION: 2 * 60 * 1000, // Cache découverte plus court: 2 minutes
};

// Types optimisés
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  preferences: {
    favoriteGames: string[];
    preferredTimeSlots: string[];
    gameRanks: { [gameId: string]: string };
    gameStyles: string[];
    bio?: string;
    ageRange?: string;
    location?: string;
    gender?: 'Homme' | 'Femme' | 'Autre';
  };
  stats: {
    totalMatches: number;
    totalGames: number;
    joinDate: Date;
    lastActive: Date;
    rating: number;
  };
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service utilisateur optimisé avec nouveau système de cache
export class UserService {
  private static lastCacheInvalidation: number = 0;

  // 👤 Créer ou mettre à jour un profil utilisateur avec optimisations
  static async createOrUpdateProfile(
    uid: string, 
    email: string, 
    additionalData: Partial<UserProfile> = {}
  ): Promise<UserProfile> {
    try {
      logger.info('UserService', `Création/mise à jour profil: ${uid}`);

      // Vérifier si l'utilisateur existe déjà
      const existingProfile = await this.getUserProfile(uid, false); // Sans cache pour création

      const now = new Date();
      const defaultProfile: Omit<UserProfile, 'uid'> = {
        email,
        name: additionalData.name || email.split('@')[0] || 'Joueur',
        avatar: this.getRandomGamingAvatar(),
        preferences: {
          favoriteGames: [],
          preferredTimeSlots: [],
          gameRanks: {},
          gameStyles: [],
          bio: '',
          ageRange: '18-25',
          location: 'France',
          gender: 'Autre',
        },
        stats: {
          totalMatches: 0,
          totalGames: 0,
          joinDate: existingProfile?.stats.joinDate || now,
          lastActive: now,
          rating: 1000, // Rating ELO de base
        },
        isOnline: true,
        createdAt: existingProfile?.createdAt || now,
        updatedAt: now,
      };

      const profileData: UserProfile = {
        uid,
        ...defaultProfile,
        ...additionalData,
        stats: {
          ...defaultProfile.stats,
          ...additionalData.stats,
        },
        preferences: {
          ...defaultProfile.preferences,
          ...additionalData.preferences,
        },
      };

      // Nettoyer les données pour Firestore
      const cleanedData = cleanObjectForFirestore(profileData);
      
      // Sauvegarder dans Firestore
      await setDoc(doc(db, 'users', uid), cleanedData, { merge: true });
      
      // Mettre à jour le cache centralisé
      cacheManager.set('userProfiles', `profile_${uid}`, profileData);
      
      logger.firebase('createOrUpdate', 'users', 'success', { uid });
      return profileData;

    } catch (error) {
      logger.error('UserService', 'Erreur création/mise à jour profil', error);
      throw new Error('Impossible de créer ou mettre à jour le profil utilisateur');
    }
  }

  // 🔍 Récupérer profil utilisateur avec cache optimisé
  static async getUserProfile(uid: string, useCache: boolean = true): Promise<UserProfile | null> {
    try {
      // Essayer le cache d'abord si demandé
      if (useCache) {
        const cached = cacheManager.get<UserProfile>('userProfiles', `profile_${uid}`, PERFORMANCE_CONFIG.CACHE_DURATION);
        if (cached) {
          logger.cache('hit', `userProfiles:profile_${uid}`);
          return cached;
        }
      }

      logger.debug('UserService', `Récupération profil depuis Firebase: ${uid}`);

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        logger.warn('UserService', `Profil utilisateur non trouvé: ${uid}`);
        return null;
      }

      const data = docSnap.data();
      const profile: UserProfile = {
        uid,
        email: data.email || '',
        name: data.pseudo || data.name || 'Joueur',
        avatar: data.profilePicture || data.avatar || '🎮',
        preferences: {
          favoriteGames: data.games?.map((game: any) => game.name).filter(Boolean) || data.preferences?.favoriteGames || [],
          preferredTimeSlots: Array.isArray(data.availability) ? data.availability : data.availability?.flatMap((slot: any) => slot.timeSlots) || data.preferences?.preferredTimeSlots || [],
          gameRanks: data.preferences?.gameRanks || {},
          gameStyles: data.gamingStyle?.personality || data.preferences?.gameStyles || [],
          bio: data.bio || data.preferences?.bio,
          ageRange: data.age ? `${data.age}` : data.preferences?.ageRange,
          location: data.location || data.preferences?.location,
          gender: data.gender || data.preferences?.gender,
        },
        stats: {
          totalMatches: data.stats?.totalMatches || 0,
          totalGames: data.stats?.totalGames || 0,
          joinDate: safeTimestampToDate(data.stats?.joinDate) || new Date(),
          lastActive: safeTimestampToDate(data.stats?.lastActive) || new Date(),
          rating: data.stats?.rating || 1000,
        },
        isOnline: data.isOnline || false,
        createdAt: safeTimestampToDate(data.createdAt) || new Date(),
        updatedAt: safeTimestampToDate(data.updatedAt) || new Date(),
      };

      // Mettre en cache
      cacheManager.set('userProfiles', `profile_${uid}`, profile);
      
      logger.firebase('get', 'users', 'success', { uid });
      return profile;

    } catch (error) {
      logger.error('UserService', 'Erreur récupération profil', error);
      return null;
    }
  }

  // 🎯 Découverte d'utilisateurs avec matching intelligent
  static async getDiscoveryUsers(
    currentUserId: string, 
    filters: {
      favoriteGames?: string[];
      preferredTimeSlots?: string[];
      gameStyles?: string[];
      minRating?: number;
      maxRating?: number;
    } = {}
  ): Promise<UserProfile[]> {
    try {
      const startTime = Date.now();
      
      // Vérifier le cache d'abord
      const cacheKey = `discovery_${currentUserId}_${JSON.stringify(filters)}`;
      const cached = cacheManager.get<UserProfile[]>('discovery', cacheKey, PERFORMANCE_CONFIG.DISCOVERY_CACHE_DURATION);
      if (cached) {
        logger.cache('hit', `discovery:${cacheKey}`);
        return cached;
      }

      logger.info('UserService', 'Récupération utilisateurs découverte avec matching intelligent', filters);

      // 🧠 NOUVEAU: Récupérer le profil de l'utilisateur actuel pour le matching
      const currentUserProfile = await this.getUserProfile(currentUserId, false);
      if (!currentUserProfile) {
        logger.warn('UserService', 'Profil utilisateur actuel non trouvé pour matching intelligent');
        // Fallback vers l'ancienne méthode si pas de profil
        return this.getBasicDiscoveryUsers(currentUserId, filters);
      }

      // 🧠 Utiliser le matching intelligent
      try {
        // Importer le MatchingService dynamiquement pour éviter les dépendances circulaires
        const { default: MatchingService } = await import('./matchingService');
        
        // Utiliser le MatchingService pour obtenir des correspondances intelligentes
        const matches = await MatchingService.findMatches(
          currentUserId,
          currentUserProfile,
          {
            onlineOnly: false,
          },
          PERFORMANCE_CONFIG.DISCOVERY_LIMIT
        );

        // Récupérer les profils complets des utilisateurs correspondants
        const matchedUsers: UserProfile[] = [];
        for (const match of matches) {
          const userProfile = await this.getUserProfile(match.userId, true);
          if (userProfile) {
            matchedUsers.push(userProfile);
          }
        }

        // Filtrer les utilisateurs bloqués
        const finalUsers = await BlockingService.filterBlockedUsers(currentUserId, matchedUsers);
        
        // Mettre en cache
        cacheManager.set('discovery', cacheKey, finalUsers);

        const duration = Date.now() - startTime;
        logger.performance('Intelligent Discovery Load', duration, {
          matches: matches.length,
          profiles: matchedUsers.length,
          afterBlocking: finalUsers.length,
          avgScore: matches.length > 0 
            ? matches.reduce((sum, match) => sum + match.score, 0) / matches.length 
            : 0
        });

        return finalUsers;

      } catch (matchingError) {
        logger.error('UserService', 'Erreur matching intelligent, fallback vers méthode basique', matchingError);
        // En cas d'erreur avec le matching intelligent, utiliser l'ancienne méthode
        return this.getBasicDiscoveryUsers(currentUserId, filters);
      }

    } catch (error) {
      logger.error('UserService', 'Erreur récupération utilisateurs découverte', error);
      return [];
    }
  }

  // 🔄 Mise à jour préférences utilisateur
  static async updateUserPreferences(
    uid: string, 
    preferences: Partial<UserProfile['preferences']>
  ): Promise<void> {
    try {
      logger.info('UserService', `Mise à jour préférences: ${uid}`);

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        preferences: {
          ...preferences,
        },
        updatedAt: new Date(),
      });

      // Invalider TOUS les caches liés aux profils
      this.invalidateAllProfileCaches(uid);

      logger.firebase('update', 'user_preferences', 'success', { uid });
    } catch (error) {
      logger.error('UserService', 'Erreur mise à jour préférences', error);
      throw new Error('Impossible de mettre à jour les préférences utilisateur');
    }
  }

  // 📊 Mise à jour statistiques utilisateur
  static async updateUserStats(
    uid: string, 
    statsUpdate: Partial<UserProfile['stats']>
  ): Promise<void> {
    try {
      logger.debug('UserService', `Mise à jour stats: ${uid}`);

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        [`stats.${Object.keys(statsUpdate)[0]}`]: Object.values(statsUpdate)[0],
        'stats.lastActive': new Date(),
        updatedAt: new Date(),
      });

      // Invalider le cache
      cacheManager.invalidateKey('userProfiles', `profile_${uid}`);

      logger.firebase('update', 'user_stats', 'success', { uid, update: Object.keys(statsUpdate) });
    } catch (error) {
      logger.error('UserService', 'Erreur mise à jour stats', error);
      throw new Error('Impossible de mettre à jour les statistiques utilisateur');
    }
  }

  // 🎮 Récupérer jeux populaires avec cache
  static async getPopularGames(): Promise<string[]> {
    // Utiliser le cache centralisé avec fallback
    return await cacheManager.getWithFallback(
      'games',
      'popular',
      async () => {
        const games = await AppConfigService.getGames();
        return games.filter(game => game.isPopular).map(game => game.id);
      },
      [], // Fallback vide
      {
        ttl: PERFORMANCE_CONFIG.POPULAR_GAMES_CACHE,
        version: '1.0'
      }
    );
  }

  // 🎭 Avatar aléatoire
  static getRandomGamingAvatar(): string {
    const avatars = ['🎮', '🕹️', '🎯', '🏆', '⚡', '🔥', '💎', '🌟', '🚀', '⭐'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  // 🧹 Gestion du cache
  static clearCache(): void {
    cacheManager.clearAll();
    this.lastCacheInvalidation = Date.now(); // Tracker l'invalidation
    logger.info('UserService', 'Cache utilisateurs vidé');
  }

  static getCacheStats() {
    return cacheManager.getStats();
  }

  // 📅 Récupérer le timestamp de la dernière invalidation du cache
  static getLastCacheInvalidation(): number {
    return this.lastCacheInvalidation;
  }

  // 🔄 Invalider spécifiquement le cache discovery
  static invalidateDiscoveryCache(): void {
    cacheManager.invalidateCache('discovery');
    this.lastCacheInvalidation = Date.now();
    logger.info('UserService', 'Cache découverte invalidé');
  }

  // 💥 Invalider tous les caches liés à un profil utilisateur
  static invalidateAllProfileCaches(uid: string): void {
    // 1. Invalider le cache du profil spécifique
    cacheManager.invalidateKey('userProfiles', `profile_${uid}`);
    
    // 2. Invalider TOUT le cache discovery (car ce profil peut apparaître dans les résultats d'autres utilisateurs)
    cacheManager.invalidateCache('discovery');
    
    // 3. Mettre à jour le timestamp d'invalidation
    this.lastCacheInvalidation = Date.now();
    
    logger.info('UserService', `Cache invalidé pour l'utilisateur ${uid} + discovery globale`);
  }

  // 🚀 Forcer le refresh des données discovery (pour les écrans qui en ont besoin)
  static async forceRefreshDiscovery(currentUserId: string): Promise<UserProfile[]> {
    // Vider complètement le cache discovery
    cacheManager.invalidateCache('discovery');
    
    // Recharger immédiatement
    return this.getDiscoveryUsers(currentUserId);
  }

  // 📊 MÉTHODE FALLBACK: Ancienne méthode de découverte basique (sans matching intelligent)
  static async getBasicDiscoveryUsers(
    currentUserId: string, 
    filters: {
      favoriteGames?: string[];
      preferredTimeSlots?: string[];
      gameStyles?: string[];
      minRating?: number;
      maxRating?: number;
    } = {}
  ): Promise<UserProfile[]> {
    try {
      // Import nécessaire pour cette méthode
      const { collection, getDocs, query, limit } = await import('firebase/firestore');
      
      // Construction de la requête de base
      let baseQuery = query(
        collection(db, 'users'),
        limit(PERFORMANCE_CONFIG.DISCOVERY_LIMIT * 2)
      );

      const snapshot = await getDocs(baseQuery);
      let users: UserProfile[] = [];

      // Traitement par batch pour optimiser
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += PERFORMANCE_CONFIG.BATCH_SIZE) {
        const batch = docs.slice(i, i + PERFORMANCE_CONFIG.BATCH_SIZE);
        
        const batchUsers = batch
          .filter(doc => doc.id !== currentUserId) // Exclure l'utilisateur actuel
          .map(doc => {
            const data = doc.data();
            
            return {
              uid: doc.id,
              email: data.email || '',
              name: data.pseudo || data.name || 'Joueur',
              avatar: data.profilePicture || data.avatar || '🎮',
              preferences: {
                favoriteGames: data.games?.map((game: any) => game.name).filter(Boolean) || data.preferences?.favoriteGames || [],
                preferredTimeSlots: Array.isArray(data.availability) ? data.availability : data.availability?.flatMap((slot: any) => slot.timeSlots) || data.preferences?.preferredTimeSlots || [],
                gameRanks: data.preferences?.gameRanks || {},
                gameStyles: data.gamingStyle?.personality || data.preferences?.gameStyles || [],
                bio: data.bio || data.preferences?.bio,
                ageRange: data.age ? `${data.age}` : data.preferences?.ageRange,
                location: data.location || data.preferences?.location,
                gender: data.gender || data.preferences?.gender,
              },
              stats: {
                totalMatches: data.stats?.totalMatches || 0,
                totalGames: data.stats?.totalGames || 0,
                joinDate: safeTimestampToDate(data.stats?.joinDate) || new Date(),
                lastActive: safeTimestampToDate(data.stats?.lastActive) || new Date(),
                rating: data.stats?.rating || 1000,
              },
              isOnline: data.isOnline || false,
              createdAt: safeTimestampToDate(data.createdAt) || new Date(),
              updatedAt: safeTimestampToDate(data.updatedAt) || new Date(),
            } as UserProfile;
          });

        users.push(...batchUsers);
      }

      // Filtrage avancé
      const filteredUsers = users.filter(user => {
        // Filtre jeux favoris
        if (filters.favoriteGames?.length) {
          const hasCommonGame = user.preferences.favoriteGames.some(game => 
            filters.favoriteGames!.includes(game)
          );
          if (!hasCommonGame) return false;
        }

        // Filtre créneaux horaires
        if (filters.preferredTimeSlots?.length) {
          const hasCommonTimeSlot = user.preferences.preferredTimeSlots.some(slot => 
            filters.preferredTimeSlots!.includes(slot)
          );
          if (!hasCommonTimeSlot) return false;
        }

        // Filtre styles de jeu
        if (filters.gameStyles?.length) {
          const hasCommonStyle = user.preferences.gameStyles.some(style => 
            filters.gameStyles!.includes(style)
          );
          if (!hasCommonStyle) return false;
        }

        // Filtre rating
        if (filters.minRating && user.stats.rating < filters.minRating) return false;
        if (filters.maxRating && user.stats.rating > filters.maxRating) return false;

        return true;
      });

      // Filtrer les utilisateurs bloqués
      const finalUsers = await BlockingService.filterBlockedUsers(currentUserId, filteredUsers);

      // Limiter le résultat
      const limitedUsers = finalUsers.slice(0, PERFORMANCE_CONFIG.DISCOVERY_LIMIT);
      
      logger.info('UserService', 'Découverte basique terminée', {
        totalFound: users.length,
        afterFilter: filteredUsers.length,
        afterBlocking: finalUsers.length,
        returned: limitedUsers.length
      });

      return limitedUsers;

    } catch (error) {
      logger.error('UserService', 'Erreur récupération utilisateurs découverte basique', error);
      return [];
    }
  }
}

// Export par défaut
export default UserService; 