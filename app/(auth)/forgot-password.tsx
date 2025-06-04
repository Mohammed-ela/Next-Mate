import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuth();
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return;
    }

    const result = await resetPassword(email);
    if (result.success) {
      Alert.alert(
        'Succès', 
        'Un email de réinitialisation a été envoyé à votre adresse.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors de l\'envoi de l\'email');
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#FFFFFF80" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#FFFFFF80"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF8E53', '#FF6B35']}
                style={styles.buttonGradient}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous vous souvenez de votre mot de passe ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginText}>Se connecter</Text>
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
    gap: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
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
}); 