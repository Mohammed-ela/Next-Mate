// Import des fonctions nécessaires depuis les SDKs Firebase
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase de votre projet
const firebaseConfig = {
  apiKey: "AIzaSyAwZn9tWlLP2d3vo4B0gFvTgNxzj00C_5A",
  authDomain: "nextgame-df741.firebaseapp.com",
  projectId: "nextgame-df741",
  storageBucket: "nextgame-df741.firebasestorage.app",
  messagingSenderId: "178522823190",
  appId: "1:178522823190:web:660e04604fee11f2607337",
  measurementId: "G-07Q4Q7TEG1"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Auth avec AsyncStorage pour la persistance
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialiser Firestore
export const firestore = getFirestore(app);

export default app; 