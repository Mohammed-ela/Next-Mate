import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Mate {
  id: string;
  name: string;
  avatar: string;
  age: number;
  games: string[];
  availability: string[];
  bio: string;
  distance: number;
  isOnline: boolean;
  matchPercentage: number;
}

const AVAILABLE_GAMES = ['Valorant', 'League of Legends', 'CS2', 'FIFA', 'Fortnite', 'Rocket League', 'Overwatch', 'Call of Duty', 'Apex Legends', 'PUBG'];
const AVAILABLE_TIMES = ['9h-12h', '12h-15h', '15h-18h', '18h-21h', '21h-00h', 'Week-end'];
const GAMING_AVATARS = ['🎮', '⚔️', '🔫', '⚽', '🏎️', '🎯', '🏆', '🎲', '🕹️', '🎪'];
const GAMING_NAMES = [
  'ProGamer_Alex', 'Sarah_FPS', 'Mike_Legend', 'Luna_Gaming', 'Zex_Master',
  'Nina_Clutch', 'Tom_Noob', 'Eva_Pro', 'Max_Beast', 'Lily_Gamer',
  'Jake_Sniper', 'Amy_Carry', 'Leo_Tank', 'Zoe_Support', 'Sam_Rusher'
];

const generateRandomMate = (id: string): Mate => {
  const name = GAMING_NAMES[Math.floor(Math.random() * GAMING_NAMES.length)];
  const avatar = GAMING_AVATARS[Math.floor(Math.random() * GAMING_AVATARS.length)];
  const age = 18 + Math.floor(Math.random() * 12); // 18-30 ans
  
  // 1-4 jeux aléatoires
  const gameCount = 1 + Math.floor(Math.random() * 4);
  const games = Array.from({ length: gameCount }, () => 
    AVAILABLE_GAMES[Math.floor(Math.random() * AVAILABLE_GAMES.length)]
  ).filter((game, index, arr) => arr.indexOf(game) === index);
  
  // 1-3 créneaux aléatoires
  const availabilityCount = 1 + Math.floor(Math.random() * 3);
  const availability = Array.from({ length: availabilityCount }, () => 
    AVAILABLE_TIMES[Math.floor(Math.random() * AVAILABLE_TIMES.length)]
  ).filter((time, index, arr) => arr.indexOf(time) === index);
  
  const bios = [
    'Toujours prêt pour une partie ! 🎮',
    'Je cherche des teammates sérieux',
    'Gaming addict depuis toujours',
    'On fait du ranked ensemble ?',
    'Team player avant tout 💪',
    'Disponible pour du tryhard',
    'Chill gaming et fun garanti',
    'Pro player en devenir 🏆'
  ];
  
  return {
    id,
    name,
    avatar,
    age,
    games,
    availability,
    bio: bios[Math.floor(Math.random() * bios.length)],
    distance: 1 + Math.floor(Math.random() * 50), // 1-50 km
    isOnline: Math.random() > 0.3, // 70% chance d'être en ligne
    matchPercentage: 60 + Math.floor(Math.random() * 40), // 60-100%
  };
};

export default function Trouve1MateScreen() {
  const [dailyMates, setDailyMates] = useState<Mate[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Générer 10 mates aléatoires
  const generateDailyMates = () => {
    const mates = Array.from({ length: 10 }, (_, index) => 
      generateRandomMate(`mate_${Date.now()}_${index}`)
    );
    setDailyMates(mates);
  };

  useEffect(() => {
    generateDailyMates();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      generateDailyMates();
      setRefreshing(false);
    }, 1000);
  };

  const connectToMate = (mate: Mate) => {
    Alert.alert(
      'Connexion',
      `Voulez-vous envoyer une demande de mate à ${mate.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Envoyer', 
          onPress: () => {
            Alert.alert('✅ Demande envoyée !', `Votre demande a été envoyée à ${mate.name}`);
          }
        }
      ]
    );
  };

  const openProfile = (mate: Mate) => {
    Alert.alert('Profil', `Affichage du profil de ${mate.name}`);
  };

  const renderMateCard = ({ item }: { item: Mate }) => (
    <View style={styles.mateCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.cardGradient}
      >
        {/* Header avec avatar et infos */}
        <View style={styles.mateHeader}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: item.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)' }]}>
              <Text style={styles.avatarEmoji}>{item.avatar}</Text>
            </View>
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.mateInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.mateName}>{item.name}</Text>
              <Text style={styles.mateAge}>{item.age} ans</Text>
            </View>
            <Text style={styles.mateDistance}>📍 {item.distance} km</Text>
            <View style={styles.matchContainer}>
              <Text style={styles.matchText}>{item.matchPercentage}% match</Text>
              <View style={styles.matchBar}>
                <View style={[styles.matchFill, { width: `${item.matchPercentage}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Bio */}
        <Text style={styles.mateBio}>{item.bio}</Text>

        {/* Jeux */}
        <View style={styles.gamesSection}>
          <Text style={styles.sectionLabel}>🎮 Jeux favoris</Text>
          <View style={styles.gamesList}>
            {item.games.map((game, index) => (
              <View key={index} style={styles.gameTag}>
                <Text style={styles.gameText}>{game}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disponibilités */}
        <View style={styles.availabilitySection}>
          <Text style={styles.sectionLabel}>⏰ Disponibilités</Text>
          <View style={styles.timesList}>
            {item.availability.map((time, index) => (
              <View key={index} style={styles.timeTag}>
                <Text style={styles.timeText}>{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => openProfile(item)}
          >
            <Ionicons name="person" size={20} color="#FFFFFF80" />
            <Text style={styles.profileText}>Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => connectToMate(item)}
          >
            <LinearGradient
              colors={['#FF8E53', '#FF6B35']}
              style={styles.connectGradient}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.connectText}>Connect</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2F0C4D', '#471573']}
        style={styles.gradient}
      >
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarPlaceholder} />
          
          <View style={styles.titleContainer}>
            <Text style={styles.toolbarTitle}>T1M</Text>
            <Text style={styles.toolbarSubtitle}>Trouve1Mate</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Info du jour */}
        <View style={styles.dailyInfo}>
          <Text style={styles.dailyText}>🎯 10 nouveaux mates aujourd'hui</Text>
          <Text style={styles.dailySubtext}>Sélection personnalisée pour vous</Text>
        </View>

        {/* Liste des mates */}
        <FlatList
          data={dailyMates}
          keyExtractor={(item) => item.id}
          renderItem={renderMateCard}
          style={styles.matesList}
          contentContainerStyle={styles.matesContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  toolbarButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarPlaceholder: {
    width: 48,
    height: 48,
  },
  titleContainer: {
    alignItems: 'center',
  },
  toolbarTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  toolbarSubtitle: {
    color: '#FFFFFF80',
    fontSize: 12,
    marginTop: 2,
  },
  dailyInfo: {
    backgroundColor: 'rgba(255, 142, 83, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 83, 0.3)',
  },
  dailyText: {
    color: '#FF8E53',
    fontSize: 16,
    fontWeight: '600',
  },
  dailySubtext: {
    color: '#FFFFFF80',
    fontSize: 12,
    marginTop: 4,
  },
  matesList: {
    flex: 1,
  },
  matesContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mateCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  mateHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarSection: {
    position: 'relative',
    marginRight: 15,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#2F0C4D',
  },
  mateInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mateName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mateAge: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  mateDistance: {
    color: '#FFFFFF60',
    fontSize: 14,
    marginTop: 4,
  },
  matchContainer: {
    marginTop: 8,
  },
  matchText: {
    color: '#FF8E53',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchFill: {
    height: '100%',
    backgroundColor: '#FF8E53',
  },
  mateBio: {
    color: '#FFFFFF90',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 20,
  },
  gamesSection: {
    marginBottom: 15,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  gamesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gameTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gameText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  availabilitySection: {
    marginBottom: 20,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  profileText: {
    color: '#FFFFFF80',
    fontSize: 14,
    fontWeight: '500',
  },
  connectButton: {
    flex: 1,
    borderRadius: 12,
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 