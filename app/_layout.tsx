import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/NextMateToast';
import { AppConfigProvider } from '../context/AppConfigContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConversationsProvider } from '../context/ConversationsContext';
import { BadgeNotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProfileProvider } from '../context/UserProfileContext';

// 🔇 Supprime le warning Firebase AsyncStorage spécifique
const originalWarn = console.warn;
console.warn = (message, ...args) => {
  if (typeof message === 'string' && message.includes('AsyncStorage has been extracted from react-native')) {
    return;
  }
  originalWarn(message, ...args);
};

// 🔄 Composant de navigation avec redirection auth
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Attendre que l'auth soit chargée

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Utilisateur non connecté et pas sur écran auth → rediriger vers login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Utilisateur connecté mais sur écran auth → rediriger vers app
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
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
  );
}
