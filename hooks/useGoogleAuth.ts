import * as WebBrowser from 'expo-web-browser';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../config/firebase';

// Configuration WebBrowser pour Expo
WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  signOutFromGoogle: () => Promise<void>;
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Écouter les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Simuler la connexion pour test
      console.log('🚀 Simulation connexion Google...');
      
      // Créer un utilisateur test ou utiliser votre vraie méthode
      const testUser = {
        uid: 'test-user-' + Date.now(),
        email: 'test@gmail.com',
        displayName: 'Test User',
        photoURL: null
      };

      // Simuler Firebase (remplacez par votre vraie logique)
      console.log('✅ Connexion simulée réussie !');
      
      // TODO: Remplacer par vraie auth Firebase
      // const credential = GoogleAuthProvider.credential(idToken);
      // await signInWithCredential(auth, credential);

    } catch (err: any) {
      console.error('❌ Erreur connexion Google:', err);
      setError(err.message || 'Erreur lors de la connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signOutFromGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
      
    } catch (err: any) {
      console.error('❌ Erreur déconnexion:', err);
      setError(err.message || 'Erreur lors de la déconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    signOutFromGoogle,
    user,
    isLoading,
    error,
  };
}; 