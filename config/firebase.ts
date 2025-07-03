import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { enableNetwork, getFirestore } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../constants/Environment";

// 🔧 Configuration Firebase de votre projet NextMate
const firebaseConfig = FIREBASE_CONFIG;

// 🚀 Initialisation Firebase (évite la double initialisation)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// 🔐 Auth (simple et fonctionnel)
export const auth = getAuth(app);

// 🗄️ Firestore avec persistance offline
export const db = getFirestore(app);

// 🛠️ Développement : connection aux émulateurs (optionnel)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // Décommente si tu utilises l'émulateur Firebase
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// ✅ Active la persistance Firestore (par défaut sur mobile)
enableNetwork(db).then(() => {
  console.log('🔥 Firebase initialisé avec persistance Firestore offline');
});

export default app; 