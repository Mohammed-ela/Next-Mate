import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// 🎮 Types pour le profil NextMate Gaming
interface UserProfile {
  uid: string;
  email: string;
  pseudo: string;
  bio?: string;
  age?: number;
  gender?: 'Homme' | 'Femme' | 'Autre';
  dateOfBirth?: Date;
  location?: string;
  games: GameProfile[];
  availability: AvailabilitySlot[];
  preferences: UserPreferences;
  gamingStyle: GamingStyle;
  profilePicture?: string;
  isOnline: boolean;
  currentlyPlaying?: string; // Jeu en cours
  lastSeen: Date;
  profileComplete: boolean;
  verification: ProfileVerification;
  stats: UserStats;
  // Limitation changements d'avatar
  lastAvatarChangeDate?: Date;
  avatarChangesToday?: number;
  // Limitation changements de date de naissance
  lastBirthDateChangeDate?: Date;
  birthDateChangesToday?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GameProfile {
  id: string;
  name: string;
  icon: string;
  platform: string;
  rank?: string;
  playtime: string; // "100h", "500h+", etc.
  role?: string; // "Tank", "DPS", "Support", etc.
  gameMode: string[]; // ["Ranked", "Casual", "Custom"]
  goals: string[]; // ["Fun", "Improve", "Compete", "Discover"]
  skillLevel: 'Beginner' | 'Casual' | 'Intermediate' | 'Advanced' | 'Pro';
  lookingFor: string[]; // ["Duo", "Team", "Coach", "Student"]
  externalProfiles?: { // Steam, Battle.net, etc.
    platform: string;
    username: string;
    verified: boolean;
  }[];
}

interface AvailabilitySlot {
  day: string; // "monday", "tuesday", etc.
  timeSlots: string[]; // ["9h-12h", "18h-21h"]
  timezone: string; // "Europe/Paris"
}

interface GamingStyle {
  personality: string[]; // ["Chill", "Competitive", "Leader", "Follower", "Funny", "Serious"]
  communication: string[]; // ["Voice chat", "Text only", "Discord", "In-game"]
  sessionDuration: string; // "Quick (30min)", "Medium (1-2h)", "Long (2h+)"
  teamwork: 'Solo focused' | 'Team player' | 'Both';
  toxicity: 'Zero tolerance' | 'Low' | 'Moderate';
}

interface UserPreferences {
  ageRange: [number, number];
  maxDistance?: number; // Pour les rencontres IRL optionnelles
  platforms: string[];
  languages: string[];
  preferredGamingStyle: Partial<GamingStyle>;
  notifications: {
    messages: boolean;
    gameInvites: boolean;
    matches: boolean;
    eventReminders: boolean;
  };
  matching: {
    skillLevel: 'Any' | 'Similar' | 'Better only' | 'Worse only';
    sessionTiming: 'Flexible' | 'Strict';
    teamSize: number[]; // [2, 5] pour duo à 5 players
  };
}

interface ProfileVerification {
  emailVerified: boolean;
  phoneVerified: boolean;
  gameAccountsVerified: string[]; // IDs des comptes jeux vérifiés
  photoVerified: boolean;
}

interface UserStats {
  totalGames: number;
  totalPlaytime: string;
  matchesPlayed: number;
  successfulTeamUps: number;
  rating: number; // Note moyenne donnée par les autres joueurs
  badges: string[]; // ["Reliable", "Good teacher", "Positive", etc.]
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  addGame: (game: Partial<GameProfile>) => Promise<boolean>;
  removeGame: (gameId: string) => Promise<boolean>;
  updateAvailability: (availability: AvailabilitySlot[]) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  registerAvatarChangeCallback: (callback: () => void) => () => void;
}

const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  loading: true,
  error: null,
  updateProfile: async () => false,
  addGame: async () => false,
  removeGame: async () => false,
  updateAvailability: async () => false,
  refreshProfile: async () => {},
  registerAvatarChangeCallback: () => () => {},
});

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile doit être utilisé dans un UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Callbacks pour notifier les changements d'avatar
  const avatarChangeCallbacks = useRef<Set<() => void>>(new Set());
  const timeoutRef = useRef<number | null>(null);

  const notifyAvatarChange = useCallback(() => {
    // Nettoyer l'ancien timeout s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer les callbacks après un délai
    timeoutRef.current = setTimeout(() => {
      avatarChangeCallbacks.current.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Erreur callback avatar change:', error);
        }
      });
      timeoutRef.current = null;
    }, 1000);
  }, []); // ✅ Pas de dépendances car on utilise ref

  const registerAvatarChangeCallback = useCallback((callback: () => void) => {
    avatarChangeCallbacks.current.add(callback);
    return () => avatarChangeCallbacks.current.delete(callback);
  }, []);

  // 🧹 Nettoyage du timeout lors du démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // 📖 Écouter les changements du profil en temps réel
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const profileRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            uid: data.uid,
            email: data.email,
            pseudo: data.pseudo || `Gamer_${user.uid.slice(0, 6)}`,
            bio: data.bio,
            age: data.age,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth?.toDate(),
            location: data.location,
            games: data.games || [],
            availability: data.availability || [],
            preferences: data.preferences || getDefaultPreferences(),
            gamingStyle: data.gamingStyle || getDefaultGamingStyle(),
            profilePicture: data.profilePicture,
            isOnline: data.isOnline || false,
            currentlyPlaying: data.currentlyPlaying,
            lastSeen: data.lastSeen?.toDate() || new Date(),
            profileComplete: data.profileComplete || false,
            verification: data.verification || getDefaultVerification(),
            stats: data.stats || getDefaultStats(),
            lastAvatarChangeDate: data.lastAvatarChangeDate?.toDate(),
            avatarChangesToday: data.avatarChangesToday,
            lastBirthDateChangeDate: data.lastBirthDateChangeDate?.toDate(),
            birthDateChangesToday: data.birthDateChangesToday,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
          setError(null);
        } else {
          // Ne pas recréer automatiquement le profil
          // Il sera créé seulement lors de l'inscription ou manuellement
          console.log('👤 Aucun profil trouvé pour cet utilisateur');
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ Erreur écoute profil:', err);
        setError('Erreur lors du chargement du profil');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // 🆕 Créer un profil par défaut
  const createDefaultProfile = async () => {
    if (!user?.uid) return;

    try {
      const defaultProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email || '',
        pseudo: `Gamer_${user.uid.slice(0, 6)}`,
        games: [],
        availability: [],
        preferences: getDefaultPreferences(),
        gamingStyle: getDefaultGamingStyle(),
        isOnline: true,
        profileComplete: false,
        verification: getDefaultVerification(),
        stats: getDefaultStats(),
        lastAvatarChangeDate: new Date(),
        avatarChangesToday: 0,
        lastBirthDateChangeDate: new Date(),
        birthDateChangesToday: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), defaultProfile);
      console.log('✅ Profil gaming par défaut créé');
    } catch (err) {
      console.error('❌ Erreur création profil:', err);
    }
  };

  // 📝 Mettre à jour le profil
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setError(null);
      const profileRef = doc(db, 'users', user.uid);
      
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: new Date(),
      });

      console.log('✅ Profil mis à jour:', Object.keys(updates));

      // 🔄 Si l'avatar a changé, déclencher la synchronisation des conversations
      if (updates.profilePicture !== undefined) {
        console.log('🔄 Avatar changé, notification des conversations...');
        notifyAvatarChange();
      }

      return true;
    } catch (err) {
      console.error('❌ Erreur mise à jour profil:', err);
      setError('Erreur lors de la mise à jour du profil');
      return false;
    }
  };

  // 🎮 Ajouter un jeu
  const addGame = async (gameData: Partial<GameProfile>): Promise<boolean> => {
    if (!user?.uid || !profile) return false;

    try {
      const newGame: GameProfile = {
        id: gameData.id || Date.now().toString(),
        name: gameData.name || '',
        icon: gameData.icon || '🎮',
        platform: gameData.platform || 'PC',
        rank: gameData.rank,
        playtime: gameData.playtime || '0h',
        role: gameData.role,
        gameMode: gameData.gameMode || ['Casual'],
        goals: gameData.goals || ['Fun'],
        skillLevel: gameData.skillLevel || 'Casual',
        lookingFor: gameData.lookingFor || ['Team'],
        externalProfiles: gameData.externalProfiles || [],
      };

      const updatedGames = [...profile.games, newGame];
      return await updateProfile({ games: updatedGames });
    } catch (err) {
      console.error('❌ Erreur ajout jeu:', err);
      return false;
    }
  };

  // 🗑️ Supprimer un jeu
  const removeGame = async (gameId: string): Promise<boolean> => {
    if (!profile) return false;
    
    const updatedGames = profile.games.filter(g => g.id !== gameId);
    return await updateProfile({ games: updatedGames });
  };

  // ⏰ Mettre à jour les disponibilités
  const updateAvailability = async (availability: AvailabilitySlot[]): Promise<boolean> => {
    return await updateProfile({ availability });
  };

  // 🔄 Actualiser le profil manuellement
  const refreshProfile = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const profileRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(profileRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          uid: data.uid,
          email: data.email,
          pseudo: data.pseudo,
          bio: data.bio,
          age: data.age,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth?.toDate(),
          location: data.location,
          games: data.games || [],
          availability: data.availability || [],
          preferences: data.preferences,
          gamingStyle: data.gamingStyle,
          profilePicture: data.profilePicture,
          isOnline: data.isOnline,
          currentlyPlaying: data.currentlyPlaying,
          lastSeen: data.lastSeen?.toDate(),
          profileComplete: data.profileComplete,
          verification: data.verification,
          stats: data.stats,
          lastAvatarChangeDate: data.lastAvatarChangeDate?.toDate(),
          avatarChangesToday: data.avatarChangesToday,
          lastBirthDateChangeDate: data.lastBirthDateChangeDate?.toDate(),
          birthDateChangesToday: data.birthDateChangesToday,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      }
    } catch (err) {
      console.error('❌ Erreur actualisation profil:', err);
      setError('Erreur lors de l\'actualisation');
    } finally {
      setLoading(false);
    }
  };

  const value: UserProfileContextType = {
    profile,
    loading,
    error,
    updateProfile,
    addGame,
    removeGame,
    updateAvailability,
    refreshProfile,
    registerAvatarChangeCallback,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

// 🔧 Fonctions d'aide pour les valeurs par défaut
function getDefaultPreferences(): UserPreferences {
  return {
    ageRange: [18, 35],
    platforms: ['PC', 'PS5', 'Xbox'],
    languages: ['FR'],
    preferredGamingStyle: {
      personality: ['Chill'],
      communication: ['Voice chat'],
      sessionDuration: 'Medium (1-2h)',
      teamwork: 'Team player',
      toxicity: 'Zero tolerance',
    },
    notifications: {
      messages: true,
      gameInvites: true,
      matches: true,
      eventReminders: true,
    },
    matching: {
      skillLevel: 'Similar',
      sessionTiming: 'Flexible',
      teamSize: [2, 5],
    },
  };
}

function getDefaultGamingStyle(): GamingStyle {
  return {
    personality: ['Chill'],
    communication: ['Voice chat'],
    sessionDuration: 'Medium (1-2h)',
    teamwork: 'Team player',
    toxicity: 'Zero tolerance',
  };
}

function getDefaultVerification(): ProfileVerification {
  return {
    emailVerified: false,
    phoneVerified: false,
    gameAccountsVerified: [],
    photoVerified: false,
  };
}

function getDefaultStats(): UserStats {
  return {
    totalGames: 0,
    totalPlaytime: '0h',
    matchesPlayed: 0,
    successfulTeamUps: 0,
    rating: 0,
    badges: [],
  };
} 