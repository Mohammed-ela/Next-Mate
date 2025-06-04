import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger immédiatement vers la page de connexion
    router.replace('/(auth)/login');
  }, []);

  return null;
} 