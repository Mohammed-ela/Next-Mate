import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';

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

const RANKS = {
  'Valorant': ['Fer', 'Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Ascendant', 'Immortel', 'Radiant'],
  'League of Legends': ['Fer', 'Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Maître', 'Grandmaître', 'Challenger'],
  'CS2': ['Argent', 'Or Nova', 'Maître Guardian', 'Aigle', 'Suprême', 'Global Elite'],
  'FIFA 24': ['Div 10', 'Div 9', 'Div 8', 'Div 7', 'Div 6', 'Div 5', 'Div 4', 'Div 3', 'Div 2', 'Div 1', 'Elite'],
  'Apex Legends': ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Maître', 'Prédateur'],
  'Fortnite': ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Elite', 'Champion', 'Non Classé'],
  'Default': ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert']
};

const GAME_STYLES = ['Chill', 'Tryhard', 'Competitive', 'Fun', 'Improve'];

export default function HomeScreen() {
  const { logout } = useAuth();
  const { profile, updateProfile, loading } = useUserProfile();
  const { colors, isDarkMode } = useTheme();
  
  // États existants
  const [isGameModalVisible, setIsGameModalVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pseudo, setPseudo] = useState(profile?.pseudo || 'Chargement...');

  // Nouveaux états pour l'édition des jeux
  const [isEditGameModalVisible, setIsEditGameModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedStyle, setSelectedStyle] = useState([]);

  // Nouveaux états pour bio et avatar
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(profile?.bio || '');

  // États pour la date de naissance
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Mettre à jour les states locaux quand le profil change
  useEffect(() => {
    if (profile?.pseudo) {
      setPseudo(profile.pseudo);
    }
    if (profile?.bio !== undefined) {
      setBioText(profile.bio || '');
    }
  }, [profile?.pseudo, profile?.bio]);

  // Resynchroniser quand l'édition se ferme
  useEffect(() => {
    if (!isEditingBio && profile?.bio !== undefined) {
      setBioText(profile.bio || '');
    }
  }, [isEditingBio, profile?.bio]);

  const handleSignOut = async () => {
    await logout();
    // La redirection se fera automatiquement via _layout.tsx
  };

  const handleSavePseudo = async () => {
    if (profile && pseudo !== profile.pseudo) {
      const success = await updateProfile({ pseudo });
      if (success) {
        console.log('✅ Pseudo mis à jour:', pseudo);
      }
    }
    setIsEditingProfile(false);
  };

  // Nouvelle fonction pour sauvegarder la bio
  const handleSaveBio = async () => {
    if (!profile) return;
    
    try {
      const success = await updateProfile({ bio: bioText });
      if (success) {
        console.log('✅ Bio mise à jour:', bioText);
        setIsEditingBio(false);
        // Force la synchronisation visuelle
        setTimeout(() => {
          if (profile?.bio !== bioText) {
            setBioText(profile?.bio || '');
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde bio:', error);
      // En cas d'erreur, revenir à la valeur Firebase
      setBioText(profile?.bio || '');
      setIsEditingBio(false);
    }
  };

  // Fonction pour changer l'avatar
  const handleChangeAvatar = async () => {
    try {
      // Vérifier la limite de changements d'avatar
      const today = new Date().toDateString();
      const lastChangeDate = profile?.lastAvatarChangeDate?.toDateString();
      const changesCount = profile?.avatarChangesToday || 0;

      if (lastChangeDate === today && changesCount >= 2) {
        Alert.alert(
          "Limite atteinte",
          "Tu peux changer ton avatar maximum 2 fois par jour. Réessaye demain ! 😊",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "L'accès à la galerie photo est nécessaire pour changer votre avatar.");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        selectionLimit: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        // Calculer le nouveau compteur
        const newChangesCount = lastChangeDate === today ? changesCount + 1 : 1;
        
        const success = await updateProfile({ 
          profilePicture: pickerResult.assets[0].uri,
          lastAvatarChangeDate: new Date(),
          avatarChangesToday: newChangesCount
        });
        
        if (success) {
          console.log(`✅ Avatar mis à jour (${newChangesCount}/2 aujourd'hui)`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      Alert.alert("Erreur", "Impossible de changer l'avatar.");
    }
  };

  const addGame = async (game: any) => {
    if (!profile) return;
    
    const gameExists = profile.games.find(g => g.id === game.id);
    if (!gameExists) {
      const newGame = { 
        ...game, 
        rank: 'Non classé',
        playtime: '0h',
        skillLevel: 'Casual',
        goals: ['Fun'],
        lookingFor: ['Team'],
        gameMode: ['Casual']
      };
      const updatedGames = [...profile.games, newGame];
      await updateProfile({ games: updatedGames });
    }
    setIsGameModalVisible(false);
  };

  const removeGame = async (gameId: string) => {
    if (!profile) return;
    
    const updatedGames = profile.games.filter(g => g.id !== gameId);
    await updateProfile({ games: updatedGames });
  };

  // Nouvelle fonction pour éditer un jeu
  const editGame = (game: any) => {
    setSelectedGame(game);
    setSelectedRank(game.rank || '');
    setSelectedStyle(game.goals || []);
    setIsEditGameModalVisible(true);
  };

  const saveGameDetails = async () => {
    if (!profile || !selectedGame) return;

    const updatedGames = profile.games.map(game => 
      game.id === selectedGame.id 
        ? { 
            ...game, 
            rank: selectedRank,
            goals: selectedStyle
          }
        : game
    );

    const success = await updateProfile({ games: updatedGames });
    if (success) {
      setIsEditGameModalVisible(false);
      setSelectedGame(null);
    }
  };

  const toggleStyle = (style: string) => {
    if (selectedStyle.includes(style)) {
      setSelectedStyle(selectedStyle.filter(s => s !== style));
    } else {
      setSelectedStyle([...selectedStyle, style]);
    }
  };

  const toggleAvailability = async (timeSlot: string) => {
    if (!profile) return;
    
    let updatedAvailability;
    if (profile.availability.includes(timeSlot)) {
      updatedAvailability = profile.availability.filter(t => t !== timeSlot);
    } else {
      updatedAvailability = [...profile.availability, timeSlot];
    }
    await updateProfile({ availability: updatedAvailability });
  };

  // Fonction pour calculer l'âge
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Fonction pour gérer la sélection de date
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const age = calculateAge(selectedDate);
      
      // Vérifier la limite de changements de date de naissance
      const today = new Date().toDateString();
      const lastChangeDate = profile?.lastBirthDateChangeDate?.toDateString();
      const changesCount = profile?.birthDateChangesToday || 0;

      if (profile?.dateOfBirth && lastChangeDate === today && changesCount >= 1) {
        Alert.alert(
          "Limite atteinte",
          "Tu peux modifier ta date de naissance seulement 1 fois par jour. Réessaye demain ! 📅",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      // Calculer le nouveau compteur
      const newChangesCount = lastChangeDate === today ? changesCount + 1 : 1;
      
      // Sauvegarder la date de naissance
      updateProfile({ 
        dateOfBirth: selectedDate,
        age: age,
        lastBirthDateChangeDate: new Date(),
        birthDateChangesToday: newChangesCount
      });
      
      console.log(`✅ Date de naissance mise à jour: ${selectedDate.toLocaleDateString()} (${age} ans)`);
    }
  };

  // Fonction pour ouvrir le date picker
  const openDatePicker = () => {
    // Si l'utilisateur a déjà une date de naissance, montrer la modal de contact support
    if (profile?.dateOfBirth) {
      setShowContactSupportModal(true);
      return;
    }

    // Pour un nouvel utilisateur, permettre de définir la date
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 25);
    setSelectedDate(defaultDate);
    setShowDatePicker(true);
  };

  // Fonction pour contacter le support
  const handleContactSupport = () => {
    const supportUrl = "https://www.nextmate.gg/support/date_de_naissance/";
    console.log(`🔗 Redirection vers: ${supportUrl}`);
    // En production, utiliser Linking.openURL(supportUrl)
    setShowContactSupportModal(false);
  };

  // Fonction pour ouvrir la modal de sélection du sexe
  const openGenderModal = () => {
    // Si l'utilisateur a déjà un sexe défini, montrer la modal de contact support
    if (profile?.gender) {
      setShowContactSupportModal(true);
      return;
    }

    // Pour un nouvel utilisateur, permettre de définir le sexe une seule fois
    setShowGenderModal(true);
  };

  // Fonction pour sauvegarder le sexe
  const handleGenderSelect = async (selectedGender: 'Homme' | 'Femme' | 'Autre') => {
    if (!profile) return;

    const success = await updateProfile({ gender: selectedGender });
    if (success) {
      setShowGenderModal(false);
      console.log(`✅ Sexe mis à jour: ${selectedGender}`);
    }
  };

  // Afficher un loader si le profil charge
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header avec avatar et pseudo */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={handleChangeAvatar}
              >
                <LinearGradient
                  colors={['#FF8E53', '#FF6B35']}
                  style={styles.avatarGradient}
                >
                  {profile?.profilePicture ? (
                    <Image 
                      source={{ uri: profile.profilePicture }} 
                      style={styles.avatarImage} 
                    />
                  ) : (
                    <Ionicons name="person" size={40} color="#FFFFFF" />
                  )}
                  {profile?.isOnline && <View style={styles.onlineIndicator} />}
                </LinearGradient>
              </TouchableOpacity>
              
              {isEditingProfile ? (
                <View style={styles.editingContainer}>
                  <TextInput
                    style={[styles.pseudoInput, { color: colors.text, borderBottomColor: colors.textSecondary }]}
                    value={pseudo}
                    onChangeText={setPseudo}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSavePseudo}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pseudoContainer}>
                  <Text style={[styles.pseudo, { color: colors.text }]}>{pseudo}</Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditingProfile(true)}
                  >
                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF80" />
            </TouchableOpacity>
          </View>

          {/* Ma Biographie */}
          {profile && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Ma Biographie</Text>
                <TouchableOpacity 
                  style={styles.editBioButton}
                  onPress={() => setIsEditingBio(!isEditingBio)}
                >
                  <Ionicons 
                    name={isEditingBio ? "checkmark" : "pencil"} 
                    size={20} 
                    color="#FF8E53" 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.bioSection}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{profile.games?.length || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Jeux</Text>
                  </View>
                  
                  {profile.age ? (
                    <TouchableOpacity 
                      style={styles.statItem}
                      onPress={openDatePicker}
                    >
                      <Text style={[styles.statNumber, { color: colors.text }]}>{profile.age}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ans</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.addAgeButton, { backgroundColor: colors.surface, borderColor: colors.secondary }]}
                      onPress={openDatePicker}
                    >
                      <View style={styles.addAgeContent}>
                        <Ionicons name="gift" size={18} color={colors.secondary} />
                        <Text style={[styles.addAgeText, { color: colors.secondary }]}>Mon âge</Text>
                        <Text style={[styles.addAgeSubtext, { color: colors.textSecondary }]}>Tap pour ajouter</Text>
                      </View>
                      <View style={[styles.sparkle, { backgroundColor: colors.secondary }]}>
                        <Text style={styles.sparkleText}>✨</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {profile.gender ? (
                    <TouchableOpacity 
                      style={styles.statItem}
                      onPress={openGenderModal}
                    >
                      <Text style={[styles.statNumber, { color: colors.text }]}>
                        {profile.gender === 'Homme' ? '♂️' : 
                         profile.gender === 'Femme' ? '♀️' : 
                         profile.gender === 'Autre' ? '⚧️' : '❓'}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{profile.gender}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.addAgeButton, { backgroundColor: colors.surface, borderColor: colors.secondary }]}
                      onPress={openGenderModal}
                    >
                      <View style={styles.addAgeContent}>
                        <Ionicons name="person" size={18} color={colors.secondary} />
                        <Text style={[styles.addAgeText, { color: colors.secondary }]}>Mon sexe</Text>
                        <Text style={[styles.addAgeSubtext, { color: colors.textSecondary }]}>Tap pour ajouter</Text>
                      </View>
                      <View style={[styles.sparkle, { backgroundColor: colors.secondary }]}>
                        <Text style={styles.sparkleText}>✨</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                
                {isEditingBio ? (
                  <View style={styles.bioEditContainer}>
                    <TextInput
                      style={styles.bioInput}
                      value={bioText}
                      onChangeText={setBioText}
                      placeholder="Raconte-toi ! Quel type de gamer es-tu ? 🎮"
                      placeholderTextColor="#FFFFFF60"
                      multiline
                      numberOfLines={4}
                      maxLength={200}
                      autoFocus
                    />
                    <View style={styles.bioActions}>
                      <Text style={styles.charCount}>{bioText.length}/200</Text>
                      <TouchableOpacity 
                        style={styles.saveBioButton}
                        onPress={handleSaveBio}
                      >
                        <Text style={styles.saveBioText}>Sauvegarder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.bioDisplay}
                    onPress={() => setIsEditingBio(true)}
                  >
                    {profile.bio ? (
                      <Text style={styles.bioText}>
                        "{profile.bio}"
                      </Text>
                    ) : (
                      <Text style={styles.bioPlaceholder}>
                        Raconte-toi ! Quel type de gamer es-tu ? 🎮
                        {'\n'}Appuie ici pour ajouter une biographie
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1950, 0, 1)}
            />
          )}

          {/* Mes Jeux */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎮 Mes Jeux</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setIsGameModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#FF8E53" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.gamesContainer}>
              {profile?.games.map((game) => (
                <TouchableOpacity 
                  key={game.id} 
                  style={[styles.gameCard, { backgroundColor: colors.surface }]}
                  onPress={() => editGame(game)}
                >
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameIcon}>{game.icon}</Text>
                    <View>
                      <Text style={[styles.gameName, { color: colors.text }]}>{game.name}</Text>
                      <Text style={[styles.gameRank, { color: colors.textSecondary }]}>{game.rank}</Text>
                      {game.goals && game.goals.length > 0 && (
                        <Text style={[styles.gameStyle, { color: colors.textSecondary }]}>
                          {game.goals.slice(0, 2).join(', ')}
                          {game.goals.length > 2 && ` +${game.goals.length - 2}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeGame(game.id);
                    }}
                  >
                    <Ionicons name="close" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              
              {profile?.games.length === 0 && (
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⏰ Disponibilité</Text>
            <View style={{ marginBottom: 10 }} />
            <View style={styles.timeSlots}>
              {TIME_SLOTS.map((timeSlot) => (
                <TouchableOpacity
                  key={timeSlot}
                  style={[
                    styles.timeSlot,
                    profile?.availability.includes(timeSlot) && styles.timeSlotActive
                  ]}
                  onPress={() => toggleAvailability(timeSlot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    profile?.availability.includes(timeSlot) && styles.timeSlotTextActive
                  ]}>
                    {timeSlot}
                  </Text>
                </TouchableOpacity>
              ))}
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
                data={POPULAR_GAMES.filter(game => !profile?.games.find(g => g.id === game.id))}
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

        {/* Modal d'édition de jeu - Version Simple */}
        <Modal
          visible={isEditGameModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.simpleModalOverlay}>
            <View style={styles.simpleModalContent}>
              {/* Header */}
              <View style={styles.simpleModalHeader}>
                <Text style={styles.simpleModalTitle}>
                  🎮 {selectedGame?.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsEditGameModalVisible(false)}
                  style={styles.simpleCloseButton}
                >
                  <Ionicons name="close" size={24} color="#FF8E53" />
                </TouchableOpacity>
              </View>

              {/* Contenu */}
              <View style={styles.simpleModalBody}>
                {/* Mon Rang */}
                <View style={styles.simpleSection}>
                  <Text style={styles.simpleSectionTitle}>🏆 Mon Rang</Text>
                  <Text style={styles.simpleSectionSubtitle}>Sélectionne ton niveau actuel</Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.simpleRankScroll}
                  >
                    {(RANKS[selectedGame?.name] || RANKS.Default).map((rank) => (
                      <TouchableOpacity
                        key={rank}
                        style={[
                          styles.simpleRankButton,
                          selectedRank === rank && styles.simpleRankButtonSelected
                        ]}
                        onPress={() => setSelectedRank(rank)}
                      >
                        <Text style={[
                          styles.simpleRankText,
                          selectedRank === rank && styles.simpleRankTextSelected
                        ]}>
                          {rank}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Mon Style */}
                <View style={styles.simpleSection}>
                  <Text style={styles.simpleSectionTitle}>🎯 Mon Style</Text>
                  <Text style={styles.simpleSectionSubtitle}>Comment tu aimes jouer ? (plusieurs choix possible)</Text>
                  
                  <View style={styles.simpleStyleGrid}>
                    {GAME_STYLES.map((style) => (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.simpleStyleButton,
                          selectedStyle.includes(style) && styles.simpleStyleButtonSelected
                        ]}
                        onPress={() => toggleStyle(style)}
                      >
                        <Text style={[
                          styles.simpleStyleText,
                          selectedStyle.includes(style) && styles.simpleStyleTextSelected
                        ]}>
                          {style}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bouton Sauvegarder */}
                <TouchableOpacity 
                  style={styles.simpleSaveButton}
                  onPress={saveGameDetails}
                >
                  <Text style={styles.simpleSaveButtonText}>✅ Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Contact Support */}
        <Modal
          visible={showContactSupportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowContactSupportModal(false)}
        >
          <View style={styles.supportModalOverlay}>
            <View style={styles.supportModalContent}>
              {/* Header */}
              <View style={styles.supportModalHeader}>
                <Text style={styles.supportModalTitle}>🔒 Modification impossible</Text>
                <TouchableOpacity 
                  style={styles.supportCloseButton}
                  onPress={() => setShowContactSupportModal(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF80" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.supportModalBody}>
                <View style={styles.supportIconContainer}>
                  <Ionicons name="shield-checkmark" size={48} color="#FF8E53" />
                </View>
                
                <Text style={styles.supportMainText}>
                  Pour des raisons de sécurité, votre date de naissance ne peut pas être modifiée directement.
                </Text>
                
                <Text style={styles.supportSubText}>
                  Notre équipe support est là pour vous aider si vous avez fait une erreur ou si votre situation a changé.
                </Text>

                <View style={styles.supportButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.supportCancelButton}
                    onPress={() => setShowContactSupportModal(false)}
                  >
                    <Text style={styles.supportCancelButtonText}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.supportContactButton}
                    onPress={handleContactSupport}
                  >
                    <Ionicons name="mail" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.supportContactButtonText}>Contacter le support</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Sélection Sexe */}
        <Modal
          visible={showGenderModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={styles.genderModalOverlay}>
            <View style={styles.genderModalContent}>
              {/* Header */}
              <View style={styles.genderModalHeader}>
                <Text style={styles.genderModalTitle}>👤 Mon sexe</Text>
                <TouchableOpacity 
                  style={styles.genderCloseButton}
                  onPress={() => setShowGenderModal(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF80" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.genderModalBody}>
                <Text style={styles.genderMainText}>
                  Cette information nous aide à mieux vous mettre en relation avec d'autres gamers.
                </Text>
                
                <Text style={styles.genderSubText}>
                  ⚠️ Une fois défini, vous devrez contacter le support pour modifier cette information.
                </Text>

                <View style={styles.genderOptionsContainer}>
                  <TouchableOpacity 
                    style={styles.genderOption}
                    onPress={() => handleGenderSelect('Homme')}
                  >
                    <Text style={styles.genderEmoji}>♂️</Text>
                    <Text style={styles.genderOptionText}>Homme</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.genderOption}
                    onPress={() => handleGenderSelect('Femme')}
                  >
                    <Text style={styles.genderEmoji}>♀️</Text>
                    <Text style={styles.genderOptionText}>Femme</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.genderOption}
                    onPress={() => handleGenderSelect('Autre')}
                  >
                    <Text style={styles.genderEmoji}>⚧️</Text>
                    <Text style={styles.genderOptionText}>Autre</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: '#2F0C4D',
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: '80%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
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
  profileDetailsButton: {
    padding: 5,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  profileSummary: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  bioPreview: {
    color: '#FFFFFF80',
    fontSize: 14,
    marginBottom: 10,
  },
  personalityPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  traitTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 5,
  },
  traitText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  moreTraits: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  viewFullProfileButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    gap: 5,
  },
  viewFullProfileText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameStyle: {
    color: '#FFFFFF80',
    fontSize: 11,
    marginTop: 2,
  },
  editGameContent: {
    flex: 1,
    padding: 20,
    maxHeight: 600,
  },
  editSection: {
    marginBottom: 30,
  },
  editSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ranksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rankChip: {
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  rankChipSelected: {
    backgroundColor: '#FF8E53',
    borderColor: '#FF8E53',
  },
  rankChipText: {
    color: '#FFFFFF80',
    fontSize: 14,
    fontWeight: '500',
  },
  rankChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleChip: {
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  styleChipSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  styleChipText: {
    color: '#FFFFFF80',
    fontSize: 14,
    fontWeight: '500',
  },
  styleChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveGameButton: {
    backgroundColor: '#FF8E53',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveGameButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Nouveaux styles simples pour la modal
  simpleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 12, 77, 0.9)', // Violet foncé transparent
    justifyContent: 'flex-end',
  },
  simpleModalContent: {
    backgroundColor: '#2F0C4D', // Violet foncé NextMate
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    minHeight: '60%',
    borderTopWidth: 3,
    borderTopColor: '#FF8E53', // Bordure orange
  },
  simpleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF20',
  },
  simpleModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texte blanc
  },
  simpleCloseButton: {
    padding: 5,
  },
  simpleModalBody: {
    padding: 20,
    paddingTop: 10,
  },
  simpleSection: {
    marginBottom: 25,
  },
  simpleSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texte blanc
    marginBottom: 5,
  },
  simpleSectionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF80', // Texte blanc semi-transparent
    marginBottom: 15,
  },
  simpleRankScroll: {
    marginBottom: 10,
  },
  simpleRankButton: {
    backgroundColor: '#FFFFFF20', // Fond semi-transparent blanc
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF40', // Bordure blanche semi-transparente
  },
  simpleRankButtonSelected: {
    backgroundColor: '#FF8E53', // Orange NextMate
    borderColor: '#FF8E53',
  },
  simpleRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF80', // Texte blanc semi-transparent
  },
  simpleRankTextSelected: {
    color: '#FFFFFF', // Texte blanc quand sélectionné
  },
  simpleStyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  simpleStyleButton: {
    backgroundColor: '#FFFFFF20', // Fond semi-transparent blanc
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF40', // Bordure blanche semi-transparente
    minWidth: '45%',
    alignItems: 'center',
  },
  simpleStyleButtonSelected: {
    backgroundColor: '#6B46C1', // Violet NextMate
    borderColor: '#6B46C1',
  },
  simpleStyleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF80', // Texte blanc semi-transparent
  },
  simpleStyleTextSelected: {
    color: '#FFFFFF', // Texte blanc quand sélectionné
  },
  simpleSaveButton: {
    backgroundColor: '#FF8E53', // Orange NextMate pour le bouton principal
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  simpleSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour la section biographie
  bioSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bioText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 15,
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8E53',
  },
  bioPlaceholder: {
    color: '#FFFFFF60',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  editBioButton: {
    padding: 5,
  },
  bioEditContainer: {
    marginTop: 15,
  },
  bioInput: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: '#FF8E53',
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#FF8E53',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  charCount: {
    color: '#FFFFFF60',
    fontSize: 12,
  },
  saveBioButton: {
    backgroundColor: '#FF8E53',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBioText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bioDisplay: {
    marginTop: 15,
    minHeight: 60,
    justifyContent: 'center',
  },
  logoutButton: {
    padding: 5,
  },
  addAgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FF8E53',
    gap: 6,
  },
  addAgeText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '600',
  },
  addAgeContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  addAgeSubtext: {
    color: '#FFFFFF80',
    fontSize: 12,
  },
  sparkle: {
    backgroundColor: '#FF8E53',
    borderRadius: 10,
    padding: 2,
  },
  sparkleText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  // Styles pour la modal de contact support
  supportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 12, 77, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  supportModalContent: {
    backgroundColor: '#2F0C4D',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FF8E53',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  supportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF20',
  },
  supportModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supportCloseButton: {
    padding: 5,
  },
  supportModalBody: {
    padding: 20,
    paddingTop: 10,
  },
  supportIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  supportMainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  supportSubText: {
    color: '#FFFFFF80',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  supportButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  supportCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  supportCancelButtonText: {
    color: '#FFFFFF80',
    fontSize: 16,
    fontWeight: '600',
  },
  supportContactButton: {
    flex: 1,
    backgroundColor: '#FF8E53',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF8E53',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  supportContactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour la modal de sélection du sexe
  genderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 12, 77, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  genderModalContent: {
    backgroundColor: '#2F0C4D',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FF8E53',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  genderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF20',
  },
  genderModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  genderCloseButton: {
    padding: 5,
  },
  genderModalBody: {
    padding: 20,
    paddingTop: 10,
  },
  genderMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  genderSubText: {
    color: '#FF8E53',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 18,
    fontWeight: '600',
  },
  genderOptionsContainer: {
    gap: 15,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
  },
  genderEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  genderOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
