import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎯 Clé AsyncStorage pour l'onboarding
const ONBOARDING_STORAGE_KEY = 'nextmate_onboarding_completed';

// 📱 Utilitaires pour le développement de l'onboarding

/**
 * 🔄 Force l'affichage de l'onboarding (dev uniquement)
 */
export const forceShowOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    console.log('🔄 Onboarding forcé à s\'afficher');
  } catch (error) {
    console.error('❌ Erreur force onboarding:', error);
    throw error;
  }
};

/**
 * ✅ Force le marquage comme terminé (dev uniquement)
 */
export const forceCompleteOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    console.log('✅ Onboarding forcé comme terminé');
  } catch (error) {
    console.error('❌ Erreur force completion onboarding:', error);
    throw error;
  }
};

/**
 * 📖 Vérifier le statut actuel de l'onboarding
 */
export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    const hasCompleted = value === 'true';
    console.log('📊 Statut onboarding:', hasCompleted ? 'Terminé' : 'Non vu');
    return hasCompleted;
  } catch (error) {
    console.error('❌ Erreur vérification onboarding:', error);
    return false;
  }
};

/**
 * 🗑️ Nettoyer toutes les données d'onboarding (dev uniquement)
 */
export const clearOnboardingData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([ONBOARDING_STORAGE_KEY]);
    console.log('🗑️ Données onboarding nettoyées');
  } catch (error) {
    console.error('❌ Erreur nettoyage onboarding:', error);
    throw error;
  }
};

/**
 * 📋 Debug info pour l'onboarding
 */
export const getOnboardingDebugInfo = async () => {
  try {
    const hasCompleted = await checkOnboardingStatus();
    const rawValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    
    const info = {
      hasCompleted,
      rawValue,
      storageKey: ONBOARDING_STORAGE_KEY,
      timestamp: new Date().toISOString(),
    };
    
    console.log('🔍 Debug Onboarding:', info);
    return info;
  } catch (error) {
    console.error('❌ Erreur debug onboarding:', error);
    return null;
  }
};

// 🎨 Configuration des slides pour tests
export const ONBOARDING_TEST_SLIDES = [
  {
    id: 'test-1',
    title: 'Test Slide 1',
    description: 'Premier slide de test pour vérifier l\'intégration.',
    image: '🧪',
    backgroundColor: ['#FF0000', '#FF6B6B'] as [string, string],
    titleColor: '#FFFFFF',
    descriptionColor: '#FFEEEE',
  },
  {
    id: 'test-2',
    title: 'Test Slide 2',
    description: 'Deuxième slide pour tester les animations.',
    image: '⚡',
    backgroundColor: ['#00FF00', '#6BCF7F'] as [string, string],
    titleColor: '#FFFFFF',
    descriptionColor: '#EEFFEE',
  },
];

export default {
  forceShowOnboarding,
  forceCompleteOnboarding,
  checkOnboardingStatus,
  clearOnboardingData,
  getOnboardingDebugInfo,
  ONBOARDING_TEST_SLIDES,
}; 