import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function HelpCenterScreen() {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const faqData: FAQItem[] = [
    {
      id: '1',
      category: '🚀 Démarrage',
      question: 'Comment créer mon profil NextMate ?',
      answer: 'Après inscription, rendez-vous dans l\'onglet Profil pour ajouter vos jeux favoris, votre bio, vos disponibilités et votre style de jeu. Un profil complet attire plus de matches !'
    },
    {
      id: '2',
      category: '🚀 Démarrage',
      question: 'Comment trouver des gamers compatibles ?',
      answer: 'Utilisez l\'onglet "Trouver" pour découvrir des profils. L\'algorithme vous propose des gamers partageant vos jeux et disponibilités. Swipez à droite pour matcher !'
    },
    {
      id: '3',
      category: '💬 Chat & Rencontres',
      question: 'Comment démarrer une conversation ?',
      answer: 'Une fois matché, rendez-vous dans l\'onglet "Conversations". Commencez par parler de vos jeux en commun ou proposez directement une session de jeu !'
    },
    {
      id: '4',
      category: '💬 Chat & Rencontres',
      question: 'Comment organiser une session de jeu ?',
      answer: 'Dans le chat, utilisez le bouton 🎮 pour envoyer une invitation de jeu avec les détails (jeu, heure, serveur). Votre match recevra une notification.'
    },
    {
      id: '5',
      category: '🛡️ Sécurité',
      question: 'Comment signaler un utilisateur inapproprié ?',
      answer: 'Sur le profil de la personne, appuyez sur "..." puis "Signaler". Décrivez le problème. Notre équipe examine tous les signalements sous 24h.'
    },
    {
      id: '6',
      category: '🛡️ Sécurité',
      question: 'Comment bloquer quelqu\'un ?',
      answer: 'Dans le chat ou sur le profil, appuyez sur "..." puis "Bloquer". La personne ne pourra plus vous contacter et vous ne la verrez plus dans les suggestions.'
    },
    {
      id: '7',
      category: '⚙️ Paramètres',
      question: 'Comment modifier mes préférences de matching ?',
      answer: 'Allez dans Paramètres > Préférences de matching. Vous pouvez ajuster l\'âge, la distance, les jeux prioritaires et les créneaux horaires.'
    },
    {
      id: '8',
      category: '⚙️ Paramètres',
      question: 'Comment supprimer mon compte ?',
      answer: 'Paramètres > Zone de danger > Supprimer le compte. ATTENTION : cette action est irréversible et supprime toutes vos données définitivement.'
    },
    {
      id: '9',
      category: '🔔 Notifications',
      question: 'Comment gérer mes notifications ?',
      answer: 'Dans les paramètres de votre téléphone > NextMate > Notifications. Vous pouvez personnaliser les alertes pour matches, messages et invitations de jeu.'
    },
    {
      id: '10',
      category: '🔔 Notifications',
      question: 'Pourquoi je ne reçois pas de notifications ?',
      answer: 'Vérifiez : 1) Notifications activées dans les paramètres du téléphone 2) NextMate autorisé à envoyer des notifications 3) Mode Ne pas déranger désactivé.'
    },
    {
      id: '11',
      category: '🎮 Jeux',
      question: 'Comment ajouter un jeu qui n\'est pas dans la liste ?',
      answer: 'Nous ajoutons régulièrement de nouveaux jeux. Contactez-nous via "Nous contacter" avec le nom du jeu, nous l\'ajouterons dans la prochaine mise à jour.'
    },
    {
      id: '12',
      category: '🎮 Jeux',
      question: 'Comment mettre à jour mon rang sur un jeu ?',
      answer: 'Dans votre profil, appuyez sur le jeu concerné et mettez à jour votre rang. Cela aide à trouver des partenaires de niveau similaire.'
    }
  ];

  const categories = [...new Set(faqData.map(item => item.category))];

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.faqItem, { backgroundColor: colors.card }]}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <View style={styles.faqTitleContainer}>
            <Text style={[styles.faqCategory, { color: colors.primary }]}>
              {item.category}
            </Text>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              {item.question}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
        
        {isExpanded && (
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
            {item.answer}
          </Text>
        )}
      </TouchableOpacity>
    );
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
            Centre d'aide
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher dans l'aide..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={[styles.introSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              🆘 Comment pouvons-nous vous aider ?
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Trouvez rapidement des réponses aux questions les plus fréquentes sur NextMate. Si vous ne trouvez pas votre réponse, contactez-nous !
            </Text>
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/contact-support')}
            >
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Nous contacter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => setSearchQuery('démarrage')}
            >
              <Ionicons name="rocket" size={20} color={colors.text} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Guide débutant</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ Categories */}
          {searchQuery.length === 0 && (
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Catégories populaires
              </Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.categoryChip, { backgroundColor: colors.surface }]}
                    onPress={() => setSearchQuery(category.split(' ')[1])}
                  >
                    <Text style={[styles.categoryChipText, { color: colors.text }]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* FAQ Items */}
          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {searchQuery.length > 0 
                ? `Résultats pour "${searchQuery}" (${filteredFAQ.length})`
                : 'Questions fréquentes'
              }
            </Text>
            
            {filteredFAQ.length > 0 ? (
              filteredFAQ.map(renderFAQItem)
            ) : (
              <View style={[styles.noResults, { backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text style={[styles.noResultsText, { color: colors.text }]}>
                  Aucun résultat trouvé
                </Text>
                <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>
                  Essayez avec d'autres mots-clés ou contactez-nous directement
                </Text>
              </View>
            )}
          </View>

          {/* Contact CTA */}
          <View style={[styles.contactCTA, { backgroundColor: colors.surface }]}>
            <Ionicons name="help-circle" size={24} color={colors.primary} />
            <View style={styles.contactContent}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>
                Vous ne trouvez pas votre réponse ?
              </Text>
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                Notre équipe support est là pour vous aider
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/contact-support')}
            >
              <Text style={styles.contactButtonText}>Contacter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    marginBottom: 20,
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  faqTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  faqCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  noResults: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
  },
  contactButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
}); 