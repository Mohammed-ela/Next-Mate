import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, firestore } from '../../config/firebase';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return false;
    }

    if (formData.username.length < 3) {
      Alert.alert('Erreur', 'Le pseudo doit contenir au moins 3 caractères');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Créer le compte utilisateur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Mettre à jour le profil avec le nom d'utilisateur
      await updateProfile(userCredential.user, {
        displayName: formData.username,
      });

      // Sauvegarder les données dans Firestore
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        pseudo: formData.username,
        email: formData.email,
        jeux: [], // Liste vide au début
        niveau: 'debutant', // Niveau par défaut
        disponibilites: {
          lundi: [],
          mardi: [],
          mercredi: [],
          jeudi: [],
          vendredi: [],
          samedi: [],
          dimanche: [],
        },
        profileComplete: false,
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Inscription réussie',
        'Votre compte a été créé avec succès !',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe est trop faible';
          break;
        default:
          errorMessage = 'Erreur lors de la création du compte';
      }
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6B46C1', '#9333EA', '#A855F7']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Onglets Login/Sign Up */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={styles.tab}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.tabText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                <Text style={[styles.tabText, styles.activeTabText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Titre */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join us and start exploring.</Text>
            </View>

            {/* Formulaire */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#A1A1AA" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#A1A1AA"
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#A1A1AA" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A1A1AA"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#A1A1AA" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A1A1AA"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#A1A1AA" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#A1A1AA"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </View>

              {/* Bouton d'inscription */}
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#EC4899', '#F97316']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signupButtonText}>Sign Up</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Lien vers connexion */}
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginLink}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F97316',
  },
  tabText: {
    fontSize: 16,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#F97316',
    fontWeight: '600',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#FFFFFF',
  },
  signupButton: {
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 30,
    overflow: 'hidden',
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginText: {
    textAlign: 'center',
    color: '#A1A1AA',
    fontSize: 16,
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 