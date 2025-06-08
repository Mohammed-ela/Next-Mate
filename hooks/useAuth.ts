import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { auth, db } from '../config/firebase';

// Configuration WebBrowser pour Expo
WebBrowser.maybeCompleteAuthSession();

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

  const signInWithGoogle = async (): Promise<AuthResult> => {
    setLoading(true);
    try {
      const clientId = Constants.expoConfig?.extra?.googleClientId;
      
      if (!clientId) {
        throw new Error('Google Client ID non configuré');
      }

      // Configuration simplifiée pour Expo
      const redirectUri = AuthSession.makeRedirectUri();
      
      console.log('🔗 Redirect URI:', redirectUri);

      // Configuration basique sans nonce 
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
      });

      // Discovery endpoint standard
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      };

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.id_token) {
        // Créer les credentials Firebase
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        
        // Connexion avec Firebase
        const firebaseResult = await signInWithCredential(auth, credential);
        const user = firebaseResult.user;
        
        // Vérifier si l'utilisateur existe déjà dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          pseudo: user.displayName || 'Gamer_' + user.uid.slice(0, 6),
          profileComplete: user.photoURL ? true : false,
          photoURL: user.photoURL,
          provider: 'google',
          createdAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ Connexion Google réussie !');
        return { success: true, user: user };
      } else {
        console.log('❌ Result:', result);
        throw new Error('Connexion Google annulée ou échouée');
      }
    } catch (error: any) {
      console.error('❌ Erreur connexion Google:', error);
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
        provider: 'email',
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
    signInWithGoogle,
    signUp,
    resetPassword,
    loading
  };
}; 