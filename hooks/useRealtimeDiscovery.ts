import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import UserService, { type UserProfile } from '../services/userService';
import { logger } from '../utils/logger';

interface UseRealtimeDiscoveryOptions {
  enableRealtime?: boolean;
  refreshInterval?: number;
}

interface UseRealtimeDiscoveryResult {
  users: UserProfile[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

// 🔄 Hook pour la découverte avec mise à jour temps réel
export function useRealtimeDiscovery(
  options: UseRealtimeDiscoveryOptions = {}
): UseRealtimeDiscoveryResult {
  const { enableRealtime = true, refreshInterval = 5 * 60 * 1000 } = options; // 5 minutes par défaut
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user: currentUser } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const refreshTimeoutRef = useRef<any>(null);
  const lastRefreshRef = useRef<number>(0);

  // 📡 Fonction pour charger les utilisateurs
  const loadUsers = useCallback(async (isRefresh = false, forceCache = false) => {
    if (!currentUser?.uid) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Si force refresh, vider d'abord le cache
      if (forceCache) {
        UserService.invalidateDiscoveryCache();
      }

      const discoveryUsers = await UserService.getDiscoveryUsers(currentUser.uid);
      setUsers(discoveryUsers);
      lastRefreshRef.current = Date.now();

      logger.info('useRealtimeDiscovery', `${discoveryUsers.length} utilisateurs chargés`, {
        isRefresh,
        forceCache,
        userId: currentUser.uid
      });

    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs discovery:', error);
      setError('Impossible de charger les profils. Vérifiez votre connexion.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [currentUser?.uid]);

  // 🔄 Refresh manuel (pull-to-refresh)
  const refresh = useCallback(async () => {
    await loadUsers(true);
  }, [loadUsers]);

  // 💪 Force refresh (vide le cache et recharge)
  const forceRefresh = useCallback(async () => {
    await loadUsers(true, true);
  }, [loadUsers]);

  // 📡 Listener temps réel sur les modifications de profils
  useEffect(() => {
    if (!currentUser?.uid || !enableRealtime) {
      return;
    }

    console.log('🔄 Configuration listener temps réel pour discovery');

    // Écouter les changements sur tous les profils utilisateurs
    const usersQuery = query(
      collection(db, 'users'),
      where('profileComplete', '==', true) // Seulement les profils complets
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        // Ne pas déclencher au premier chargement si on a déjà des données
        if (snapshot.metadata.fromCache || users.length === 0) {
          return;
        }

        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        // Éviter les refresh trop fréquents (minimum 30 secondes)
        if (timeSinceLastRefresh < 30 * 1000) {
          logger.debug('useRealtimeDiscovery', 'Refresh ignoré (trop récent)', {
            timeSinceLastRefresh
          });
          return;
        }

        logger.info('useRealtimeDiscovery', 'Changement détecté dans les profils utilisateurs');
        
        // Refresh automatique avec un léger délai pour éviter les appels en cascade
        setTimeout(() => {
          forceRefresh();
        }, 2000);
      },
      (error) => {
        console.error('❌ Erreur listener temps réel discovery:', error);
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
  }, [currentUser?.uid, enableRealtime, users.length, forceRefresh]);

  // ⏰ Refresh automatique périodique
  useEffect(() => {
    if (!enableRealtime || refreshInterval <= 0) {
      return;
    }

    const scheduleNextRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        logger.debug('useRealtimeDiscovery', 'Refresh automatique périodique');
        loadUsers(false, false); // Refresh doux (avec cache)
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
  }, [enableRealtime, refreshInterval, loadUsers]);

  // 🚀 Chargement initial
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    users,
    loading,
    refreshing,
    error,
    refresh,
    forceRefresh,
  };
} 