// Script pour ajouter des utilisateurs de test dans Firestore
// Exécuter avec : npx tsx scripts/addTestUsers.ts

import { initializeApp } from 'firebase/app';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

// Configuration Firebase directe pour le script
const firebaseConfig = {
  apiKey: "AIzaSyDfvbCCTJ83RxMLxRZWGEZ2nvfjvwB2aJs",
  authDomain: "nextmate-96970.firebaseapp.com",
  projectId: "nextmate-96970",
  storageBucket: "nextmate-96970.firebasestorage.app",
  messagingSenderId: "878821081605",
  appId: "1:878821081605:web:d245a75dd55d6948d9526c",
  measurementId: "G-QY7M7L8F6F"
};

// Initialisation Firebase pour le script
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utilisateurs de test à créer
const testUsers = [
  {
    id: 'test-user-1',
    pseudo: 'ProGamer_Alex',
    email: 'alex@test.com',
    bio: 'Toujours prêt pour une partie ! Expert en FPS 🎯',
    age: 24,
    games: ['Valorant', 'CS2', 'Apex Legends'],
    availability: ['18h-21h', '21h-00h', 'Week-end'],
    location: 'Paris',
    isOnline: true,
    currentlyPlaying: 'Valorant',
    profileComplete: true,
  },
  {
    id: 'test-user-2', 
    pseudo: 'Sarah_FPS',
    email: 'sarah@test.com',
    bio: 'Gaming addict depuis toujours ! Cherche équipe sérieuse 💪',
    age: 22,
    games: ['League of Legends', 'Valorant', 'FIFA'],
    availability: ['15h-18h', '20h-23h'],
    location: 'Lyon',
    isOnline: true,
    currentlyPlaying: 'League of Legends',
    profileComplete: true,
  },
  {
    id: 'test-user-3',
    pseudo: 'Mike_Legend',
    email: 'mike@test.com', 
    bio: 'Pro player en devenir 🏆 Disponible pour du coaching',
    age: 26,
    games: ['CS2', 'Rocket League', 'Fortnite'],
    availability: ['12h-15h', '19h-22h', 'Week-end'],
    location: 'Marseille',
    isOnline: false,
    profileComplete: true,
  },
  {
    id: 'test-user-4',
    pseudo: 'Luna_Gaming',
    email: 'luna@test.com',
    bio: 'Chill gaming et fun garanti 😎 Team player avant tout',
    age: 20,
    games: ['Fortnite', 'Rocket League', 'Overwatch'],
    availability: ['16h-19h', '21h-00h'],
    location: 'Toulouse',
    isOnline: true,
    currentlyPlaying: 'Fortnite',
    profileComplete: true,
  },
  {
    id: 'test-user-5',
    pseudo: 'Zex_Master',
    email: 'zex@test.com',
    bio: 'On fait du ranked ensemble ? Je carry souvent 🚀',
    age: 28,
    games: ['League of Legends', 'Valorant', 'Call of Duty'],
    availability: ['18h-21h', '22h-01h'],
    location: 'Bordeaux', 
    isOnline: true,
    profileComplete: true,
  },
  {
    id: 'test-user-6',
    pseudo: 'Nina_Clutch',
    email: 'nina@test.com',
    bio: 'Spécialiste des clutchs impossibles 🔥 Cherche duo',
    age: 25,
    games: ['CS2', 'Valorant', 'PUBG'],
    availability: ['17h-20h', 'Week-end'],
    location: 'Nice',
    isOnline: false,
    profileComplete: true,
  },
  {
    id: 'test-user-7',
    pseudo: 'Tom_Noob',
    email: 'tom@test.com',
    bio: 'Débutant motivé ! Cherche quelqu\'un pour apprendre 📚',
    age: 19,
    games: ['FIFA', 'Rocket League', 'Fortnite'],
    availability: ['14h-17h', '20h-23h', 'Week-end'],
    location: 'Lille',
    isOnline: true,
    currentlyPlaying: 'FIFA',
    profileComplete: true,
  },
  {
    id: 'test-user-8',
    pseudo: 'Eva_Pro',
    email: 'eva@test.com',
    bio: 'Streameuse et gameuse passionnée 🎬 Let\'s play !',
    age: 23,
    games: ['League of Legends', 'Valorant', 'Apex Legends'],
    availability: ['15h-18h', '21h-00h'],
    location: 'Nantes',
    isOnline: true,
    currentlyPlaying: 'Apex Legends',
    profileComplete: true,
  }
];

// Fonction pour ajouter les utilisateurs
async function addTestUsers() {
  console.log('🚀 Ajout des utilisateurs de test...');
  
  try {
    for (const user of testUsers) {
      const userDoc = {
        uid: user.id,
        email: user.email,
        pseudo: user.pseudo,
        bio: user.bio,
        age: user.age,
        games: user.games,
        availability: user.availability,
        location: user.location,
        isOnline: user.isOnline,
        currentlyPlaying: user.currentlyPlaying,
        profileComplete: user.profileComplete,
        provider: 'test',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        // Champs par défaut pour compatibilité avec UserProfile
        preferences: {
          ageRange: { min: 18, max: 35 },
          maxDistance: 50,
          gameTypes: ['FPS', 'MOBA', 'Battle Royale', 'Sport'],
        },
        gamingStyle: {
          competitive: true,
          casual: true,
          teamPlayer: true,
          soloPlayer: false,
        },
        verification: {
          emailVerified: true,
          phoneVerified: false,
          profileVerified: false,
        },
        stats: {
          totalMatches: Math.floor(Math.random() * 100),
          totalWins: Math.floor(Math.random() * 50),
          averageRating: 3.5 + Math.random() * 1.5,
        }
      };

      await setDoc(doc(db, 'users', user.id), userDoc);
      console.log(`✅ Utilisateur créé: ${user.pseudo}`);
    }

    console.log('🎉 Tous les utilisateurs de test ont été ajoutés !');
    console.log(`📊 Total: ${testUsers.length} utilisateurs`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des utilisateurs:', error);
  }
}

// Exécuter le script
addTestUsers()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur script:', error);
    process.exit(1);
  }); 