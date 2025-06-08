import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from '../../context/AuthContext';

const POPULAR_GAMES = [
  { id: '1', name: 'Valorant', icon: '🎯', platform: 'PC' },
  { id: '2', name: 'League of Legends', icon: '⚔️', platform: 'PC' },
  { id: '3', name: 'FIFA 24', icon: '⚽', platform: 'PS5' },
  { id: '4', name: 'Apex Legends', icon: '🔫', platform: 'PC' },
  { id: '5', name: 'Fortnite', icon: '🏗️', platform: 'PC' },
  { id: '6', name: 'CS2', icon: '💥', platform: 'PC' },
];

const TIME_SLOTS = [
  '9h-12h', '12h-15h', '15h-18h', '18h-21h', '21h-24h', '24h-3h'
];

export default function HomeScreen() {
  const [userGames, setUserGames] = useState([
    { id: '1', name: 'Valorant', icon: '🎯', platform: 'PC', rank: 'Immortal' },
    { id: '2', name: 'League of Legends', icon: '⚔️', platform: 'PC', rank: 'Diamant' }
  ]);
  const [availability, setAvailability] = useState(['18h-21h', '21h-24h']);
  const [isGameModalVisible, setIsGameModalVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pseudo, setPseudo] = useState('GamerX_Pro');

  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    // La redirection se fera automatiquement via _layout.tsx
  };

  const addGame = (game: any) => {
    if (!userGames.find(g => g.id === game.id)) {
      setUserGames([...userGames, { ...game, rank: 'Non classé' }]);
    }
    setIsGameModalVisible(false);
  };

  const removeGame = (gameId: string) => {
    setUserGames(userGames.filter(g => g.id !== gameId));
  };

  const toggleAvailability = (timeSlot: string) => {
    if (availability.includes(timeSlot)) {
      setAvailability(availability.filter(t => t !== timeSlot));
    } else {
      setAvailability([...availability, timeSlot]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2F0C4D', '#471573']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header avec avatar et pseudo */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#FF8E53', '#FF6B35']}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={40} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              
              {isEditingProfile ? (
                <View style={styles.editingContainer}>
                  <TextInput
                    style={styles.pseudoInput}
                    value={pseudo}
                    onChangeText={setPseudo}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => setIsEditingProfile(false)}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pseudoContainer}>
                  <Text style={styles.pseudo}>{pseudo}</Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditingProfile(true)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFFFFF80" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.placeholder} />
          </View>

          {/* Mes Jeux */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎮 Mes Jeux</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setIsGameModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#FF8E53" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.gamesContainer}>
              {userGames.map((game) => (
                <View key={game.id} style={styles.gameCard}>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameIcon}>{game.icon}</Text>
                    <View>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text style={styles.gameRank}>{game.rank}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeGame(game.id)}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF80" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {userGames.length === 0 && (
                <TouchableOpacity 
                  style={styles.emptyGameCard}
                  onPress={() => setIsGameModalVisible(true)}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF80" />
                  <Text style={styles.emptyText}>Ajouter un jeu</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Disponibilités */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Quand je joue</Text>
            <View style={styles.timeSlots}>
              {TIME_SLOTS.map((timeSlot) => (
                <TouchableOpacity
                  key={timeSlot}
                  style={[
                    styles.timeSlot,
                    availability.includes(timeSlot) && styles.timeSlotActive
                  ]}
                  onPress={() => toggleAvailability(timeSlot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    availability.includes(timeSlot) && styles.timeSlotTextActive
                  ]}>
                    {timeSlot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions rapides */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚀 Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/trouve1mate')}
              >
                <LinearGradient
                  colors={['#FF8E53', '#FF6B35']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="search" size={24} color="#FFFFFF" />
                  <Text style={styles.actionText}>Trouver des Mates</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/conversations')}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
                  <Text style={styles.actionText}>Mes Conversations</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal d'ajout de jeu */}
        <Modal
          visible={isGameModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un jeu</Text>
                <TouchableOpacity 
                  onPress={() => setIsGameModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF80" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={POPULAR_GAMES.filter(game => !userGames.find(g => g.id === game.id))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalGameItem}
                    onPress={() => addGame(item)}
                  >
                    <Text style={styles.gameIcon}>{item.icon}</Text>
                    <View style={styles.modalGameInfo}>
                      <Text style={styles.modalGameName}>{item.name}</Text>
                      <Text style={styles.modalGamePlatform}>{item.platform}</Text>
                    </View>
                    <Ionicons name="add" size={20} color="#FF8E53" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pseudoInput: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF80',
    paddingVertical: 5,
    minWidth: 150,
  },
  saveButton: {
    marginLeft: 10,
    padding: 5,
  },
  pseudoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pseudo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    marginLeft: 10,
    padding: 5,
  },
  placeholder: {
    width: 48,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
    borderRadius: 15,
    padding: 8,
  },
  gamesContainer: {
    gap: 10,
  },
  gameCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  gameName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameRank: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  removeButton: {
    padding: 5,
  },
  emptyGameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#FFFFFF80',
    marginTop: 8,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeSlotActive: {
    backgroundColor: '#FF8E53',
    borderColor: '#FF8E53',
  },
  timeSlotText: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 15,
  },
  actionCard: {
    borderRadius: 12,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2F0C4D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalGameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalGameInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalGameName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalGamePlatform: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
});
