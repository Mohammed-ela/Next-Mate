import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// 🔇 Supprime le warning Firebase AsyncStorage spécifique
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' && 
    message.includes('@firebase/auth') && 
    message.includes('AsyncStorage')
  ) {
    // Ignore ce warning spécifique
    return;
  }
  // Garde tous les autres warnings
  originalWarn(...args);
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
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
