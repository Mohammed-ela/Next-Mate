import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/NextMateToast';
import { AppConfigProvider } from '../context/AppConfigContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConversationsProvider } from '../context/ConversationsContext';
import { BadgeNotificationProvider } from '../context/NotificationContext';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProfileProvider } from '../context/UserProfileContext';

// 🔇 Désactiver tous les warnings/logs en développement
LogBox.ignoreAllLogs();

// 🔇 Supprime le warning Firebase AsyncStorage spécifique
const originalWarn = console.warn;
console.warn = (message, ...args) => {
  if (typeof message === 'string' && message.includes('AsyncStorage has been extracted from react-native')) {
    return;
  }
  originalWarn(message, ...args);
};

// 🔄 Composant de navigation avec redirection auth + onboarding
function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Attendre que l'auth et l'onboarding soient chargés
    if (authLoading || onboardingLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments.includes('onboarding');

    console.log('🔄 Navigation check:', {
      user: !!user,
      hasSeenOnboarding,
      currentSegment: segments[0],
      inAuthGroup,
      inOnboarding
    });

    // 🎯 Logique de redirection par priorité :
    
    // 1. Si pas encore vu l'onboarding → onboarding
    if (!hasSeenOnboarding && !inOnboarding) {
      console.log('🚀 Redirection vers onboarding (premier lancement)');
      router.replace('/onboarding' as any); // Force TypeScript car la route existe
      return;
    }
    
    // 2. Si onboarding terminé mais pas connecté → login
    if (hasSeenOnboarding && !user && !inAuthGroup) {
      console.log('🔐 Redirection vers login (onboarding terminé, pas connecté)');
      router.replace('/(auth)/login');
      return;
    }
    
    // 3. Si connecté mais sur écran auth ou onboarding → app principal
    if (user && (inAuthGroup || inOnboarding)) {
      console.log('🏠 Redirection vers app principal (utilisateur connecté)');
      router.replace('/(tabs)');
      return;
    }

  }, [user, authLoading, hasSeenOnboarding, onboardingLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <AppConfigProvider>
        <AuthProvider>
          <UserProfileProvider>
            <BadgeNotificationProvider>
              <ConversationsProvider>
                <ThemeProvider>
                  <RootLayoutNav />
                  <Toast config={toastConfig} />
                </ThemeProvider>
              </ConversationsProvider>
            </BadgeNotificationProvider>
          </UserProfileProvider>
        </AuthProvider>
      </AppConfigProvider>
    </OnboardingProvider>
  );
}
