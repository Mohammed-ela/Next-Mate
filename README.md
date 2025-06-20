# 🎮 NEXTMATE - BACKEND

### 📁 **Fichiers Backend :**
```
config/firebase.ts          ← Configuration base de données
firestore.rules             ← Règles de sécurité (coté console firebase)
services/userService.ts      ← Logique principale 
services/imageService.ts     ← Gestion images 
scripts/useradd/addTestUsers.ts ← Script test data
```

## ⚡ **Comment ça marche :**
- App mobile → Firebase directement (pas de serveur)
- Authentification + Base de données + Règles de sécurité
- Matching d'utilisateurs par jeux en commun

- **Architecture serverless**
pour l'instant
