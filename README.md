# 🎮 NextMate - Application Mobile Gaming

NextMate est une application mobile React Native/Expo qui permet aux gamers de trouver des coéquipiers compatibles selon leurs jeux, disponibilités et styles de jeu.

## 🚀 Fonctionnalités Implémentées

### ✅ Authentification
- Connexion/inscription avec Firebase Auth
- Récupération de mot de passe
- Gestion des sessions utilisateur

### ✅ Onboarding
- Introduction interactive en 3 slides
- Configuration du premier lancement

### ✅ Profil Utilisateur Complet
- Pseudo personnalisable (1x/semaine max)
- Bio personnalisée
- Avatar avec galerie/caméra
- Date de naissance et âge
- Sélection de genre
- Liste de jeux favoris avec rangs
- Styles de jeu (Casual, Compétitif, etc.)
- Créneaux de disponibilité

### ✅ Système de Matching
- Algorithme de compatibilité basé sur :
  - Jeux en commun
  - Disponibilités similaires
  - Styles de jeu compatibles
- Service IA avec Mistral pour suggestions

### ✅ Conversations & Chat
- Liste des conversations temps réel
- Chat individuel avec historique
- Badges de notifications
- Synchronisation offline/online
- Gestion des messages non lus

### ✅ Découverte
- Système de cartes utilisateurs
- Filtres par jeux et critères
- Interface swipe pour matching

### ✅ Services Complets
- Gestion d'images (Cloudinary)
- Notifications push
- Mode offline
- Blocage d'utilisateurs
- Audit et logging
- Configuration centralisée

## 📋 Prérequis

- **Node.js** 18+ 
- **npm** ou **pnpm**
- **Expo CLI** : `npm install -g @expo/cli`
- **Compte Firebase** (Firestore + Authentication)
- **Compte Cloudinary** (gestion images)
- **API Key Mistral AI** (matching intelligent)
- **Compte Resend** (emails de support)

## ⚙️ Installation

### 1. Cloner et installer les dépendances
```bash
git clone <votre-repo>
cd NextMate
npm install
# ou avec pnpm
pnpm install
```

### 2. Configuration Firebase

1. Créer un projet Firebase avec :
   - **Firestore Database** (mode production)
   - **Authentication** (Email/Password activé)
   
2. Copier les clés Firebase depuis la console

### 3. Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Firebase Configuration (OBLIGATOIRE)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Mistral AI pour le matching intelligent (OBLIGATOIRE)
EXPO_PUBLIC_MISTRAL_API_KEY=your_mistral_api_key

# Resend pour les emails de support (OBLIGATOIRE)
EXPO_PUBLIC_RESEND_API_KEY=your_resend_api_key
EXPO_PUBLIC_FROM_EMAIL=onboarding@yourdomain.com
EXPO_PUBLIC_TO_EMAIL=support@yourdomain.com

# Cloudinary pour les images (OPTIONNEL - valeurs par défaut disponibles)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Google OAuth (OPTIONNEL - valeur par défaut disponible)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# URLs de support (OPTIONNEL - valeurs par défaut disponibles)
EXPO_PUBLIC_SUPPORT_URL=https://yourwebsite.com/support
EXPO_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=your.app
EXPO_PUBLIC_APP_STORE_URL=https://apps.apple.com/app/yourapp/id123456789
```

### 4. Configuration Firestore

Votre base de données Firestore doit avoir ces collections :
- `users` - Profils utilisateurs
- `conversations` - Conversations et messages
- `gameConfig` - Configuration des jeux disponibles
- `matches` - Historique des matchs
- `audit` - Logs d'audit

## 🚀 Lancement de l'Application

### Développement
```bash
# Démarrer le serveur Expo
npm start
# ou
expo start

# Sur simulateur iOS
npm run ios

# Sur émulateur Android  
npm run android

# Dans le navigateur web
npm run web
```

### Production
```bash
# Build pour Android
expo build:android

# Build pour iOS
expo build:ios
```

## 📱 Structure de Navigation

```
NextMate/
├── Onboarding (premier lancement)
├── Auth/
│   ├── Connexion
│   ├── Inscription  
│   └── Mot de passe oublié
└── App Principal/
    ├── Home (profil utilisateur)
    ├── Découverte (cartes utilisateurs)
    ├── Matching IA (suggestions intelligentes)
    ├── Conversations (chat)
    ├── Paramètres
    └── Chat individuel
```

## 🎯 Écrans Principaux

### 🏠 **Home** (`app/(tabs)/index.tsx`)
- Profil utilisateur complet et éditable
- Gestion des jeux favoris avec rangs
- Configuration des disponibilités
- Paramètres de compte

### 🔍 **Découverte** (`app/(tabs)/trouve1mate.tsx`) 
- Interface de cartes d'utilisateurs
- Filtres par jeux et critères
- Système de matching

### 🤖 **Matching IA** (`app/(tabs)/ai-matching.tsx`)
- Suggestions intelligentes via Mistral AI
- Analyse de compatibilité avancée
- Recommandations personnalisées

### 💬 **Conversations** (`app/(tabs)/conversations.tsx`)
- Liste des conversations actives
- Badges de notifications
- Recherche de conversations

### ⚙️ **Paramètres** (`app/(tabs)/parametres.tsx`)
- Configuration de l'application
- Gestion du compte
- Support et aide

## 🧪 Tests

L'application inclut 24 tests basiques :

```bash
# Lancer tous les tests
npm test
```

## 📦 Services Disponibles

- **`userService.ts`** - Gestion des profils utilisateurs
- **`aiMatchingService.ts`** - Algorithmes de matching IA
- **`messagesService.ts`** - Chat et conversations
- **`imageService.ts`** - Upload et gestion d'images
- **`notificationService.ts`** - Notifications push
- **`offlineService.ts`** - Synchronisation offline
- **`blockingService.ts`** - Blocage d'utilisateurs
- **`auditService.ts`** - Logging et audit

## 🔧 Technologies Utilisées

- **React Native** 0.79.2
- **Expo** ~53.0.9  
- **Firebase** 11.8.1 (Auth + Firestore)
- **TypeScript** 5.8.3
- **Expo Router** 5.0.7 (navigation)
- **React Native Reanimated** 3.17.4 (animations)
- **Mistral AI** (intelligence artificielle)
- **Cloudinary** (gestion d'images)

## 🐛 Dépannage

### Problèmes courants :

1. **Erreur Firebase** : Vérifiez vos clés dans `.env`
2. **Erreur Mistral AI** : Vérifiez votre API key Mistral
3. **Images non chargées** : Configurez Cloudinary
4. **Build failed** : Nettoyez le cache Expo : `expo r -c`


## 📞 Support

L'application inclut un système de support intégré accessible via les paramètres, avec envoi d'emails automatique via Resend.

---
