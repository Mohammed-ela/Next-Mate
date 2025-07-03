// 🌍 Variables d'environnement centralisées pour NextMate

// 🔥 Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 🌤️ Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dne82oczq',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'nextmate_preset',
};

// 📱 Google OAuth Configuration
export const GOOGLE_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '369533672786-84t9hgfmrouguqhvrg88b4d0dq9c2p7j.apps.googleusercontent.com',
};

// 🤖 Mistral AI Configuration
export const MISTRAL_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_MISTRAL_API_KEY,
  baseUrl: 'https://api.mistral.ai/v1/chat/completions',
  model: 'mistral-large-latest',
  maxTokens: 1000,
  temperature: 0.7,
};

// 📧 Resend Configuration (API email professionnel)
export const EMAIL_CONFIG = {
  resendApiKey: process.env.EXPO_PUBLIC_RESEND_API_KEY,
  fromEmail: process.env.EXPO_PUBLIC_FROM_EMAIL || 'onboarding@resend.dev',
  toEmail: process.env.EXPO_PUBLIC_TO_EMAIL || 'elamrani.mohammed95@gmail.com',
};

// 🌐 Application URLs
export const APP_URLS = {
  support: process.env.EXPO_PUBLIC_SUPPORT_URL || 'https://www.nextmate.gg/support/date_de_naissance/',
  playStore: process.env.EXPO_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.nextmate.app',
  appStore: process.env.EXPO_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/nextmate/id123456789',
};

// 🔧 Development Configuration
export const DEV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// 🛡️ Validation des variables critiques
const validateRequiredEnvVars = () => {
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_MISTRAL_API_KEY',
    'EXPO_PUBLIC_RESEND_API_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Variables d\'environnement manquantes:', missing);
    console.warn('📋 Copiez .env.example vers .env et configurez les valeurs');
  }
};

// Validation au chargement du module
validateRequiredEnvVars();

export default {
  FIREBASE_CONFIG,
  CLOUDINARY_CONFIG,
  GOOGLE_CONFIG,
  MISTRAL_CONFIG,
  EMAIL_CONFIG,
  APP_URLS,
  DEV_CONFIG,
}; 