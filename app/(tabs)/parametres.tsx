import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BlockingService, type BlockedUser } from '../../services/blockingService';

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
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { deleteAccount, user } = useAuth();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  useEffect(() => {
    if (user?.uid) {
      loadBlockedUsers();
    }
  }, [user]);

  const loadBlockedUsers = async () => {
    if (!user?.uid) return;
    
    try {
      const blocked = await BlockingService.getBlockedUsers(user.uid);
      setBlockedUsers(blocked);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs bloqués:', error);
    }
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
              'Dernière chance ! Cette action supprimera :\n\n• Votre profil et toutes vos données\n• Toutes vos conversations et messages\n• Vos matches et préférences\n• Votre compte Firebase\n\nTapez "SUPPRIMER" pour confirmer.',
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'SUPPRIMER', 
                  style: 'destructive',
                  onPress: performAccountDeletion
                }
              ]
            );
          }
        }
      ]
    );
  };

  const performAccountDeletion = async () => {
    setIsDeletingAccount(true);
    
    try {
      // Afficher un indicateur de progression
      Alert.alert(
        '🗑️ Suppression en cours...',
        'Suppression de vos données. Cela peut prendre quelques secondes.',
        [],
        { cancelable: false }
      );

      const result = await deleteAccount();
      
      if (result.success) {
        // Succès - redirection automatique via AuthContext
        Alert.alert(
          '✅ Compte supprimé',
          'Votre compte NextMate a été complètement supprimé. Toutes vos données ont été effacées.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirection forcée vers login
                router.replace('/(auth)/login');
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        // Erreur
        Alert.alert(
          '❌ Erreur de suppression',
          result.error || 'Impossible de supprimer le compte. Réessayez plus tard.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur suppression compte:', error);
      Alert.alert(
        '❌ Erreur inattendue',
        'Une erreur inattendue s\'est produite. Vérifiez votre connexion et réessayez.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const appSettings: SettingItem[] = [
    {
      id: 'dark-mode',
      title: 'Mode sombre',
      subtitle: 'Interface sombre ou claire',
      icon: isDarkMode ? 'moon' : 'sunny',
      type: 'toggle',
      value: isDarkMode,
      onToggle: toggleTheme,
    },
  ];

  const privacySettings: SettingItem[] = [
    {
      id: 'blocked-users',
      title: 'Utilisateurs bloqués',
      subtitle: `${blockedUsers.length} utilisateur${blockedUsers.length > 1 ? 's' : ''} bloqué${blockedUsers.length > 1 ? 's' : ''}`,
      icon: 'ban',
      type: 'navigation',
      onPress: () => router.push('/blocked-users'),
    },
    {
      id: 'privacy-policy',
      title: 'Politique de confidentialité',
      icon: 'document-text',
      type: 'navigation',
      onPress: () => router.push('/privacy-policy'),
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      icon: 'clipboard',
      type: 'navigation',
      onPress: () => router.push('/terms-of-service'),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Centre d\'aide',
      subtitle: 'FAQ et tutoriels',
      icon: 'help-circle',
      type: 'navigation',
      onPress: () => router.push('/help-center'),
    },
    {
      id: 'contact',
      title: 'Nous contacter',
      subtitle: 'support@nextmate.app',
      icon: 'mail',
      type: 'navigation',
      onPress: () => router.push('/contact-support'),
    },
    {
      id: 'feedback',
      title: 'Donner un avis',
      subtitle: 'Améliorer NextMate',
      icon: 'star',
      type: 'navigation',
      onPress: () => router.push('/feedback'),
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'delete-account',
      title: 'Supprimer mon compte',
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
        { borderBottomColor: colors.border },
        item.type === 'danger' && styles.dangerItem,
        isDeletingAccount && item.id === 'delete-account' && styles.disabledItem
      ]}
      onPress={item.type === 'toggle' ? undefined : item.onPress}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
      disabled={isDeletingAccount && item.id === 'delete-account'}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: colors.surface },
          item.type === 'danger' && styles.dangerIcon
        ]}>
          <Ionicons 
            name={item.icon as any} 
            size={22} 
            color={item.type === 'danger' ? '#EF4444' : colors.text} 
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[
            styles.settingTitle,
            { color: colors.text },
            item.type === 'danger' && styles.dangerText
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#374151', true: colors.primary }}
            thumbColor={item.value ? '#FFFFFF' : '#9CA3AF'}
            ios_backgroundColor="#374151"
          />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={item.type === 'danger' ? '#EF4444' : colors.textSecondary} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Paramètres ⚙️</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderSection('⚙️ Application', appSettings)}
          {renderSection('🔒 Confidentialité', privacySettings)}
          {renderSection('🆘 Support', supportSettings)}
          {renderSection('⚠️ Zone de danger', dangerSettings)}
          
          {/* Version */}
          <View style={styles.versionSection}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>NextMate v1.0.0</Text>
            <Text style={[styles.versionSubtext, { color: colors.textSecondary }]}>Made with 💜 for gamers</Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  dangerItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  disabledItem: {
    opacity: 0.5,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dangerText: {
    color: '#EF4444',
  },
  settingSubtitle: {
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
    fontSize: 14,
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  tokenText: {
    fontSize: 10,
    marginTop: 8,
    fontFamily: 'monospace',
  },
}); 