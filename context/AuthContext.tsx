import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AuthError,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

// 🔒 Types TypeScript stricts
interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, pseudo?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
  error: string | null;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface SavedUserData {
  uid: string;
  email: string | null;
  timestamp: number;
}

// 📱 Clés AsyncStorage
const STORAGE_KEY = 'nextmate_auth_user';

// 🏗️ Context avec valeurs par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  clearError: () => {},
  error: null,
});

// 🎣 Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// 🔥 Provider principal
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 💾 Sauvegarde utilisateur dans AsyncStorage
  const saveUserToStorage = async (user: User | null) => {
    try {
      if (user) {
        const userData: SavedUserData = {
          uid: user.uid,
          email: user.email,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        console.log('✅ Utilisateur sauvegardé dans AsyncStorage');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('✅ Utilisateur supprimé d\'AsyncStorage');
      }
    } catch (err) {
      console.error('❌ Erreur AsyncStorage:', err);
    }
  };

  // 📖 Lecture utilisateur depuis AsyncStorage
  const loadUserFromStorage = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const userData: SavedUserData = JSON.parse(savedData);
        console.log('✅ Données utilisateur récupérées depuis AsyncStorage:', userData.email);
        return userData;
      }
    } catch (err) {
      console.error('❌ Erreur lecture AsyncStorage:', err);
    }
    return null;
  };

  // 🔐 Connexion email/password
  const login = async (email: string, password: string): Promise<AuthResult> => {
    setError(null);
    setLoading(true);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Connexion réussie:', result.user.email);
      return { success: true, user: result.user };
    } catch (err) {
      const error = err as AuthError;
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      console.error('❌ Erreur connexion:', error.code, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 📝 Inscription email/password + profil Firestore
  const register = async (email: string, password: string, pseudo?: string): Promise<AuthResult> => {
    setError(null);
    setLoading(true);
    
    try {
      // 1. Créer compte Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // 2. Sauvegarder profil dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        pseudo: pseudo || `Gamer_${user.uid.slice(0, 6)}`,
        profileComplete: false,
        provider: 'email',
        createdAt: serverTimestamp(),
      });
      
      console.log('✅ Inscription réussie + profil Firestore créé:', user.email);
      return { success: true, user };
    } catch (err) {
      const error = err as AuthError;
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      console.error('❌ Erreur inscription:', error.code, errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Déconnexion
  const logout = async (): Promise<void> => {
    setError(null);
    try {
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
    } catch (err) {
      const error = err as AuthError;
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      console.error('❌ Erreur déconnexion:', error.code);
    }
  };

  // 🧹 Effacer erreurs
  const clearError = () => setError(null);

  // 👂 Écouter les changements d'état Firebase + persistance AsyncStorage
  useEffect(() => {
    // Récupérer l'utilisateur sauvegardé au démarrage
    loadUserFromStorage();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Sauvegarder/supprimer dans AsyncStorage
      await saveUserToStorage(user);
    });

    return unsubscribe;
  }, []);

  // 📦 Valeurs du contexte
  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    clearError,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔧 Utilitaire : Messages d'erreur Firebase en français
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Aucun utilisateur trouvé avec cet email';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères';
    case 'auth/invalid-email':
      return 'Adresse email invalide';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard';
    case 'auth/network-request-failed':
      return 'Erreur de connexion réseau';
    default:
      return 'Une erreur est survenue. Réessayez plus tard';
  }
}; 