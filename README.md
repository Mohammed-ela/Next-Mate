# 🎮 NEXTMATE - BACKEND

### 📁 **Fichiers Backend :**
```
config/firebase.ts          ← Configuration base de données
firestore.rules             ← Règles de sécurité (coté console firebase)
services/userService.ts      ← Logique principale 
services/imageService.ts     ← Gestion images 
scripts/useradd/addTestUsers.ts ← Script test data
```

### 🗄️ **Structure Firebase (Collections) :**
```
📦 nextmate-96970 (projet Firebase)
├── 👤 users/
│   ├── {userId}
│   │   ├── uid: string
│   │   ├── email: string  
│   │   ├── pseudo: string
│   │   ├── bio: string
│   │   ├── age: number
│   │   ├── games: string[]
│   │   ├── availability: string[]
│   │   ├── location: string
│   │   ├── isOnline: boolean
│   │   ├── currentlyPlaying: string
│   │   ├── profileComplete: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   
└── 💬 conversations/
    ├── {conversationId}
    │   ├── participants: string[]
    │   ├── participantDetails: object
    │   ├── gameInCommon: string
    │   ├── createdAt: timestamp
    │   ├── updatedAt: timestamp
    │   └── 📝 messages/ (sous-collection)
    │       ├── {messageId}
    │       │   ├── senderId: string
    │       │   ├── content: string
    │       │   ├── type: 'text'|'system'
    │       │   └── timestamp: timestamp
```

## ⚡ **Comment ça marche :**
- App mobile → Firebase directement (pas de serveur)
- Authentification + Base de données + Règles de sécurité
- Matching d'utilisateurs par jeux en commun

- **Architecture serverless**
pour l'instant
