import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import cacheManager from '../utils/cacheManager';
import { logger } from '../utils/logger';
import { UserProfile } from './userService';

interface MatchScore {
  userId: string;
  score: number;
  breakdown: {
    games: number;
    schedule: number;
    style: number;
    proximity: number;
    activity: number;
  };
  sharedGames: string[];
  compatibilityReasons: string[];
}

interface MatchingCriteria {
  favoriteGames?: string[];
  availableTimeSlots?: string[];
  gameStyles?: string[];
  preferredSkillLevel?: 'any' | 'similar' | 'better' | 'worse';
  maxDistance?: number;
  minRating?: number;
  onlineOnly?: boolean;
}

// 🎯 Service de matching intelligent NextMate
class MatchingService {
  private static readonly WEIGHTS = {
    GAMES: 0.35,        // 35% - Jeux en commun (le plus important)
    SCHEDULE: 0.25,     // 25% - Créneaux horaires compatibles  
    STYLE: 0.20,        // 20% - Style de jeu compatible
    PROXIMITY: 0.10,    // 10% - Proximité géographique
    ACTIVITY: 0.10      // 10% - Activité récente
  };

  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // 🔍 Trouver les meilleures correspondances pour un utilisateur
  static async findMatches(
    currentUserId: string, 
    currentProfile: UserProfile,
    criteria: MatchingCriteria = {},
    limit: number = 20
  ): Promise<MatchScore[]> {
    try {
      logger.info('MatchingService', `🔍 Recherche correspondances pour ${currentUserId}`);

      // Vérifier le cache d'abord
      const cacheKey = `matches_${currentUserId}_${JSON.stringify(criteria)}`;
      const cached = cacheManager.get<MatchScore[]>('matching', cacheKey, this.CACHE_DURATION);
      if (cached) {
        logger.cache('hit', `matching:${cacheKey}`);
        return cached.slice(0, limit);
      }

      // Récupérer tous les utilisateurs éligibles
      const eligibleUsers = await this.getEligibleUsers(currentUserId, criteria);
      
      // Calculer le score de correspondance pour chaque utilisateur
      const matches: MatchScore[] = [];
      
      for (const user of eligibleUsers) {
        const score = this.calculateMatchScore(currentProfile, user);
        if (score.score > 0.2) { // Seuil minimum de 20%
          matches.push(score);
        }
      }

      // Trier par score décroissant
      matches.sort((a, b) => b.score - a.score);
      
      // Mettre en cache
      const topMatches = matches.slice(0, limit);
      cacheManager.set('matching', cacheKey, topMatches);
      
      logger.info('MatchingService', `✅ ${topMatches.length} correspondances trouvées`);
      return topMatches;

    } catch (error) {
      logger.error('MatchingService', 'Erreur recherche correspondances', error);
      return [];
    }
  }

  // 👥 Récupérer les utilisateurs éligibles
  private static async getEligibleUsers(
    currentUserId: string, 
    criteria: MatchingCriteria
  ): Promise<UserProfile[]> {
    try {
      // Construire la requête avec filtres
      let usersQuery = query(collection(db, 'users'));
      
      // Filtrer les utilisateurs en ligne si demandé
      if (criteria.onlineOnly) {
        usersQuery = query(usersQuery, where('isOnline', '==', true));
      }

      const snapshot = await getDocs(usersQuery);
      const users: UserProfile[] = [];

      snapshot.docs.forEach(doc => {
        if (doc.id !== currentUserId) { // Exclure l'utilisateur actuel
          const data = doc.data();
          
          // Convertir en format UserProfile
          const userProfile: UserProfile = {
            uid: doc.id,
            email: data.email || '',
            name: data.pseudo || data.name || 'Joueur',
            avatar: data.profilePicture || data.avatar || '🎮',
            preferences: {
              favoriteGames: data.games?.map((g: any) => g.name) || [],
              preferredTimeSlots: data.availability?.flatMap((a: any) => a.timeSlots) || [],
              gameRanks: data.gameRanks || {},
              gameStyles: data.gamingStyle?.personality || [],
              bio: data.bio,
              ageRange: data.age ? `${data.age}` : undefined,
              location: data.location
            },
            stats: {
              totalMatches: data.stats?.totalMatches || 0,
              totalGames: data.stats?.totalGames || 0,
              joinDate: data.createdAt?.toDate() || new Date(),
              lastActive: data.updatedAt?.toDate() || new Date(),
              rating: data.stats?.rating || 1000
            },
            isOnline: data.isOnline || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };

          users.push(userProfile);
        }
      });

      return users;
    } catch (error) {
      logger.error('MatchingService', 'Erreur récupération utilisateurs', error);
      return [];
    }
  }

  // 🧮 Calculer le score de correspondance entre deux profils
  private static calculateMatchScore(profile1: UserProfile, profile2: UserProfile): MatchScore {
    const breakdown = {
      games: this.calculateGameCompatibility(profile1, profile2),
      schedule: this.calculateScheduleCompatibility(profile1, profile2),
      style: this.calculateStyleCompatibility(profile1, profile2),
      proximity: this.calculateProximityScore(profile1, profile2),
      activity: this.calculateActivityScore(profile2)
    };

    const totalScore = 
      breakdown.games * this.WEIGHTS.GAMES +
      breakdown.schedule * this.WEIGHTS.SCHEDULE +
      breakdown.style * this.WEIGHTS.STYLE +
      breakdown.proximity * this.WEIGHTS.PROXIMITY +
      breakdown.activity * this.WEIGHTS.ACTIVITY;

    const sharedGames = this.findSharedGames(profile1, profile2);
    const reasons = this.generateCompatibilityReasons(breakdown, sharedGames);

    return {
      userId: profile2.uid,
      score: Math.round(totalScore * 100) / 100,
      breakdown,
      sharedGames,
      compatibilityReasons: reasons
    };
  }

  // 🎮 Calculer la compatibilité des jeux
  private static calculateGameCompatibility(profile1: UserProfile, profile2: UserProfile): number {
    const games1 = profile1.preferences.favoriteGames || [];
    const games2 = profile2.preferences.favoriteGames || [];
    
    if (games1.length === 0 || games2.length === 0) return 0;

    const commonGames = games1.filter(game => games2.includes(game));
    const totalUniqueGames = new Set([...games1, ...games2]).size;
    
    if (commonGames.length === 0) return 0;
    
    // Score basé sur le nombre de jeux en commun et la proportion
    const commonRatio = commonGames.length / Math.min(games1.length, games2.length);
    const diversityBonus = commonGames.length > 2 ? 0.2 : 0;
    
    return Math.min(1, commonRatio + diversityBonus);
  }

  // ⏰ Calculer la compatibilité des horaires
  private static calculateScheduleCompatibility(profile1: UserProfile, profile2: UserProfile): number {
    const slots1 = profile1.preferences.preferredTimeSlots || [];
    const slots2 = profile2.preferences.preferredTimeSlots || [];
    
    if (slots1.length === 0 || slots2.length === 0) return 0.5; // Score neutre

    const commonSlots = slots1.filter(slot => slots2.includes(slot));
    const overlapRatio = commonSlots.length / Math.max(slots1.length, slots2.length);
    
    return overlapRatio;
  }

  // 🎯 Calculer la compatibilité des styles de jeu
  private static calculateStyleCompatibility(profile1: UserProfile, profile2: UserProfile): number {
    const styles1 = profile1.preferences.gameStyles || [];
    const styles2 = profile2.preferences.gameStyles || [];
    
    if (styles1.length === 0 || styles2.length === 0) return 0.5; // Score neutre

    const commonStyles = styles1.filter(style => styles2.includes(style));
    const styleRatio = commonStyles.length / Math.max(styles1.length, styles2.length);
    
    return styleRatio;
  }

  // 📍 Calculer le score de proximité (basique)
  private static calculateProximityScore(profile1: UserProfile, profile2: UserProfile): number {
    const location1 = profile1.preferences.location?.toLowerCase();
    const location2 = profile2.preferences.location?.toLowerCase();
    
    if (!location1 || !location2) return 0.5; // Score neutre
    
    // Comparaison simple par ville/région
    if (location1 === location2) return 1;
    if (location1.includes(location2) || location2.includes(location1)) return 0.7;
    
    return 0.3; // Score faible mais pas zéro
  }

  // 📊 Calculer le score d'activité
  private static calculateActivityScore(profile: UserProfile): number {
    const lastActive = profile.stats.lastActive;
    const now = new Date();
    const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActive <= 1) return 1;      // Très actif
    if (daysSinceActive <= 3) return 0.8;    // Actif
    if (daysSinceActive <= 7) return 0.6;    // Modérément actif
    if (daysSinceActive <= 30) return 0.3;   // Peu actif
    
    return 0.1; // Inactif
  }

  // 🔍 Trouver les jeux en commun
  private static findSharedGames(profile1: UserProfile, profile2: UserProfile): string[] {
    const games1 = profile1.preferences.favoriteGames || [];
    const games2 = profile2.preferences.favoriteGames || [];
    
    return games1.filter(game => games2.includes(game));
  }

  // 💭 Générer les raisons de compatibilité
  private static generateCompatibilityReasons(breakdown: MatchScore['breakdown'], sharedGames: string[]): string[] {
    const reasons: string[] = [];
    
    if (breakdown.games > 0.7) {
      reasons.push(`${sharedGames.length} jeu(x) en commun: ${sharedGames.slice(0, 2).join(', ')}`);
    }
    
    if (breakdown.schedule > 0.7) {
      reasons.push('Créneaux horaires compatibles');
    }
    
    if (breakdown.style > 0.7) {
      reasons.push('Styles de jeu similaires');
    }
    
    if (breakdown.proximity > 0.8) {
      reasons.push('Même région');
    }
    
    if (breakdown.activity > 0.8) {
      reasons.push('Très actif récemment');
    }

    return reasons;
  }

  // 🧹 Nettoyer le cache de matching
  static clearMatchingCache(userId?: string) {
    if (userId) {
      // Nettoyer spécifiquement pour un utilisateur
      cacheManager.invalidateKey('matching', `matches_${userId}`);
    } else {
      // Nettoyer tout le cache matching
      cacheManager.invalidateCache('matching');
    }
    
    logger.info('MatchingService', '🧹 Cache matching nettoyé');
  }

  // 🧹 Nettoyage du cache spécialisé
  static clearUserCache(userId: string) {
    // Nettoyer le cache de ce user spécifiquement
    cacheManager.invalidateKey('matching', `recommendations_${userId}`);
    cacheManager.invalidateKey('matching', `profile_${userId}`);
    logger.debug('MatchingService', 'Cache utilisateur nettoyé', { userId });
  }

  static clearAllCache() {
    // Nettoyer tout le cache de matching
    cacheManager.invalidateCache('matching');
    logger.debug('MatchingService', 'Tous les caches de matching nettoyés');
  }

  // 📊 Statistiques du cache
  static getCacheStatistics() {
    const stats = cacheManager.getStats();
    return {
      ...stats,
      matching: stats.caches.matching || { size: 0, totalAccess: 0, avgAccessPerItem: 0 }
    };
  }

  // 📊 Statistiques du service de matching
  static getMatchingStats() {
    return {
      weights: this.WEIGHTS,
      cacheDuration: this.CACHE_DURATION,
      cacheStats: cacheManager.getStats()
    };
  }
}

export default MatchingService;
export type { MatchingCriteria, MatchScore };

