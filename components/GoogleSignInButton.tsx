import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

// Configuration WebBrowser pour Google Auth
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  style?: any;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  style, 
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);

  // Configuration Google OAuth - URI Expo forcée
  const redirectUri = 'https://auth.expo.io/@mohammed-ela/nextmate';
  
  // Debug : vérifier l'URI utilisé
  console.log('🔁 redirectUri utilisé :', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '369533672786-n5afiqmfeeo2bkdiog434h0lne3lgbru.apps.googleusercontent.com', // Client Web correct
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  // Debug : état de la requête
  console.log('📱 Request state:', request ? 'READY' : 'NOT_READY');
  console.log('🔐 Client ID configuré:', '369533672786-n5afiqmfeco2bkdiog434h0lne3lgbru.apps.googleusercontent.com');

  // Gérer la réponse Google Auth
  useEffect(() => {
    console.log('📥 Google Auth Response:', response);
    
    if (response?.type === 'success') {
      console.log('✅ Authentification Google réussie !');
      console.log('🎟️ ID Token reçu:', response.params.id_token ? 'OUI' : 'NON');
      handleGoogleSignIn(response.params.id_token);
    } else if (response?.type === 'error') {
      console.log('❌ Erreur Google Auth:', response.error);
      setLoading(false);
      Alert.alert(
        'Erreur Google', 
        response.error?.message || 'Erreur lors de la connexion Google'
      );
    } else if (response?.type === 'cancel') {
      console.log('🚫 Authentification Google annulée par l\'utilisateur');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      console.log('🚀 Début processus Firebase Auth...');
      setLoading(true);

      // 1. Créer le credential Firebase avec le token Google
      console.log('🔑 Création du credential Firebase...');
      const credential = GoogleAuthProvider.credential(idToken);

      // 2. Se connecter à Firebase avec le credential
      console.log('🔥 Connexion à Firebase...');
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      console.log('✅ Utilisateur Firebase connecté:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });

      // 3. Vérifier si l'utilisateur existe dans Firestore
      console.log('📄 Vérification Firestore...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        console.log('➕ Création nouveau profil Firestore...');
        // 4. Créer le profil utilisateur dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          pseudo: user.displayName || `Gamer_${user.uid.slice(0, 6)}`,
          photoURL: user.photoURL,
          profileComplete: false,
          createdAt: serverTimestamp(),
          provider: 'google',
        });
        console.log('✅ Nouvel utilisateur Google créé dans Firestore');
      } else {
        console.log('✅ Utilisateur Google existant connecté');
      }

      // 5. Rediriger vers la page principale
      console.log('🚀 Redirection vers /(tabs)...');
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('❌ Erreur Firebase Auth:', error);
      console.error('❌ Détails erreur:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      Alert.alert(
        'Erreur de connexion',
        error.message || 'Impossible de se connecter avec Google'
      );
    } finally {
      setLoading(false);
    }
  };

  const onPress = async () => {
    if (!request || loading || disabled) {
      console.log('⏸️ Bouton désactivé:', {
        request: !!request,
        loading,
        disabled
      });
      return;
    }
    
    console.log('👆 Bouton Google pressé, lancement de l\'auth...');
    setLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error('❌ Erreur promptAsync:', error);
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de lancer la connexion Google');
    }
  };

  const isDisabled = !request || loading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.icon} />
        ) : (
          <Ionicons name="logo-google" size={20} color="#FFFFFF" style={styles.icon} />
        )}
        <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>
          {loading ? 'Connexion...' : 'Continuer avec Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285f4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999999',
  },
}); 