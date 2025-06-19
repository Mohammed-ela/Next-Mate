import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';

// 🎮 Interface pour les utilisateurs de la plateforme
export interface PlatformUser {
  id: string;
  name: string;
  avatar: string;
  isImageAvatar?: boolean; // Indique si l'avatar est une image ou un emoji
  age?: number;
  games: string[];
  availability: string[];
  bio?: string;
  distance?: number;
  isOnline: boolean;
  matchPercentage?: number;
  location?: string;
  currentlyPlaying?: string;
  profileComplete: boolean;
}

// 🔍 Récupérer les utilisateurs de la plateforme pour la découverte
export const getDiscoveryUsers = async (
  currentUserId: string, 
  maxUsers: number = 10,
  currentUserGames: string[] = []
): Promise<PlatformUser[]> => {
  try {
    console.log('🔍 Récupération des utilisateurs pour la découverte...');
    
    // Query pour récupérer les utilisateurs (excluant l'utilisateur actuel)
    const usersQuery = query(
      collection(db, 'users'),
      // where('profileComplete', '==', true), // Temporairement commenté pour récupérer tous les users
      // orderBy('lastSeen', 'desc'), // Temporairement commenté en attendant l'index
      limit(maxUsers + 5) // On prend plus pour filtrer ensuite
    );

    const snapshot = await getDocs(usersQuery);
    const users: PlatformUser[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Exclure l'utilisateur actuel
      if (doc.id === currentUserId) return;
      
      // Calculer la distance aléatoire (en attendant la géolocalisation)
      const distance = Math.floor(Math.random() * 50) + 1;
      
      // Calculer le pourcentage de match basé sur les jeux en commun avec l'utilisateur actuel
      const matchPercentage = calculateMatchPercentage(data.games || [], currentUserGames);
      
      // Gérer l'avatar - utiliser la photo de profil si disponible
      let userAvatar = '🎮'; // Avatar par défaut
      let isImageAvatar = false;
      
      // Prioriser la photo de profil (même si c'est file:///)
      if (data.profilePicture) {
        userAvatar = data.profilePicture;
        isImageAvatar = true;
      }
      // Sinon, utiliser l'avatar classique
      else if (data.avatar) {
        userAvatar = data.avatar;
        isImageAvatar = !data.avatar.match(/^[\u{1F000}-\u{1F9FF}]$/u); // Détecter si c'est un emoji
      }
      // Sinon, essayer d'utiliser l'icône du premier jeu
      else if (Array.isArray(data.games) && data.games.length > 0) {
        const firstGame = data.games[0];
        if (typeof firstGame === 'object' && firstGame.icon) {
          userAvatar = firstGame.icon;
        }
      }

      const user: PlatformUser = {
        id: doc.id,
        name: data.pseudo || data.displayName || `Gamer_${doc.id.slice(0, 6)}`,
        avatar: userAvatar,
        isImageAvatar,
        age: data.age,
        games: Array.isArray(data.games) 
          ? data.games.map(game => typeof game === 'string' ? game : game.name || game.id)
          : [],
        availability: data.availability || [],
        bio: data.bio || 'Aucune bio renseignée',
        distance: data.distance || undefined,
        isOnline: data.isOnline || false,
        matchPercentage,
        location: data.location,
        currentlyPlaying: data.currentlyPlaying,
        profileComplete: data.profileComplete || false,
      };
      
      users.push(user);
    });

    // Trier par pourcentage de match décroissant
    const sortedUsers = users.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    
    // Limiter au nombre demandé
    const limitedUsers = sortedUsers.slice(0, maxUsers);
    
    console.log(`✅ ${limitedUsers.length} utilisateurs récupérés pour la découverte`);
    return limitedUsers;
    
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    
    // En cas d'erreur, retourner des utilisateurs de fallback
    return generateFallbackUsers(maxUsers);
  }
};

// 🎯 Calculer le pourcentage de match basé sur les jeux
const calculateMatchPercentage = (userGames: string[], currentUserGames: string[]): number => {
  // Si pas de jeux de l'utilisateur actuel, utiliser les jeux populaires
  const referenceGames = currentUserGames.length > 0 ? currentUserGames : 
    ['Valorant', 'League of Legends', 'CS2', 'FIFA', 'Fortnite', 'Rocket League'];
  
  if (!userGames || userGames.length === 0) {
    return 60 + Math.floor(Math.random() * 20); // 60-80% par défaut
  }
  
  // Calculer les jeux en commun
  const commonGames = userGames.filter(game => referenceGames.includes(game));
  
  if (commonGames.length === 0) {
    return 50 + Math.floor(Math.random() * 20); // 50-70% si aucun jeu en commun
  }
  
  // Calcul basé sur le nombre de jeux en commun
  const baseMatch = Math.min(commonGames.length * 20, 80); // 20% par jeu commun, max 80%
  const randomBonus = Math.floor(Math.random() * 15); // Bonus aléatoire 0-15%
  
  return Math.min(baseMatch + randomBonus + 5, 100); // Minimum 5%, maximum 100%
};

// 🎮 Avatars gaming aléatoires
const getRandomGamingAvatar = (): string => {
  const avatars = ['🎮', '⚔️', '🔫', '⚽', '🏎️', '🎯', '🏆', '🎲', '🕹️', '🎪', '🎭', '🎨', '🎸', '🎤', '🎧'];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

// 🆘 Utilisateurs de fallback en cas d'erreur Firestore
const generateFallbackUsers = (count: number): PlatformUser[] => {
  const names = [
    'ProGamer_Alex', 'Sarah_FPS', 'Mike_Legend', 'Luna_Gaming', 'Zex_Master',
    'Nina_Clutch', 'Tom_Noob', 'Eva_Pro', 'Max_Beast', 'Lily_Gamer'
  ];
  
  const games = ['Valorant', 'League of Legends', 'CS2', 'FIFA', 'Fortnite', 'Rocket League'];
  const times = ['9h-12h', '12h-15h', '15h-18h', '18h-21h', '21h-00h', 'Week-end'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `fallback_${Date.now()}_${index}`,
    name: names[index % names.length],
    avatar: getRandomGamingAvatar(),
    age: 18 + Math.floor(Math.random() * 12),
    games: games.slice(0, 1 + Math.floor(Math.random() * 3)),
    availability: times.slice(0, 1 + Math.floor(Math.random() * 2)),
    bio: 'Utilisateur de la plateforme NextMate ! 🎮',
    distance: Math.floor(Math.random() * 50) + 1,
    isOnline: Math.random() > 0.3,
    matchPercentage: 60 + Math.floor(Math.random() * 40),
    profileComplete: true,
  }));
};

// 🔍 Rechercher des utilisateurs par nom ou jeu
export const searchUsers = async (searchTerm: string, currentUserId: string): Promise<PlatformUser[]> => {
  try {
    console.log('🔍 Recherche utilisateurs:', searchTerm);
    
    // Pour l'instant, on récupère tous les utilisateurs et on filtre côté client
    // En production, utiliser des index de recherche comme Algolia
    const allUsers = await getDiscoveryUsers(currentUserId, 50);
    
    const filteredUsers = allUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.games.some(game => game.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return filteredUsers.slice(0, 10);
    
  } catch (error) {
    console.error('❌ Erreur recherche utilisateurs:', error);
    return [];
  }
};

// 📊 Obtenir les statistiques de la plateforme
export const getPlatformStats = async (): Promise<{ totalUsers: number; onlineUsers: number }> => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const snapshot = await getDocs(usersQuery);
    
    let totalUsers = 0;
    let onlineUsers = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalUsers++;
      if (data.isOnline) onlineUsers++;
    });
    
    return { totalUsers, onlineUsers };
    
  } catch (error) {
    console.error('❌ Erreur stats plateforme:', error);
    return { totalUsers: 0, onlineUsers: 0 };
  }
}; 