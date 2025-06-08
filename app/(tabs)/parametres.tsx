import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'danger';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function ParametresScreen() {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => {
            // Logique de déconnexion
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Suppression du compte',
      'Cette action est irréversible. Toutes vos données, conversations et matches seront définitivement supprimés.\n\nÊtes-vous absolument certain de vouloir supprimer votre compte NextMate ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer définitivement', 
          style: 'destructive',
          onPress: () => {
            // Confirmation finale
            Alert.alert(
              'Confirmation finale',
              'Tapez "SUPPRIMER" pour confirmer la suppression de votre compte.',
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'SUPPRIMER', 
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
                    router.replace('/login');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };



  const appSettings: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Messages, matches, invitations',
      icon: 'notifications',
      type: 'toggle',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      id: 'sound',
      title: 'Sons',
      subtitle: 'Sons de notification',
      icon: 'volume-high',
      type: 'toggle',
      value: soundEnabled,
      onToggle: setSoundEnabled,
    },
    {
      id: 'location',
      title: 'Localisation',
      subtitle: 'Partager votre position',
      icon: 'location',
      type: 'toggle',
      value: locationEnabled,
      onToggle: setLocationEnabled,
    },
    {
      id: 'private-mode',
      title: 'Mode privé',
      subtitle: 'Masquer votre statut en ligne',
      icon: 'eye-off',
      type: 'toggle',
      value: privateMode,
      onToggle: setPrivateMode,
    },
  ];

  const privacySettings: SettingItem[] = [
    {
      id: 'blocked-users',
      title: 'Utilisateurs bloqués',
      subtitle: 'Gérer les comptes bloqués',
      icon: 'ban',
      type: 'navigation',
      onPress: () => Alert.alert('Bloqués', 'Liste des utilisateurs bloqués'),
    },
    {
      id: 'privacy-policy',
      title: 'Politique de confidentialité',
      icon: 'document-text',
      type: 'navigation',
      onPress: () => Alert.alert('Confidentialité', 'Politique de confidentialité'),
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      icon: 'clipboard',
      type: 'navigation',
      onPress: () => Alert.alert('CGU', 'Conditions générales d\'utilisation'),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Centre d\'aide',
      subtitle: 'FAQ et tutoriels',
      icon: 'help-circle',
      type: 'navigation',
      onPress: () => Alert.alert('Aide', 'Centre d\'aide NextMate'),
    },
    {
      id: 'contact',
      title: 'Nous contacter',
      subtitle: 'Support technique',
      icon: 'mail',
      type: 'navigation',
      onPress: () => Alert.alert('Contact', 'support@nextmate.app'),
    },
    {
      id: 'feedback',
      title: 'Donner un avis',
      subtitle: 'Améliorer NextMate',
      icon: 'star',
      type: 'navigation',
      onPress: () => Alert.alert('Avis', 'Merci pour votre feedback !'),
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'logout',
      title: 'Déconnexion',
      icon: 'log-out',
      type: 'danger',
      onPress: handleLogout,
    },
    {
      id: 'delete-account',
      title: 'Supprimer le compte',
      subtitle: 'Action irréversible',
      icon: 'trash',
      type: 'danger',
      onPress: handleDeleteAccount,
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        item.type === 'danger' && styles.dangerItem
      ]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.iconContainer,
          item.type === 'danger' && styles.dangerIcon
        ]}>
          <Ionicons 
            name={item.icon as any} 
            size={22} 
            color={item.type === 'danger' ? '#EF4444' : '#FFFFFF'} 
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[
            styles.settingTitle,
            item.type === 'danger' && styles.dangerText
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#374151', true: '#FF8E53' }}
            thumbColor={item.value ? '#FFFFFF' : '#9CA3AF'}
          />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={item.type === 'danger' ? '#EF4444' : '#FFFFFF60'} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2F0C4D', '#471573']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paramètres ⚙️</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <LinearGradient
                colors={['#FF8E53', '#FF6B35']}
                style={styles.userAvatar}
              >
                <Text style={styles.userAvatarText}>🎮</Text>
              </LinearGradient>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>Gaming_Pro</Text>
                <Text style={styles.userEmail}>pro@nextmate.app</Text>
              </View>
            </View>
          </View>

                     {renderSection('⚙️ Application', appSettings)}
          {renderSection('🔒 Confidentialité', privacySettings)}
          {renderSection('🆘 Support', supportSettings)}
          
          {/* Version */}
          <View style={styles.versionSection}>
            <Text style={styles.versionText}>NextMate v1.0.0</Text>
            <Text style={styles.versionSubtext}>Made with 💜 for gamers</Text>
          </View>

          {renderSection('⚠️ Zone de danger', dangerSettings)}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  userSection: {
    marginBottom: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 24,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dangerItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dangerText: {
    color: '#EF4444',
  },
  settingSubtitle: {
    color: '#FFFFFF60',
    fontSize: 13,
  },
  settingRight: {
    marginLeft: 12,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  versionText: {
    color: '#FFFFFF80',
    fontSize: 14,
    fontWeight: '500',
  },
  versionSubtext: {
    color: '#FFFFFF60',
    fontSize: 12,
    marginTop: 4,
  },
}); 