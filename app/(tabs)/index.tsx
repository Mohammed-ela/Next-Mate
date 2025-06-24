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
// Removed invalid import - Game type defined locally
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import ImageService from '../../services/imageService';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { profile, updateProfile, loading } = useUserProfile();
  const { colors, isDarkMode } = useTheme();
  // const { syncAvatars } = useConversations(); // Fonction supprimée dans l'optimisation
  const { games, timeSlots, gameRanks, gameStyles, loading: configLoading } = useAppConfig();
  
  // États existants
  const [isGameModalVisible, setIsGameModalVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pseudo, setPseudo] = useState(profile?.pseudo || 'Chargement...');

  // Nouveaux états pour l'édition des jeux
  const [isEditGameModalVisible, setIsEditGameModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string[]>([]);

  // Nouveaux états pour bio et avatar
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(profile?.bio || '');

  // États pour la date de naissance
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // États pour validation du pseudo
  const [pseudoValidation, setPseudoValidation] = useState<{
    isValid: boolean;
    message: string;
    color: string;
  } | null>(null);

  // Mettre à jour les states locaux quand le profil change
  useEffect(() => {
    if (profile?.pseudo) {
      setPseudo(profile.pseudo);
    }
    if (profile?.bio !== undefined) {
      setBioText(profile.bio || '');
    }
  }, [profile?.pseudo, profile?.bio]);

  // Réinitialiser la validation quand on arrête d'éditer le pseudo
  useEffect(() => {
    if (!isEditingProfile) {
      setPseudoValidation(null);
      if (profile?.pseudo) {
        setPseudo(profile.pseudo);
      }
    }
  }, [isEditingProfile, profile?.pseudo]);

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
    if (!profile || !pseudo.trim()) {
      setIsEditingProfile(false);
      return;
    }

    const trimmedPseudo = pseudo.trim();

    // Validation longueur
    if (trimmedPseudo.length < 2) {
      Alert.alert(
        "❌ Pseudo trop court",
        "Ton pseudo doit contenir au moins 2 caractères.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (trimmedPseudo.length > 10) {
      Alert.alert(
        "❌ Pseudo trop long",
        "Ton pseudo ne peut pas dépasser 10 caractères.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    // Validation caractères autorisés (lettres, chiffres, espaces, tirets, underscores)
    const validPseudoRegex = /^[a-zA-Z0-9\s\-_À-ÿ]+$/;
    if (!validPseudoRegex.test(trimmedPseudo)) {
      Alert.alert(
        "❌ Caractères non autorisés",
        "Ton pseudo ne peut contenir que des lettres, chiffres, espaces, tirets et underscores.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    // Vérifier limite de changements (1 fois par semaine)
    const today = new Date();
    const lastChangeDate = profile.lastPseudoChangeDate;
    const daysSinceChange = lastChangeDate ? 
      Math.floor((today.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      Infinity;

    if (profile.pseudo && daysSinceChange < 7) {
      const remainingDays = 7 - daysSinceChange;
      Alert.alert(
        "🔒 Limite atteinte",
        `Tu peux changer ton pseudo seulement une fois par semaine.\n\nProchaine modification possible dans ${remainingDays} jour${remainingDays > 1 ? 's' : ''}.`,
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    // Si pas de changement, juste fermer l'édition
    if (trimmedPseudo === profile.pseudo) {
      setIsEditingProfile(false);
      return;
    }

    try {
      const success = await updateProfile({ 
        pseudo: trimmedPseudo,
        lastPseudoChangeDate: new Date()
      });
      
      if (success) {
        console.log('✅ Pseudo mis à jour:', trimmedPseudo);
        Alert.alert(
          "✅ Pseudo modifié",
          `Ton pseudo a été changé pour "${trimmedPseudo}".\n\nProchaine modification possible dans 7 jours.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert(
          "❌ Erreur",
          "Impossible de modifier le pseudo. Réessaye plus tard.",
          [{ text: "OK", style: "default" }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde pseudo:', error);
      Alert.alert(
        "❌ Erreur inattendue",
        "Une erreur s'est produite. Vérifiez votre connexion et réessayez.",
        [{ text: "OK", style: "default" }]
      );
    }
    
    setIsEditingProfile(false);
  };

  // Fonction de validation du pseudo en temps réel
  const validatePseudo = (text: string) => {
    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
      setPseudoValidation(null);
      return;
    }

    if (trimmed.length < 2) {
      setPseudoValidation({
        isValid: false,
        message: `${trimmed.length}/10 - Trop court (min. 2)`,
        color: '#FF6B6B'
      });
      return;
    }

    if (trimmed.length > 10) {
      setPseudoValidation({
        isValid: false,
        message: `${trimmed.length}/10 - Trop long !`,
        color: '#FF6B6B'
      });
      return;
    }

    const validPseudoRegex = /^[a-zA-Z0-9\s\-_À-ÿ]+$/;
    if (!validPseudoRegex.test(trimmed)) {
      setPseudoValidation({
        isValid: false,
        message: `${trimmed.length}/10 - Caractères interdits`,
        color: '#FF6B6B'
      });
      return;
    }

    // Vérification si changement nécessaire
    if (trimmed === profile?.pseudo) {
      setPseudoValidation({
        isValid: true,
        message: `${trimmed.length}/10 - Aucun changement`,
        color: '#FFA500'
      });
      return;
    }

    // Vérification de la limite de temps
    const today = new Date();
    const lastChangeDate = profile?.lastPseudoChangeDate;
    const daysSinceChange = lastChangeDate ? 
      Math.floor((today.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      Infinity;

    if (profile?.pseudo && daysSinceChange < 7) {
      const remainingDays = 7 - daysSinceChange;
      setPseudoValidation({
        isValid: false,
        message: `${trimmed.length}/10 - Changement dans ${remainingDays}j`,
        color: '#FF8E53'
      });
      return;
    }

    setPseudoValidation({
      isValid: true,
      message: `${trimmed.length}/10 - Prêt à sauvegarder ✅`,
      color: '#4CAF50'
    });
  };

  // Gérer le changement du pseudo avec validation
  const handlePseudoChange = (text: string) => {
    setPseudo(text);
    validatePseudo(text);
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
        Alert.alert(
          "🚫 Permission refusée", 
          "L'accès à la galerie photo est nécessaire pour changer votre avatar.",
          [{ text: "OK", style: "default" }],
          { userInterfaceStyle: 'dark' }
        );
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
        const localUri = pickerResult.assets[0].uri;
        
        // Afficher un indicateur de chargement
        // La sauvegarde est maintenant gérée par des toasts dans ImageService
        
        // Sauvegarder l'image (mode local pour le développement)
        const imageUrl = await ImageService.replaceImage(
          localUri,
          profile?.profilePicture,
          user?.uid || '',
          'avatar'
        );
        
        if (imageUrl) {
          // Calculer le nouveau compteur
          const newChangesCount = lastChangeDate === today ? changesCount + 1 : 1;
          
          const success = await updateProfile({ 
            profilePicture: imageUrl, // URI locale pour le développement
            lastAvatarChangeDate: new Date(),
            avatarChangesToday: newChangesCount
          });
          
          if (success) {
            console.log(`✅ Avatar mis à jour en mode local (${newChangesCount}/2 aujourd'hui)`);
            // Le toast est déjà géré par ImageService, pas besoin d'Alert ici
            
            // 🔄 Synchronisation des avatars supprimée dans l'optimisation
            // try {
            //   await syncAvatars();
            //   console.log('🔄 Conversations synchronisées après changement d\'avatar');
            // } catch (syncError) {
            //   console.warn('⚠️ Erreur synchronisation conversations:', syncError);
            // }
          }
        } else {
          Alert.alert(
            "❌ Erreur", 
            "Impossible de sauvegarder l'image.",
            [{ text: "OK", style: "default" }],
            { userInterfaceStyle: 'dark' }
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      Alert.alert(
        "❌ Erreur", 
        "Impossible de changer l'avatar.",
        [{ text: "OK", style: "default" }],
        { userInterfaceStyle: 'dark' }
      );
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
    console.log('🎮 Édition jeu:', game);
    console.log('📊 GameRanks disponibles:', gameRanks);
    console.log('🎨 GameStyles disponibles:', gameStyles);
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

  const toggleAvailability = async (timeSlot: any) => {
    if (!profile) return;
    
    // TimeSlot est un objet avec { id, label, startTime, endTime, isPopular }
    const timeSlotLabel = timeSlot.label;
    const currentAvailability = profile.availability || [];
    
    // Vérifier si le créneau est déjà sélectionné
    const isSelected = currentAvailability.some((slot: any) => 
      (typeof slot === 'string' ? slot : slot.label || slot) === timeSlotLabel
    );
    
    const updatedAvailability = isSelected
      ? currentAvailability.filter((slot: any) => 
          (typeof slot === 'string' ? slot : slot.label || slot) !== timeSlotLabel
        )
      : [...currentAvailability, timeSlotLabel];
    
    console.log('🕐 Toggle disponibilité:', { timeSlotLabel, isSelected, updatedAvailability });
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
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Chargement du profil...</Text>
      </View>
    );
  }

  // Si la configuration est en cours de chargement, afficher un loader
  if (configLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement de la configuration...</Text>
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
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF8E53', '#FF6B35']}
                  style={styles.avatarGradient}
                >
                  {profile?.profilePicture ? (
                    // Détecter automatiquement le type d'avatar
                    ImageService.detectAvatarType(profile.profilePicture) === 'emoji' ? (
                      <Text style={styles.avatarEmoji}>{profile.profilePicture}</Text>
                    ) : (
                      <Image 
                        source={{ uri: profile.profilePicture }} 
                        style={styles.avatarImage}
                        defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                      />
                    )
                  ) : (
                    <Ionicons name="person" size={40} color="#FFFFFF" />
                  )}
                  {profile?.isOnline && <View style={[styles.onlineIndicator, styles.onlineIndicatorPulse]} />}
                </LinearGradient>
                {/* Petit indicateur pour montrer que c'est cliquable */}
                <View style={styles.editAvatarHint}>
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              {isEditingProfile ? (
                <View style={styles.editingContainer}>
                  <View style={styles.pseudoInputContainer}>
                    <TextInput
                      style={[
                        styles.pseudoInput, 
                        { 
                          color: colors.text, 
                          borderBottomColor: pseudoValidation?.color || colors.textSecondary,
                          borderBottomWidth: 2
                        }
                      ]}
                      value={pseudo}
                      onChangeText={handlePseudoChange}
                      placeholder="Ton pseudo gaming..."
                      placeholderTextColor={colors.textSecondary}
                      maxLength={10}
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {pseudoValidation && (
                      <Text style={[styles.pseudoValidationText, { color: pseudoValidation.color }]}>
                        {pseudoValidation.message}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.saveButton,
                      { 
                        opacity: pseudoValidation?.isValid === false ? 0.5 : 1,
                        backgroundColor: pseudoValidation?.isValid ? '#4CAF50' : '#FF8E53'
                      }
                    ]}
                    onPress={handleSavePseudo}
                    disabled={pseudoValidation?.isValid === false}
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
                      style={[styles.bioInput, {
                        color: colors.text,
                        backgroundColor: colors.surface
                      }]}
                      value={bioText}
                      onChangeText={setBioText}
                      placeholder="Raconte-toi ! Quel type de gamer es-tu ? 🎮"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                      maxLength={200}
                      autoFocus
                    />
                    <View style={styles.bioActions}>
                      <Text style={[styles.charCount, { color: colors.textSecondary }]}>{bioText.length}/200</Text>
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
                      <Text style={[styles.bioText, { 
                        color: colors.text,
                        backgroundColor: colors.surface 
                      }]}>
                        "{profile.bio.length > 150 
                          ? `${profile.bio.substring(0, 150)}...` 
                          : profile.bio}"
                      </Text>
                    ) : (
                      <Text style={[styles.bioPlaceholder, { 
                        color: colors.textSecondary,
                        backgroundColor: colors.surface,
                        borderColor: colors.border 
                      }]}>
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
                  style={[styles.emptyGameCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setIsGameModalVisible(true)}
                >
                  <Ionicons name="add" size={24} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Ajouter un jeu</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Disponibilités */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⏰ Disponibilité</Text>
            <View style={{ marginBottom: 10 }} />
            <View style={styles.timeSlots}>
              {timeSlots && timeSlots.length > 0 ? timeSlots.map((timeSlot, index) => {
                // TimeSlot est un objet avec { id, label, startTime, endTime, isPopular }
                const timeSlotLabel = timeSlot.label;
                const timeSlotKey = timeSlot.id || `slot-${index}`;
                
                return (
                  <TouchableOpacity
                    key={timeSlotKey}
                    style={[
                      styles.timeSlot,
                      profile?.availability?.some((slot: any) => 
                        (typeof slot === 'string' ? slot : slot.label || slot) === timeSlotLabel
                      ) && styles.timeSlotActive
                    ]}
                    onPress={() => toggleAvailability(timeSlot)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      { color: colors.text },
                      profile?.availability?.some((slot: any) => 
                        (typeof slot === 'string' ? slot : slot.label || slot) === timeSlotLabel
                      ) && styles.timeSlotTextActive
                    ]}>
                      {timeSlotLabel}
                    </Text>
                  </TouchableOpacity>
                );
              }) : (
                <View style={[styles.emptyGameCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {configLoading ? 'Chargement des créneaux...' : 'Aucun créneau disponible'}
                  </Text>
                </View>
              )}
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
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter un jeu</Text>
                <TouchableOpacity 
                  onPress={() => setIsGameModalVisible(false)}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={games.filter(game => !profile?.games.find(g => g.id === game.id))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalGameItem, { borderBottomColor: colors.border }]}
                    onPress={() => addGame(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.gameIcon}>{item.icon}</Text>
                    <View style={styles.modalGameInfo}>
                      <Text style={[styles.modalGameName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.modalGamePlatform, { color: colors.textSecondary }]}>{item.category}</Text>
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
            <View style={[styles.simpleModalContent, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.simpleModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.simpleModalTitle, { color: colors.text }]}>
                  🎮 {selectedGame?.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsEditGameModalVisible(false)}
                  style={styles.simpleCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#FF8E53" />
                </TouchableOpacity>
              </View>

              {/* Contenu */}
              <View style={styles.simpleModalBody}>
                {/* Mon Rang */}
                <View style={styles.simpleSection}>
                  <Text style={[styles.simpleSectionTitle, { color: colors.text }]}>🏆 Mon Rang</Text>
                  <Text style={[styles.simpleSectionSubtitle, { color: colors.textSecondary }]}>Sélectionne ton niveau actuel</Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.simpleRankScroll}
                  >
                    {(gameRanks[selectedGame?.name || ''] || gameRanks['Default'] || []).map((rank: any) => (
                      <TouchableOpacity
                        key={typeof rank === 'string' ? rank : rank.name || rank.id}
                        style={[
                          styles.simpleRankButton,
                          selectedRank === (typeof rank === 'string' ? rank : rank.name || rank.id) && styles.simpleRankButtonSelected
                        ]}
                        onPress={() => setSelectedRank(typeof rank === 'string' ? rank : rank.name || rank.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.simpleRankText,
                          { color: selectedRank === (typeof rank === 'string' ? rank : rank.name || rank.id) ? '#FFFFFF' : colors.textSecondary },
                          selectedRank === (typeof rank === 'string' ? rank : rank.name || rank.id) && styles.simpleRankTextSelected
                        ]}>
                          {typeof rank === 'string' ? rank : rank.name || rank.id}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Mon Style */}
                <View style={styles.simpleSection}>
                  <Text style={[styles.simpleSectionTitle, { color: colors.text }]}>🎯 Mon Style</Text>
                  <Text style={[styles.simpleSectionSubtitle, { color: colors.textSecondary }]}>Comment tu aimes jouer ? (plusieurs choix possible)</Text>
                  
                  <View style={styles.simpleStyleGrid}>
                    {gameStyles.map((style) => {
                      const styleName = typeof style === 'string' ? style : style.name || style.id;
                      const styleKey = typeof style === 'string' ? style : style.id || style.name;
                      
                      return (
                        <TouchableOpacity
                          key={styleKey}
                          style={[
                            styles.simpleStyleButton,
                            selectedStyle.includes(styleName) && styles.simpleStyleButtonSelected
                          ]}
                          onPress={() => toggleStyle(styleName)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.simpleStyleText,
                            { color: selectedStyle.includes(styleName) ? '#FFFFFF' : colors.textSecondary },
                            selectedStyle.includes(styleName) && styles.simpleStyleTextSelected
                          ]}>
                            {styleName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Bouton Sauvegarder */}
                <TouchableOpacity 
                  style={styles.simpleSaveButton}
                  onPress={saveGameDetails}
                  activeOpacity={0.8}
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
            <View style={[styles.supportModalContent, { backgroundColor: colors.card, borderColor: colors.secondary }]}>
              {/* Header */}
              <View style={[styles.supportModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.supportModalTitle, { color: colors.text }]}>🔒 Modification impossible</Text>
                <TouchableOpacity 
                  style={styles.supportCloseButton}
                  onPress={() => setShowContactSupportModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.supportModalBody}>
                <View style={styles.supportIconContainer}>
                  <Ionicons name="shield-checkmark" size={48} color="#FF8E53" />
                </View>
                
                <Text style={[styles.supportMainText, { color: colors.text }]}>
                  Pour des raisons de sécurité, votre date de naissance ne peut pas être modifiée directement.
                </Text>
                
                <Text style={[styles.supportSubText, { color: colors.textSecondary }]}>
                  Notre équipe support est là pour vous aider si vous avez fait une erreur ou si votre situation a changé.
                </Text>

                <View style={styles.supportButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.supportCancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowContactSupportModal(false)}
                  >
                    <Text style={[styles.supportCancelButtonText, { color: colors.textSecondary }]}>Annuler</Text>
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
            <View style={[styles.genderModalContent, { backgroundColor: colors.card, borderColor: colors.secondary }]}>
              {/* Header */}
              <View style={[styles.genderModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.genderModalTitle, { color: colors.text }]}>👤 Mon sexe</Text>
                <TouchableOpacity 
                  style={styles.genderCloseButton}
                  onPress={() => setShowGenderModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.genderModalBody}>
                <Text style={[styles.genderMainText, { color: colors.text }]}>
                  Cette information nous aide à mieux vous mettre en relation avec d'autres gamers.
                </Text>
                
                <Text style={[styles.genderSubText, { color: colors.secondary }]}>
                  ⚠️ Une fois défini, vous devrez contacter le support pour modifier cette information.
                </Text>

                <View style={styles.genderOptionsContainer}>
                  <TouchableOpacity 
                    style={[styles.genderOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleGenderSelect('Homme')}
                  >
                    <Text style={styles.genderEmoji}>♂️</Text>
                    <Text style={[styles.genderOptionText, { color: colors.text }]}>Homme</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.genderOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleGenderSelect('Femme')}
                  >
                    <Text style={styles.genderEmoji}>♀️</Text>
                    <Text style={[styles.genderOptionText, { color: colors.text }]}>Femme</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.genderOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleGenderSelect('Autre')}
                  >
                    <Text style={styles.genderEmoji}>⚧️</Text>
                    <Text style={[styles.genderOptionText, { color: colors.text }]}>Autre</Text>
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
    alignItems: 'flex-start',
    flex: 1,
  },
  pseudoInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  pseudoInput: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 150,
  },
  pseudoValidationText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF8E53',
    borderRadius: 20,
    padding: 8,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pseudoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pseudo: {
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
    fontSize: 16,
    fontWeight: '600',
  },
  gameRank: {
    fontSize: 14,
  },
  removeButton: {
    padding: 5,
  },
  emptyGameCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
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
    fontSize: 14,
  },
  timeSlotTextActive: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 12, 77, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 25,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 12, 77, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: '#2F0C4D',
    borderRadius: 25,
    width: '95%',
    maxWidth: 420,
    maxHeight: '85%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 83, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalGameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalGameInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalGameName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalGamePlatform: {
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
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
    backgroundColor: 'rgba(47, 12, 77, 0.92)',
    justifyContent: 'flex-end',
  },
  simpleModalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    minHeight: '65%',
    borderTopWidth: 4,
    borderTopColor: '#FF8E53',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 30,
  },
  simpleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255, 142, 83, 0.05)',
  },
  simpleModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  simpleCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
  },
  simpleModalBody: {
    padding: 25,
    paddingTop: 15,
  },
  simpleSection: {
    marginBottom: 30,
  },
  simpleSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  simpleSectionSubtitle: {
    fontSize: 15,
    marginBottom: 18,
    lineHeight: 22,
  },
  simpleRankScroll: {
    marginBottom: 15,
  },
  simpleRankButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleRankButtonSelected: {
    backgroundColor: '#FF8E53',
    borderColor: '#FF8E53',
    shadowColor: '#FF8E53',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  simpleRankText: {
    fontSize: 15,
    fontWeight: '600',
  },
  simpleRankTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  simpleStyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  simpleStyleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleStyleButtonSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  simpleStyleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  simpleStyleTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  simpleSaveButton: {
    backgroundColor: '#FF8E53',
    padding: 20,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF8E53',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  simpleSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    fontSize: 16,
    lineHeight: 24,
    marginTop: 15,
    fontStyle: 'italic',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8E53',
  },
  bioPlaceholder: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  editBioButton: {
    padding: 5,
  },
  bioEditContainer: {
    marginTop: 15,
  },
  bioInput: {
    fontSize: 16,
    lineHeight: 24,
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
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
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
  },
  supportModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  supportSubText: {
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
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
  },
  supportCancelButtonText: {
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
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
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
  },
  genderModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  genderCloseButton: {
    padding: 5,
  },
  genderModalBody: {
    padding: 20,
    paddingTop: 10,
  },
  genderMainText: {
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
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
  },
  genderEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarEmoji: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  editAvatarHint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicatorPulse: {
    backgroundColor: '#4CAF50',
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
