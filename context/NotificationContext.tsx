import React, { createContext, useCallback, useContext, useState } from 'react';

// Types pour les badges interactifs uniquement
export interface NotificationBadge {
  id: string;
  count: number;
  isAnimating: boolean;
  timestamp: Date;
  type: 'message' | 'match' | 'general';
}

interface BadgeNotificationContextType {
  badges: { [conversationId: string]: NotificationBadge };
  totalUnreadCount: number;
  animateBadgeDisappear: (conversationId: string) => void;
  updateBadge: (conversationId: string, count: number) => void;
  clearBadge: (conversationId: string) => void;
  clearAllBadges: () => void;
  getNotificationStatus: (conversationId: string) => {
    hasNotifications: boolean;
    count: number;
    isAnimating: boolean;
  };
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined);

// 📱 Provider pour les badges interactifs uniquement
export const BadgeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badges, setBadges] = useState<{ [conversationId: string]: NotificationBadge }>({});

  // 🎯 Animation de disparition d'un badge
  const animateBadgeDisappear = useCallback((conversationId: string) => {
    console.log('🎯 Animation disparition badge:', conversationId);
    
    setBadges(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        isAnimating: true
      }
    }));

    // Supprimer le badge après l'animation
    setTimeout(() => {
      setBadges(prev => {
        const newBadges = { ...prev };
        delete newBadges[conversationId];
        return newBadges;
      });
    }, 300);
  }, []);

  // 📊 Mise à jour d'un badge
  const updateBadge = useCallback((conversationId: string, count: number, type: 'message' | 'match' | 'general' = 'message') => {
    if (count > 0) {
      setBadges(prev => ({
        ...prev,
        [conversationId]: {
          id: conversationId,
          count,
          isAnimating: false,
          timestamp: new Date(),
          type
        }
      }));
    } else {
      clearBadge(conversationId);
    }
  }, []);

  // 🗑️ Supprimer un badge
  const clearBadge = useCallback((conversationId: string) => {
    console.log('🗑️ Suppression badge:', conversationId);
    setBadges(prev => {
      const newBadges = { ...prev };
      delete newBadges[conversationId];
      console.log('📊 Badges après suppression:', Object.keys(newBadges).length);
      return newBadges;
    });
  }, []);

  // 🧹 Supprimer tous les badges
  const clearAllBadges = useCallback(() => {
    console.log('🧹 Suppression de tous les badges');
    
    // Animer tous les badges avant suppression
    const conversationIds = Object.keys(badges);
    conversationIds.forEach((id, index) => {
      setTimeout(() => {
        animateBadgeDisappear(id);
      }, index * 100); // Délai progressif pour effet visuel
    });
  }, [badges, animateBadgeDisappear]);

  // 📊 Status des notifications pour une conversation
  const getNotificationStatus = useCallback((conversationId: string) => {
    const badge = badges[conversationId];
    return {
      hasNotifications: !!badge && badge.count > 0,
      count: badge?.count || 0,
      isAnimating: badge?.isAnimating || false,
    };
  }, [badges]);

  // 📊 Calcul du total des notifications
  const totalUnreadCount = Object.values(badges).reduce((total, badge) => {
    return total + (badge.isAnimating ? 0 : badge.count);
  }, 0);

  const value: BadgeNotificationContextType = {
    badges,
    totalUnreadCount,
    animateBadgeDisappear,
    updateBadge,
    clearBadge,
    clearAllBadges,
    getNotificationStatus
  };

  return (
    <BadgeNotificationContext.Provider value={value}>
      {children}
    </BadgeNotificationContext.Provider>
  );
};

export const useBadgeNotifications = (): BadgeNotificationContextType => {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error('useBadgeNotifications doit être utilisé dans un BadgeNotificationProvider');
  }
  return context;
};

// Export pour rétrocompatibilité (maintenant pointe vers badges)
export const useNotifications = useBadgeNotifications; 