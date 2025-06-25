import '@testing-library/react-native/extend-expect';

/* eslint-env jest */

// Setup minimal pour Jest

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock des variables d'environnement
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud-name';
process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id'; 