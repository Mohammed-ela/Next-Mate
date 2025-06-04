import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6B46C1', '#9333EA', '#A855F7']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Salut ! 👋</Text>
            <Text style={styles.userText}>
              {user?.displayName || user?.email || 'Gamer'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🎮</Text>
            <Text style={styles.appName}>NextMate</Text>
            <Text style={styles.tagline}>
              Trouve tes mates de jeu parfaits !
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.cardGradient}
              >
                <Ionicons name="people-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
                <Text style={styles.actionTitle}>Trouver des Mates</Text>
                <Text style={styles.actionSubtitle}>Découvre des gamers compatibles</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.cardGradient}
              >
                <Ionicons name="game-controller-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
                <Text style={styles.actionTitle}>Mes Jeux</Text>
                <Text style={styles.actionSubtitle}>Gère ta liste de jeux</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.cardGradient}
              >
                <Ionicons name="calendar-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
                <Text style={styles.actionTitle}>Disponibilités</Text>
                <Text style={styles.actionSubtitle}>Configure tes créneaux</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  userText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  actionsContainer: {
    flex: 1,
    gap: 16,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
});
