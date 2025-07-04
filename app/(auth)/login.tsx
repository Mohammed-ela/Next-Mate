import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LoginWithGoogleButton } from '../../components/LoginWithGoogleButton';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // États pour la visibilité des mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login, register, loading } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    if (activeTab === 'login') {
      const result = await login(email, password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Erreur', result.error || 'Connexion échouée');
      }
    } else {
      // Validation du pseudo pour l'inscription
      const trimmedPseudo = pseudo.trim();
      
      if (trimmedPseudo.length < 2) {
        Alert.alert('Erreur', 'Le pseudo doit contenir au moins 2 caractères');
        return;
      }
      
      if (trimmedPseudo.length > 10) {
        Alert.alert('Erreur', 'Le pseudo ne peut pas dépasser 10 caractères');
        return;
      }
      
      // Validation caractères autorisés (lettres, chiffres, espaces, tirets, underscores)
      const validPseudoRegex = /^[a-zA-Z0-9\s\-_À-ÿ]+$/;
      if (!validPseudoRegex.test(trimmedPseudo)) {
        Alert.alert('Erreur', 'Le pseudo ne peut contenir que des lettres, chiffres, espaces, tirets et underscores');
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }
      
      const result = await register(email, password, trimmedPseudo);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Erreur', result.error || 'Inscription échouée');
      }
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
          <Text style={styles.title}>
            {activeTab === 'login' ? 'Bienvenue !' : 'Créer un compte'}
          </Text>
          <Text style={styles.subtitle}>
            {activeTab === 'login' 
              ? 'Connectez-vous pour continuer' 
              : 'Rejoignez NextMate aujourd\'hui'}
          </Text>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {activeTab === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Pseudo (max 10 caractères)"
                  placeholderTextColor="#FFFFFF80"
                  value={pseudo}
                  onChangeText={setPseudo}
                  maxLength={10}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

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

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF80" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#FFFFFF80"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color="#FFFFFF80" 
                />
              </TouchableOpacity>
            </View>

            {activeTab === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#FFFFFF80"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color="#FFFFFF80" 
                  />
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'login' && (
              <View style={styles.rememberContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <Ionicons 
                    name={rememberMe ? "checkbox" : "square-outline"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.rememberText}>Se souvenir de moi</Text>
                </TouchableOpacity>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.authButton, loading && styles.disabledButton]}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF8E53', '#FF6B35']}
                style={styles.buttonGradient}
              >
                <Text style={styles.authButtonText}>
                  {loading ? 'Chargement...' : activeTab === 'login' ? 'Se connecter' : 'S\'inscrire'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Bouton Google */}
            <LoginWithGoogleButton 
              onSuccess={() => router.replace('/(tabs)')}
              style={styles.googleButton}
            />
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF80',
    textAlign: 'center',
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF8E53',
  },
  tabText: {
    color: '#FFFFFF80',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  forgotText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '500',
  },
  authButton: {
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
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  separatorText: {
    color: '#FFFFFF80',
    fontSize: 14,
    marginHorizontal: 15,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
}); 