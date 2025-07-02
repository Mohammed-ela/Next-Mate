import '@testing-library/jest-native/extend-expect';

/* eslint-env jest */

// Setup minimal pour Jest

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn(),
}));

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
  increment: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
);

// Configuration des timeouts
jest.setTimeout(10000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
}); 