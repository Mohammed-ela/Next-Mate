import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AppConfigService, { type Game, type GameRank, type GameStyle, type TimeSlot } from '../services/appConfigService';
import logger from '../utils/logger';
import { clearTimer, clearTimerCategory, createInterval, createTimeout } from '../utils/timerManager';

// Configuration optimisée - PERFORMANCE AMÉLIORÉE
const CONFIG = {
  RETRY_DELAY: 3000, // 3 secondes (au lieu de 2)
  MAX_RETRIES: 2, // Réduit de 3 à 2
  PRELOAD_DELAY: 3000, // 3 secondes (au lieu de 1)
  REFRESH_INTERVAL: 60 * 60 * 1000, // 1 heure (au lieu de 10 minutes)
};

// Types optimisés pour le contexte
export interface AppConfigContextType {
  // Données principales
  games: Game[];
  gameRanks: { [gameId: string]: GameRank[] };
  gameStyles: GameStyle[];
  timeSlots: TimeSlot[];
  
  // États
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions optimisées
  refreshConfig: () => Promise<void>;
  getGameById: (id: string) => Game | undefined;
  getRanksForGame: (gameId: string) => GameRank[];
  getStyleById: (id: string) => GameStyle | undefined;
  getPopularGames: () => Game[];
  getPopularTimeSlots: () => TimeSlot[];
  
  // Debug et stats
  getCacheStats: () => any;
  invalidateCache: () => void;
}

// Contexte avec valeurs par défaut optimisées
const AppConfigContext = createContext<AppConfigContextType>({
  games: [],
  gameRanks: {},
  gameStyles: [],
  timeSlots: [],
  loading: true,
  error: null,
  lastUpdated: null,
  refreshConfig: async () => {},
  getGameById: () => undefined,
  getRanksForGame: () => [],
  getStyleById: () => undefined,
  getPopularGames: () => [],
  getPopularTimeSlots: () => [],
  getCacheStats: () => ({}),
  invalidateCache: () => {},
});

// Hook personnalisé optimisé
export const useAppConfig = (): AppConfigContextType => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig doit être utilisé dans un AppConfigProvider');
  }
  return context;
};

// Provider optimisé avec gestion d'erreurs avancée
export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // États principaux
  const [games, setGames] = useState<Game[]>([]);
  const [gameRanks, setGameRanks] = useState<{ [gameId: string]: GameRank[] }>({});
  const [gameStyles, setGameStyles] = useState<GameStyle[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs pour éviter les fuites mémoire
  const retryCountRef = useRef(0);
  const refreshTimerRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const loadTimerRef = useRef<string | null>(null);

  // 🚀 Chargement optimisé avec retry intelligent
  const loadConfig = useCallback(async (isRetry = false) => {
    // Éviter les chargements simultanés
    if (isLoadingRef.current && !isRetry) {
      logger.debug('AppConfig', 'Chargement déjà en cours, abandon');
      return;
    }

    isLoadingRef.current = true;
    const startTime = Date.now();

    try {
      logger.info('AppConfig', `${isRetry ? 'Retry' : 'Chargement'} configuration`);
      
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // Chargement parallèle optimisé
      const [gamesData, gameRanksData, gameStylesData, timeSlotsData] = await Promise.all([
        AppConfigService.getGames(),
        AppConfigService.getGameRanks(),
        AppConfigService.getGameStyles(),
        AppConfigService.getTimeSlots()
      ]);

      // Mise à jour atomique des états
      setGames(gamesData);
      setGameRanks(gameRanksData);
      setGameStyles(gameStylesData);
      setTimeSlots(timeSlotsData);
      setLastUpdated(new Date());
      setError(null);
      retryCountRef.current = 0;

      const duration = Date.now() - startTime;
      logger.performance('AppConfig Load', duration, {
        games: gamesData.length,
        gameRanks: Object.keys(gameRanksData).length,
        gameStyles: gameStylesData.length,
        timeSlots: timeSlotsData.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('AppConfig', 'Erreur chargement configuration', errorMessage);

      if (retryCountRef.current < CONFIG.MAX_RETRIES) {
        retryCountRef.current++;
        logger.info('AppConfig', `Retry ${retryCountRef.current}/${CONFIG.MAX_RETRIES} dans ${CONFIG.RETRY_DELAY}ms`);
        
        loadTimerRef.current = createTimeout(() => {
          loadConfig(true);
        }, CONFIG.RETRY_DELAY * retryCountRef.current, 'appConfig');
      } else {
        setError(`Impossible de charger la configuration: ${errorMessage}`);
        logger.error('AppConfig', 'Échec définitif du chargement');
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  // 🔄 Refresh manuel optimisé
  const refreshConfig = useCallback(async () => {
    logger.info('AppConfig', 'Refresh manuel de la configuration');
    AppConfigService.invalidateCache();
    retryCountRef.current = 0;
    await loadConfig();
  }, [loadConfig]);

  // 🎯 Utilitaires optimisés avec useMemo
  const getGameById = useCallback((id: string): Game | undefined => {
    return games.find(game => game.id === id);
  }, [games]);

  const getRanksForGame = useCallback((gameId: string): GameRank[] => {
    return gameRanks[gameId] || [];
  }, [gameRanks]);

  const getStyleById = useCallback((id: string): GameStyle | undefined => {
    return gameStyles.find(style => style.id === id);
  }, [gameStyles]);

  // 📊 Données dérivées optimisées
  const getPopularGames = useMemo(() => {
    return games.filter(game => game.isPopular).sort((a, b) => a.name.localeCompare(b.name));
  }, [games]);

  const getPopularTimeSlots = useMemo(() => {
    return timeSlots.filter(slot => slot.isPopular).sort((a, b) => a.label.localeCompare(b.label));
  }, [timeSlots]);

  // 📈 Debug et statistiques
  const getCacheStats = useCallback(() => {
    return {
      ...AppConfigService.getCacheStats(),
      contextStats: {
        games: games.length,
        gameRanks: Object.keys(gameRanks).length,
        gameStyles: gameStyles.length,
        timeSlots: timeSlots.length,
        lastUpdated,
        retryCount: retryCountRef.current,
        loading,
        error
      }
    };
  }, [games, gameRanks, gameStyles, timeSlots, lastUpdated, loading, error]);

  const invalidateCache = useCallback(() => {
    logger.info('AppConfig', 'Invalidation cache contexte');
    AppConfigService.invalidateCache();
    refreshConfig();
  }, [refreshConfig]);

  // 🎬 Effets optimisés
  useEffect(() => {
    // Chargement initial avec délai
    loadTimerRef.current = createTimeout(() => {
      loadConfig();
    }, CONFIG.PRELOAD_DELAY, 'appConfig');

    // Préchargement en arrière-plan
    AppConfigService.preloadConfig();

    return () => {
      if (loadTimerRef.current) {
        clearTimer(loadTimerRef.current);
      }
    };
  }, [loadConfig]);

  // 🔄 Refresh automatique périodique
  useEffect(() => {
    if (!loading && !error) {
      refreshTimerRef.current = createInterval(() => {
        logger.debug('AppConfig', 'Refresh automatique');
        refreshConfig();
      }, CONFIG.REFRESH_INTERVAL, 'appConfig');
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimer(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [loading, error, refreshConfig]);

  // 🧹 Nettoyage des refs
  useEffect(() => {
    return () => {
      isLoadingRef.current = false;
      clearTimerCategory('appConfig');
    };
  }, []);

  // 📦 Valeur du contexte optimisée avec useMemo
  const contextValue = useMemo((): AppConfigContextType => ({
    // Données
    games,
    gameRanks,
    gameStyles,
    timeSlots,
    
    // États
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshConfig,
    getGameById,
    getRanksForGame,
    getStyleById,
    getPopularGames: () => getPopularGames,
    getPopularTimeSlots: () => getPopularTimeSlots,
    
    // Debug
    getCacheStats,
    invalidateCache,
  }), [
    games,
    gameRanks,
    gameStyles,
    timeSlots,
    loading,
    error,
    lastUpdated,
    refreshConfig,
    getGameById,
    getRanksForGame,
    getStyleById,
    getPopularGames,
    getPopularTimeSlots,
    getCacheStats,
    invalidateCache,
  ]);

  return (
    <AppConfigContext.Provider value={contextValue}>
      {children}
    </AppConfigContext.Provider>
  );
};

// Export par défaut
export default AppConfigProvider; 