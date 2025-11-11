import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

type FirebaseEnvKey =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_STORAGE_BUCKET"
  | "VITE_FIREBASE_MESSAGING_SENDER_ID"
  | "VITE_FIREBASE_APP_ID"
  | "VITE_FIREBASE_MEASUREMENT_ID";

const REQUIRED_KEYS: FirebaseEnvKey[] = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID", true),
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);
const googleAuthProvider = new GoogleAuthProvider();

/**
 * Returns the shared Firebase app instance configured from Vite env variables.
 */
export function getFirebaseApp(): FirebaseApp {
  return app;
}

/**
 * Exposes the singleton Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth {
  return auth;
}

/**
 * Exposes Firebase Storage for binary backup uploads.
 */
export function getFirebaseStorage(): FirebaseStorage {
  return storage;
}

/**
 * Shared Google auth provider for Drive/Identity flows.
 */
export function getGoogleAuthProvider(): GoogleAuthProvider {
  return googleAuthProvider;
}

function readEnv(key: FirebaseEnvKey, optional = false): string | undefined {
  const value = import.meta.env[key];
  if (!value) {
    if (!optional && REQUIRED_KEYS.includes(key)) {
      throw new Error(
        `Missing Firebase environment variable "${key}". Add it to your .env file.`
      );
    }
    return undefined;
  }
  return value;
}
