import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: "1. Acceptation des conditions",
      content: "En utilisant NextMate, vous acceptez ces conditions d'utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application. Ces conditions s'appliquent à tous les utilisateurs."
    },
    {
      title: "2. Utilisation autorisée",
      content: "NextMate est une plateforme de rencontres pour gamers. Vous pouvez :\n• Créer un profil authentique\n• Chercher et contacter d'autres gamers\n• Organiser des sessions de jeu\n• Partager vos expériences gaming\n\nL'utilisation commerciale est interdite sans autorisation."
    },
    {
      title: "3. Comportement requis",
      content: "Vous vous engagez à :\n• Être respectueux envers les autres utilisateurs\n• Ne pas harceler, insulter ou discriminer\n• Garder un profil authentique et récent\n• Ne pas usurper l'identité d'autrui\n• Respecter la vie privée des autres\n\nTout manquement peut entraîner la suspension du compte."
    },
    {
      title: "4. Contenu interdit",
      content: "Il est strictement interdit de publier :\n• Contenu à caractère sexuel ou pornographique\n• Messages de haine, racisme, homophobie\n• Spam, publicité non autorisée\n• Liens malveillants ou virus\n• Informations personnelles d'autrui\n• Contenu illégal ou encourageant la violence"
    },
    {
      title: "5. Âge et éligibilité",
      content: "NextMate est réservé aux personnes de 18 ans et plus. En vous inscrivant, vous confirmez :\n• Avoir au moins 18 ans\n• Avoir le droit d'accepter ces conditions\n• Fournir des informations exactes\n\nLes comptes de mineurs seront immédiatement supprimés."
    },
    {
      title: "6. Propriété intellectuelle",
      content: "NextMate et ses contenus sont protégés par le droit d'auteur. Vous ne pouvez pas :\n• Copier ou reproduire l'application\n• Utiliser nos marques ou logos\n• Extraire des données utilisateurs\n• Créer des applications dérivées\n\nVous gardez les droits sur votre contenu personnel."
    },
    {
      title: "7. Responsabilité",
      content: "NextMate n'est pas responsable :\n• Des rencontres organisées via l'app\n• Du comportement des autres utilisateurs\n• Des pertes de données techniques\n• Des interruptions de service temporaires\n\nUtilisez l'app à vos propres risques et avec bon sens."
    },
    {
      title: "8. Suspension et résiliation",
      content: "Nous pouvons suspendre votre compte en cas de :\n• Violation de ces conditions\n• Comportement inapproprié signalé\n• Activité suspecte ou frauduleuse\n• Non-respect des règles communautaires\n\nVous pouvez supprimer votre compte à tout moment dans les paramètres."
    },
    {
      title: "9. Modifications",
      content: "Ces conditions peuvent être modifiées occasionnellement. Les changements importants vous seront notifiés via l'application. L'utilisation continue constitue une acceptation des nouvelles conditions."
    },
    {
      title: "10. Contact et litiges",
      content: "Pour toute question :\n📧 support@nextmate.app\n📱 Paramètres > Nous contacter\n\nEn cas de litige, nous privilégions la résolution amiable. Le droit français s'applique."
    }
  ];

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
            Conditions d'utilisation
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={[styles.introSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              📋 Règles d'utilisation NextMate
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Ces conditions définissent les règles d'utilisation de NextMate. Elles garantissent une expérience sécurisée et respectueuse pour tous les gamers de notre communauté.
            </Text>
            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
              Version effective : Janvier 2024
            </Text>
          </View>

          {/* Sections */}
          {sections.map((section, index) => (
            <View key={index} style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {section.content}
              </Text>
            </View>
          ))}

          {/* Important notice */}
          <View style={[styles.noticeSection, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View style={styles.noticeContent}>
              <Text style={[styles.noticeTitle, { color: colors.text }]}>
                Important
              </Text>
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                En utilisant NextMate, vous acceptez ces conditions. La violation des règles peut entraîner la suspension de votre compte. 
              </Text>
            </View>
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
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  noticeSection: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 10,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 18,
  },
}); 