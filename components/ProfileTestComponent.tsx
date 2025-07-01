import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUserProfile } from '../context/UserProfileContext';

// 🧪 Composant de test pour les modifications de profil
export function ProfileTestComponent() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useUserProfile();
  const [newBio, setNewBio] = useState(profile?.bio || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdateBio = async () => {
    if (!newBio.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une bio');
      return;
    }

    setUpdating(true);
    try {
      const success = await updateProfile({ bio: newBio.trim() });
      if (success) {
        Alert.alert('✅ Succès', 'Bio mise à jour ! Les autres utilisateurs verront le changement automatiquement.');
      } else {
        Alert.alert('❌ Erreur', 'Impossible de mettre à jour la bio');
      }
    } catch (error) {
      console.error('Erreur update bio:', error);
      Alert.alert('❌ Erreur', 'Une erreur est survenue');
    } finally {
      setUpdating(false);
    }
  };

  const handleRandomGame = async () => {
    const randomGames = ['Valorant', 'League of Legends', 'FIFA 24', 'Call of Duty', 'Overwatch 2'];
    const randomGame = randomGames[Math.floor(Math.random() * randomGames.length)];
    
    setUpdating(true);
    try {
      const success = await updateProfile({ currentlyPlaying: randomGame });
      if (success) {
        Alert.alert('🎮 Succès', `Jeu actuel changé pour: ${randomGame}`);
      }
    } catch (error) {
      console.error('Erreur update game:', error);
      Alert.alert('❌ Erreur', 'Impossible de changer le jeu');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🧪 Test de synchronisation profil
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Testez les modifications de profil pour voir si elles apparaissent en temps réel chez les autres utilisateurs.
      </Text>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Bio actuelle:</Text>
        <Text style={[styles.currentValue, { color: colors.textSecondary }]}>
          "{profile?.bio || 'Aucune bio'}"
        </Text>
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Entrez une nouvelle bio..."
          placeholderTextColor={colors.textSecondary}
          value={newBio}
          onChangeText={setNewBio}
          multiline
          maxLength={200}
        />
        
        <TouchableOpacity 
          style={[styles.button, { opacity: updating ? 0.5 : 1 }]}
          onPress={handleUpdateBio}
          disabled={updating}
        >
          <Text style={styles.buttonText}>
            {updating ? 'Mise à jour...' : '✏️ Modifier la bio'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Jeu actuel:</Text>
        <Text style={[styles.currentValue, { color: colors.textSecondary }]}>
          {profile?.currentlyPlaying || 'Aucun jeu'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, { opacity: updating ? 0.5 : 1 }]}
          onPress={handleRandomGame}
          disabled={updating}
        >
          <Text style={styles.buttonText}>
            {updating ? 'Modification...' : '🎮 Changer de jeu (aléatoire)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          💡 Après avoir modifié votre profil, vérifiez sur un autre compte si les changements apparaissent automatiquement dans "Trouve 1 Mate" (ça peut prendre jusqu'à 30 secondes).
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FF8E53',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
}); 