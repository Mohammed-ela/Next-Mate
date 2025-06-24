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

export default function PrivacyPolicyScreen() {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: "1. Collecte des données",
      content: "NextMate collecte uniquement les informations nécessaires au fonctionnement de l'application : votre email, pseudo, jeux favoris, et préférences de matching. Nous ne vendons jamais vos données à des tiers."
    },
    {
      title: "2. Utilisation des données",
      content: "Vos données sont utilisées pour :\n• Créer et gérer votre profil\n• Vous proposer des matches compatibles\n• Améliorer nos services\n• Vous envoyer des notifications importantes\n\nNous ne spammons jamais et respectons vos préférences de communication."
    },
    {
      title: "3. Partage des données",
      content: "Vos informations personnelles ne sont partagées qu'avec :\n• Les autres utilisateurs (pseudo, jeux, bio publique uniquement)\n• Nos prestataires techniques (Firebase/Google) dans le respect du RGPD\n\nJamais avec des annonceurs ou entreprises tierces."
    },
    {
      title: "4. Sécurité",
      content: "NextMate utilise Firebase pour sécuriser vos données avec :\n• Chiffrement de bout en bout\n• Authentification sécurisée\n• Serveurs certifiés Google Cloud\n• Audit de sécurité régulier\n\nVos messages sont privés et protégés."
    },
    {
      title: "5. Vos droits",
      content: "Conformément au RGPD, vous avez le droit de :\n• Consulter vos données (dans Paramètres)\n• Modifier vos informations\n• Supprimer votre compte définitivement\n• Exporter vos données\n• Vous opposer au traitement\n\nContactez-nous à privacy@nextmate.app pour exercer ces droits."
    },
    {
      title: "6. Cookies et tracking",
      content: "NextMate utilise uniquement :\n• Cookies de session (authentification)\n• Analytics anonymes (amélioration UX)\n• Pas de tracking publicitaire\n• Pas de revente de données\n\nVous pouvez désactiver les analytics dans les paramètres."
    },
    {
      title: "7. Mineurs",
      content: "NextMate est strictement réservé aux utilisateurs de 18 ans et plus. Nous vérifions l'âge lors de l'inscription et supprimons immédiatement tout compte de mineur signalé."
    },
    {
      title: "8. Contact",
      content: "Pour toute question sur cette politique :\n\n📧 Email : privacy@nextmate.app\n🌐 Site : nextmate.app/privacy\n📱 Dans l'app : Paramètres > Nous contacter"
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
            Politique de confidentialité
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
              🔒 Votre confidentialité avant tout
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Chez NextMate, nous respectons votre vie privée. Cette politique explique clairement comment nous collectons, utilisons et protégeons vos données personnelles.
            </Text>
            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
              Dernière mise à jour : Janvier 2024
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

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Cette politique est effective depuis le lancement de NextMate et peut être mise à jour. Nous vous notifierons de tout changement important.
            </Text>
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
  footer: {
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 