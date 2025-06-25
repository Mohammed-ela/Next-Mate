import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Validation simple de l'email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction pour obtenir un message d'erreur personnalisé
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse email.';
      case 'auth/invalid-email':
        return 'L\'adresse email n\'est pas valide.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre internet.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  const handleResetPassword = async () => {
    // Validation de base
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
      return;
    }

    // Validation du format email
    if (!isValidEmail(email.trim())) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide');
      return;
    }

    setLoading(true);
    
    try {
      // Import dynamique des modules Firebase
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../../config/firebase');
      
      // Envoi de l'email de réinitialisation
      await sendPasswordResetEmail(auth, email.trim());
      
      // Succès - Affichage de l'alerte avec retour
      Alert.alert(
        'Email envoyé !', 
        `Un lien de réinitialisation a été envoyé à ${email.trim()}. Vérifiez votre boîte de réception et vos spams.`,
        [
          {
            text: 'Compris',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error: any) {
      // Gestion des erreurs Firebase avec messages personnalisés
      console.error('Reset password error:', error);
      
      const errorMessage = getErrorMessage(error.code);
      Alert.alert('Erreur', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LinearGradient
        colors={['#2F0C4D', '#471573']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Bouton retour */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Titre et description */}
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          <View style={styles.form}>
            {/* Champ email avec validation visuelle */}
            <View style={[
              styles.inputContainer,
              email && !isValidEmail(email) && styles.inputError
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={email && !isValidEmail(email) ? "#FF6B6B" : "#FFFFFF80"} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="votre-email@exemple.com"
                placeholderTextColor="#FFFFFF80"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Message d'erreur email en temps réel */}
            {email && !isValidEmail(email) && (
              <Text style={styles.emailError}>
                Veuillez saisir une adresse email valide
              </Text>
            )}

            {/* Bouton d'envoi avec spinner */}
            <TouchableOpacity 
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading || (!!email && !isValidEmail(email))}
            >
              <LinearGradient
                colors={loading ? ['#999', '#777'] : ['#FF8E53', '#FF6B35']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
                    <Text style={styles.resetButtonText}>Envoi en cours...</Text>
                  </View>
                ) : (
                  <Text style={styles.resetButtonText}>Envoyer le lien</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer avec lien de connexion */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous vous souvenez de votre mot de passe ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={[styles.loginText, loading && styles.disabledText]}>
                  Se connecter
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 30,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF80',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emailError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -15,
    marginLeft: 15,
  },
  resetButton: {
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  loginText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.5,
  },
}); 