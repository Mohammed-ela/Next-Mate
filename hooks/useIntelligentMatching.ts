import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserProfileContext';
import MatchingService, { type MatchScore } from '../services/matchingService';
import { type UserProfile as ServiceUserProfile } from '../services/userService';
import { logger } from '../utils/logger';

// Fonction pour convertir le profil du contexte vers le format du service
const convertContextProfileToServiceProfile = (contextProfile: any): ServiceUserProfile => {
  return {
    uid: contextProfile.uid,
    email: contextProfile.email,
    name: contextProfile.pseudo || 'Joueur',
    avatar: contextProfile.profilePicture || '🎮',
    preferences: {
      favoriteGames: contextProfile.games?.map((game: any) => game.name) || [],
      preferredTimeSlots: contextProfile.availability?.flatMap((slot: any) => slot.timeSlots) || [],
      gameRanks: {},
      gameStyles: contextProfile.gamingStyle?.personality || [],
      bio: contextProfile.bio,
      ageRange: contextProfile.age ? `${contextProfile.age}` : undefined,
      location: contextProfile.location,
      gender: contextProfile.gender,
    },
    stats: {
      totalMatches: contextProfile.stats?.matchesPlayed || 0,
      totalGames: contextProfile.stats?.totalGames || 0,
      joinDate: contextProfile.createdAt || new Date(),
      lastActive: contextProfile.lastSeen || new Date(),
      rating: contextProfile.stats?.rating || 1000,
    },
    isOnline: contextProfile.isOnline || false,
    createdAt: contextProfile.createdAt || new Date(),
    updatedAt: contextProfile.updatedAt || new Date(),
  };
}; 

interface UseIntelligentMatchingOptions {
  enableRealtime?: boolean;
  refreshInterval?: number;
  minScore?: number; // Score minimum de compatibilité (0-1)
  maxResults?: number; // Nombre maximum de résultats
}

interface UseIntelligentMatchingResult {
  matches: MatchScore[];
  users: ServiceUserProfile[]; // Pour compatibilité avec l'ancienne interface
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

// 🧠 Hook pour le matching intelligent basé sur la compatibilité
export function useIntelligentMatching(
  options: UseIntelligentMatchingOptions = {}
): UseIntelligentMatchingResult {
  const { 
    enableRealtime = true, 
    refreshInterval = 5 * 60 * 1000, // 5 minutes par défaut
    minScore = 0.2, // Score minimum de 20%
    maxResults = 20 
  } = options;
  
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [users, setUsers] = useState<ServiceUserProfile[]>([]); // Pour compatibilité
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user: currentUser } = useAuth();
  const { profile: currentProfile } = useUserProfile();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const refreshTimeoutRef = useRef<any>(null);
  const lastRefreshRef = useRef<number>(0);

  // 📡 Fonction pour charger les correspondances intelligentes
  const loadMatches = useCallback(async (isRefresh = false, forceCache = false) => {
    if (!currentUser?.uid || !currentProfile) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Si force refresh, vider d'abord le cache
      if (forceCache) {
        MatchingService.clearUserCache(currentUser.uid);
      }

      console.log('🧠 Recherche correspondances intelligentes pour:', currentProfile.pseudo);

      // Convertir le profil du contexte vers le format du service
      const serviceProfile = convertContextProfileToServiceProfile(currentProfile);

      // Utiliser le MatchingService pour des correspondances intelligentes
      const intelligentMatches = await MatchingService.findMatches(
        currentUser.uid,
        serviceProfile,
        {
          onlineOnly: false, // Inclure les utilisateurs hors ligne
        },
        maxResults
      );

      // Filtrer par score minimum
      const filteredMatches = intelligentMatches.filter(match => match.score >= minScore);

      setMatches(filteredMatches);
      
      // Extraire les profils utilisateur pour compatibilité
      const matchedUsers = filteredMatches.map(match => {
        // Trouver le profil complet de l'utilisateur correspondant
        // Note: Pour une implémentation complète, il faudrait récupérer les profils complets
        // Pour l'instant, on crée un profil simplifié basé sur les données du match
        return {
          uid: match.userId,
          name: `Utilisateur ${match.userId}`, // Sera mis à jour avec les vraies données
          email: '',
          avatar: '🎮',
          preferences: {
            favoriteGames: match.sharedGames || [],
            preferredTimeSlots: [],
            gameRanks: {},
            gameStyles: [],
          },
          stats: {
            totalMatches: 0,
            totalGames: 0,
            joinDate: new Date(),
            lastActive: new Date(),
            rating: 1000,
          },
          isOnline: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ServiceUserProfile;
      });

      setUsers(matchedUsers);
      lastRefreshRef.current = Date.now();

      logger.info('useIntelligentMatching', `${filteredMatches.length} correspondances intelligentes trouvées`, {
        isRefresh,
        forceCache,
        userId: currentUser.uid,
        totalMatches: intelligentMatches.length,
        filteredMatches: filteredMatches.length,
        avgScore: filteredMatches.length > 0 
          ? filteredMatches.reduce((sum, match) => sum + match.score, 0) / filteredMatches.length 
          : 0
      });

    } catch (error) {
      console.error('❌ Erreur chargement correspondances intelligentes:', error);
      setError('Impossible de charger les correspondances. Vérifiez votre connexion.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [currentUser?.uid, currentProfile, minScore, maxResults]);

  // 🔄 Refresh manuel (pull-to-refresh)
  const refresh = useCallback(async () => {
    await loadMatches(true);
  }, [loadMatches]);

  // 💪 Force refresh (vide le cache et recharge)
  const forceRefresh = useCallback(async () => {
    await loadMatches(true, true);
  }, [loadMatches]);

  // 📡 Listener temps réel sur les modifications de profils
  useEffect(() => {
    if (!currentUser?.uid || !enableRealtime) {
      return;
    }

    console.log('🧠 Configuration listener temps réel pour matching intelligent');

    // Écouter les changements sur tous les profils utilisateurs
    const usersQuery = query(
      collection(db, 'users'),
      where('profileComplete', '==', true) // Seulement les profils complets
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        // Ne pas déclencher au premier chargement si on a déjà des données
        if (snapshot.metadata.fromCache || matches.length === 0) {
          return;
        }

        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        // Éviter les refresh trop fréquents (minimum 30 secondes)
        if (timeSinceLastRefresh < 30 * 1000) {
          logger.debug('useIntelligentMatching', 'Refresh ignoré (trop récent)', {
            timeSinceLastRefresh
          });
          return;
        }

        logger.info('useIntelligentMatching', 'Changement détecté dans les profils utilisateurs');
        
        // Refresh automatique avec un léger délai pour éviter les appels en cascade
        setTimeout(() => {
          forceRefresh();
        }, 2000);
      },
      (error) => {
        console.error('❌ Erreur listener temps réel matching intelligent:', error);
        // Ne pas afficher d'erreur à l'utilisateur, le listener continue
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser?.uid, enableRealtime, matches.length, forceRefresh]);

  // ⏰ Refresh automatique périodique
  useEffect(() => {
    if (!enableRealtime || refreshInterval <= 0) {
      return;
    }

    const scheduleNextRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        logger.debug('useIntelligentMatching', 'Refresh automatique périodique');
        loadMatches(false, false); // Refresh doux (avec cache)
        scheduleNextRefresh(); // Planifier le suivant
      }, refreshInterval);
    };

    scheduleNextRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [enableRealtime, refreshInterval, loadMatches]);

  // 🚀 Chargement initial
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // 🧹 Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    matches,
    users, // Pour compatibilité avec l'interface existante
    loading,
    refreshing,
    error,
    refresh,
    forceRefresh,
  };
} 