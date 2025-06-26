import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// 🎯 Clé AsyncStorage pour l'onboarding
const ONBOARDING_STORAGE_KEY = 'nextmate_onboarding_completed';

// 📝 Types TypeScript
interface OnboardingContextType {
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>; // Pour le dev/debug
}

// 🏗️ Context avec valeurs par défaut
const OnboardingContext = createContext<OnboardingContextType>({
  hasSeenOnboarding: false,
  isLoading: true,
  completeOnboarding: async () => {},
  resetOnboarding: async () => {},
});

// 🎣 Hook personnalisé
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding doit être utilisé dans un OnboardingProvider');
  }
  return context;
};

// 🔄 Provider principal
export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 📖 Vérifier l'état de l'onboarding au démarrage
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      const hasCompleted = value === 'true';
      
      setHasSeenOnboarding(hasCompleted);
      console.log('✅ Onboarding status:', hasCompleted ? 'Déjà vu' : 'Premier lancement');
    } catch (error) {
      console.error('❌ Erreur vérification onboarding:', error);
      // En cas d'erreur, considérer comme non vu (plus sûr)
      setHasSeenOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Marquer l'onboarding comme terminé
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setHasSeenOnboarding(true);
      console.log('✅ Onboarding marqué comme terminé');
    } catch (error) {
      console.error('❌ Erreur sauvegarde onboarding:', error);
      throw error;
    }
  };

  // 🔄 Réinitialiser l'onboarding (pour le dev)
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setHasSeenOnboarding(false);
      console.log('🔄 Onboarding réinitialisé');
    } catch (error) {
      console.error('❌ Erreur reset onboarding:', error);
      throw error;
    }
  };

  const value: OnboardingContextType = {
    hasSeenOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}; 