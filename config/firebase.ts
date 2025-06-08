import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { enableNetwork, getFirestore } from "firebase/firestore";

// 🔧 Configuration Firebase de votre projet NextMate
const firebaseConfig = {
  apiKey: "AIzaSyDfvbCCTJ83RxMLxRZWGEZ2nvfjvwB2aJs",
  authDomain: "nextmate-96970.firebaseapp.com",
  projectId: "nextmate-96970",
  storageBucket: "nextmate-96970.firebasestorage.app",
  messagingSenderId: "878821081605",
  appId: "1:878821081605:web:d245a75dd55d6948d9526c",
  measurementId: "G-QY7M7L8F6F"
};

// 🚀 Initialisation Firebase (évite la double initialisation)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// 🔐 Auth (simple pour Expo Managed)
export const auth = getAuth(app);

// 🗄️ Firestore avec persistance offline
export const db = getFirestore(app);

// 🛠️ Développement : connection aux émulateurs (optionnel)
if (__DEV__) {
  // Décommente si tu utilises l'émulateur Firebase
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// ✅ Active la persistance Firestore (par défaut sur mobile)
enableNetwork(db).then(() => {
  console.log('🔥 Firebase initialisé avec persistance Firestore offline');
});

export default app; 