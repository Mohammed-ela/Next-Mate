import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthError,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
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
  deleteAccount: () => Promise<DeleteAccountResult>;
  clearError: () => void;
  error: string | null;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface DeleteAccountResult {
  success: boolean;
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
  deleteAccount: async () => ({ success: false }),
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

  // 🗑️ Suppression complète du compte
  const deleteAccount = async (): Promise<DeleteAccountResult> => {
    if (!user) {
      return { success: false, error: 'Aucun utilisateur connecté' };
    }

    setError(null);
    setLoading(true);

    try {
      const userId = user.uid;
      console.log('🗑️ Début suppression compte pour:', user.email);

      // 1. Supprimer toutes les conversations de l'utilisateur
      console.log('🗑️ Étape 1: Suppression des conversations...');
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      console.log(`🗑️ ${conversationsSnapshot.docs.length} conversations à supprimer`);

      // Supprimer chaque conversation et ses messages
      for (const conversationDoc of conversationsSnapshot.docs) {
        const conversationId = conversationDoc.id;
        
        // Supprimer tous les messages de la conversation
        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        const deleteMessagePromises = messagesSnapshot.docs.map(messageDoc => 
          deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
        );
        await Promise.all(deleteMessagePromises);
        
        // Supprimer la conversation elle-même
        await deleteDoc(doc(db, 'conversations', conversationId));
        console.log(`✅ Conversation ${conversationId} supprimée`);
      }

      // 2. Supprimer le profil utilisateur dans Firestore
      console.log('🗑️ Étape 2: Suppression du profil Firestore...');
      const userDocRef = doc(db, 'users', userId);
      
      // Vérifier que le document existe avant de le supprimer
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        await deleteDoc(userDocRef);
        console.log('✅ Profil utilisateur supprimé de Firestore');
        
        // Vérifier que la suppression a bien fonctionné
        const verifyDocSnap = await getDoc(userDocRef);
        if (verifyDocSnap.exists()) {
          throw new Error('La suppression du profil Firestore a échoué');
        }
        console.log('✅ Suppression Firestore vérifiée');
      } else {
        console.log('⚠️ Profil utilisateur déjà absent de Firestore');
      }

      // 3. Supprimer le compte Firebase Auth
      console.log('🗑️ Étape 3: Suppression du compte Firebase Auth...');
      await deleteUser(user);
      console.log('✅ Compte Firebase Auth supprimé');

      // 4. Nettoyer AsyncStorage
      console.log('🗑️ Étape 4: Nettoyage AsyncStorage...');
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('✅ AsyncStorage nettoyé');

      console.log('🎉 Compte complètement supprimé avec succès');
      return { success: true };

    } catch (err) {
      const error = err as any;
      let errorMessage = 'Une erreur est survenue lors de la suppression';
      
      if (error.code) {
        errorMessage = getErrorMessage(error.code);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      console.error('❌ Erreur suppression compte:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
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
    deleteAccount,
    clearError,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 🚨 Messages d'erreur Firebase en français
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cette adresse email';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères';
    case 'auth/invalid-email':
      return 'Adresse email invalide';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard';
    case 'auth/network-request-failed':
      return 'Erreur de connexion. Vérifiez votre internet';
    case 'auth/requires-recent-login':
      return 'Cette action nécessite une reconnexion récente';
    default:
      return 'Une erreur est survenue. Réessayez plus tard';
  }
}; 