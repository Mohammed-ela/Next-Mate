import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ContactSupportScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'bug', label: '🐛 Bug technique', icon: 'bug' },
    { id: 'account', label: '👤 Problème de compte', icon: 'person' },
    { id: 'matching', label: '💕 Problème de matching', icon: 'heart' },
    { id: 'safety', label: '🛡️ Sécurité', icon: 'shield' },
    { id: 'feature', label: '💡 Suggestion', icon: 'bulb' },
    { id: 'other', label: '❓ Autre', icon: 'help-circle' },
  ];

  const handleSubmit = async () => {
    if (!selectedCategory || !subject.trim() || !message.trim() || !email.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simuler l'envoi du formulaire
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        '✅ Message envoyé !',
        'Votre demande a été envoyée avec succès. Notre équipe vous répondra dans les 24h.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer votre message. Réessayez plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Nous contacter
          </Text>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}
            <View style={[styles.introSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.introTitle, { color: colors.text }]}>
                📧 Contactez notre équipe
              </Text>
              <Text style={[styles.introText, { color: colors.textSecondary }]}>
                Nous sommes là pour vous aider ! Décrivez votre problème ou suggestion et nous vous répondrons rapidement.
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Catégorie *
              </Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: selectedCategory === category.id 
                          ? colors.primary 
                          : colors.surface,
                        borderColor: selectedCategory === category.id 
                          ? colors.primary 
                          : colors.border
                      }
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={20} 
                      color={selectedCategory === category.id ? '#FFFFFF' : colors.text} 
                    />
                    <Text style={[
                      styles.categoryText,
                      { 
                        color: selectedCategory === category.id ? '#FFFFFF' : colors.text 
                      }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Email */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Votre email *
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text 
                  }
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Subject */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Sujet *
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Résumé en quelques mots..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text 
                  }
                ]}
                maxLength={100}
              />
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                {subject.length}/100
              </Text>
            </View>

            {/* Message */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Message *
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Décrivez votre problème ou suggestion en détail..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.messageInput,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text 
                  }
                ]}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                {message.length}/1000
              </Text>
            </View>

            {/* Support Info */}
            <View style={[styles.supportInfo, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.supportInfoText, { color: colors.textSecondary }]}>
                Temps de réponse moyen : 24h • Pour les urgences, contactez-nous directement à support@nextmate.app
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: isSubmitting ? colors.surface : colors.primary,
                  opacity: isSubmitting ? 0.7 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submittingContainer}>
                  <Text style={styles.submitButtonText}>Envoi en cours...</Text>
                </View>
              ) : (
                <View style={styles.submitContainer}>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Envoyer le message</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Alternative Contact */}
            <View style={[styles.alternativeContact, { backgroundColor: colors.card }]}>
              <Text style={[styles.alternativeTitle, { color: colors.text }]}>
                Autres moyens de contact
              </Text>
              <TouchableOpacity style={styles.contactMethod}>
                <Ionicons name="mail" size={18} color={colors.primary} />
                <Text style={[styles.contactMethodText, { color: colors.textSecondary }]}>
                  support@nextmate.app
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactMethod}>
                <Ionicons name="globe" size={18} color={colors.primary} />
                <Text style={[styles.contactMethodText, { color: colors.textSecondary }]}>
                  nextmate.app/support
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  introSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: '48%',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 120,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  supportInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  submitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submittingContainer: {
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alternativeContact: {
    padding: 20,
    borderRadius: 16,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  contactMethodText: {
    fontSize: 14,
  },
}); 