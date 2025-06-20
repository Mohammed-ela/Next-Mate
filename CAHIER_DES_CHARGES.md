# 📋 CAHIER DES CHARGES - NEXTMATE

## 🎯 **PRÉSENTATION GÉNÉRALE**

**NextMate** est une application mobile de rencontres spécialisée pour les gamers, développée avec React Native/Expo et Firebase. L'application permet aux joueurs de se connecter selon leurs jeux en commun, créer des profils gaming détaillés et communiquer via un système de chat temps réel.

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Stack Technologique**
- **Frontend** : React Native + Expo SDK
- **Backend** : Firebase (BaaS - Backend as a Service)
- **Base de données** : Firestore NoSQL
- **Authentification** : Firebase Auth (Email/Password + Google OAuth)
- **Navigation** : Expo Router (file-based routing)
- **Stockage images** : Local + préparation Cloudinary
- **État global** : Context API React

### **Structure de l'application**
```
app/
├── (auth)/          ← Écrans d'authentification
├── (tabs)/          ← Navigation principale (4 onglets)
├── chat/[id].tsx    ← Chat individuel dynamique
└── _layout.tsx      ← Layout racine avec guards
```

---

## 📱 **FONCTIONNALITÉS IMPLÉMENTÉES**

### **🔐 AUTHENTIFICATION**
- **Inscription** avec email/password + pseudo
- **Connexion** avec mémorisation optionnelle
- **Connexion Google** (bouton dédié)
- **Mot de passe oublié** (page dédiée)
- **Déconnexion** sécurisée
- **Protection des routes** avec AuthGuard

### **👤 GESTION DE PROFIL** 
- **Profil gaming complet** avec :
  - Pseudo (modifiable)
  - Bio personnalisée (modifiable)
  - Date de naissance avec calcul d'âge automatique
  - Genre (Homme/Femme/Autre)
  - Avatar local avec limitation (2 changements/jour)
  - Statut en ligne/hors ligne
  - Jeu actuellement joué

- **Gestion des jeux** :
  - Ajout de jeux populaires (Valorant, LoL, FIFA, etc.)
  - Rang par jeu (Fer, Bronze, Or, etc.)
  - Style de jeu (Chill, Tryhard, Competitive)
  - Suppression de jeux
  - Modification des détails par jeu

- **Disponibilités** :
  - Créneaux horaires personnalisables
  - Gestion par jour de la semaine
  - Interface toggle simple

### **🔍 DÉCOUVERTE D'UTILISATEURS**
- **Page "Trouver"** avec :
  - **Algorithme de matching** basé sur les jeux en commun
  - **Pourcentage de compatibilité** calculé automatiquement
  - **Cartes utilisateurs** avec avatar, bio, jeux, âge
  - **Statut en ligne** temps réel
  - **Jeu actuellement joué** affiché
  - **Localisation** (ville)
  - **Système de fallback** en cas d'erreur réseau

- **Actions disponibles** :
  - Voir le profil détaillé (popup)
  - Se connecter directement (création conversation)
  - Refresh de la liste

### **💬 SYSTÈME DE CHAT**
- **Liste des conversations** avec :
  - Aperçu du dernier message
  - Timestamp intelligent (min/h/j)
  - Statut en ligne des participants
  - Jeu en commun affiché
  - Badge de messages non lus
  - Recherche par nom
  - Suppression de conversations

- **Chat individuel** avec :
  - **Messages temps réel** (Firestore)
  - **Messages système** automatiques
  - **Invitations de jeu** (bouton dédié)
  - **Gestion du clavier** Android/iOS
  - **Auto-scroll** intelligent
  - **Horodatage** des messages
  - **Avatar** et statut du participant
  - **Interface responsive** (hauteur input dynamique)

### **⚙️ PARAMÈTRES**
- **Thème** : Mode sombre/clair avec switch
- **Notifications** : Activation/désactivation
- **Confidentialité** : Accès politique et CGU
- **Support** : Centre d'aide et contact
- **Compte** : Suppression avec confirmation double
- **Utilisateurs bloqués** (préparé)

### **🎨 INTERFACE UTILISATEUR**
- **Design cohérent** avec gradient violet/orange NextMate
- **Thème adaptatif** (sombre/clair)
- **Icons Ionicons** partout
- **Animations** avec LinearGradient
- **Safe Area** compatible iOS/Android
- **Loading states** et error handling
- **Toasts** informatifs pour le feedback utilisateur

---

## 🗄️ **BASE DE DONNÉES FIRESTORE**

### **Collection `users/`**
```javascript
{
  uid: string,
  email: string,
  pseudo: string,
  bio?: string,
  age?: number,
  games: string[],                    // Jeux favoris
  availability: string[],             // Créneaux horaires
  location?: string,                  // Ville
  isOnline: boolean,                  // Statut
  currentlyPlaying?: string,          // Jeu actuel
  profileComplete: boolean,           // Profil fini
  profilePicture?: string,            // Avatar
  lastAvatarChangeDate?: timestamp,   // Limitation
  avatarChangesToday?: number,        // Compteur
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **Collection `conversations/`**
```javascript
{
  participants: string[],             // UIDs des 2 utilisateurs
  participantDetails: {               // Détails cached
    [uid]: {
      name: string,
      avatar: string,
      isOnline: boolean,
      currentGame?: string
    }
  },
  gameInCommon?: string,              // Jeu partagé
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Sous-collection messages/
  messages: {
    senderId: string,
    content: string,
    type: 'text' | 'system' | 'game_invite',
    timestamp: timestamp
  }
}
```

---

## 🔒 **SÉCURITÉ FIRESTORE**

### **firestore.rules** 
- **Authentification obligatoire** pour toute opération
- **Règles temporaires** en développement (accès total si connecté)
- **Règles de production** préparées et commentées :
  - Utilisateurs : accès CRUD limité à son propre profil
  - Conversations : accès si participant seulement
  - Messages : lecture si participant, écriture si expéditeur

---

## 🚀 **SERVICES BACKEND**

### **userService.ts** (217 lignes)
- **`getDiscoveryUsers()`** : Découverte avec matching intelligent
- **`calculateMatchPercentage()`** : Algorithme de compatibilité
- **`searchUsers()`** : Recherche par nom/jeu
- **`generateFallbackUsers()`** : Données de secours
- Gestion avatars emojis + images
- Système de fallback robuste

### **imageService.ts** (174 lignes)  
- **Gestion locale** des avatars uniquement
- **Détection automatique** emoji vs image
- **Interface préparée** pour migration cloud
- **Fallback** intelligent en cas d'erreur
- **Limitation** des changements d'avatar

### **Contextes React**
- **AuthContext** : Authentification complète
- **UserProfileContext** : Profil utilisateur temps réel
- **ConversationsContext** : Liste conversations
- **MessagesContext** : Chat temps réel
- **ThemeContext** : Gestion thème sombre/clair

---

## 📊 **STATISTIQUES PROJET**

- **4 écrans principaux** (Accueil, Trouver, Chat, Paramètres)
- **3 écrans d'authentification** (Login, Register, Forgot)
- **1 écran de chat** dynamique
- **5 contextes** React pour l'état global
- **3 services** backend métier
- **670 lignes** de code backend
- **~3000 lignes** de code total estimé
- **Architecture 100% serverless**

---

## 🎯 **FONCTIONNALITÉS CIBLES**

### **✅ Implémenté et fonctionnel**
- Authentification complète
- Profils gaming détaillés
- Découverte d'utilisateurs avec matching
- Chat temps réel complet
- Thème adaptatif
- Base de données structurée

### **🚧 Préparé mais non utilisé**
- Service Cloudinary (code présent, non activé)
- Firebase Storage (configuré, non utilisé)
- Backend Node.js/Hono (dossier séparé)

### **💡 Extensions possibles**
- Géolocalisation réelle
- Notifications push
- Appels vidéo gaming
- Système de reviews
- Événements gaming
- Intégration APIs de jeux

---

## 🎮 **SPÉCIFICITÉS GAMING**

### **Jeux supportés**
- Valorant, League of Legends, CS2
- FIFA 24, Fortnite, Apex Legends
- Rocket League, Call of Duty
- Système extensible

### **Algorithme de matching**
- **Jeux en commun** : priorité absolue
- **Calcul pourcentage** : 20% par jeu commun + bonus
- **Fallback intelligent** : jeux populaires par défaut
- **Tri automatique** par compatibilité

### **Features gaming**
- **Statut en jeu** temps réel
- **Invitations de partie** dans le chat
- **Rangs** par jeu
- **Styles de jeu** (Chill/Tryhard/Competitive)
- **Disponibilités** par créneaux

---

## 🏆 **POINTS FORTS**

1. **Architecture moderne** serverless Firebase
2. **Code TypeScript** robuste et typé
3. **Interface utilisateur** soignée et responsive  
4. **Chat temps réel** performant
5. **Matching intelligent** par jeux
6. **Gestion d'erreurs** complète
7. **Performance** optimisée (lazy loading, cache)
8. **Sécurité** Firebase rules

---

*Cahier des charges basé sur l'analyse du code source NextMate - État au moment de l'analyse* 