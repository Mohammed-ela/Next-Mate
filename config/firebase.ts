import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase de votre projet NextMate
const firebaseConfig = {
  apiKey: "AIzaSyDfvbCCTJ83RxMLxRZWGEZ2nvfjvwB2aJs",
  authDomain: "nextmate-96970.firebaseapp.com",
  projectId: "nextmate-96970",
  storageBucket: "nextmate-96970.firebasestorage.app",
  messagingSenderId: "878821081605",
  appId: "1:878821081605:web:d245a75dd55d6948d9526c",
  measurementId: "G-QY7M7L8F6F"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Auth (simple)
export const auth = getAuth(app);

// Initialiser Firestore
export const db = getFirestore(app);

export default app; 