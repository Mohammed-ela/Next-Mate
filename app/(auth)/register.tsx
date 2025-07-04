import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function RegisterScreen() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger immédiatement vers login car les tabs Login/Signup sont maintenant unifiés
    router.replace('/(auth)/login');
  }, []);

  return null;
} 