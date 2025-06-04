import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { auth, db } from '../config/firebase';

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, pseudo?: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      // 1. Créer le compte Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // 2. Sauvegarder le profil dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        pseudo: pseudo || 'Gamer_' + user.uid.slice(0, 6),
        profileComplete: false,
        createdAt: serverTimestamp()
      });

      console.log('✅ Utilisateur créé dans Auth ET Firestore !');
      return { success: true, user: user };
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    resetPassword,
    loading
  };
}; 