// Script pour ajouter des utilisateurs de test dans Firestore
// Exécuter avec : npx tsx scripts/addTestUsers.ts

import { initializeApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDocs, getFirestore, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

// Configuration Firebase directe pour le script
const firebaseConfig = {
  apiKey: "AIzaSyDRqvqKQhJG5AQqEYFCe1YPqhcWdlPLUhk",
  authDomain: "nextmate-1b4e5.firebaseapp.com",
  projectId: "nextmate-1b4e5",
  storageBucket: "nextmate-1b4e5.firebasestorage.app",
  messagingSenderId: "1062436906251",
  appId: "1:1062436906251:web:9f0b0b0b0b0b0b0b0b0b0b"
};

// Initialiser Firebase pour ce script
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction pour supprimer manuellement un utilisateur par email
async function deleteUserByEmail(email: string) {
  try {
    console.log('🗑️ Recherche de l\'utilisateur avec email:', email);
    
    // Chercher l'utilisateur par email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      return;
    }
    
    // Supprimer chaque utilisateur trouvé
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`🗑️ Suppression de l'utilisateur ${userData.pseudo} (${userId})`);
      
      // Supprimer les conversations de cet utilisateur
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      console.log(`🗑️ ${conversationsSnapshot.docs.length} conversations à supprimer`);
      
      for (const conversationDoc of conversationsSnapshot.docs) {
        const conversationId = conversationDoc.id;
        
        // Supprimer les messages
        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        for (const messageDoc of messagesSnapshot.docs) {
          await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id));
        }
        
        // Supprimer la conversation
        await deleteDoc(doc(db, 'conversations', conversationId));
        console.log(`✅ Conversation ${conversationId} supprimée`);
      }
      
      // Supprimer le profil utilisateur
      await deleteDoc(doc(db, 'users', userId));
      console.log(`✅ Profil utilisateur ${userId} supprimé`);
    }
    
    console.log('🎉 Nettoyage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le nettoyage pour l'email spécifique
deleteUserByEmail('xiaomi@gmail.com')
  .then(() => {
    console.log('✅ Script de nettoyage terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

// Données de test pour créer des utilisateurs factices
const testUsers = [
  {
    uid: 'test_user_1',
    email: 'alice.gamer@example.com',
    pseudo: 'AliceGamer',
    bio: 'Joueuse passionnée de FPS et MOBA. Toujours prête pour une partie en équipe ! 🎮',
    age: 24,
    gender: 'Femme' as const,
    games: [
      {
        id: '1',
        name: 'Valorant',
        icon: '🎯',
        platform: 'PC',
        rank: 'Platine',
        playtime: '250h',
        role: 'Duelist',
        gameMode: ['Ranked', 'Unrated'],
        goals: ['Improve', 'Compete'],
        skillLevel: 'Advanced' as const,
        lookingFor: ['Duo', 'Team'],
      },
      {
        id: '2',
        name: 'League of Legends',
        icon: '⚔️',
        platform: 'PC',
        rank: 'Or',
        playtime: '400h',
        role: 'ADC',
        gameMode: ['Ranked', 'ARAM'],
        goals: ['Fun', 'Improve'],
        skillLevel: 'Intermediate' as const,
        lookingFor: ['Duo', 'Team'],
      }
    ],
    availability: [
      {
        day: 'monday',
        timeSlots: ['18h-21h', '21h-24h'],
        timezone: 'Europe/Paris'
      },
      {
        day: 'wednesday',
        timeSlots: ['18h-21h'],
        timezone: 'Europe/Paris'
      },
      {
        day: 'saturday',
        timeSlots: ['15h-18h', '18h-21h'],
        timezone: 'Europe/Paris'
      }
    ]
  },
  {
    uid: 'test_user_2',
    email: 'maxime.pro@example.com',
    pseudo: 'MaximePro',
    bio: 'Joueur compétitif, coach Valorant. Je peux t\'aider à progresser ! 💪',
    age: 28,
    gender: 'Homme' as const,
    games: [
      {
        id: '1',
        name: 'Valorant',
        icon: '🎯',
        platform: 'PC',
        rank: 'Immortel',
        playtime: '800h',
        role: 'IGL',
        gameMode: ['Ranked', 'Custom'],
        goals: ['Compete', 'Coach'],
        skillLevel: 'Pro' as const,
        lookingFor: ['Team', 'Student'],
      },
      {
        id: '3',
        name: 'CS2',
        icon: '💥',
        platform: 'PC',
        rank: 'Global Elite',
        playtime: '1200h',
        role: 'AWP',
        gameMode: ['Competitive', 'Faceit'],
        goals: ['Compete'],
        skillLevel: 'Pro' as const,
        lookingFor: ['Team'],
      }
    ],
    availability: [
      {
        day: 'tuesday',
        timeSlots: ['19h-22h'],
        timezone: 'Europe/Paris'
      },
      {
        day: 'thursday',
        timeSlots: ['19h-22h'],
        timezone: 'Europe/Paris'
      },
      {
        day: 'sunday',
        timeSlots: ['14h-17h', '19h-22h'],
        timezone: 'Europe/Paris'
      }
    ]
  },
  {
    uid: 'test_user_3',
    email: 'sarah.chill@example.com',
    pseudo: 'SarahChill',
    bio: 'Gameuse décontractée qui aime découvrir de nouveaux jeux et rencontrer des gens sympas ✨',
    age: 22,
    gender: 'Femme' as const,
    games: [
      {
        id: '4',
        name: 'Apex Legends',
        icon: '🔫',
        platform: 'PS5',
        rank: 'Or',
        playtime: '150h',
        role: 'Support',
        gameMode: ['Ranked', 'Casual'],
        goals: ['Fun', 'Discover'],
        skillLevel: 'Casual' as const,
        lookingFor: ['Duo', 'Team'],
      },
      {
        id: '5',
        name: 'Fortnite',
        icon: '🏗️',
        platform: 'PS5',
        rank: 'Champion',
        playtime: '200h',
        role: 'Builder',
        gameMode: ['Battle Royale', 'Creative'],
        goals: ['Fun'],
        skillLevel: 'Intermediate' as const,
        lookingFor: ['Duo'],
      }
    ],
    availability: [
      {
        day: 'friday',
        timeSlots: ['20h-23h'],
        timezone: 'Europe/Paris'
      },
      {
        day: 'saturday',
        timeSlots: ['16h-19h', '20h-23h'],
        timezone: 'Europe/Paris'
      },
      {
        day: 'sunday',
        timeSlots: ['16h-19h'],
        timezone: 'Europe/Paris'
      }
    ]
  }
];

async function addTestUsers() {
  console.log('🔥 Ajout des utilisateurs de test...');
  
  for (const userData of testUsers) {
    try {
      const userDoc = {
        ...userData,
        profileComplete: true,
        isOnline: Math.random() > 0.5, // 50% de chance d'être en ligne
        lastSeen: new Date(),
        verification: {
          emailVerified: true,
          phoneVerified: false,
          gameAccountsVerified: [],
          photoVerified: false,
        },
        stats: {
          totalGames: userData.games.length,
          totalPlaytime: userData.games.reduce((total, game) => {
            const hours = parseInt(game.playtime.replace('h', ''));
            return total + hours;
          }, 0) + 'h',
          matchesPlayed: Math.floor(Math.random() * 50),
          successfulTeamUps: Math.floor(Math.random() * 30),
          rating: 3.5 + Math.random() * 1.5, // Entre 3.5 et 5
          badges: ['Reliable', 'Good teacher'].slice(0, Math.floor(Math.random() * 3)),
        },
        preferences: {
          ageRange: [18, 35] as [number, number],
          platforms: userData.games.map(g => g.platform),
          languages: ['FR'],
          preferredGamingStyle: {
            personality: ['Chill', 'Competitive'][Math.floor(Math.random() * 2)],
            communication: ['Voice chat'],
            sessionDuration: 'Medium (1-2h)',
            teamwork: 'Team player' as const,
            toxicity: 'Zero tolerance' as const,
          },
          notifications: {
            messages: true,
            gameInvites: true,
            matches: true,
            eventReminders: true,
          },
          matching: {
            skillLevel: 'Similar' as const,
            sessionTiming: 'Flexible' as const,
            teamSize: [2, 5] as [number, number],
          },
        },
        gamingStyle: {
          personality: ['Chill'],
          communication: ['Voice chat'],
          sessionDuration: 'Medium (1-2h)',
          teamwork: 'Team player' as const,
          toxicity: 'Zero tolerance' as const,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userData.uid), userDoc);
      console.log(`✅ Utilisateur ${userData.pseudo} ajouté`);
    } catch (error) {
      console.error(`❌ Erreur ajout ${userData.pseudo}:`, error);
    }
  }
}

// Exécuter le script d'ajout (commenté pour éviter les conflits)
// addTestUsers()
//   .then(() => {
//     console.log('✅ Script d\'ajout terminé');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('❌ Erreur script:', error);
//     process.exit(1);
//   }); 